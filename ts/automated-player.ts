#!/usr/bin/env node --experimental-strip-types

// Automated Game Player - Plays full games to completion
// Randomly selects available actions until reaching end game conditions

import { createGameEngine } from './engine/game.ts';
import { checkGameEndConditions, processRetirement } from './game/endings.ts';
import { getSolarSystemName } from './data/systems.ts';
import { Difficulty } from './types.ts';

interface GameSession {
  gameNumber: number;
  startTime: number;
  endTime?: number;
  totalTurns: number;
  endResult?: any;
  finalCredits: number;
  finalWorth: number;
}

/**
 * Automated game player that plays until end state
 */
export class AutomatedPlayer {
  private engine: any;
  private maxTurns: number;
  private session: GameSession;
  private verbose: boolean;

  constructor(difficulty: number = Difficulty.Easy, maxTurns: number = 10000, verbose: boolean = false) {
    this.engine = createGameEngine();
    this.engine.state.difficulty = difficulty;
    this.maxTurns = maxTurns;
    this.verbose = verbose;
    
    this.session = {
      gameNumber: Math.floor(Math.random() * 1000),
      startTime: Date.now(),
      totalTurns: 0,
      finalCredits: 0,
      finalWorth: 0
    };
  }

  /**
   * Play a complete game to end state
   */
  async playToCompletion(): Promise<GameSession> {
    if (this.verbose) {
      console.log(`🎮 Starting automated game #${this.session.gameNumber}`);
      console.log(`📍 Starting at: ${getSolarSystemName(this.engine.state.currentSystem)}`);
      console.log(`💰 Starting credits: ${this.engine.state.credits}`);
    }

    while (this.session.totalTurns < this.maxTurns) {
      // Check for natural end conditions
      const endCondition = checkGameEndConditions(this.engine.state);
      if (endCondition?.isGameOver) {
        this.session.endResult = endCondition;
        break;
      }

      // Force retirement if getting close to max turns (simulate player choice)
      if (this.session.totalTurns > this.maxTurns * 0.9 && 
          this.engine.state.moonBought && 
          this.engine.state.currentSystem === 119) {
        const retirementEnd = processRetirement(this.engine.state);
        this.session.endResult = retirementEnd;
        break;
      }

      // Get available actions and pick one randomly
      const action = await this.selectRandomAction();
      if (!action) {
        if (this.verbose) {
          console.log(`⚠️ No actions available at turn ${this.session.totalTurns}, ending game`);
        }
        break;
      }

      // Execute the selected action
      const result = await this.engine.executeAction(action);
      this.session.totalTurns++;

      if (this.verbose && this.session.totalTurns % 100 === 0) {
        console.log(`🔄 Turn ${this.session.totalTurns}: ${action.name} - ${result.success ? '✅' : '❌'}`);
        this.logCurrentStatus();
      }

      // Small delay to prevent overwhelming the system
      if (this.session.totalTurns % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }

    this.finalizeSession();
    return this.session;
  }

  /**
   * Select a random available action with some intelligence
   */
  private async selectRandomAction(): Promise<any> {
    const actions = this.engine.getAvailableActions();
    
    if (actions.length === 0) {
      return null;
    }

    // Apply some basic strategy preferences
    const prioritizedActions = this.prioritizeActions(actions);
    
    // Select randomly from prioritized actions
    return prioritizedActions[Math.floor(Math.random() * prioritizedActions.length)];
  }

  /**
   * Apply basic strategic priorities to action selection
   */
  private prioritizeActions(actions: any[]): any[] {
    const priorities: { [key: string]: number } = {
      // Survival priorities (highest)
      'dock_at_planet': 10,
      'repair_ship': 9,
      'refuel_ship': 9,
      'combat_flee': 8,
      'combat_surrender': 7,
      
      // Economic activities (high)
      'sell_cargo': 6,
      'buy_cargo': 5,
      'get_loan': 4,
      'pay_debt': 4,
      
      // Travel and exploration (medium)
      'warp_to_system': 3,
      
      // Equipment and upgrades (medium)
      'buy_weapon': 2,
      'buy_shield': 2,
      'buy_gadget': 2,
      'sell_equipment': 2,
      
      // Combat actions (low - prefer fleeing)
      'combat_attack': 1,
      'combat_trade': 1,
      'combat_ignore': 1
    };

    // Sort actions by priority, then randomize within priority groups
    const prioritized = actions
      .map(action => ({
        ...action,
        priority: priorities[action.type] || 0,
        random: Math.random()
      }))
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.random - b.random; // Random within same priority
      });

    return prioritized;
  }

  /**
   * Log current game status
   */
  private logCurrentStatus(): void {
    const system = getSolarSystemName(this.engine.state.currentSystem);
    console.log(`  📍 ${system} | 💰 ${this.engine.state.credits} | ⛽ ${this.engine.state.ship.fuel} | 🛡️ ${this.engine.state.ship.hull}/100`);
  }

  /**
   * Finalize the game session
   */
  private finalizeSession(): void {
    this.session.endTime = Date.now();
    this.session.finalCredits = this.engine.state.credits;
    
    // Calculate final worth (simplified)
    this.session.finalWorth = this.engine.state.credits - this.engine.state.debt;
    if (this.engine.state.moonBought) {
      this.session.finalWorth += 500000;
    }

    const duration = (this.session.endTime - this.session.startTime) / 1000;
    
    console.log(`\n🏁 Game #${this.session.gameNumber} Complete!`);
    console.log(`⏱️ Duration: ${duration.toFixed(1)}s`);
    console.log(`🎯 Turns: ${this.session.totalTurns}`);
    console.log(`💰 Final Credits: ${this.session.finalCredits}`);
    console.log(`💎 Final Worth: ${this.session.finalWorth}`);
    
    if (this.session.endResult) {
      console.log(`🎬 End Condition: ${this.session.endResult.message}`);
      console.log(`🏆 Final Score: ${this.session.endResult.finalScore || 'N/A'}`);
    }
  }

  /**
   * Get session summary
   */
  getSessionSummary(): GameSession {
    return { ...this.session };
  }
}

/**
 * Run multiple automated games and collect statistics
 */
export async function runMultipleGames(
  count: number = 10, 
  difficulty: number = Difficulty.Easy,
  maxTurns: number = 5000
): Promise<GameSession[]> {
  const sessions: GameSession[] = [];
  
  console.log(`🎯 Running ${count} automated games on ${getDifficultyName(difficulty)} difficulty...\n`);
  
  for (let i = 0; i < count; i++) {
    console.log(`\n📊 Game ${i + 1}/${count}`);
    
    const player = new AutomatedPlayer(difficulty, maxTurns, false);
    const session = await player.playToCompletion();
    sessions.push(session);
    
    // Brief summary
    console.log(`  Result: ${session.endResult?.message || 'Max turns reached'}`);
    console.log(`  Turns: ${session.totalTurns} | Worth: ${session.finalWorth}`);
  }
  
  // Overall statistics
  console.log(`\n📈 Overall Statistics:`);
  const avgTurns = sessions.reduce((sum, s) => sum + s.totalTurns, 0) / sessions.length;
  const avgWorth = sessions.reduce((sum, s) => sum + s.finalWorth, 0) / sessions.length;
  const completedGames = sessions.filter(s => s.endResult?.isGameOver).length;
  
  console.log(`  Average turns: ${avgTurns.toFixed(1)}`);
  console.log(`  Average worth: ${avgWorth.toFixed(0)} credits`);
  console.log(`  Completed games: ${completedGames}/${count}`);
  
  // End condition breakdown
  const endTypes = sessions
    .filter(s => s.endResult)
    .reduce((acc: { [key: string]: number }, s) => {
      const status = s.endResult.endStatus;
      const key = status === 0 ? 'Killed' : status === 1 ? 'Retired' : status === 2 ? 'Moon' : 'Other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  
  console.log(`  End conditions:`, endTypes);
  
  return sessions;
}

/**
 * Get difficulty name for display
 */
function getDifficultyName(level: number): string {
  const names = ['Beginner', 'Easy', 'Normal', 'Hard', 'Impossible'];
  return names[level] || 'Unknown';
}

// Run if executed directly (Node.js check)
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const gameCount = parseInt(args[0]) || 5;
  const difficulty = parseInt(args[1]) || Difficulty.Easy;
  const maxTurns = parseInt(args[2]) || 3000;
  
  console.log('🎮 Space Trader Automated Player');
  console.log(`Running ${gameCount} games on ${getDifficultyName(difficulty)} difficulty (max ${maxTurns} turns each)\n`);
  
  try {
    await runMultipleGames(gameCount, difficulty, maxTurns);
  } catch (error) {
    console.error('❌ Automated player error:', error);
  }
}
