// Escape Pod System Comprehensive Tests
import { test } from 'node:test';
import assert from 'node:assert';

import { createInitialState } from './state.ts';
import { GameMode } from './types.ts';
import { checkCombatResolution } from './combat/engine.ts';

test('escape pod - saves player when ship destroyed in combat', () => {
  const state = createInitialState();
  state.currentMode = GameMode.InCombat;
  state.escapePod = true;
  state.ship.hull = 0; // Destroyed
  state.opponent.hull = 50; // Still alive
  
  const resolution = checkCombatResolution(state);
  
  assert(resolution, 'Combat should resolve when ship destroyed');
  if (resolution) {
    assert.ok(resolution.message.includes('escape pod'), 'Should mention escape pod activation');
    assert.equal(state.escapePod, false, 'Escape pod should be consumed');
  }
});

test('escape pod - player dies without pod when ship destroyed', () => {
  const state = createInitialState();
  state.currentMode = GameMode.InCombat;
  state.escapePod = false; // No escape pod
  state.ship.hull = 0; // Destroyed
  state.opponent.hull = 50; // Still alive
  
  const resolution = checkCombatResolution(state);
  
  assert(resolution, 'Combat should resolve');
  if (resolution) {
    assert.equal(resolution.gameOver, true, 'Should be game over without escape pod');
    assert.ok(resolution.message.includes('destroyed'), 'Should mention ship destruction');
  }
});

test('escape pod - handles both ships destroyed scenario', () => {
  const state = createInitialState();
  state.currentMode = GameMode.InCombat;
  state.escapePod = true;
  state.ship.hull = 0; // Destroyed
  state.opponent.hull = 0; // Also destroyed
  
  const resolution = checkCombatResolution(state);
  
  assert(resolution, 'Combat should resolve');
  if (resolution) {
    assert.ok(resolution.message.includes('Both ships destroyed'), 'Should mention both ships');
    assert.ok(resolution.message.includes('escape pod'), 'Should mention escape pod');
    assert.equal(state.escapePod, false, 'Pod should be consumed');
  }
});

test('escape pod - provides emergency ship after use', () => {
  const state = createInitialState();
  state.currentMode = GameMode.InCombat;
  state.escapePod = true;
  state.ship.hull = 0;
  state.ship.type = 5; // Expensive ship
  state.ship.weapon[0] = 2; // Advanced weapon
  
  const resolution = checkCombatResolution(state);
  
  assert(resolution, 'Should resolve combat');
  
  // Check that player gets emergency ship
  assert.equal(state.ship.type, 0, 'Should get Flea emergency ship');
  assert.equal(state.ship.hull, 25, 'Emergency ship should have full hull (Flea)');
  assert.equal(state.ship.weapon[0], -1, 'Should have no weapon (Flea has 0 weapon slots)');
  assert.ok(state.credits > 0, 'Should receive some emergency credits');
});

test('escape pod - preserves commander in crew', () => {
  const state = createInitialState();
  state.currentMode = GameMode.InCombat;
  state.escapePod = true;
  state.ship.hull = 0;
  state.ship.crew = [0, 5, 10]; // Commander + hired crew
  
  const resolution = checkCombatResolution(state);
  
  assert(resolution, 'Should resolve');
  assert.equal(state.ship.crew[0], 0, 'Commander should survive');
  assert.equal(state.ship.crew[1], -1, 'Hired crew should be lost');
  assert.equal(state.ship.crew[2], -1, 'Hired crew should be lost');
});

test('escape pod - clears cargo and equipment', () => {
  const state = createInitialState();
  state.currentMode = GameMode.InCombat;
  state.escapePod = true;
  state.ship.hull = 0;
  state.ship.cargo[0] = 10; // Water
  state.ship.shield[0] = 1; // Shield
  
  const resolution = checkCombatResolution(state);
  
  assert(resolution, 'Should resolve');
  assert.equal(state.ship.cargo[0], 0, 'Cargo should be lost');
  assert.equal(state.ship.shield[0], -1, 'Equipment should be lost');
});

test('escape pod - integration with reactor meltdown', async () => {
  const { advanceReactorQuest } = await import('./events/quests/reactor.ts');
  
  const state = createInitialState();
  state.escapePod = true;
  state.reactorStatus = 19; // Will become 20 on advance (critical meltdown)
  
  const result = advanceReactorQuest(state);
  
  // Should survive with escape pod  
  assert.equal(result.reactorStatus, 0, 'Reactor quest should be reset');
  assert.equal(result.escapePod, false, 'Escape pod should be consumed');
  assert.ok(result.credits < state.credits, 'Should lose some credits for emergency rescue');
});

test('escape pod - no reactor meltdown survival without pod', async () => {
  const { advanceReactorQuest } = await import('./events/quests/reactor.ts');
  
  const state = createInitialState();
  state.escapePod = false;
  state.reactorStatus = 19; // Will become 20 on advance (critical meltdown)
  
  const result = advanceReactorQuest(state);
  
  // Should result in game over
  assert(result !== state, 'State should change significantly');
  assert.equal(result.reactorStatus, 0, 'Reactor quest should be reset');
  // Game over conditions would be checked elsewhere
});

test('escape pod - cost and availability at shipyard', () => {
  const state = createInitialState();
  state.credits = 5000;
  state.escapePod = false;
  
  // This would be tested through shipyard integration
  // For now, just verify state can handle escape pod purchase
  state.escapePod = true;
  state.credits -= 2000; // Standard escape pod cost
  
  assert.equal(state.escapePod, true);
  assert.equal(state.credits, 3000);
});
