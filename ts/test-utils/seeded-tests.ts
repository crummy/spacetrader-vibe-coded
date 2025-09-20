// Test utilities for deterministic, seeded testing
// Provides consistent random behavior across test runs

import { randSeed } from '../math/random.ts';

/**
 * Standard test seed for deterministic behavior
 * Using the same seed across all tests ensures reproducible results
 */
export const TEST_SEED = {
  primary: 12345,
  secondary: 67890
};

/**
 * Initialize deterministic random state for testing
 * Call this at the start of tests that need predictable random behavior
 */
export function initTestRandomState(): void {
  randSeed(TEST_SEED.primary, TEST_SEED.secondary);
}

/**
 * Initialize test with custom seed (for specific test scenarios)
 */
export function initTestWithSeed(seed1: number, seed2?: number): void {
  randSeed(seed1, seed2);
}

/**
 * Reset to standard test seed (call between tests if needed)
 */
export function resetTestRandomState(): void {
  initTestRandomState();
}

/**
 * Generate a unique seed based on test name for test isolation
 * This allows each test to have its own deterministic sequence
 */
export function generateTestSeed(testName: string): { primary: number, secondary: number } {
  // Simple hash of test name to generate consistent but unique seeds
  let hash1 = 0;
  let hash2 = 0;
  
  for (let i = 0; i < testName.length; i++) {
    const char = testName.charCodeAt(i);
    hash1 = ((hash1 << 5) - hash1 + char) & 0xFFFFFFFF;
    hash2 = ((hash2 << 3) - hash2 + char * 17) & 0xFFFFFFFF;
  }
  
  return {
    primary: Math.abs(hash1) || 12345,
    secondary: Math.abs(hash2) || 67890
  };
}

/**
 * Initialize test with seed based on test name
 * Provides test isolation while maintaining determinism
 */
export function initTestWithName(testName: string): void {
  const seed = generateTestSeed(testName);
  randSeed(seed.primary, seed.secondary);
}
