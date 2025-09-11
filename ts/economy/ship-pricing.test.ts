// Ship Pricing System Tests

import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import type { GameState } from '../types.ts';
import { createInitialState } from '../state.ts';
import {
  calculateShipTradeInValue,
  calculateShipTotalValue,
  calculateShipBasePrice,
  calculateShipNetPrice,
  getAvailableShipsForPurchase,
  canPurchaseShip
} from './ship-pricing.ts';
import { getShipTypes } from '../data/shipTypes.ts';

function createTestState(): GameState {
  const state = createInitialState();
  // Set up a typical game state for testing
  state.credits = 50000;
  state.ship.type = 1; // Gnat (starting ship)
  state.ship.hull = 100;
  state.ship.fuel = 14;
  state.ship.tribbles = 0;
  state.debt = 0;
  return state;
}

describe('Ship Pricing System', () => {
  test('calculateShipTradeInValue - basic functionality', () => {
    const state = createTestState();
    const tradeInValue = calculateShipTradeInValue(state);
    
    // Should be 3/4 of ship price minus any repair/fuel costs
    // Gnat has price 10000, so trade-in should be around 7500
    assert(tradeInValue > 0, 'Trade-in value should be positive');
    assert(tradeInValue < 10000, 'Trade-in value should be less than original ship price');
  });

  test('calculateShipTradeInValue - tribble penalty', () => {
    const state = createTestState();
    const normalValue = calculateShipTradeInValue(state);
    
    // Add tribbles to reduce trade-in value
    state.ship.tribbles = 10;
    const tribbleValue = calculateShipTradeInValue(state);
    
    // Tribbles should reduce trade-in value significantly (to 1/4 instead of 3/4)
    assert(tribbleValue < normalValue, 'Tribbles should reduce trade-in value');
    assert(tribbleValue < normalValue / 2, 'Tribble penalty should be substantial');
  });

  test('calculateShipTradeInValue - insurance vs trade-in', () => {
    const state = createTestState();
    state.ship.tribbles = 10;
    
    const tradeInValue = calculateShipTradeInValue(state, false);
    const insuranceValue = calculateShipTradeInValue(state, true);
    
    // Insurance value ignores tribble penalty
    assert(insuranceValue > tradeInValue, 'Insurance value should ignore tribble penalty');
  });

  test('calculateShipTradeInValue - damage reduces value', () => {
    const state = createTestState();
    const fullHealthValue = calculateShipTradeInValue(state);
    
    // Damage the ship
    state.ship.hull = 50; // Half health
    const damagedValue = calculateShipTradeInValue(state);
    
    assert(damagedValue < fullHealthValue, 'Damage should reduce trade-in value');
  });

  test('calculateShipBasePrice - trader skill discount', () => {
    const state = createTestState();
    
    // Test with different trader skills
    state.commanderTrader = 10;
    const highSkillPrice = calculateShipBasePrice(state, 2); // Firefly
    
    state.commanderTrader = 1;
    const lowSkillPrice = calculateShipBasePrice(state, 2); // Firefly
    
    assert(highSkillPrice < lowSkillPrice, 'Higher trader skill should reduce ship prices');
  });

  test('calculateShipNetPrice - current ship returns 0', () => {
    const state = createTestState();
    const netPrice = calculateShipNetPrice(state, state.ship.type);
    
    assert(netPrice === 0, 'Net price for current ship should be 0');
  });

  test('calculateShipNetPrice - more expensive ship costs money', () => {
    const state = createTestState();
    // Gnat to Wasp (much more expensive)
    const netPrice = calculateShipNetPrice(state, 9); // Wasp
    
    assert(netPrice > 0, 'Upgrading to more expensive ship should cost money');
  });

  test('calculateShipNetPrice - should return negative value when trade-in exceeds purchase price', () => {
    const state = createTestState();
    state.ship.type = 9; // Start with expensive Wasp (high trade-in value)
    state.ship.hull = getShipTypes()[9].hullStrength;
    state.ship.fuel = getShipTypes()[9].fuelTanks;
    
    // Add valuable equipment to increase trade-in value
    state.ship.weapon = [2, 3, -1]; // High-value weapons
    state.ship.shield = [1, -1, -1]; // High-value shield
    state.ship.gadget = [2, 3, -1];  // High-value gadgets
    
    // Trade down to much cheaper Flea
    const netPrice = calculateShipNetPrice(state, 0); // Flea
    const tradeInValue = calculateShipTradeInValue(state, false);
    const basePrice = calculateShipBasePrice(state, 0);
    
    // Trade-in should exceed purchase price, resulting in negative net price (cash back)
    assert(tradeInValue > basePrice, `Trade-in value (${tradeInValue}) should exceed base price (${basePrice})`);
    assert(netPrice < 0, `Net price should be negative (cash back), but got ${netPrice}`);
    assert.equal(netPrice, basePrice - tradeInValue, 'Net price should be basePrice - tradeInValue');
  });

  test('getAvailableShipsForPurchase - excludes current ship', () => {
    const state = createTestState();
    const availableShips = getAvailableShipsForPurchase(state);
    
    const currentShipInList = availableShips.find(ship => ship.shipType === state.ship.type);
    assert(!currentShipInList, 'Current ship should not be in available ships list');
  });

  test('getAvailableShipsForPurchase - includes affordability info', () => {
    const state = createTestState();
    const availableShips = getAvailableShipsForPurchase(state);
    
    assert(availableShips.length > 0, 'Should have ships available for purchase');
    
    for (const ship of availableShips) {
      assert(typeof ship.canAfford === 'boolean', 'Should include affordability info');
      assert(typeof ship.netPrice === 'number', 'Should include net price');
      assert(typeof ship.name === 'string', 'Should include ship name');
    }
  });

  test('canPurchaseShip - debt prevents purchase', () => {
    const state = createTestState();
    state.debt = 1000;
    
    const result = canPurchaseShip(state, 2); // Firefly
    
    assert(!result.canPurchase, 'Should not allow purchase while in debt');
    assert(result.reason?.includes('debt'), 'Should explain debt restriction');
  });

  test('canPurchaseShip - insufficient funds', () => {
    const state = createTestState();
    state.credits = 100; // Very low credits
    
    const result = canPurchaseShip(state, 9); // Expensive Wasp
    
    assert(!result.canPurchase, 'Should not allow purchase without funds');
    assert(result.reason?.includes('funds'), 'Should explain insufficient funds');
  });

  test('canPurchaseShip - valid purchase', () => {
    const state = createTestState();
    state.credits = 500000; // Plenty of credits
    
    const result = canPurchaseShip(state, 2); // Firefly
    
    assert(result.canPurchase, 'Should allow valid purchase');
    assert(!result.reason, 'Should not have error reason for valid purchase');
  });

  test('canPurchaseShip - passenger quarter requirements', () => {
    const state = createTestState();
    state.credits = 500000;
    state.jarekStatus = 1; // Ambassador Jarek needs quarters
    
    const result = canPurchaseShip(state, 0); // Flea (only 1 crew quarter)
    
    assert(!result.canPurchase, 'Should not allow purchase if passenger needs quarters');
    assert(result.reason?.includes('Jarek'), 'Should explain passenger quarter requirement');
  });

  test('canPurchaseShip - reactor prevents ship sale', () => {
    const state = createTestState();
    state.credits = 500000;
    state.reactorStatus = 10; // Unstable reactor
    
    const result = canPurchaseShip(state, 2); // Firefly
    
    assert(!result.canPurchase, 'Should not allow ship sale with unstable reactor');
    assert(result.reason?.includes('reactor'), 'Should explain reactor restriction');
  });

  test('getAvailableShipsForPurchase - cash back ships are always affordable', () => {
    const state = createTestState();
    
    // Start with expensive ship with valuable equipment to create cash back scenario
    state.ship.type = 9; // Wasp
    state.ship.hull = getShipTypes()[9].hullStrength;
    state.ship.fuel = getShipTypes()[9].fuelTanks;
    state.ship.weapon = [2, 3, -1]; // High-value weapons
    state.ship.shield = [1, -1, -1]; // High-value shield
    state.ship.gadget = [2, 3, -1];  // High-value gadgets
    state.credits = 100; // Very low credits
    
    const availableShips = getAvailableShipsForPurchase(state);
    const fleaShip = availableShips.find(s => s.shipType === 0); // Flea
    
    assert(fleaShip, 'Should find Flea in available ships');
    assert(fleaShip.netPrice < 0, 'Flea should have negative price (cash back)');
    assert(fleaShip.canAfford === true, 'Cash back ships should always be affordable');
  });
});
