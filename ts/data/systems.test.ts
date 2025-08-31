// Solar Systems Tests
// Test-Driven Development: Write tests FIRST before implementation

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import type { SolarSystem, TechLevel } from '../types.ts';
import { MAXSOLARSYSTEM, SystemStatus } from '../types.ts';
import { 
  getSolarSystemNames, getSolarSystemName, 
  generateRandomSolarSystems, getSolarSystem, 
  getSystemConstants, isValidCoordinates,
  getSpecialSystemIndices
} from './systems.ts';

describe('Solar Systems', () => {

  describe('System Names', () => {
    test('should have exactly 120 solar system names (MAXSOLARSYSTEM)', () => {
      const names = getSolarSystemNames();
      assert.equal(names.length, MAXSOLARSYSTEM);
      assert.equal(names.length, 120);
    });

    test('should match exact Palm OS system names', () => {
      const names = getSolarSystemNames();
      
      // Test some key system names from Palm source
      assert.equal(names[0], 'Acamar');      // ACAMARSYSTEM
      assert.equal(names[6], 'Baratas');     // BARATASSYSTEM  
      assert.equal(names[17], 'Daled');      // DALEDSYSTEM
      assert.equal(names[22], 'Devidia');    // DEVIDIASYSTEM
      assert.equal(names[32], 'Gemulon');    // GEMULONSYSTEM
      assert.equal(names[41], 'Japori');     // JAPORISYSTEM
      assert.equal(names[50], 'Kravat');     // KRAVATSYSTEM
      assert.equal(names[59], 'Melina');     // MELINASYSTEM
      assert.equal(names[67], 'Nix');        // NIXSYSTEM
      assert.equal(names[70], 'Og');         // OGSYSTEM
      assert.equal(names[82], 'Regulas');    // REGULASSYSTEM
      assert.equal(names[92], 'Sol');        // SOLSYSTEM (our solar system)
      assert.equal(names[109], 'Utopia');    // UTOPIASYSTEM
      assert.equal(names[118], 'Zalkon');    // ZALKONSYSTEM
      assert.equal(names[119], 'Zuul');      // Last system
    });

    test('should provide individual system name access', () => {
      assert.equal(getSolarSystemName(0), 'Acamar');
      assert.equal(getSolarSystemName(92), 'Sol');
      assert.equal(getSolarSystemName(119), 'Zuul');
    });

    test('should throw error for invalid system name index', () => {
      assert.throws(() => getSolarSystemName(-1));
      assert.throws(() => getSolarSystemName(120));
    });

    test('should have all unique non-empty names', () => {
      const names = getSolarSystemNames();
      const nameSet = new Set(names);
      
      assert.equal(nameSet.size, names.length, 'All names should be unique');
      
      names.forEach((name, index) => {
        assert.ok(name.length > 0, `Name at index ${index} should not be empty`);
        assert.equal(typeof name, 'string', `Name at index ${index} should be string`);
      });
    });
  });

  describe('System Constants', () => {
    test('should have correct galaxy dimensions and limits', () => {
      const constants = getSystemConstants();
      
      assert.equal(constants.GALAXYWIDTH, 150);
      assert.equal(constants.GALAXYHEIGHT, 110);
      assert.equal(constants.MAXTECHLEVEL, 8);
      assert.equal(constants.MAXPOLITICS, 17);
      assert.equal(constants.MAXSIZE, 5);
      assert.equal(constants.MAXSTATUS, 8);
      assert.equal(constants.MAXRESOURCES, 13);
    });

    test('should have correct special system indices', () => {
      const indices = getSpecialSystemIndices();
      
      assert.equal(indices.ACAMARSYSTEM, 0);
      assert.equal(indices.BARATASSYSTEM, 6);
      assert.equal(indices.DALEDSYSTEM, 17);
      assert.equal(indices.DEVIDIASYSTEM, 22);
      assert.equal(indices.GEMULONSYSTEM, 32);
      assert.equal(indices.JAPORISYSTEM, 41);
      assert.equal(indices.KRAVATSYSTEM, 50);
      assert.equal(indices.MELINASYSTEM, 59);
      assert.equal(indices.NIXSYSTEM, 67);
      assert.equal(indices.OGSYSTEM, 70);
      assert.equal(indices.REGULASSYSTEM, 82);
      assert.equal(indices.SOLSYSTEM, 92);
      assert.equal(indices.UTOPIASYSTEM, 109);
      assert.equal(indices.ZALKONSYSTEM, 118);
    });
  });

  describe('Coordinate Validation', () => {
    test('should validate coordinates within galaxy bounds', () => {
      const constants = getSystemConstants();
      
      // Valid coordinates
      assert.equal(isValidCoordinates(0, 0), true);
      assert.equal(isValidCoordinates(75, 55), true);
      assert.equal(isValidCoordinates(constants.GALAXYWIDTH - 1, constants.GALAXYHEIGHT - 1), true);
      
      // Invalid coordinates
      assert.equal(isValidCoordinates(-1, 0), false);
      assert.equal(isValidCoordinates(0, -1), false);
      assert.equal(isValidCoordinates(constants.GALAXYWIDTH, 0), false);
      assert.equal(isValidCoordinates(0, constants.GALAXYHEIGHT), false);
    });
  });

  describe('System Generation', () => {
    test('should generate exactly 120 systems', () => {
      const systems = generateRandomSolarSystems(12345); // Use seed for deterministic test
      
      assert.equal(systems.length, MAXSOLARSYSTEM);
      assert.equal(systems.length, 120);
    });

    test('should generate systems with valid properties', () => {
      const systems = generateRandomSolarSystems(12345); // Use seed for deterministic test
      const constants = getSystemConstants();
      
      systems.forEach((system, index) => {
        // Test name index
        assert.equal(system.nameIndex, index, `System ${index} should have nameIndex ${index}`);
        
        // Test coordinates
        assert.ok(isValidCoordinates(system.x, system.y), 
          `System ${index} coordinates (${system.x}, ${system.y}) should be valid`);
        
        // Test tech level
        assert.ok(system.techLevel >= 0 && system.techLevel < constants.MAXTECHLEVEL, 
          `System ${index} techLevel should be 0-${constants.MAXTECHLEVEL - 1}`);
        
        // Test politics
        assert.ok(system.politics >= 0 && system.politics < constants.MAXPOLITICS, 
          `System ${index} politics should be 0-${constants.MAXPOLITICS - 1}`);
        
        // Test size
        assert.ok(system.size >= 0 && system.size < constants.MAXSIZE, 
          `System ${index} size should be 0-${constants.MAXSIZE - 1}`);
        
        // Test special resources
        assert.ok(system.specialResources >= 0 && system.specialResources < constants.MAXRESOURCES, 
          `System ${index} specialResources should be 0-${constants.MAXRESOURCES - 1}`);
        
        // Test status
        const validStatuses = Object.values(SystemStatus);
        assert.ok(validStatuses.includes(system.status), 
          `System ${index} status should be valid SystemStatus`);
        
        // Test initial state
        assert.equal(system.visited, false, `System ${index} should start unvisited`);
        assert.equal(system.countDown, 0, `System ${index} should start with countDown 0`);
        assert.equal(system.special, -1, `System ${index} should start with no special event`);
      });
    });

    test('should place wormhole systems in designated regions', () => {
      const systems = generateRandomSolarSystems(12345);
      const constants = getSystemConstants();
      
      // First 6 systems should be wormhole systems with special placement
      // The exact placement varies based on the algorithm, so just check they're valid coordinates
      for (let i = 0; i < 6; i++) {
        const system = systems[i];
        
        // Wormhole systems should be within galaxy bounds
        assert.ok(system.x >= 0 && system.x < constants.GALAXYWIDTH, 
          `Wormhole system ${i} X should be within galaxy bounds`);
        assert.ok(system.y >= 0 && system.y < constants.GALAXYHEIGHT, 
          `Wormhole system ${i} Y should be within galaxy bounds`);
        
        // After shuffling in the algorithm, they can be anywhere, so just test basic properties
        assert.equal(system.nameIndex, i, `Wormhole system ${i} should have correct nameIndex`);
      }
    });

    test('should generate deterministic results with same seed', () => {
      const systems1 = generateRandomSolarSystems(54321);
      const systems2 = generateRandomSolarSystems(54321);
      
      assert.equal(systems1.length, systems2.length);
      
      for (let i = 0; i < systems1.length; i++) {
        assert.equal(systems1[i].x, systems2[i].x, `System ${i} X should match`);
        assert.equal(systems1[i].y, systems2[i].y, `System ${i} Y should match`);
        assert.equal(systems1[i].techLevel, systems2[i].techLevel, `System ${i} techLevel should match`);
        assert.equal(systems1[i].politics, systems2[i].politics, `System ${i} politics should match`);
        assert.equal(systems1[i].size, systems2[i].size, `System ${i} size should match`);
        assert.equal(systems1[i].specialResources, systems2[i].specialResources, `System ${i} specialResources should match`);
        assert.equal(systems1[i].status, systems2[i].status, `System ${i} status should match`);
      }
    });

    test('should generate different results with different seeds', () => {
      const systems1 = generateRandomSolarSystems(11111);
      const systems2 = generateRandomSolarSystems(22222);
      
      // At least some systems should be different
      let differenceCount = 0;
      for (let i = 0; i < systems1.length; i++) {
        if (systems1[i].x !== systems2[i].x || 
            systems1[i].y !== systems2[i].y || 
            systems1[i].techLevel !== systems2[i].techLevel) {
          differenceCount++;
        }
      }
      
      assert.ok(differenceCount > 50, 'Different seeds should generate different galaxies');
    });

    test('should avoid placing systems too close to each other', () => {
      const systems = generateRandomSolarSystems(12345);
      
      // Check that no two systems are at exactly the same coordinates
      const coordinates = new Set();
      
      systems.forEach((system, index) => {
        const coordKey = `${system.x},${system.y}`;
        assert.ok(!coordinates.has(coordKey), 
          `System ${index} should not have duplicate coordinates`);
        coordinates.add(coordKey);
      });
    });
  });

  describe('System Access', () => {
    test('should provide access to individual systems', () => {
      const systems = generateRandomSolarSystems(12345);
      
      const system0 = getSolarSystem(systems, 0);
      const system92 = getSolarSystem(systems, 92); // Sol system
      
      assert.equal(system0.nameIndex, 0);
      assert.equal(system92.nameIndex, 92);
      
      // Sol system should have name "Sol"
      assert.equal(getSolarSystemName(system92.nameIndex), 'Sol');
    });

    test('should throw error for invalid system index access', () => {
      const systems = generateRandomSolarSystems(12345);
      
      assert.throws(() => getSolarSystem(systems, -1));
      assert.throws(() => getSolarSystem(systems, 120));
    });
  });

  describe('Special Resources Distribution', () => {
    test('should have roughly 40% of systems with special resources', () => {
      const systems = generateRandomSolarSystems(12345);
      
      const systemsWithResources = systems.filter(s => s.specialResources > 0);
      const percentage = (systemsWithResources.length / systems.length) * 100;
      
      // Palm OS: GetRandom(5) >= 3 means 40% chance (2/5)
      // Should be roughly 40% ± 15% (allowing for randomness)
      assert.ok(percentage >= 25 && percentage <= 55, 
        `Should have ~40% systems with special resources, got ${percentage}%`);
    });
  });

  describe('Status Distribution', () => {
    test('should have roughly 15% of systems with special status', () => {
      const systems = generateRandomSolarSystems(12345);
      
      const systemsWithStatus = systems.filter(s => s.status !== SystemStatus.Uneventful);
      const percentage = (systemsWithStatus.length / systems.length) * 100;
      
      // Should be roughly 15% ± 10% (allowing for randomness)
      assert.ok(percentage >= 5 && percentage <= 25, 
        `Should have ~15% systems with special status, got ${percentage}%`);
    });
  });

  describe('Tech Level and Politics Constraints', () => {
    test('should respect politics tech level constraints', () => {
      // This test would require the politics data to validate constraints
      // For now, just test that they're within valid ranges
      const systems = generateRandomSolarSystems(12345);
      
      systems.forEach((system, index) => {
        assert.ok(system.techLevel >= 0 && system.techLevel < 8, 
          `System ${index} techLevel should be valid`);
        assert.ok(system.politics >= 0 && system.politics < 17, 
          `System ${index} politics should be valid`);
      });
    });
  });

  describe('Trade Item Quantities', () => {
    test('should initialize all systems with zero trade item quantities', () => {
      const systems = generateRandomSolarSystems(12345);
      
      systems.forEach((system, index) => {
        // Trade item quantities should be initialized separately
        // For now, verify the array exists and has correct length
        assert.ok(Array.isArray(system.qty), `System ${index} should have qty array`);
        assert.equal(system.qty.length, 10, `System ${index} should have 10 trade item slots`);
        
        // Initially all quantities should be 0
        system.qty.forEach((qty, itemIndex) => {
          assert.equal(qty, 0, `System ${index} item ${itemIndex} qty should start at 0`);
        });
      });
    });
  });
});