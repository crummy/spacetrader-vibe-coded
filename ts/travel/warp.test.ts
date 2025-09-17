// Warp System Tests
// Test-Driven Development: Write tests FIRST before implementation

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import type { GameState, SolarSystem, MutableTradeItemArray } from '../types.ts';
import { createInitialState } from '../state.ts';
import { 
  calculateDistance, getFuelTanks, getCurrentFuel, calculateWarpCost,
  canWarpTo, performWarp, calculateWormholeTax, isWormholeTravel
} from './warp.ts';
import type { WarpResult } from './warp.ts';

describe('Warp System', () => {

  describe('Distance Calculations', () => {
    test('should calculate distance between two systems correctly', () => {
      const systemA: SolarSystem = { x: 0, y: 0, nameIndex: 0, size: 0, techLevel: 0, 
        politics: 0, specialResources: 0, status: 0, visited: false, qty: new Array(10).fill(0) as MutableTradeItemArray, countDown: 0, special: -1 };
      const systemB: SolarSystem = { x: 3, y: 4, nameIndex: 1, size: 0, techLevel: 0,
        politics: 0, specialResources: 0, status: 0, visited: false, qty: new Array(10).fill(0) as MutableTradeItemArray, countDown: 0, special: -1 };
      
      // 3-4-5 triangle: sqrt(3^2 + 4^2) = sqrt(9 + 16) = sqrt(25) = 5
      assert.equal(calculateDistance(systemA, systemB), 5);
    });

    test('should handle same system distance (zero)', () => {
      const system: SolarSystem = { x: 10, y: 20, nameIndex: 0, size: 0, techLevel: 0,
        politics: 0, specialResources: 0, status: 0, visited: false, qty: new Array(10).fill(0) as MutableTradeItemArray, countDown: 0, special: -1 };
      
      assert.equal(calculateDistance(system, system), 0);
    });

    test('should calculate distance for negative coordinates', () => {
      const systemA: SolarSystem = { x: -3, y: -4, nameIndex: 0, size: 0, techLevel: 0,
        politics: 0, specialResources: 0, status: 0, visited: false, qty: new Array(10).fill(0) as MutableTradeItemArray, countDown: 0, special: -1 };
      const systemB: SolarSystem = { x: 0, y: 0, nameIndex: 1, size: 0, techLevel: 0,
        politics: 0, specialResources: 0, status: 0, visited: false, qty: new Array(10).fill(0) as MutableTradeItemArray, countDown: 0, special: -1 };
      
      assert.equal(calculateDistance(systemA, systemB), 5);
    });
  });

  describe('Fuel System', () => {
    test('should return base fuel tanks from ship type', () => {
      const state = createInitialState();
      // Default starting ship is Gnat (type 1) with 14 fuel tanks
      
      const tanks = getFuelTanks(state.ship);
      assert.equal(tanks, 14);
    });

    test('should return increased fuel tanks with fuel compactor', () => {
      const state = createInitialState();
      // Starting ship is Gnat (type 1) with 14 tanks normally
      state.ship.gadget[0] = 5; // FUELCOMPACTOR = 5
      
      const tanks = getFuelTanks(state.ship);
      assert.equal(tanks, 18); // Palm OS: fuel compactor gives 18 tanks regardless
    });

    test('should return current fuel limited by tank capacity', () => {
      const state = createInitialState();
      // Starting ship is Gnat with 14 fuel tanks
      state.ship.fuel = 20; // More than tank capacity
      
      const fuel = getCurrentFuel(state.ship);
      assert.equal(fuel, 14); // Limited by tank capacity
    });

    test('should return actual fuel when less than capacity', () => {
      const state = createInitialState();
      // Starting ship is Gnat with 14 fuel tanks
      state.ship.fuel = 10;
      
      const fuel = getCurrentFuel(state.ship);
      assert.equal(fuel, 10);
    });
  });

  describe('Wormhole System', () => {
    test('should identify wormhole travel between connected systems', () => {
      const state = createInitialState();
      // Set up wormholes - first wormhole connects system 0 to system 1
      state.wormhole[0] = 0;
      state.wormhole[1] = 1;
      
      assert.equal(isWormholeTravel(state, 0, 1), true);
      assert.equal(isWormholeTravel(state, 1, 0), true);
    });

    test('should not identify regular travel as wormhole', () => {
      const state = createInitialState();
      // No wormhole connection between systems 0 and 2
      
      assert.equal(isWormholeTravel(state, 0, 2), false);
    });

    test('should calculate wormhole tax correctly', () => {
      const state = createInitialState();
      // Starting ship is Gnat (type 1) with cost of fuel = 2
      
      const tax = calculateWormholeTax(state.ship);
      assert.equal(tax, 50); // CostOfFuel * 25 = 2 * 25 = 50
    });
  });

  describe('Warp Cost Calculation', () => {
    test('should calculate base warp cost with no extras', () => {
      const state = createInitialState();
      // Starting ship is Gnat (type 1)
      state.debt = 0;
      state.insurance = false;
      // No crew beyond commander
      
      const cost = calculateWarpCost(state, 0, 1, false); // Not wormhole
      assert.equal(cost.total, 0); // No costs
      assert.equal(cost.wormholeTax, 0);
      assert.equal(cost.mercenaryPay, 0);
      assert.equal(cost.insurance, 0);
      assert.equal(cost.interest, 0);
    });

    test('should include wormhole tax for wormhole travel', () => {
      const state = createInitialState();
      // Starting ship is Gnat (type 1) with CostOfFuel = 2
      state.wormhole[0] = 0;
      state.wormhole[1] = 1;
      
      const cost = calculateWarpCost(state, 0, 1, true); // Wormhole
      assert.equal(cost.wormholeTax, 50); // 2 * 25 = 50
      assert.equal(cost.total, 50);
    });

    test('should include mercenary pay for crew members', () => {
      const state = createInitialState();
      state.ship.crew[1] = 1; // Second crew member (index 1 mercenary)
      
      // Set up mercenary with known skills: pilot=3, fighter=3, trader=3, engineer=3 = 12 total
      // Pay = 12 * 3 = 36
      state.mercenary[1] = {
        nameIndex: 1,
        pilot: 3,
        fighter: 3,
        trader: 3,
        engineer: 3,
        curSystem: 0
      };
      
      const cost = calculateWarpCost(state, 0, 1, false);
      assert.equal(cost.mercenaryPay, 36);
      assert.equal(cost.total, 36);
    });

    test('should include insurance cost when active', () => {
      const state = createInitialState();
      state.insurance = true;
      state.noClaim = 90; // 90% no claim bonus
      // Insurance calculation is complex, test basic inclusion
      
      const cost = calculateWarpCost(state, 0, 1, false);
      assert.ok(cost.insurance > 0);
      assert.equal(cost.total, cost.insurance);
    });

    test('should include interest on debt', () => {
      const state = createInitialState();
      state.debt = 1000;
      
      const cost = calculateWarpCost(state, 0, 1, false);
      assert.equal(cost.interest, 100); // 10% of 1000
      assert.equal(cost.total, 100);
    });

    test('should include minimum interest of 1 credit', () => {
      const state = createInitialState();
      state.debt = 5; // Very small debt
      
      const cost = calculateWarpCost(state, 0, 1, false);
      assert.equal(cost.interest, 1); // Minimum 1 credit
      assert.equal(cost.total, 1);
    });
  });

  describe('Warp Validation', () => {
    test('should allow warp when conditions are met', () => {
      const state = createInitialState();
      state.credits = 1000;
      state.currentSystem = 0;
      
      // Use system 49 which is reachable (distance 7 with Gnat's 14 fuel)
      const result = canWarpTo(state, 49);
      assert.equal(result.canWarp, true);
    });

    test('should prevent warp when out of fuel range', () => {
      const state = createInitialState();
      state.currentSystem = 0;
      state.credits = 1000;
      state.ship.fuel = 0; // No fuel at all
      
      const result = canWarpTo(state, 49); // Even reachable system fails with no fuel
      assert.equal(result.canWarp, false);
      assert.ok(result.reason.startsWith('Out of fuel range (need'));
    });

    test('should allow wormhole warp regardless of fuel', () => {
      const state = createInitialState();
      state.ship.fuel = 1; // Very low fuel
      state.credits = 1000;
      state.currentSystem = 0;
      state.wormhole[0] = 0;
      state.wormhole[1] = 1;
      
      const result = canWarpTo(state, 1);
      assert.equal(result.canWarp, true);
    });

    test('should prevent warp when insufficient credits', () => {
      const state = createInitialState();
      state.credits = 10; // Very low credits
      state.debt = 2000; // High debt means high interest (200 credits)
      state.currentSystem = 0;
      
      // Use system 49 which is reachable with Gnat's 14 fuel (distance 7)
      const result = canWarpTo(state, 49);
      assert.equal(result.canWarp, false);
      assert.equal(result.reason, 'Insufficient credits: need 200, have 10 (Debt interest: 200)');
    });

    test('should prevent warp when debt too large', () => {
      const state = createInitialState();
      state.credits = 100000;
      state.debt = 150000; // > DEBTTOOLARGE (100000)
      state.currentSystem = 0;
      
      const result = canWarpTo(state, 49);
      assert.equal(result.canWarp, false);
      assert.equal(result.reason, 'Debt too large');
    });

    test('should prevent warp when Wild aboard without beam laser', () => {
      const state = createInitialState();
      state.credits = 1000;
      state.wildStatus = 1; // Wild is aboard
      state.currentSystem = 0;
      // No beam laser weapon
      
      const result = canWarpTo(state, 49);
      assert.equal(result.canWarp, false);
      assert.equal(result.reason, 'Wild refuses to travel without beam laser');
    });

    test('should allow warp when Wild aboard with beam laser', () => {
      const state = createInitialState();
      state.credits = 1000;
      state.wildStatus = 1; // Wild is aboard
      state.ship.weapon[0] = 1; // BEAMLASERWEAPON = 1
      state.currentSystem = 0;
      
      // Use system 49 which is reachable (distance 7 with Gnat's 14 fuel)
      const result = canWarpTo(state, 49);
      assert.equal(result.canWarp, true);
    });
  });

  describe('Warp Execution', () => {
    test('should successfully execute normal warp', () => {
      const state = createInitialState();
      state.credits = 1000;
      state.currentSystem = 0;
      state.debt = 500; // Add some debt to create interest cost
      
      const initialFuel = state.ship.fuel;
      const initialCredits = state.credits;
      const expectedDistance = calculateDistance(state.solarSystem[0], state.solarSystem[49]);
      
      const result = performWarp(state, 49, false);
      
      assert.equal(result.success, true);
      assert.equal(state.currentSystem, 49);
      assert.equal(state.ship.fuel, initialFuel - expectedDistance); // Consumed fuel for actual distance
      assert.ok(state.credits < initialCredits); // Some costs deducted (interest on debt)
    });

    test('should successfully execute wormhole warp', () => {
      const state = createInitialState();
      state.ship.fuel = 5;
      state.credits = 100;
      state.currentSystem = 0;
      state.wormhole[0] = 0;
      state.wormhole[1] = 1;
      
      const result = performWarp(state, 1, false);
      
      assert.equal(result.success, true);
      assert.equal(state.currentSystem, 1);
      assert.equal(state.ship.fuel, 5); // No fuel consumed for wormhole
      assert.equal(state.credits, 50); // 100 - 50 wormhole tax (Gnat has costOfFuel=2, so 2*25=50)
    });

    test('should reset shield strength after warp', () => {
      const state = createInitialState();
      state.credits = 1000;
      state.currentSystem = 0;
      state.ship.shield[0] = 0; // ENERGYSHIELD = 0, power = 100
      state.ship.shieldStrength[0] = 50; // Damaged
      
      const result = performWarp(state, 49, false);
      
      assert.equal(result.success, true);
      assert.equal(state.ship.shieldStrength[0], 100); // Reset to full
    });

    test('should handle singularity warp (skip costs)', () => {
      const state = createInitialState();
      state.ship.fuel = 3;
      state.credits = 50; // Insufficient for normal costs
      state.debt = 1000; // Would cause interest
      state.currentSystem = 0;
      
      const result = performWarp(state, 49, true); // Via singularity
      
      assert.equal(result.success, true);
      assert.equal(state.currentSystem, 49);
      assert.equal(state.credits, 50); // No costs deducted for singularity
    });

    test('should fail when warp conditions not met', () => {
      const state = createInitialState();
      state.credits = 1000;
      state.currentSystem = 0;
      state.ship.fuel = 0; // No fuel at all
      
      const result = performWarp(state, 49, false);
      
      assert.equal(result.success, false);
      assert.equal(state.currentSystem, 0); // No change
      assert.equal(state.ship.fuel, 0); // No fuel consumed
    });

    test('should mark destination system as visited', () => {
      const state = createInitialState();
      state.credits = 1000;
      state.currentSystem = 0;
      state.solarSystem[49].visited = false;
      
      const result = performWarp(state, 49, false);
      
      assert.equal(result.success, true);
      assert.equal(state.solarSystem[49].visited, true);
    });
  });

  describe('Edge Cases and Integration', () => {
    test('should handle warp to same system (should fail)', () => {
      const state = createInitialState();
      state.ship.fuel = 10;
      state.credits = 1000;
      state.currentSystem = 5;
      
      const result = performWarp(state, 5, false);
      
      assert.equal(result.success, false);
      assert.equal(result.reason, 'Cannot warp to current system');
    });

    test('should handle multiple costs correctly', () => {
      const state = createInitialState();
      state.ship.fuel = 10;
      state.credits = 1000;
      state.currentSystem = 0;
      state.debt = 500; // 50 interest
      state.insurance = true;
      state.ship.crew[1] = 1; // Mercenary pay
      state.wormhole[0] = 0;
      state.wormhole[1] = 1; // 25 wormhole tax
      
      const initialCredits = state.credits;
      const result = performWarp(state, 1, false);
      
      assert.equal(result.success, true);
      const totalCost = initialCredits - state.credits;
      assert.ok(totalCost > 75); // At least wormhole tax + interest + mercenary + insurance
    });

    test('should validate system indices', () => {
      const state = createInitialState();
      state.ship.fuel = 10;
      state.credits = 1000;
      state.currentSystem = 0;
      
      const result = performWarp(state, 150, false); // Invalid system
      
      assert.equal(result.success, false);
      assert.equal(result.reason, 'Invalid destination system');
    });
  });
});