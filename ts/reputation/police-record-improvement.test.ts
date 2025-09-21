// Police Record Time-Based Improvement Tests
// Testing the daily police record improvement logic from Palm OS Traveler.c lines 580-589
import { test } from 'node:test';
import assert from 'node:assert';

import { createInitialState } from '../state.ts';
import { Difficulty } from '../types.ts';
import { CLEAN_SCORE, DUBIOUS_SCORE } from './police.ts';
import { advanceTime } from '../engine/game.ts';

test('police record improvement - good records improve every 3 days', () => {
  const state = createInitialState();
  state.policeRecordScore = 10; // Above CLEAN_SCORE (0)
  state.difficulty = Difficulty.Normal;

  // Day 0 - no change
  advanceTime(state, 1);
  assert.equal(state.policeRecordScore, 10, 'Day 1: No change expected');

  // Day 1 - no change  
  advanceTime(state, 1);
  assert.equal(state.policeRecordScore, 10, 'Day 2: No change expected');

  // Day 2 - should improve (days=3, 3%3=0)
  advanceTime(state, 1);
  assert.equal(state.policeRecordScore, 9, 'Day 3: Good record should improve by 1');

  // Days 3,4 - no change
  advanceTime(state, 2);
  assert.equal(state.policeRecordScore, 9, 'Days 4-5: No change expected');

  // Day 5 - should improve again (days=6, 6%3=0)
  advanceTime(state, 1);
  assert.equal(state.policeRecordScore, 8, 'Day 6: Good record should improve by 1 again');
});

test('police record improvement - clean record (0) does not improve', () => {
  const state = createInitialState();
  state.policeRecordScore = CLEAN_SCORE; // Exactly at clean (0)
  state.difficulty = Difficulty.Normal;

  // Advance 6 days (two 3-day cycles)
  advanceTime(state, 6);
  
  assert.equal(state.policeRecordScore, CLEAN_SCORE, 'Clean record (0) should not improve');
});

test('police record improvement - criminal records improve daily on Easy/Normal', () => {
  // Test Easy difficulty
  const easyState = createInitialState();
  easyState.policeRecordScore = -20; // Below DUBIOUS_SCORE (-5)
  easyState.difficulty = Difficulty.Easy;

  advanceTime(easyState, 3);
  assert.equal(easyState.policeRecordScore, -17, 'Easy: Criminal record should improve by 1 each day');

  // Test Normal difficulty  
  const normalState = createInitialState();
  normalState.policeRecordScore = -30; // Below DUBIOUS_SCORE (-5)
  normalState.difficulty = Difficulty.Normal;

  advanceTime(normalState, 4);
  assert.equal(normalState.policeRecordScore, -26, 'Normal: Criminal record should improve by 1 each day');
});

test('police record improvement - criminal records improve periodically on Hard', () => {
  const state = createInitialState();
  state.policeRecordScore = -15; // Below DUBIOUS_SCORE (-5)  
  state.difficulty = Difficulty.Hard; // Difficulty = 3

  // Days 1,2 - no improvement, Day 3 - should improve (3%3=0)
  advanceTime(state, 3);
  assert.equal(state.policeRecordScore, -14, 'Hard: Should improve on day 3 (divisible by difficulty)');

  // Days 4,5 - no improvement
  advanceTime(state, 2);
  assert.equal(state.policeRecordScore, -14, 'Hard: No improvement on days 4-5');

  // Day 6 - should improve (days=6, 6%3=0)
  advanceTime(state, 1);
  assert.equal(state.policeRecordScore, -13, 'Hard: Should improve on day 6 (divisible by difficulty)');
});

test('police record improvement - criminal records improve periodically on Impossible', () => {
  const state = createInitialState();
  state.policeRecordScore = -25; // Below DUBIOUS_SCORE (-5)
  state.difficulty = Difficulty.Impossible; // Difficulty = 4

  // Days 1,2,3 - no improvement, Day 4 - should improve (4%4=0)  
  advanceTime(state, 4);
  assert.equal(state.policeRecordScore, -24, 'Impossible: Should improve on day 4 (divisible by difficulty)');

  // Days 5,6,7 - no improvement
  advanceTime(state, 3);
  assert.equal(state.policeRecordScore, -24, 'Impossible: No improvement on days 5-7');

  // Day 8 - should improve (days=8, 8%4=0)
  advanceTime(state, 1);
  assert.equal(state.policeRecordScore, -23, 'Impossible: Should improve on day 8 (divisible by difficulty)');
});

test('police record improvement - dubious record (-5) does not improve as criminal', () => {
  const state = createInitialState();
  state.policeRecordScore = DUBIOUS_SCORE; // Exactly at dubious (-5) 
  state.difficulty = Difficulty.Easy;

  // Advance several days - should not improve as it's not < DUBIOUS_SCORE
  advanceTime(state, 5);
  
  assert.equal(state.policeRecordScore, DUBIOUS_SCORE, 'Dubious record (-5) should not improve as criminal');
});

test('police record improvement - both good and criminal record improvement can apply', () => {
  // Test case where record could theoretically qualify for both types of improvement
  // This shouldn't happen in practice but tests the priority
  
  const state = createInitialState();
  state.policeRecordScore = -5; // At DUBIOUS_SCORE boundary  
  state.difficulty = Difficulty.Easy;

  // This record is not < DUBIOUS_SCORE so criminal improvement doesn't apply
  // This record is not > CLEAN_SCORE so good improvement doesn't apply
  advanceTime(state, 5);
  
  assert.equal(state.policeRecordScore, -5, 'Boundary record should not improve by either rule');
});

test('police record improvement - beginner difficulty criminal record improvement', () => {
  const state = createInitialState();
  state.policeRecordScore = -40; // Below DUBIOUS_SCORE (-5)
  state.difficulty = Difficulty.Beginner; // Difficulty = 0

  // Since Difficulty.Beginner (0) <= Difficulty.Normal (2), should improve daily
  advanceTime(state, 3);
  assert.equal(state.policeRecordScore, -37, 'Beginner: Criminal record should improve by 1 each day');
});

test('police record improvement - mixed record types over long period', () => {
  const state = createInitialState();
  state.policeRecordScore = -10; // Criminal record
  state.difficulty = Difficulty.Normal;

  // Advance enough time for criminal record to reach dubious (-5)
  // Criminal records only improve to DUBIOUS_SCORE (-5), not CLEAN_SCORE (0)
  advanceTime(state, 10); // 5 days to improve from -10 to -5

  assert.equal(state.policeRecordScore, -5, 'Criminal record should improve to dubious (-5) threshold');
  
  // Now it's at dubious (-5), continue and it should not improve further
  // since it no longer qualifies as criminal (< -5)
  advanceTime(state, 5);
  assert.equal(state.policeRecordScore, -5, 'Dubious record should not improve as criminal');
  
  // But if we somehow get it above clean, it should improve every 3 days
  state.policeRecordScore = 1; // Manually set above clean for testing
  advanceTime(state, 3); // This should trigger good record improvement at day 18 (18%3=0)
  assert.equal(state.policeRecordScore, 0, 'Good record should improve back toward clean every 3 days');
});

test('police record improvement - extreme values handling', () => {
  // Test very negative criminal record
  const criminalState = createInitialState();
  criminalState.policeRecordScore = -100; // Very bad record
  criminalState.difficulty = Difficulty.Easy;

  advanceTime(criminalState, 5);
  assert.equal(criminalState.policeRecordScore, -95, 'Very bad criminal record should still improve daily on Easy');
  
  // Test very positive good record
  const goodState = createInitialState();  
  goodState.policeRecordScore = 50; // Very good record
  goodState.difficulty = Difficulty.Normal;

  advanceTime(goodState, 3); // Should improve on day 3
  assert.equal(goodState.policeRecordScore, 49, 'Very good record should still improve every 3 days');
});
