// Player Options System Tests
// Tests for the organized options structure from Palm OS Space Trader

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../state.ts';
import { getAvailableCargoSpace, getAvailableFunds } from '../economy/trading.ts';

test('player options - default values match requirements', () => {
    const state = createInitialState();
    const opts = state.options;
    
    // Auto-arrival services - should start false
    assert.equal(opts.autoFuel, false, 'Get full tank on arrival should start false');
    assert.equal(opts.autoRepair, false, 'Get full hull repair on arrival should start false');
    
    // Always ignore when safe - police should start true, others false
    assert.equal(opts.alwaysIgnorePolice, true, 'Always ignore police should start true');
    assert.equal(opts.alwaysIgnorePirates, false, 'Always ignore pirates should start false');
    assert.equal(opts.alwaysIgnoreTraders, false, 'Always ignore traders should start false'); 
    assert.equal(opts.alwaysIgnoreTradeInOrbit, false, 'Ignore dealing traders should start false');
    
    // Financial settings
    assert.equal(opts.reserveMoney, false, 'Reserve money should start false');
    assert.equal(opts.leaveEmpty, 0, 'Cargo bays to leave empty should start 0');
});

test('player options - can modify all option values', () => {
    const state = createInitialState();
    
    // Test all boolean options can be toggled
    state.options.autoFuel = true;
    state.options.autoRepair = true;
    state.options.alwaysIgnorePolice = false;
    state.options.alwaysIgnorePirates = true;
    state.options.alwaysIgnoreTraders = true;
    state.options.alwaysIgnoreTradeInOrbit = true;
    state.options.reserveMoney = true;
    state.options.textualEncounters = true;
    state.options.continuous = true;
    state.options.attackFleeing = true;
    
    // Test numeric option
    state.options.leaveEmpty = 5;
    
    // Verify changes took effect
    assert.equal(state.options.autoFuel, true);
    assert.equal(state.options.autoRepair, true);
    assert.equal(state.options.alwaysIgnorePolice, false);
    assert.equal(state.options.alwaysIgnorePirates, true);
    assert.equal(state.options.alwaysIgnoreTraders, true);
    assert.equal(state.options.alwaysIgnoreTradeInOrbit, true);
    assert.equal(state.options.reserveMoney, true);
    assert.equal(state.options.leaveEmpty, 5);
    assert.equal(state.options.textualEncounters, true);
    assert.equal(state.options.continuous, true);
    assert.equal(state.options.attackFleeing, true);
});

test('player options - leaveEmpty affects cargo space calculation', () => {
    const state = createInitialState();
    
    // Test with no reserved bays
    state.options.leaveEmpty = 0;
    const spaceFull = getAvailableCargoSpace(state);
    
    // Test with reserved bays
    state.options.leaveEmpty = 3;
    const spaceReserved = getAvailableCargoSpace(state);
    
    assert.equal(spaceReserved, spaceFull - 3, 'Should reserve 3 cargo bays');
});

test('player options - reserveMoney affects available funds', () => {
    const state = createInitialState();
    
    state.credits = 10000;
    
    // Test with reserve money disabled
    state.options.reserveMoney = false;
    const fundsUnreserved = getAvailableFunds(state);
    assert.equal(fundsUnreserved, 10000, 'Should get full credits when reserve disabled');
    
    // Test with reserve money enabled
    state.options.reserveMoney = true;
    const fundsReserved = getAvailableFunds(state);
    assert.ok(fundsReserved <= 10000, 'Should reserve some money when enabled');
});

test('player options - complete options structure matches Palm OS', () => {
    const state = createInitialState();
    const opts = state.options;
    
    // Verify all expected options exist
    const expectedBooleanOptions = [
        'autoFuel', 'autoRepair', 'alwaysIgnorePolice', 'alwaysIgnorePirates', 
        'alwaysIgnoreTraders', 'alwaysIgnoreTradeInOrbit', 'reserveMoney',
        'textualEncounters', 'continuous', 'attackFleeing', 'autoAttack', 
        'autoFlee', 'newsAutoPay', 'remindLoans', 'priceDifferences', 
        'alwaysInfo', 'tribbleMessage', 'useHWButtons', 'rectangularButtonsOn',
        'sharePreferences', 'identifyStartup'
    ];
    
    expectedBooleanOptions.forEach(option => {
        assert.equal(typeof (opts as any)[option], 'boolean', `${option} should be boolean`);
    });
    
    // Verify numeric option
    assert.equal(typeof opts.leaveEmpty, 'number', 'leaveEmpty should be number');
    
    // Verify total number of options (to catch any missing/extra)
    const optionKeys = Object.keys(opts);
    assert.equal(optionKeys.length, 22, 'Should have exactly 22 options total');
});

test('player options - options isolated from other state', () => {
    const state = createInitialState();
    
    // Change options
    state.options.autoFuel = true;
    state.options.leaveEmpty = 10;
    
    // Verify other state not affected
    assert.equal(state.credits, 1000, 'Credits should be unchanged');
    assert.equal(state.currentSystem, 0, 'Current system should be unchanged');
    assert.equal(state.ship.fuel, 14, 'Ship fuel should be unchanged');
    
    // Verify options changed
    assert.equal(state.options.autoFuel, true);
    assert.equal(state.options.leaveEmpty, 10);
});

test('player options - default Palm OS compatibility', () => {
    const state = createInitialState();
    const opts = state.options;
    
    // Test specific Palm OS defaults mentioned in source
    assert.equal(opts.alwaysIgnorePolice, true, 'Police ignore should default true (Palm OS default)');
    assert.equal(opts.remindLoans, true, 'Loan reminders should default true');
    assert.equal(opts.priceDifferences, true, 'Price differences should default true');
    
    // Test safety defaults
    assert.equal(opts.autoAttack, false, 'Auto-attack should default false for safety');
    assert.equal(opts.autoFlee, false, 'Auto-flee should default false for safety');
    assert.equal(opts.attackFleeing, false, 'Attack fleeing should default false for safety');
});

test('player options - state cloning preserves options', () => {
    const state1 = createInitialState();
    
    // Modify options
    state1.options.autoFuel = true;
    state1.options.leaveEmpty = 5;
    state1.options.alwaysIgnorePolice = false;
    
    // Clone state
    const state2 = {
        ...state1,
        options: { ...state1.options }
    };
    
    // Verify clone has same options
    assert.equal(state2.options.autoFuel, true);
    assert.equal(state2.options.leaveEmpty, 5);
    assert.equal(state2.options.alwaysIgnorePolice, false);
    
    // Verify independence - changing one doesn't affect other
    state2.options.autoRepair = true;
    assert.equal(state1.options.autoRepair, false, 'Original should be unchanged');
    assert.equal(state2.options.autoRepair, true, 'Clone should be changed');
});
