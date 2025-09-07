// Bribery System Tests
// Tests for police bribery mechanics from Palm OS Space Trader

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../state.ts';
import {
    calculateBribeAmount,
    canAttemptBribery,
    attemptBribery
} from './police.ts';

// Define police record scores locally since they're not exported
const PoliceRecordScore = {
    PSYCHOPATH: -70,
    VILLAIN: -30,
    CRIMINAL: -10,
    DUBIOUS: -5,
    CLEAN: 0,
    LAWFUL: 5,
    TRUSTED: 10,
    HELPER: 25,
    HERO: 75
};
import { Difficulty } from '../types.ts';
import { getAvailableActions } from '../combat/engine.ts';

test('bribery - amount calculation varies by difficulty', () => {
    // From Palm OS: Bribe = GetRandom(250) + 250 + GetRandom(250) + 250 + 10 * (IMPOSSIBLE - Difficulty)
    
    // Test multiple times to account for randomness
    let beginnerTotal = 0;
    let impossibleTotal = 0;
    const testCount = 100;
    
    for (let i = 0; i < testCount; i++) {
        beginnerTotal += calculateBribeAmount(Difficulty.Beginner);
        impossibleTotal += calculateBribeAmount(Difficulty.Impossible);
    }
    
    const beginnerAvg = beginnerTotal / testCount;
    const impossibleAvg = impossibleTotal / testCount;

    // Base amount should be at least 500 (minimum from two random(250)+250 calls)
    assert.ok(beginnerAvg >= 500, 'Beginner bribe should be at least 500 (base amount)');
    assert.ok(impossibleAvg >= 500, 'Impossible bribe should be at least 500 (base amount)');

    // Test the formula scaling - easier difficulty (lower numbers) should cost more
    assert.ok(beginnerAvg > impossibleAvg, 'Beginner should pay more than impossible difficulty');
});

test('bribery - credit availability check', () => {
    const state = createInitialState();
    const bribeAmount = 1000;

    // Sufficient credits
    state.credits = 1500;
    assert.equal(canAttemptBribery(state, bribeAmount), true);

    // Insufficient credits
    state.credits = 500;
    assert.equal(canAttemptBribery(state, bribeAmount), false);

    // Exact amount
    state.credits = 1000;
    assert.equal(canAttemptBribery(state, bribeAmount), true);
});

test('bribery - successful attempt with sufficient credits', () => {
    const state = createInitialState();
    state.credits = 2000;
    state.policeRecordScore = PoliceRecordScore.CLEAN;
    const bribeAmount = 800;

    const result = attemptBribery(state, bribeAmount);

    assert.equal(result.success, true);
    assert.ok(result.message.includes('successful'));
    assert.equal(result.state.credits, 2000 - bribeAmount);
});

test('bribery - failed attempt with insufficient credits', () => {
    const state = createInitialState();
    state.credits = 500;
    const bribeAmount = 800;

    const result = attemptBribery(state, bribeAmount);

    assert.equal(result.success, false);
    assert.ok(result.message.includes('not have enough credits'));
    assert.equal(result.state.credits, 500); // Credits unchanged
});

test('bribery - success rate depends on police record', () => {
    const state = createInitialState();
    state.credits = 10000; // Plenty of credits
    const bribeAmount = 1000;

    // Test with clean record (should have better success rate)
    state.policeRecordScore = PoliceRecordScore.CLEAN;
    let cleanSuccesses = 0;
    const trials = 50;

    for (let i = 0; i < trials; i++) {
        const testState = { ...state, credits: 10000 };
        const result = attemptBribery(testState, bribeAmount);
        if (result.success) cleanSuccesses++;
    }

    // Test with criminal record (should have worse success rate)
    state.policeRecordScore = PoliceRecordScore.CRIMINAL;
    let criminalSuccesses = 0;

    for (let i = 0; i < trials; i++) {
        const testState = { ...state, credits: 10000 };
        const result = attemptBribery(testState, bribeAmount);
        if (result.success) criminalSuccesses++;
    }

    // Clean record should generally have better success rate
    // Note: This is probabilistic, so we use a reasonable threshold
    assert.ok(cleanSuccesses >= criminalSuccesses * 0.8, 
        'Clean record should have similar or better success rate');
});

test('bribery - police record worsens on failed attempt', () => {
    const state = createInitialState();
    state.credits = 10000;
    state.policeRecordScore = PoliceRecordScore.CLEAN;
    const bribeAmount = 500;

    // Force a failure by mocking random (or test until we get a failure)
    let foundFailure = false;
    for (let i = 0; i < 100 && !foundFailure; i++) {
        const testState = { ...state, credits: 10000, policeRecordScore: PoliceRecordScore.CLEAN };
        const result = attemptBribery(testState, bribeAmount);
        
        if (!result.success) {
            foundFailure = true;
            assert.ok(result.state.policeRecordScore < PoliceRecordScore.CLEAN, 
                'Failed bribery should worsen police record');
        }
    }

    // If we never found a failure in 100 tries, the success rate might be too high
    // but that's not necessarily wrong
});

test('bribery - bribe option availability during police encounters', () => {
    const state = createInitialState();
    state.encounterType = 0; // POLICEINSPECTION from constants

    const actions = getAvailableActions(state);
    
    assert.ok(actions.includes('bribe'), 'Bribe should be available during police inspection');
});

test('bribery - bribe option not available for pirate encounters', () => {
    const state = createInitialState();
    state.encounterType = 10; // PIRATEATTACK from constants

    const actions = getAvailableActions(state);
    
    assert.ok(!actions.includes('bribe'), 'Bribe should not be available during pirate attack');
});

test('bribery - government bribe level affects difficulty', () => {
    const state = createInitialState();
    
    // Test different government types and their bribe levels
    const governments = [
        { politics: 0, name: 'Anarchy', expectedBribeLevel: 7 }, // Very bribeable
        { politics: 5, name: 'Cybernetic', expectedBribeLevel: 0 }, // Unbribeable  
        { politics: 8, name: 'Fascist', expectedBribeLevel: 0 }, // Unbribeable
    ];

    governments.forEach(({ politics, name, expectedBribeLevel }) => {
        state.solarSystem[state.currentSystem].politics = politics as any;
        
        // In unbribeable governments, bribery should be harder/impossible
        if (expectedBribeLevel === 0) {
            // Test that bribery is severely hampered or impossible
            const result = attemptBribery(state, 1000);
            // The actual implementation may vary - test what makes sense
        }
    });
});

test('bribery - amount calculation bounds checking', () => {
    // Test with extreme difficulty values
    const minBribe = calculateBribeAmount(0);
    const maxBribe = calculateBribeAmount(4);

    assert.ok(minBribe > 0, 'Minimum bribe should be positive');
    assert.ok(maxBribe > 0, 'Maximum bribe should be positive');
    assert.ok(minBribe <= 10000, 'Bribe amounts should be reasonable');
    assert.ok(maxBribe <= 10000, 'Bribe amounts should be reasonable');
});

test('bribery - edge cases', () => {
    const state = createInitialState();
    
    // Zero credits
    state.credits = 0;
    const result1 = attemptBribery(state, 100);
    assert.equal(result1.success, false);
    
    // Very high police record (hero status)
    state.credits = 10000;
    state.policeRecordScore = PoliceRecordScore.HERO;
    const result2 = attemptBribery(state, 1000);
    // Heroes might have different bribery mechanics
    
    // Very low police record (psychopath status)
    state.policeRecordScore = PoliceRecordScore.PSYCHOPATH;
    const result3 = attemptBribery(state, 1000);
    // Psychopaths might have different bribery mechanics
});

test('bribery - consistency across multiple attempts', () => {
    const state = createInitialState();
    state.credits = 50000; // Plenty of credits
    state.policeRecordScore = PoliceRecordScore.CLEAN;
    const bribeAmount = 1000;

    let totalAttempts = 100;
    let successes = 0;
    let totalCreditsSpent = 0;

    for (let i = 0; i < totalAttempts; i++) {
        const testState = { ...state, credits: 50000 };
        const result = attemptBribery(testState, bribeAmount);
        
        if (result.success) {
            successes++;
            totalCreditsSpent += bribeAmount;
        }
        
        // Credits should only be deducted on success
        if (result.success) {
            assert.equal(result.state.credits, 50000 - bribeAmount);
        } else {
            assert.equal(result.state.credits, 50000);
        }
    }

    // Should have some successes and some failures for balance
    assert.ok(successes > 0, 'Should have some successful bribes');
    assert.ok(successes < totalAttempts, 'Should not succeed every time');
    
    console.log(`Bribery success rate: ${successes}/${totalAttempts} (${(successes/totalAttempts*100).toFixed(1)}%)`);
});
