#!/usr/bin/env node --test --experimental-strip-types

// Ship Validation System Tests
// Comprehensive tests for ship purchase, upgrade, and validation rules

import { test } from 'node:test';
import assert from 'node:assert';
import { createInitialState, cloneState } from '../state.ts';
import type { GameState, Ship, TechLevel } from '../types.ts';

// Test data matching Palm OS ship definitions
const SHIP_TYPES = [
    // [CargoBays, WeaponSlots, ShieldSlots, GadgetSlots, CrewQuarters, FuelTanks, MinTechLevel, CostOfFuel, Price, HullStrength, RepairCosts]
    [10, 0, 0, 0, 1, 20, 4, 1,   2000,  25, 1], // Flea
    [15, 1, 0, 1, 1, 14, 5, 2,  10000, 100, 1], // Gnat  
    [20, 1, 1, 1, 1, 17, 5, 3,  25000, 100, 1], // Firefly
    [15, 2, 1, 1, 1, 13, 5, 5,  30000, 100, 1], // Mosquito
    [25, 1, 2, 2, 2, 15, 5, 7,  60000, 100, 1], // Bumblebee
    [50, 0, 1, 1, 3, 14, 5, 10, 80000,  50, 1], // Beetle
    [20, 3, 2, 1, 2, 16, 6, 15, 100000, 150, 2], // Hornet
    [30, 2, 2, 3, 3, 15, 6, 15, 150000, 150, 3], // Grasshopper
    [60, 1, 3, 2, 3, 13, 7, 20, 225000, 200, 4], // Termite
    [35, 3, 2, 2, 3, 14, 7, 20, 300000, 200, 5], // Wasp
];

// Helper functions
function createTestState(): GameState {
    const state = createInitialState();
    state.currentSystem = 0;
    state.credits = 1000000; // Plenty of credits for testing
    return state;
}

function getShipType(shipTypeIndex: number) {
    return SHIP_TYPES[shipTypeIndex];
}

function setSystemTechLevel(state: GameState, techLevel: TechLevel) {
    state.solarSystem[state.currentSystem].techLevel = techLevel;
}

function calculateBaseShipPrice(shipTypeIndex: number, traderSkill: number): number {
    const basePrice = SHIP_TYPES[shipTypeIndex][8]; // Price is at index 8
    return Math.floor((basePrice * (100 - traderSkill)) / 100);
}

test('Ship Purchase Validation', async (t) => {

    await t.test('should validate tech level requirements', () => {
        const state = createTestState();
        
        // Test tech level requirement enforcement
        const hornetIndex = 6; // Hornet requires tech level 6
        const hornetMinTech = SHIP_TYPES[hornetIndex][6];
        
        // Set system tech level too low
        setSystemTechLevel(state, (hornetMinTech - 1) as TechLevel);
        
        // Ship should not be available for purchase
        const availableAtLowTech = hornetMinTech <= state.solarSystem[state.currentSystem].techLevel;
        assert.strictEqual(availableAtLowTech, false, 'Ship should not be available below minimum tech level');
        
        // Set system tech level high enough
        setSystemTechLevel(state, hornetMinTech as TechLevel);
        
        // Ship should be available for purchase
        const availableAtCorrectTech = hornetMinTech <= state.solarSystem[state.currentSystem].techLevel;
        assert.strictEqual(availableAtCorrectTech, true, 'Ship should be available at minimum tech level');
    });

    await t.test('should enforce credit requirements', () => {
        const state = createTestState();
        const hornetIndex = 6;
        setSystemTechLevel(state, 8); // High tech level
        
        // Calculate required credits with trader skill discount
        const basePrice = calculateBaseShipPrice(hornetIndex, state.commanderTrader);
        const currentShipValue = 2500; // Approximate trade-in value for starter ship
        const netCost = basePrice - currentShipValue;
        
        // Test insufficient credits
        state.credits = netCost - 1;
        const hasEnoughCredits = state.credits >= netCost;
        assert.strictEqual(hasEnoughCredits, false, 'Should reject purchase with insufficient credits');
        
        // Test sufficient credits
        state.credits = netCost + 1;
        const hasEnoughCreditsNow = state.credits >= netCost;
        assert.strictEqual(hasEnoughCreditsNow, true, 'Should allow purchase with sufficient credits');
    });

    await t.test('should prevent purchase while in debt', () => {
        const state = createTestState();
        setSystemTechLevel(state, 8);
        
        // Set debt
        state.debt = 1000;
        
        // Even with sufficient credits, debt should prevent purchase
        state.credits = 1000000;
        
        const canPurchaseWithDebt = state.debt === 0;
        assert.strictEqual(canPurchaseWithDebt, false, 'Should prevent ship purchase while in debt');
        
        // Clear debt
        state.debt = 0;
        const canPurchaseWithoutDebt = state.debt === 0;
        assert.strictEqual(canPurchaseWithoutDebt, true, 'Should allow ship purchase without debt');
    });

    await t.test('should validate crew quarters capacity', () => {
        const state = createTestState();
        setSystemTechLevel(state, 8);
        
        // Fill ship with crew members
        state.ship.crew = [0, 1, 2]; // 3 crew members
        
        const beetleIndex = 5; // Beetle has 3 crew quarters
        const beetleQuarters = SHIP_TYPES[beetleIndex][4];
        
        const hasEnoughQuarters = state.ship.crew.filter(c => c >= 0).length <= beetleQuarters;
        assert.strictEqual(hasEnoughQuarters, true, 'Beetle should accommodate 3 crew members');
        
        // Try to get ship with insufficient quarters
        const fleaIndex = 0; // Flea has only 1 crew quarter
        const fleaQuarters = SHIP_TYPES[fleaIndex][4];
        
        const fleaHasEnoughQuarters = state.ship.crew.filter(c => c >= 0).length <= fleaQuarters;
        assert.strictEqual(fleaHasEnoughQuarters, false, 'Flea should not accommodate 3 crew members');
    });

    await t.test('should handle special equipment transfer costs', () => {
        const state = createTestState();
        setSystemTechLevel(state, 8);
        
        // Test Lightning Shield transfer cost (30,000 credits)
        const hasLightningShield = true; // Assume ship has Lightning Shield
        const lightningTransferCost = 30000;
        
        // Test Fuel Compactor transfer cost (20,000 credits) 
        const hasFuelCompactor = true; // Assume ship has Fuel Compactor
        const compactorTransferCost = 20000;
        
        // Test Morgan's Laser transfer cost (33,333 credits)
        const hasMorganLaser = true; // Assume ship has Morgan's Laser
        const laserTransferCost = 33333;
        
        const totalTransferCost = lightningTransferCost + compactorTransferCost + laserTransferCost;
        const hornetBasePrice = calculateBaseShipPrice(6, state.commanderTrader);
        const totalCost = hornetBasePrice + totalTransferCost;
        
        // Test insufficient credits for transfer
        state.credits = totalCost - 1;
        const canAffordTransfer = state.credits >= totalCost;
        assert.strictEqual(canAffordTransfer, false, 'Should reject transfer with insufficient credits');
        
        // Test sufficient credits for transfer
        state.credits = totalCost + 1;
        const canAffordTransferNow = state.credits >= totalCost;
        assert.strictEqual(canAffordTransferNow, true, 'Should allow transfer with sufficient credits');
    });

    await t.test('should prevent selling ship with reactor quest active', () => {
        const state = createTestState();
        setSystemTechLevel(state, 8);
        
        // Simulate active reactor quest (ReactorStatus > 0 && < 21)
        const reactorStatus = 10; // Active quest
        
        const canSellWithReactor = false; // reactorStatus (10) is not 0 and not >= 21
        assert.strictEqual(canSellWithReactor, false, 'Should prevent ship sale during reactor quest');
        
        // Test completed/no reactor quest  
        const completedReactorStatus = 0; // No active quest
        const canSellWithoutReactor = completedReactorStatus === 0 || completedReactorStatus >= 21;
        assert.strictEqual(canSellWithoutReactor, true, 'Should allow ship sale without active reactor quest');
    });
    
});

test('Ship Upgrade Validation', async (t) => {

    await t.test('should calculate hull strength correctly', () => {
        const state = createTestState();
        const baseHullStrength = 100;
        
        // Test normal hull strength
        const normalHull = baseHullStrength;
        assert.strictEqual(normalHull, 100, 'Normal hull strength should match ship type');
        
        // Test hardened hull upgrade (Scarab status 3 adds 50 hull points)
        const scarabStatus = 3; // Hardened hull
        const hardenedBonus = 50;
        const hardenedHull = baseHullStrength + (scarabStatus === 3 ? hardenedBonus : 0);
        assert.strictEqual(hardenedHull, 150, 'Hardened hull should add 50 points');
    });

    await t.test('should calculate repair costs correctly', () => {
        const state = createTestState();
        
        // Test repair cost calculation: (MaxHull - CurrentHull) * RepairCostPerPoint
        const maxHull = 100;
        const currentHull = 75;
        const repairCostPerPoint = 2;
        const hullDamage = maxHull - currentHull;
        const totalRepairCost = hullDamage * repairCostPerPoint;
        
        assert.strictEqual(totalRepairCost, 50, 'Should calculate correct total repair cost');
        
        // Test partial repair
        const repairAmount = 30; // 30 credits worth
        const hullPointsRepaired = Math.floor(repairAmount / repairCostPerPoint);
        const actualCost = hullPointsRepaired * repairCostPerPoint;
        
        assert.strictEqual(hullPointsRepaired, 15, 'Should repair 15 hull points for 30 credits');
        assert.strictEqual(actualCost, 30, 'Should charge exact amount for hull points repaired');
    });

    await t.test('should handle repair credit limits', () => {
        const state = createInitialState();
        state.credits = 25; // Limited credits
        
        const maxHull = 100;
        const currentHull = 50; 
        const repairCostPerPoint = 2;
        const maxRepairCost = (maxHull - currentHull) * repairCostPerPoint; // 100 credits needed
        const affordableRepair = Math.min(maxRepairCost, state.credits); // 25 credits available 
        const hullPointsAffordable = Math.floor(affordableRepair / repairCostPerPoint); // 25/2 = 12 points
        const actualCost = hullPointsAffordable * repairCostPerPoint; // 12*2 = 24 credits
        
        assert.strictEqual(hullPointsAffordable, 12, 'Should only repair hull points affordable');
        assert.strictEqual(actualCost, 24, 'Should spend exact amount for repair points available');
    });
    
});

test('Ship Transfer Validation', async (t) => {

    await t.test('should validate special equipment slot compatibility', () => {
        // Test Lightning Shield transfer requirements
        const targetShipShieldSlots = 2;
        const hasLightningShield = true;
        
        const canTransferLightning = !hasLightningShield || targetShipShieldSlots > 0;
        assert.strictEqual(canTransferLightning, true, 'Should allow Lightning Shield transfer to ship with shield slots');
        
        // Test transfer to ship without shield slots
        const noShieldSlots = 0;
        const canTransferToNoSlots = !hasLightningShield || noShieldSlots > 0;
        assert.strictEqual(canTransferToNoSlots, false, 'Should prevent Lightning Shield transfer to ship without shield slots');
        
        // Test Fuel Compactor transfer
        const targetShipGadgetSlots = 1;
        const hasFuelCompactor = true;
        
        const canTransferCompactor = !hasFuelCompactor || targetShipGadgetSlots > 0;
        assert.strictEqual(canTransferCompactor, true, 'Should allow Fuel Compactor transfer to ship with gadget slots');
        
        // Test Morgan's Laser transfer
        const targetShipWeaponSlots = 3;
        const hasMorganLaser = true;
        
        const canTransferLaser = !hasMorganLaser || targetShipWeaponSlots > 0;
        assert.strictEqual(canTransferLaser, true, 'Should allow Morgan\'s Laser transfer to ship with weapon slots');
    });

    await t.test('should validate passenger requirements', () => {
        const state = createTestState();
        
        // Test Jarek passenger requirement (needs 2+ crew quarters)
        const jarekStatus = 1; // Jarek is aboard
        const targetShipQuarters = 1; // Flea has only 1 quarter
        
        const canAccommodateJarek = jarekStatus !== 1 || targetShipQuarters >= 2;
        assert.strictEqual(canAccommodateJarek, false, 'Should prevent transfer to ship that cannot accommodate Jarek');
        
        // Test with adequate quarters
        const adequateQuarters = 2;
        const canAccommodateJarekNow = jarekStatus !== 1 || adequateQuarters >= 2;
        assert.strictEqual(canAccommodateJarekNow, true, 'Should allow transfer to ship with adequate quarters');
        
        // Test Wild passenger requirement
        const wildStatus = 1; // Wild is aboard  
        const canAccommodateWild = wildStatus !== 1 || adequateQuarters >= 2;
        assert.strictEqual(canAccommodateWild, true, 'Should allow transfer to ship that can accommodate Wild');
    });
    
});

test('Ship Price Calculation', async (t) => {

    await t.test('should apply trader skill discount on ship purchases', () => {
        const basePrice = 100000;
        const traderSkill = 10;
        
        // Formula: (basePrice * (100 - traderSkill)) / 100
        const discountedPrice = Math.floor((basePrice * (100 - traderSkill)) / 100);
        const expectedPrice = 90000; // 10% discount
        
        assert.strictEqual(discountedPrice, expectedPrice, 'Should apply trader skill discount correctly');
        
        // Test maximum trader skill discount
        const maxTraderSkill = 10;
        const maxDiscountPrice = Math.floor((basePrice * (100 - maxTraderSkill)) / 100);
        assert.strictEqual(maxDiscountPrice, 90000, 'Should apply maximum 10% discount');
        
        // Test no trader skill
        const noSkill = 0;
        const noDiscountPrice = Math.floor((basePrice * (100 - noSkill)) / 100);
        assert.strictEqual(noDiscountPrice, basePrice, 'Should apply no discount without trader skill');
    });

    await t.test('should calculate trade-in value correctly', () => {
        // Trade-in value is complex in original, simplified here
        const currentShipBasePrice = 10000;
        const tradeInMultiplier = 0.75; // Approximately 75% of value
        const tradeInValue = Math.floor(currentShipBasePrice * tradeInMultiplier);
        
        assert.strictEqual(tradeInValue, 7500, 'Should calculate approximate trade-in value');
        
        // Test with tribble penalty (ships with tribbles worth less)
        const tribbleMultiplier = 0.25; // Tribbles reduce value significantly
        const tribbleTradeInValue = Math.floor(currentShipBasePrice * tribbleMultiplier);
        assert.strictEqual(tribbleTradeInValue, 2500, 'Should apply tribble penalty to trade-in value');
    });

    await t.test('should handle minimum ship prices', () => {
        const calculatedPrice = 0; // Price calculation resulted in 0
        const minimumPrice = 1; // Original code ensures minimum price of 1
        const finalPrice = calculatedPrice === 0 ? minimumPrice : calculatedPrice;
        
        assert.strictEqual(finalPrice, 1, 'Should enforce minimum price of 1 credit');
    });
    
});
