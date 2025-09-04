// Core Mathematical Functions
// Port of essential mathematical functions from Palm OS Math.c

/**
 * Custom integer square root implementation 
 * Port of Palm OS sqrt() function from Math.c
 * Uses iterative approximation to find integer square root
 */
export function integerSqrt(a: number): number {
  if (a < 0) return 0;
  if (a === 0) return 0;
  
  let i = 0;
  // Find the largest integer i where i^2 <= a
  while (i * i < a) {
    i++;
  }
  
  // Choose the closest approximation
  if (i > 0) {
    const upperSqr = i * i;
    const lowerSqr = (i - 1) * (i - 1);
    if ((upperSqr - a) > (a - lowerSqr)) {
      i--;
    }
  }
  
  return i;
}

/**
 * Calculate squared distance between two points
 * Port of Palm OS SqrDistance() function
 */
export function squaredDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}

/**
 * Calculate real distance using custom integer square root
 * Port of Palm OS RealDistance() function  
 */
export function realDistanceInteger(x1: number, y1: number, x2: number, y2: number): number {
  const sqrDist = squaredDistance(x1, y1, x2, y2);
  return integerSqrt(sqrDist);
}

/**
 * Clamp a value between min and max (equivalent to min/max macros)
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/**
 * Square function (equivalent to SQR macro)
 */
export function square(a: number): number {
  return a * a;
}
