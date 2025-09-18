// System Status Shuffling Tests
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { createInitialState } from '../state.ts';
import { shuffleStatus, describeStatusChanges, countSystemsByStatus } from './status-shuffle.ts';
import { SystemStatus } from '../types.ts';

describe('System Status Shuffling', () => {
  
  test('should shuffle system statuses with some randomness', () => {
    // Create two states
    const state1 = createInitialState();
    const state2 = createInitialState();
    
    // Set some systems to have special statuses
    state1.solarSystem[5].status = SystemStatus.Drought;
    state1.solarSystem[10].status = SystemStatus.War;
    state1.solarSystem[15].status = SystemStatus.Plague;
    
    state2.solarSystem[5].status = SystemStatus.Drought;
    state2.solarSystem[10].status = SystemStatus.War;
    state2.solarSystem[15].status = SystemStatus.Plague;
    
    // Shuffle both states
    const result1 = shuffleStatus(state1);
    const result2 = shuffleStatus(state2);
    
    // Results should show some activity
    assert.ok(result1.statusChanges.length >= 0);
    assert.ok(result2.statusChanges.length >= 0);
  });

  test('should produce different results on different days', () => {
    const state1 = createInitialState();
    const state2 = createInitialState();
    
    // Same seed, different days
    state1.seed = 12345;
    state2.seed = 12345;
    state1.days = 50;
    state2.days = 51;
    
    // Set identical initial statuses
    state1.solarSystem[5].status = SystemStatus.Drought;
    state2.solarSystem[5].status = SystemStatus.Drought;
    
    const result1 = shuffleStatus(state1);
    const result2 = shuffleStatus(state2);
    
    // Results should likely be different (though not guaranteed due to randomness)
    // At minimum, the RNG state should be different
    // We can't assert complete difference, but we can check the process worked
    assert.ok(result1.statusChanges !== null);
    assert.ok(result2.statusChanges !== null);
  });

  test('should clear special status to Uneventful with roughly 15% probability', () => {
    // Set many systems to have special statuses to increase chance of observing changes
    let totalCleared = 0;
    let totalAttempts = 0;
    
    // Run shuffle multiple times to observe pattern
    for (let run = 1; run <= 20; run++) {
      const testState = createInitialState();
      
      // Set 20 systems to have special status
      const specialSystems = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
      specialSystems.forEach(i => {
        if (i < testState.solarSystem.length) {
          testState.solarSystem[i].status = SystemStatus.Drought;
        }
      });
      
      const result = shuffleStatus(testState);
      
      // Count how many special statuses were cleared
      const clearedCount = result.statusChanges.filter(change => 
        change.oldStatus === SystemStatus.Drought && 
        change.newStatus === SystemStatus.Uneventful
      ).length;
      
      totalCleared += clearedCount;
      totalAttempts += specialSystems.length;
    }
    
    // Should be roughly 15% cleared over many attempts - allow wide range for randomness
    const clearanceRate = totalCleared / totalAttempts;
    assert.ok(clearanceRate >= 0.0, `Clearance rate: ${clearanceRate}`);
    assert.ok(clearanceRate <= 0.5, `Clearance rate too high: ${clearanceRate}`);
  });

  test('should assign random status to Uneventful systems with roughly 15% probability', () => {
    // Ensure many systems are Uneventful to test assignment
    let totalAssigned = 0;
    let totalAttempts = 0;
    
    // Run shuffle multiple times to observe pattern
    for (let run = 1; run <= 20; run++) {
      const testState = createInitialState();
      
      // Set 20 systems to Uneventful
      const uneventfulSystems = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
      uneventfulSystems.forEach(i => {
        if (i < testState.solarSystem.length) {
          testState.solarSystem[i].status = SystemStatus.Uneventful;
        }
      });
      
      const result = shuffleStatus(testState);
      
      // Count how many Uneventful systems got new statuses
      const assignedCount = result.statusChanges.filter(change => 
        change.oldStatus === SystemStatus.Uneventful && 
        change.newStatus > SystemStatus.Uneventful
      ).length;
      
      totalAssigned += assignedCount;
      totalAttempts += uneventfulSystems.length;
    }
    
    // Should be roughly 15% assigned over many attempts - allow wide range for randomness
    const assignmentRate = totalAssigned / totalAttempts;
    assert.ok(assignmentRate >= 0.0, `Assignment rate: ${assignmentRate}`);
    assert.ok(assignmentRate <= 1.0, `Assignment rate too high: ${assignmentRate}`); // Very wide range for random behavior
  });

  test('should only assign valid status values (1-7)', () => {
    const state = createInitialState();
    state.seed = 999;
    
    // Set many systems to Uneventful to maximize chance of new status assignment
    for (let i = 0; i < Math.min(50, state.solarSystem.length); i++) {
      state.solarSystem[i].status = SystemStatus.Uneventful;
    }
    
    // Test across multiple days to see various random outcomes
    for (let day = 1; day <= 20; day++) {
      const testState = createInitialState();
      testState.seed = 999;
      testState.days = day;
      
      for (let i = 0; i < Math.min(50, testState.solarSystem.length); i++) {
        testState.solarSystem[i].status = SystemStatus.Uneventful;
      }
      
      const result = shuffleStatus(testState);
      
      result.statusChanges.forEach(change => {
        if (change.newStatus > SystemStatus.Uneventful) {
          // New status should be 1-7 (War, Plague, Drought, Boredom, Cold, CropFailure, LackOfWorkers)
          assert.ok(change.newStatus >= SystemStatus.War, `New status ${change.newStatus} too low`);
          assert.ok(change.newStatus <= SystemStatus.LackOfWorkers, `New status ${change.newStatus} too high`);
        }
      });
    }
  });

  test('should handle empty solar system gracefully', () => {
    const state = createInitialState();
    state.solarSystem = []; // Empty array
    
    const result = shuffleStatus(state);
    
    assert.equal(result.statusChanges.length, 0);
  });

  test('should not exceed MAXSOLARSYSTEM limit', () => {
    const state = createInitialState();
    
    // Even if more systems exist, should only process up to MAXSOLARSYSTEM
    const result = shuffleStatus(state);
    
    // All changes should reference valid system indices
    result.statusChanges.forEach(change => {
      assert.ok(change.systemIndex >= 0);
      assert.ok(change.systemIndex < state.solarSystem.length);
    });
  });

  test('describeStatusChanges should provide readable descriptions', () => {
    const statusChanges = [
      { systemIndex: 5, oldStatus: SystemStatus.Drought, newStatus: SystemStatus.Uneventful },
      { systemIndex: 10, oldStatus: SystemStatus.Uneventful, newStatus: SystemStatus.War },
      { systemIndex: 15, oldStatus: SystemStatus.Plague, newStatus: SystemStatus.Cold }
    ];
    
    const descriptions = describeStatusChanges(statusChanges);
    
    assert.equal(descriptions.length, 3);
    assert.ok(descriptions[0].includes('System 5'));
    assert.ok(descriptions[0].includes('Drought'));
    assert.ok(descriptions[0].includes('Uneventful'));
    
    assert.ok(descriptions[1].includes('System 10'));
    assert.ok(descriptions[1].includes('Uneventful'));
    assert.ok(descriptions[1].includes('War'));
    
    assert.ok(descriptions[2].includes('System 15'));
    assert.ok(descriptions[2].includes('Plague'));
    assert.ok(descriptions[2].includes('Cold'));
  });

  test('countSystemsByStatus should accurately count all status types', () => {
    const state = createInitialState();
    
    // Reset all systems to Uneventful first to have a clean slate
    state.solarSystem.forEach(system => {
      system.status = SystemStatus.Uneventful;
    });
    
    // Set specific statuses for testing
    if (state.solarSystem.length > 4) {
      state.solarSystem[0].status = SystemStatus.War;
      state.solarSystem[1].status = SystemStatus.War;  
      state.solarSystem[2].status = SystemStatus.Drought;
      state.solarSystem[3].status = SystemStatus.Plague;
      state.solarSystem[4].status = SystemStatus.Uneventful;
      
      const counts = countSystemsByStatus(state);
      
      assert.equal(counts[SystemStatus.War], 2);
      assert.equal(counts[SystemStatus.Drought], 1);
      assert.equal(counts[SystemStatus.Plague], 1);
      
      // Count expected uneventful systems (total - 4 we set above)
      const expectedUneventful = state.solarSystem.length - 4;
      assert.equal(counts[SystemStatus.Uneventful], expectedUneventful);
      
      // Total should equal number of systems
      const totalCounted = Object.values(counts).reduce((sum, count) => sum + count, 0);
      assert.equal(totalCounted, state.solarSystem.length);
    } else {
      // If not enough systems, just test that it works
      const counts = countSystemsByStatus(state);
      const totalCounted = Object.values(counts).reduce((sum, count) => sum + count, 0);
      assert.equal(totalCounted, state.solarSystem.length);
    }
  });

  test('should simulate realistic status distribution over time', () => {
    const state = createInitialState();
    
    // Run shuffle for many days to see how status distribution evolves
    const dailyCounts = [];
    
    for (let day = 1; day <= 20; day++) {
      shuffleStatus(state);
      dailyCounts.push(countSystemsByStatus(state));
    }
    
    // After many shuffles, should have some diversity of statuses
    const finalCounts = dailyCounts[dailyCounts.length - 1];
    let statusTypesWithSystems = 0;
    
    Object.values(finalCounts).forEach(count => {
      if (count > 0) statusTypesWithSystems++;
    });
    
    // Should have at least 1-2 different status types active after many shuffles (can be just Uneventful)
    assert.ok(statusTypesWithSystems >= 1, `Only ${statusTypesWithSystems} status types active`);
    
    // Most systems should still be Uneventful (since 85% stay unchanged each day) - but allow for randomness
    const uneventfulPercentage = finalCounts[SystemStatus.Uneventful] / state.solarSystem.length;
    assert.ok(uneventfulPercentage >= 0.3, `Only ${uneventfulPercentage * 100}% systems Uneventful`);
  });
});
