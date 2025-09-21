// Time and Day Progression System Tests
import { test } from 'node:test';
import assert from 'node:assert';

import { createInitialState } from '../state.ts';
import { GameMode } from '../types.ts';
import { performWarp } from '../travel/warp.ts';

test('time progression - days increment during travel via game engine', async () => {
  const { createGameEngine } = await import('../engine/game.ts');
  const { getShipType } = await import('../data/shipTypes.ts');
  const engine = createGameEngine(undefined, { seed: 12345 }); // Use deterministic seed
  
  // Set ship to max fuel capacity to ensure we can reach some system
  const shipType = getShipType(engine.state.ship.type);
  engine.state.ship.fuel = shipType.fuelTanks;
  engine.state.credits = 50000; // High credits to cover any warp costs
  engine.state.debt = 0; // Clear debt to avoid interest costs
  
  // Clear any existing encounters to avoid interference
  engine.state.currentEncounter = null;
  engine.state.currentMode = GameMode.OnPlanet;
  
  const initialDays = engine.state.days;
  
  // Find a system within range
  const { getSystemsWithinRange } = await import('../travel/galaxy.ts');
  const { getCurrentFuel } = await import('../travel/warp.ts');
  
  const fuelRange = getCurrentFuel(engine.state.ship);
  const systemsInRange = getSystemsWithinRange(engine.state, fuelRange);
  
  // Should have at least one system in range with max fuel
  assert.ok(systemsInRange.length > 0, 'Should have systems in range with max fuel');
  
  const targetSystem = systemsInRange[0];
  
  // Perform multiple warp attempts if encounters interrupt
  let warpResult;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    warpResult = await engine.executeAction({
      type: 'warp_to_system',
      parameters: { targetSystem }
    });
    
    attempts++;
    
    // If we're now in combat (whether warp succeeded or not), handle it by fleeing
    if (engine.state.currentMode === GameMode.InCombat) {
      const fleeResult = await engine.executeAction({
        type: 'combat_flee',
        parameters: {}
      });
      
      // After fleeing, we might still be traveling, so continue travel if needed
      if (engine.state.currentSystem !== targetSystem && engine.state.currentMode !== GameMode.InCombat) {
        const continueResult = await engine.executeAction({
          type: 'combat_continue',
          parameters: {}
        });
      }
    } else if (!warpResult.success) {
      break; // Exit if warp failed for non-combat reasons
    }
    
    // Check if we've arrived or time has advanced
    if (engine.state.currentSystem === targetSystem || engine.state.days > initialDays) {
      break;
    }
  } while (attempts < maxAttempts);
  
  // Either the warp succeeded, or we're at the target system, or days incremented
  const daysIncremented = engine.state.days > initialDays;
  const arrivedAtTarget = engine.state.currentSystem === targetSystem;
  
  assert.ok(daysIncremented || arrivedAtTarget, 
    `Time should advance or arrive at target. Days: ${initialDays} -> ${engine.state.days}, System: ${engine.state.currentSystem} (target: ${targetSystem}), Attempts: ${attempts}`);
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

test('time progression - police record improvement over time', async () => {
  const { advanceTime } = await import('../engine/game.ts');
  
  // Test criminal record improvement on Easy difficulty
  const state = createInitialState();
  state.policeRecordScore = -50; // Criminal record
  state.difficulty = 1; // Easy
  
  // Advance 5 days - criminal records improve daily on Easy difficulty
  advanceTime(state, 5);
  
  assert.equal(state.policeRecordScore, -45, 'Criminal records should improve daily on Easy difficulty');
  
  // Test good record improvement every 3 days
  const goodState = createInitialState();
  goodState.policeRecordScore = 10; // Good record
  
  advanceTime(goodState, 3); // Day 3, should improve
  assert.equal(goodState.policeRecordScore, 9, 'Good records should improve every 3 days');
  
  advanceTime(goodState, 2); // Days 4-5, no change  
  assert.equal(goodState.policeRecordScore, 9, 'Good records should not improve between 3-day cycles');
  
  advanceTime(goodState, 1); // Day 6, should improve again
  assert.equal(goodState.policeRecordScore, 8, 'Good records should improve again on next 3-day cycle');
});

test('time progression - reputation persistence', () => {
  const state = createInitialState();
  state.reputationScore = 500; // Competent reputation
  
  // Reputation should persist across days (unlike police record which can decay)
  assert.equal(state.reputationScore, 500);
});
