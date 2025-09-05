// Insurance System Comprehensive Tests
import { test } from 'node:test';
import assert from 'node:assert';

import { createInitialState } from './state.ts';
import { GameMode } from './types.ts';
import { processInsuranceClaim } from './game/endings.ts';
import { calculateWarpCost } from './travel/warp.ts';

test('insurance - daily premium calculation during travel', () => {
  const state = createInitialState();
  state.insurance = true;
  state.ship.type = 5; // More expensive ship
  
  // Test insurance cost calculation during warp
  const cost = calculateWarpCost(state, 0, 1, false);
  
  assert.ok(cost.insurance > 0, 'Insurance should have daily cost during travel');
  assert.equal(typeof cost.insurance, 'number');
});

test('insurance - no cost when not active', () => {
  const state = createInitialState();
  state.insurance = false;
  
  const cost = calculateWarpCost(state, 0, 1, false);
  
  assert.equal(cost.insurance, 0, 'No insurance cost when not active');
});

test('insurance claim - full ship value when destroyed', () => {
  const state = createInitialState();
  state.insurance = true;
  state.credits = 5000;
  
  const result = processInsuranceClaim(state);
  
  assert.equal(result.success, true);
  assert.ok(result.claimAmount > 0, 'Should receive insurance payout');
  assert.equal(result.state.insurance, false, 'Insurance should be cancelled after claim');
  assert.ok(result.message.includes('Insurance claim processed'));
});

test('insurance claim - no payout without insurance', () => {
  const state = createInitialState();
  state.insurance = false;
  
  const result = processInsuranceClaim(state);
  
  assert.equal(result.success, false);
  assert.equal(result.claimAmount, 0, 'No payout without insurance');
  assert.ok(result.message.includes('No insurance policy'));
});

test('insurance claim - covers partial cargo value', () => {
  const state = createInitialState();
  state.insurance = true;
  state.ship.cargo[0] = 10; // Water
  state.ship.cargo[1] = 5;  // Furs
  
  const result = processInsuranceClaim(state);
  
  assert.equal(result.success, true);
  assert.ok(result.claimAmount > 1000, 'Should cover ship base value'); // Base ship + cargo
  assert.equal(result.state.credits, state.credits + result.claimAmount, 'Credits should include claim');
});

test('insurance claim - tribbles penalty ignored for insurance', () => {
  const state = createInitialState();
  state.insurance = true;
  state.ship.tribbles = 1000; // Many tribbles
  
  const result = processInsuranceClaim(state);
  
  assert.equal(result.success, true);
  // Insurance should cover full value despite tribbles (tested via coverage)
  assert.ok(result.claimAmount > 500, 'Insurance should cover full ship value despite tribbles');
});

test('insurance - state integration after claim', () => {
  const state = createInitialState();
  state.insurance = true;
  state.ship.hull = 0; // Ship destroyed
  
  const result = processInsuranceClaim(state);
  
  assert.equal(result.success, true);
  assert.equal(result.state.insurance, false, 'Policy should expire');
  assert.ok(result.state.credits > state.credits, 'Credits should increase');
  
  // Ship remains destroyed after insurance claim
  assert.equal(result.state.ship.hull, 0, 'Ship should remain destroyed after claim');
  assert.equal(result.state.ship.type, 1, 'Should get basic ship type');
});

test('insurance affordability check during travel', () => {
  const state = createInitialState();
  state.insurance = true;
  state.credits = 10; // Very low credits
  state.debt = 0;
  
  // Should still be able to calculate costs even if can't afford
  const cost = calculateWarpCost(state, 0, 1, false);
  assert.ok(cost.insurance >= 0, 'Insurance cost should be calculable even when unaffordable');
});
