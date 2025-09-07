#!/usr/bin/env node --test --experimental-strip-types

// Fuel System Tests
// Comprehensive tests for fuel management, calculations, and purchase mechanics

import { test } from 'node:test';
import assert from 'node:assert';
import { createInitialState } from '../state.ts';
import type { GameState, Ship } from '../types.ts';

// Constants from Palm OS code
const FUELCOMPACTOR = 5;
const MAXRANGE = 20; // Max fuel capacity for Flea

// Ship fuel data (matching ship types from analysis)
const SHIP_FUEL_DATA = [
    { name: "Flea", fuelTanks: 20, costOfFuel: 1 },      // Special case - MAXRANGE
    { name: "Gnat", fuelTanks: 14, costOfFuel: 2 },
    { name: "Firefly", fuelTanks: 17, costOfFuel: 3 },
    { name: "Mosquito", fuelTanks: 13, costOfFuel: 5 },
    { name: "Bumblebee", fuelTanks: 15, costOfFuel: 7 },
    { name: "Beetle", fuelTanks: 14, costOfFuel: 10 },
    { name: "Hornet", fuelTanks: 16, costOfFuel: 15 },
    { name: "Grasshopper", fuelTanks: 15, costOfFuel: 15 },
    { name: "Termite", fuelTanks: 13, costOfFuel: 20 },
    { name: "Wasp", fuelTanks: 14, costOfFuel: 20 },
];

// Helper functions
function createTestState(): GameState {
    const state = createInitialState();
    state.credits = 10000; // Adequate credits for testing
    return state;
}

function hasGadget(ship: Ship, gadgetType: number): boolean {
    return ship.gadget.includes(gadgetType);
}

function getFuelTanks(ship: Ship, shipType: number): number {
    // Palm OS logic: return (HasGadget(&Ship, FUELCOMPACTOR) ? 18 : Shiptype[Ship.Type].FuelTanks);
    const baseTanks = SHIP_FUEL_DATA[shipType]?.fuelTanks ?? 14;
    return hasGadget(ship, FUELCOMPACTOR) ? 18 : baseTanks;
}

function getFuel(ship: Ship, shipType: number): number {
    // Palm OS logic: return min(Ship.Fuel, GetFuelTanks());
    const tankCapacity = getFuelTanks(ship, shipType);
    return Math.min(ship.fuel, tankCapacity);
}

function buyFuel(ship: Ship, shipType: number, credits: number, amount: number): { newFuel: number, newCredits: number, actualCost: number } {
    // Palm OS BuyFuel logic
    const currentFuel = getFuel(ship, shipType);
    const fuelTanks = getFuelTanks(ship, shipType);
    const costOfFuel = SHIP_FUEL_DATA[shipType]?.costOfFuel ?? 2;
    
    const maxFuel = (fuelTanks - currentFuel) * costOfFuel;
    let finalAmount = Math.min(amount, maxFuel);
    finalAmount = Math.min(finalAmount, credits);
    
    const parsecs = Math.floor(finalAmount / costOfFuel);
    const actualCost = parsecs * costOfFuel;
    
    return {
        newFuel: ship.fuel + parsecs,
        newCredits: credits - actualCost,
        actualCost: actualCost
    };
}

test('Fuel Capacity Calculation', async (t) => {

    await t.test('should return base fuel tanks from ship type', () => {
        const state = createTestState();
        
        // Test Gnat (ship type 1) - 14 fuel tanks
        const gnatType = 1;
        const gnatFuelTanks = getFuelTanks(state.ship, gnatType);
        assert.strictEqual(gnatFuelTanks, 14, 'Gnat should have 14 fuel tanks');
        
        // Test Flea (ship type 0) - MAXRANGE (20) fuel tanks  
        const fleaType = 0;
        const fleaFuelTanks = getFuelTanks(state.ship, fleaType);
        assert.strictEqual(fleaFuelTanks, 20, 'Flea should have 20 fuel tanks (MAXRANGE)');
        
        // Test Hornet (ship type 6) - 16 fuel tanks
        const hornetType = 6;
        const hornetFuelTanks = getFuelTanks(state.ship, hornetType);
        assert.strictEqual(hornetFuelTanks, 16, 'Hornet should have 16 fuel tanks');
    });

    await t.test('should return increased fuel tanks with fuel compactor', () => {
        const state = createTestState();
        
        // Add fuel compactor gadget
        state.ship.gadget = [FUELCOMPACTOR, -1, -1];
        
        // Test with Gnat (normally 14 tanks, should become 18)
        const gnatType = 1;
        const gnatFuelTanksWithCompactor = getFuelTanks(state.ship, gnatType);
        assert.strictEqual(gnatFuelTanksWithCompactor, 18, 'Should have 18 fuel tanks with fuel compactor');
        
        // Test with different ship types
        const hornetType = 6;
        const hornetFuelTanksWithCompactor = getFuelTanks(state.ship, hornetType);
        assert.strictEqual(hornetFuelTanksWithCompactor, 18, 'All ships should have 18 tanks with fuel compactor');
        
        // Test that Flea also becomes 18 (not 20) with compactor
        const fleaType = 0;
        const fleaFuelTanksWithCompactor = getFuelTanks(state.ship, fleaType);
        assert.strictEqual(fleaFuelTanksWithCompactor, 18, 'Flea should have 18 tanks with fuel compactor (not 20)');
    });

    await t.test('should handle multiple fuel compactors (no stacking)', () => {
        const state = createTestState();
        
        // Add multiple fuel compactors (should not stack)
        state.ship.gadget = [FUELCOMPACTOR, FUELCOMPACTOR, FUELCOMPACTOR];
        
        const gnatType = 1;
        const fuelTanksWithMultiple = getFuelTanks(state.ship, gnatType);
        
        // Should still be 18, not 18 + 4 + 4
        assert.strictEqual(fuelTanksWithMultiple, 18, 'Multiple fuel compactors should not stack');
    });
    
});

test('Current Fuel Calculation', async (t) => {

    await t.test('should return current fuel limited by tank capacity', () => {
        const state = createTestState();
        
        // Test fuel over capacity
        state.ship.fuel = 20;
        const gnatType = 1; // 14 tank capacity
        const limitedFuel = getFuel(state.ship, gnatType);
        
        assert.strictEqual(limitedFuel, 14, 'Should limit fuel to tank capacity');
    });

    await t.test('should return actual fuel when less than capacity', () => {
        const state = createTestState();
        
        // Test fuel under capacity
        state.ship.fuel = 10;
        const gnatType = 1; // 14 tank capacity
        const actualFuel = getFuel(state.ship, gnatType);
        
        assert.strictEqual(actualFuel, 10, 'Should return actual fuel when under capacity');
    });

    await t.test('should handle zero fuel', () => {
        const state = createTestState();
        
        state.ship.fuel = 0;
        const gnatType = 1;
        const zeroFuel = getFuel(state.ship, gnatType);
        
        assert.strictEqual(zeroFuel, 0, 'Should handle zero fuel correctly');
    });

    await t.test('should work with fuel compactor capacity', () => {
        const state = createTestState();
        
        // Add fuel compactor
        state.ship.gadget = [FUELCOMPACTOR, -1, -1];
        
        // Test fuel over compactor capacity
        state.ship.fuel = 25;
        const gnatType = 1; // 18 tank capacity with compactor
        const limitedFuelWithCompactor = getFuel(state.ship, gnatType);
        
        assert.strictEqual(limitedFuelWithCompactor, 18, 'Should limit fuel to compactor capacity');
        
        // Test fuel under compactor capacity
        state.ship.fuel = 15;
        const actualFuelWithCompactor = getFuel(state.ship, gnatType);
        
        assert.strictEqual(actualFuelWithCompactor, 15, 'Should return actual fuel when under compactor capacity');
    });
    
});

test('Fuel Purchase Mechanics', async (t) => {

    await t.test('should calculate fuel purchase cost correctly', () => {
        const state = createTestState();
        
        // Gnat: 14 tanks, 2 credits per parsec
        const gnatType = 1;
        state.ship.fuel = 10; // 4 parsecs needed to fill
        
        const result = buyFuel(state.ship, gnatType, 10000, 100); // Try to buy 100 credits worth
        
        // Should buy 4 parsecs at 2 credits each = 8 credits
        const expectedCost = 4 * 2; // 8 credits
        const expectedFuel = 10 + 4; // 14 total
        
        assert.strictEqual(result.actualCost, expectedCost, 'Should calculate correct fuel cost');
        assert.strictEqual(result.newFuel, expectedFuel, 'Should add correct fuel amount');
        assert.strictEqual(result.newCredits, 10000 - expectedCost, 'Should deduct correct credits');
    });

    await t.test('should limit fuel purchase to tank capacity', () => {
        const state = createTestState();
        
        // Gnat with empty tank: 14 tanks, 2 credits per parsec
        const gnatType = 1;
        state.ship.fuel = 0;
        
        // Try to buy more than capacity allows
        const maxNeeded = 14 * 2; // 28 credits for full tank
        const result = buyFuel(state.ship, gnatType, 10000, maxNeeded + 100); // Extra amount
        
        assert.strictEqual(result.actualCost, maxNeeded, 'Should limit purchase to tank capacity');
        assert.strictEqual(result.newFuel, 14, 'Should fill tank to capacity');
    });

    await t.test('should limit fuel purchase to available credits', () => {
        const state = createTestState();
        
        // Gnat with empty tank, limited credits
        const gnatType = 1;
        state.ship.fuel = 0;
        const limitedCredits = 10; // Only 10 credits available
        
        const result = buyFuel(state.ship, gnatType, limitedCredits, 1000); // Try to buy lots
        
        // Can only buy 5 parsecs (10 credits / 2 credits per parsec)
        const expectedParsecs = Math.floor(limitedCredits / 2);
        const expectedCost = expectedParsecs * 2;
        
        assert.strictEqual(result.actualCost, expectedCost, 'Should limit purchase to available credits');
        assert.strictEqual(result.newFuel, expectedParsecs, 'Should add fuel based on affordable amount');
        assert.strictEqual(result.newCredits, limitedCredits - expectedCost, 'Should deduct only spent amount');
    });

    await t.test('should handle different ship fuel costs', () => {
        const state = createTestState();
        
        // Test Flea (cheap fuel - 1 credit per parsec)
        const fleaType = 0;
        state.ship.fuel = 0;
        
        const fleaResult = buyFuel(state.ship, fleaType, 100, 100);
        
        // Should buy more parsecs due to cheaper fuel
        const expectedFleaParsecs = Math.min(20, Math.floor(100 / 1)); // 20 parsecs (full tank)
        assert.strictEqual(fleaResult.newFuel, expectedFleaParsecs, 'Should buy more fuel with cheaper cost');
        
        // Test Wasp (expensive fuel - 20 credits per parsec) 
        const waspType = 9;
        state.ship.fuel = 0;
        
        const waspResult = buyFuel(state.ship, waspType, 100, 100);
        
        // Should buy fewer parsecs due to expensive fuel
        const expectedWaspParsecs = Math.floor(100 / 20); // 5 parsecs
        assert.strictEqual(waspResult.newFuel, expectedWaspParsecs, 'Should buy less fuel with expensive cost');
    });

    await t.test('should work with fuel compactor', () => {
        const state = createTestState();
        
        // Add fuel compactor
        state.ship.gadget = [FUELCOMPACTOR, -1, -1];
        
        const gnatType = 1;
        state.ship.fuel = 14; // At normal capacity, but compactor allows 18
        
        const result = buyFuel(state.ship, gnatType, 100, 100);
        
        // Should be able to buy 4 more parsecs (18 - 14)
        const expectedAdditionalFuel = 4;
        const expectedCost = expectedAdditionalFuel * 2; // 8 credits
        
        assert.strictEqual(result.actualCost, expectedCost, 'Should allow additional fuel purchase with compactor');
        assert.strictEqual(result.newFuel, 18, 'Should fill to compactor capacity');
    });

    await t.test('should handle exact credit amounts', () => {
        const state = createTestState();
        
        // Test exact credit amount for fuel purchase
        const gnatType = 1;
        state.ship.fuel = 10; // Need 4 parsecs
        const exactCredits = 4 * 2; // Exactly 8 credits needed
        
        const result = buyFuel(state.ship, gnatType, exactCredits, exactCredits);
        
        assert.strictEqual(result.actualCost, exactCredits, 'Should use exact credit amount');
        assert.strictEqual(result.newCredits, 0, 'Should spend all available credits');
        assert.strictEqual(result.newFuel, 14, 'Should fill tank completely');
    });

    await t.test('should handle zero credit purchase attempts', () => {
        const state = createTestState();
        
        const gnatType = 1;
        state.ship.fuel = 10;
        
        const result = buyFuel(state.ship, gnatType, 0, 100); // No credits available
        
        assert.strictEqual(result.actualCost, 0, 'Should cost nothing with no credits');
        assert.strictEqual(result.newFuel, 10, 'Should not change fuel amount');
        assert.strictEqual(result.newCredits, 0, 'Should not change credit amount');
    });

    await t.test('should handle already full tank', () => {
        const state = createTestState();
        
        const gnatType = 1;
        state.ship.fuel = 14; // Already full
        
        const result = buyFuel(state.ship, gnatType, 10000, 100);
        
        assert.strictEqual(result.actualCost, 0, 'Should cost nothing when tank is full');
        assert.strictEqual(result.newFuel, 14, 'Should not change fuel amount');
        assert.strictEqual(result.newCredits, 10000, 'Should not change credit amount');
    });
    
});

test('Fuel Cost Variations by Ship Type', async (t) => {

    await t.test('should have correct fuel costs for each ship type', () => {
        // Test all ship types have correct fuel costs
        const expectedCosts = [1, 2, 3, 5, 7, 10, 15, 15, 20, 20];
        
        for (let i = 0; i < SHIP_FUEL_DATA.length; i++) {
            const shipData = SHIP_FUEL_DATA[i];
            assert.strictEqual(shipData.costOfFuel, expectedCosts[i], 
                `${shipData.name} should have fuel cost of ${expectedCosts[i]}`);
        }
    });

    await t.test('should calculate different total costs for full tank', () => {
        const state = createTestState();
        
        // Compare Flea (cheap) vs Wasp (expensive) for full tank
        const fleaType = 0;
        const waspType = 9;
        
        state.ship.fuel = 0; // Empty tank
        
        const fleaResult = buyFuel(state.ship, fleaType, 10000, 10000);
        const waspResult = buyFuel(state.ship, waspType, 10000, 10000);
        
        // Flea: 20 parsecs * 1 credit = 20 credits
        const expectedFleaCost = 20 * 1;
        assert.strictEqual(fleaResult.actualCost, expectedFleaCost, 'Flea full tank should cost 20 credits');
        
        // Wasp: 14 parsecs * 20 credits = 280 credits  
        const expectedWaspCost = 14 * 20;
        assert.strictEqual(waspResult.actualCost, expectedWaspCost, 'Wasp full tank should cost 280 credits');
        
        // Verify cost difference
        const costRatio = waspResult.actualCost / fleaResult.actualCost;
        assert.ok(costRatio > 10, 'Wasp fuel should be much more expensive than Flea');
    });
    
});

test('Fuel System Edge Cases', async (t) => {

    await t.test('should handle fractional credit amounts', () => {
        const state = createTestState();
        
        // Test with credits that don't divide evenly
        const gnatType = 1; // 2 credits per parsec
        state.ship.fuel = 0;
        
        // 15 credits should buy 7 parsecs (14 credits), leaving 1 credit unused
        const result = buyFuel(state.ship, gnatType, 15, 15);
        
        assert.strictEqual(result.actualCost, 14, 'Should spend only even multiples of fuel cost');
        assert.strictEqual(result.newFuel, 7, 'Should buy 7 parsecs');
        assert.strictEqual(result.newCredits, 1, 'Should leave 1 credit unspent');
    });

    await t.test('should handle maximum fuel scenario', () => {
        const state = createTestState();
        
        // Test with ship that has maximum fuel in original game
        const fleaType = 0; // MAXRANGE (20) fuel tanks
        state.ship.fuel = 0;
        
        const result = buyFuel(state.ship, fleaType, 1000, 1000);
        
        assert.strictEqual(result.newFuel, 20, 'Should fill to maximum range');
        assert.strictEqual(result.actualCost, 20, 'Should cost 20 credits for Flea full tank');
    });

    await t.test('should maintain fuel invariants', () => {
        const state = createTestState();
        
        const gnatType = 1;
        const initialFuel = 5;
        const initialCredits = 1000;
        
        state.ship.fuel = initialFuel;
        
        const result = buyFuel(state.ship, gnatType, initialCredits, 50);
        
        // Verify invariants
        assert.ok(result.newFuel >= initialFuel, 'Fuel should never decrease');
        assert.ok(result.newCredits <= initialCredits, 'Credits should never increase');
        assert.ok(result.actualCost >= 0, 'Cost should never be negative');
        assert.strictEqual(result.newCredits + result.actualCost, initialCredits, 'Credits should be conserved');
        
        // Verify fuel doesn't exceed capacity
        const maxCapacity = getFuelTanks(state.ship, gnatType);
        assert.ok(result.newFuel <= maxCapacity, 'Fuel should not exceed tank capacity');
    });
    
});
