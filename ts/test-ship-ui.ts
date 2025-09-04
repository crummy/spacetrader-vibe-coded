// Test ship trading through UI system

import { startGameLoop } from './ui/game-loop.ts';
import { createInitialState } from './state.ts';
import { GameMode } from './types.ts';

// Create a game state with enough money for ship trading
const state = createInitialState();
state.currentMode = GameMode.OnPlanet;
state.credits = 100000; // Give player enough money

console.log('Starting Ship Trading UI Test...');
console.log('Use "Buy Ship" action to test ship trading');
console.log('Type "quit" to exit\n');

await startGameLoop(state);
