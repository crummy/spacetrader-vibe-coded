// Tests for Space Trader State
import { test } from 'node:test';
import assert from 'node:assert';
import { createInitialState, cloneState, createEmptyShip } from './state.ts';
import { GameMode, MAXTRADEITEM, MAXCREWMEMBER, MAXSOLARSYSTEM } from './types.ts';

test('createInitialState creates valid initial game state', () => {
  const state = createInitialState();
  
  // Test basic properties
  assert.strictEqual(state.credits, 1000);
  assert.strictEqual(state.debt, 0);
  assert.strictEqual(state.days, 0);
  assert.strictEqual(state.nameCommander, "Commander");
  
  // Test arrays are correct length
  assert.strictEqual(state.buyPrice.length, MAXTRADEITEM);
  assert.strictEqual(state.mercenary.length, MAXCREWMEMBER + 1);
  assert.strictEqual(state.solarSystem.length, MAXSOLARSYSTEM);
  
  // Test game mode
  assert.strictEqual(state.currentMode, GameMode.OnPlanet);
  
  // Test ship structure
  assert.strictEqual(state.ship.cargo.length, MAXTRADEITEM);
  assert.strictEqual(state.ship.fuel, 14); // Gnat ship starts with 14 fuel tanks
  assert.strictEqual(state.ship.tribbles, 0);
});

test('cloneState creates independent copy', () => {
  const original = createInitialState();
  const clone = cloneState(original);
  
  // Modify clone
  clone.credits = 2000;
  clone.ship.fuel = 50;
  
  // Original should be unchanged
  assert.strictEqual(original.credits, 1000);
  assert.strictEqual(original.ship.fuel, 14); // Gnat starts with 14 fuel
  assert.strictEqual(clone.credits, 2000);
  assert.strictEqual(clone.ship.fuel, 50);
});

test('createEmptyShip creates ship with correct defaults', () => {
  const ship = createEmptyShip();
  
  assert.strictEqual(ship.type, 0);
  assert.strictEqual(ship.fuel, 0);
  assert.strictEqual(ship.hull, 0);
  assert.strictEqual(ship.tribbles, 0);
  
  // Test weapon/shield/gadget arrays have -1 (no equipment)
  assert.strictEqual(ship.weapon[0], -1);
  assert.strictEqual(ship.shield[0], -1);
  assert.strictEqual(ship.gadget[0], -1);
  assert.strictEqual(ship.crew[0], -1);
  
  // Test cargo is empty
  assert.strictEqual(ship.cargo[0], 0);
});