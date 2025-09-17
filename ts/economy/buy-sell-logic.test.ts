import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateFinalPrices } from './pricing.ts';

describe('Buy vs Sell Price Logic - Palm OS Compatibility', () => {
  
  it('should allow selling games to medieval systems (can use but cannot produce)', () => {
    // Games: techProduction=3, techUsage=1
    // Medieval system: techLevel=2
    const medievalSystem = {
      size: 1,
      techLevel: 2,
      politics: 0, // Anarchy - no restrictions
      specialResources: 0,
      status: 0
    };
    
    const gamesPrices = calculateFinalPrices(4, medievalSystem, 0, 100); // Games = index 4
    
    // Should have sellPrice > 0 (can sell games to medieval systems)
    assert.ok(gamesPrices.sellPrice > 0, `Expected sellPrice > 0, got ${gamesPrices.sellPrice}`);
    // Should have buyPrice = 0 (cannot buy from systems that don't produce)
    assert.strictEqual(gamesPrices.buyPrice, 0, `Expected buyPrice = 0, got ${gamesPrices.buyPrice}`);
  });

  it('should allow selling robots to hi-tech systems only', () => {
    // Robots: techProduction=4, techUsage=4
    // Hi-tech system: techLevel=7
    const hitechSystem = {
      size: 1,
      techLevel: 7,
      politics: 0,
      specialResources: 0,
      status: 0
    };
    
    const robotsPrices = calculateFinalPrices(9, hitechSystem, 0, 100); // Robots = index 9
    
    // Should have both prices > 0 (can both use and produce)
    assert.ok(robotsPrices.sellPrice > 0, `Expected sellPrice > 0, got ${robotsPrices.sellPrice}`);
    assert.ok(robotsPrices.buyPrice > 0, `Expected buyPrice > 0, got ${robotsPrices.buyPrice}`);
  });

  it('should not allow selling robots to medieval systems', () => {
    // Robots: techProduction=4, techUsage=4
    // Medieval system: techLevel=2
    const medievalSystem = {
      size: 1,
      techLevel: 2,
      politics: 0,
      specialResources: 0,
      status: 0
    };
    
    const robotsPrices = calculateFinalPrices(9, medievalSystem, 0, 100); // Robots = index 9
    
    // Should have both prices = 0 (cannot use or produce)
    assert.strictEqual(robotsPrices.sellPrice, 0, `Expected sellPrice = 0, got ${robotsPrices.sellPrice}`);
    assert.strictEqual(robotsPrices.buyPrice, 0, `Expected buyPrice = 0, got ${robotsPrices.buyPrice}`);
  });

  it('should allow selling water to any system (techUsage=0)', () => {
    // Water: techProduction=0, techUsage=0
    // Pre-agricultural system: techLevel=0
    const preagSystem = {
      size: 1,
      techLevel: 0,
      politics: 0,
      specialResources: 0,
      status: 0
    };
    
    const waterPrices = calculateFinalPrices(0, preagSystem, 0, 100); // Water = index 0
    
    // Should have both prices > 0 (any system can use and produce water)
    assert.ok(waterPrices.sellPrice > 0, `Expected sellPrice > 0, got ${waterPrices.sellPrice}`);
    assert.ok(waterPrices.buyPrice > 0, `Expected buyPrice > 0, got ${waterPrices.buyPrice}`);
  });

  it('should allow selling ore to medieval systems (can use, can produce)', () => {
    // Ore: techProduction=2, techUsage=2
    // Medieval system: techLevel=2
    const medievalSystem = {
      size: 1,
      techLevel: 2,
      politics: 0,
      specialResources: 0,
      status: 0
    };
    
    const orePrices = calculateFinalPrices(3, medievalSystem, 0, 100); // Ore = index 3
    
    // Should have both prices > 0 (can both use and produce)
    assert.ok(orePrices.sellPrice > 0, `Expected sellPrice > 0, got ${orePrices.sellPrice}`);
    assert.ok(orePrices.buyPrice > 0, `Expected buyPrice > 0, got ${orePrices.buyPrice}`);
  });

  it('should allow selling machinery to renaissance systems but not medieval', () => {
    // Machinery: techProduction=4, techUsage=3
    
    // Renaissance system: techLevel=3
    const renaissanceSystem = {
      size: 1,
      techLevel: 3,
      politics: 0,
      specialResources: 0,
      status: 0
    };
    
    const machineryPricesRenaissance = calculateFinalPrices(7, renaissanceSystem, 0, 100); // Machinery = index 7
    
    // Should have sellPrice > 0 (can use), buyPrice = 0 (cannot produce)
    assert.ok(machineryPricesRenaissance.sellPrice > 0, `Expected sellPrice > 0, got ${machineryPricesRenaissance.sellPrice}`);
    assert.strictEqual(machineryPricesRenaissance.buyPrice, 0, `Expected buyPrice = 0, got ${machineryPricesRenaissance.buyPrice}`);

    // Medieval system: techLevel=2
    const medievalSystem = {
      size: 1,
      techLevel: 2,
      politics: 0,
      specialResources: 0,
      status: 0
    };
    
    const machineryPricesMedieval = calculateFinalPrices(7, medievalSystem, 0, 100); // Machinery = index 7
    
    // Should have both prices = 0 (cannot use or produce)
    assert.strictEqual(machineryPricesMedieval.sellPrice, 0, `Expected sellPrice = 0, got ${machineryPricesMedieval.sellPrice}`);
    assert.strictEqual(machineryPricesMedieval.buyPrice, 0, `Expected buyPrice = 0, got ${machineryPricesMedieval.buyPrice}`);
  });
});
