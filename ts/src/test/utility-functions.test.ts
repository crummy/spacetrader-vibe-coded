import { describe, test } from 'node:test';
import { strict as assert } from 'node:assert';

// Utility functions and macros from spacetrader.h converted to TypeScript
export function min(a: number, b: number): number {
  return a <= b ? a : b;
}

export function max(a: number, b: number): number {
  return a >= b ? a : b;
}

export function abs(a: number): number {
  return a < 0 ? -a : a;
}

export function sqr(a: number): number {
  return a * a;
}

export function toUpper(char: string): string {
  return char >= 'a' && char <= 'z' ? String.fromCharCode(char.charCodeAt(0) - 32) : char;
}

export function toLower(char: string): string {
  return char >= 'A' && char <= 'Z' ? String.fromCharCode(char.charCodeAt(0) + 32) : char;
}

// Random number generation (simplified)
let randomSeed = 1;

export function setRandomSeed(seed: number): void {
  randomSeed = seed;
}

export function getRandom(maxVal: number): number {
  // Simple linear congruential generator for deterministic testing
  randomSeed = (randomSeed * 1103515245 + 12345) & 0x7fffffff;
  return randomSeed % maxVal;
}

// Distance calculations
export function sqrDistance(x1: number, y1: number, x2: number, y2: number): number {
  return sqr(x2 - x1) + sqr(y2 - y1);
}

export function realDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(sqrDistance(x1, y1, x2, y2));
}

// String utilities
export function stringBufMultiples(count: number): string {
  if (count === 0) return "";
  if (count === 1) return "";
  return `s`;
}

export function stringBufShortMultiples(count: number): string {
  if (count <= 1) return "";
  return `s`;
}

// Validation utilities for game constants
export function validateRange(value: number, min: number, max: number, name: string): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer`);
  }
  if (value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}, got ${value}`);
  }
}

export function validateNonNegative(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer, got ${value}`);
  }
}

export function validateArrayLength<T>(array: T[], expectedLength: number, name: string): void {
  if (!Array.isArray(array)) {
    throw new Error(`${name} must be an array`);
  }
  if (array.length !== expectedLength) {
    throw new Error(`${name} must have exactly ${expectedLength} elements, got ${array.length}`);
  }
}

export function validateSlotValue(value: number, name: string): void {
  if (!Number.isInteger(value) || (value !== -1 && value < 0)) {
    throw new Error(`${name} must be -1 (empty) or a non-negative integer, got ${value}`);
  }
}

// Clamp utility
export function clamp(value: number, minVal: number, maxVal: number): number {
  return min(max(value, minVal), maxVal);
}

// Safe division
export function safeDivide(numerator: number, denominator: number, defaultValue: number = 0): number {
  return denominator === 0 ? defaultValue : numerator / denominator;
}

// Percentage calculations
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

export function applyPercentage(value: number, percentage: number): number {
  return Math.floor(value * (percentage / 100));
}

// Rounding utilities  
export function roundToNearest(value: number, multiple: number): number {
  if (multiple === 0) return value;
  return Math.round(value / multiple) * multiple;
}

export function roundUpToNearest(value: number, multiple: number): number {
  if (multiple === 0) return value;
  return Math.ceil(value / multiple) * multiple;
}

export function roundDownToNearest(value: number, multiple: number): number {
  if (multiple === 0) return value;
  return Math.floor(value / multiple) * multiple;
}

// Array utilities
export function findEmptySlot(slots: number[]): number {
  return slots.findIndex(slot => slot === -1);
}

export function countEmptySlots(slots: number[]): number {
  return slots.filter(slot => slot === -1).length;
}

export function countUsedSlots(slots: number[]): number {
  return slots.filter(slot => slot !== -1).length;
}

export function hasEmptySlot(slots: number[]): boolean {
  return slots.some(slot => slot === -1);
}

export function isSlotUsed(slots: number[], index: number): boolean {
  if (index < 0 || index >= slots.length) return false;
  return slots[index] !== -1;
}

export function setSlot(slots: number[], itemId: number): boolean {
  const emptyIndex = findEmptySlot(slots);
  if (emptyIndex === -1) return false;
  
  slots[emptyIndex] = itemId;
  return true;
}

export function removeFromSlot(slots: number[], index: number): boolean {
  if (index < 0 || index >= slots.length || slots[index] === -1) {
    return false;
  }
  
  slots[index] = -1;
  return true;
}

// Coordinate utilities
export function isValidCoordinate(x: number, y: number, maxWidth: number, maxHeight: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) &&
         x >= 0 && x < maxWidth &&
         y >= 0 && y < maxHeight;
}

export function constrainCoordinate(value: number, maxValue: number): number {
  return clamp(value, 0, maxValue - 1);
}

// Credit formatting utilities
export function formatCredits(credits: number): string {
  if (credits < 0) return `-${formatCredits(-credits)}`;
  return credits.toLocaleString();
}

export function formatPrice(price: number): string {
  return price.toLocaleString();
}

// Boolean utilities for packed data (emulating Palm OS bit packing)
export function setBit(value: number, bitIndex: number): number {
  return value | (1 << bitIndex);
}

export function clearBit(value: number, bitIndex: number): number {
  return value & ~(1 << bitIndex);
}

export function toggleBit(value: number, bitIndex: number): number {
  return value ^ (1 << bitIndex);
}

export function isBitSet(value: number, bitIndex: number): boolean {
  return (value & (1 << bitIndex)) !== 0;
}

// Pack multiple boolean values into a single byte (0-255)
export function packBooleans(bools: boolean[]): number {
  if (bools.length > 8) throw new Error('Cannot pack more than 8 booleans');
  
  let result = 0;
  for (let i = 0; i < bools.length; i++) {
    if (bools[i]) {
      result = setBit(result, i);
    }
  }
  return result;
}

// Unpack booleans from a byte
export function unpackBooleans(value: number, count: number): boolean[] {
  if (count > 8) throw new Error('Cannot unpack more than 8 booleans');
  
  const result: boolean[] = [];
  for (let i = 0; i < count; i++) {
    result.push(isBitSet(value, i));
  }
  return result;
}

describe('Utility Functions', () => {
  test('min/max functions', () => {
    assert.strictEqual(min(5, 3), 3);
    assert.strictEqual(min(3, 5), 3);
    assert.strictEqual(min(5, 5), 5);
    assert.strictEqual(min(-5, 3), -5);
    
    assert.strictEqual(max(5, 3), 5);
    assert.strictEqual(max(3, 5), 5);
    assert.strictEqual(max(5, 5), 5);
    assert.strictEqual(max(-5, 3), 3);
  });
  
  test('abs function', () => {
    assert.strictEqual(abs(5), 5);
    assert.strictEqual(abs(-5), 5);
    assert.strictEqual(abs(0), 0);
  });
  
  test('sqr function', () => {
    assert.strictEqual(sqr(0), 0);
    assert.strictEqual(sqr(3), 9);
    assert.strictEqual(sqr(-3), 9);
    assert.strictEqual(sqr(10), 100);
  });
  
  test('case conversion', () => {
    assert.strictEqual(toLower('A'), 'a');
    assert.strictEqual(toLower('Z'), 'z');
    assert.strictEqual(toLower('a'), 'a');
    assert.strictEqual(toLower('5'), '5');
    assert.strictEqual(toLower('!'), '!');
    
    assert.strictEqual(toUpper('a'), 'A');
    assert.strictEqual(toUpper('z'), 'Z');
    assert.strictEqual(toUpper('A'), 'A');
    assert.strictEqual(toUpper('5'), '5');
    assert.strictEqual(toUpper('!'), '!');
  });
  
  test('distance calculations', () => {
    assert.strictEqual(sqrDistance(0, 0, 3, 4), 25); // 3^2 + 4^2 = 25
    assert.strictEqual(sqrDistance(1, 1, 4, 5), 25); // 3^2 + 4^2 = 25
    
    assert.strictEqual(realDistance(0, 0, 3, 4), 5); // sqrt(25) = 5
    assert.strictEqual(realDistance(0, 0, 0, 0), 0);
    
    // Test with floating point precision
    const dist = realDistance(0, 0, 1, 1);
    assert.ok(Math.abs(dist - Math.sqrt(2)) < 0.0001);
  });
  
  test('random number generation', () => {
    setRandomSeed(12345);
    
    const random1 = getRandom(100);
    const random2 = getRandom(100);
    
    // Should be deterministic
    assert.ok(random1 >= 0 && random1 < 100);
    assert.ok(random2 >= 0 && random2 < 100);
    
    // Reset seed and check reproducibility
    setRandomSeed(12345);
    assert.strictEqual(getRandom(100), random1);
    assert.strictEqual(getRandom(100), random2);
  });
  
  test('string utilities', () => {
    assert.strictEqual(stringBufMultiples(0), "");
    assert.strictEqual(stringBufMultiples(1), "");
    assert.strictEqual(stringBufMultiples(2), "s");
    assert.strictEqual(stringBufMultiples(10), "s");
    
    assert.strictEqual(stringBufShortMultiples(0), "");
    assert.strictEqual(stringBufShortMultiples(1), "");
    assert.strictEqual(stringBufShortMultiples(2), "s");
  });
  
  test('validation utilities', () => {
    // Valid cases should not throw
    assert.doesNotThrow(() => validateRange(5, 0, 10, "test"));
    assert.doesNotThrow(() => validateNonNegative(0, "test"));
    assert.doesNotThrow(() => validateArrayLength([1, 2, 3], 3, "test"));
    assert.doesNotThrow(() => validateSlotValue(-1, "test"));
    assert.doesNotThrow(() => validateSlotValue(5, "test"));
    
    // Invalid cases should throw
    assert.throws(() => validateRange(-1, 0, 10, "test"));
    assert.throws(() => validateRange(11, 0, 10, "test"));
    assert.throws(() => validateRange(5.5, 0, 10, "test"));
    
    assert.throws(() => validateNonNegative(-1, "test"));
    assert.throws(() => validateNonNegative(1.5, "test"));
    
    assert.throws(() => validateArrayLength([1, 2], 3, "test"));
    assert.throws(() => validateArrayLength("not array" as any, 3, "test"));
    
    assert.throws(() => validateSlotValue(-2, "test"));
    assert.throws(() => validateSlotValue(1.5, "test"));
  });
  
  test('clamp function', () => {
    assert.strictEqual(clamp(5, 0, 10), 5);
    assert.strictEqual(clamp(-5, 0, 10), 0);
    assert.strictEqual(clamp(15, 0, 10), 10);
    assert.strictEqual(clamp(0, 0, 10), 0);
    assert.strictEqual(clamp(10, 0, 10), 10);
  });
  
  test('safe division', () => {
    assert.strictEqual(safeDivide(10, 2), 5);
    assert.strictEqual(safeDivide(10, 0), 0); // Default
    assert.strictEqual(safeDivide(10, 0, -1), -1); // Custom default
  });
  
  test('percentage calculations', () => {
    assert.strictEqual(calculatePercentage(25, 100), 25);
    assert.strictEqual(calculatePercentage(0, 100), 0);
    assert.strictEqual(calculatePercentage(50, 0), 0); // Division by zero
    
    assert.strictEqual(applyPercentage(100, 50), 50);
    assert.strictEqual(applyPercentage(100, 0), 0);
    assert.strictEqual(applyPercentage(100, 150), 150);
  });
  
  test('rounding utilities', () => {
    assert.strictEqual(roundToNearest(23, 5), 25);
    assert.strictEqual(roundToNearest(22, 5), 20);
    assert.strictEqual(roundToNearest(25, 5), 25);
    assert.strictEqual(roundToNearest(25, 0), 25);
    
    assert.strictEqual(roundUpToNearest(23, 5), 25);
    assert.strictEqual(roundUpToNearest(25, 5), 25);
    assert.strictEqual(roundUpToNearest(21, 5), 25);
    
    assert.strictEqual(roundDownToNearest(23, 5), 20);
    assert.strictEqual(roundDownToNearest(25, 5), 25);
    assert.strictEqual(roundDownToNearest(29, 5), 25);
  });
  
  test('array slot utilities', () => {
    const slots = [0, -1, 2, -1, -1];
    
    assert.strictEqual(findEmptySlot(slots), 1);
    assert.strictEqual(countEmptySlots(slots), 3);
    assert.strictEqual(countUsedSlots(slots), 2);
    assert.strictEqual(hasEmptySlot(slots), true);
    
    assert.strictEqual(isSlotUsed(slots, 0), true);
    assert.strictEqual(isSlotUsed(slots, 1), false);
    assert.strictEqual(isSlotUsed(slots, 5), false); // Out of bounds
    
    // Test setSlot
    const testSlots = [-1, -1, -1];
    assert.strictEqual(setSlot(testSlots, 5), true);
    assert.strictEqual(testSlots[0], 5);
    assert.strictEqual(testSlots[1], -1);
    
    // Test removeFromSlot
    assert.strictEqual(removeFromSlot(testSlots, 0), true);
    assert.strictEqual(testSlots[0], -1);
    assert.strictEqual(removeFromSlot(testSlots, 0), false); // Already empty
    assert.strictEqual(removeFromSlot(testSlots, 5), false); // Out of bounds
  });
  
  test('coordinate utilities', () => {
    assert.strictEqual(isValidCoordinate(5, 10, 150, 110), true);
    assert.strictEqual(isValidCoordinate(0, 0, 150, 110), true);
    assert.strictEqual(isValidCoordinate(149, 109, 150, 110), true);
    
    assert.strictEqual(isValidCoordinate(-1, 10, 150, 110), false);
    assert.strictEqual(isValidCoordinate(150, 10, 150, 110), false);
    assert.strictEqual(isValidCoordinate(5.5, 10, 150, 110), false);
    
    assert.strictEqual(constrainCoordinate(-5, 150), 0);
    assert.strictEqual(constrainCoordinate(155, 150), 149);
    assert.strictEqual(constrainCoordinate(75, 150), 75);
  });
  
  test('credit formatting', () => {
    assert.strictEqual(formatCredits(1000), "1,000");
    assert.strictEqual(formatCredits(-1000), "-1,000");
    assert.strictEqual(formatCredits(0), "0");
    assert.strictEqual(formatCredits(1234567), "1,234,567");
  });
  
  test('bit manipulation', () => {
    let value = 0;
    
    value = setBit(value, 0);
    assert.strictEqual(value, 1);
    assert.strictEqual(isBitSet(value, 0), true);
    assert.strictEqual(isBitSet(value, 1), false);
    
    value = setBit(value, 2);
    assert.strictEqual(value, 5); // 101 binary
    assert.strictEqual(isBitSet(value, 2), true);
    
    value = clearBit(value, 0);
    assert.strictEqual(value, 4); // 100 binary
    assert.strictEqual(isBitSet(value, 0), false);
    
    value = toggleBit(value, 0);
    assert.strictEqual(value, 5); // 101 binary
    value = toggleBit(value, 0);
    assert.strictEqual(value, 4); // 100 binary
  });
  
  test('boolean packing/unpacking', () => {
    const bools = [true, false, true, true, false, false, true, false];
    const packed = packBooleans(bools);
    
    assert.strictEqual(packed, 77); // 01001101 binary
    
    const unpacked = unpackBooleans(packed, 8);
    assert.deepStrictEqual(unpacked, bools);
    
    // Test partial packing
    const shortBools = [true, false, true];
    const shortPacked = packBooleans(shortBools);
    const shortUnpacked = unpackBooleans(shortPacked, 3);
    assert.deepStrictEqual(shortUnpacked, shortBools);
    
    // Test error conditions
    assert.throws(() => packBooleans(new Array(9).fill(true)));
    assert.throws(() => unpackBooleans(0, 9));
  });
  
  test('edge cases and boundary conditions', () => {
    // Test with maximum values
    assert.strictEqual(min(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER - 1), Number.MAX_SAFE_INTEGER - 1);
    assert.strictEqual(max(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER + 1), Number.MIN_SAFE_INTEGER + 1);
    
    // Test with zero
    assert.strictEqual(safeDivide(0, 5), 0);
    assert.strictEqual(calculatePercentage(0, 0), 0);
    
    // Test empty arrays
    assert.strictEqual(findEmptySlot([]), -1);
    assert.strictEqual(countEmptySlots([]), 0);
    assert.strictEqual(hasEmptySlot([]), false);
  });
});
