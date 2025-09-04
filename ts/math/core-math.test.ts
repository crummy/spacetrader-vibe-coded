// Core Mathematical Functions Tests

import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import { 
  integerSqrt, 
  squaredDistance, 
  realDistanceInteger, 
  clamp, 
  square 
} from './core-math.ts';

describe('Core Math Functions', () => {
  describe('Integer Square Root', () => {
    test('should handle perfect squares correctly', () => {
      assert.equal(integerSqrt(0), 0);
      assert.equal(integerSqrt(1), 1);
      assert.equal(integerSqrt(4), 2);
      assert.equal(integerSqrt(9), 3);
      assert.equal(integerSqrt(16), 4);
      assert.equal(integerSqrt(25), 5);
      assert.equal(integerSqrt(100), 10);
    });
    
    test('should approximate non-perfect squares correctly', () => {
      // Test values between perfect squares
      assert.equal(integerSqrt(2), 1); // closer to 1 than 2
      assert.equal(integerSqrt(3), 2); // closer to 2 than 1
      assert.equal(integerSqrt(5), 2); // closer to 2 than 3
      assert.equal(integerSqrt(8), 3); // closer to 3 than 2
      assert.equal(integerSqrt(15), 4); // closer to 4 than 3
      assert.equal(integerSqrt(24), 5); // closer to 5 than 4
    });
    
    test('should handle edge cases', () => {
      assert.equal(integerSqrt(-1), 0); // Negative input
      assert.equal(integerSqrt(0), 0);  // Zero
      assert.equal(integerSqrt(1), 1);  // One
    });
    
    test('should handle large numbers', () => {
      assert.equal(integerSqrt(10000), 100);
      assert.equal(integerSqrt(9999), 100); // Closer to 100 than 99
      assert.equal(integerSqrt(9801), 99);  // 99^2 = 9801
    });

    test('should match Palm OS approximation logic', () => {
      // Test specific cases from Palm OS logic
      // When (i^2 - a) > (a - (i-1)^2), choose i-1
      
      // For sqrt(8): 3^2=9, 2^2=4. (9-8)=1 > (8-4)=4? No, so choose 3
      assert.equal(integerSqrt(8), 3);
      
      // For sqrt(2): 2^2=4, 1^2=1. (4-2)=2 > (2-1)=1? Yes, so choose 1  
      assert.equal(integerSqrt(2), 1);
    });
  });

  describe('Squared Distance', () => {
    test('should calculate squared distance correctly', () => {
      assert.equal(squaredDistance(0, 0, 0, 0), 0);
      assert.equal(squaredDistance(0, 0, 3, 4), 25); // 3^2 + 4^2 = 9 + 16 = 25
      assert.equal(squaredDistance(1, 1, 4, 5), 25); // (4-1)^2 + (5-1)^2 = 9 + 16 = 25
    });
    
    test('should handle negative coordinates', () => {
      assert.equal(squaredDistance(-3, -4, 0, 0), 25);
      assert.equal(squaredDistance(3, 4, -3, -4), 100); // 6^2 + 8^2 = 36 + 64 = 100
    });
  });

  describe('Real Distance (Integer)', () => {
    test('should calculate real distance using integer sqrt', () => {
      assert.equal(realDistanceInteger(0, 0, 3, 4), 5); // sqrt(25) = 5
      assert.equal(realDistanceInteger(0, 0, 0, 0), 0); // sqrt(0) = 0
      assert.equal(realDistanceInteger(1, 1, 4, 5), 5); // sqrt(25) = 5
    });
    
    test('should match 3-4-5 triangle', () => {
      // Classic right triangle test case
      assert.equal(realDistanceInteger(0, 0, 3, 4), 5);
      assert.equal(realDistanceInteger(0, 0, 5, 12), 13); // 5-12-13 triangle
    });

    test('should handle approximations for non-perfect squares', () => {
      // Test cases where distance is not a perfect square
      assert.equal(realDistanceInteger(0, 0, 1, 1), 1); // sqrt(2) ≈ 1.414, rounds to 1
      assert.equal(realDistanceInteger(0, 0, 2, 2), 3); // sqrt(8) ≈ 2.828, rounds to 3
    });
  });

  describe('Utility Functions', () => {
    test('clamp should constrain values within bounds', () => {
      assert.equal(clamp(5, 1, 10), 5);   // Within bounds
      assert.equal(clamp(-5, 1, 10), 1);  // Below minimum
      assert.equal(clamp(15, 1, 10), 10); // Above maximum
      assert.equal(clamp(5, 5, 5), 5);    // At exact bounds
    });
    
    test('square should calculate squared values correctly', () => {
      assert.equal(square(0), 0);
      assert.equal(square(1), 1);
      assert.equal(square(2), 4);
      assert.equal(square(-3), 9);
      assert.equal(square(10), 100);
    });
  });

  describe('Consistency with JavaScript Math', () => {
    test('should produce same results as JavaScript Math.sqrt for perfect squares', () => {
      const perfectSquares = [0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100];
      
      for (const num of perfectSquares) {
        const jsResult = Math.floor(Math.sqrt(num));
        const customResult = integerSqrt(num);
        assert.equal(customResult, jsResult, `sqrt(${num}) should match JavaScript result`);
      }
    });
    
    test('integer sqrt should be close to JavaScript sqrt', () => {
      // Test non-perfect squares - should be within 1 of JavaScript result
      const testValues = [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 50, 99];
      
      for (const num of testValues) {
        const jsResult = Math.floor(Math.sqrt(num));
        const customResult = integerSqrt(num);
        const diff = Math.abs(customResult - jsResult);
        assert.ok(diff <= 1, `sqrt(${num}): custom=${customResult}, js=${jsResult}, diff=${diff}`);
      }
    });
  });
});
