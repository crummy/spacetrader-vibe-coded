// Ship Trading System Tests

import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import type { GameState } from '../types.ts';
import { createInitialState } from '../state.ts';
import {
  purchaseShip,
  getShipPurchaseInfo
} from './ship-trading.ts';
import { 
  getAvailableShipsForPurchase,
  canPurchaseShip,
  calculateShipBasePrice 
} from './ship-pricing.ts';
import { getShipTypes } from '../data/shipTypes.ts';

function createTestState(): GameState {
  const state = createInitialState();
  // Set up a typical game state for testing
  state.credits = 100000;
  state.ship.type = 1; // Gnat (starting ship)
  state.ship.hull = 100;
  state.ship.fuel = 14;
  state.ship.cargo = [5, 3, 0, 0, 0, 0, 0, 0, 0, 0]; // Some cargo
  // Set cargo in the cargo array instead
  state.ship.cargo[0] = 8;
  state.ship.tribbles = 0;
  state.debt = 0;
  return state;
}

describe('Ship Trading System', () => {
  test('purchaseShip - successful purchase', () => {
    const state = createTestState();
    const originalCredits = state.credits;
    
    const result = purchaseShip(state, 2); // Firefly
    
    assert(result.success, 'Ship purchase should succeed');
    assert(result.newState, 'Should return new state');
    
    if (result.newState) {
      assert(result.newState.ship.type === 2, 'Should have new ship type');
      assert(result.newState.credits < originalCredits, 'Should deduct credits');
      assert(result.newState.ship.hull > 0, 'New ship should have full hull');
      assert(result.newState.ship.fuel > 0, 'New ship should have full fuel');
    }
  });

  test('purchaseShip - insufficient funds', () => {
    const state = createTestState();
    state.credits = 1000; // Very low credits
    
    const result = purchaseShip(state, 9); // Expensive Wasp
    
    assert(!result.success, 'Ship purchase should fail with insufficient funds');
    assert(result.error, 'Should provide error message');
    assert(!result.newState, 'Should not return new state on failure');
  });

  test('purchaseShip - debt prevents purchase', () => {
    const state = createTestState();
    state.debt = 5000;
    
    const result = purchaseShip(state, 2); // Firefly
    
    assert(!result.success, 'Ship purchase should fail when in debt');
    assert(result.error?.includes('debt'), 'Should explain debt restriction');
  });

  test('purchaseShip - cargo transfer', () => {
    const state = createTestState();
    state.ship.cargo = [10, 5, 3, 2, 1, 0, 0, 0, 0, 0];
    // Fill cargo array to simulate 21 total cargo
  state.ship.cargo = [10, 5, 3, 2, 1, 0, 0, 0, 0, 0];
    
    const result = purchaseShip(state, 0); // Flea (10 cargo bays)
    
    assert(result.success, 'Purchase should succeed');
    
    if (result.newState) {
      const newTotalCargo = result.newState.ship.cargo.reduce((sum, qty) => sum + qty, 0);
      assert(newTotalCargo <= 10, 'Should not exceed new ship cargo capacity');
      assert(newTotalCargo > 0, 'Should transfer some cargo');
    }
  });

  test('purchaseShip - equipment transfer', () => {
    const state = createTestState();
    // Give current ship some equipment
    state.ship.weapon = [0, -1, -1]; // One weapon
    state.ship.shield = [0, -1, -1]; // One shield
    
    const result = purchaseShip(state, 6); // Hornet (3 weapon, 2 shield slots)
    
    assert(result.success, 'Purchase should succeed');
    
    if (result.newState) {
      // Equipment should transfer
      assert(result.newState.ship.weapon[0] >= 0, 'Should transfer weapon');
      assert(result.newState.ship.shield[0] >= 0, 'Should transfer shield');
    }
  });

  test('purchaseShip - crew transfer', () => {
    const state = createTestState();
    // Give current ship crew members
    state.ship.crew = [0, 1, -1]; // Two crew members
    
    const result = purchaseShip(state, 4); // Bumblebee (2 crew quarters)
    
    assert(result.success, 'Purchase should succeed');
    
    if (result.newState) {
      const transferredCrew = result.newState.ship.crew.filter(c => c >= 0).length;
      assert(transferredCrew <= 2, 'Should not exceed new ship crew capacity');
      assert(transferredCrew > 0, 'Should transfer some crew');
    }
  });

  test('purchaseShip - same ship type', () => {
    const state = createTestState();
    
    const result = purchaseShip(state, state.ship.type);
    
    assert(!result.success, 'Should not allow buying same ship type');
    assert(result.error?.includes('Already own'), 'Should explain already owning this ship');
  });

  test('purchaseShip - non-buyable ship', () => {
    const state = createTestState();
    
    const result = purchaseShip(state, 10); // Space Monster (not buyable)
    
    assert(!result.success, 'Should not allow buying non-buyable ships');
    assert(result.error?.includes('not available'), 'Should explain ship not available');
  });

  test('getShipPurchaseInfo - comprehensive info', () => {
    const state = createTestState();
    
    const info = getShipPurchaseInfo(state, 2); // Firefly
    
    assert(info.shipType === 2, 'Should return correct ship type');
    assert(info.name === 'Firefly', 'Should return ship name');
    assert(typeof info.netPrice === 'number', 'Should include net price');
    assert(typeof info.basePrice === 'number', 'Should include base price');
    assert(typeof info.tradeInValue === 'number', 'Should include trade-in value');
    assert(typeof info.canAfford === 'boolean', 'Should include affordability');
    assert(typeof info.canPurchase === 'boolean', 'Should include purchase validity');
    assert(typeof info.cargoLoss === 'number', 'Should include cargo loss info');
  });

  test('getShipPurchaseInfo - cargo loss calculation', () => {
    const state = createTestState();
    // Fill cargo array to simulate 20 total cargo
  state.ship.cargo = [10, 5, 3, 2, 0, 0, 0, 0, 0, 0];
    
    const info = getShipPurchaseInfo(state, 0); // Flea (10 cargo bays)
    
    assert(info.cargoLoss === 10, 'Should calculate correct cargo loss');
  });

  test('getAvailableShipsForPurchase - excludes current ship', () => {
    const state = createTestState();
    const availableShips = getAvailableShipsForPurchase(state);
    
    const hasCurrentShip = availableShips.some(ship => ship.shipType === state.ship.type);
    assert(!hasCurrentShip, 'Should exclude current ship type');
  });

  test('getAvailableShipsForPurchase - includes all buyable ships', () => {
    const state = createTestState();
    const availableShips = getAvailableShipsForPurchase(state);
    
    // Should have 9 ships (10 buyable minus current ship)
    assert(availableShips.length === 9, 'Should have 9 available ships');
    
    // All should be buyable ship types
    for (const ship of availableShips) {
      assert(ship.shipType >= 0 && ship.shipType < 10, 'Should only include buyable ships');
    }
  });

  test('canPurchaseShip - comprehensive validation', () => {
    const state = createTestState();
    
    // Valid purchase
    const validResult = canPurchaseShip(state, 2);
    assert(validResult.canPurchase, 'Should allow valid purchase');
    
    // Invalid - non-buyable
    const nonBuyableResult = canPurchaseShip(state, 10);
    assert(!nonBuyableResult.canPurchase, 'Should reject non-buyable ships');
    
    // Invalid - same ship
    const sameShipResult = canPurchaseShip(state, state.ship.type);
    assert(!sameShipResult.canPurchase, 'Should reject same ship type');
  });
});
