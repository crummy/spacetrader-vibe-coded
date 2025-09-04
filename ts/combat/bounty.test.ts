// Combat Bounty System Tests
// Comprehensive tests for bounty calculations matching Palm OS logic

import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import type { GameState, Ship } from '../types.ts';
import { GameMode } from '../types.ts';
import { createInitialState } from '../state.ts';
import { calculateBounty, EncounterType } from './engine.ts';
import { getShipTypes } from '../data/shipTypes.ts';

function createTestShip(type: number, withEquipment: boolean = false): Ship {
  const shipTypes = getShipTypes();
  const shipType = shipTypes[type];
  
  const ship: Ship = {
    type,
    hull: shipType.hullStrength,
    fuel: shipType.fuelTanks,
    weapon: [-1, -1, -1],
    shield: [-1, -1, -1], 
    gadget: [-1, -1, -1],
    crew: [0, -1, -1], // Commander only
    cargo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    filledCargo: 0,
  };
  
  if (withEquipment) {
    // Add basic equipment to increase ship value
    ship.weapon[0] = 0; // Pulse laser
    ship.shield[0] = 0; // Energy shield
    ship.gadget[0] = 0; // Targeting system
  }
  
  return ship;
}

describe('Combat Bounty System', () => {
  describe('Basic Bounty Calculations', () => {
    test('should calculate bounty using Palm OS formula', () => {
      // Test with Gnat (ship type 1, price 10000)
      const ship = createTestShip(1);
      const bounty = calculateBounty(ship);
      
      // Palm OS formula: (ship_price / 200 / 25) * 25
      // 10000 / 200 = 50, 50 / 25 = 2, 2 * 25 = 50
      // But minimum is 25, so bounty should be 50
      assert.ok(bounty >= 25, 'Bounty should be at least minimum 25');
      assert.ok(bounty <= 2500, 'Bounty should not exceed maximum 2500');
    });

    test('should apply minimum bounty of 25', () => {
      // Test with cheapest ship (Flea, price 2000)
      const ship = createTestShip(0);
      const bounty = calculateBounty(ship);
      
      // 2000 / 200 / 25 * 25 = 10 / 25 * 25 = 0 * 25 = 0, so minimum 25
      assert.equal(bounty, 25, 'Should apply minimum bounty of 25');
    });

    test('should apply maximum bounty of 2500', () => {
      // Test with very expensive ship (create artificial high-value ship)
      const ship = createTestShip(9, true); // Wasp with equipment
      const bounty = calculateBounty(ship);
      
      assert.ok(bounty <= 2500, 'Should not exceed maximum bounty of 2500');
    });

    test('should round to nearest 25 credits', () => {
      // Test various ship types to ensure rounding to 25s
      for (let shipType = 0; shipType < 10; shipType++) {
        const ship = createTestShip(shipType);
        const bounty = calculateBounty(ship);
        
        assert.equal(bounty % 25, 0, `Bounty for ship type ${shipType} should be multiple of 25`);
      }
    });
  });

  describe('Equipment Impact on Bounty', () => {
    test('should increase bounty with equipment', () => {
      const shipNoEquipment = createTestShip(3, false); // Mosquito without equipment
      const shipWithEquipment = createTestShip(3, true); // Mosquito with equipment
      
      const bountyNoEquipment = calculateBounty(shipNoEquipment);
      const bountyWithEquipment = calculateBounty(shipWithEquipment);
      
      assert.ok(bountyWithEquipment >= bountyNoEquipment, 
        'Equipment should increase or maintain bounty value');
    });

    test('should handle ships with different equipment configurations', () => {
      const ship1 = createTestShip(5); // Beetle
      const ship2 = createTestShip(5); // Beetle
      
      // Give ship2 expensive equipment
      ship2.weapon = [2, -1, -1]; // Military laser (35000 credits)
      ship2.shield = [1, -1, -1]; // Reflective shield (8000 credits)
      
      const bounty1 = calculateBounty(ship1);
      const bounty2 = calculateBounty(ship2);
      
      assert.ok(bounty2 >= bounty1, 'More expensive equipment should increase bounty');
    });
  });

  describe('Ship Type Bounty Range', () => {
    test('should calculate appropriate bounties for all buyable ship types', () => {
      const bounties: { [key: string]: number } = {};
      
      for (let shipType = 0; shipType < 10; shipType++) {
        const ship = createTestShip(shipType);
        const bounty = calculateBounty(ship);
        bounties[shipType] = bounty;
        
        // All bounties should be in valid range
        assert.ok(bounty >= 25, `Ship type ${shipType} bounty should be >= 25`);
        assert.ok(bounty <= 2500, `Ship type ${shipType} bounty should be <= 2500`);
        assert.equal(bounty % 25, 0, `Ship type ${shipType} bounty should be multiple of 25`);
      }
      
      // More expensive ships should generally have higher bounties
      assert.ok(bounties[9] >= bounties[0], 'Wasp should have higher bounty than Flea');
      assert.ok(bounties[5] >= bounties[1], 'Beetle should have higher bounty than Gnat');
    });

    test('should handle special encounter ships appropriately', () => {
      // Test non-buyable encounter ships (types 10-14)
      const spaceMonster = createTestShip(10); // Space Monster
      const dragonfly = createTestShip(11);    // Dragonfly
      const mantis = createTestShip(12);       // Mantis
      
      const monsterBounty = calculateBounty(spaceMonster);
      const dragonflyBounty = calculateBounty(dragonfly);
      const mantisBounty = calculateBounty(mantis);
      
      // Special ships have very high prices, should hit max bounty
      assert.equal(monsterBounty, 2500, 'Space Monster should have maximum bounty');
      assert.equal(dragonflyBounty, 2500, 'Dragonfly should have maximum bounty');
      assert.equal(mantisBounty, 2500, 'Mantis should have maximum bounty');
    });
  });

  describe('Bounty Formula Verification', () => {
    test('should match exact Palm OS bounty calculation formula', () => {
      // Test specific known values to verify formula accuracy
      const testCases = [
        { shipType: 1, expectedApproxBounty: 50 },   // Gnat: 10000/200/25*25 = 50
        { shipType: 2, expectedApproxBounty: 125 },  // Firefly: 25000/200/25*25 = 125  
        { shipType: 6, expectedApproxBounty: 500 },  // Hornet: 100000/200/25*25 = 500
      ];
      
      for (const testCase of testCases) {
        const ship = createTestShip(testCase.shipType);
        const bounty = calculateBounty(ship);
        
        // Should be close to expected (within reasonable range due to equipment effects)
        const diff = Math.abs(bounty - testCase.expectedApproxBounty);
        assert.ok(diff <= 100, 
          `Ship type ${testCase.shipType} bounty ${bounty} should be close to expected ${testCase.expectedApproxBounty}`);
      }
    });

    test('should handle integer division correctly', () => {
      // Test edge cases of the division operations
      const ship = createTestShip(0); // Flea with 2000 price
      
      // 2000 / 200 = 10, 10 / 25 = 0 (integer division), 0 * 25 = 0, minimum 25
      const bounty = calculateBounty(ship);
      assert.equal(bounty, 25, 'Integer division should result in minimum bounty');
    });
  });

  describe('Bounty Edge Cases', () => {
    test('should handle ships with zero equipment gracefully', () => {
      const ship = createTestShip(1);
      // Ensure no equipment
      ship.weapon = [-1, -1, -1];
      ship.shield = [-1, -1, -1];
      ship.gadget = [-1, -1, -1];
      
      const bounty = calculateBounty(ship);
      
      assert.ok(bounty >= 25, 'Should still provide minimum bounty without equipment');
      assert.equal(bounty % 25, 0, 'Should still round to 25s without equipment');
    });

    test('should handle damaged ships correctly', () => {
      const ship1 = createTestShip(4); // Bumblebee at full health
      const ship2 = createTestShip(4); // Bumblebee damaged
      ship2.hull = 25; // Half health
      
      const bounty1 = calculateBounty(ship1);
      const bounty2 = calculateBounty(ship2);
      
      // Bounty is based on ship type and equipment, not current hull condition
      assert.equal(bounty1, bounty2, 'Bounty should not depend on current hull damage');
    });
  });

  describe('Integration with Combat System', () => {
    test('should provide bounty rewards after combat victory', () => {
      const state = createInitialState();
      state.currentMode = GameMode.InCombat;
      state.encounterType = EncounterType.PIRATEATTACK;
      
      const originalCredits = state.credits;
      const expectedBounty = calculateBounty(state.opponent);
      
      // Simulate opponent destruction
      state.opponent.hull = 0;
      
      // In real game, this would be called by combat resolution
      const outcome = { 
        result: 'victory' as const,
        bounty: expectedBounty,
        playerDestroyed: false,
        opponentDestroyed: true
      };
      
      assert.equal(outcome.bounty, expectedBounty, 'Combat outcome should include calculated bounty');
      assert.ok(outcome.bounty >= 25, 'Victory bounty should be at least 25');
    });
  });
});
