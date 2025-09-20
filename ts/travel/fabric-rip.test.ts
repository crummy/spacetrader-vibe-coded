// Fabric Rip System Tests
// Tests for Dr. Fehler's experiment effects on space-time travel

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../state.ts';
import { randSeed } from '../math/random.ts';
import { 
    FABRICRIP_INITIAL_PROBABILITY, 
    FABRICRIP_DAILY_DECREASE,
    startExperiment,
    stopExperiment, 
    checkFabricRipOccurrence,
    executeFabricRipTravel,
    updateFabricRipProbability
} from './fabric-rip.ts';

test('fabric rip - start experiment initializes probability', () => {
    const state = createInitialState();
    state.fabricRipProbability = 0;
    state.experimentAndWildStatus = 0;

    const result = startExperiment(state);

    assert.equal(result.success, true);
    assert.equal(result.state.fabricRipProbability, FABRICRIP_INITIAL_PROBABILITY);
    assert.equal(result.state.experimentAndWildStatus, 1);
});

test('fabric rip - stop experiment resets probability', () => {
    const state = createInitialState();
    state.fabricRipProbability = 15;
    state.experimentAndWildStatus = 1;

    const result = stopExperiment(state);

    assert.equal(result.success, true);
    assert.equal(result.state.fabricRipProbability, 0);
    assert.equal(result.state.experimentAndWildStatus, 0); // Experiment stopped
});

test('fabric rip - probability decreases daily', () => {
    const state = createInitialState();
    state.fabricRipProbability = 10;
    state.experimentAndWildStatus = 1; // Active experiment

    const result = updateFabricRipProbability(state);

    assert.equal(result.fabricRipProbability, 9);
});

test('fabric rip - probability does not go below zero', () => {
    const state = createInitialState();
    state.fabricRipProbability = 0;
    state.experimentAndWildStatus = 1;

    const result = updateFabricRipProbability(state);

    assert.equal(result.fabricRipProbability, 0);
});

test('fabric rip - no probability decrease when experiment not active', () => {
    const state = createInitialState();
    state.fabricRipProbability = 10;
    state.experimentAndWildStatus = 0; // Not active

    const result = updateFabricRipProbability(state);

    assert.equal(result.fabricRipProbability, 10);
});

test('fabric rip - occurrence check when no experiment', () => {
    const state = createInitialState();
    state.experimentAndWildStatus = 0;
    state.fabricRipProbability = 25;

    // Should never occur without active experiment
    let occurred = false;
    for (let i = 0; i < 100; i++) {
        if (checkFabricRipOccurrence(state)) {
            occurred = true;
            break;
        }
    }

    assert.equal(occurred, false, 'Fabric rip should never occur without active experiment');
});

test('fabric rip - occurrence probability scales with fabricRipProbability', () => {
    const state = createInitialState();
    state.experimentAndWildStatus = 1; // Active experiment
    
    // Test with 0% probability
    state.fabricRipProbability = 0;
    let occurredWithZero = false;
    for (let i = 0; i < 100; i++) {
        if (checkFabricRipOccurrence(state)) {
            occurredWithZero = true;
            break;
        }
    }
    assert.equal(occurredWithZero, false, 'Should never occur with 0% probability');
    
    // Test with 100% probability  
    state.fabricRipProbability = 100;
    const occurredWithHundred = checkFabricRipOccurrence(state);
    assert.equal(occurredWithHundred, true, 'Should always occur with 100% probability');
});

test('fabric rip - travel transports to random system', () => {
    const state = createInitialState();
    state.experimentAndWildStatus = 1; // Active experiment
    const originalSystem = state.currentSystem;
    const numSystems = 120;

    const result = executeFabricRipTravel(state, numSystems);

    // Should transport to a different system
    assert.notEqual(result.destinationSystem, originalSystem, 'Should transport to different system');
    assert.ok(result.destinationSystem >= 0 && result.destinationSystem < numSystems, 'Should be valid system index');
    assert.equal(result.state.alreadyPaidForNewspaper, false, 'Should reset newspaper payment');
});

test('fabric rip - travel with specific target system', () => {
    const state = createInitialState();
    state.experimentAndWildStatus = 1; // Active experiment
    state.currentSystem = 50;
    
    // Use seeded random to get predictable results
    // We need to find a seed that generates the desired target system
    // Let's test a few seeds to find one that works
    let foundSeed = false;
    let targetSystem = -1;
    
    for (let seed = 1; seed <= 100 && !foundSeed; seed++) {
        randSeed(seed);
        const testResult = executeFabricRipTravel(state, 120);
        if (testResult.destinationSystem !== state.currentSystem) {
            targetSystem = testResult.destinationSystem;
            foundSeed = true;
        }
    }
    
    // Now test with the found seed
    if (foundSeed) {
        randSeed(1); // Reset to first seed that worked
        const result = executeFabricRipTravel(state, 120);
        assert.equal(result.destinationSystem, targetSystem);
    } else {
        assert.fail('Could not find a seed that generates a different system');
    }
});

test('fabric rip - complete experiment lifecycle', () => {
    let state = createInitialState();
    
    // Start experiment
    let result = startExperiment(state);
    state = result.state;
    assert.equal(state.fabricRipProbability, FABRICRIP_INITIAL_PROBABILITY);
    assert.equal(state.experimentAndWildStatus, 1);
    
    // Simulate days passing
    for (let day = 0; day < 10; day++) {
        state = updateFabricRipProbability(state);
    }
    
    const expectedProbability = Math.max(0, FABRICRIP_INITIAL_PROBABILITY - (10 * FABRICRIP_DAILY_DECREASE));
    assert.equal(state.fabricRipProbability, expectedProbability);
    
    // Stop experiment
    result = stopExperiment(state);
    state = result.state;
    assert.equal(state.fabricRipProbability, 0);
    assert.equal(state.experimentAndWildStatus, 0);
});

test('fabric rip - probability bounds checking', () => {
    const state = createInitialState();
    
    // Test maximum probability
    state.fabricRipProbability = 150; // Above 100%
    state.experimentAndWildStatus = 1;
    
    // Should still function correctly
    const occurred = checkFabricRipOccurrence(state);
    assert.equal(typeof occurred, 'boolean', 'Should handle high probabilities gracefully');
    
    // Test negative probability
    state.fabricRipProbability = -5;
    const occurredNegative = checkFabricRipOccurrence(state);
    assert.equal(occurredNegative, false, 'Should never occur with negative probability');
});

test('fabric rip - integration with experiment events', () => {
    const state = createInitialState();
    
    // Should start with no experiment
    assert.equal(state.experimentAndWildStatus, 0);
    assert.equal(state.fabricRipProbability, 25); // Initial game state
    
    // Starting experiment should change status and maintain probability
    let result = startExperiment(state);
    const startedState = result.state;
    assert.equal(startedState.experimentAndWildStatus, 1);
    assert.equal(startedState.fabricRipProbability, FABRICRIP_INITIAL_PROBABILITY);
    
    // Should not be able to start again while active
    result = startExperiment(startedState);
    const doubleStartState = result.state;
    assert.equal(result.success, false, 'Should not be able to start again');
    
    // Stopping should end effects
    result = stopExperiment(startedState);
    const stoppedState = result.state;
    assert.equal(stoppedState.experimentAndWildStatus, 0);
    assert.equal(stoppedState.fabricRipProbability, 0);
});
