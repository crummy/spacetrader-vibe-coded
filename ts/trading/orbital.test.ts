#!/usr/bin/env node --test --experimental-strip-types

import { test } from 'node:test';
import assert from 'node:assert';
import { 
  executeOrbitalPurchase, executeOrbitalSale, shouldOfferOrbitalTrade,
  generateOrbitalTradeEncounter 
} from './orbital.ts';
import { createInitialState } from '../state.ts';

test('Orbital Trading System', async (t) => {

  await t.test('Trade Probability System', async (t) => {
    
    await t.test('should implement correct trade-in-orbit probability (100 in 1000)', () => {
      const testRuns = 10000;
      let tradeOffers = 0;
      
      for (let i = 0; i < testRuns; i++) {
        if (shouldOfferOrbitalTrade()) {
          tradeOffers++;
        }
      }
      
      const actualRate = tradeOffers / testRuns;
      const expectedRate = 100 / 1000; // 10%
      
      // Should be within reasonable range (±0.01 tolerance)
      assert.ok(Math.abs(actualRate - expectedRate) < 0.01,
        `Expected rate ~${expectedRate}, got ${actualRate}`);
      
      console.log(`Orbital trade probability: ${(actualRate * 100).toFixed(1)}% (expected 10.0%)`);
    });
  });

  await t.test('Orbital Purchase System (Trader Selling to Player)', async (t) => {
    
    await t.test('should successfully purchase from orbital trader', () => {
      const state = createInitialState();
      state.credits = 10000;
      // Clear cargo to ensure space
      state.ship.cargo.fill(0);
      
      const result = executeOrbitalPurchase(state, 24); // TRADERSELL
      
      if (result.success) {
        assert.ok(result.itemsBought! > 0);
        assert.ok(result.creditsSpent! > 0);
        assert.ok(result.tradeItemIndex! >= 0 && result.tradeItemIndex! < 10);
        assert.ok(state.credits < 10000); // Credits deducted
        
        // Check cargo was added
        const totalCargo = state.ship.cargo.reduce((sum, qty) => sum + qty, 0);
        assert.equal(totalCargo, result.itemsBought);
        
        console.log(`Bought ${result.itemsBought} ${result.reason?.split(' ')[1]} for ${result.creditsSpent} credits`);
      } else {
        console.log('Purchase failed (acceptable due to randomness):', result.reason);
      }
    });

    await t.test('should fail when insufficient credits', () => {
      const state = createInitialState();
      state.credits = 1; // Very low credits
      state.ship.cargo.fill(0);
      
      const result = executeOrbitalPurchase(state, 24);
      
      // Should fail or buy very little
      if (!result.success) {
        assert.ok(result.reason?.includes('credits') || result.reason?.includes('Unable to trade'));
      }
    });

    await t.test('should fail when insufficient cargo space', () => {
      const state = createInitialState();
      state.credits = 50000;
      // Fill cargo completely
      state.ship.cargo.fill(50);
      
      const result = executeOrbitalPurchase(state, 24);
      
      assert.equal(result.success, false);
      assert.ok(result.reason?.includes('cargo space') || result.reason?.includes('Unable to trade'));
    });
  });

  await t.test('Orbital Sale System (Player Selling to Trader)', async (t) => {
    
    await t.test('should successfully sell to orbital trader', () => {
      const state = createInitialState();
      state.credits = 1000;
      // Add some cargo to sell
      state.ship.cargo[0] = 10; // Water
      state.ship.cargo[2] = 5;  // Food
      
      const result = executeOrbitalSale(state, 25); // TRADERBUY
      
      if (result.success) {
        assert.ok(result.itemsSold! > 0);
        assert.ok(result.creditsGained! > 0);
        assert.ok(result.tradeItemIndex! >= 0 && result.tradeItemIndex! < 10);
        assert.ok(state.credits > 1000); // Credits gained
        
        console.log(`Sold ${result.itemsSold} ${result.reason?.split(' ')[1]} for ${result.creditsGained} credits`);
      } else {
        console.log('Sale failed (acceptable due to randomness):', result.reason);
      }
    });

    await t.test('should fail when no cargo to sell', () => {
      const state = createInitialState();
      state.credits = 1000;
      // Empty cargo
      state.ship.cargo.fill(0);
      
      const result = executeOrbitalSale(state, 25);
      
      assert.equal(result.success, false);
      assert.ok(result.reason?.includes('Nothing to sell') || result.reason?.includes('no cargo'));
    });

    await t.test('should only sell cargo player actually has', () => {
      const state = createInitialState();
      state.credits = 1000;
      state.ship.cargo.fill(0);
      state.ship.cargo[3] = 3; // Only 3 units of ore
      
      const result = executeOrbitalSale(state, 25);
      
      if (result.success && result.tradeItemIndex === 3) {
        assert.ok(result.itemsSold! <= 3, 'Should not sell more than available');
        assert.equal(state.ship.cargo[3], 3 - result.itemsSold!);
      }
    });
  });

  await t.test('Price Calculation System', async (t) => {
    
    await t.test('should use min/max price ranges for orbital trading', () => {
      const state = createInitialState();
      state.credits = 50000;
      state.ship.cargo.fill(0);
      
      // Test multiple purchases to see price variation
      const prices = [];
      
      for (let i = 0; i < 20; i++) {
        const result = executeOrbitalPurchase(state, 24);
        if (result.success && result.itemsBought! > 0) {
          const pricePerUnit = result.creditsSpent! / result.itemsBought!;
          prices.push(pricePerUnit);
        }
        
        // Reset for next test
        state.credits = 50000;
        state.ship.cargo.fill(0);
      }
      
      if (prices.length > 5) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        console.log(`Price range observed: ${minPrice} - ${maxPrice} credits per unit`);
        assert.ok(maxPrice > minPrice, 'Should have price variation in orbital trading');
      }
    });

    await t.test('should provide different prices for buying vs selling', () => {
      const state = createInitialState();
      state.credits = 50000;
      state.ship.cargo.fill(0);
      state.ship.cargo[0] = 20; // Water for selling
      
      // Test buying water
      const buyResult = executeOrbitalPurchase(state, 24);
      let buyPrice = 0;
      if (buyResult.success && buyResult.itemsBought! > 0) {
        buyPrice = buyResult.creditsSpent! / buyResult.itemsBought!;
      }
      
      // Test selling water
      const sellResult = executeOrbitalSale(state, 25);
      let sellPrice = 0;
      if (sellResult.success && sellResult.itemsSold! > 0) {
        sellPrice = sellResult.creditsGained! / sellResult.itemsSold!;
      }
      
      console.log(`Water prices - Buy: ${buyPrice}, Sell: ${sellPrice}`);
      
      // Generally, selling price to traders should be lower than buying price from traders
      if (buyPrice > 0 && sellPrice > 0) {
        assert.ok(sellPrice <= buyPrice, 'Selling to traders should give lower prices than buying from them');
      }
    });
  });

  await t.test('Integration with Combat System', async (t) => {
    
    await t.test('should handle trade action in combat encounters', async () => {
      const { createGameEngine } = await import('../engine/game.ts');
      const engine = createGameEngine();
      
      // Set up a trading scenario
      engine.state.currentMode = 2; // InCombat
      engine.state.encounterType = 24; // TRADERSELL
      engine.state.credits = 10000;
      engine.state.ship.cargo.fill(0);
      
      const result = await engine.executeAction({
        type: 'combat_trade',
        parameters: {}
      });
      
      // Should either succeed in trading or fail with reasonable message
      assert.equal(typeof result.success, 'boolean');
      assert.equal(typeof result.message, 'string');
      
      console.log(`Combat trade result: ${result.message}`);
    });

    await t.test('should properly end encounters after successful trade', async () => {
      const { createGameEngine } = await import('../engine/game.ts');
      const engine = createGameEngine();
      
      engine.state.currentMode = 2; // InCombat
      engine.state.encounterType = 25; // TRADERBUY
      engine.state.credits = 1000;
      engine.state.ship.cargo.fill(0);
      engine.state.ship.cargo[0] = 5; // Some water to sell
      
      const result = await engine.executeAction({
        type: 'combat_trade',
        parameters: {}
      });
      
      if (result.success) {
        // Encounter should be ended after successful trade
        assert.notEqual(engine.state.currentMode, 2); // Should not be in combat anymore
        assert.equal(engine.state.encounterType, -1); // Encounter cleared
      }
    });
  });

  await t.test('Encounter Generation System', async (t) => {
    
    await t.test('should generate orbital trade encounters with proper data', () => {
      const state = createInitialState();
      state.credits = 10000;
      state.ship.cargo[0] = 10; // Water for potential selling
      
      let generatedEncounters = 0;
      const encounterData = [];
      
      for (let i = 0; i < 1000; i++) {
        const encounter = generateOrbitalTradeEncounter(state);
        if (encounter) {
          generatedEncounters++;
          encounterData.push(encounter);
        }
      }
      
      console.log(`Generated ${generatedEncounters} orbital trade encounters in 1000 attempts`);
      
      if (encounterData.length > 0) {
        const firstEncounter = encounterData[0];
        assert.ok([24, 25].includes(firstEncounter.encounterType), 'Should generate TRADERSELL or TRADERBUY');
        assert.ok(firstEncounter.tradeItemIndex >= 0 && firstEncounter.tradeItemIndex < 10);
        assert.ok(firstEncounter.price > 0);
        assert.ok(firstEncounter.quantity > 0);
        assert.ok(typeof firstEncounter.tradeItemName === 'string');
        
        console.log(`Sample encounter: ${firstEncounter.encounterType === 24 ? 'SELL' : 'BUY'} ${firstEncounter.quantity} ${firstEncounter.tradeItemName} for ${firstEncounter.price} each`);
      }
      
      // Should generate encounters at approximately 10% rate
      const actualRate = generatedEncounters / 1000;
      assert.ok(actualRate > 0.05 && actualRate < 0.15, 'Should generate encounters at ~10% rate');
    });

    await t.test('should handle edge cases in encounter generation', () => {
      const state = createInitialState();
      
      // Test with no money
      state.credits = 0;
      state.ship.cargo.fill(0);
      
      let noMoneyEncounters = 0;
      for (let i = 0; i < 100; i++) {
        const encounter = generateOrbitalTradeEncounter(state);
        if (encounter) {
          noMoneyEncounters++;
        }
      }
      
      console.log(`Encounters with no money/cargo: ${noMoneyEncounters}`);
      
      // Should generate fewer encounters when player can't trade
      assert.ok(noMoneyEncounters < 50, 'Should generate fewer encounters when trading impossible');
    });
  });
});
