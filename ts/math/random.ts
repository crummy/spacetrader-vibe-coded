// Random Number Generator
// Port of Palm OS random functions from Math.c
// Implements Pieter's custom random functions with deterministic seeding

// Constants from Palm OS Math.c
const DEFSEEDX = 521288629;
const DEFSEEDY = 362436069;
const MAX_WORD = 0xFFFF; // 16-bit word mask

/**
 * Custom random number generator state
 * Maintains two seed values for enhanced randomness
 */
class RandomState {
  private seedX: number = DEFSEEDX;
  private seedY: number = DEFSEEDY;
  
  // Static constants for the generator algorithm
  private static readonly A = 18000;
  private static readonly B = 30903;

  /**
   * Generate next random number using linear congruential generator
   * Port of Palm OS Rand() function
   */
  public rand(): number {
    // Apply the LCG formula with 16-bit arithmetic
    this.seedX = (RandomState.A * (this.seedX & MAX_WORD)) + (this.seedX >> 16);
    this.seedY = (RandomState.B * (this.seedY & MAX_WORD)) + (this.seedY >> 16);
    
    // Combine the two seeds to create final value
    return ((this.seedX << 16) + (this.seedY & MAX_WORD)) >>> 0; // Unsigned 32-bit
  }

  /**
   * Seed the random number generator
   * Port of Palm OS RandSeed() function
   */
  public seed(seed1?: number, seed2?: number): void {
    // Use default seeds if parameter is 0 or undefined
    this.seedX = seed1 || DEFSEEDX;
    this.seedY = seed2 || DEFSEEDY;
  }

  /**
   * Get seeds for testing/serialization
   */
  public getSeeds(): { x: number, y: number } {
    return { x: this.seedX, y: this.seedY };
  }
}

// Global random state instance
const globalRandomState = new RandomState();

/**
 * Generate random number from 0 to maxVal-1
 * Port of Palm OS GetRandom2() function
 */
export function getRandom(maxVal: number): number {
  if (maxVal <= 0) return 0;
  return globalRandomState.rand() % maxVal;
}

/**
 * Generate raw random number
 * Direct access to the underlying generator
 */
export function rand(): number {
  return globalRandomState.rand();
}

/**
 * Seed the global random number generator
 * Port of Palm OS RandSeed() function
 */
export function randSeed(seed1?: number, seed2?: number): void {
  globalRandomState.seed(seed1, seed2);
}

/**
 * Create a new isolated random state
 * Useful for deterministic subsystems
 */
export function createRandomState(seed1?: number, seed2?: number): RandomState {
  const state = new RandomState();
  state.seed(seed1, seed2);
  return state;
}

/**
 * Get current global random seeds (for testing)
 */
export function getGlobalSeeds(): { x: number, y: number } {
  return globalRandomState.getSeeds();
}

/**
 * Generate random integer in range [min, max] inclusive
 */
export function randomInt(min: number, max: number): number {
  if (min > max) {
    throw new Error(`Invalid range: min(${min}) > max(${max})`);
  }
  if (min === max) return min;
  
  const range = max - min + 1;
  return min + getRandom(range);
}

/**
 * Generate random boolean with given probability
 * @param probability - chance of returning true (0.0 to 1.0)
 */
export function randomBool(probability: number = 0.5): boolean {
  if (probability <= 0) return false;
  if (probability >= 1) return true;
  
  const threshold = Math.floor(probability * 0x7FFFFFFF); // Use 31-bit range
  return (rand() & 0x7FFFFFFF) < threshold;
}

/**
 * Shuffle array in place using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = getRandom(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Pick random element from array
 */
export function randomChoice<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[getRandom(array.length)];
}

/**
 * Generate multiple random numbers for testing determinism
 */
export function generateSequence(count: number, maxVal?: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    if (maxVal !== undefined) {
      result.push(getRandom(maxVal));
    } else {
      result.push(rand());
    }
  }
  return result;
}

/**
 * Math.random() compatible function using seeded generator
 * Returns a floating-point number between 0 (inclusive) and 1 (exclusive)
 * This provides a drop-in replacement for Math.random()
 */
export function random(): number {
  // Convert 32-bit integer to [0, 1) range
  return (rand() >>> 0) / 0x100000000;
}

/**
 * Math.floor(Math.random() * max) compatible function
 * Common pattern for generating integers from 0 to max-1
 */
export function randomFloor(max: number): number {
  return getRandom(max);
}

/**
 * Generate floating-point number in range [min, max)
 */
export function randomFloat(min: number = 0, max: number = 1): number {
  if (min >= max) {
    throw new Error(`Invalid range: min(${min}) >= max(${max})`);
  }
  return min + random() * (max - min);
}
