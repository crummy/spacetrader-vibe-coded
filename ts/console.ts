import * as readline from 'node:readline';
import { createGameEngine, getGameStatus, getCurrentLocation, getCurrentShipStatus } from './engine/game.ts';
import { getSolarSystemName } from './data/systems.ts';
import { getAllSystemPrices } from './economy/pricing.ts';
import { getFuelStatus } from './economy/fuel.ts';
import { getSystemsWithinRange } from './travel/galaxy.ts';
import { calculateDistance } from './travel/warp.ts';
import { GameMode, TradeItem } from './types.ts';
import type { GameEngine, AvailableAction } from './engine/game.ts';

export class ConsoleInterface {
  private engine: GameEngine;
  private rl: readline.Interface;
  private running: boolean = false;

  constructor() {
    this.engine = createGameEngine();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  public async start(): Promise<void> {
    this.running = true;
    console.clear();
    console.log('═══ SPACE TRADER ═══');
    console.log('Welcome to the galaxy, Commander!');
    console.log('');
    
    await this.gameLoop();
  }

  public stop(): void {
    this.running = false;
    this.rl.close();
  }

  private async gameLoop(): Promise<void> {
    while (this.running) {
      try {
        this.displayGameState();
        await this.handleUserInput();
      } catch (error) {
        console.log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.log('');
      }
    }
  }

  private displayGameState(): void {
    console.clear();
    
    // Header
    const status = getGameStatus(this.engine.state);
    const location = getCurrentLocation(this.engine.state);
    const shipStatus = getCurrentShipStatus(this.engine.state);
    
    console.log('═══ SPACE TRADER ═══');
    console.log(`Commander: ${status.commanderName} | Credits: ${status.credits} | Day: ${status.days}`);
    console.log(`Reputation: ${status.reputation} | Police Record: ${status.policeRecord}`);
    console.log(`Location: ${location.systemName} ${location.isDocked ? '(Docked)' : '(In Space)'}`);
    console.log(`Ship: Hull ${shipStatus.hullPercentage}% | Fuel ${shipStatus.fuel} | Cargo ${shipStatus.cargoUsed}/${shipStatus.cargoCapacity}`);
    
    // Cargo display
    if (shipStatus.cargoUsed > 0) {
      const cargoItems = [];
      const tradeItemNames = ['Water', 'Furs', 'Food', 'Ore', 'Games', 'Firearms', 'Medicine', 'Machinery', 'Narcotics', 'Robots'];
      for (let i = 0; i < this.engine.state.ship.cargo.length; i++) {
        const quantity = this.engine.state.ship.cargo[i];
        if (quantity > 0) {
          cargoItems.push(`${tradeItemNames[i]}:${quantity}`);
        }
      }
      console.log(`Cargo: ${cargoItems.join(' ')}`);
    }
    
    console.log('');
    
    // Context-specific information
    this.displayContextInfo();
    
    console.log('');
  }

  private displayContextInfo(): void {
    const state = this.engine.state;
    
    switch (state.currentMode) {
      case GameMode.OnPlanet:
        this.displayPlanetInfo();
        break;
      case GameMode.InCombat:
        this.displayCombatInfo();
        break;
    }
  }

  private displayPlanetInfo(): void {
    const currentSystem = this.engine.state.solarSystem[this.engine.state.currentSystem];
    console.log(`Planet: ${getSolarSystemName(this.engine.state.currentSystem)}`);
    console.log(`Tech Level: ${currentSystem.techLevel} | Politics: ${currentSystem.politics} | Size: ${currentSystem.size}`);
    
    if (currentSystem.specialResources !== -1) {
      const resources = ['Water', 'Furs', 'Food', 'Ore', 'Games', 'Firearms', 'Medicine', 'Machinery', 'Narcotics', 'Robots'];
      console.log(`Special Resource: ${resources[currentSystem.specialResources]}`);
    }
    
    // Show fuel information
    const fuelStatus = getFuelStatus(this.engine.state);
    console.log(`Fuel: ${fuelStatus.currentFuel}/${fuelStatus.maxFuel} (${fuelStatus.fuelPercentage}%) | Cost per unit: ${fuelStatus.costPerUnit}`);
    if (fuelStatus.fullRefuelCost > 0) {
      console.log(`Full refuel cost: ${fuelStatus.fullRefuelCost} credits`);
    }
    
    // Show market prices with quantities
    console.log('');
    console.log('Market (Item: Buy Price | Sell Price | You Have | Max Affordable):');
    const tradeItemNames = ['Water', 'Furs', 'Food', 'Ore', 'Games', 'Firearms', 'Medicine', 'Machinery', 'Narcotics', 'Robots'];
    const shipStatus = getCurrentShipStatus(this.engine.state);
    const availableCargoSpace = shipStatus.cargoCapacity - shipStatus.cargoUsed;
    
    // Calculate real-time prices
    const allPrices = getAllSystemPrices(currentSystem, this.engine.state.commanderTrader, this.engine.state.policeRecordScore);
    
    for (let i = 0; i < Math.min(10, allPrices.length); i++) {
      const buyPrice = allPrices[i].buyPrice;
      const sellPrice = allPrices[i].sellPrice;
      const currentCargo = this.engine.state.ship.cargo[i] || 0;
      
      if (buyPrice > 0 || sellPrice > 0 || currentCargo > 0) {
        const maxAffordable = buyPrice > 0 ? Math.min(Math.floor(this.engine.state.credits / buyPrice), availableCargoSpace) : 0;
        console.log(`  ${tradeItemNames[i]}: ${buyPrice > 0 ? buyPrice : 'N/A'} | ${sellPrice > 0 ? sellPrice : 'N/A'} | ${currentCargo} | ${maxAffordable}`);
      }
    }
  }



  private displayCombatInfo(): void {
    console.log('⚔️  COMBAT ENCOUNTER ⚔️');
    console.log(`Opponent: ${this.getEncounterTypeName(this.engine.state.encounterType)}`);
    console.log(`Your Hull: ${this.engine.state.ship.hull}%`);
  }

  private async handleUserInput(): Promise<void> {
    const actions = this.engine.getAvailableActions();
    
    if (actions.length === 0) {
      console.log('No actions available. Press Enter to continue...');
      await this.waitForInput();
      return;
    }

    this.displayMenu(actions);
    
    const choice = await this.getMenuChoice(actions.length);
    
    if (choice === 0) {
      console.log('Goodbye, Commander!');
      this.stop();
      return;
    }
    
    if (choice > 0 && choice <= actions.length) {
      await this.executeSelectedAction(actions[choice - 1]);
    } else {
      console.log('Invalid choice. Press Enter to continue...');
      await this.waitForInput();
    }
  }

  private displayMenu(actions: AvailableAction[]): void {
    console.log('Available Actions:');
    
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const status = action.available ? '' : ' (unavailable)';
      console.log(`${i + 1}. ${action.name}${status}`);
    }
    
    console.log('0. Quit Game');
    console.log('');
  }

  private async getMenuChoice(maxChoice: number): Promise<number> {
    while (true) {
      const input = await this.prompt(`Enter choice (0-${maxChoice}): `);
      const choice = parseInt(input.trim());
      
      if (!isNaN(choice) && choice >= 0 && choice <= maxChoice) {
        return choice;
      }
      
      console.log(`Please enter a number between 0 and ${maxChoice}`);
    }
  }

  private async executeSelectedAction(action: AvailableAction): Promise<void> {
    if (!action.available) {
      console.log('That action is not currently available.');
      await this.waitForInput();
      return;
    }

    let gameAction = {
      type: action.type,
      parameters: {}
    };

    // Handle actions that need additional parameters
    switch (action.type) {
      case 'buy_cargo':
      case 'sell_cargo':
        gameAction.parameters = await this.getTradeParameters(action);
        break;
      case 'warp_to_system':
        gameAction.parameters = await this.getWarpParameters(action);
        break;
    }

    const creditsBefore = this.engine.state.credits;
    const result = await this.engine.executeAction(gameAction);
    const creditsAfter = this.engine.state.credits;
    
    console.log('');
    console.log(result.message);
    
    if (action.type === 'buy_cargo' || action.type === 'sell_cargo') {
      console.log(`Credits: ${creditsBefore} → ${creditsAfter}`);
      if (result.economyResult) {
        console.log(`Transaction: ${JSON.stringify(result.economyResult)}`);
      }
    }
    
    if (!result.success) {
      console.log('Action failed. Press Enter to continue...');
      await this.waitForInput();
    } else if (result.stateChanged) {
      console.log('Press Enter to continue...');
      await this.waitForInput();
    }
  }

  private async getTradeParameters(action: AvailableAction): Promise<any> {
    const tradeItemNames = ['Water', 'Furs', 'Food', 'Ore', 'Games', 'Firearms', 'Medicine', 'Machinery', 'Narcotics', 'Robots'];
    const shipStatus = getCurrentShipStatus(this.engine.state);
    const availableCargoSpace = shipStatus.cargoCapacity - shipStatus.cargoUsed;
    
    // Calculate real-time prices
    const currentSystem = this.engine.state.solarSystem[this.engine.state.currentSystem];
    const allPrices = getAllSystemPrices(currentSystem, this.engine.state.commanderTrader, this.engine.state.policeRecordScore);
    
    console.log('');
    if (action.type === 'buy_cargo') {
      console.log('Available for Purchase:');
      for (let i = 0; i < tradeItemNames.length; i++) {
        const buyPrice = allPrices[i].buyPrice;
        if (buyPrice > 0) {
          const maxAffordable = Math.min(Math.floor(this.engine.state.credits / buyPrice), availableCargoSpace);
          console.log(`${i + 1}. ${tradeItemNames[i]} - ${buyPrice} credits each (max: ${maxAffordable})`);
        }
      }
    } else {
      console.log('Available for Sale:');
      for (let i = 0; i < tradeItemNames.length; i++) {
        const current = this.engine.state.ship.cargo[i] || 0;
        const sellPrice = allPrices[i].sellPrice;
        if (current > 0 && sellPrice > 0) {
          console.log(`${i + 1}. ${tradeItemNames[i]} - ${sellPrice} credits each (you have: ${current})`);
        }
      }
    }
    
    const itemChoice = await this.prompt('Select item (1-10): ');
    const tradeItem = parseInt(itemChoice.trim()) - 1;
    
    if (tradeItem < 0 || tradeItem >= 10) {
      throw new Error('Invalid trade item selection');
    }
    
    // Validate item is available for the action
    if (action.type === 'buy_cargo') {
      if (allPrices[tradeItem].buyPrice <= 0) {
        throw new Error('That item is not available for purchase here');
      }
    } else {
      if ((this.engine.state.ship.cargo[tradeItem] || 0) <= 0) {
        throw new Error('You do not have that item to sell');
      }
    }
    
    // Show constraints for quantity
    let maxQuantity = 0;
    if (action.type === 'buy_cargo') {
      const buyPrice = allPrices[tradeItem].buyPrice;
      maxQuantity = Math.min(Math.floor(this.engine.state.credits / buyPrice), availableCargoSpace);
      console.log(`Max you can buy: ${maxQuantity}`);
    } else {
      maxQuantity = this.engine.state.ship.cargo[tradeItem] || 0;
      console.log(`Max you can sell: ${maxQuantity}`);
    }
    
    const quantity = await this.prompt(`Enter quantity (1-${maxQuantity}): `);
    const quantityNum = parseInt(quantity.trim());
    
    if (isNaN(quantityNum) || quantityNum <= 0 || quantityNum > maxQuantity) {
      throw new Error(`Invalid quantity. Must be between 1 and ${maxQuantity}`);
    }
    
    return { tradeItem, quantity: quantityNum };
  }

  private async getWarpParameters(action: AvailableAction): Promise<any> {
    const possibleSystems = action.parameters?.possibleSystems || [];
    const currentSystem = this.engine.state.solarSystem[this.engine.state.currentSystem];
    
    console.log('');
    console.log('Available Destinations:');
    
    // Create system list with distances
    const systemOptions: { index: number; name: string; distance: number }[] = [];
    for (const systemIndex of possibleSystems) {
      const targetSystem = this.engine.state.solarSystem[systemIndex];
      const distance = calculateDistance(currentSystem, targetSystem);
      systemOptions.push({
        index: systemIndex,
        name: getSolarSystemName(systemIndex),
        distance
      });
    }
    
    // Sort by distance for easier navigation
    systemOptions.sort((a, b) => a.distance - b.distance);
    
    for (let i = 0; i < systemOptions.length; i++) {
      const system = systemOptions[i];
      const fuelNeeded = system.distance;
      const canAfford = this.engine.state.ship.fuel >= fuelNeeded;
      const status = canAfford ? '' : ' (insufficient fuel)';
      console.log(`${i + 1}. ${system.name} - ${system.distance} parsecs${status}`);
    }
    
    const choice = await this.prompt(`Select destination (1-${systemOptions.length}): `);
    const choiceIndex = parseInt(choice.trim()) - 1;
    
    if (choiceIndex < 0 || choiceIndex >= systemOptions.length) {
      throw new Error('Invalid destination selection');
    }
    
    return { targetSystem: systemOptions[choiceIndex].index };
  }

  private async prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  private async waitForInput(): Promise<void> {
    await this.prompt('');
  }

  private getEncounterTypeName(encounterType: number): string {
    // Match encounter types from combat engine
    const encounterNames: { [key: number]: string } = {
      // Police encounters (0-9)
      0: 'Police Inspector',
      1: 'Police (Ignoring)',
      2: 'Police (Attacking)',
      3: 'Police (Fleeing)',
      
      // Pirate encounters (10-19)
      10: 'Pirate (Attacking)',
      11: 'Pirate (Fleeing)',
      12: 'Pirate (Ignoring)',
      13: 'Pirate (Surrendering)',
      
      // Trader encounters (20-29)
      20: 'Trader (Passing)',
      21: 'Trader (Fleeing)',
      22: 'Trader (Attacking)',
      23: 'Trader (Surrendering)',
      24: 'Trader (Selling)',
      25: 'Trader (Buying)',
      
      // Monster encounters (30-39)
      30: 'Space Monster (Attacking)',
      31: 'Space Monster (Ignoring)',
      
      // Dragonfly encounters (40-49)
      40: 'Dragonfly (Attacking)',
      41: 'Dragonfly (Ignoring)',
      
      // Scarab encounters (60-69)
      60: 'Scarab (Attacking)',
      61: 'Scarab (Ignoring)',
      
      // Famous captain encounters (70-79)
      70: 'Famous Captain',
      71: 'Famous Captain (Attacking)',
      72: 'Captain Ahab',
      73: 'Captain Conrad',
      74: 'Captain Huie',
      
      // Special encounters (80+)
      80: 'Marie Celeste',
      81: 'Bottle (Old)',
      82: 'Bottle (Good)',
      83: 'Post-Marie Police'
    };
    
    return encounterNames[encounterType] || `Unknown (${encounterType})`;
  }
}

// Main entry point
export async function startConsoleGame(): Promise<void> {
  const game = new ConsoleInterface();
  
  process.on('SIGINT', () => {
    console.log('\nGoodbye, Commander!');
    game.stop();
    process.exit(0);
  });
  
  await game.start();
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startConsoleGame().catch(console.error);
}
