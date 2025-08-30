// Crew System Tests
// Test-Driven Development: Write tests FIRST before implementation

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import type { CrewMember } from '../types.ts';
import { MAXCREWMEMBER, MAXSKILL } from '../types.ts';
import { 
  getMercenaryNames, getMercenaryName, createRandomCrewMember,
  createCommander, createZeethibal, generateRandomSkill,
  isValidSkillLevel
} from './crew.ts';

describe('Crew System', () => {
  
  describe('Mercenary Names', () => {
    test('should have exactly 31 mercenary names (MAXCREWMEMBER)', () => {
      const names = getMercenaryNames();
      assert.equal(names.length, MAXCREWMEMBER);
      assert.equal(names.length, 31);
    });

    test('should match exact Palm OS mercenary names', () => {
      const names = getMercenaryNames();
      
      // Test commander name (index 0)
      assert.equal(names[0], 'Jameson');
      
      // Test a few specific names from the Palm source
      assert.equal(names[1], 'Alyssa');
      assert.equal(names[2], 'Armatur');
      assert.equal(names[3], 'Bentos');
      assert.equal(names[4], 'C2U2');
      assert.equal(names[5], "Chi'Ti");
      assert.equal(names[10], 'Draco');
      assert.equal(names[20], 'Nandi');
      
      // Test Zeethibal (last mercenary - anagram for Elizabeth)
      assert.equal(names[MAXCREWMEMBER - 1], 'Zeethibal');
      assert.equal(names[30], 'Zeethibal');
    });

    test('should provide individual mercenary name access', () => {
      assert.equal(getMercenaryName(0), 'Jameson');
      assert.equal(getMercenaryName(1), 'Alyssa');
      assert.equal(getMercenaryName(30), 'Zeethibal');
    });

    test('should throw error for invalid mercenary index', () => {
      assert.throws(() => getMercenaryName(-1));
      assert.throws(() => getMercenaryName(31));
    });

    test('should have all unique non-empty names', () => {
      const names = getMercenaryNames();
      const nameSet = new Set(names);
      
      assert.equal(nameSet.size, names.length, 'All names should be unique');
      
      names.forEach((name, index) => {
        assert.ok(name.length > 0, `Name at index ${index} should not be empty`);
        assert.equal(typeof name, 'string', `Name at index ${index} should be string`);
      });
    });
  });

  describe('Random Skill Generation', () => {
    test('should generate skills in range 1-10', () => {
      // Test multiple generations to ensure range
      for (let i = 0; i < 100; i++) {
        const skill = generateRandomSkill();
        assert.ok(skill >= 1 && skill <= 10, `Skill should be 1-10, got ${skill}`);
      }
    });

    test('should match Palm OS RandomSkill formula (1 + GetRandom(5) + GetRandom(6))', () => {
      // The Palm OS formula is: 1 + (0-4) + (0-5) = 1-10
      // We can't test the exact randomness, but we can verify the range
      const skills = [];
      for (let i = 0; i < 1000; i++) {
        skills.push(generateRandomSkill());
      }
      
      const minSkill = Math.min(...skills);
      const maxSkill = Math.max(...skills);
      
      assert.ok(minSkill >= 1, 'Minimum generated skill should be >= 1');
      assert.ok(maxSkill <= 10, 'Maximum generated skill should be <= 10');
    });

    test('should validate skill levels', () => {
      assert.equal(isValidSkillLevel(0), true);   // Minimum
      assert.equal(isValidSkillLevel(1), true);
      assert.equal(isValidSkillLevel(5), true);
      assert.equal(isValidSkillLevel(10), true);  // Maximum (MAXSKILL)
      
      assert.equal(isValidSkillLevel(-1), false); // Below minimum
      assert.equal(isValidSkillLevel(11), false); // Above maximum
    });
  });

  describe('Commander Creation', () => {
    test('should create commander with correct initial stats', () => {
      const commander = createCommander();
      
      assert.equal(commander.nameIndex, 0);       // Points to "Jameson"
      assert.equal(commander.pilot, 1);           // Starting skill
      assert.equal(commander.fighter, 1);         // Starting skill
      assert.equal(commander.trader, 1);          // Starting skill
      assert.equal(commander.engineer, 1);        // Starting skill
      assert.equal(commander.curSystem, 0);       // Starts at Sol system
    });
  });

  describe('Random Crew Member Creation', () => {
    test('should create crew member with valid random skills', () => {
      const crewMember = createRandomCrewMember(5); // Alyssa
      
      assert.equal(crewMember.nameIndex, 5);
      assert.ok(isValidSkillLevel(crewMember.pilot), 'Pilot skill should be valid');
      assert.ok(isValidSkillLevel(crewMember.fighter), 'Fighter skill should be valid');
      assert.ok(isValidSkillLevel(crewMember.trader), 'Trader skill should be valid');
      assert.ok(isValidSkillLevel(crewMember.engineer), 'Engineer skill should be valid');
      
      // Skills should be in random range (1-10)
      assert.ok(crewMember.pilot >= 1 && crewMember.pilot <= 10);
      assert.ok(crewMember.fighter >= 1 && crewMember.fighter <= 10);
      assert.ok(crewMember.trader >= 1 && crewMember.trader <= 10);
      assert.ok(crewMember.engineer >= 1 && crewMember.engineer <= 10);
    });

    test('should set system location correctly', () => {
      const systemIndex = 42;
      const crewMember = createRandomCrewMember(10, systemIndex);
      
      assert.equal(crewMember.curSystem, systemIndex);
    });

    test('should use system 255 as default for no location', () => {
      const crewMember = createRandomCrewMember(15); // No system specified
      
      assert.equal(crewMember.curSystem, 255); // Special "no location" value
    });
  });

  describe('Zeethibal Creation', () => {
    test('should create Zeethibal with correct name index', () => {
      const playerLowestSkills: readonly [number, number, number, number] = [1, 1, 1, 1]; // pilot, fighter, trader, engineer
      const zeethibal = createZeethibal(playerLowestSkills);
      
      assert.equal(zeethibal.nameIndex, MAXCREWMEMBER - 1); // Last mercenary
      assert.equal(zeethibal.nameIndex, 30);
    });

    test('should create Zeethibal with skills based on player weaknesses', () => {
      // Simulate player with pilot=2, fighter=3, trader=1, engineer=4
      // Lowest skill is trader (1), second lowest is pilot (2)
      const playerLowestSkills: readonly [number, number, number, number] = [2, 3, 1, 4]; // pilot, fighter, trader, engineer
      const zeethibal = createZeethibal(playerLowestSkills);
      
      // Zeethibal should have 5 in all skills by default, except:
      assert.equal(zeethibal.pilot, 8);     // 8 in second-lowest skill (pilot)
      assert.equal(zeethibal.fighter, 5);
      assert.equal(zeethibal.trader, 10);   // 10 in lowest skill (trader)
      assert.equal(zeethibal.engineer, 5);
    });

    test('should set Zeethibal system to 255 (special location)', () => {
      const playerLowestSkills: readonly [number, number, number, number] = [1, 1, 1, 1];
      const zeethibal = createZeethibal(playerLowestSkills);
      
      assert.equal(zeethibal.curSystem, 255);
    });
  });

  describe('Data Validation', () => {
    test('should have valid mercenary name at each index', () => {
      for (let i = 0; i < MAXCREWMEMBER; i++) {
        const name = getMercenaryName(i);
        assert.ok(name.length > 0, `Mercenary ${i} should have non-empty name`);
        assert.equal(typeof name, 'string', `Mercenary ${i} name should be string`);
      }
    });

    test('should create different random crew members', () => {
      // Generate several crew members and verify they have different skills
      const crew1 = createRandomCrewMember(1);
      const crew2 = createRandomCrewMember(2);
      const crew3 = createRandomCrewMember(3);
      
      // While it's possible they could have identical skills due to randomness,
      // it's extremely unlikely for all four skills to match across three members
      const allSkillsSame = (
        crew1.pilot === crew2.pilot && crew2.pilot === crew3.pilot &&
        crew1.fighter === crew2.fighter && crew2.fighter === crew3.fighter &&
        crew1.trader === crew2.trader && crew2.trader === crew3.trader &&
        crew1.engineer === crew2.engineer && crew2.engineer === crew3.engineer
      );
      
      assert.equal(allSkillsSame, false, 'Random crew members should have different skills');
    });

    test('should handle all valid mercenary indices', () => {
      for (let i = 0; i < MAXCREWMEMBER; i++) {
        // Should not throw for any valid index
        assert.doesNotThrow(() => {
          const crewMember = createRandomCrewMember(i, 0);
          assert.equal(crewMember.nameIndex, i);
        });
      }
    });
  });
});