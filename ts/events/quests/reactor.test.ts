// Reactor Quest Tests

import { describe, test } from 'node:test';
import assert from 'node:assert';
import { createInitialState } from '../../state.ts';
import { getTotalCargoBays } from '../../economy/trading.ts';
import type { MutableTradeItemArray } from '../../types.ts';
import { 
  startReactorQuest,
  advanceReactorQuest,
  getAvailableCargoBays,
  checkReactorWarnings,
  completeReactorDelivery,
  isReactorQuestAvailable,
  isReactorDeliveryAvailable
} from './reactor.ts';

describe('Reactor Quest', () => {
  
  test('should start reactor quest with sufficient cargo space', () => {
    const state = createInitialState();
    const stateAtNix = {
      ...state,
      currentSystem: 67, // Nix system index
      credits: 2000,
      ship: { ...state.ship, type: 2, cargo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as MutableTradeItemArray } // Firefly with 20 cargo bays
    };
    
    const result = startReactorQuest(stateAtNix);
    
    assert.strictEqual(result.reactorStatus, 1);
    assert.strictEqual(result.credits, 1000); // 2000 - 1000 cost
  });
  
  test('should fail to start quest without enough cargo bays', () => {
    const state = createInitialState();
    const stateWithFullCargo = {
      ...state,
      currentSystem: 67, // Nix system index
      ship: { 
        ...state.ship,
        type: 1, // Gnat with 15 cargo bays 
        cargo: [2, 2, 2, 2, 2, 1, 1, 1, 1, 1] as MutableTradeItemArray // 16 units total, only -1 empty (invalid)
      }
    };
    
    assert.throws(() => {
      startReactorQuest(stateWithFullCargo);
    }, /Not enough cargo bays/);
  });
  
  test('should fail to start quest with Wild aboard', () => {
    const state = createInitialState();
    const stateWithWild = {
      ...state,
      currentSystem: 67, // Nix system index
      wildStatus: 1,
      ship: { ...state.ship, type: 2, cargo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as MutableTradeItemArray } // Firefly with 20 cargo bays
    };
    
    assert.throws(() => {
      startReactorQuest(stateWithWild);
    }, /Wild refuses to stay aboard/);
  });
  
  test('should advance reactor status each day', () => {
    const state = createInitialState();
    const stateWithReactor = {
      ...state,
      reactorStatus: 5
    };
    
    const result = advanceReactorQuest(stateWithReactor);
    
    assert.strictEqual(result.reactorStatus, 6);
  });
  
  test('should trigger meltdown at day 20 without escape pod', () => {
    const state = createInitialState();
    const stateNearMeltdown = {
      ...state,
      reactorStatus: 19,
      ship: { ...state.ship },
      escapePod: false
    };
    
    const result = advanceReactorQuest(stateNearMeltdown);
    
    assert.strictEqual(result.gameStatus, 'ended');
    assert.strictEqual(result.reactorStatus, 0);
  });
  
  test('should escape with pod during meltdown', () => {
    const state = createInitialState();
    const stateNearMeltdown = {
      ...state,
      reactorStatus: 19,
      ship: { ...state.ship },
      escapePod: true,
      credits: 2000
    };
    
    const result = advanceReactorQuest(stateNearMeltdown);
    
    assert.strictEqual(result.reactorStatus, 0);
    assert.strictEqual(result.ship.hull, 1);
    assert.strictEqual(result.credits, 1000); // 2000 - 1000 escape cost
  });
  
  test('should calculate cargo bay reduction correctly', () => {
    const state = createInitialState();
    const baseState = { ...state, ship: { ...state.ship, type: 2 } }; // Firefly with 20 cargo bays
    
    const totalBays = getTotalCargoBays(baseState);

    
    // Day 1: 20 - (5 + 10 - 0/2) = 20 - 15 = 5 bays available
    const day1State = { ...baseState, reactorStatus: 1 };
    assert.strictEqual(getAvailableCargoBays(day1State), totalBays - 15);
    
    // Day 2: 20 - (5 + 10 - 1/2) = 20 - 15 = 5 bays available  
    const day2State = { ...baseState, reactorStatus: 2 };
    assert.strictEqual(getAvailableCargoBays(day2State), totalBays - 15);
    
    // Day 10: 20 - (5 + 10 - 9/2) = 20 - (15 - 4) = 20 - 11 = 9 bays available
    const day10State = { ...baseState, reactorStatus: 10 };
    assert.strictEqual(getAvailableCargoBays(day10State), totalBays - 11);
    
    // Day 20: 20 - (5 + 10 - 19/2) = 20 - (15 - 9) = 20 - 6 = 14 bays available
    const day20State = { ...baseState, reactorStatus: 20 };
    assert.strictEqual(getAvailableCargoBays(day20State), totalBays - 6);
  });
  
  test('should provide warnings at correct days', () => {
    const state = createInitialState();
    
    // Day 2 warning
    const day2State = { ...state, reactorStatus: 2 };
    const day2Warnings = checkReactorWarnings(day2State);
    assert.strictEqual(day2Warnings.length, 1);
    assert(day2Warnings[0].includes('FUEL CONSUMPTION'));
    
    // Day 16 warning
    const day16State = { ...state, reactorStatus: 16 };
    const day16Warnings = checkReactorWarnings(day16State);
    assert.strictEqual(day16Warnings.length, 1);
    assert(day16Warnings[0].includes('NOISE'));
    
    // Day 18 warning
    const day18State = { ...state, reactorStatus: 18 };
    const day18Warnings = checkReactorWarnings(day18State);
    assert.strictEqual(day18Warnings.length, 1);
    assert(day18Warnings[0].includes('SMOKE'));
  });
  
  test('should complete reactor delivery at Utopia', () => {
    const state = createInitialState();
    const stateWithReactor = {
      ...state,
      currentSystem: 119, // Utopia system index
      reactorStatus: 10,
      credits: 5000
    };
    
    const result = completeReactorDelivery(stateWithReactor);
    
    assert.strictEqual(result.reactorStatus, 21);
    assert.strictEqual(result.credits, 25000); // 5000 + 20000 reward
  });
  
  test('should check quest availability at Nix', () => {
    const state = createInitialState();
    const stateAtNix = {
      ...state,
      currentSystem: 67, // Nix system index
      reactorStatus: 0
    };
    
    assert.strictEqual(isReactorQuestAvailable(stateAtNix), true);
    
    const stateWithReactor = {
      ...stateAtNix,
      reactorStatus: 5
    };
    
    assert.strictEqual(isReactorQuestAvailable(stateWithReactor), false);
  });
  
  test('should check delivery availability at Utopia', () => {
    const state = createInitialState();
    const stateAtUtopia = {
      ...state,
      currentSystem: 119, // Utopia system index
      reactorStatus: 10
    };
    
    assert.strictEqual(isReactorDeliveryAvailable(stateAtUtopia), true);
    
    const stateNoReactor = {
      ...stateAtUtopia,
      reactorStatus: 0
    };
    
    assert.strictEqual(isReactorDeliveryAvailable(stateNoReactor), false);
  });
});
