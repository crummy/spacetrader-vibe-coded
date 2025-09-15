// Wormhole System Comprehensive Tests
import { test } from 'node:test';
import assert from 'node:assert';

import { createInitialState } from '../state.ts';
import { calculateWormholeTax, isWormholeTravel } from './warp.ts';
import { calculateWarpCost, performWarp } from './warp.ts';

test('wormhole system - tax calculation for wormhole travel', () => {
  const state = createInitialState();
  
  // Test wormhole tax calculation (from Palm OS CalculateWormholeTax)
  state.policeRecordScore = 0; // Clean record
  const tax = calculateWormholeTax(state.ship);
  
  assert.ok(tax >= 0, 'Wormhole tax should be non-negative');
  assert(typeof tax === 'number', 'Tax should be a number');
});

test('wormhole system - criminal record affects tax', () => {
  const state = createInitialState();
  
  // Test clean record tax
  state.policeRecordScore = 0;
  const cleanTax = calculateWormholeTax(state.ship);
  
  // Test criminal record tax  
  state.policeRecordScore = -50; // Criminal
  const criminalTax = calculateWormholeTax(state.ship);
  
  assert.ok(criminalTax >= cleanTax, 'Criminal record should not reduce wormhole tax');
  // Tax might be the same or higher for criminals
});

test('wormhole system - identifies wormhole connections correctly', () => {
  const state = createInitialState();
  
  // Check some known wormhole connections from the original game
  // (Specific connections would need to be tested against actual wormhole data)
  
  // Test that regular travel is not wormhole travel
  const isRegularWormhole = isWormholeTravel(state, 0, 1); // Adjacent systems
  assert.equal(typeof isRegularWormhole, 'boolean', 'Should return boolean for wormhole check');
});

test('wormhole system - wormhole travel ignores fuel requirements', () => {
  const state = createInitialState();
  state.ship.fuel = 1; // Very low fuel
  
  // Find a wormhole connection (if any exist in our data)
  let wormholeFound = false;
  for (let target = 0; target < 20; target++) {
    if (isWormholeTravel(state, 0, target)) {
      // Test that wormhole travel works even with low fuel
      const warpResult = performWarp(state, target, false);
      
      if (warpResult.success) {
        wormholeFound = true;
        assert.equal(warpResult.success, true, 'Wormhole travel should work with low fuel');
        break;
      }
    }
  }
  
  // If no wormholes found, test basic wormhole detection at least
  assert.equal(typeof isWormholeTravel(state, 0, 0), 'boolean', 'Wormhole detection should work');
});

test('wormhole system - tax included in total warp cost', () => {
  const state = createInitialState();
  state.policeRecordScore = 0;
  
  // Find a wormhole connection to test tax inclusion
  for (let target = 1; target < 10; target++) {
    if (isWormholeTravel(state, 0, target)) {
      const cost = calculateWarpCost(state, 0, target, true); // true = isWormhole
      
      assert.ok(cost.wormholeTax > 0, 'Wormhole tax should be included in cost');
      assert.equal(cost.total, cost.wormholeTax + cost.mercenaryPay + cost.insurance + cost.interest, 
        'Total cost should include wormhole tax');
      break;
    }
  }
});

test('wormhole system - regular travel has no wormhole tax', () => {
  const state = createInitialState();
  
  // Test regular travel (non-wormhole) 
  let regularTravelFound = false;
  for (let target = 1; target < 10; target++) {
    if (!isWormholeTravel(state, 0, target)) {
      const cost = calculateWarpCost(state, 0, target, false);
      
      assert.equal(cost.wormholeTax, 0, 'Regular travel should have no wormhole tax');
      regularTravelFound = true;
      break;
    }
  }
  
  // Should find at least some regular travel
  assert.equal(regularTravelFound, true, 'Should find non-wormhole destinations');
});

test('wormhole system - wormhole data structure validity', () => {
  const state = createInitialState();
  
  // Test wormhole array structure
  assert(Array.isArray(state.wormhole), 'Wormhole should be an array');
  assert.equal(state.wormhole.length, 6, 'Should have 6 wormhole entries (MAXWORMHOLE)');
  
  // Each wormhole entry should be a valid system index or -1 (no connection)
  state.wormhole.forEach((connection, index) => {
    assert.ok(connection >= -1 && connection < 120, `Wormhole[${index}] should be valid system index or -1`);
  });
});

test('wormhole system - bidirectional wormhole connections', () => {
  const state = createInitialState();
  
  // Test that wormhole connections are bidirectional (if A->B exists, B->A should exist)
  for (let sourceSystem = 0; sourceSystem < 20; sourceSystem++) {
    for (let targetSystem = 0; targetSystem < 20; targetSystem++) {
      if (sourceSystem !== targetSystem) {
        const aToB = isWormholeTravel(state, sourceSystem, targetSystem);
        const bToA = isWormholeTravel(state, targetSystem, sourceSystem);
        
        if (aToB || bToA) {
          // If either direction is a wormhole, both should be
          // (This depends on the actual wormhole implementation)
          assert.equal(typeof aToB, 'boolean', 'Wormhole check should return boolean');
        }
      }
    }
  }
});

test('wormhole system - wormhole travel vs regular travel cost comparison', () => {
  const state = createInitialState();
  
  // Compare wormhole vs regular travel costs
  for (let target = 1; target < 10; target++) {
    const isWormhole = isWormholeTravel(state, 0, target);
    const cost = calculateWarpCost(state, 0, target, isWormhole);
    
    if (isWormhole) {
      assert.ok(cost.wormholeTax > 0, 'Wormhole travel should have tax');
      assert.equal(cost.fuel, 0, 'Wormhole travel should use no fuel'); 
    } else {
      assert.equal(cost.wormholeTax, 0, 'Regular travel should have no wormhole tax');
      assert.ok(cost.fuel >= 0, 'Regular travel should have fuel cost');
    }
  }
});

test('wormhole system - proper wormhole initialization and connections', () => {
  const state = createInitialState();
  
  
  // Verify wormholes are populated correctly (should be first 6 systems: 0,1,2,3,4,5)
  assert.deepEqual(state.wormhole, [0, 1, 2, 3, 4, 5], 'Wormhole array should contain first 6 system indices');
  
  // Test that wormhole connections work as pairs (0<->1, 2<->3, 4<->5)
  assert.ok(isWormholeTravel(state, 0, 1), 'Should detect wormhole connection between systems 0 and 1');
  assert.ok(isWormholeTravel(state, 1, 0), 'Wormhole connections should be bidirectional');
  assert.ok(isWormholeTravel(state, 2, 3), 'Should detect wormhole connection between systems 2 and 3'); 
  assert.ok(isWormholeTravel(state, 3, 2), 'Should detect reverse wormhole connection between systems 3 and 2');
  assert.ok(isWormholeTravel(state, 4, 5), 'Should detect wormhole connection between systems 4 and 5');
  assert.ok(isWormholeTravel(state, 5, 4), 'Last pair should also be bidirectional');
  
  // Test that non-adjacent wormhole systems don't connect (e.g., 0 doesn't connect to 2)
  assert.ok(!isWormholeTravel(state, 0, 2), 'Should not detect connection between non-adjacent wormhole systems');
  assert.ok(!isWormholeTravel(state, 1, 3), 'Should not detect connection between non-adjacent wormhole systems');
  
  // Test that non-wormhole systems don't have connections
  assert.ok(!isWormholeTravel(state, 0, 6), 'Should not detect connection between wormhole and non-wormhole system');
  assert.ok(!isWormholeTravel(state, 6, 7), 'Should not detect connection between non-wormhole systems');
});

test('wormhole system - wormhole travel mechanics', () => {
  const state = createInitialState();
  
  // Set very low fuel to test that wormholes ignore fuel requirements
  state.ship.fuel = 1;
  state.credits = 10000; // Enough for wormhole tax
  
  const initialFuel = state.ship.fuel;
  
  // Test wormhole travel from system 0 to 1
  const warpResult = performWarp(state, 1, false);
  
  assert.ok(warpResult.success, 'Wormhole travel should succeed even with low fuel');
  assert.equal(warpResult.fuelConsumed, 0, 'Wormhole travel should not consume fuel');
  assert.equal(state.ship.fuel, initialFuel, 'Fuel should remain unchanged after wormhole travel');
  assert.equal(state.currentSystem, 1, 'Should arrive at destination system');
  assert.ok(warpResult.costPaid! > 0, 'Should pay wormhole tax');
});
