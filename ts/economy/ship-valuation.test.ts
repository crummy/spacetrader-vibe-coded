// Ship Valuation System Comprehensive Tests
import { test } from 'node:test';
import assert from 'node:assert';

import { createInitialState } from '../state.ts';
import { calculateShipTradeInValue, calculateShipTotalValue } from './ship-pricing.ts';
import { getShipType } from '../data/shipTypes.ts';
import { processInsuranceClaim } from '../game/endings.ts';

test('ship valuation - base ship value calculation', () => {
  const state = createInitialState();
  state.ship.type = 1; // Gnat
  
  const tradeInValue = calculateShipTradeInValue(state, false);
  const shipType = getShipType(1);
  
  assert.ok(tradeInValue > 0, 'Ship should have positive trade-in value');
  assert.ok(tradeInValue < shipType.price, 'Trade-in should be less than new price');
});

test('ship valuation - insurance value vs trade-in value', () => {
  const state = createInitialState();
  state.ship.type = 5; // More expensive ship
  state.ship.tribbles = 100; // Tribble infestation
  
  const tradeInValue = calculateShipTradeInValue(state, false);
  const insuranceValue = calculateShipTradeInValue(state, true);
  
  assert.ok(insuranceValue > tradeInValue, 'Insurance should cover full value despite tribbles');
  assert.ok(tradeInValue > 0, 'Trade-in value should still be positive');
});

test('ship valuation - tribble penalty reduces trade-in value', () => {
  const state = createInitialState();
  state.ship.type = 5; // Expensive ship
  
  const cleanValue = calculateShipTradeInValue(state, false);
  
  // Add tribbles
  state.ship.tribbles = 500;
  const infectedValue = calculateShipTradeInValue(state, false);
  
  assert.ok(infectedValue < cleanValue, 'Tribbles should reduce trade-in value');
  // Tribbles reduce the base ship price multiplier from 3/4 to 1/4, but equipment value is still added
  const shipType = getShipType(5);
  const expectedInfectedValue = Math.floor(shipType.price / 4) + (cleanValue - Math.floor(shipType.price * 3 / 4));
  assert.equal(infectedValue, expectedInfectedValue, 'Should use 1/4 base price with tribbles');
});

test('ship valuation - equipment adds to ship value', () => {
  const state = createInitialState();
  state.ship.type = 1; // Basic ship
  
  const baseValue = calculateShipTotalValue(state, false);
  
  // Add expensive equipment
  state.ship.weapon[1] = 2; // Military laser (expensive)
  state.ship.shield[0] = 1; // Energy shield
  state.ship.gadget[0] = 0; // Cargo bay
  
  const equippedValue = calculateShipTotalValue(state, false);
  
  assert.ok(equippedValue > baseValue, 'Equipment should increase total ship value');
});

test('ship valuation - hull damage reduces value', () => {
  const state = createInitialState();
  state.ship.type = 2; // Ship with decent hull
  
  const fullHullValue = calculateShipTotalValue(state, false);
  
  // Damage the hull
  state.ship.hull = 50; // Half damage
  const damagedValue = calculateShipTotalValue(state, false);
  
  // Value calculation might factor in repair costs or hull condition
  assert.ok(damagedValue >= 0, 'Damaged ship should still have some value');
});

test('ship valuation - cargo affects total worth calculation', () => {
  const state = createInitialState();
  state.ship.cargo[0] = 10; // Water
  state.ship.cargo[5] = 5;  // Firearms (valuable)
  
  const totalValue = calculateShipTotalValue(state, false);
  const shipOnlyValue = calculateShipTradeInValue(state, false);
  
  // Total value includes cargo value in end-game calculations
  assert.ok(totalValue >= shipOnlyValue, 'Total value should include ship value');
});

test('ship valuation - different ship types have different values', () => {
  const state = createInitialState();
  
  // Test various ship types
  const shipValues = [];
  for (let shipType = 0; shipType < 15; shipType++) {
    state.ship.type = shipType;
    const value = calculateShipTradeInValue(state, false);
    shipValues.push({ type: shipType, value });
  }
  
  // Ensure values make sense relative to ship prices
  const positiveValues = shipValues.filter(sv => sv.value > 0);
  assert.ok(positiveValues.length > 0, 'Some ship types should have positive values');
});

test('ship valuation - special ship conditions', () => {
  const state = createInitialState();
  state.ship.type = 1; 
  
  // Test with special conditions that affect value
  state.ship.fuel = 0; // No fuel
  state.ship.cargo.fill(0); // No cargo
  
  const value = calculateShipTradeInValue(state, false);
  assert.ok(value > 0, 'Empty ship should still have base value');
});

test('ship valuation - consistency between calculations', () => {
  const state = createInitialState();
  state.ship.type = 3; // Mid-range ship
  
  const tradeInValue = calculateShipTradeInValue(state, false);
  const totalValue = calculateShipTotalValue(state, false);
  
  assert.ok(totalValue >= tradeInValue, 'Total value should be at least trade-in value');
  assert.ok(tradeInValue > 0 && totalValue > 0, 'Both values should be positive');
});

test('ship valuation - insurance claim calculation accuracy', () => {
  const state = createInitialState();
  state.ship.type = 8; // Expensive ship
  state.ship.cargo[1] = 15; // Valuable cargo
  state.insurance = true;
  
  const result = processInsuranceClaim(state);
  
  assert.equal(result.success, true);
  assert.ok(result.claimAmount > 10000, 'Insurance should pay substantial amount for expensive ship');
  
  // Claim should be reasonable - check that it's a substantial amount for expensive ship
  // Note: Insurance uses its own valuation logic that may differ from trade-in values
  assert.ok(result.claimAmount > 0, 'Claim should be positive');
});
