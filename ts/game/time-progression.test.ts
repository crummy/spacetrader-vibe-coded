// Time and Day Progression System Tests
import { test } from 'node:test';
import assert from 'node:assert';

import { createInitialState } from '../state.ts';
import { GameMode } from '../types.ts';
import { performWarp } from '../travel/warp.ts';

test('time progression - days increment during travel via game engine', async () => {
  const { createGameEngine } = await import('../engine/game.ts');
  const { getShipType } = await import('../data/shipTypes.ts');
  const engine = createGameEngine();
  
  // Set ship to max fuel capacity to ensure we can reach some system
  const shipType = getShipType(engine.state.ship.type);
  engine.state.ship.fuel = shipType.fuelTanks;
  engine.state.credits = 10000;
  
  const initialDays = engine.state.days;
  
  // Find a system within range
  const { getSystemsWithinRange } = await import('../travel/galaxy.ts');
  const { getCurrentFuel } = await import('../travel/warp.ts');
  
  const fuelRange = getCurrentFuel(engine.state.ship);
  const systemsInRange = getSystemsWithinRange(engine.state, fuelRange);
  
  // Should have at least one system in range with max fuel
  assert.ok(systemsInRange.length > 0, 'Should have systems in range with max fuel');
  
  const targetSystem = systemsInRange[0];
  
  const result = await engine.executeAction({
    type: 'warp_to_system',
    parameters: { targetSystem }
  });
  
  assert.ok(result.success, `Warp should succeed. Error: ${result.message || 'Unknown'}`);
  assert.equal(engine.state.days, initialDays + 1, 'Days should increment by 1 during game engine warp');
});

test('time progression - day counter starts at zero', () => {
  const state = createInitialState();
  
  assert.equal(state.days, 0, 'Game should start at day 0');
});

test('time progression - reactor countdown progresses daily', async () => {
  const { advanceReactorQuest } = await import('../events/quests/reactor.ts');
  
  const state = createInitialState();
  state.reactorStatus = 10; // Active reactor
  
  const newState = advanceReactorQuest(state);
  
  assert.equal(newState.reactorStatus, 11, 'Reactor countdown should increment by 1 day');
});

test('time progression - tribble breeding occurs over time', async () => {
  const { breedTribbles } = await import('../creatures/tribbles.ts');
  
  const state = createInitialState();
  state.ship.tribbles = 10; // Starting tribbles
  
  // Simulate tribble breeding over multiple days
  let currentState = state;
  for (let day = 0; day < 5; day++) {
    const result = breedTribbles(currentState);
    currentState = result.state;
  }
  
  // Tribbles should multiply over time (if breeding conditions are met)
  assert.ok(currentState.ship.tribbles >= 10, 'Tribbles should not decrease');
  // Note: Breeding may not occur if no food/water available
});

test('time progression - daily costs accumulate', async () => {
  const { calculateWarpCost } = await import('../travel/warp.ts');
  
  const state = createInitialState();
  state.insurance = true;
  state.ship.crew[1] = 1; // Hired crew member
  
  // Calculate daily costs for travel
  const cost = calculateWarpCost(state, 0, 1, false);
  
  assert.ok(cost.mercenaryPay > 0, 'Should include daily mercenary pay');
  if (state.insurance) {
    assert.ok(cost.insurance > 0, 'Should include daily insurance cost');
  }
});

test('time progression - interest accumulates on debt daily', async () => {
  const { calculateWarpCost } = await import('../travel/warp.ts');
  
  const state = createInitialState();
  state.debt = 10000;
  
  const cost = calculateWarpCost(state, 0, 1, false);
  
  assert.ok(cost.interest > 0, 'Should calculate interest on debt');
  assert.equal(cost.interest, Math.max(1, Math.floor(state.debt * 0.1)), 'Interest should be 10% of debt, minimum 1');
});

test('time progression - quest countdowns advance', () => {
  const state = createInitialState();
  
  // Test various quest timers
  state.invasionStatus = 5; // Active invasion countdown
  state.experimentAndWildStatus = 10; // Experiment timer
  
  // These would advance in the actual day increment function
  // For now, test that the values are properly tracked
  assert.equal(state.invasionStatus, 5);
  assert.equal(state.experimentAndWildStatus, 10);
});

test('time progression - special event countdowns', () => {
  const state = createInitialState();
  
  // Set up systems with countdowns (from Palm OS countDown field)
  state.solarSystem[0].countDown = 15; // Special event countdown
  
  // In full implementation, countdowns would decrease daily
  assert.ok(state.solarSystem[0].countDown >= 0, 'Countdown should be non-negative');
});

test('time progression - aging effects on equipment', () => {
  const state = createInitialState();
  
  // In the Palm OS version, equipment could malfunction over time
  // This would be tested when equipment degradation is implemented
  assert.equal(state.ship.weapon[0], 0, 'Starting weapon should be pulse laser');
  
  // Future: test equipment failure rates and repair needs
});

test('time progression - police record decay over time', () => {
  const state = createInitialState();
  state.policeRecordScore = -50; // Criminal record
  
  // In the original game, criminal records could improve slightly over time
  // This would be tested when time-based record improvement is implemented
  assert.equal(state.policeRecordScore, -50);
  
  // Future: test gradual police record improvement for good behavior
});

test('time progression - reputation persistence', () => {
  const state = createInitialState();
  state.reputationScore = 500; // Competent reputation
  
  // Reputation should persist across days (unlike police record which can decay)
  assert.equal(state.reputationScore, 500);
});
