// Functional Game Loop - Simple, React-like approach
// Pure functions with minimal state management

import * as readline from 'node:readline';
import type { GameState } from '../types.ts';
import type { AvailableAction } from '../engine/game.ts';
import { createGameEngine } from '../engine/game.ts';
import { checkGameEndConditions } from '../game/endings.ts';
import { renderUI } from './renderer.ts';
import { renderActionMenu, getActionParameterPrompts, type ActionParameterPrompt } from './actions.ts';

export class FunctionalGameLoop {
  private rl: readline.Interface;
  private running: boolean = false;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Main game loop - functional approach
   * State → UI → Actions → New State
   */
  public async start(): Promise<void> {
    this.running = true;
    
    let gameEngine = createGameEngine();
    
    while (this.running) {
      try {
        // 1. Check for game end conditions
        const gameEnd = checkGameEndConditions(gameEngine.state);
        if (gameEnd) {
          this.displayGameEnd(gameEnd);
          break;
        }
        
        // 2. Render current state → UI
        console.clear();
        console.log(renderUI(gameEngine.state));
        console.log('');
        
        // 3. Get available actions
        const actions = gameEngine.getAvailableActions();
        
        // 4. Render action menu
        console.log(renderActionMenu(actions));
        console.log('');
        
        // 5. Handle user input → New State
        const newEngine = await this.handleUserChoice(gameEngine, actions);
        if (newEngine) {
          gameEngine = newEngine;
        } else {
          // User chose to quit
          this.running = false;
        }
        
      } catch (error) {
        console.log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        await this.waitForInput();
      }
    }
  }

  public stop(): void {
    this.running = false;
    this.rl.close();
  }

  /**
   * Handle user choice and return new game state
   * Pure function conceptually: (GameEngine, Actions, UserChoice) → GameEngine
   */
  private async handleUserChoice(gameEngine: any, actions: AvailableAction[]): Promise<any | null> {
    if (actions.length === 0) {
      await this.waitForInput();
      return gameEngine;
    }
    
    const choice = await this.getMenuChoice(actions.length);
    
    if (choice === 0) {
      console.log('Goodbye, Commander!');
      return null; // Signal quit
    }
    
    if (choice > 0 && choice <= actions.length) {
      const selectedAction = actions[choice - 1];
      
      if (!selectedAction.available) {
        console.log('That action is not currently available.');
        await this.waitForInput();
        return gameEngine;
      }
      
      return await this.executeAction(gameEngine, selectedAction);
    } else {
      console.log('Invalid choice.');
      await this.waitForInput();
      return gameEngine;
    }
  }

  /**
   * Execute an action and return new game state
   */
  private async executeAction(gameEngine: any, action: AvailableAction): Promise<any> {
    let gameAction = {
      type: action.type,
      parameters: {}
    };

    // Collect parameters if needed
    const paramPrompt = getActionParameterPrompts(action, gameEngine.state);
    if (paramPrompt) {
      try {
        const parameters = await this.collectActionParameters(paramPrompt);
        gameAction.parameters = parameters;
      } catch (error) {
        console.log(`Parameter error: ${error instanceof Error ? error.message : 'Invalid input'}`);
        await this.waitForInput();
        return gameEngine;
      }
    }

    // Execute action
    const creditsBefore = gameEngine.state.credits;
    const result = await gameEngine.executeAction(gameAction);
    const creditsAfter = gameEngine.state.credits;
    
    // Display result
    console.log('');
    console.log(result.message);
    
    // Show credit changes for economic actions
    if (action.type === 'buy_cargo' || action.type === 'sell_cargo') {
      console.log(`Credits: ${creditsBefore} → ${creditsAfter}`);
    }
    
    if (!result.success || result.stateChanged) {
      console.log('Press Enter to continue...');
      await this.waitForInput();
    }
    
    return gameEngine;
  }

  /**
   * Collect action parameters using prompts
   */
  private async collectActionParameters(paramPrompt: ActionParameterPrompt): Promise<any> {
    const responses = [];
    
    for (const prompt of paramPrompt.prompts) {
      while (true) {
        const input = await this.prompt(prompt.question);
        const validation = prompt.validation(input);
        
        if (validation.valid) {
          responses.push(validation.value);
          break;
        } else {
          console.log(validation.errorMessage || 'Invalid input, please try again.');
        }
      }
    }
    
    return paramPrompt.buildParameters(responses);
  }

  /**
   * Display game end screen
   */
  private displayGameEnd(gameEnd: any): void {
    console.clear();
    console.log('═══ GAME OVER ═══');
    console.log(gameEnd.message);
    console.log('');
    console.log(`Final Score: ${gameEnd.finalScore}`);
    console.log(`Net Worth: ${gameEnd.finalWorth} credits`);
    console.log(`Days Played: ${gameEnd.days}`);
    
    const endStatusNames = ['Killed in Combat', 'Retired', 'Bought Moon'];
    console.log(`Ending: ${endStatusNames[gameEnd.endStatus] || 'Unknown'}`);
    
    if (gameEnd.highScoreQualified) {
      console.log('🏆 High Score Achieved!');
    }
  }

  /**
   * Get menu choice from user
   */
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

  /**
   * Prompt user for input
   */
  private async prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  /**
   * Wait for user to press Enter
   */
  private async waitForInput(): Promise<void> {
    await this.prompt('');
  }
}

/**
 * Start the functional game loop
 */
export async function startFunctionalGame(): Promise<void> {
  const game = new FunctionalGameLoop();
  
  process.on('SIGINT', () => {
    console.log('\nGoodbye, Commander!');
    game.stop();
    process.exit(0);
  });
  
  await game.start();
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startFunctionalGame().catch(console.error);
}
