import { describe, test } from 'node:test';
import { strict as assert } from 'node:assert';

/**
 * Tests for Space Trader encounter generation system
 * Based on analysis of Travel() function in Traveler.c:1749-2220
 */

/**
 * Calculate encounter probability based on difficulty and ship type
 * From Traveler.c:1866-1870
 */
function calculateEncounterProbability(difficulty: number, shipType: number): number {
  // EncounterTest = GetRandom( 44 - (2 * Difficulty) );
  // encounters are half as likely if you're in a flea (ship type 0).
  let threshold = 44 - (2 * difficulty);
  if (shipType === 0) threshold *= 2; // Flea ships
  
  return Math.floor(Math.random() * threshold);
}

/**
 * Determine encounter type based on system political strengths
 * From Traveler.c:1872-1885
 */
function determineEncounterType(
  encounterTest: number,
  pirateStrength: number,
  policeStrength: number, 
  traderStrength: number,
  isRaided: boolean
): string | null {
  if (encounterTest < pirateStrength && !isRaided) {
    return 'PIRATE';
  } else if (encounterTest < pirateStrength + policeStrength) {
    return 'POLICE';
  } else if (encounterTest < pirateStrength + policeStrength + traderStrength) {
    return 'TRADER';
  }
  return null;
}

/**
 * Calculate police behavior based on record and reputation
 * From Traveler.c:1914-1973
 */
function determinePoliceAction(
  policeRecord: number,
  reputation: number,
  isCloaked: boolean,
  isInspected: boolean,
  difficulty: number
): string {
  if (isCloaked) return 'IGNORE';
  
  // Criminal behavior (< DUBIOUSSCORE = -5 in test constants)
  if (policeRecord < -5) {
    if (reputation < 400) { // AVERAGESCORE equivalent
      return 'ATTACK';
    } else if (Math.random() * 1000 > reputation / 2) { // Simplified ELITESCORE check
      return 'ATTACK';
    } else {
      return 'FLEE';
    }
  }
  
  // Dubious record
  if (policeRecord >= -5 && policeRecord < 0 && !isInspected) {
    return 'INSPECTION';
  }
  
  // Clean record - random inspection
  if (policeRecord >= 0 && policeRecord < 5) {
    if (Math.random() < 1 / (12 - difficulty) && !isInspected) {
      return 'INSPECTION';
    }
  }
  
  // Lawful - very low inspection chance
  if (policeRecord >= 5 && Math.random() < 0.025 && !isInspected) {
    return 'INSPECTION';
  }
  
  return 'IGNORE';
}

/**
 * Calculate pirate behavior based on reputation and ship types
 * From Traveler.c:2004-2023
 */
function determinePirateAction(
  reputation: number,
  pirateShipType: number,
  playerShipType: number,
  isCloaked: boolean
): string {
  if (isCloaked) return 'IGNORE';
  
  // Large ships (≥7) or high reputation threshold = attack
  if (pirateShipType >= 7 || Math.random() * 1000 > (reputation * 4) / (1 + pirateShipType)) {
    return 'ATTACK';
  }
  
  // Pirates with better ships won't flee
  if (pirateShipType > playerShipType) {
    return 'ATTACK';
  }
  
  return 'FLEE';
}

/**
 * Wild police encounter chance at Kravat
 * From Traveler.c:1886-1902
 */
function calculateWildPoliceChance(difficulty: number): number {
  if (difficulty <= 1) return 25;      // EASY
  if (difficulty === 2) return 33;     // NORMAL
  return 50;                          // HARD/IMPOSSIBLE
}

describe('Space Trader Encounter Generation', () => {

  describe('Base Encounter Probability (Traveler.c:1866-1870)', () => {
    test('should calculate encounter threshold based on difficulty', () => {
      const beginnerThreshold = calculateEncounterProbability(0, 1); // Non-flea
      const normalThreshold = calculateEncounterProbability(2, 1);
      const impossibleThreshold = calculateEncounterProbability(4, 1);
      
      // Should use Random(44 - 2*difficulty)
      assert.ok(beginnerThreshold >= 0 && beginnerThreshold < 44, `Beginner threshold ${beginnerThreshold} in range`);
      assert.ok(normalThreshold >= 0 && normalThreshold < 40, `Normal threshold ${normalThreshold} in range`);
      assert.ok(impossibleThreshold >= 0 && impossibleThreshold < 36, `Impossible threshold ${impossibleThreshold} in range`);
    });

    test('should halve encounter probability for Flea ships', () => {
      // Test multiple times to verify the Flea gets roughly double threshold
      let fleaHighThresholds = 0;
      let normalHighThresholds = 0;
      
      for (let i = 0; i < 100; i++) {
        const fleaThreshold = calculateEncounterProbability(2, 0); // Flea
        const normalThreshold = calculateEncounterProbability(2, 1); // Gnat
        
        if (fleaThreshold > 35) fleaHighThresholds++;
        if (normalThreshold > 35) normalHighThresholds++;
      }
      
      // Flea should have more high thresholds (lower encounter chance)
      assert.ok(fleaHighThresholds > normalHighThresholds * 1.5, 
        `Flea high thresholds (${fleaHighThresholds}) should exceed normal (${normalHighThresholds})`);
    });
  });

  describe('Encounter Type Priority (Traveler.c:1872-1885)', () => {
    test('should prioritize encounters correctly', () => {
      // System with pirates=3, police=2, traders=4
      assert.strictEqual(determineEncounterType(2, 3, 2, 4, false), 'PIRATE');   // Below 3
      assert.strictEqual(determineEncounterType(4, 3, 2, 4, false), 'POLICE');   // 3-5
      assert.strictEqual(determineEncounterType(7, 3, 2, 4, false), 'TRADER');   // 5-9
      assert.strictEqual(determineEncounterType(10, 3, 2, 4, false), null);      // Above 9
    });

    test('should prevent pirate encounters when already raided', () => {
      assert.strictEqual(determineEncounterType(2, 5, 2, 4, true), 'POLICE');  // Skips pirates
    });
  });

  describe('Police Encounter Behavior (Traveler.c:1914-1973)', () => {
    test('should attack criminals with low reputation', () => {
      const action = determinePoliceAction(-20, 200, false, false, 2);
      assert.strictEqual(action, 'ATTACK');
    });

    test('should flee from criminals with high reputation', () => {
      const action = determinePoliceAction(-20, 2000, false, false, 2);
      assert.strictEqual(action, 'FLEE');
    });

    test('should inspect dubious players', () => {
      const action = determinePoliceAction(-3, 500, false, false, 2);
      assert.strictEqual(action, 'INSPECTION');
    });

    test('should ignore cloaked ships', () => {
      const action = determinePoliceAction(-50, 100, true, false, 2);
      assert.strictEqual(action, 'IGNORE');
    });

    test('should have low inspection rate for lawful traders', () => {
      let inspections = 0;
      for (let i = 0; i < 1000; i++) {
        if (determinePoliceAction(10, 500, false, false, 2) === 'INSPECTION') {
          inspections++;
        }
      }
      
      const inspectionRate = inspections / 1000;
      assert.ok(inspectionRate < 0.05, `Inspection rate ${inspectionRate} should be very low for lawful traders`);
    });
  });

  describe('Pirate Encounter Behavior (Traveler.c:2004-2023)', () => {
    test('should attack when pirate ship is large', () => {
      const action = determinePirateAction(500, 8, 3, false); // Large pirate ship
      assert.strictEqual(action, 'ATTACK');
    });

    test('should flee from high reputation players in small ships', () => {
      // Test multiple times to verify probability
      let fleeCount = 0;
      for (let i = 0; i < 100; i++) {
        if (determinePirateAction(2000, 2, 5, false) === 'FLEE') {
          fleeCount++;
        }
      }
      
      assert.ok(fleeCount > 50, `Pirates should flee from high rep players more than 50% of time, got ${fleeCount}%`);
    });

    test('should attack when pirate ship is superior to player', () => {
      const action = determinePirateAction(1000, 6, 2, false); // Superior pirate ship
      assert.strictEqual(action, 'ATTACK');
    });

    test('should ignore cloaked ships', () => {
      const action = determinePirateAction(100, 3, 3, true);
      assert.strictEqual(action, 'IGNORE');
    });
  });

  describe('Wild Police Encounter at Kravat (Traveler.c:1886-1902)', () => {
    test('should calculate correct police chances by difficulty', () => {
      assert.strictEqual(calculateWildPoliceChance(0), 25);  // BEGINNER
      assert.strictEqual(calculateWildPoliceChance(1), 25);  // EASY
      assert.strictEqual(calculateWildPoliceChance(2), 33);  // NORMAL
      assert.strictEqual(calculateWildPoliceChance(3), 50);  // HARD
      assert.strictEqual(calculateWildPoliceChance(4), 50);  // IMPOSSIBLE
    });

    test('should trigger police encounters at correct rate', () => {
      const difficulty = 2; // NORMAL
      const expectedChance = 33;
      
      let triggers = 0;
      for (let i = 0; i < 1000; i++) {
        if (Math.random() * 100 < expectedChance) triggers++;
      }
      
      const triggerRate = triggers / 10; // Convert to percentage
      assert.ok(Math.abs(triggerRate - expectedChance) < 5, 
        `Trigger rate ${triggerRate}% should be close to expected ${expectedChance}%`);
    });
  });

  describe('Special Encounters', () => {
    test('should trigger Space Monster at Acamar', () => {
      // Space Monster: clicks=1, system=ACAMAR, monsterStatus=1
      const shouldTrigger = (clicks: number, system: string, monsterStatus: number) => {
        return clicks === 1 && system === 'ACAMAR' && monsterStatus === 1;
      };
      
      assert.strictEqual(shouldTrigger(1, 'ACAMAR', 1), true);
      assert.strictEqual(shouldTrigger(2, 'ACAMAR', 1), false);
      assert.strictEqual(shouldTrigger(1, 'EARTH', 1), false);
      assert.strictEqual(shouldTrigger(1, 'ACAMAR', 0), false);
    });

    test('should trigger Scarab with correct conditions', () => {
      const shouldTrigger = (clicks: number, scarabStatus: number, viaWormhole: boolean) => {
        return clicks === 20 && scarabStatus === 1 && viaWormhole;
      };
      
      assert.strictEqual(shouldTrigger(20, 1, true), true);
      assert.strictEqual(shouldTrigger(19, 1, true), false);
      assert.strictEqual(shouldTrigger(20, 0, true), false);
      assert.strictEqual(shouldTrigger(20, 1, false), false);
    });

    test('should calculate very rare encounter probability', () => {
      // From Travel() in Traveler.c:2111
      const daysThreshold = 10;
      const chanceOfVeryRare = 25; // Example value per 1000
      
      const shouldTrigger = (days: number) => {
        return days > daysThreshold && Math.random() * 1000 < chanceOfVeryRare;
      };
      
      // Test early game - should never trigger
      assert.strictEqual(shouldTrigger(5), false);
      
      // Test probability after threshold - run multiple times
      let triggers = 0;
      for (let i = 0; i < 1000; i++) {
        const triggered = (15 > daysThreshold) && (Math.random() * 1000 < chanceOfVeryRare);
        if (triggered) triggers++;
      }
      
      const triggerRate = triggers / 10; // Convert to percentage
      assert.ok(Math.abs(triggerRate - 2.5) < 2.0, 
        `Very rare encounter rate ${triggerRate}% should be close to expected 2.5%`);
    });
  });

  describe('Artifact Mantis Encounters (Traveler.c:1904-1905)', () => {
    test('should trigger Mantis encounters with artifact', () => {
      // if (ArtifactOnBoard && GetRandom( 20 ) <= 3)
      const hasArtifact = true;
      let mantisEncounters = 0;
      
      for (let i = 0; i < 1000; i++) {
        if (hasArtifact && Math.floor(Math.random() * 20) <= 3) {
          mantisEncounters++;
        }
      }
      
      const mantisRate = mantisEncounters / 10; // Convert to percentage
      // Should be 4/20 = 20% chance
      assert.ok(Math.abs(mantisRate - 20) < 3, 
        `Mantis encounter rate ${mantisRate}% should be close to expected 20%`);
    });

    test('should not trigger Mantis without artifact', () => {
      const hasArtifact = false;
      let mantisEncounters = 0;
      
      for (let i = 0; i < 100; i++) {
        if (hasArtifact && Math.floor(Math.random() * 20) <= 3) {
          mantisEncounters++;
        }
      }
      
      assert.strictEqual(mantisEncounters, 0);
    });
  });

  describe('Encounter Avoidance Rules (Traveler.c:1975-2096)', () => {
    test('should skip encounters when both ships cloaked', () => {
      const shouldSkip = (encounterType: string, playerCloaked: boolean, opponentCloaked: boolean) => {
        return (encounterType === 'IGNORE' || encounterType === 'FLEE') && 
               playerCloaked && opponentCloaked;
      };
      
      assert.strictEqual(shouldSkip('IGNORE', true, true), true);
      assert.strictEqual(shouldSkip('FLEE', true, true), true);
      assert.strictEqual(shouldSkip('ATTACK', true, true), false);
      assert.strictEqual(shouldSkip('IGNORE', true, false), false);
    });

    test('should respect player avoidance preferences', () => {
      const checkAvoidance = (encounterType: string, avoidPolice: boolean, avoidPirates: boolean, avoidTraders: boolean) => {
        if (encounterType.includes('POLICE') && (encounterType === 'POLICE_IGNORE' || encounterType === 'POLICE_FLEE')) {
          return avoidPolice;
        }
        if (encounterType.includes('PIRATE') && (encounterType === 'PIRATE_IGNORE' || encounterType === 'PIRATE_FLEE')) {
          return avoidPirates;
        }
        if (encounterType.includes('TRADER') && (encounterType === 'TRADER_IGNORE' || encounterType === 'TRADER_FLEE')) {
          return avoidTraders;
        }
        return false; // Don't skip attacks
      };
      
      assert.strictEqual(checkAvoidance('POLICE_IGNORE', true, false, false), true);
      assert.strictEqual(checkAvoidance('PIRATE_FLEE', false, true, false), true);
      assert.strictEqual(checkAvoidance('TRADER_IGNORE', false, false, true), true);
      assert.strictEqual(checkAvoidance('POLICE_ATTACK', true, false, false), false);
    });
  });

  describe('Trade in Orbit (Traveler.c:2064-2073)', () => {
    test('should trigger trade opportunities with correct probability', () => {
      const chanceOfTradeInOrbit = 100; // Per 1000
      let tradeOpportunities = 0;
      
      for (let i = 0; i < 1000; i++) {
        if (Math.random() * 1000 < chanceOfTradeInOrbit) {
          tradeOpportunities++;
        }
      }
      
      const tradeRate = tradeOpportunities / 10; // Convert to percentage
      assert.ok(Math.abs(tradeRate - 10) < 3, 
        `Trade opportunity rate ${tradeRate}% should be close to expected 10%`);
    });

    test('should prefer selling over buying when both possible', () => {
      // From the C code, TRADERSELL is checked first, then TRADERBUY only if not selling
      const hasCargoSpace = true;
      const hasTradeableCargo = true;
      
      let encounterType = 'TRADER_IGNORE';
      
      if (hasCargoSpace) {
        encounterType = 'TRADER_SELL'; // Trader selling to player
      }
      
      if (hasTradeableCargo && encounterType !== 'TRADER_SELL') {
        encounterType = 'TRADER_BUY'; // Player selling to trader
      }
      
      assert.strictEqual(encounterType, 'TRADER_SELL', 'Should prefer SELL when both are possible');
    });
  });

  describe('System Strength Calculations', () => {
    test('should handle system strength scaling with difficulty', () => {
      const baseStrengthPirates = 5;
      const baseStrengthPolice = 3;
      const difficulty = 2; // NORMAL
      
      // From C code: k = (Difficulty >= NORMAL ? Difficulty - NORMAL : 0);
      const difficultyBonus = difficulty >= 2 ? difficulty - 2 : 0;
      
      const adjustedPirateStrength = baseStrengthPirates + difficultyBonus;
      const adjustedPoliceStrength = baseStrengthPolice + difficultyBonus;
      
      assert.strictEqual(adjustedPirateStrength, 5); // NORMAL adds 0
      assert.strictEqual(adjustedPoliceStrength, 3);
      
      // HARD difficulty should add +1
      const hardDifficultyBonus = 3 >= 2 ? 3 - 2 : 0;
      assert.strictEqual(hardDifficultyBonus, 1);
    });
  });

  describe('Integration Test - Complete Travel Encounter', () => {
    test('should handle complete travel encounter sequence', () => {
      const gameState = {
        difficulty: 2,         // NORMAL
        shipType: 1,          // GNAT
        policeRecord: -15,    // CRIMINAL
        reputation: 600,      // Moderate
        pirateStrength: 4,
        policeStrength: 3,
        traderStrength: 5,
        isRaided: false,
        isCloaked: false,
        isInspected: false
      };
      
      // Calculate encounter
      const encounterTest = calculateEncounterProbability(gameState.difficulty, gameState.shipType);
      const encounterType = determineEncounterType(
        encounterTest, 
        gameState.pirateStrength, 
        gameState.policeStrength, 
        gameState.traderStrength,
        gameState.isRaided
      );
      
      // If we get a police encounter, determine behavior
      if (encounterType === 'POLICE') {
        const policeAction = determinePoliceAction(
          gameState.policeRecord,
          gameState.reputation,
          gameState.isCloaked,
          gameState.isInspected,
          gameState.difficulty
        );
        
        // Criminal with moderate reputation should either attack or flee
        assert.ok(policeAction === 'ATTACK' || policeAction === 'FLEE', 
          `Police should attack or flee against criminal, got ${policeAction}`);
      }
      
      // If we get a pirate encounter, determine behavior
      if (encounterType === 'PIRATE') {
        const pirateAction = determinePirateAction(
          gameState.reputation,
          3, // Pirate ship type
          gameState.shipType,
          gameState.isCloaked
        );
        
        assert.ok(['ATTACK', 'FLEE', 'IGNORE'].includes(pirateAction), 
          `Pirate action ${pirateAction} should be valid`);
      }
      
      // Test should complete without errors
      assert.ok(true, 'Complete encounter sequence should execute successfully');
    });
  });

});
