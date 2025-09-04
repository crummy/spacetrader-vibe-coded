// Distance Calculation Tests
// Tests for mathematical functions critical to game mechanics

import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import { integerSqrt, realDistanceInteger } from './core-math.ts';
import { calculateDistance } from '../travel/warp.ts';
import type { SolarSystem } from '../types.ts';

function createTestSystem(x: number, y: number): SolarSystem {
  return {
    x,
    y,
    nameIndex: 0,
    size: 0,
    techLevel: 0,
    politics: 0,
    specialResources: 0,
    status: 0,
    visited: false,
    qty: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  };
}

describe('Distance Calculations', () => {
  describe('Integer Square Root vs JavaScript Math.sqrt', () => {
    test('should produce identical results for perfect squares', () => {
      const perfectSquares = [0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144];
      
      for (const num of perfectSquares) {
        const jsResult = Math.floor(Math.sqrt(num));
        const palmResult = integerSqrt(num);
        
        assert.equal(palmResult, jsResult, 
          `sqrt(${num}): Palm=${palmResult}, JS=${jsResult}`);
      }
    });
    
    test('should closely approximate JavaScript results for non-perfect squares', () => {
      // Test values that would affect game distances
      const testValues = [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20];
      
      for (const num of testValues) {
        const jsResult = Math.floor(Math.sqrt(num));
        const palmResult = integerSqrt(num);
        const difference = Math.abs(palmResult - jsResult);
        
        assert.ok(difference <= 1, 
          `sqrt(${num}): Palm=${palmResult}, JS=${jsResult}, diff=${difference}`);
      }
    });
  });

  describe('Distance Calculation Comparison', () => {
    test('should compare Palm OS integer distance vs modern float distance', () => {
      const testCases = [
        { x1: 0, y1: 0, x2: 3, y2: 4, expectedDistance: 5 },
        { x1: 0, y1: 0, x2: 5, y2: 12, expectedDistance: 13 },
        { x1: 10, y1: 10, x2: 13, y2: 14, expectedDistance: 5 },
        { x1: 0, y1: 0, x2: 1, y2: 1, expectedDistance: 1 }, // sqrt(2) ≈ 1.414
        { x1: 0, y1: 0, x2: 2, y2: 2, expectedDistance: 3 }, // sqrt(8) ≈ 2.828
      ];
      
      for (const testCase of testCases) {
        const systemA = createTestSystem(testCase.x1, testCase.y1);
        const systemB = createTestSystem(testCase.x2, testCase.y2);
        
        const modernDistance = calculateDistance(systemA, systemB);
        const palmDistance = realDistanceInteger(testCase.x1, testCase.y1, testCase.x2, testCase.y2);
        
        // For perfect squares, should be identical
        if (testCase.expectedDistance === Math.sqrt((testCase.x2 - testCase.x1) ** 2 + (testCase.y2 - testCase.y1) ** 2)) {
          assert.equal(modernDistance, palmDistance, 
            `Perfect square distance should be identical: modern=${modernDistance}, palm=${palmDistance}`);
        } else {
          // For approximations, should be close
          const difference = Math.abs(modernDistance - palmDistance);
          assert.ok(difference <= 1, 
            `Approximated distances should be close: modern=${modernDistance}, palm=${palmDistance}`);
        }
      }
    });

    test('should handle maximum galaxy coordinates', () => {
      // Test with coordinates at galaxy boundaries
      const maxCoord = 150; // Approximate galaxy size
      
      const systemA = createTestSystem(0, 0);
      const systemB = createTestSystem(maxCoord, maxCoord);
      
      const distance = calculateDistance(systemA, systemB);
      const palmDistance = realDistanceInteger(0, 0, maxCoord, maxCoord);
      
      assert.ok(distance > 0, 'Should calculate positive distance');
      assert.ok(palmDistance > 0, 'Palm distance should be positive');
      
      const expectedDistance = Math.sqrt(maxCoord * maxCoord * 2);
      assert.ok(Math.abs(distance - expectedDistance) <= 1, 
        'Distance should approximate expected diagonal');
    });
  });

  describe('Game Mechanics Impact', () => {
    test('should ensure consistent fuel calculations with different distance methods', () => {
      const testSystems = [
        [createTestSystem(10, 20), createTestSystem(15, 25)], // Close systems
        [createTestSystem(0, 0), createTestSystem(50, 50)],   // Medium distance
        [createTestSystem(10, 10), createTestSystem(100, 100)] // Far distance
      ];
      
      for (const [systemA, systemB] of testSystems) {
        const modernDistance = calculateDistance(systemA, systemB);
        const palmDistance = realDistanceInteger(systemA.x, systemA.y, systemB.x, systemB.y);
        
        // Both should be positive integers
        assert.equal(modernDistance, Math.floor(modernDistance), 'Modern distance should be integer');
        assert.equal(palmDistance, Math.floor(palmDistance), 'Palm distance should be integer');
        
        // Should not differ by more than 1 parsec (fuel unit)
        const difference = Math.abs(modernDistance - palmDistance);
        assert.ok(difference <= 1, 
          `Fuel calculation difference should be ≤ 1 parsec: ${difference}`);
      }
    });

    test('should handle zero distance correctly', () => {
      const system = createTestSystem(42, 73);
      
      const modernDistance = calculateDistance(system, system);
      const palmDistance = realDistanceInteger(system.x, system.y, system.x, system.y);
      
      assert.equal(modernDistance, 0, 'Modern: Same system should have 0 distance');
      assert.equal(palmDistance, 0, 'Palm: Same system should have 0 distance');
    });

    test('should maintain symmetry in distance calculations', () => {
      const systemA = createTestSystem(25, 30);
      const systemB = createTestSystem(40, 50);
      
      const distanceAB = calculateDistance(systemA, systemB);
      const distanceBA = calculateDistance(systemB, systemA);
      
      const palmDistanceAB = realDistanceInteger(25, 30, 40, 50);
      const palmDistanceBA = realDistanceInteger(40, 50, 25, 30);
      
      assert.equal(distanceAB, distanceBA, 'Modern: Distance should be symmetric');
      assert.equal(palmDistanceAB, palmDistanceBA, 'Palm: Distance should be symmetric');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle very small distances correctly', () => {
      const testCases = [
        [0, 0, 1, 0], // Distance = 1
        [0, 0, 0, 1], // Distance = 1
        [0, 0, 1, 1], // Distance = sqrt(2) ≈ 1.414
        [5, 5, 6, 6], // Distance = sqrt(2) ≈ 1.414
      ];
      
      for (const [x1, y1, x2, y2] of testCases) {
        const modernDistance = calculateDistance(
          createTestSystem(x1, y1), 
          createTestSystem(x2, y2)
        );
        const palmDistance = realDistanceInteger(x1, y1, x2, y2);
        
        assert.ok(modernDistance >= 1, 'Modern distance should be at least 1');
        assert.ok(palmDistance >= 1, 'Palm distance should be at least 1');
      }
    });

    test('should ensure no negative distances', () => {
      const randomPairs = [
        [-10, -5, 20, 15],
        [100, 200, -50, -100],
        [-25, 30, 75, -40]
      ];
      
      for (const [x1, y1, x2, y2] of randomPairs) {
        const modernDistance = calculateDistance(
          createTestSystem(x1, y1), 
          createTestSystem(x2, y2)
        );
        const palmDistance = realDistanceInteger(x1, y1, x2, y2);
        
        assert.ok(modernDistance >= 0, 'Modern distance should be non-negative');
        assert.ok(palmDistance >= 0, 'Palm distance should be non-negative');
      }
    });
  });
});
