// Random Number Generator Tests
// Comprehensive testing of the Palm OS random number generator port

import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import {
  getRandom,
  rand,
  randSeed,
  randomInt,
  randomBool,
  shuffleArray,
  randomChoice,
  generateSequence,
  getGlobalSeeds,
  createRandomState
} from './random.ts';

describe('Random Number Generator', () => {
  
  describe('Basic Random Functions', () => {
    test('getRandom should return values in range [0, maxVal)', () => {
      randSeed(12345, 67890); // Set deterministic seed
      
      for (let maxVal = 1; maxVal <= 100; maxVal++) {
        for (let i = 0; i < 50; i++) {
          const value = getRandom(maxVal);
          assert.ok(value >= 0, `Value ${value} should be >= 0`);
          assert.ok(value < maxVal, `Value ${value} should be < ${maxVal}`);
        }
      }
    });
    
    test('getRandom should handle edge cases', () => {
      randSeed(12345, 67890);
      
      assert.equal(getRandom(0), 0); // Zero max value
      assert.equal(getRandom(-1), 0); // Negative max value
      assert.equal(getRandom(1), 0); // Only possible value is 0
    });
    
    test('rand should generate 32-bit values', () => {
      randSeed(12345, 67890);
      
      for (let i = 0; i < 100; i++) {
        const value = rand();
        assert.ok(value >= 0, `Value ${value} should be non-negative`);
        assert.ok(value <= 0xFFFFFFFF, `Value ${value} should fit in 32 bits`);
      }
    });
    
    test('should be deterministic with same seed', () => {
      const seed1 = 12345;
      const seed2 = 67890;
      
      // Generate first sequence
      randSeed(seed1, seed2);
      const sequence1 = generateSequence(20);
      
      // Generate second sequence with same seed
      randSeed(seed1, seed2);
      const sequence2 = generateSequence(20);
      
      assert.deepEqual(sequence1, sequence2, 'Same seed should produce identical sequences');
    });
    
    test('should be different with different seeds', () => {
      // Generate sequence with seed 1
      randSeed(12345, 67890);
      const sequence1 = generateSequence(20);
      
      // Generate sequence with seed 2  
      randSeed(54321, 98760);
      const sequence2 = generateSequence(20);
      
      assert.notDeepEqual(sequence1, sequence2, 'Different seeds should produce different sequences');
    });
    
    test('should use default seeds when seeded with 0', () => {
      randSeed(0, 0);
      const seeds = getGlobalSeeds();
      
      // Should use default values from Palm OS
      assert.equal(seeds.x, 521288629);
      assert.equal(seeds.y, 362436069);
    });
  });

  describe('Random Integer Range', () => {
    test('randomInt should work for valid ranges', () => {
      randSeed(12345, 67890);
      
      for (let i = 0; i < 100; i++) {
        const value = randomInt(5, 15);
        assert.ok(value >= 5, `Value ${value} should be >= 5`);
        assert.ok(value <= 15, `Value ${value} should be <= 15`);
      }
    });
    
    test('randomInt should handle equal min/max', () => {
      const value = randomInt(7, 7);
      assert.equal(value, 7, 'Should return the single possible value');
    });
    
    test('randomInt should throw on invalid range', () => {
      assert.throws(() => randomInt(10, 5), /Invalid range/);
    });
    
    test('randomInt should handle negative numbers', () => {
      randSeed(12345, 67890);
      
      for (let i = 0; i < 50; i++) {
        const value = randomInt(-10, -5);
        assert.ok(value >= -10, `Value ${value} should be >= -10`);
        assert.ok(value <= -5, `Value ${value} should be <= -5`);
      }
    });
  });

  describe('Random Boolean', () => {
    test('randomBool should respect probability bounds', () => {
      randSeed(12345, 67890);
      
      // Test extreme probabilities
      assert.equal(randomBool(0), false, 'Probability 0 should always be false');
      assert.equal(randomBool(1), true, 'Probability 1 should always be true');
      
      // Test negative probability
      assert.equal(randomBool(-0.5), false, 'Negative probability should be false');
      assert.equal(randomBool(1.5), true, 'Probability > 1 should be true');
    });
    
    test('randomBool should approximate expected probability', () => {
      randSeed(12345, 67890);
      const targetProb = 0.3;
      const samples = 10000;
      
      let trueCount = 0;
      for (let i = 0; i < samples; i++) {
        if (randomBool(targetProb)) trueCount++;
      }
      
      const actualProb = trueCount / samples;
      const tolerance = 0.05; // 5% tolerance
      
      assert.ok(
        Math.abs(actualProb - targetProb) < tolerance,
        `Actual probability ${actualProb} should be within ${tolerance} of ${targetProb}`
      );
    });
    
    test('randomBool default should be approximately 50/50', () => {
      randSeed(12345, 67890);
      const samples = 10000;
      
      let trueCount = 0;
      for (let i = 0; i < samples; i++) {
        if (randomBool()) trueCount++;
      }
      
      const actualProb = trueCount / samples;
      const tolerance = 0.05;
      
      assert.ok(
        Math.abs(actualProb - 0.5) < tolerance,
        `Default probability ${actualProb} should be close to 0.5`
      );
    });
  });

  describe('Array Operations', () => {
    test('shuffleArray should preserve all elements', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const toShuffle = [...original];
      
      randSeed(12345, 67890);
      const shuffled = shuffleArray(toShuffle);
      
      // Should be same array reference
      assert.strictEqual(shuffled, toShuffle, 'Should return same array reference');
      
      // Should have same length
      assert.equal(shuffled.length, original.length, 'Length should be preserved');
      
      // Should have same elements (sorted)
      assert.deepEqual(shuffled.sort(), original.sort(), 'All elements should be preserved');
    });
    
    test('shuffleArray should actually shuffle', () => {
      const original = Array.from({length: 20}, (_, i) => i);
      
      // Test multiple shuffles to ensure they're different
      randSeed(12345, 67890);
      const shuffle1 = shuffleArray([...original]);
      
      randSeed(54321, 98760);
      const shuffle2 = shuffleArray([...original]);
      
      assert.notDeepEqual(shuffle1, shuffle2, 'Different seeds should produce different shuffles');
    });
    
    test('shuffleArray should handle empty and single element arrays', () => {
      assert.deepEqual(shuffleArray([]), [], 'Empty array should remain empty');
      assert.deepEqual(shuffleArray([42]), [42], 'Single element should remain unchanged');
    });
    
    test('randomChoice should select from array', () => {
      const choices = ['apple', 'banana', 'cherry', 'date'];
      randSeed(12345, 67890);
      
      for (let i = 0; i < 50; i++) {
        const choice = randomChoice(choices);
        assert.ok(choices.includes(choice!), `Choice "${choice}" should be in original array`);
      }
    });
    
    test('randomChoice should return undefined for empty array', () => {
      const choice = randomChoice([]);
      assert.equal(choice, undefined, 'Empty array should return undefined');
    });
    
    test('randomChoice should handle single element array', () => {
      const choice = randomChoice(['only']);
      assert.equal(choice, 'only', 'Single element array should return that element');
    });
  });

  describe('Isolated Random State', () => {
    test('createRandomState should not affect global state', () => {
      // Set global seed
      randSeed(12345, 67890);
      const globalSequence1 = generateSequence(5);
      
      // Reset global and create isolated state
      randSeed(12345, 67890);
      const isolated = createRandomState(99999, 88888);
      
      // Use isolated state (doesn't affect global)
      for (let i = 0; i < 10; i++) {
        isolated.rand();
      }
      
      // Global should still produce same sequence
      const globalSequence2 = generateSequence(5);
      assert.deepEqual(globalSequence1, globalSequence2, 'Global state should be unaffected');
    });
    
    test('isolated states should be independent', () => {
      const state1 = createRandomState(11111, 22222);
      const state2 = createRandomState(33333, 44444);
      
      const sequence1: number[] = [];
      const sequence2: number[] = [];
      
      // Generate interleaved sequences
      for (let i = 0; i < 10; i++) {
        sequence1.push(state1.rand());
        sequence2.push(state2.rand());
      }
      
      assert.notDeepEqual(sequence1, sequence2, 'Independent states should produce different sequences');
    });
  });

  describe('Distribution and Quality Tests', () => {
    test('should have reasonable distribution across range', () => {
      randSeed(12345, 67890);
      const buckets = new Array(10).fill(0);
      const samples = 10000;
      const maxVal = 10;
      
      for (let i = 0; i < samples; i++) {
        const value = getRandom(maxVal);
        buckets[value]++;
      }
      
      // Each bucket should have roughly samples/buckets values
      const expected = samples / buckets.length;
      const tolerance = expected * 0.2; // 20% tolerance
      
      for (let i = 0; i < buckets.length; i++) {
        const actual = buckets[i];
        assert.ok(
          Math.abs(actual - expected) < tolerance,
          `Bucket ${i} has ${actual} values, expected ~${expected} ± ${tolerance}`
        );
      }
    });
    
    test('should not have obvious patterns in low bits', () => {
      randSeed(12345, 67890);
      const samples = 1000;
      
      let evenCount = 0;
      for (let i = 0; i < samples; i++) {
        if ((getRandom(1000) & 1) === 0) evenCount++;
      }
      
      const evenRatio = evenCount / samples;
      assert.ok(
        Math.abs(evenRatio - 0.5) < 0.1,
        `Even/odd ratio ${evenRatio} should be close to 0.5`
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle large max values', () => {
      randSeed(12345, 67890);
      
      const largeMax = 1000000;
      for (let i = 0; i < 50; i++) {
        const value = getRandom(largeMax);
        assert.ok(value >= 0 && value < largeMax, `Large range value ${value} should be valid`);
      }
    });
    
    test('should be consistent across multiple calls with same state', () => {
      const testSequences = [
        { seed1: 1, seed2: 2, label: 'minimal seeds' },
        { seed1: 0xFFFF, seed2: 0xFFFF, label: 'max 16-bit seeds' },
        { seed1: 521288629, seed2: 362436069, label: 'default seeds' },
      ];
      
      for (const { seed1, seed2, label } of testSequences) {
        randSeed(seed1, seed2);
        const sequence1 = generateSequence(10, 100);
        
        randSeed(seed1, seed2);
        const sequence2 = generateSequence(10, 100);
        
        assert.deepEqual(sequence1, sequence2, `${label} should be deterministic`);
      }
    });
    
    test('should handle rapid seed changes', () => {
      const seeds = [
        [1, 1], [2, 2], [3, 3], [1, 1]
      ];
      
      const results: number[][] = [];
      
      for (const [s1, s2] of seeds) {
        randSeed(s1, s2);
        results.push(generateSequence(5));
      }
      
      // First and last should be identical (same seed)
      assert.deepEqual(results[0], results[3], 'Same seed should produce same sequence');
      
      // Different seeds should produce different results
      assert.notDeepEqual(results[0], results[1]);
      assert.notDeepEqual(results[1], results[2]);
    });
  });
});
