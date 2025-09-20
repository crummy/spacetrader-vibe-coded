import { test } from 'node:test';
import assert from 'node:assert';
import type { State } from '../types.ts';
import { createInitialState } from '../state.ts';

/**
 * Tests to enforce Palm OS tribble mechanics compliance
 * Based on palm/Src/Traveler.c lines 2293-2318
 */

test('Tribble Growth - Palm OS Compliance', async (t) => {
  await t.test('should use additive growth formula with random factor', () => {
    const state = createInitialState();
    state.nameCommander = 'Test';
    state.ship.tribbles = 10;
    
    // Palm OS formula: Ship.Tribbles += 1 + GetRandom( max( 1, (Ship.Tribbles >> (FoodOnBoard ? 0 : 1)) ) );
    // Without food: shift right by 1 (divide by 2)
    // With food: no shift
    const initialTribbles = state.ship.tribbles;
    
    // Test multiple growth cycles to verify additive nature
    for (let i = 0; i < 5; i++) {
      const beforeGrowth = state.ship.tribbles;
      applyPalmTribblesGrowth(state, false); // No food on board
      
      // Should grow by 1 + random(1 to tribbles/2)
      const growth = state.ship.tribbles - beforeGrowth;
      assert.ok(growth >= 1, `Growth should be at least 1, was ${growth}`);
      assert.ok(growth <= 1 + Math.floor(beforeGrowth / 2), `Growth should be at most 1 + ${Math.floor(beforeGrowth / 2)}, was ${growth}`);
    }
  });

  await t.test('should multiply dramatically when food is present', () => {
    const state = createInitialState();
    state.ship.tribbles = 10;
    state.ship.cargo = [5, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 5 water (food)
    
    const beforeTribbles = state.ship.tribbles;
    const beforeFood = state.ship.cargo[0];
    
    applyPalmTribblesGrowth(state, true); // Food on board
    
    // With food: Ship.Tribbles += 100 + GetRandom(FoodOnBoard * 100)
    // Plus regular growth: 1 + GetRandom(tribbles)
    assert.ok(state.ship.tribbles > beforeTribbles + 100, 'Should grow by at least 100 with food');
    assert.strictEqual(state.ship.cargo[0], beforeFood - 1, 'Should consume 1 unit of food');
  });

  await t.test('should cap at MAXTRIBBLES (100,000)', () => {
    const state = createInitialState();
    state.ship.tribbles = 99_950; // Near max
    
    applyPalmTribblesGrowth(state, false);
    
    assert.ok(state.ship.tribbles <= 100_000, 'Tribbles should not exceed MAXTRIBBLES');
  });

  await t.test('should show infestation message at MAXTRIBBLES', () => {
    const state = createInitialState();
    state.ship.tribbles = 100_000;
    
    const message = getTribblesStatusMessage(state);
    assert.ok(message.includes('infestation'), 'Should show infestation message at max tribbles');
  });

  await t.test('should show threshold messages at specific levels', () => {
    const state = createInitialState();
    
    // Test specific thresholds from Palm OS lines 2309-2318
    const thresholds = [
      { count: 100, expected: 'cute, furry' },
      { count: 1000, expected: 'many' },
      { count: 10000, expected: 'attack' },
      { count: 50000, expected: 'dangerous' }
    ];
    
    for (const threshold of thresholds) {
      state.ship.tribbles = threshold.count;
      const message = getTribblesStatusMessage(state);
      assert.ok(message.includes(threshold.expected), 
        `At ${threshold.count} tribbles, should mention "${threshold.expected}"`);
    }
  });

  await t.test('should not grow when tribbles count is 0', () => {
    const state = createInitialState();
    state.ship.tribbles = 0;
    
    applyPalmTribblesGrowth(state, false);
    
    assert.strictEqual(state.ship.tribbles, 0, 'Zero tribbles should not grow');
  });
});

// Helper functions implemented using the Palm-compliant tribble system
import { applyPalmTribblesGrowth, getTribblesStatusMessage } from './tribbles-palm.ts';
