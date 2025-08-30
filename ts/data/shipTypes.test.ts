// Ship Types System Tests
// Test-Driven Development: Write tests FIRST before implementation

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import type { ShipType } from '../types.ts';
import { MAXSHIPTYPE } from '../types.ts';
import { getShipTypes, getShipType } from './shipTypes.ts';

describe('Ship Types System', () => {
  test('should have exactly 15 ship types (MAXSHIPTYPE + EXTRASHIPS)', () => {
    const shipTypes = getShipTypes();
    assert.equal(shipTypes.length, 15); // MAXSHIPTYPE (10) + EXTRASHIPS (5)
  });

  test('should match exact Palm OS ship type data', () => {
    const shipTypes = getShipTypes();

    // Flea - index 0
    const flea = shipTypes[0];
    assert.equal(flea.name, 'Flea');
    assert.equal(flea.cargoBays, 10);
    assert.equal(flea.weaponSlots, 0);
    assert.equal(flea.shieldSlots, 0);
    assert.equal(flea.gadgetSlots, 0);
    assert.equal(flea.crewQuarters, 1);
    assert.equal(flea.fuelTanks, 20); // MAXRANGE = 20
    assert.equal(flea.minTechLevel, 4);
    assert.equal(flea.costOfFuel, 1);
    assert.equal(flea.price, 2000);
    assert.equal(flea.bounty, 5);
    assert.equal(flea.occurrence, 2);
    assert.equal(flea.hullStrength, 25);
    assert.equal(flea.police, -1); // not used as police
    assert.equal(flea.pirates, -1); // not used as pirates
    assert.equal(flea.traders, 0);
    assert.equal(flea.repairCosts, 1);
    assert.equal(flea.size, 0);

    // Gnat - index 1 (starting ship)
    const gnat = shipTypes[1];
    assert.equal(gnat.name, 'Gnat');
    assert.equal(gnat.cargoBays, 15);
    assert.equal(gnat.weaponSlots, 1);
    assert.equal(gnat.shieldSlots, 0);
    assert.equal(gnat.gadgetSlots, 1);
    assert.equal(gnat.crewQuarters, 1);
    assert.equal(gnat.fuelTanks, 14);
    assert.equal(gnat.minTechLevel, 5);
    assert.equal(gnat.costOfFuel, 2);
    assert.equal(gnat.price, 10000);
    assert.equal(gnat.bounty, 50);
    assert.equal(gnat.occurrence, 28);
    assert.equal(gnat.hullStrength, 100);
    assert.equal(gnat.police, 0);
    assert.equal(gnat.pirates, 0);
    assert.equal(gnat.traders, 0);
    assert.equal(gnat.repairCosts, 1);
    assert.equal(gnat.size, 1);

    // Wasp - index 9 (best buyable ship)
    const wasp = shipTypes[9];
    assert.equal(wasp.name, 'Wasp');
    assert.equal(wasp.cargoBays, 35);
    assert.equal(wasp.weaponSlots, 3);
    assert.equal(wasp.shieldSlots, 2);
    assert.equal(wasp.gadgetSlots, 2);
    assert.equal(wasp.crewQuarters, 3);
    assert.equal(wasp.fuelTanks, 14);
    assert.equal(wasp.minTechLevel, 7);
    assert.equal(wasp.costOfFuel, 20);
    assert.equal(wasp.price, 300000);
    assert.equal(wasp.bounty, 500);
    assert.equal(wasp.occurrence, 2);
    assert.equal(wasp.hullStrength, 200);
    assert.equal(wasp.police, 5);
    assert.equal(wasp.pirates, 6);
    assert.equal(wasp.traders, 4);
    assert.equal(wasp.repairCosts, 5);
    assert.equal(wasp.size, 4);

    // Space Monster - index 10 (first non-buyable ship)
    const monster = shipTypes[10];
    assert.equal(monster.name, 'Space monster');
    assert.equal(monster.cargoBays, 0);
    assert.equal(monster.weaponSlots, 3);
    assert.equal(monster.shieldSlots, 0);
    assert.equal(monster.gadgetSlots, 0);
    assert.equal(monster.crewQuarters, 1);
    assert.equal(monster.fuelTanks, 1);
    assert.equal(monster.minTechLevel, 8);
    assert.equal(monster.costOfFuel, 1);
    assert.equal(monster.price, 500000);
    assert.equal(monster.bounty, 0);
    assert.equal(monster.occurrence, 0);
    assert.equal(monster.hullStrength, 500);
    assert.equal(monster.police, 8);
    assert.equal(monster.pirates, 8);
    assert.equal(monster.traders, 8);
    assert.equal(monster.repairCosts, 1);
    assert.equal(monster.size, 4);

    // Bottle - index 14 (last ship)
    const bottle = shipTypes[14];
    assert.equal(bottle.name, 'Bottle');
    assert.equal(bottle.cargoBays, 0);
    assert.equal(bottle.weaponSlots, 0);
    assert.equal(bottle.shieldSlots, 0);
    assert.equal(bottle.gadgetSlots, 0);
    assert.equal(bottle.crewQuarters, 0);
    assert.equal(bottle.fuelTanks, 1);
    assert.equal(bottle.minTechLevel, 8);
    assert.equal(bottle.costOfFuel, 1);
    assert.equal(bottle.price, 100);
    assert.equal(bottle.bounty, 0);
    assert.equal(bottle.occurrence, 0);
    assert.equal(bottle.hullStrength, 10);
    assert.equal(bottle.police, 8);
    assert.equal(bottle.pirates, 8);
    assert.equal(bottle.traders, 8);
    assert.equal(bottle.repairCosts, 1);
    assert.equal(bottle.size, 1);
  });

  test('should provide individual ship type access', () => {
    const flea = getShipType(0);
    assert.equal(flea.name, 'Flea');
    
    const gnat = getShipType(1);
    assert.equal(gnat.name, 'Gnat');
  });

  test('should throw error for invalid ship type index', () => {
    assert.throws(() => {
      getShipType(15); // out of bounds
    });
    
    assert.throws(() => {
      getShipType(-1); // negative index
    });
  });

  test('should have all ships with valid names', () => {
    const shipTypes = getShipTypes();
    
    shipTypes.forEach((ship, index) => {
      assert.ok(ship.name.length > 0, `Ship ${index} should have non-empty name`);
      assert.equal(typeof ship.name, 'string', `Ship ${index} name should be string`);
    });
  });

  test('should have valid tech levels (0-8)', () => {
    const shipTypes = getShipTypes();
    
    shipTypes.forEach((ship, index) => {
      assert.ok(ship.minTechLevel >= 0 && ship.minTechLevel <= 8, 
        `Ship ${index} minTechLevel should be 0-8`);
    });
  });

  test('should have non-negative values for slots and bays', () => {
    const shipTypes = getShipTypes();
    
    shipTypes.forEach((ship, index) => {
      assert.ok(ship.cargoBays >= 0, `Ship ${index} cargoBays should be non-negative`);
      assert.ok(ship.weaponSlots >= 0, `Ship ${index} weaponSlots should be non-negative`);
      assert.ok(ship.shieldSlots >= 0, `Ship ${index} shieldSlots should be non-negative`);
      assert.ok(ship.gadgetSlots >= 0, `Ship ${index} gadgetSlots should be non-negative`);
      assert.ok(ship.crewQuarters >= 0, `Ship ${index} crewQuarters should be non-negative`);
      assert.ok(ship.fuelTanks >= 0, `Ship ${index} fuelTanks should be non-negative`);
    });
  });

  test('should have positive prices and hull strength', () => {
    const shipTypes = getShipTypes();
    
    shipTypes.forEach((ship, index) => {
      assert.ok(ship.price > 0, `Ship ${index} price should be positive`);
      assert.ok(ship.hullStrength > 0, `Ship ${index} hullStrength should be positive`);
      assert.ok(ship.costOfFuel > 0, `Ship ${index} costOfFuel should be positive`);
      assert.ok(ship.repairCosts > 0, `Ship ${index} repairCosts should be positive`);
    });
  });

  test('should have valid occurrence rates (0-100)', () => {
    const shipTypes = getShipTypes();
    
    shipTypes.forEach((ship, index) => {
      assert.ok(ship.occurrence >= 0 && ship.occurrence <= 100, 
        `Ship ${index} occurrence should be 0-100`);
    });
  });

  test('should have valid encounter strength values', () => {
    const shipTypes = getShipTypes();
    
    shipTypes.forEach((ship, index) => {
      // Police, pirates, traders can be -1 (not used) or 0-8
      assert.ok((ship.police === -1) || (ship.police >= 0 && ship.police <= 8), 
        `Ship ${index} police should be -1 or 0-8`);
      assert.ok((ship.pirates === -1) || (ship.pirates >= 0 && ship.pirates <= 8), 
        `Ship ${index} pirates should be -1 or 0-8`);  
      assert.ok((ship.traders === -1) || (ship.traders >= 0 && ship.traders <= 8), 
        `Ship ${index} traders should be -1 or 0-8`);
    });
  });

  test('should distinguish buyable vs non-buyable ships', () => {
    const shipTypes = getShipTypes();
    
    // First 10 ships are buyable (indices 0-9)
    for (let i = 0; i < MAXSHIPTYPE; i++) {
      assert.ok(shipTypes[i].occurrence > 0 || i === 0, 
        `Buyable ship ${i} should have occurrence > 0 (except Flea)`);
    }
    
    // Ships 10-14 are special/non-buyable (Space monster, Dragonfly, Mantis, Scarab, Bottle)
    for (let i = MAXSHIPTYPE; i < shipTypes.length; i++) {
      assert.equal(shipTypes[i].occurrence, 0, 
        `Non-buyable ship ${i} should have occurrence = 0`);
    }
  });

  test('should have correct ship names in order', () => {
    const shipTypes = getShipTypes();
    const expectedNames = [
      'Flea', 'Gnat', 'Firefly', 'Mosquito', 'Bumblebee',
      'Beetle', 'Hornet', 'Grasshopper', 'Termite', 'Wasp',
      'Space monster', 'Dragonfly', 'Mantis', 'Scarab', 'Bottle'
    ];
    
    shipTypes.forEach((ship, index) => {
      assert.equal(ship.name, expectedNames[index], 
        `Ship ${index} should be named ${expectedNames[index]}`);
    });
  });
});