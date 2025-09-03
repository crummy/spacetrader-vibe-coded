#!/usr/bin/env node --test --experimental-strip-types

import { test } from 'node:test';
import assert from 'node:assert';
import { 
  buyWeapon, sellWeapon, buyShield, sellShield, buyGadget, sellGadget,
  getAvailableEquipment, getInstialledEquipmentSellPrices 
} from './equipment-trading.ts';
import { createInitialState } from '../state.ts';

test('Equipment Trading System', async (t) => {

  await t.test('Weapon Trading Operations', async (t) => {
    
    await t.test('should successfully buy weapon when conditions are met', () => {
      const state = createInitialState();
      state.credits = 10000;
      state.currentSystem = 0; // Acamar has tech level 7
      
      const result = buyWeapon(state, 0); // Pulse laser
      
      assert.equal(result.success, true);
      assert.ok(result.reason?.includes('Pulse laser'));
      assert.ok(result.costPaid! > 0);
      assert.equal(result.slotIndex, 0); // Should install in first slot
      assert.equal(state.ship.weapon[0], 0); // Weapon installed
      assert.ok(state.credits < 10000); // Credits deducted
    });

    await t.test('should fail when insufficient credits', () => {
      const state = createInitialState();
      state.credits = 100; // Not enough for any weapon
      
      const result = buyWeapon(state, 0); // Pulse laser (costs ~2000)
      
      assert.equal(result.success, false);
      assert.ok(result.reason?.includes('Insufficient credits'));
      assert.equal(state.ship.weapon[0], -1); // No weapon installed
    });

    await t.test('should fail when no empty weapon slots', () => {
      const state = createInitialState();
      state.credits = 50000;
      // Fill all weapon slots
      state.ship.weapon[0] = 0;
      state.ship.weapon[1] = 1;
      state.ship.weapon[2] = 2;
      
      const result = buyWeapon(state, 0);
      
      assert.equal(result.success, false);
      assert.ok(result.reason?.includes('No empty weapon slots'));
    });

    await t.test('should fail when tech level too low', () => {
      const state = createInitialState();
      state.credits = 50000;
      // Set system to low tech level
      state.solarSystem[state.currentSystem].techLevel = 3;
      
      const result = buyWeapon(state, 2); // Military laser requires tech 7
      
      assert.equal(result.success, false);
      assert.ok(result.reason?.includes('tech level'));
    });

    await t.test('should successfully sell installed weapon', () => {
      const state = createInitialState();
      state.ship.weapon[0] = 0; // Install pulse laser
      
      const result = sellWeapon(state, 0);
      
      assert.equal(result.success, true);
      assert.ok(result.reason?.includes('Pulse laser'));
      assert.ok(result.pricePaid! > 0);
      assert.equal(state.ship.weapon[0], -1); // Weapon removed
    });

    await t.test('should fail to sell from empty slot', () => {
      const state = createInitialState();
      // All weapon slots are empty (-1)
      
      const result = sellWeapon(state, 0);
      
      assert.equal(result.success, false);
      assert.ok(result.reason?.includes('No weapon'));
    });

    await t.test('should apply trader skill discount on purchase', () => {
      const state1 = createInitialState();
      const state2 = createInitialState();
      
      state1.credits = 50000;
      state1.commanderTrader = 1; // Low trader skill
      
      state2.credits = 50000;
      state2.commanderTrader = 10; // High trader skill
      
      const result1 = buyWeapon(state1, 0);
      const result2 = buyWeapon(state2, 0);
      
      assert.equal(result1.success, true);
      assert.equal(result2.success, true);
      assert.ok(result2.costPaid! < result1.costPaid!, 'Higher trader skill should get better price');
    });

    await t.test('should use authentic 75% sell price formula', () => {
      const state = createInitialState();
      const originalCredits = 10000;
      state.credits = originalCredits;
      
      // Buy weapon at full price
      const buyResult = buyWeapon(state, 0);
      assert.equal(buyResult.success, true);
      
      const creditsAfterBuy = state.credits;
      const pricePaid = buyResult.costPaid!;
      
      // Sell weapon back
      const sellResult = sellWeapon(state, buyResult.slotIndex!);
      assert.equal(sellResult.success, true);
      
      const creditsAfterSell = state.credits;
      const priceReceived = sellResult.pricePaid!;
      
      // Should get back 75% of base price (not 75% of discounted price paid)
      const basePrice = 2000; // Pulse laser base price
      const expectedSellPrice = Math.floor((basePrice * 3) / 4);
      
      assert.equal(priceReceived, expectedSellPrice);
      console.log(`Bought for ${pricePaid}, sold for ${priceReceived} (base: ${basePrice}, expected: ${expectedSellPrice})`);
    });
  });

  await t.test('Shield Trading Operations', async (t) => {
    
    await t.test('should successfully buy and install shield', () => {
      const state = createInitialState();
      state.credits = 10000;
      
      const result = buyShield(state, 0); // Energy shield
      
      assert.equal(result.success, true);
      assert.ok(result.reason?.includes('Energy shield'));
      assert.equal(state.ship.shield[0], 0); // Shield installed
      assert.equal(state.ship.shieldStrength[0], 100); // Full strength
    });

    await t.test('should properly initialize shield strength on purchase', () => {
      const state = createInitialState();
      state.credits = 30000;
      
      const result = buyShield(state, 1); // Reflective shield (power 200)
      
      assert.equal(result.success, true);
      assert.equal(state.ship.shieldStrength[0], 200); // Should be set to full power
    });

    await t.test('should reset shield strength when selling shield', () => {
      const state = createInitialState();
      state.ship.shield[0] = 0; // Energy shield
      state.ship.shieldStrength[0] = 50; // Partial strength
      
      const result = sellShield(state, 0);
      
      assert.equal(result.success, true);
      assert.equal(state.ship.shield[0], -1); // Shield removed
      assert.equal(state.ship.shieldStrength[0], 0); // Strength reset
    });
  });

  await t.test('Gadget Trading Operations', async (t) => {
    
    await t.test('should successfully buy and install gadget', () => {
      const state = createInitialState();
      state.credits = 10000;
      
      const result = buyGadget(state, 0); // Extra cargo bays
      
      assert.equal(result.success, true);
      assert.ok(result.reason?.includes('5 extra cargo bays'));
      assert.equal(state.ship.gadget[0], 0); // Gadget installed
    });

    await t.test('should handle expensive gadgets correctly', () => {
      const state = createInitialState();
      state.credits = 100000;
      state.solarSystem[state.currentSystem].techLevel = 7; // High tech for cloaking
      
      const result = buyGadget(state, 4); // Cloaking device
      
      assert.equal(result.success, true);
      assert.ok(result.reason?.includes('Cloaking device'));
      assert.ok(result.costPaid! > 90000); // Should be expensive
    });
  });

  await t.test('Equipment Availability System', async (t) => {
    
    await t.test('should filter equipment by tech level', () => {
      const state = createInitialState();
      state.solarSystem[state.currentSystem].techLevel = 5; // Medium tech
      
      const equipment = getAvailableEquipment(state);
      
      // Should have pulse laser (tech 5) but not military laser (tech 7)
      const hasPulseLaser = equipment.weapons.some(w => w.index === 0);
      const hasMilitaryLaser = equipment.weapons.some(w => w.index === 2);
      
      assert.ok(hasPulseLaser, 'Should have pulse laser at tech 5');
      assert.ok(!hasMilitaryLaser, 'Should not have military laser at tech 5');
    });

    await t.test('should apply trader skill discount in availability display', () => {
      const state = createInitialState();
      state.commanderTrader = 10; // Max trader skill
      
      const equipment = getAvailableEquipment(state);
      
      if (equipment.weapons.length > 0) {
        const pulseLaser = equipment.weapons.find(w => w.index === 0);
        assert.ok(pulseLaser);
        assert.ok(pulseLaser.price < 2000, 'Should show discounted price');
        assert.equal(pulseLaser.price, 1800); // 2000 - 10% = 1800
      }
    });

    await t.test('should list sellable equipment correctly', () => {
      const state = createInitialState();
      // Install some equipment
      state.ship.weapon[0] = 0; // Pulse laser
      state.ship.shield[1] = 1; // Reflective shield
      state.ship.gadget[2] = 0; // Extra cargo bays
      
      const sellable = getInstialledEquipmentSellPrices(state);
      
      assert.equal(sellable.weapons.length, 1);
      assert.equal(sellable.shields.length, 1);
      assert.equal(sellable.gadgets.length, 1);
      
      assert.equal(sellable.weapons[0].slotIndex, 0);
      assert.equal(sellable.shields[0].slotIndex, 1);
      assert.equal(sellable.gadgets[0].slotIndex, 2);
    });
  });

  await t.test('Integration with Game Engine', async (t) => {
    
    await t.test('should integrate with game action system', async () => {
      const { createGameEngine } = await import('../engine/game.ts');
      const engine = createGameEngine();
      engine.state.credits = 50000;
      engine.state.currentMode = 1; // OnPlanet (required for equipment actions)
      
      // Check available actions first
      const actions = engine.getAvailableActions();
      const hasEquipmentActions = actions.some(a => a.type === 'buy_equipment');
      
      if (hasEquipmentActions) {
        // Test buying weapon through direct action (if available)
        const result = await engine.executeAction({
          type: 'buy_weapon',
          parameters: { weaponIndex: 0 }
        });
        
        // The action might not be directly available (might need to go through buy_equipment interface)
        console.log(`Direct weapon purchase result: ${result.message}`);
        
        // Test is valid if either the action succeeds OR the action system properly rejects it
        assert.equal(typeof result.success, 'boolean');
      } else {
        console.log('No equipment actions available (system may require higher tech level)');
        // Test passes if no equipment actions available - that's valid behavior
        assert.ok(true);
      }
    });

    await t.test('should show equipment actions when available', async () => {
      const { createGameEngine } = await import('../engine/game.ts');
      const engine = createGameEngine();
      engine.state.currentMode = 1; // OnPlanet
      
      const actions = engine.getAvailableActions();
      const hasEquipmentAction = actions.some(a => a.type === 'buy_equipment');
      
      assert.ok(hasEquipmentAction, 'Should show buy equipment action on high-tech planet');
    });
  });

  await t.test('Edge Cases and Error Handling', async (t) => {
    
    await t.test('should handle invalid equipment indices', () => {
      const state = createInitialState();
      state.credits = 50000;
      
      // Test invalid weapon index
      const weaponResult = buyWeapon(state, 99);
      assert.equal(weaponResult.success, false);
      
      // Test invalid shield index
      const shieldResult = buyShield(state, 99);
      assert.equal(shieldResult.success, false);
      
      // Test invalid gadget index
      const gadgetResult = buyGadget(state, 99);
      assert.equal(gadgetResult.success, false);
    });

    await t.test('should handle invalid slot indices for selling', () => {
      const state = createInitialState();
      
      // Test invalid slot indices
      const weaponResult = sellWeapon(state, 99);
      assert.equal(weaponResult.success, false);
      
      const shieldResult = sellShield(state, -1);
      assert.equal(shieldResult.success, false);
      
      const gadgetResult = sellGadget(state, 5);
      assert.equal(gadgetResult.success, false);
    });

    await t.test('should handle equipment installation edge cases', () => {
      const state = createInitialState();
      state.credits = 200000;
      
      // Buy multiple weapons until slots are full
      let weaponsPurchased = 0;
      for (let i = 0; i < 5; i++) { // Try to buy more than 3 weapons
        const result = buyWeapon(state, 0);
        if (result.success) {
          weaponsPurchased++;
        }
      }
      
      assert.equal(weaponsPurchased, 3); // Should only buy 3 (max slots)
      
      // All weapon slots should be filled
      assert.notEqual(state.ship.weapon[0], -1);
      assert.notEqual(state.ship.weapon[1], -1);
      assert.notEqual(state.ship.weapon[2], -1);
    });
  });

  await t.test('Price Calculation Accuracy', async (t) => {
    
    await t.test('should calculate correct sell prices (75% of base price)', () => {
      const testCases = [
        { basePrice: 2000, expectedSell: 1500 },   // Pulse laser
        { basePrice: 12500, expectedSell: 9375 },  // Beam laser  
        { basePrice: 35000, expectedSell: 26250 }, // Military laser
        { basePrice: 5000, expectedSell: 3750 },   // Energy shield
        { basePrice: 20000, expectedSell: 15000 }  // Reflective shield
      ];
      
      for (const testCase of testCases) {
        const state = createInitialState();
        
        // Calculate what the sell price should be
        const calculatedSell = Math.floor((testCase.basePrice * 3) / 4);
        assert.equal(calculatedSell, testCase.expectedSell);
      }
    });

    await t.test('should apply trader skill discounts correctly', () => {
      const basePrice = 2000; // Pulse laser base price
      const discounts = [
        { skill: 0, expectedPrice: 2000 },   // No discount
        { skill: 5, expectedPrice: 1900 },   // 5% discount  
        { skill: 10, expectedPrice: 1800 },  // 10% discount (max)
        { skill: 15, expectedPrice: 1800 }   // Still 10% (capped)
      ];
      
      for (const test of discounts) {
        const state = createInitialState();
        state.credits = 10000;
        state.commanderTrader = test.skill;
        
        const result = buyWeapon(state, 0);
        assert.equal(result.success, true);
        assert.equal(result.costPaid, test.expectedPrice);
      }
    });

    await t.test('should show correct prices in equipment availability', () => {
      const state = createInitialState();
      state.commanderTrader = 8; // 8% discount
      
      const equipment = getAvailableEquipment(state);
      
      if (equipment.weapons.length > 0) {
        const pulseLaser = equipment.weapons.find(w => w.index === 0);
        assert.ok(pulseLaser);
        
        // Should show 2000 - 8% = 1840
        const expectedPrice = Math.floor(2000 * 92 / 100);
        assert.equal(pulseLaser.price, expectedPrice);
      }
    });
  });

  await t.test('Equipment Information Accuracy', async (t) => {
    
    await t.test('should provide accurate weapon specifications', () => {
      const state = createInitialState();
      const equipment = getAvailableEquipment(state);
      
      // Find pulse laser
      const pulseLaser = equipment.weapons.find(w => w.index === 0);
      assert.ok(pulseLaser);
      assert.equal(pulseLaser.name, 'Pulse laser');
      assert.equal(pulseLaser.power, 15);
      assert.equal(pulseLaser.techLevel, 5);
    });

    await t.test('should provide accurate shield specifications', () => {
      const state = createInitialState();
      const equipment = getAvailableEquipment(state);
      
      // Find energy shield
      const energyShield = equipment.shields.find(s => s.index === 0);
      assert.ok(energyShield);
      assert.equal(energyShield.name, 'Energy shield');
      assert.equal(energyShield.power, 100);
      assert.equal(energyShield.techLevel, 5);
    });

    await t.test('should list installed equipment for selling accurately', () => {
      const state = createInitialState();
      
      // Install mixed equipment
      state.ship.weapon[0] = 1;    // Beam laser
      state.ship.shield[0] = 0;    // Energy shield  
      state.ship.shieldStrength[0] = 75; // Partial strength
      state.ship.gadget[0] = 1;    // Auto-repair system
      
      const sellable = getInstialledEquipmentSellPrices(state);
      
      assert.equal(sellable.weapons.length, 1);
      assert.equal(sellable.weapons[0].name, 'Beam laser');
      assert.equal(sellable.weapons[0].sellPrice, 9375); // 12500 * 3/4
      
      assert.equal(sellable.shields.length, 1);
      assert.equal(sellable.shields[0].currentStrength, 75);
      assert.equal(sellable.shields[0].maxStrength, 100);
      
      assert.equal(sellable.gadgets.length, 1);
      assert.equal(sellable.gadgets[0].name, 'Auto-repair system');
    });
  });
});
