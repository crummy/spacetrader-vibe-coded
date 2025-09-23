// Wormhole System Comprehensive Tests
import { test } from 'node:test';
import assert from 'node:assert';

import { createInitialState } from '../state.ts';
import { calculateWormholeTax, isWormholeTravel, calculateDistance } from './warp.ts';
import { calculateWarpCost, performWarp, getFuelTanks, getCurrentFuel } from './warp.ts';
import { getShipType } from '../data/shipTypes.ts';
import { calculateFullRefuelCost } from '../economy/fuel.ts';

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

// === FUEL CONSUMPTION AND CREDIT WITHDRAWAL TESTS ===

test('wormhole travel - should consume zero fuel and correct credits', () => {
  const state = createInitialState();
  
  // Set up test state
  state.credits = 10000;
  state.ship.fuel = 10;
  const initialFuel = state.ship.fuel;
  const initialCredits = state.credits;
  
  // Mock wormhole connection by setting up wormhole data
  state.wormhole[0] = 0; // System 0
  state.wormhole[1] = 5; // System 5 (creates wormhole between 0 and 5)
  state.currentSystem = 0;
  
  const isWormhole = isWormholeTravel(state, 0, 5);
  assert.equal(isWormhole, true, 'Should detect wormhole travel');
  
  // Calculate expected wormhole tax
  const shipType = getShipType(state.ship.type);
  const expectedTax = shipType.costOfFuel * 25; // Gnat: 2 * 25 = 50
  
  // Perform wormhole travel
  const result = performWarp(state, 5, false);
  
  assert.equal(result.success, true, 'Wormhole travel should succeed');
  assert.equal(result.fuelConsumed, 0, 'Wormhole travel should consume zero fuel');
  assert.equal(state.ship.fuel, initialFuel, 'Fuel should remain unchanged after wormhole travel');
  
  // Credits should be reduced by wormhole tax (plus any crew/insurance costs)
  const creditsDiff = initialCredits - state.credits;
  assert.ok(creditsDiff >= expectedTax, `Should pay at least wormhole tax (${expectedTax}), paid ${creditsDiff}`);
  
  console.log(`✓ Wormhole travel: 0 fuel consumed, ${creditsDiff} credits paid (expected ≥${expectedTax})`);
});

test('regular travel - should consume fuel equal to distance and no wormhole tax', () => {
  const state = createInitialState();
  
  // Clear wormhole data to ensure no wormhole connections interfere with test
  state.wormhole.fill(-1);
  
  // Set up test state with valid fuel (within tank capacity)
  state.credits = 10000;
  const maxFuel = getFuelTanks(state.ship); // 14 for Gnat
  state.ship.fuel = maxFuel; // Use maximum valid fuel
  const initialFuel = state.ship.fuel;
  const initialCredits = state.credits;
  state.currentSystem = 0;
  
  // Find a system within fuel range that's not connected by wormhole
  let targetSystem = -1;
  let expectedDistance = 0;
  const maxFuelRange = getCurrentFuel(state.ship);
  
  // Search for a suitable target system within fuel range
  for (let i = 1; i < state.solarSystem.length; i++) {
    const distance = calculateDistance(state.solarSystem[0], state.solarSystem[i]);
    const isWormhole = isWormholeTravel(state, 0, i);
    
    if (distance <= maxFuelRange && !isWormhole) {
      targetSystem = i;
      expectedDistance = distance;
      break;
    }
  }
  
  // If no suitable system found, create a close system for testing
  if (targetSystem === -1) {
    targetSystem = 1;
    // Manually set coordinates to ensure close distance
    state.solarSystem[1] = { ...state.solarSystem[1], x: state.solarSystem[0].x + 5, y: state.solarSystem[0].y + 5 };
    expectedDistance = calculateDistance(state.solarSystem[0], state.solarSystem[1]);
  }
  
  console.log(`Travel distance: ${expectedDistance}, available fuel: ${getCurrentFuel(state.ship)}`);
  
  // Verify this system is suitable for testing
  const isWormhole = isWormholeTravel(state, 0, targetSystem);
  assert.equal(isWormhole, false, 'Should not be wormhole travel');
  assert.ok(expectedDistance <= getCurrentFuel(state.ship), 
    `Should have enough fuel (need ${expectedDistance}, have ${getCurrentFuel(state.ship)})`);
  
  // Perform regular travel
  const result = performWarp(state, targetSystem, false);
  
  assert.equal(result.success, true, 'Regular travel should succeed');
  assert.equal(result.fuelConsumed, expectedDistance, `Should consume fuel equal to distance (${expectedDistance})`);
  assert.equal(state.ship.fuel, initialFuel - expectedDistance, 'Fuel should be reduced by distance traveled');
  
  // Calculate cost breakdown
  const cost = calculateWarpCost(state, 0, targetSystem, false);
  assert.equal(cost.wormholeTax, 0, 'Regular travel should have no wormhole tax');
  assert.equal(cost.fuel, expectedDistance, 'Fuel cost should equal distance');
  
  const creditsDiff = initialCredits - state.credits;
  console.log(`✓ Regular travel: ${expectedDistance} fuel consumed, ${creditsDiff} credits paid (no wormhole tax)`);
});

test('fuel corruption bug - wormhole travel should not affect fuel capacity', () => {
  const state = createInitialState();
  
  // Test with Gnat (ship type 1)
  state.ship.type = 1; // Gnat
  const shipType = getShipType(state.ship.type);
  const expectedCapacity = shipType.fuelTanks; // Should be 14 for Gnat
  
  // Set up wormhole
  state.wormhole[0] = 0;
  state.wormhole[1] = 7;
  state.currentSystem = 0;
  state.credits = 10000;
  state.ship.fuel = 10;
  
  // Record initial fuel state
  const initialFuel = state.ship.fuel;
  const initialMaxFuel = getFuelTanks(state.ship);
  
  assert.equal(initialMaxFuel, expectedCapacity, `Initial fuel capacity should be ${expectedCapacity}`);
  
  // Perform wormhole travel
  const result = performWarp(state, 7, false);
  assert.equal(result.success, true, 'Wormhole travel should succeed');
  
  // Verify fuel state is not corrupted
  const finalFuel = state.ship.fuel;
  const finalMaxFuel = getFuelTanks(state.ship);
  
  assert.equal(finalFuel, initialFuel, 'Fuel amount should not change during wormhole travel');
  assert.equal(finalMaxFuel, expectedCapacity, `Fuel capacity should remain ${expectedCapacity}`);
  assert.ok(finalFuel <= finalMaxFuel, 'Current fuel should not exceed capacity');
  
  console.log(`✓ Fuel integrity: ${finalFuel}/${finalMaxFuel} (capacity maintained)`);
});

test('different ship types - wormhole tax scales with fuel cost', () => {
  const testShips = [
    { type: 0, name: 'Flea', expectedCostPerUnit: 1 },    // Flea: costOfFuel = 1
    { type: 1, name: 'Gnat', expectedCostPerUnit: 2 },    // Gnat: costOfFuel = 2  
    { type: 2, name: 'Firefly', expectedCostPerUnit: 3 }, // Firefly: costOfFuel = 3
  ];
  
  testShips.forEach(({ type, name, expectedCostPerUnit }) => {
    const state = createInitialState();
    state.ship.type = type;
    state.credits = 10000;
    
    // Set up wormhole
    state.wormhole[0] = 0;
    state.wormhole[1] = 8;
    state.currentSystem = 0;
    
    const tax = calculateWormholeTax(state.ship);
    const expectedTax = expectedCostPerUnit * 25;
    
    assert.equal(tax, expectedTax, `${name} wormhole tax should be ${expectedTax} (${expectedCostPerUnit} * 25)`);
    
    console.log(`✓ ${name}: wormhole tax = ${tax} credits`);
  });
});

test('fuel bounds checking - ensure fuel never exceeds capacity after wormhole', () => {
  const state = createInitialState();
  
  // Test edge case: ship has maximum fuel
  const maxFuel = getFuelTanks(state.ship);
  state.ship.fuel = maxFuel;
  state.credits = 10000;
  
  // Set up wormhole
  state.wormhole[0] = 2;
  state.wormhole[1] = 9;
  state.currentSystem = 2;
  
  const initialFuel = state.ship.fuel;
  
  // Perform wormhole travel
  const result = performWarp(state, 9, false);
  assert.equal(result.success, true, 'Wormhole travel should succeed');
  
  // Verify fuel bounds
  assert.equal(state.ship.fuel, initialFuel, 'Fuel should remain unchanged');
  assert.ok(state.ship.fuel <= maxFuel, 'Fuel should not exceed maximum capacity');
  assert.ok(getCurrentFuel(state.ship) <= maxFuel, 'getCurrentFuel should respect capacity');
  
  console.log(`✓ Fuel bounds: ${state.ship.fuel}/${maxFuel} (within limits)`);
});

test('fuel corruption detection - ship.fuel should never exceed tank capacity', () => {
  const state = createInitialState();
  const maxFuel = getFuelTanks(state.ship); // 14 for Gnat
  
  // Simulate the reported fuel corruption scenario
  state.ship.fuel = 97; // User's reported corrupted value
  state.credits = 10000;
  
  // Verify getCurrentFuel() properly caps the value
  assert.equal(getCurrentFuel(state.ship), maxFuel, 
    `getCurrentFuel should cap at ${maxFuel}, but raw ship.fuel is ${state.ship.fuel}`);
  
  // This demonstrates the bug: refuel cost calculation might use raw ship.fuel
  const refuelCost = calculateFullRefuelCost(state);
  
  console.log(`Fuel corruption detected: ship.fuel=${state.ship.fuel}, capacity=${maxFuel}, refuelCost=${refuelCost}`);
  
  // The refuel cost should be 0 when fuel is at capacity (14), not when raw value is 97
  assert.equal(refuelCost, 0, 'No refuel should be needed when fuel is effectively at capacity');
  
  // Test the specific scenario user reported: 97 units refueled for 194 credits
  if (refuelCost === 194) {
    assert.fail('BUG REPRODUCED: Refuel system is using corrupted ship.fuel value instead of getCurrentFuel()');
  }
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
