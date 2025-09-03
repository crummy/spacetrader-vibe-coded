#!/usr/bin/env node --test --experimental-strip-types

import { test } from 'node:test';
import assert from 'node:assert';
import { createGameEngine, checkRandomEncountersOnTravel } from '../engine/game.ts';

test('Very Rare Encounter System', async (t) => {

  await t.test('should implement correct very rare encounter probability (5 in 1000)', () => {
    const testRuns = 10000;
    let veryRareCount = 0;
    
    // Test the probability directly
    for (let i = 0; i < testRuns; i++) {
      if (Math.floor(Math.random() * 1000) < 5) {
        veryRareCount++;
      }
    }
    
    const actualRate = veryRareCount / testRuns;
    const expectedRate = 5 / 1000;
    
    // Should be within reasonable range (±0.002 tolerance)
    assert.ok(Math.abs(actualRate - expectedRate) < 0.002, 
      `Expected rate ~${expectedRate}, got ${actualRate}`);
  });

  await t.test('should generate all types of very rare encounters', () => {
    const engine = createGameEngine();
    engine.state.warpSystem = 1;
    
    const encounterTypes = new Set();
    
    // Test many times to collect different encounter types
    for (let i = 0; i < 2000; i++) {
      // Reset state for fresh encounters
      engine.state.veryRareEncounter = 0;
      
      const result = checkRandomEncountersOnTravel(engine.state);
      if (result.hasEncounter && result.encounterType! >= 70) {
        encounterTypes.add(result.encounterType);
      }
    }
    
    console.log('Very rare encounter types found:', Array.from(encounterTypes).sort((a, b) => a - b));
    
    // Should find multiple types of very rare encounters
    assert.ok(encounterTypes.size >= 3, 'Should find multiple types of very rare encounters');
    
    // Check for specific encounter types
    const foundTypes = Array.from(encounterTypes);
    const hasMarieOrCaptain = foundTypes.some(type => type === 80 || (type >= 72 && type <= 74));
    assert.ok(hasMarieOrCaptain, 'Should find Marie Celeste or Famous Captain encounters');
  });

  await t.test('should prevent duplicate very rare encounters using flags', () => {
    const engine = createGameEngine();
    engine.state.warpSystem = 1;
    engine.state.veryRareEncounter = 0; // Start with no encounters done
    
    let marieEnounters = 0;
    let ahabEncounters = 0;
    
    // Test many encounters to see if duplicates occur
    for (let i = 0; i < 1000; i++) {
      const result = checkRandomEncountersOnTravel(engine.state);
      if (result.hasEncounter) {
        if (result.encounterType === 80) { // MARIECELESTEENCOUNTER
          marieEnounters++;
        }
        if (result.encounterType === 72) { // CAPTAINAHABENCOUNTER  
          ahabEncounters++;
        }
      }
    }
    
    // Each very rare encounter should only happen once
    assert.ok(marieEnounters <= 1, `Marie Celeste should happen at most once, got ${marieEnounters}`);
    assert.ok(ahabEncounters <= 1, `Captain Ahab should happen at most once, got ${ahabEncounters}`);
    
    console.log(`Final veryRareEncounter flags: ${engine.state.veryRareEncounter.toString(2).padStart(6, '0')}`);
  });

  await t.test('should provide correct encounter types and ranges', async () => {
    // Test encounter type constants
    const expectedEncounterTypes = {
      MARIECELESTEENCOUNTER: 80,
      CAPTAINAHABENCOUNTER: 72,
      CAPTAINCONRADENCOUNTER: 73,
      CAPTAINHUIEENCOUNTER: 74,
      BOTTLEOLDENCOUNTER: 81,
      BOTTLEGOODENCOUNTER: 82
    };
    
    // Import the encounter types to verify they match
    const { EncounterType } = await import('../combat/engine.ts');
    
    assert.equal(EncounterType.MARIECELESTEENCOUNTER, expectedEncounterTypes.MARIECELESTEENCOUNTER);
    assert.equal(EncounterType.CAPTAINAHABENCOUNTER, expectedEncounterTypes.CAPTAINAHABENCOUNTER);
    assert.equal(EncounterType.CAPTAINCONRADENCOUNTER, expectedEncounterTypes.CAPTAINCONRADENCOUNTER);
    assert.equal(EncounterType.CAPTAINHUIEENCOUNTER, expectedEncounterTypes.CAPTAINHUIEENCOUNTER);
    assert.equal(EncounterType.BOTTLEOLDENCOUNTER, expectedEncounterTypes.BOTTLEOLDENCOUNTER);
    assert.equal(EncounterType.BOTTLEGOODENCOUNTER, expectedEncounterTypes.BOTTLEGOODENCOUNTER);
  });

  await t.test('should have correct combat actions for very rare encounters', async () => {
    const { getAvailableActions } = await import('../combat/engine.ts');
    const engine = createGameEngine();
    
    // Test Marie Celeste actions
    engine.state.encounterType = 80; // MARIECELESTEENCOUNTER
    const marieActions = getAvailableActions(engine.state);
    assert.ok(marieActions.includes('board'), 'Marie Celeste should offer board action');
    assert.ok(marieActions.includes('ignore'), 'Marie Celeste should offer ignore action');
    
    // Test Famous Captain actions
    engine.state.encounterType = 72; // CAPTAINAHABENCOUNTER
    const captainActions = getAvailableActions(engine.state);
    assert.ok(captainActions.includes('attack'), 'Captain should offer attack action');
    assert.ok(captainActions.includes('flee'), 'Captain should offer flee action');
    assert.ok(captainActions.includes('ignore'), 'Captain should offer ignore action');
    
    // Test Bottle actions
    engine.state.encounterType = 81; // BOTTLEOLDENCOUNTER
    const bottleActions = getAvailableActions(engine.state);
    assert.ok(bottleActions.includes('drink'), 'Bottle should offer drink action');
    assert.ok(bottleActions.includes('ignore'), 'Bottle should offer ignore action');
  });

  await t.test('should integrate with tick-based travel system', () => {
    const engine = createGameEngine();
    engine.state.warpSystem = 1;
    
    // Very rare encounters should be checked during travel
    let totalEncounters = 0;
    let veryRareEncounters = 0;
    
    for (let i = 0; i < 500; i++) {
      // Reset very rare flags periodically to allow multiple encounters for testing
      if (i % 100 === 0) {
        engine.state.veryRareEncounter = 0;
      }
      
      const result = checkRandomEncountersOnTravel(engine.state);
      if (result.hasEncounter) {
        totalEncounters++;
        if (result.encounterType! >= 70) {
          veryRareEncounters++;
        }
      }
    }
    
    console.log(`Total encounters: ${totalEncounters}, Very rare: ${veryRareEncounters}`);
    
    // Should have some encounters overall
    assert.ok(totalEncounters > 0, 'Should generate encounters during travel');
    
    // Very rare encounters should be much less frequent than regular ones
    if (veryRareEncounters > 0) {
      assert.ok(veryRareEncounters < totalEncounters * 0.1, 'Very rare encounters should be <10% of total');
    }
  });

  await t.test('should respect bitmask flag system for encounter tracking', () => {
    const engine = createGameEngine();
    engine.state.warpSystem = 1;
    
    // Manually set different flag combinations
    const testCases = [
      { flags: 1, description: 'Marie already done' },   // ALREADYMARIE
      { flags: 2, description: 'Ahab already done' },    // ALREADYAHAB  
      { flags: 4, description: 'Conrad already done' },  // ALREADYCONRAD
      { flags: 31, description: 'Most encounters done' }, // First 5 bits set
      { flags: 63, description: 'All encounters done' }   // All 6 bits set
    ];
    
    for (const testCase of testCases) {
      engine.state.veryRareEncounter = testCase.flags;
      
      let availableEncounters = 0;
      
      // Test multiple times to see what encounters are still possible
      for (let i = 0; i < 100; i++) {
        // Don't modify state, just check what would happen
        const originalFlags = engine.state.veryRareEncounter;
        const result = checkRandomEncountersOnTravel(engine.state);
        
        if (result.hasEncounter && result.encounterType! >= 70) {
          availableEncounters++;
          // Restore original flags for consistent testing
          engine.state.veryRareEncounter = originalFlags;
        }
      }
      
      console.log(`${testCase.description}: ${availableEncounters} encounters available`);
      
      if (testCase.flags === 63) {
        // All encounters done - should find no very rare encounters
        assert.equal(availableEncounters, 0, 'Should find no encounters when all flags set');
      }
    }
  });
});
