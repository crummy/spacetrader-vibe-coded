import { test } from 'node:test';
import assert from 'node:assert';
import type { State } from '../types.ts';
import { createInitialState } from '../state.ts';
import { calculateEffectiveTraderSkill } from '../economy/skill-utils.ts';
import { calculateBuyPrice, calculateSellPrice } from '../economy/trading-functions.ts';
import { completeJarekDeliveryWithCallback as completeJarekDelivery } from './quests/jarek.ts';
import { getCrewStatusDisplay } from '../ui/crew-status-display.ts';

/**
 * Tests to enforce Palm OS Jarek skill bonus pricing integration
 * Based on palm/Src/SpecialEvent.c lines 278-281 and RecalculateBuyPrices call
 */

test('Jarek Skill Bonus - Palm OS Compliance', async (t) => {
  await t.test('should provide +1 trader skill bonus after delivery', () => {
    const state = createInitialState();
    // Set commander skills to match test requirements  
    state.commanderPilot = 5;
    state.commanderFighter = 5;
    state.commanderTrader = 3;
    state.commanderEngineer = 5;
    state.difficulty = 2; // Normal difficulty (no skill bonus)
    
    // Before Jarek delivery
    assert.strictEqual(state.jarekStatus, 0, 'Should start with no Jarek quest');
    const baseTraderSkill = calculateEffectiveTraderSkill(state);
    assert.strictEqual(baseTraderSkill, 3, 'Base trader skill should be 3');
    
    // Complete Jarek delivery
    state.jarekStatus = 2; // Delivered
    
    // After delivery should have +1 trader skill
    const bonusTraderSkill = calculateEffectiveTraderSkill(state);
    assert.strictEqual(bonusTraderSkill, 4, 'Should have +1 trader skill after Jarek delivery');
  });

  await t.test('should apply Jarek bonus to buy price calculations', () => {
    const state = createInitialState();
    // Set commander skills to match test requirements  
    state.commanderPilot = 5;
    state.commanderFighter = 5;
    state.commanderTrader = 3;
    state.commanderEngineer = 5;
    state.difficulty = 2; // Normal difficulty (no skill bonus)
    
    // Set up system with higher base price to see trader skill difference clearly
    const testSystem = {
      name: 'Test System',
      techLevel: 7, // High tech level to ensure production capability
      government: 0,
      status: 0,
      x: 0,
      y: 0,
      specialResources: 0,
      size: 3, // Larger system size for higher base prices (4-size effect)
      visited: true
    };
    
    // Use fixed random function for consistent pricing
    const fixedRandom = () => 0.5;
    
    // Calculate buy price before Jarek bonus (using Machines - higher price item)
    const buyPriceBefore = calculateBuyPrice(7, testSystem, state, fixedRandom); // Trade good 7 (Machines)
    
    // Complete Jarek delivery
    state.jarekStatus = 2;
    
    // Calculate buy price after Jarek bonus
    const buyPriceAfter = calculateBuyPrice(7, testSystem, state, fixedRandom);
    
    // Should be lower price due to better trader skill
    assert.ok(buyPriceAfter < buyPriceBefore,
      `Buy price should decrease with Jarek bonus: ${buyPriceBefore} -> ${buyPriceAfter}`);
  });

  await t.test('should not affect sell price calculations (Palm OS behavior)', () => {
    const state = createInitialState();
    // Set commander skills to match test requirements  
    state.commanderPilot = 5;
    state.commanderFighter = 5;
    state.commanderTrader = 3;
    state.commanderEngineer = 5;
    state.difficulty = 2; // Normal difficulty (no skill bonus)
    
    const testSystem = {
      name: 'Test System', 
      techLevel: 4,
      government: 0,
      status: 0,
      x: 0,
      y: 0,
      specialResources: 0,
      size: 0,
      visited: true
    };
    
    // Use fixed random function for consistent pricing
    const fixedRandom = () => 0.5;
    
    // Calculate sell price before Jarek bonus
    const sellPriceBefore = calculateSellPrice(0, testSystem, state, fixedRandom);
    
    // Complete Jarek delivery
    state.jarekStatus = 2;
    
    // Calculate sell price after Jarek bonus
    const sellPriceAfter = calculateSellPrice(0, testSystem, state, fixedRandom);
    
    // In Palm OS, trader skill does not affect sell prices directly
    assert.strictEqual(sellPriceAfter, sellPriceBefore,
      `Sell price should not change with Jarek bonus (Palm OS behavior): ${sellPriceBefore} -> ${sellPriceAfter}`);
  });

  await t.test('should trigger RecalculateBuyPrices equivalent after delivery', () => {
    const state = createInitialState();
    // Set commander skills to match test requirements  
    state.commanderPilot = 5;
    state.commanderFighter = 5;
    state.commanderTrader = 3;
    state.commanderEngineer = 5;
    state.difficulty = 2; // Normal difficulty (no skill bonus)
    
    // Set up preconditions for Jarek delivery
    state.jarekStatus = 1; // Jarek on board
    state.currentSystem = 22; // Devidia system
    
    // Mock system to track price recalculation
    let pricesRecalculated = false;
    
    // Complete Jarek delivery - should trigger price recalculation
    const deliveryResult = completeJarekDelivery(state, () => {
      pricesRecalculated = true;
    });
    
    assert.strictEqual(deliveryResult, true, 'Jarek delivery should succeed');
    assert.strictEqual(state.jarekStatus, 2, 'Should mark Jarek as delivered');
    assert.strictEqual(pricesRecalculated, true, 
      'Should trigger price recalculation like Palm OS RecalculateBuyPrices');
  });

  await t.test('should not provide bonus before delivery', () => {
    const state = createInitialState();
    // Set commander skills to match test requirements  
    state.commanderPilot = 5;
    state.commanderFighter = 5;
    state.commanderTrader = 3;
    state.commanderEngineer = 5;
    state.difficulty = 2; // Normal difficulty (no skill bonus)
    
    // With Jarek on board but not delivered
    state.jarekStatus = 1; // On board
    
    const traderSkill = calculateEffectiveTraderSkill(state);
    assert.strictEqual(traderSkill, 3, 'Should not have bonus while Jarek is on board but not delivered');
  });

  await t.test('should persist Jarek bonus across game saves/loads', () => {
    const state = createInitialState();
    // Set commander skills to match test requirements  
    state.commanderPilot = 5;
    state.commanderFighter = 5;
    state.commanderTrader = 3;
    state.commanderEngineer = 5;
    state.difficulty = 2; // Normal difficulty (no skill bonus)
    
    // Complete Jarek delivery
    state.jarekStatus = 2;
    
    // Simulate save/load by serializing and deserializing state
    const savedState = JSON.parse(JSON.stringify(state));
    
    const traderSkillAfterLoad = calculateEffectiveTraderSkill(savedState);
    assert.strictEqual(traderSkillAfterLoad, 4, 
      'Jarek bonus should persist after save/load');
  });

  await t.test('should integrate Jarek bonus with other skill modifiers', () => {
    const state = createInitialState();
    // Set commander skills to match test requirements  
    state.commanderPilot = 5;
    state.commanderFighter = 5;
    state.commanderTrader = 3;
    state.commanderEngineer = 5;
    state.difficulty = 0; // Beginner - should add +1 to all skills
    state.jarekStatus = 2; // Jarek delivered - should add +1 to trader
    
    // Should stack: base(3) + difficulty(+1) + Jarek(+1) = 5
    const totalTraderSkill = calculateEffectiveTraderSkill(state);
    assert.strictEqual(totalTraderSkill, 5, 
      'Jarek bonus should stack with difficulty modifiers');
  });

  await t.test('should show Jarek bonus in crew status display', () => {
    const state = createInitialState();
    // Set commander skills to match test requirements  
    state.commanderPilot = 5;
    state.commanderFighter = 5;
    state.commanderTrader = 3;
    state.commanderEngineer = 5;
    state.jarekStatus = 2;
    
    const crewStatus = getCrewStatusDisplay(state);
    
    // Should indicate the trader skill bonus from Jarek
    assert.ok(crewStatus.includes('Jarek') || crewStatus.includes('bonus') || crewStatus.includes('+1'),
      'Crew status should indicate Jarek trader skill bonus');
  });

  await t.test('should only provide bonus once per game', () => {
    const state = createInitialState();
    // Set commander skills to match test requirements  
    state.commanderPilot = 5;
    state.commanderFighter = 5;
    state.commanderTrader = 3;
    state.commanderEngineer = 5;
    state.difficulty = 2; // Normal difficulty (no skill bonus)
    
    // Complete delivery
    state.jarekStatus = 2;
    let traderSkill = calculateEffectiveTraderSkill(state);
    assert.strictEqual(traderSkill, 4, 'Should have +1 after first delivery');
    
    // Simulate some other quest resetting Jarek status (edge case)
    state.jarekStatus = 0;
    state.jarekStatus = 2; // Re-deliver
    
    traderSkill = calculateEffectiveTraderSkill(state);
    assert.strictEqual(traderSkill, 4, 'Should still only have +1, not stack multiple bonuses');
  });
});

// All helper functions are now implemented in their respective modules
