// Insurance No-Claim Bonus Tests
import { test } from 'node:test';
import assert from 'node:assert';

import { createInitialState } from './state.ts';
import { advanceTime } from './engine/game.ts';

test('insurance no-claim bonus - increments daily when insurance active', () => {
  const state = createInitialState();
  state.insurance = true;
  state.noClaim = 0;
  
  const initialNoClaim = state.noClaim;
  
  // Advance time by 1 day
  advanceTime(state, 1);
  
  assert.equal(state.noClaim, initialNoClaim + 1, 'No-claim bonus should increment by 1 after 1 day with insurance');
});

test('insurance no-claim bonus - increments by multiple days when insurance active', () => {
  const state = createInitialState();
  state.insurance = true;
  state.noClaim = 5;
  
  const initialNoClaim = state.noClaim;
  const days = 3;
  
  // Advance time by multiple days
  advanceTime(state, days);
  
  assert.equal(state.noClaim, initialNoClaim + days, `No-claim bonus should increment by ${days} after ${days} days with insurance`);
});

test('insurance no-claim bonus - does not increment when insurance inactive', () => {
  const state = createInitialState();
  state.insurance = false;
  state.noClaim = 10;
  
  const initialNoClaim = state.noClaim;
  
  // Advance time by 1 day
  advanceTime(state, 1);
  
  assert.equal(state.noClaim, initialNoClaim, 'No-claim bonus should not change when insurance is inactive');
});

test('insurance no-claim bonus - handles zero initial value', () => {
  const state = createInitialState();
  state.insurance = true;
  state.noClaim = 0;
  
  // Advance time by 1 day
  advanceTime(state, 1);
  
  assert.equal(state.noClaim, 1, 'No-claim bonus should increment from 0 to 1');
});

test('insurance no-claim bonus - maintains existing bonus when insurance deactivated', () => {
  const state = createInitialState();
  state.insurance = true;
  state.noClaim = 15;
  
  // Advance time with insurance active
  advanceTime(state, 2);
  assert.equal(state.noClaim, 17, 'Should increment with insurance active');
  
  // Deactivate insurance and advance time
  state.insurance = false;
  advanceTime(state, 3);
  
  assert.equal(state.noClaim, 17, 'No-claim bonus should remain unchanged when insurance is deactivated');
});

test('insurance no-claim bonus - can accumulate to high values', () => {
  const state = createInitialState();
  state.insurance = true;
  state.noClaim = 85; // Close to max discount
  
  // Advance time by 10 days
  advanceTime(state, 10);
  
  assert.equal(state.noClaim, 95, 'No-claim bonus should accumulate beyond the 90% discount cap');
});
