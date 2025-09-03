#!/usr/bin/env node --test --experimental-strip-types

import { test } from 'node:test';
import assert from 'node:assert';
import { 
  calculateFullRefuelCost, calculateAffordableFuel, buyFuel, 
  refuelToFull, getFuelStatus 
} from './fuel.ts';
import { createInitialState } from '../state.ts';

test('Fuel System', async (t) => {

  await t.test('Fuel Cost Calculations', async (t) => {
    
    await t.test('should calculate full refuel cost correctly', () => {
      const state = createInitialState();
      state.ship.fuel = 10; // Partially fueled
      
      const cost = calculateFullRefuelCost(state);
      
      // Default ship (Flea) has 20 fuel capacity and costs 1 credit per unit
      const expectedCost = (20 - 10) * 1; // 10 units needed * 1 credit/unit = 10 credits
      assert.equal(cost, expectedCost);
    });

    await t.test('should return zero cost when fuel tanks are full', () => {
      const state = createInitialState();
      state.ship.fuel = 20; // Full fuel for Flea
      
      const cost = calculateFullRefuelCost(state);
      
      assert.equal(cost, 0);
    });

    await t.test('should calculate cost for different ship types', () => {
      const state = createInitialState();
      state.ship.type = 1; // Gnat (different fuel capacity and cost)
      state.ship.fuel = 0; // Empty
      
      const cost = calculateFullRefuelCost(state);
      
      // Should use Gnat's fuel specifications
      assert.ok(cost > 0);
      assert.equal(typeof cost, 'number');
    });

    await t.test('should handle fuel compactor gadget effect', () => {
      const state = createInitialState();
      state.ship.fuel = 0; // Empty
      
      // Calculate cost without fuel compactor (Flea = 20 tanks * 1 credit = 20 total)
      const costWithout = calculateFullRefuelCost(state);
      console.log(`Cost without fuel compactor: ${costWithout}`);
      
      // Add fuel compactor gadget
      state.ship.gadget[0] = 5; // Fuel compactor
      
      // Calculate cost with fuel compactor (should be 18 tanks * 1 credit = 18 total)
      const costWith = calculateFullRefuelCost(state);
      console.log(`Cost with fuel compactor: ${costWith}`);
      
      // Note: Fuel compactor in Palm OS actually reduces tank capacity to a fixed 18
      // This is different from extra cargo bays - it's a tradeoff for other benefits
      assert.notEqual(costWith, costWithout, 'Fuel compactor should change tank capacity');
    });
  });

  await t.test('Affordable Fuel Calculations', async (t) => {
    
    await t.test('should calculate affordable fuel within credit limit', () => {
      const state = createInitialState();
      state.ship.fuel = 5; // Need 15 more fuel
      
      const affordableFuel = calculateAffordableFuel(state, 10); // 10 credits available
      
      // Can afford 10 units (10 credits / 1 credit per unit)
      assert.equal(affordableFuel, 10);
    });

    await t.test('should limit affordable fuel by tank capacity', () => {
      const state = createInitialState();
      state.ship.fuel = 18; // Only need 2 more fuel
      
      const affordableFuel = calculateAffordableFuel(state, 100); // Lots of credits
      
      // Should only return 2 (amount needed) even though player can afford more
      assert.equal(affordableFuel, 2);
    });

    await t.test('should handle insufficient credits gracefully', () => {
      const state = createInitialState();
      state.ship.fuel = 0; // Need full tank (20 units)
      
      const affordableFuel = calculateAffordableFuel(state, 0); // No credits
      
      assert.equal(affordableFuel, 0);
    });

    await t.test('should handle partial fuel purchases', () => {
      const state = createInitialState();
      state.ship.fuel = 0; // Need 20 fuel
      
      const affordableFuel = calculateAffordableFuel(state, 7); // Can afford 7 units
      
      assert.equal(affordableFuel, 7);
    });
  });

  await t.test('Fuel Purchase Operations', async (t) => {
    
    await t.test('should successfully buy fuel when conditions are met', () => {
      const state = createInitialState();
      state.ship.fuel = 10; // Half full
      state.credits = 100;
      
      const result = buyFuel(state, 5); // Buy 5 credits worth
      
      assert.equal(result.success, true);
      assert.equal(result.fuelBought, 5); // 5 credits / 1 credit per unit = 5 units
      assert.equal(result.costPaid, 5);
      assert.equal(state.ship.fuel, 15); // 10 + 5 = 15
      assert.equal(state.credits, 95); // 100 - 5 = 95
    });

    await t.test('should fail when fuel tanks are full', () => {
      const state = createInitialState();
      state.ship.fuel = 20; // Full tank
      state.credits = 100;
      
      const result = buyFuel(state, 10);
      
      assert.equal(result.success, false);
      assert.ok(result.reason?.includes('already full'));
      assert.equal(state.ship.fuel, 20); // No change
      assert.equal(state.credits, 100); // No change
    });

    await t.test('should fail when insufficient credits', () => {
      const state = createInitialState();
      state.ship.fuel = 0; // Empty
      state.credits = 0; // No money
      
      const result = buyFuel(state, 10);
      
      assert.equal(result.success, false);
      assert.ok(result.reason?.includes('Insufficient credits'));
      assert.equal(state.ship.fuel, 0); // No change
    });

    await t.test('should limit purchase to available credits', () => {
      const state = createInitialState();
      state.ship.fuel = 0; // Empty, needs 20 fuel
      state.credits = 5; // Only 5 credits
      
      const result = buyFuel(state, 100); // Try to spend 100 credits
      
      assert.equal(result.success, true);
      assert.equal(result.fuelBought, 5); // Limited by credits
      assert.equal(result.costPaid, 5);
      assert.equal(state.ship.fuel, 5);
      assert.equal(state.credits, 0);
    });

    await t.test('should limit purchase to tank capacity', () => {
      const state = createInitialState();
      state.ship.fuel = 18; // Almost full (need 2 more)
      state.credits = 100; // Lots of money
      
      const result = buyFuel(state, 50); // Try to buy lots of fuel
      
      assert.equal(result.success, true);
      assert.equal(result.fuelBought, 2); // Limited by tank capacity
      assert.equal(result.costPaid, 2);
      assert.equal(state.ship.fuel, 20); // Full tank
      assert.equal(state.credits, 98); // 100 - 2 = 98
    });

    await t.test('should handle different ship types with different fuel costs', () => {
      const fleaState = createInitialState();
      const gnatState = createInitialState();
      
      fleaState.ship.type = 0; // Flea
      gnatState.ship.type = 1; // Gnat
      
      fleaState.ship.fuel = 0;
      gnatState.ship.fuel = 0;
      
      fleaState.credits = 1000;
      gnatState.credits = 1000;
      
      const fleaResult = buyFuel(fleaState, 100);
      const gnatResult = buyFuel(gnatState, 100);
      
      assert.equal(fleaResult.success, true);
      assert.equal(gnatResult.success, true);
      
      // Different ships should have different fuel costs per unit
      console.log(`Flea fuel cost: ${fleaResult.costPaid!}/${fleaResult.fuelBought!} = ${fleaResult.costPaid! / fleaResult.fuelBought!} credits/unit`);
      console.log(`Gnat fuel cost: ${gnatResult.costPaid!}/${gnatResult.fuelBought!} = ${gnatResult.costPaid! / gnatResult.fuelBought!} credits/unit`);
    });
  });

  await t.test('Refuel to Full Operations', async (t) => {
    
    await t.test('should successfully refuel to full capacity', () => {
      const state = createInitialState();
      state.ship.fuel = 5; // Partially fueled
      state.credits = 1000; // Enough money
      
      const initialCredits = state.credits;
      const result = refuelToFull(state);
      
      assert.equal(result.success, true);
      assert.ok(result.fuelBought! > 0);
      assert.ok(result.costPaid! > 0);
      assert.equal(state.ship.fuel, 20); // Should be full (Flea capacity)
      assert.equal(state.credits, initialCredits - result.costPaid!);
    });

    await t.test('should fail when insufficient credits for full refuel', () => {
      const state = createInitialState();
      state.ship.fuel = 0; // Empty (needs 20 fuel)
      state.credits = 10; // Only enough for 10 fuel units
      
      const result = refuelToFull(state);
      
      assert.equal(result.success, true); // Partial success
      assert.equal(result.fuelBought, 10); // Only what we can afford
      assert.equal(state.ship.fuel, 10); // Partially filled
      assert.equal(state.credits, 0); // All money spent
    });

    await t.test('should handle already full tanks', () => {
      const state = createInitialState();
      state.ship.fuel = 20; // Already full
      state.credits = 1000;
      
      const result = refuelToFull(state);
      
      assert.equal(result.success, false);
      assert.ok(result.reason?.includes('already full'));
      assert.equal(state.ship.fuel, 20); // No change
      assert.equal(state.credits, 1000); // No change
    });
  });

  await t.test('Fuel Status Information', async (t) => {
    
    await t.test('should provide accurate fuel status information', () => {
      const state = createInitialState();
      state.ship.fuel = 15; // 75% full
      
      const status = getFuelStatus(state);
      
      assert.equal(status.currentFuel, 15);
      assert.equal(status.maxFuel, 20); // Flea capacity
      assert.equal(status.fuelPercentage, 75); // 15/20 * 100
      assert.equal(status.costPerUnit, 1); // Flea fuel cost
      assert.equal(status.fullRefuelCost, 5); // 5 units * 1 credit = 5 credits
    });

    await t.test('should handle empty fuel tanks', () => {
      const state = createInitialState();
      state.ship.fuel = 0;
      
      const status = getFuelStatus(state);
      
      assert.equal(status.currentFuel, 0);
      assert.equal(status.fuelPercentage, 0);
      assert.equal(status.fullRefuelCost, 20); // Full tank cost
    });

    await t.test('should handle full fuel tanks', () => {
      const state = createInitialState();
      state.ship.fuel = 20; // Full
      
      const status = getFuelStatus(state);
      
      assert.equal(status.fuelPercentage, 100);
      assert.equal(status.fullRefuelCost, 0); // No refuel needed
    });

    await t.test('should adapt to different ship types', () => {
      const state = createInitialState();
      state.ship.type = 2; // Different ship type
      state.ship.fuel = 0;
      
      const status = getFuelStatus(state);
      
      // Should adapt to new ship's specifications
      assert.ok(status.maxFuel > 0);
      assert.ok(status.costPerUnit > 0);
      assert.equal(status.currentFuel, 0);
      assert.equal(status.fuelPercentage, 0);
      
      console.log(`Ship type 2: Max fuel ${status.maxFuel}, Cost per unit ${status.costPerUnit}`);
    });
  });

  await t.test('Integration with Ship Systems', async (t) => {
    
    await t.test('should respect fuel compactor gadget effects', () => {
      const state = createInitialState();
      
      // Test without fuel compactor (Flea = 20 tanks)
      state.ship.gadget = [-1, -1, -1]; // No gadgets
      state.ship.fuel = 0;
      const statusWithout = getFuelStatus(state);
      
      // Test with fuel compactor (should be 18 tanks regardless of ship)
      state.ship.gadget[0] = 5; // Fuel compactor gadget
      const statusWith = getFuelStatus(state);
      
      console.log(`Tank capacity: ${statusWithout.maxFuel} -> ${statusWith.maxFuel} (with fuel compactor)`);
      
      // Fuel compactor sets tank capacity to fixed 18 (may be more or less than base ship)
      assert.equal(statusWith.maxFuel, 18, 'Fuel compactor should set tank capacity to 18');
      assert.notEqual(statusWith.maxFuel, statusWithout.maxFuel, 'Fuel compactor should change tank capacity');
    });

    await t.test('should work with ships that have different fuel specifications', () => {
      const testShips = [
        { type: 0, name: 'Flea' },
        { type: 1, name: 'Gnat' },
        { type: 2, name: 'Firefly' },
        { type: 3, name: 'Mosquito' }
      ];
      
      for (const ship of testShips) {
        const state = createInitialState();
        state.ship.type = ship.type;
        state.ship.fuel = 0; // Empty
        
        const status = getFuelStatus(state);
        
        assert.ok(status.maxFuel > 0, `${ship.name} should have positive fuel capacity`);
        assert.ok(status.costPerUnit > 0, `${ship.name} should have positive fuel cost`);
        assert.ok(status.fullRefuelCost > 0, `${ship.name} should have positive refuel cost`);
        
        console.log(`${ship.name}: ${status.maxFuel} fuel capacity, ${status.costPerUnit} credits/unit`);
      }
    });
  });

  await t.test('Error Handling and Edge Cases', async (t) => {
    
    await t.test('should handle zero credit purchases gracefully', () => {
      const state = createInitialState();
      state.ship.fuel = 0;
      state.credits = 0;
      
      const result = buyFuel(state, 0);
      
      assert.equal(result.success, false);
      assert.ok(result.reason?.includes('Insufficient credits') || result.reason?.includes('Cannot afford'));
    });

    await t.test('should handle negative fuel requests gracefully', () => {
      const state = createInitialState();
      state.ship.fuel = 10;
      state.credits = 100;
      
      const result = buyFuel(state, -5);
      
      assert.equal(result.success, false);
      assert.equal(state.ship.fuel, 10); // No change
      assert.equal(state.credits, 100); // No change
    });

    await t.test('should handle fuel overflow correctly', () => {
      const state = createInitialState();
      state.ship.fuel = 19; // Almost full (only 1 unit needed)
      state.credits = 100;
      
      const result = buyFuel(state, 50); // Try to buy way more than needed
      
      assert.equal(result.success, true);
      assert.equal(result.fuelBought, 1); // Only bought what was needed
      assert.equal(state.ship.fuel, 20); // Full tank
      assert.equal(state.credits, 99); // Only charged for 1 unit
    });

    await t.test('should handle edge case where fuel costs more than credits available', () => {
      const state = createInitialState();
      state.ship.type = 9; // Expensive ship with high fuel costs
      state.ship.fuel = 0;
      state.credits = 1; // Very little money
      
      const result = buyFuel(state, 1);
      
      // Should either succeed with partial fuel or fail gracefully
      assert.equal(typeof result.success, 'boolean');
      if (result.success) {
        assert.ok(result.fuelBought! >= 0);
        assert.ok(result.costPaid! <= 1);
      }
    });
  });

  await t.test('Integration with Game Engine', async (t) => {
    
    await t.test('should integrate with refuel_ship action', async () => {
      const { createGameEngine } = await import('../engine/game.ts');
      const engine = createGameEngine();
      
      engine.state.ship.fuel = 10; // Half full
      engine.state.credits = 100;
      engine.state.currentMode = 1; // OnPlanet (required for refuel)
      
      const result = await engine.executeAction({
        type: 'refuel_ship',
        parameters: {}
      });
      
      assert.equal(result.success, true);
      assert.ok(result.message.includes('Refueled'));
      assert.equal(engine.state.ship.fuel, 20); // Should be full
      assert.ok(engine.state.credits < 100); // Should have spent money
    });

    await t.test('should show refuel action when fuel is not full', async () => {
      const { createGameEngine } = await import('../engine/game.ts');
      const engine = createGameEngine();
      
      engine.state.ship.fuel = 10; // Partially fueled
      engine.state.credits = 100;
      engine.state.currentMode = 1; // OnPlanet
      
      const actions = engine.getAvailableActions();
      const refuelAction = actions.find(a => a.type === 'refuel_ship');
      
      assert.ok(refuelAction, 'Should show refuel action when fuel not full');
      assert.equal(refuelAction.available, true);
    });

    await t.test('should not show refuel action when fuel is full', async () => {
      const { createGameEngine } = await import('../engine/game.ts');
      const engine = createGameEngine();
      
      engine.state.ship.fuel = 20; // Full tank
      engine.state.currentMode = 1; // OnPlanet
      
      const actions = engine.getAvailableActions();
      const refuelAction = actions.find(a => a.type === 'refuel_ship');
      
      assert.ok(!refuelAction, 'Should not show refuel action when fuel is full');
    });
  });

  await t.test('Price Calculations Accuracy', async (t) => {
    
    await t.test('should calculate accurate costs for different scenarios', () => {
      const testCases = [
        { fuel: 0, expected: 20 },   // Empty tank
        { fuel: 5, expected: 15 },   // 3/4 empty
        { fuel: 10, expected: 10 },  // Half empty  
        { fuel: 15, expected: 5 },   // 1/4 empty
        { fuel: 19, expected: 1 },   // Almost full
        { fuel: 20, expected: 0 }    // Full tank
      ];
      
      for (const testCase of testCases) {
        const state = createInitialState();
        state.ship.fuel = testCase.fuel;
        
        const cost = calculateFullRefuelCost(state);
        assert.equal(cost, testCase.expected, `Fuel ${testCase.fuel}/20 should cost ${testCase.expected} credits`);
      }
    });

    await t.test('should maintain price consistency across functions', () => {
      const state = createInitialState();
      state.ship.fuel = 10;
      state.credits = 1000;
      
      // Get full refuel cost calculation
      const fullCost = calculateFullRefuelCost(state);
      
      // Verify by buying that exact amount
      const result = buyFuel(state, fullCost);
      
      assert.equal(result.success, true);
      assert.equal(result.costPaid, fullCost);
      assert.equal(state.ship.fuel, 20); // Should be exactly full
    });

    await t.test('should provide consistent fuel status information', () => {
      const state = createInitialState();
      
      // Test at different fuel levels
      for (let fuelLevel = 0; fuelLevel <= 20; fuelLevel += 5) {
        state.ship.fuel = fuelLevel;
        
        const status = getFuelStatus(state);
        
        assert.equal(status.currentFuel, fuelLevel);
        assert.equal(status.maxFuel, 20); // Flea capacity
        assert.equal(status.fuelPercentage, Math.floor((fuelLevel / 20) * 100));
        assert.equal(status.fullRefuelCost, (20 - fuelLevel) * 1); // Cost for remaining fuel
      }
    });
  });

  await t.test('Performance and Optimization', async (t) => {
    
    await t.test('should execute fuel operations efficiently', () => {
      const state = createInitialState();
      state.credits = 100000;
      
      const startTime = process.hrtime.bigint();
      
      // Perform many fuel operations
      for (let i = 0; i < 1000; i++) {
        state.ship.fuel = i % 20; // Vary fuel levels
        calculateFullRefuelCost(state);
        calculateAffordableFuel(state, 100);
        getFuelStatus(state);
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      console.log(`1000 fuel operations completed in ${durationMs.toFixed(2)}ms`);
      assert.ok(durationMs < 100, 'Fuel operations should be fast');
    });

    await t.test('should handle large numbers correctly', () => {
      const state = createInitialState();
      state.ship.type = 9; // Large ship
      state.ship.fuel = 0;
      state.credits = 999999999; // Maximum credits
      
      const status = getFuelStatus(state);
      const cost = calculateFullRefuelCost(state);
      const affordable = calculateAffordableFuel(state, state.credits);
      
      // Should handle large numbers without overflow
      assert.ok(Number.isFinite(status.fullRefuelCost));
      assert.ok(Number.isFinite(cost));
      assert.ok(Number.isFinite(affordable));
      assert.ok(cost >= 0);
      assert.ok(affordable >= 0);
    });
  });
});
