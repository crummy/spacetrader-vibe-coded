// Space Monster Hull Regeneration Tests
// Tests for the daily 5% hull regeneration feature from Palm OS Traveler.c lines 577-579

import { test } from 'node:test';
import assert from 'node:assert';
import { createInitialState } from '../state.ts';
import { advanceTime } from '../engine/game.ts';
import { getShipType } from '../data/shipTypes.ts';

test('space monster hull regeneration - 5% daily increase up to max', () => {
  const state = createInitialState();
  
  // Space Monster is at index 10 in ship types
  const spaceMonsterType = getShipType(10);
  const maxHull = spaceMonsterType.hullStrength; // 500
  
  // Start with damaged monster hull (50% damage)
  state.monsterHull = 250;
  
  // Advance one day
  advanceTime(state, 1);
  
  // Hull should increase by 5% (250 * 1.05 = 262.5, floored to 262)
  const expectedHull = Math.floor(250 * 1.05);
  assert.equal(state.monsterHull, expectedHull, 
    `Monster hull should regenerate 5% daily: ${250} -> ${expectedHull}`);
});

test('space monster hull regeneration - caps at maximum hull strength', () => {
  const state = createInitialState();
  
  // Space Monster is at index 10 in ship types
  const spaceMonsterType = getShipType(10);
  const maxHull = spaceMonsterType.hullStrength; // 500
  
  // Start close to max hull (within 5% of max)
  state.monsterHull = 490; // 490 * 1.05 = 514.5, should be capped at 500
  
  // Advance one day
  advanceTime(state, 1);
  
  // Hull should be capped at maximum
  assert.equal(state.monsterHull, maxHull,
    `Monster hull should be capped at maximum: ${maxHull}`);
});

test('space monster hull regeneration - handles zero hull (monster not spawned)', () => {
  const state = createInitialState();
  
  // Monster not spawned yet
  state.monsterHull = 0;
  
  // Advance one day
  advanceTime(state, 1);
  
  // Hull should remain 0 (monster not spawned)
  assert.equal(state.monsterHull, 0,
    'Monster hull should remain 0 when monster is not spawned');
});

test('space monster hull regeneration - multiple days compound correctly', () => {
  const state = createInitialState();
  
  // Space Monster is at index 10 in ship types  
  const spaceMonsterType = getShipType(10);
  const maxHull = spaceMonsterType.hullStrength; // 500
  
  // Start with low hull
  state.monsterHull = 100;
  
  // Advance multiple days and check compounding
  advanceTime(state, 3);
  
  // After 3 days: 100 * 1.05^3 = 115.7625, floored each day
  // Day 1: floor(100 * 1.05) = 105
  // Day 2: floor(105 * 1.05) = 110  
  // Day 3: floor(110 * 1.05) = 115
  assert.equal(state.monsterHull, 115,
    'Monster hull should compound correctly over multiple days');
});

test('space monster hull regeneration - already at max hull remains unchanged', () => {
  const state = createInitialState();
  
  // Space Monster is at index 10 in ship types
  const spaceMonsterType = getShipType(10);  
  const maxHull = spaceMonsterType.hullStrength; // 500
  
  // Start at maximum hull
  state.monsterHull = maxHull;
  
  // Advance one day
  advanceTime(state, 1);
  
  // Hull should remain at maximum
  assert.equal(state.monsterHull, maxHull,
    'Monster hull at maximum should remain unchanged');
});

test('space monster hull regeneration - fractional regeneration is floored', () => {
  const state = createInitialState();
  
  // Set hull to a value that results in fractional regeneration
  state.monsterHull = 101; // 101 * 1.05 = 106.05
  
  // Advance one day
  advanceTime(state, 1);
  
  // Should be floored to 106
  assert.equal(state.monsterHull, 106,
    'Fractional hull regeneration should be floored');
});

test('space monster hull regeneration - very low hull regenerates slowly', () => {
  const state = createInitialState();
  
  // Start with very low hull
  state.monsterHull = 1;
  
  // Advance one day  
  advanceTime(state, 1);
  
  // 1 * 1.05 = 1.05, floored to 1 (no change)
  assert.equal(state.monsterHull, 1,
    'Very low hull values should regenerate slowly or not at all');
  
  // Set to a value that will actually regenerate
  state.monsterHull = 20;
  advanceTime(state, 1);
  
  // 20 * 1.05 = 21
  assert.equal(state.monsterHull, 21,
    'Hull should regenerate when value is high enough');
});

test('space monster hull regeneration - regenerates towards full health over time', () => {
  const state = createInitialState();
  
  // Space Monster is at index 10 in ship types
  const spaceMonsterType = getShipType(10);
  const maxHull = spaceMonsterType.hullStrength; // 500
  
  // Start with severely damaged monster
  state.monsterHull = 50; // 10% health
  
  // Advance many days (simulate natural regeneration)
  advanceTime(state, 50);
  
  // After 50 days of 5% regeneration, should be much higher but still capped
  assert.ok(state.monsterHull > 50, 'Hull should regenerate significantly over time');
  assert.ok(state.monsterHull <= maxHull, 'Hull should never exceed maximum');
  
  // If we've reached max, verify it's exactly max
  if (state.monsterHull === maxHull) {
    assert.equal(state.monsterHull, maxHull, 'Hull should cap at exactly maximum value');
  }
});
