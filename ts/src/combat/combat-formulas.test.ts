import { describe, test } from 'node:test';
import { strict as assert } from 'node:assert';
import type { Ship, CrewMember } from '../test/data-structures.test.js';

/**
 * Tests for Space Trader combat formulas extracted from Palm OS source code
 * Based on analysis of Encounter.c, Skill.c, and Traveler.c
 */

// Combat formula implementations based on C source analysis

/**
 * Hit probability calculation from ExecuteAttack() in Encounter.c:804-806
 * Returns true if attack hits, false if misses
 */
function calculateHit(
  attackerFighterSkill: number,
  defenderPilotSkill: number,
  defenderShipSize: number,
  defenderIsFleeing: boolean
): boolean {
  // Random(FighterSkill + DefenderShipSize) vs (FleeMultiplier × Random(5 + PilotSkill/2))
  const attackerRoll = Math.floor(Math.random() * (attackerFighterSkill + defenderShipSize));
  const fleeMultiplier = defenderIsFleeing ? 2 : 1;
  const defenderRoll = fleeMultiplier * Math.floor(Math.random() * (5 + Math.floor(defenderPilotSkill / 2)));
  
  return attackerRoll >= defenderRoll;
}

/**
 * Damage calculation from ExecuteAttack() in Encounter.c:821
 */
function calculateDamage(weaponPower: number, engineerSkill: number): number {
  if (weaponPower <= 0) return 0;
  
  // Random(WeaponPower × (100 + 2×EngineerSkill) / 100)
  const damageMultiplier = (100 + 2 * engineerSkill) / 100;
  const maxDamage = weaponPower * damageMultiplier;
  
  return Math.floor(Math.random() * maxDamage) + 1;
}

/**
 * Reactor damage boost from ExecuteAttack() in Encounter.c:827-833
 */
function applyReactorDamage(baseDamage: number, difficulty: number, isCommanderUnderAttack: boolean): number {
  if (!isCommanderUnderAttack) return baseDamage;
  
  let multiplier: number;
  if (difficulty < 2) { // NORMAL = 2
    multiplier = 1 + (difficulty + 1) * 0.25;
  } else {
    multiplier = 1 + (difficulty + 1) * 0.33;
  }
  
  return baseDamage * multiplier;
}

/**
 * Hull damage limits from ExecuteAttack() in Encounter.c:863-868
 */
function calculateMaxHullDamage(maxHull: number, difficulty: number, isCommanderUnderAttack: boolean): number {
  if (isCommanderUnderAttack) {
    // Commander: maxHull / (IMPOSSIBLE + 1 - difficulty), so easier = more damage allowed
    const divisor = Math.max(1, (4 + 1 - difficulty)); // IMPOSSIBLE=4, so 5-difficulty
    return Math.floor(maxHull / divisor);
  } else {
    // Opponents: always maxHull / 2
    return Math.floor(maxHull / 2);
  }
}

/**
 * Escape probability from ExecuteAction() in Encounter.c:1071-1072
 */
function calculateEscapeProbability(playerPilotSkill: number, opponentPilotSkill: number, difficulty: number): boolean {
  const playerRoll = (Math.floor(Math.random() * 7) + Math.floor(playerPilotSkill / 3)) * 2;
  const opponentRoll = Math.floor(Math.random() * opponentPilotSkill) * (2 + difficulty);
  
  return playerRoll >= opponentRoll;
}

/**
 * Bounty calculation from GetBounty() in Encounter.c:78-90
 */
function calculateBounty(shipPrice: number): number {
  // C code: Bounty /= 200; Bounty /= 25; Bounty *= 25; (integer division)
  let bounty = Math.floor(shipPrice / 200);
  bounty = Math.floor(bounty / 25);
  bounty *= 25;
  return Math.max(25, Math.min(bounty, 2500));
}

/**
 * Skill adaptation for difficulty from AdaptDifficulty() in Skill.c:355-363
 */
function adaptDifficulty(level: number, difficulty: number): number {
  if (difficulty === 0 || difficulty === 1) { // BEGINNER || EASY
    return level + 1;
  } else if (difficulty === 4) { // IMPOSSIBLE
    return Math.max(1, level - 1);
  } else {
    return level;
  }
}

/**
 * Auto-repair calculation from Travel() in Traveler.c:1779-1804
 */
function calculateAutoRepair(engineerSkill: number): number {
  return Math.floor(Math.random() * engineerSkill) >> 1; // Divide by 2
}

describe('Space Trader Combat Formulas', () => {

  describe('Hit Calculation (Encounter.c:804-806)', () => {
    test('should calculate hit probability based on fighter vs pilot skill', () => {
      // Test multiple iterations to verify probability distribution
      let hits = 0;
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        if (calculateHit(8, 4, 1, false)) hits++;
      }
      
      const hitRate = hits / iterations;
      // With high fighter skill vs low pilot skill, should hit majority of time
      assert.ok(hitRate > 0.4, `Hit rate ${hitRate} should be > 0.4`);
      assert.ok(hitRate < 0.9, `Hit rate ${hitRate} should be < 0.9`);
    });

    test('should reduce hit chance when defender is fleeing', () => {
      let normalHits = 0;
      let fleeingHits = 0;
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        if (calculateHit(6, 5, 1, false)) normalHits++;
        if (calculateHit(6, 5, 1, true)) fleeingHits++;
      }
      
      const normalRate = normalHits / iterations;
      const fleeingRate = fleeingHits / iterations;
      
      assert.ok(fleeingRate < normalRate, `Fleeing hit rate ${fleeingRate} should be less than normal ${normalRate}`);
    });

    test('should factor in ship size for larger targets', () => {
      let smallTargetHits = 0;
      let largeTargetHits = 0;
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        if (calculateHit(5, 5, 0, false)) smallTargetHits++; // Size 0 (small)
        if (calculateHit(5, 5, 5, false)) largeTargetHits++; // Size 5 (large)
      }
      
      const smallRate = smallTargetHits / iterations;
      const largeRate = largeTargetHits / iterations;
      
      assert.ok(largeRate > smallRate, `Large target hit rate ${largeRate} should be higher than small ${smallRate}`);
    });
  });

  describe('Damage Calculation (Encounter.c:821)', () => {
    test('should apply engineer skill bonus to weapon damage', () => {
      const weaponPower = 20;
      const engineerSkill = 6;
      
      let totalDamage = 0;
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        totalDamage += calculateDamage(weaponPower, engineerSkill);
      }
      
      const averageDamage = totalDamage / iterations;
      const expectedBaseDamage = weaponPower * (100 + 2 * engineerSkill) / 100;
      
      // Average should be around half the max damage
      assert.ok(averageDamage > expectedBaseDamage * 0.3, `Average damage ${averageDamage} too low`);
      assert.ok(averageDamage < expectedBaseDamage * 0.7, `Average damage ${averageDamage} too high`);
    });

    test('should return 0 damage for no weapons', () => {
      assert.strictEqual(calculateDamage(0, 5), 0);
    });
  });

  describe('Reactor Damage Boost (Encounter.c:827-833)', () => {
    test('should boost damage for commander under attack with reactor', () => {
      const baseDamage = 10;
      
      // Test different difficulties
      const beginnerDamage = applyReactorDamage(baseDamage, 0, true);  // BEGINNER
      const normalDamage = applyReactorDamage(baseDamage, 2, true);    // NORMAL
      const impossibleDamage = applyReactorDamage(baseDamage, 4, true); // IMPOSSIBLE
      
      assert.ok(beginnerDamage > baseDamage, `Beginner reactor damage ${beginnerDamage} should exceed base ${baseDamage}`);
      assert.ok(normalDamage > baseDamage, `Normal reactor damage ${normalDamage} should exceed base ${baseDamage}`);
      assert.ok(impossibleDamage > normalDamage, `Impossible reactor damage ${impossibleDamage} should exceed normal ${normalDamage}`);
      
      // Specific multipliers from C code (1 + (difficulty + 1) * multiplier)
      // BEGINNER=0: 1 + (0+1)*0.25 = 1.25 = 12.5
      // NORMAL=2: 1 + (2+1)*0.33 = 1.99 ≈ 2.0 
      // IMPOSSIBLE=4: 1 + (4+1)*0.33 = 2.65
      assert.strictEqual(beginnerDamage, 12.5);   // 1.25x
      assert.ok(Math.abs(normalDamage - 19.9) < 0.1, `Normal damage ${normalDamage} should be ~19.9`);
      assert.ok(Math.abs(impossibleDamage - 26.5) < 0.1, `Impossible damage ${impossibleDamage} should be ~26.5`);
    });

    test('should not boost damage for opponents', () => {
      const baseDamage = 10;
      const opponentDamage = applyReactorDamage(baseDamage, 2, false);
      
      assert.strictEqual(opponentDamage, baseDamage);
    });
  });

  describe('Hull Damage Limits (Encounter.c:863-868)', () => {
    test('should limit commander hull damage based on difficulty', () => {
      const maxHull = 100;
      
      const beginnerLimit = calculateMaxHullDamage(maxHull, 0, true);  // BEGINNER
      const normalLimit = calculateMaxHullDamage(maxHull, 2, true);    // NORMAL  
      const impossibleLimit = calculateMaxHullDamage(maxHull, 4, true); // IMPOSSIBLE
      
      
      // Easier difficulties actually allow LESS damage per hit (smaller chunks, more survivable)
      // Beginner: 100/5 = 20, Normal: 100/3 = 33, Impossible: 100/1 = 100
      assert.ok(beginnerLimit < normalLimit, `Beginner limit ${beginnerLimit} should be less than normal ${normalLimit}`);
      assert.ok(normalLimit < impossibleLimit, `Normal limit ${normalLimit} should be less than impossible ${impossibleLimit}`);
    });

    test('should use fixed limit for opponents', () => {
      const maxHull = 100;
      const opponentLimit = calculateMaxHullDamage(maxHull, 0, false);
      
      assert.strictEqual(opponentLimit, 50); // Always maxHull / 2
    });
  });

  describe('Escape Probability (Encounter.c:1071-1072)', () => {
    test('should calculate escape based on pilot skills and difficulty', () => {
      let escapes = 0;
      const iterations = 1000;
      
      // Superior pilot skill should escape more often
      for (let i = 0; i < iterations; i++) {
        if (calculateEscapeProbability(8, 4, 2)) escapes++; // High vs Low pilot skill, Normal difficulty
      }
      
      const escapeRate = escapes / iterations;
      assert.ok(escapeRate > 0.3, `Escape rate ${escapeRate} should be > 0.3 with superior pilot skill`);
      assert.ok(escapeRate < 0.9, `Escape rate ${escapeRate} should be < 0.9 (not guaranteed)`);
    });

    test('should make escape harder on higher difficulty', () => {
      let easyEscapes = 0;
      let hardEscapes = 0;
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        if (calculateEscapeProbability(6, 6, 1)) easyEscapes++;   // EASY
        if (calculateEscapeProbability(6, 6, 3)) hardEscapes++;   // HARD
      }
      
      const easyRate = easyEscapes / iterations;
      const hardRate = hardEscapes / iterations;
      
      assert.ok(hardRate < easyRate, `Hard escape rate ${hardRate} should be less than easy ${easyRate}`);
    });
  });

  describe('Bounty Calculation (Encounter.c:78-90)', () => {
    test('should calculate bounty with proper rounding and limits', () => {
      
      // Test the exact formula: floor(floor(shipPrice / 200) / 25) * 25
      assert.strictEqual(calculateBounty(10000), 50);    // floor(50/25)*25 = 2*25 = 50
      assert.strictEqual(calculateBounty(50000), 250);   // floor(floor(250)/25)*25 = floor(10)*25 = 250  
      assert.strictEqual(calculateBounty(125000), 625);  // floor(floor(625)/25)*25 = floor(25)*25 = 625
      assert.strictEqual(calculateBounty(250000), 1250); // floor(floor(1250)/25)*25 = floor(50)*25 = 1250
      assert.strictEqual(calculateBounty(10000000), 2500); // Maximum
    });

    test('should enforce minimum and maximum bounty limits', () => {
      assert.strictEqual(calculateBounty(1), 25);        // Below minimum
      assert.strictEqual(calculateBounty(999999999), 2500); // Above maximum
    });
  });

  describe('Skill Difficulty Adaptation (Skill.c:355-363)', () => {
    test('should adapt skills based on difficulty level', () => {
      const baseSkill = 5;
      
      assert.strictEqual(adaptDifficulty(baseSkill, 0), 6); // BEGINNER: +1
      assert.strictEqual(adaptDifficulty(baseSkill, 1), 6); // EASY: +1
      assert.strictEqual(adaptDifficulty(baseSkill, 2), 5); // NORMAL: unchanged
      assert.strictEqual(adaptDifficulty(baseSkill, 3), 5); // HARD: unchanged
      assert.strictEqual(adaptDifficulty(baseSkill, 4), 4); // IMPOSSIBLE: -1
    });

    test('should not reduce skills below 1 on impossible', () => {
      assert.strictEqual(adaptDifficulty(1, 4), 1); // Should stay at 1, not go to 0
    });
  });

  describe('Auto-Repair System (Traveler.c:1779-1804)', () => {
    test('should repair based on engineer skill during travel', () => {
      const engineerSkill = 8;
      
      let totalRepair = 0;
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        totalRepair += calculateAutoRepair(engineerSkill);
      }
      
      const averageRepair = totalRepair / iterations;
      
      // Should average around engineerSkill/4 (since Random(skill)/2)
      assert.ok(averageRepair >= 0, 'Repair should be non-negative');
      assert.ok(averageRepair <= engineerSkill / 2, `Average repair ${averageRepair} should not exceed ${engineerSkill / 2}`);
    });

    test('should not repair with no engineer skill', () => {
      assert.strictEqual(calculateAutoRepair(0), 0);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete combat sequence', () => {
      const playerShip = { 
        fighterSkill: 6, 
        pilotSkill: 7, 
        engineerSkill: 5,
        weaponPower: 25,
        hull: 100,
        maxHull: 100
      };
      
      const opponentShip = {
        fighterSkill: 4,
        pilotSkill: 5, 
        engineerSkill: 3,
        weaponPower: 20,
        hull: 80,
        maxHull: 80,
        shipSize: 2
      };
      
      // Simulate combat round
      const playerHits = calculateHit(playerShip.fighterSkill, opponentShip.pilotSkill, opponentShip.shipSize, false);
      const opponentHits = calculateHit(opponentShip.fighterSkill, playerShip.pilotSkill, 1, false);
      
      let playerDamage = 0;
      let opponentDamage = 0;
      
      if (playerHits) {
        playerDamage = calculateDamage(playerShip.weaponPower, playerShip.engineerSkill);
      }
      
      if (opponentHits) {
        opponentDamage = calculateDamage(opponentShip.weaponPower, opponentShip.engineerSkill);
        // Apply reactor boost for commander
        opponentDamage = applyReactorDamage(opponentDamage, 2, true);
        // Limit damage
        const maxDamage = calculateMaxHullDamage(playerShip.maxHull, 2, true);
        opponentDamage = Math.min(opponentDamage, maxDamage);
      }
      
      // Validate reasonable combat outcome
      assert.ok(playerDamage >= 0 && playerDamage <= 100, `Player damage ${playerDamage} should be reasonable`);
      assert.ok(opponentDamage >= 0 && opponentDamage <= 100, `Opponent damage ${opponentDamage} should be reasonable`);
    });

    test('should handle escape attempt from combat', () => {
      // Player with superior pilot skill should have good escape chance
      let escapes = 0;
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        if (calculateEscapeProbability(9, 4, 2)) { // High vs low pilot, normal difficulty
          escapes++;
        }
      }
      
      const escapeRate = escapes / iterations;
      assert.ok(escapeRate > 0.5, `Superior pilot should escape more than 50% of time, got ${escapeRate}`);
    });
  });

});
