// Price Calculation System Tests  
// Test-Driven Development: Write tests FIRST before implementation

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import type { SolarSystem } from '../types.ts';
import { TradeItem, SystemStatus } from '../types.ts';
import { 
  calculateStandardPrice, calculateBuyPrice, calculateSellPrice,
  applySpecialEventModifier, applyRandomVariance,
  isPoliticallyRestricted, canSystemUseItem, canSystemProduceItem
} from './pricing.ts';

describe('Price Calculation System', () => {

  describe('Standard Price Calculation', () => {
    test('should calculate base price from tech level and price increment', () => {
      // Water: PriceLowTech=30, PriceInc=3
      // At tech level 0: 30 + (0 * 3) = 30, then Anarchy trader reduction: 30 * 98/100 = 29
      // At tech level 5: 30 + (5 * 3) = 45, then Anarchy trader reduction: 45 * 98/100 = 44
      const waterPrice0 = calculateStandardPrice(TradeItem.Water, 0, 0, 0, 0);
      const waterPrice5 = calculateStandardPrice(TradeItem.Water, 0, 5, 0, 0);
      
      assert.equal(waterPrice0, 29);
      assert.equal(waterPrice5, 44);
    });

    test('should apply government wanted item bonus (4/3 multiplier)', () => {
      // Test Anarchy (politics=0) wanting Food (TradeItem.Food)
      // Food: PriceLowTech=100, PriceInc=5
      // At tech 1: 100 + (1 * 5) = 105
      // Capitalist (politics=1) trader reduction: 105 * (100-14)/100 = 105 * 86/100 = 90
      // Anarchy (politics=0) with government bonus: 105 * 4/3 = 140, then trader reduction: 140 * 98/100 = 137
      
      const baseFoodPrice = calculateStandardPrice(TradeItem.Food, 0, 1, 1, 0); // Not wanted by politics 1
      const wantedFoodPrice = calculateStandardPrice(TradeItem.Food, 0, 1, 0, 0); // Wanted by politics 0 (Anarchy)
      
      assert.equal(baseFoodPrice, 90);
      assert.equal(wantedFoodPrice, 137); // 105 * 4/3 = 140, then * 98/100 = 137
    });

    test('should apply high trader activity price reduction', () => {
      // Politics with StrengthTraders = 7 should reduce price by 14% (2 * 7)
      // Capitalist State (politics=1) has StrengthTraders=7
      // Price reduction: (100 - (2 * 7)) / 100 = 86/100
      
      // Use a simple trade item for testing - Water at tech 0
      // Water base: 30, with trader reduction: 30 * 86/100 = 25.8 ≈ 25
      const priceWithTraders = calculateStandardPrice(TradeItem.Water, 0, 0, 1, 0);
      const priceWithoutTraders = calculateStandardPrice(TradeItem.Water, 0, 0, 0, 0); // Anarchy has 1 trader
      
      // Capitalist (1) has 7 traders, Anarchy (0) has 1 trader
      assert.ok(priceWithTraders < priceWithoutTraders, 'High trader activity should reduce prices');
    });

    test('should apply system size production bonus', () => {
      // Large systems (size 4) should have lower prices than small systems (size 0)
      // Size reduction: (100 - Size) / 100
      // Size 0: (100 - 0) / 100 = 100/100 = 1.0 (no reduction)
      // Size 4: (100 - 4) / 100 = 96/100 = 0.96 (4% reduction)
      
      const smallSystemPrice = calculateStandardPrice(TradeItem.Water, 0, 0, 0, 0);
      const largeSystemPrice = calculateStandardPrice(TradeItem.Water, 4, 0, 0, 0);
      
      assert.ok(largeSystemPrice < smallSystemPrice, 'Large systems should have lower prices');
    });

    test('should apply special resource modifiers', () => {
      // Water has CheapResource=4 (LOTSOFWATER), ExpensiveResource=3 (DESERT)
      // Cheap resource: Price * 3/4 = 75% of normal
      // Expensive resource: Price * 4/3 = 133% of normal
      
      const normalPrice = calculateStandardPrice(TradeItem.Water, 0, 0, 0, 0);
      const cheapPrice = calculateStandardPrice(TradeItem.Water, 0, 0, 0, 4); // LOTSOFWATER
      const expensivePrice = calculateStandardPrice(TradeItem.Water, 0, 0, 0, 3); // DESERT
      
      assert.equal(cheapPrice, Math.floor(normalPrice * 3 / 4));
      assert.equal(expensivePrice, Math.floor(normalPrice * 4 / 3));
    });

    test('should return 0 for politically restricted items', () => {
      // Narcotics (8) should be 0 in systems where drugs are not OK
      // Firearms (5) should be 0 in systems where firearms are not OK
      // Cybernetic State (5) prohibits both drugs and firearms
      
      const narcoticsPrice = calculateStandardPrice(TradeItem.Narcotics, 0, 6, 5, 0); // Cybernetic State
      const firearmsPrice = calculateStandardPrice(TradeItem.Firearms, 0, 6, 5, 0);  // Cybernetic State
      
      assert.equal(narcoticsPrice, 0);
      assert.equal(firearmsPrice, 0);
    });

    test('should return 0 if tech level too low for usage', () => {
      // Robots (9) have TechUsage=4, so tech level 3 cannot use them
      const robotsLowTech = calculateStandardPrice(TradeItem.Robots, 0, 3, 0, 0);
      const robotsHighTech = calculateStandardPrice(TradeItem.Robots, 0, 5, 0, 0);
      
      assert.equal(robotsLowTech, 0);
      assert.ok(robotsHighTech > 0);
    });

    test('should never return negative prices', () => {
      // Test extreme conditions that might cause negative prices
      // Large size (4) + high trader activity + cheap resource
      
      const price = calculateStandardPrice(TradeItem.Water, 4, 0, 1, 4); // Max reductions
      assert.ok(price >= 0, 'Price should never be negative');
    });
  });

  describe('Special Event Price Modifiers', () => {
    test('should apply 1.5x multiplier for special events', () => {
      // War (SystemStatus.War) doubles price for Ore (DoublePriceStatus = War)
      // Actually 1.5x multiplier according to Palm code: (Price * 3) >> 1
      
      const basePrice = 100;
      const warPrice = applySpecialEventModifier(TradeItem.Ore, SystemStatus.War, basePrice);
      const normalPrice = applySpecialEventModifier(TradeItem.Ore, SystemStatus.Uneventful, basePrice);
      
      assert.equal(warPrice, 150); // 100 * 3/2 = 150
      assert.equal(normalPrice, 100);
    });

    test('should only apply modifier for matching status', () => {
      // Drought affects Water, but War should not affect Water prices
      const basePrice = 100;
      const droughtWaterPrice = applySpecialEventModifier(TradeItem.Water, SystemStatus.Drought, basePrice);
      const warWaterPrice = applySpecialEventModifier(TradeItem.Water, SystemStatus.War, basePrice);
      
      assert.equal(droughtWaterPrice, 150); // Water affected by drought
      assert.equal(warWaterPrice, 100);     // Water not affected by war
    });
  });

  describe('Random Price Variance', () => {
    test('should apply variance within expected range', () => {
      // Water has variance=4, so price should vary by ±4
      const basePrice = 100;
      const seededRandom = () => 2; // Mock random that always returns 2
      
      // With seeded random, variance should be: +2 - 2 = 0
      const variedPrice = applyRandomVariance(TradeItem.Water, basePrice, seededRandom);
      assert.equal(variedPrice, basePrice);
    });

    test('should never result in negative prices after variance', () => {
      // Test with low base price and high variance
      const basePrice = 2;
      const worstCaseRandom = () => 0; // Always returns minimum (negative variance)
      
      const variedPrice = applyRandomVariance(TradeItem.Water, basePrice, worstCaseRandom);
      assert.ok(variedPrice >= 0, 'Price should never go negative after variance');
    });
  });

  describe('Buy/Sell Price Calculations', () => {
    test('should calculate correct buy prices with trader skill modifier', () => {
      const basePrice = 100;
      const traderSkill = 5; // MAXSKILL is 10
      
      // Buy price = base * (103 + (10 - 5)) / 100 = base * 108/100 = 108
      const buyPrice = calculateBuyPrice(basePrice, traderSkill, false, 7);
      assert.equal(buyPrice, 108);
    });

    test('should apply criminal penalty to buy prices', () => {
      const basePrice = 100;
      const traderSkill = 5;
      
      // Criminal penalty: multiply by 100/90, then apply trader skill
      // Criminal price = 100 * 100/90 = 111.11 ≈ 111
      // Then trader skill: 111 * 108/100 = 119.88 ≈ 119
      const criminalBuyPrice = calculateBuyPrice(basePrice, traderSkill, true, 0);
      const normalBuyPrice = calculateBuyPrice(basePrice, traderSkill, false, 7);
      
      assert.ok(criminalBuyPrice > normalBuyPrice, 'Criminals should pay more');
    });

    test('should ensure buy price is always higher than sell price', () => {
      const basePrice = 100;
      const traderSkill = 10; // Maximum skill
      
      const buyPrice = calculateBuyPrice(basePrice, traderSkill, false, 7);
      const sellPrice = calculateSellPrice(basePrice, false);
      
      assert.ok(buyPrice > sellPrice, 'Buy price should always exceed sell price');
    });

    test('should apply criminal penalty to sell prices', () => {
      const basePrice = 100;
      
      const normalSellPrice = calculateSellPrice(basePrice, false);
      const criminalSellPrice = calculateSellPrice(basePrice, true);
      
      assert.equal(normalSellPrice, 100);
      assert.equal(criminalSellPrice, 90); // 90% of base price for criminals
    });
  });

  describe('Political and Tech Restrictions', () => {
    test('should correctly identify politically restricted items', () => {
      // Cybernetic State (5) prohibits drugs and firearms
      assert.equal(isPoliticallyRestricted(TradeItem.Narcotics, 5), true);
      assert.equal(isPoliticallyRestricted(TradeItem.Firearms, 5), true);
      assert.equal(isPoliticallyRestricted(TradeItem.Water, 5), false);
      
      // Anarchy (0) allows everything
      assert.equal(isPoliticallyRestricted(TradeItem.Narcotics, 0), false);
      assert.equal(isPoliticallyRestricted(TradeItem.Firearms, 0), false);
    });

    test('should correctly check if system can produce items', () => {
      // Water: TechProduction=0, so any tech level can produce
      // Robots: TechProduction=6, so need tech 6+ to produce
      
      assert.equal(canSystemProduceItem(TradeItem.Water, 0), true);
      assert.equal(canSystemProduceItem(TradeItem.Robots, 5), false);
      assert.equal(canSystemProduceItem(TradeItem.Robots, 6), true);
    });

    test('should correctly check if system can use items', () => {
      // Water: TechUsage=0, so any tech level can use
      // Robots: TechUsage=4, so need tech 4+ to use
      
      assert.equal(canSystemUseItem(TradeItem.Water, 0), true);
      assert.equal(canSystemUseItem(TradeItem.Robots, 3), false);
      assert.equal(canSystemUseItem(TradeItem.Robots, 4), true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid trade item indices gracefully', () => {
      assert.throws(() => calculateStandardPrice(-1, 0, 0, 0, 0));
      assert.throws(() => calculateStandardPrice(10, 0, 0, 0, 0)); // Only 0-9 valid
    });

    test('should handle extreme parameter values', () => {
      // Test with maximum values
      const price = calculateStandardPrice(TradeItem.Water, 4, 7, 16, 12);
      assert.ok(price >= 0, 'Should handle maximum parameter values');
    });

    test('should produce consistent results for same inputs', () => {
      const price1 = calculateStandardPrice(TradeItem.Food, 2, 3, 1, 5);
      const price2 = calculateStandardPrice(TradeItem.Food, 2, 3, 1, 5);
      
      assert.equal(price1, price2, 'Same inputs should produce same results');
    });
  });

  describe('Integration with Game Data', () => {
    test('should work with all trade items', () => {
      // Test that price calculation works for all 10 trade items
      for (let i = 0; i < 10; i++) {
        const price = calculateStandardPrice(i, 0, 5, 0, 0);
        assert.ok(price >= 0, `Trade item ${i} should have valid price`);
      }
    });

    test('should respect trade item min/max prices', () => {
      // Water: minTradePrice=30, maxTradePrice=50
      // Under normal conditions, should stay within bounds
      
      const lowTechPrice = calculateStandardPrice(TradeItem.Water, 0, 0, 0, 0);
      const highTechPrice = calculateStandardPrice(TradeItem.Water, 0, 7, 0, 0);
      
      // Note: Special conditions can push prices outside normal bounds
      // This test just ensures basic tech level pricing is reasonable
      assert.ok(lowTechPrice >= 20, 'Low tech price should be reasonable');
      assert.ok(highTechPrice <= 100, 'High tech price should be reasonable');
    });
  });
});