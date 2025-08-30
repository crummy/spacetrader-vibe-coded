// Trade Items System Tests
// Test-Driven Development: Write tests FIRST before implementation

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import type { TradeItemType } from '../types.ts';
import { TradeItem, SystemStatus, MAXTRADEITEM } from '../types.ts';
import { getTradeItems, getTradeItem } from './tradeItems.ts';

describe('Trade Items System', () => {
  test('should have exactly 10 trade items (MAXTRADEITEM)', () => {
    const tradeItems = getTradeItems();
    assert.equal(tradeItems.length, MAXTRADEITEM);
    assert.equal(tradeItems.length, 10);
  });

  test('should match exact Palm OS trade item data', () => {
    const tradeItems = getTradeItems();

    // Water - index 0
    const water = tradeItems[TradeItem.Water];
    assert.equal(water.name, 'Water');
    assert.equal(water.techProduction, 0);
    assert.equal(water.techUsage, 0);
    assert.equal(water.techTopProduction, 2);
    assert.equal(water.priceLowTech, 30);
    assert.equal(water.priceInc, 3);
    assert.equal(water.variance, 4);
    assert.equal(water.doublePriceStatus, SystemStatus.Drought);
    assert.equal(water.cheapResource, 4); // LOTSOFWATER
    assert.equal(water.expensiveResource, 3); // DESERT
    assert.equal(water.minTradePrice, 30);
    assert.equal(water.maxTradePrice, 50);
    assert.equal(water.roundOff, 1);

    // Furs - index 1
    const furs = tradeItems[TradeItem.Furs];
    assert.equal(furs.name, 'Furs');
    assert.equal(furs.techProduction, 0);
    assert.equal(furs.techUsage, 0);
    assert.equal(furs.techTopProduction, 0);
    assert.equal(furs.priceLowTech, 250);
    assert.equal(furs.priceInc, 10);
    assert.equal(furs.variance, 10);
    assert.equal(furs.doublePriceStatus, SystemStatus.Cold);
    assert.equal(furs.cheapResource, 7); // RICHFAUNA
    assert.equal(furs.expensiveResource, 8); // LIFELESS
    assert.equal(furs.minTradePrice, 230);
    assert.equal(furs.maxTradePrice, 280);
    assert.equal(furs.roundOff, 5);

    // Food - index 2
    const food = tradeItems[TradeItem.Food];
    assert.equal(food.name, 'Food');
    assert.equal(food.techProduction, 1);
    assert.equal(food.techUsage, 0);
    assert.equal(food.techTopProduction, 1);
    assert.equal(food.priceLowTech, 100);
    assert.equal(food.priceInc, 5);
    assert.equal(food.variance, 5);
    assert.equal(food.doublePriceStatus, SystemStatus.CropFailure);
    assert.equal(food.cheapResource, 5); // RICHSOIL
    assert.equal(food.expensiveResource, 6); // POORSOIL
    assert.equal(food.minTradePrice, 90);
    assert.equal(food.maxTradePrice, 160);
    assert.equal(food.roundOff, 5);

    // Ore - index 3
    const ore = tradeItems[TradeItem.Ore];
    assert.equal(ore.name, 'Ore');
    assert.equal(ore.techProduction, 2);
    assert.equal(ore.techUsage, 2);
    assert.equal(ore.techTopProduction, 3);
    assert.equal(ore.priceLowTech, 350);
    assert.equal(ore.priceInc, 20);
    assert.equal(ore.variance, 10);
    assert.equal(ore.doublePriceStatus, SystemStatus.War);
    assert.equal(ore.cheapResource, 1); // MINERALRICH
    assert.equal(ore.expensiveResource, 2); // MINERALPOOR
    assert.equal(ore.minTradePrice, 350);
    assert.equal(ore.maxTradePrice, 420);
    assert.equal(ore.roundOff, 10);

    // Games - index 4
    const games = tradeItems[TradeItem.Games];
    assert.equal(games.name, 'Games');
    assert.equal(games.techProduction, 3);
    assert.equal(games.techUsage, 1);
    assert.equal(games.techTopProduction, 6);
    assert.equal(games.priceLowTech, 250);
    assert.equal(games.priceInc, -10); // negative price increase
    assert.equal(games.variance, 5);
    assert.equal(games.doublePriceStatus, SystemStatus.Boredom);
    assert.equal(games.cheapResource, 11); // ARTISTIC
    assert.equal(games.expensiveResource, -1); // no expensive resource
    assert.equal(games.minTradePrice, 160);
    assert.equal(games.maxTradePrice, 270);
    assert.equal(games.roundOff, 5);

    // Firearms - index 5
    const firearms = tradeItems[TradeItem.Firearms];
    assert.equal(firearms.name, 'Firearms');
    assert.equal(firearms.techProduction, 3);
    assert.equal(firearms.techUsage, 1);
    assert.equal(firearms.techTopProduction, 5);
    assert.equal(firearms.priceLowTech, 1250);
    assert.equal(firearms.priceInc, -75); // negative price increase
    assert.equal(firearms.variance, 100);
    assert.equal(firearms.doublePriceStatus, SystemStatus.War);
    assert.equal(firearms.cheapResource, 12); // WARLIKE
    assert.equal(firearms.expensiveResource, -1); // no expensive resource
    assert.equal(firearms.minTradePrice, 600);
    assert.equal(firearms.maxTradePrice, 1100);
    assert.equal(firearms.roundOff, 25);

    // Medicine - index 6
    const medicine = tradeItems[TradeItem.Medicine];
    assert.equal(medicine.name, 'Medicine');
    assert.equal(medicine.techProduction, 4);
    assert.equal(medicine.techUsage, 1);
    assert.equal(medicine.techTopProduction, 6);
    assert.equal(medicine.priceLowTech, 650);
    assert.equal(medicine.priceInc, -20); // negative price increase
    assert.equal(medicine.variance, 10);
    assert.equal(medicine.doublePriceStatus, SystemStatus.Plague);
    assert.equal(medicine.cheapResource, 10); // LOTSOFHERBS
    assert.equal(medicine.expensiveResource, -1); // no expensive resource
    assert.equal(medicine.minTradePrice, 400);
    assert.equal(medicine.maxTradePrice, 700);
    assert.equal(medicine.roundOff, 25);

    // Machinery - index 7
    const machinery = tradeItems[TradeItem.Machinery];
    assert.equal(machinery.name, 'Machinery');
    assert.equal(machinery.techProduction, 4);
    assert.equal(machinery.techUsage, 3);
    assert.equal(machinery.techTopProduction, 5);
    assert.equal(machinery.priceLowTech, 900);
    assert.equal(machinery.priceInc, -30); // negative price increase
    assert.equal(machinery.variance, 5);
    assert.equal(machinery.doublePriceStatus, SystemStatus.LackOfWorkers);
    assert.equal(machinery.cheapResource, -1); // no cheap resource
    assert.equal(machinery.expensiveResource, -1); // no expensive resource
    assert.equal(machinery.minTradePrice, 600);
    assert.equal(machinery.maxTradePrice, 800);
    assert.equal(machinery.roundOff, 25);

    // Narcotics - index 8
    const narcotics = tradeItems[TradeItem.Narcotics];
    assert.equal(narcotics.name, 'Narcotics');
    assert.equal(narcotics.techProduction, 5);
    assert.equal(narcotics.techUsage, 0);
    assert.equal(narcotics.techTopProduction, 5);
    assert.equal(narcotics.priceLowTech, 3500);
    assert.equal(narcotics.priceInc, -125); // negative price increase
    assert.equal(narcotics.variance, 150);
    assert.equal(narcotics.doublePriceStatus, SystemStatus.Boredom);
    assert.equal(narcotics.cheapResource, 9); // WEIRDMUSHROOMS
    assert.equal(narcotics.expensiveResource, -1); // no expensive resource
    assert.equal(narcotics.minTradePrice, 2000);
    assert.equal(narcotics.maxTradePrice, 3000);
    assert.equal(narcotics.roundOff, 50);

    // Robots - index 9
    const robots = tradeItems[TradeItem.Robots];
    assert.equal(robots.name, 'Robots');
    assert.equal(robots.techProduction, 6);
    assert.equal(robots.techUsage, 4);
    assert.equal(robots.techTopProduction, 7);
    assert.equal(robots.priceLowTech, 5000);
    assert.equal(robots.priceInc, -150); // negative price increase
    assert.equal(robots.variance, 100);
    assert.equal(robots.doublePriceStatus, SystemStatus.LackOfWorkers);
    assert.equal(robots.cheapResource, -1); // no cheap resource
    assert.equal(robots.expensiveResource, -1); // no expensive resource
    assert.equal(robots.minTradePrice, 3500);
    assert.equal(robots.maxTradePrice, 5000);
    assert.equal(robots.roundOff, 100);
  });

  test('should provide individual trade item access', () => {
    // Test that we can get individual items by index
    const water = getTradeItem(TradeItem.Water);
    assert.equal(water.name, 'Water');
    
    const robots = getTradeItem(TradeItem.Robots);
    assert.equal(robots.name, 'Robots');
  });

  test('should throw error for invalid trade item index', () => {
    assert.throws(() => {
      getTradeItem(10); // out of bounds
    });
    
    assert.throws(() => {
      getTradeItem(-1); // negative index
    });
  });

  test('should have all items with valid names', () => {
    const tradeItems = getTradeItems();
    
    tradeItems.forEach((item, index) => {
      assert.ok(item.name.length > 0, `Item ${index} should have non-empty name`);
      assert.equal(typeof item.name, 'string', `Item ${index} name should be string`);
    });
  });

  test('should have valid tech levels (0-7)', () => {
    const tradeItems = getTradeItems();
    
    tradeItems.forEach((item, index) => {
      assert.ok(item.techProduction >= 0 && item.techProduction <= 7, 
        `Item ${index} techProduction should be 0-7`);
      assert.ok(item.techUsage >= 0 && item.techUsage <= 7, 
        `Item ${index} techUsage should be 0-7`);
      assert.ok(item.techTopProduction >= 0 && item.techTopProduction <= 7, 
        `Item ${index} techTopProduction should be 0-7`);
    });
  });

  test('should have positive prices and valid variance', () => {
    const tradeItems = getTradeItems();
    
    tradeItems.forEach((item, index) => {
      assert.ok(item.priceLowTech > 0, `Item ${index} priceLowTech should be positive`);
      assert.ok(item.variance >= 0, `Item ${index} variance should be non-negative`);
      assert.ok(item.minTradePrice > 0, `Item ${index} minTradePrice should be positive`);
      assert.ok(item.maxTradePrice > 0, `Item ${index} maxTradePrice should be positive`);
      assert.ok(item.maxTradePrice >= item.minTradePrice, 
        `Item ${index} maxTradePrice should be >= minTradePrice`);
      assert.ok(item.roundOff > 0, `Item ${index} roundOff should be positive`);
    });
  });

  test('should have valid system status values', () => {
    const tradeItems = getTradeItems();
    const validStatuses = Object.values(SystemStatus);
    
    tradeItems.forEach((item, index) => {
      assert.ok(validStatuses.includes(item.doublePriceStatus), 
        `Item ${index} doublePriceStatus should be valid SystemStatus`);
    });
  });

  test('should have valid resource values (-1 or 0-12)', () => {
    const tradeItems = getTradeItems();
    
    tradeItems.forEach((item, index) => {
      // Resources can be -1 (none) or 0-12 (valid resource types)
      assert.ok((item.cheapResource === -1) || (item.cheapResource >= 0 && item.cheapResource <= 12), 
        `Item ${index} cheapResource should be -1 or 0-12`);
      assert.ok((item.expensiveResource === -1) || (item.expensiveResource >= 0 && item.expensiveResource <= 12), 
        `Item ${index} expensiveResource should be -1 or 0-12`);
    });
  });
});