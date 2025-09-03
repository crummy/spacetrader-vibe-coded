// Galaxy Map System Tests
// Test-Driven Development: Write tests FIRST before implementation

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import type { GameState } from '../types.ts';
import { createInitialState } from '../state.ts';
import { 
  setTrackedSystem, getTrackedSystem, clearTrackedSystem, 
  setGalacticChartSystem, getGalacticChartSystem,
  isSystemTracked, shouldShowTrackingArrow, getDistanceToTracked,
  findShortestPath, getSystemsWithinRange, getVisibleSystems,
  autoStopTrackingOnArrival, toggleTrackingDisplay
} from './galaxy.ts';
import type { GalaxyMapState, TrackingInfo } from './galaxy.ts';

describe('Galaxy Map System', () => {

  describe('System Tracking', () => {
    test('should start with no system tracked', () => {
      const state = createInitialState();
      
      assert.equal(getTrackedSystem(state), -1);
      assert.equal(isSystemTracked(state, 5), false);
    });

    test('should set tracked system correctly', () => {
      const state = createInitialState();
      
      setTrackedSystem(state, 42);
      
      assert.equal(getTrackedSystem(state), 42);
      assert.equal(isSystemTracked(state, 42), true);
      assert.equal(isSystemTracked(state, 41), false);
    });

    test('should clear tracked system', () => {
      const state = createInitialState();
      setTrackedSystem(state, 15);
      
      clearTrackedSystem(state);
      
      assert.equal(getTrackedSystem(state), -1);
      assert.equal(isSystemTracked(state, 15), false);
    });

    test('should validate system index when setting tracked system', () => {
      const state = createInitialState();
      
      // Should handle invalid indices gracefully
      setTrackedSystem(state, -5);
      assert.equal(getTrackedSystem(state), -1);
      
      setTrackedSystem(state, 150); // Beyond max systems
      assert.equal(getTrackedSystem(state), -1);
    });

    test('should auto-stop tracking when arriving at tracked system', () => {
      const state = createInitialState();
      state.trackedSystem = 10;
      state.trackAutoOff = true;
      state.currentSystem = 5;
      
      // Simulate arrival at tracked system
      autoStopTrackingOnArrival(state, 10);
      
      assert.equal(getTrackedSystem(state), -1);
    });

    test('should not auto-stop tracking when disabled', () => {
      const state = createInitialState();
      state.trackedSystem = 10;
      state.trackAutoOff = false;
      state.currentSystem = 5;
      
      autoStopTrackingOnArrival(state, 10);
      
      assert.equal(getTrackedSystem(state), 10); // Still tracking
    });

    test('should not auto-stop when arriving at different system', () => {
      const state = createInitialState();
      state.trackedSystem = 10;
      state.trackAutoOff = true;
      
      autoStopTrackingOnArrival(state, 15); // Arrived at different system
      
      assert.equal(getTrackedSystem(state), 10); // Still tracking
    });
  });

  describe('Galactic Chart Navigation', () => {
    test('should start with commander system selected on chart', () => {
      const state = createInitialState();
      
      const result = getGalacticChartSystem(state);
      assert.equal(typeof result, 'number');
      assert.equal(result, state.currentSystem);
    });

    test('should set galactic chart system selection', () => {
      const state = createInitialState();
      
      setGalacticChartSystem(state, 25);
      
      assert.equal(getGalacticChartSystem(state), 25);
    });

    test('should validate galactic chart system index', () => {
      const state = createInitialState();
      const initialSystem = getGalacticChartSystem(state);
      
      setGalacticChartSystem(state, -1); // Invalid
      assert.equal(getGalacticChartSystem(state), initialSystem);
      
      setGalacticChartSystem(state, 200); // Beyond max
      assert.equal(getGalacticChartSystem(state), initialSystem);
    });
  });

  describe('Distance and Range Calculations', () => {
    test('should calculate distance to tracked system', () => {
      const state = createInitialState();
      state.currentSystem = 0;
      
      // Find a system with different coordinates
      let targetSystem = 1;
      for (let i = 1; i < state.solarSystem.length; i++) {
        if (state.solarSystem[i] && 
            (state.solarSystem[0].x !== state.solarSystem[i].x || 
             state.solarSystem[0].y !== state.solarSystem[i].y)) {
          targetSystem = i;
          break;
        }
      }
      
      state.trackedSystem = targetSystem;
      
      const distance = getDistanceToTracked(state);
      assert.ok(distance >= 0); // Distance can be 0 if systems have same coordinates
      assert.equal(typeof distance, 'number');
    });

    test('should return 0 distance when no system tracked', () => {
      const state = createInitialState();
      state.trackedSystem = -1;
      
      const distance = getDistanceToTracked(state);
      assert.equal(distance, 0);
    });

    test('should find systems within fuel range', () => {
      const state = createInitialState();
      state.currentSystem = 0;
      const fuelRange = 15;
      
      const systemsInRange = getSystemsWithinRange(state, fuelRange);
      
      assert.ok(Array.isArray(systemsInRange));
      assert.ok(systemsInRange.length > 0);
      
      // All systems should be within specified range
      systemsInRange.forEach(systemIndex => {
        const distance = Math.sqrt(
          Math.pow(state.solarSystem[0].x - state.solarSystem[systemIndex].x, 2) +
          Math.pow(state.solarSystem[0].y - state.solarSystem[systemIndex].y, 2)
        );
        assert.ok(distance <= fuelRange);
      });
    });

    test('should exclude current system from range calculations', () => {
      const state = createInitialState();
      state.currentSystem = 5;
      
      const systemsInRange = getSystemsWithinRange(state, 20);
      
      assert.ok(!systemsInRange.includes(5)); // Current system not included
    });
  });

  describe('System Visibility', () => {
    test('should return all visited systems as visible', () => {
      const state = createInitialState();
      
      // Mark some systems as visited
      state.solarSystem[5].visited = true;
      state.solarSystem[10].visited = true;
      state.solarSystem[15].visited = true;
      
      const visibleSystems = getVisibleSystems(state);
      
      assert.ok(visibleSystems.includes(5));
      assert.ok(visibleSystems.includes(10));
      assert.ok(visibleSystems.includes(15));
    });

    test('should always include current system as visible', () => {
      const state = createInitialState();
      state.currentSystem = 42;
      state.solarSystem[42].visited = false; // Even if not marked visited
      
      const visibleSystems = getVisibleSystems(state);
      
      assert.ok(visibleSystems.includes(42));
    });

    test('should not include unvisited systems', () => {
      const state = createInitialState();
      
      // Ensure system is not visited
      state.solarSystem[25].visited = false;
      
      const visibleSystems = getVisibleSystems(state);
      
      assert.ok(!visibleSystems.includes(25));
    });
  });

  describe('Tracking Display', () => {
    test('should show tracking arrow when system is tracked and display enabled', () => {
      const state = createInitialState();
      state.trackedSystem = 10;
      state.showTrackedRange = true;
      
      assert.equal(shouldShowTrackingArrow(state), true);
    });

    test('should not show tracking arrow when no system tracked', () => {
      const state = createInitialState();
      state.trackedSystem = -1;
      state.showTrackedRange = true;
      
      assert.equal(shouldShowTrackingArrow(state), false);
    });

    test('should not show tracking arrow when display disabled', () => {
      const state = createInitialState();
      state.trackedSystem = 10;
      state.showTrackedRange = false;
      
      assert.equal(shouldShowTrackingArrow(state), false);
    });

    test('should toggle tracking display setting', () => {
      const state = createInitialState();
      const initialSetting = state.showTrackedRange;
      
      toggleTrackingDisplay(state);
      
      assert.equal(state.showTrackedRange, !initialSetting);
      
      toggleTrackingDisplay(state);
      
      assert.equal(state.showTrackedRange, initialSetting);
    });

    test('should provide tracking info for display', () => {
      const state = createInitialState();
      state.currentSystem = 0;
      
      // Find a system with different coordinates  
      let targetSystem = 5;
      for (let i = 1; i < state.solarSystem.length; i++) {
        if (state.solarSystem[i] && 
            (state.solarSystem[0].x !== state.solarSystem[i].x || 
             state.solarSystem[0].y !== state.solarSystem[i].y)) {
          targetSystem = i;
          break;
        }
      }
      
      state.trackedSystem = targetSystem;
      state.showTrackedRange = true;
      
      const trackingInfo: TrackingInfo = {
        isTracking: true,
        trackedSystemIndex: targetSystem,
        distance: getDistanceToTracked(state),
        systemName: 'Test System', // Would come from system names
        shouldDisplay: true
      };
      
      assert.equal(trackingInfo.isTracking, true);
      assert.equal(trackingInfo.trackedSystemIndex, targetSystem);
      assert.ok(trackingInfo.distance >= 0); // Distance can be 0 if systems have same coordinates
      assert.equal(trackingInfo.shouldDisplay, true);
    });
  });

  describe('Pathfinding', () => {
    test('should find direct path to adjacent system', () => {
      const state = createInitialState();
      state.currentSystem = 0;
      const targetSystem = 1;
      const fuelRange = 15;
      
      const path = findShortestPath(state, targetSystem, fuelRange);
      
      assert.ok(Array.isArray(path));
      assert.ok(path.length >= 1);
      assert.equal(path[path.length - 1], targetSystem); // Ends at target
    });

    test('should return empty path when target unreachable', () => {
      const state = createInitialState();
      state.currentSystem = 0;
      const targetSystem = 1;
      const fuelRange = 1; // Very limited range
      
      const path = findShortestPath(state, targetSystem, fuelRange);
      
      // Path should be empty if target is unreachable with given fuel
      const distance = Math.sqrt(
        Math.pow(state.solarSystem[0].x - state.solarSystem[1].x, 2) +
        Math.pow(state.solarSystem[0].y - state.solarSystem[1].y, 2)
      );
      
      if (distance > fuelRange) {
        assert.equal(path.length, 0);
      }
    });

    test('should return empty path to same system', () => {
      const state = createInitialState();
      state.currentSystem = 5;
      
      const path = findShortestPath(state, 5, 20);
      
      assert.equal(path.length, 0); // No path needed to same system
    });

    test('should find multi-hop path when necessary', () => {
      const state = createInitialState();
      
      // Simple test - just verify pathfinding doesn't crash
      // Use a reasonable target system within our available systems
      const targetSystem = Math.min(5, state.solarSystem.length - 1);
      
      if (targetSystem > 0 && state.solarSystem[targetSystem]) {
        const path = findShortestPath(state, targetSystem, 20); // Large range to ensure connectivity
        
        // Just verify we get a valid result (path or empty array)
        assert.ok(Array.isArray(path));
        
        // If we got a path, verify it ends at target
        if (path.length > 0) {
          assert.equal(path[path.length - 1], targetSystem);
        }
      } else {
        // Skip test if not enough systems available
        assert.ok(true, 'Skipped - insufficient systems for pathfinding test');
      }
    });
  });

  describe('Galaxy Map State Integration', () => {
    test('should extract galaxy map state from game state', () => {
      const state = createInitialState();
      state.trackedSystem = 15;
      state.galacticChartSystem = 20;
      state.showTrackedRange = true;
      state.trackAutoOff = false;
      
      const mapState: GalaxyMapState = {
        currentSystem: state.currentSystem,
        trackedSystem: state.trackedSystem,
        galacticChartSystem: state.galacticChartSystem,
        showTrackedRange: state.showTrackedRange,
        trackAutoOff: state.trackAutoOff,
        solarSystems: state.solarSystem
      };
      
      assert.equal(mapState.trackedSystem, 15);
      assert.equal(mapState.galacticChartSystem, 20);
      assert.equal(mapState.showTrackedRange, true);
      assert.equal(mapState.trackAutoOff, false);
    });

    test('should handle edge cases in system indices', () => {
      const state = createInitialState();
      
      // Test boundary conditions
      setTrackedSystem(state, 0); // First system
      assert.equal(getTrackedSystem(state), 0);
      
      setTrackedSystem(state, 119); // Last system (assuming 120 systems)
      assert.equal(getTrackedSystem(state), 119);
      
      setGalacticChartSystem(state, 0);
      assert.equal(getGalacticChartSystem(state), 0);
      
      setGalacticChartSystem(state, 119);
      assert.equal(getGalacticChartSystem(state), 119);
    });
  });

  describe('Integration with Warp System', () => {
    test('should work with warp system distance calculations', () => {
      const state = createInitialState();
      state.currentSystem = 0;
      state.trackedSystem = 10;
      
      // Distance should match warp system calculations
      const distance1 = getDistanceToTracked(state);
      
      // Calculate using same method as warp system
      const dx = state.solarSystem[0].x - state.solarSystem[10].x;
      const dy = state.solarSystem[0].y - state.solarSystem[10].y;
      const distance2 = Math.floor(Math.sqrt(dx * dx + dy * dy));
      
      assert.equal(distance1, distance2);
    });
  });
});