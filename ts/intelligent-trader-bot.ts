#!/usr/bin/env node --experimental-strip-types

/**
 * Intelligent Trader Bot for Space Trader
 * 
 * Strategy:
 * 1. Buy a random good
 * 2. Travel to a nearby system 
 * 3. Sell the random good
 * 4. Refuel
 * 5. Repeat
 * 
 * Combat Strategy:
 * - If encounters combat during travel, attack until opponent is destroyed
 */

import { createGameEngine } from './engine/game.ts';
import { GameMode, TradeItem } from './types.ts';
import { getSolarSystemName } from './data/systems.ts';
import { getTradeItems } from './data/tradeItems.ts';
import { enableActionLogging, enableAllDebug, disableDebug, applyEnvDebugConfig } from './debug.ts';
import { checkGameEndConditions, type EndGameResult } from './game/endings.ts';
import { getAllSystemPrices } from './economy/pricing.ts';

interface TradingSession {
  startTime: number;
  endTime?: number;
  totalActions: number;
  totalTrades: number;
  totalCombats: number;
  startingCredits: number;
  currentCredits: number;
  profit: number;
  isActive: boolean;
  gameOver?: boolean;
  endCondition?: EndGameResult;
}

export class IntelligentTraderBot {
  private engine: any;
  private session: TradingSession;
  private verbose: boolean;
  private maxActions: number;

  constructor(verbose: boolean = false, maxActions: number = 1000, debugActions: boolean = false) {
    this.engine = createGameEngine();
    this.verbose = verbose;
    this.maxActions = maxActions;
    
    // Apply environment debug configuration
    applyEnvDebugConfig(this.engine.state);
    
    // Enable action debug logging if requested
    if (debugActions || process.env.ST_DEBUG_ACTIONS === 'true') {
      enableActionLogging(this.engine.state);
    }
    
    // Enable all debug logging if ST_DEBUG is set
    if (process.env.ST_DEBUG === 'true') {
      enableAllDebug(this.engine.state);
    }
    
    this.session = {
      startTime: Date.now(),
      totalActions: 0,
      totalTrades: 0,
      totalCombats: 0,
      startingCredits: this.engine.state.credits,
      currentCredits: this.engine.state.credits,
      profit: 0,
      isActive: true
    };

    if (this.verbose) {
      console.log('🤖 Intelligent Trader Bot initialized');
      console.log(`📍 Starting location: ${getSolarSystemName(this.engine.state.currentSystem)}`);
      console.log(`💰 Starting credits: ${this.session.startingCredits}`);
      
      if (this.engine.state.debug?.enabled) {
        console.log('🔍 Debug logging enabled:', Object.entries(this.engine.state.debug.log)
          .filter(([_, enabled]) => enabled)
          .map(([key, _]) => key)
          .join(', ') || 'none'
        );
      }
    }
  }

  /**
   * Run the trading bot until stopped or max actions reached
   */
  async run(): Promise<TradingSession> {
    while (this.session.isActive && this.session.totalActions < this.maxActions) {
      try {
        // Check for game over conditions
        const gameEndCondition = checkGameEndConditions(this.engine.state);
        if (gameEndCondition?.isGameOver) {
          if (this.verbose) {
            console.log(`🎬 Game Over: ${gameEndCondition.message}`);
            console.log(`📊 End Status: ${this.getEndStatusName(gameEndCondition.endStatus)}`);
          }
          this.session.gameOver = true;
          this.session.endCondition = gameEndCondition;
          break;
        }

        // Ensure we're on a planet to start trading cycle
        await this.ensureOnPlanet();
        
        // 1. Buy a random good
        await this.buyRandomGood();
        
        // 2. Travel to a nearby system
        await this.travelToNearbySystem();
        
        // 3. Sell the good we bought
        await this.sellGoods();
        
        // 4. Refuel if needed
        await this.refuelIfNeeded();
        
        // Update session stats
        this.updateSessionStats();
        
        // Log progress occasionally
        if (this.verbose && this.session.totalActions % 20 === 0) {
          this.logProgress();
        }
        
      } catch (error) {
        if (this.verbose) {
          console.log(`❌ Error in trading loop: ${error}`);
        }
        break;
      }
    }

    this.finalizeSession();
    return this.session;
  }

  /**
   * Ensure we're docked at a planet for trading
   */
  private async ensureOnPlanet(): Promise<void> {
    if (this.engine.state.currentMode === GameMode.InSpace) {
      const dockAction = await this.engine.executeAction({
        type: 'dock_at_planet',
        parameters: {}
      });
      
      this.session.totalActions++;
      
      if (this.verbose && !dockAction.success) {
        console.log('⚠️ Failed to dock at planet:', dockAction.message);
      }
    }
  }

  /**
   * Buy a random trade good that we can afford
   */
  private async buyRandomGood(): Promise<void> {
    const tradeItems = getTradeItems();
    const totalCargo = this.engine.state.ship.cargo.reduce((sum: number, qty: number) => sum + qty, 0);
    const shipType = this.engine.state.ship.type;
    const maxCargo = [0, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80][shipType] || 15; // Cargo capacities by ship type
    
    if (totalCargo >= maxCargo) {
      if (this.verbose) {
        console.log('⚠️ Cargo hold full - cannot buy more goods');
      }
      return;
    }

    // Get current market prices
    const currentSystem = this.engine.state.solarSystem[this.engine.state.currentSystem];
    const prices = getAllSystemPrices(
      currentSystem, 
      this.engine.state.commanderTrader, 
      this.engine.state.policeRecordScore
    );

    // Find items we can actually afford
    const availableItems = [];
    const currentCredits = this.engine.state.credits;
    const availableCargoSpace = maxCargo - totalCargo;

    for (let i = 0; i < prices.length; i++) {
      const buyPrice = prices[i].buyPrice;
      
      // Skip if item not available (buyPrice = 0) or we can't afford even 1 unit
      if (buyPrice > 0 && buyPrice <= currentCredits) {
        const maxAffordable = Math.floor(currentCredits / buyPrice);
        const quantity = Math.min(3, availableCargoSpace, maxAffordable); // Buy up to 3 units
        
        if (quantity > 0) {
          availableItems.push({
            itemIndex: i,
            quantity: quantity,
            totalCost: buyPrice * quantity,
            unitPrice: buyPrice,
            itemName: tradeItems[i].name
          });
        }
      }
    }

    if (availableItems.length === 0) {
      if (this.verbose) {
        console.log('⚠️ No affordable items available at this system');
      }
      return;
    }

    // Pick a random affordable item
    const randomChoice = availableItems[Math.floor(Math.random() * availableItems.length)];
    
    const buyResult = await this.engine.executeAction({
      type: 'buy_cargo',
      parameters: {
        tradeItem: randomChoice.itemIndex,
        quantity: randomChoice.quantity
      }
    });

    this.session.totalActions++;
    
    if (buyResult.success) {
      this.session.totalTrades++;
      if (this.verbose) {
        console.log(`🛒 Bought ${randomChoice.quantity} units of ${randomChoice.itemName} for ${randomChoice.totalCost} credits`);
      }
    } else if (this.verbose) {
      console.log(`❌ Failed to buy ${randomChoice.itemName}: ${buyResult.message}`);
    }
  }

  /**
   * Travel to a nearby system within fuel range
   */
  private async travelToNearbySystem(): Promise<void> {
    // Launch into space first
    if (this.engine.state.currentMode === GameMode.OnPlanet) {
      const launchResult = await this.engine.executeAction({
        type: 'launch_ship',
        parameters: {}
      });
      this.session.totalActions++;

      if (!launchResult.success) {
        if (this.verbose) {
          console.log(`❌ Failed to launch: ${launchResult.message}`);
        }
        return;
      }
    }

    // Get available warp actions from the engine
    const availableActions = this.engine.getAvailableActions();
    const warpActions = availableActions.filter((action: any) => action.type === 'warp_to_system');
    
    if (warpActions.length === 0) {
      if (this.verbose) {
        console.log('⚠️ No systems within range - need to refuel first');
      }
      await this.refuelIfNeeded();
      return;
    }

    // Pick a random destination from available warp actions
    const warpAction = warpActions[Math.floor(Math.random() * warpActions.length)];
    const possibleSystems = warpAction.parameters?.possibleSystems;
    
    if (!possibleSystems || possibleSystems.length === 0) {
      if (this.verbose) {
        console.log('⚠️ No possible systems in warp action');
      }
      return;
    }

    // Pick a random system from the possible systems
    const targetSystem = possibleSystems[Math.floor(Math.random() * possibleSystems.length)];

    if (this.verbose) {
      console.log(`🚀 Traveling to ${getSolarSystemName(targetSystem)}`);
    }

    // Execute warp
    const warpResult = await this.engine.executeAction({
      type: 'warp_to_system',
      parameters: {
        targetSystem: targetSystem
      }
    });
    this.session.totalActions++;

    if (warpResult.success) {
      if (this.verbose) {
        console.log(`✅ Successfully warped to ${getSolarSystemName(targetSystem)}`);
      }
      
      // Handle any combat encounters during travel
      await this.handleCombatIfNeeded();
      
      // Ensure we dock at destination after travel/combat
      await this.ensureOnPlanet();
      
    } else {
      if (this.verbose) {
        console.log(`❌ Warp failed: ${warpResult.message} - staying local`);
      }
      // If warp fails, dock back at planet for local trading
      await this.ensureOnPlanet();
    }
  }

  /**
   * Handle combat encounters - attack until opponent is destroyed
   */
  private async handleCombatIfNeeded(): Promise<void> {
    let combatRounds = 0;
    const maxCombatRounds = 50; // Safety limit to prevent infinite combat
    
    while (this.engine.state.currentMode === GameMode.InCombat && combatRounds < maxCombatRounds) {
      this.session.totalCombats++;
      combatRounds++;
      
      if (this.verbose) {
        console.log(`⚔️ Combat round ${combatRounds} - attacking opponent`);
      }

      const attackResult = await this.engine.executeAction({
        type: 'combat_attack',
        parameters: {}
      });
      
      this.session.totalActions++;

      if (this.verbose && attackResult.success) {
        console.log(`✅ Attack result: ${attackResult.message}`);
      }

      if (!attackResult.success) {
        // If attack failed, try to flee as backup
        if (this.verbose) {
          console.log('⚠️ Attack failed, attempting to flee');
        }
        
        const fleeResult = await this.engine.executeAction({
          type: 'combat_flee',
          parameters: {}
        });
        this.session.totalActions++;
        
        if (fleeResult.success) {
          if (this.verbose) {
            console.log('✅ Successfully fled from combat');
          }
          break;
        } else if (this.verbose) {
          console.log('❌ Failed to flee');
        }
      }

      // Safety check to prevent infinite loops
      if (this.session.totalActions >= this.maxActions) {
        if (this.verbose) {
          console.log('⚠️ Reached max actions during combat');
        }
        break;
      }
    }

    if (combatRounds >= maxCombatRounds && this.verbose) {
      console.log('⚠️ Combat timeout reached - forcing exit');
    }

    if (this.engine.state.currentMode !== GameMode.InCombat && this.verbose && combatRounds > 0) {
      console.log('✅ Combat resolved after', combatRounds, 'rounds');
    }
  }

  /**
   * Sell goods we're carrying to make profit
   */
  private async sellGoods(): Promise<void> {
    await this.ensureOnPlanet();
    
    // Try to sell each type of cargo we have
    for (let i = 0; i < this.engine.state.ship.cargo.length; i++) {
      const quantity = this.engine.state.ship.cargo[i];
      if (quantity > 0) {
        const sellResult = await this.engine.executeAction({
          type: 'sell_cargo',
          parameters: {
            tradeItem: i,
            quantity: quantity
          }
        });

        this.session.totalActions++;

        if (sellResult.success) {
          this.session.totalTrades++;
          if (this.verbose) {
            const tradeItems = getTradeItems();
            const itemName = tradeItems[i].name;
            console.log(`💰 Sold ${quantity} units of ${itemName}`);
          }
        } else if (this.verbose && quantity > 0) {
          console.log(`❌ Failed to sell cargo: ${sellResult.message}`);
        }
      }
    }
  }

  /**
   * Refuel ship if fuel is low
   */
  private async refuelIfNeeded(): Promise<void> {
    const currentFuel = this.engine.state.ship.fuel;
    const shipType = this.engine.state.ship.type;
    const maxFuel = [0, 14, 15, 16, 17, 18, 19, 20, 22, 28, 30][shipType] || 14; // Fuel capacity by ship type

    // Refuel if we're below 50% capacity
    if (currentFuel < maxFuel * 0.5) {
      await this.ensureOnPlanet();
      
      const refuelResult = await this.engine.executeAction({
        type: 'refuel_ship',
        parameters: {}
      });

      this.session.totalActions++;

      if (refuelResult.success && this.verbose) {
        console.log(`⛽ Refueled ship (${currentFuel} → ${this.engine.state.ship.fuel})`);
      } else if (this.verbose) {
        console.log(`❌ Refuel failed: ${refuelResult.message}`);
      }
    }
  }

  /**
   * Update session statistics
   */
  private updateSessionStats(): void {
    this.session.currentCredits = this.engine.state.credits;
    this.session.profit = this.session.currentCredits - this.session.startingCredits;
  }

  /**
   * Log current progress
   */
  private logProgress(): void {
    console.log(`\n📊 Trading Progress (Actions: ${this.session.totalActions})`);
    console.log(`📍 Current location: ${getSolarSystemName(this.engine.state.currentSystem)}`);
    console.log(`💰 Credits: ${this.session.currentCredits} (${this.session.profit >= 0 ? '+' : ''}${this.session.profit})`);
    console.log(`🛒 Trades completed: ${this.session.totalTrades}`);
    console.log(`⚔️ Combats fought: ${this.session.totalCombats}`);
    console.log(`📦 Current cargo: [${this.engine.state.ship.cargo.join(', ')}]`);
    console.log(`⛽ Fuel: ${this.engine.state.ship.fuel}`);
  }

  /**
   * Finalize the trading session
   */
  private finalizeSession(): void {
    this.session.endTime = Date.now();
    this.session.isActive = false;
    
    const durationSec = (this.session.endTime - this.session.startTime) / 1000;
    
    console.log(`\n🏁 Trading Session Complete!`);
    console.log(`⏱️ Duration: ${durationSec.toFixed(1)} seconds`);
    console.log(`🎯 Total Actions: ${this.session.totalActions}`);
    console.log(`🛒 Total Trades: ${this.session.totalTrades}`);
    console.log(`⚔️ Total Combats: ${this.session.totalCombats}`);
    console.log(`💰 Starting Credits: ${this.session.startingCredits}`);
    console.log(`💰 Final Credits: ${this.session.currentCredits}`);
    console.log(`📈 Net Profit: ${this.session.profit >= 0 ? '+' : ''}${this.session.profit} credits`);
    console.log(`📍 Final Location: ${getSolarSystemName(this.engine.state.currentSystem)}`);
    
    if (this.session.gameOver && this.session.endCondition) {
      console.log(`🎬 Game Ended: ${this.session.endCondition.message}`);
      console.log(`📊 End Condition: ${this.getEndStatusName(this.session.endCondition.endStatus)}`);
      console.log(`🏆 Final Score: ${this.session.endCondition.finalScore}`);
      console.log(`💎 Final Worth: ${this.session.endCondition.finalWorth}`);
    } else if (this.session.totalActions >= this.maxActions) {
      console.log(`⏱️ Stopped: Reached maximum action limit (${this.maxActions})`);
    } else {
      console.log(`⏹️ Stopped: Manual termination`);
    }
    
    if (this.session.totalTrades > 0) {
      const profitPerTrade = this.session.profit / this.session.totalTrades;
      console.log(`💡 Average Profit per Trade: ${profitPerTrade.toFixed(2)} credits`);
    }
  }

  /**
   * Stop the trading bot
   */
  stop(): void {
    this.session.isActive = false;
    if (this.verbose) {
      console.log('🛑 Trading bot stopped');
    }
  }

  /**
   * Get current session stats
   */
  getStats(): TradingSession {
    return { ...this.session };
  }

  /**
   * Get human-readable end status name
   */
  private getEndStatusName(endStatus: number): string {
    const statusNames = {
      0: 'Killed', // KILLED
      1: 'Retired', // RETIRED  
      2: 'Moon Purchased' // MOON
    };
    return statusNames[endStatus as keyof typeof statusNames] || 'Unknown';
  }
}

/**
 * Run the intelligent trader bot
 */
export async function runIntelligentTrader(
  verbose: boolean = true,
  maxActions: number = 500,
  debugActions: boolean = false
): Promise<TradingSession> {
  const bot = new IntelligentTraderBot(verbose, maxActions, debugActions);
  return await bot.run();
}

// Run if executed directly (Node.js check)
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const verbose = !args.includes('--quiet');
  const debugActions = args.includes('--debug-actions') || process.env.ST_DEBUG_ACTIONS === 'true';
  const debugAll = args.includes('--debug') || process.env.ST_DEBUG === 'true';
  const maxActions = parseInt(args.find(arg => arg.startsWith('--max='))?.split('=')[1] || '500');
  
  console.log('🤖 Intelligent Trader Bot');
  console.log(`Running with max ${maxActions} actions (verbose: ${verbose ? 'on' : 'off'})`);
  
  if (debugAll) {
    console.log('🔍 Full debug logging enabled');
  } else if (debugActions) {
    console.log('🔍 Action debug logging enabled');
  }
  
  console.log('\n💡 Debug options:');
  console.log('  --debug-actions  Enable action logging');
  console.log('  --debug          Enable all debug logging');
  console.log('  ST_DEBUG=true    Environment variable for full debug');
  console.log('  ST_DEBUG_ACTIONS=true  Environment variable for action debug\n');
  
  try {
    const result = await runIntelligentTrader(verbose, maxActions, debugActions || debugAll);
    process.exit(0);
  } catch (error) {
    console.error('❌ Bot crashed:', error);
    process.exit(1);
  }
}
