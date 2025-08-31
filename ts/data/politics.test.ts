// Political Systems Tests
// Test-Driven Development: Write tests FIRST before implementation

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import type { PoliticsType } from '../types.ts';
import { TradeItem } from '../types.ts';
import { 
  getPoliticalSystems, getPoliticalSystem, 
  getPoliticsConstants, isValidPoliticsIndex
} from './politics.ts';

describe('Political Systems', () => {

  describe('Politics Data', () => {
    test('should have exactly 17 political systems (MAXPOLITICS)', () => {
      const politics = getPoliticalSystems();
      assert.equal(politics.length, 17);
    });

    test('should match exact Palm OS politics data', () => {
      const politics = getPoliticalSystems();

      // Anarchy - index 0
      const anarchy = politics[0];
      assert.equal(anarchy.name, 'Anarchy');
      assert.equal(anarchy.reactionIllegal, 0);
      assert.equal(anarchy.strengthPolice, 0);
      assert.equal(anarchy.strengthPirates, 7);
      assert.equal(anarchy.strengthTraders, 1);
      assert.equal(anarchy.minTechLevel, 0);
      assert.equal(anarchy.maxTechLevel, 5);
      assert.equal(anarchy.bribeLevel, 7);
      assert.equal(anarchy.drugsOK, true);
      assert.equal(anarchy.firearmsOK, true);
      assert.equal(anarchy.wanted, TradeItem.Food); // FOOD

      // Capitalist State - index 1
      const capitalist = politics[1];
      assert.equal(capitalist.name, 'Capitalist State');
      assert.equal(capitalist.reactionIllegal, 2);
      assert.equal(capitalist.strengthPolice, 3);
      assert.equal(capitalist.strengthPirates, 2);
      assert.equal(capitalist.strengthTraders, 7);
      assert.equal(capitalist.minTechLevel, 4);
      assert.equal(capitalist.maxTechLevel, 7);
      assert.equal(capitalist.bribeLevel, 1);
      assert.equal(capitalist.drugsOK, true);
      assert.equal(capitalist.firearmsOK, true);
      assert.equal(capitalist.wanted, TradeItem.Ore); // ORE

      // Communist State - index 2
      const communist = politics[2];
      assert.equal(communist.name, 'Communist State');
      assert.equal(communist.reactionIllegal, 6);
      assert.equal(communist.strengthPolice, 6);
      assert.equal(communist.strengthPirates, 4);
      assert.equal(communist.strengthTraders, 4);
      assert.equal(communist.minTechLevel, 1);
      assert.equal(communist.maxTechLevel, 5);
      assert.equal(communist.bribeLevel, 5);
      assert.equal(communist.drugsOK, true);
      assert.equal(communist.firearmsOK, true);
      assert.equal(communist.wanted, -1); // No special trade item wanted

      // Cybernetic State - index 5
      const cybernetic = politics[5];
      assert.equal(cybernetic.name, 'Cybernetic State');
      assert.equal(cybernetic.reactionIllegal, 0);
      assert.equal(cybernetic.strengthPolice, 7);
      assert.equal(cybernetic.strengthPirates, 7);
      assert.equal(cybernetic.strengthTraders, 5);
      assert.equal(cybernetic.minTechLevel, 6);
      assert.equal(cybernetic.maxTechLevel, 7);
      assert.equal(cybernetic.bribeLevel, 0);
      assert.equal(cybernetic.drugsOK, false); // Drugs not allowed
      assert.equal(cybernetic.firearmsOK, false); // Firearms not allowed
      assert.equal(cybernetic.wanted, TradeItem.Ore); // ORE

      // Fascist State - index 8
      const fascist = politics[8];
      assert.equal(fascist.name, 'Fascist State');
      assert.equal(fascist.reactionIllegal, 7);
      assert.equal(fascist.strengthPolice, 7);
      assert.equal(fascist.strengthPirates, 7);
      assert.equal(fascist.strengthTraders, 1);
      assert.equal(fascist.minTechLevel, 4);
      assert.equal(fascist.maxTechLevel, 7);
      assert.equal(fascist.bribeLevel, 0);
      assert.equal(fascist.drugsOK, false); // Drugs not allowed
      assert.equal(fascist.firearmsOK, true); // Firearms allowed
      assert.equal(fascist.wanted, TradeItem.Machinery); // MACHINERY

      // Theocracy - index 16 (last)
      const theocracy = politics[16];
      assert.equal(theocracy.name, 'Theocracy');
      assert.equal(theocracy.reactionIllegal, 5);
      assert.equal(theocracy.strengthPolice, 6);
      assert.equal(theocracy.strengthPirates, 1);
      assert.equal(theocracy.strengthTraders, 4);
      assert.equal(theocracy.minTechLevel, 0);
      assert.equal(theocracy.maxTechLevel, 4);
      assert.equal(theocracy.bribeLevel, 0);
      assert.equal(theocracy.drugsOK, true);
      assert.equal(theocracy.firearmsOK, true);
      assert.equal(theocracy.wanted, TradeItem.Narcotics); // NARCOTICS
    });

    test('should have all politics with correct names in order', () => {
      const politics = getPoliticalSystems();
      const expectedNames = [
        'Anarchy',
        'Capitalist State',
        'Communist State',
        'Confederacy',
        'Corporate State',
        'Cybernetic State',
        'Democracy',
        'Dictatorship',
        'Fascist State',
        'Feudal State',
        'Military State',
        'Monarchy',
        'Pacifist State',
        'Socialist State',
        'State of Satori',
        'Technocracy',
        'Theocracy'
      ];
      
      politics.forEach((politic, index) => {
        assert.equal(politic.name, expectedNames[index], 
          `Politics ${index} should be named ${expectedNames[index]}`);
      });
    });
  });

  describe('Individual Politics Access', () => {
    test('should provide access to individual political systems', () => {
      const anarchy = getPoliticalSystem(0);
      const theocracy = getPoliticalSystem(16);
      
      assert.equal(anarchy.name, 'Anarchy');
      assert.equal(theocracy.name, 'Theocracy');
    });

    test('should throw error for invalid politics index', () => {
      assert.throws(() => getPoliticalSystem(-1));
      assert.throws(() => getPoliticalSystem(17));
    });
  });

  describe('Politics Validation', () => {
    test('should validate politics indices', () => {
      assert.equal(isValidPoliticsIndex(0), true);  // Anarchy
      assert.equal(isValidPoliticsIndex(16), true); // Theocracy
      assert.equal(isValidPoliticsIndex(-1), false);
      assert.equal(isValidPoliticsIndex(17), false);
    });

    test('should have valid strength levels (0-7)', () => {
      const politics = getPoliticalSystems();
      
      politics.forEach((politic, index) => {
        assert.ok(politic.strengthPolice >= 0 && politic.strengthPolice <= 7, 
          `Politics ${index} strengthPolice should be 0-7`);
        assert.ok(politic.strengthPirates >= 0 && politic.strengthPirates <= 7, 
          `Politics ${index} strengthPirates should be 0-7`);
        assert.ok(politic.strengthTraders >= 0 && politic.strengthTraders <= 7, 
          `Politics ${index} strengthTraders should be 0-7`);
      });
    });

    test('should have valid tech level constraints', () => {
      const politics = getPoliticalSystems();
      
      politics.forEach((politic, index) => {
        assert.ok(politic.minTechLevel >= 0 && politic.minTechLevel <= 7, 
          `Politics ${index} minTechLevel should be 0-7`);
        assert.ok(politic.maxTechLevel >= 0 && politic.maxTechLevel <= 7, 
          `Politics ${index} maxTechLevel should be 0-7`);
        assert.ok(politic.maxTechLevel >= politic.minTechLevel, 
          `Politics ${index} maxTechLevel should be >= minTechLevel`);
      });
    });

    test('should have valid reaction and bribe levels (0-7)', () => {
      const politics = getPoliticalSystems();
      
      politics.forEach((politic, index) => {
        assert.ok(politic.reactionIllegal >= 0 && politic.reactionIllegal <= 7, 
          `Politics ${index} reactionIllegal should be 0-7`);
        assert.ok(politic.bribeLevel >= 0 && politic.bribeLevel <= 7, 
          `Politics ${index} bribeLevel should be 0-7`);
      });
    });

    test('should have valid wanted trade items', () => {
      const politics = getPoliticalSystems();
      
      politics.forEach((politic, index) => {
        // Wanted can be -1 (none) or a valid trade item index (0-9)
        assert.ok(politic.wanted === -1 || 
          (politic.wanted >= 0 && politic.wanted <= 9), 
          `Politics ${index} wanted should be -1 or 0-9`);
      });
    });

    test('should have boolean values for drugs and firearms', () => {
      const politics = getPoliticalSystems();
      
      politics.forEach((politic, index) => {
        assert.equal(typeof politic.drugsOK, 'boolean', 
          `Politics ${index} drugsOK should be boolean`);
        assert.equal(typeof politic.firearmsOK, 'boolean', 
          `Politics ${index} firearmsOK should be boolean`);
      });
    });
  });

  describe('Politics Constants', () => {
    test('should provide politics constants', () => {
      const constants = getPoliticsConstants();
      
      assert.equal(constants.MAXPOLITICS, 17);
      assert.equal(typeof constants.ANARCHY, 'number');
      assert.equal(constants.ANARCHY, 0);
    });
  });

  describe('Government Characteristics', () => {
    test('should have restrictive governments with low drug/firearm acceptance', () => {
      const politics = getPoliticalSystems();
      
      // Cybernetic State and Fascist State should restrict drugs
      const cybernetic = politics[5]; // Cybernetic State
      const fascist = politics[8];    // Fascist State
      
      assert.equal(cybernetic.drugsOK, false, 'Cybernetic State should not allow drugs');
      assert.equal(cybernetic.firearmsOK, false, 'Cybernetic State should not allow firearms');
      assert.equal(fascist.drugsOK, false, 'Fascist State should not allow drugs');
      assert.equal(fascist.firearmsOK, true, 'Fascist State should allow firearms');
    });

    test('should have permissive governments with high drug/firearm acceptance', () => {
      const politics = getPoliticalSystems();
      
      // Anarchy should be most permissive
      const anarchy = politics[0];
      
      assert.equal(anarchy.drugsOK, true, 'Anarchy should allow drugs');
      assert.equal(anarchy.firearmsOK, true, 'Anarchy should allow firearms');
      assert.equal(anarchy.strengthPolice, 0, 'Anarchy should have no police');
      assert.equal(anarchy.strengthPirates, 7, 'Anarchy should have maximum pirates');
    });

    test('should have varying economic preferences', () => {
      const politics = getPoliticalSystems();
      
      // Check that different governments want different trade items
      const wantedItems = politics.map(p => p.wanted).filter(w => w !== -1);
      const uniqueWanted = new Set(wantedItems);
      
      assert.ok(uniqueWanted.size > 5, 'Multiple governments should want different trade items');
      
      // Corporate State should want Robots
      const corporate = politics[4];
      assert.equal(corporate.wanted, TradeItem.Robots, 'Corporate State should want Robots');
      
      // Military State should want Robots  
      const military = politics[10];
      assert.equal(military.wanted, TradeItem.Robots, 'Military State should want Robots');
    });

    test('should have appropriate police/pirate/trader distributions', () => {
      const politics = getPoliticalSystems();
      
      // Anarchy should have no police but lots of pirates
      const anarchy = politics[0];
      assert.equal(anarchy.strengthPolice, 0);
      assert.equal(anarchy.strengthPirates, 7);
      
      // Military/Fascist states should have strong police
      const military = politics[10];
      const fascist = politics[8];
      assert.equal(military.strengthPolice, 7);
      assert.equal(fascist.strengthPolice, 7);
      
      // Capitalist State should have strong traders
      const capitalist = politics[1];
      assert.equal(capitalist.strengthTraders, 7);
    });
  });

  describe('Tech Level Constraints', () => {
    test('should have appropriate tech level ranges for each government', () => {
      const politics = getPoliticalSystems();
      
      // Anarchy should be low-tech
      const anarchy = politics[0];
      assert.equal(anarchy.minTechLevel, 0);
      assert.equal(anarchy.maxTechLevel, 5);
      
      // Cybernetic State should be high-tech
      const cybernetic = politics[5];
      assert.equal(cybernetic.minTechLevel, 6);
      assert.equal(cybernetic.maxTechLevel, 7);
      
      // Feudal State should be low-tech
      const feudal = politics[9];
      assert.equal(feudal.minTechLevel, 0);
      assert.equal(feudal.maxTechLevel, 3);
    });
  });
});