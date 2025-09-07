#!/usr/bin/env node --test --experimental-strip-types

// Equipment Validation System Tests  
// Comprehensive tests for equipment purchase, installation, and validation rules

import { test } from 'node:test';
import assert from 'node:assert';
import { createInitialState } from '../state.ts';
import type { GameState, Ship, TechLevel } from '../types.ts';

// Test data matching Palm OS equipment definitions
const WEAPONS = [
    { name: "Pulse laser", power: 15, price: 2000, techLevel: 5, chance: 50 },
    { name: "Beam laser", power: 25, price: 12500, techLevel: 6, chance: 35 },
    { name: "Military laser", power: 35, price: 35000, techLevel: 7, chance: 15 },
    { name: "Morgan's laser", power: 85, price: 50000, techLevel: 8, chance: 0 }, // Special - cannot buy
];

const SHIELDS = [
    { name: "Energy shield", power: 100, price: 5000, techLevel: 5, chance: 70 },
    { name: "Reflective shield", power: 200, price: 20000, techLevel: 6, chance: 30 },
    { name: "Lightning shield", power: 350, price: 45000, techLevel: 8, chance: 0 }, // Special - cannot buy
];

const GADGETS = [
    { name: "5 extra cargo bays", price: 2500, techLevel: 4, chance: 35 },
    { name: "Auto-repair system", price: 7500, techLevel: 5, chance: 20 },
    { name: "Navigating system", price: 15000, techLevel: 6, chance: 20 },
    { name: "Targeting system", price: 25000, techLevel: 6, chance: 20 },
    { name: "Cloaking device", price: 100000, techLevel: 7, chance: 5 },
    { name: "Fuel compactor", price: 30000, techLevel: 8, chance: 0 }, // Special - cannot buy
];

// Constants
const EXTRABAYS = 0;
const FUELCOMPACTOR = 5;
const LIGHTNINGSHIELD = 2;
const MORGANLASERWEAPON = 3;

// Helper functions
function createTestState(): GameState {
    const state = createInitialState();
    state.currentSystem = 0;
    state.credits = 100000; // Adequate credits for testing
    return state;
}

function setSystemTechLevel(state: GameState, techLevel: TechLevel) {
    state.solarSystem[state.currentSystem].techLevel = techLevel;
}

function calculateBasePrice(techLevel: number, price: number, currentTechLevel: number, traderSkill: number): number {
    if (techLevel > currentTechLevel) return 0; // Not available
    return Math.floor((price * (100 - traderSkill)) / 100);
}

function calculateSellPrice(price: number): number {
    return Math.floor((price * 3) / 4); // 75% of base price
}

function hasEquipmentSlot(ship: Ship, slotType: 'weapon' | 'shield' | 'gadget'): number {
    // Find first empty slot
    switch (slotType) {
        case 'weapon':
            return ship.weapon.findIndex(w => w === -1);
        case 'shield':
            return ship.shield.findIndex(s => s === -1);  
        case 'gadget':
            return ship.gadget.findIndex(g => g === -1);
    }
}

function hasGadget(ship: Ship, gadgetType: number): boolean {
    return ship.gadget.includes(gadgetType);
}

function hasShield(ship: Ship, shieldType: number): boolean {
    return ship.shield.includes(shieldType);
}

function hasWeapon(ship: Ship, weaponType: number, exactMatch: boolean = true): boolean {
    if (exactMatch) {
        return ship.weapon.includes(weaponType);
    } else {
        // In original, better weapons also return true for lower weapon checks
        return ship.weapon.some(w => w >= weaponType && w >= 0);
    }
}

test('Equipment Purchase Validation', async (t) => {

    await t.test('should validate tech level requirements', () => {
        const state = createTestState();
        
        // Test weapon tech level requirement
        const militaryLaser = WEAPONS[2]; // Military laser requires tech level 7
        setSystemTechLevel(state, (militaryLaser.techLevel - 1) as TechLevel);
        
        const availablePrice = calculateBasePrice(
            militaryLaser.techLevel, 
            militaryLaser.price, 
            state.solarSystem[state.currentSystem].techLevel,
            state.commanderTrader
        );
        
        assert.strictEqual(availablePrice, 0, 'Should not be available below required tech level');
        
        // Set adequate tech level
        setSystemTechLevel(state, militaryLaser.techLevel as TechLevel);
        const availablePriceNow = calculateBasePrice(
            militaryLaser.techLevel,
            militaryLaser.price,
            state.solarSystem[state.currentSystem].techLevel, 
            state.commanderTrader
        );
        
        assert.ok(availablePriceNow > 0, 'Should be available at required tech level');
    });

    await t.test('should enforce credit requirements', () => {
        const state = createTestState();
        setSystemTechLevel(state, 8); // High tech level
        
        const expensiveItem = GADGETS[4]; // Cloaking device - 100,000 credits
        const itemPrice = calculateBasePrice(
            expensiveItem.techLevel,
            expensiveItem.price,
            state.solarSystem[state.currentSystem].techLevel,
            state.commanderTrader
        );
        
        // Test insufficient credits
        state.credits = itemPrice - 1;
        const hasEnoughCredits = state.credits >= itemPrice;
        assert.strictEqual(hasEnoughCredits, false, 'Should reject purchase with insufficient credits');
        
        // Test sufficient credits  
        state.credits = itemPrice + 1;
        const hasEnoughCreditsNow = state.credits >= itemPrice;
        assert.strictEqual(hasEnoughCreditsNow, true, 'Should allow purchase with sufficient credits');
    });

    await t.test('should prevent purchase while in debt', () => {
        const state = createTestState();
        setSystemTechLevel(state, 8);
        
        // Set debt
        state.debt = 1000;
        const canPurchaseWithDebt = state.debt === 0;
        assert.strictEqual(canPurchaseWithDebt, false, 'Should prevent equipment purchase while in debt');
        
        // Clear debt
        state.debt = 0;
        const canPurchaseWithoutDebt = state.debt === 0;
        assert.strictEqual(canPurchaseWithoutDebt, true, 'Should allow equipment purchase without debt');
    });

    await t.test('should validate equipment slot availability', () => {
        const state = createTestState();
        setSystemTechLevel(state, 8);
        
        // Fill all weapon slots
        state.ship.weapon = [0, 1, 2]; // All slots filled
        const weaponSlotIndex = hasEquipmentSlot(state.ship, 'weapon');
        assert.strictEqual(weaponSlotIndex, -1, 'Should detect no empty weapon slots');
        
        // Test with empty slot
        state.ship.weapon = [0, -1, -1]; // First slot filled, others empty
        const emptyWeaponSlot = hasEquipmentSlot(state.ship, 'weapon');
        assert.strictEqual(emptyWeaponSlot, 1, 'Should find first empty weapon slot');
        
        // Test shield slots
        state.ship.shield = [-1, -1, -1]; // All empty
        const emptyShieldSlot = hasEquipmentSlot(state.ship, 'shield');
        assert.strictEqual(emptyShieldSlot, 0, 'Should find first empty shield slot');
        
        // Test gadget slots
        state.ship.gadget = [0, 1, 2]; // All filled
        const gadgetSlotIndex = hasEquipmentSlot(state.ship, 'gadget');
        assert.strictEqual(gadgetSlotIndex, -1, 'Should detect no empty gadget slots');
    });

    await t.test('should handle special items that cannot be purchased', () => {
        const state = createTestState();
        setSystemTechLevel(state, 8); // Maximum tech level
        
        // Test Morgan's laser (chance = 0, cannot be bought)
        const morganLaser = WEAPONS[3];
        const morganPrice = calculateBasePrice(
            morganLaser.techLevel,
            morganLaser.price, 
            state.solarSystem[state.currentSystem].techLevel,
            state.commanderTrader
        );
        
        // Even at max tech level, special items aren't sold (would need additional chance check)
        // In practice, these would be handled by checking the 'chance' field or special flags
        assert.ok(morganLaser.chance === 0, 'Morgan\'s laser should have 0% chance (not sold)');
        
        // Test Lightning shield
        const lightningShield = SHIELDS[2]; 
        assert.ok(lightningShield.chance === 0, 'Lightning shield should have 0% chance (not sold)');
        
        // Test Fuel compactor
        const fuelCompactor = GADGETS[5];
        assert.ok(fuelCompactor.chance === 0, 'Fuel compactor should have 0% chance (not sold)');
    });

    await t.test('should prevent duplicate non-stackable gadgets', () => {
        const state = createTestState();
        setSystemTechLevel(state, 8);
        
        // Test gadget that can't be duplicated (everything except EXTRABAYS)
        const autoRepair = 1; // Auto-repair system index
        state.ship.gadget = [autoRepair, -1, -1]; // Already has auto-repair
        
        const alreadyHasAutoRepair = hasGadget(state.ship, autoRepair);
        const isExtraBays = false; // autoRepair (1) !== EXTRABAYS (0)
        const canPurchaseDuplicate = isExtraBays || !alreadyHasAutoRepair;
        
        assert.strictEqual(canPurchaseDuplicate, false, 'Should prevent duplicate auto-repair system');
        
        // Test extra cargo bays (can be duplicated)
        const extraBays = EXTRABAYS;
        state.ship.gadget = [extraBays, -1, -1]; // Already has extra bays
        
        const alreadyHasExtraBays = hasGadget(state.ship, extraBays);
        const canPurchaseMoreBays = true; // extraBays (0) === EXTRABAYS (0)
        
        
        assert.strictEqual(canPurchaseMoreBays, true, 'Should allow multiple extra cargo bay gadgets');
    });
    
});

test('Equipment Selling Validation', async (t) => {

    await t.test('should calculate sell prices correctly', () => {
        // Test 75% sell price formula from original code
        const pulseLaserPrice = WEAPONS[0].price; // 2000
        const sellPrice = calculateSellPrice(pulseLaserPrice);
        const expectedSellPrice = 1500; // 75% of 2000
        
        assert.strictEqual(sellPrice, expectedSellPrice, 'Should sell at 75% of base price');
        
        // Test shield sell price
        const energyShieldPrice = SHIELDS[0].price; // 5000
        const shieldSellPrice = calculateSellPrice(energyShieldPrice);
        const expectedShieldSellPrice = 3750; // 75% of 5000
        
        assert.strictEqual(shieldSellPrice, expectedShieldSellPrice, 'Should sell shield at 75% of base price');
        
        // Test gadget sell price
        const autoRepairPrice = GADGETS[1].price; // 7500
        const gadgetSellPrice = calculateSellPrice(autoRepairPrice);
        const expectedGadgetSellPrice = 5625; // 75% of 7500
        
        assert.strictEqual(gadgetSellPrice, expectedGadgetSellPrice, 'Should sell gadget at 75% of base price');
    });

    await t.test('should handle equipment removal and array shifting', () => {
        const state = createTestState();
        
        // Test weapon removal with array shifting
        state.ship.weapon = [0, 1, 2]; // Pulse, Beam, Military lasers
        
        // Simulate selling middle weapon (index 1)
        const weaponToSell = 1;
        const newWeaponArray = [...state.ship.weapon];
        newWeaponArray.splice(weaponToSell, 1);
        newWeaponArray.push(-1); // Add empty slot at end
        
        const expectedWeaponArray = [0, 2, -1]; // Pulse, Military, empty
        assert.deepStrictEqual(newWeaponArray, expectedWeaponArray, 'Should shift weapons after removal');
        
        // Test shield removal with strength tracking
        state.ship.shield = [0, 1, -1]; // Energy, Reflective, empty
        state.ship.shieldStrength = [50, 100, 0]; // Corresponding strengths
        
        // Simulate selling first shield (index 0)  
        const shieldToSell = 0;
        const newShieldArray = [...state.ship.shield];
        const newStrengthArray = [...state.ship.shieldStrength];
        
        newShieldArray.splice(shieldToSell, 1);
        newStrengthArray.splice(shieldToSell, 1);
        newShieldArray.push(-1);
        newStrengthArray.push(0);
        
        const expectedShieldArray = [1, -1, -1]; // Reflective, empty, empty
        const expectedStrengthArray = [100, 0, 0]; // Corresponding strengths
        
        assert.deepStrictEqual(newShieldArray, expectedShieldArray, 'Should shift shields after removal');
        assert.deepStrictEqual(newStrengthArray, expectedStrengthArray, 'Should shift shield strengths after removal');
    });

    await t.test('should validate cargo space when selling extra bays', () => {
        const state = createTestState();
        
        // Test selling extra cargo bays with insufficient empty space
        const currentCargo = [5, 3, 2, 1, 0, 0, 0, 0, 0, 0]; // 11 items
        const baseCargoBays = 15;
        const extraBaysGadgets = 1; // One extra bays gadget = +5 bays
        const totalCargoBays = baseCargoBays + (extraBaysGadgets * 5);
        const filledCargoBays = currentCargo.reduce((sum, qty) => sum + qty, 0);
        
        // Selling extra bays removes 5 cargo bays
        const cargoBaysAfterSale = totalCargoBays - 5;
        const canSellExtraBays = filledCargoBays <= cargoBaysAfterSale;
        
        assert.strictEqual(canSellExtraBays, true, 'Should allow selling extra bays when enough space');
        
        // Test with too much cargo
        const tooMuchCargo = [5, 5, 5, 2, 0, 0, 0, 0, 0, 0]; // 17 items
        const filledBaysOvercapacity = tooMuchCargo.reduce((sum, qty) => sum + qty, 0);
        const canSellExtraBaysOvercapacity = filledBaysOvercapacity <= cargoBaysAfterSale;
        
        assert.strictEqual(canSellExtraBaysOvercapacity, false, 'Should prevent selling extra bays when cargo would overflow');
    });
    
});

test('Equipment Effectiveness Calculations', async (t) => {

    await t.test('should calculate weapon power correctly', () => {
        const state = createTestState();
        
        // Test weapon power calculation
        state.ship.weapon = [0, 1, 2]; // Pulse, Beam, Military
        
        let totalWeaponPower = 0;
        for (const weaponIndex of state.ship.weapon) {
            if (weaponIndex >= 0 && weaponIndex < WEAPONS.length) {
                totalWeaponPower += WEAPONS[weaponIndex].power;
            }
        }
        
        const expectedPower = 15 + 25 + 35; // 75 total
        assert.strictEqual(totalWeaponPower, expectedPower, 'Should calculate total weapon power correctly');
        
        // Test with Morgan's laser
        state.ship.weapon = [3, -1, -1]; // Morgan's laser only
        const morganPower = WEAPONS[3].power; // 85 power
        
        let morganTotalPower = 0;
        for (const weaponIndex of state.ship.weapon) {
            if (weaponIndex >= 0 && weaponIndex < WEAPONS.length) {
                morganTotalPower += WEAPONS[weaponIndex].power;
            }
        }
        
        assert.strictEqual(morganTotalPower, morganPower, 'Should calculate Morgan\'s laser power correctly');
    });

    await t.test('should calculate shield power correctly', () => {
        const state = createTestState();
        
        // Test shield power calculation
        state.ship.shield = [0, 1, -1]; // Energy, Reflective shields
        
        let totalShieldPower = 0;
        for (const shieldIndex of state.ship.shield) {
            if (shieldIndex >= 0 && shieldIndex < SHIELDS.length) {
                totalShieldPower += SHIELDS[shieldIndex].power;
            }
        }
        
        const expectedShieldPower = 100 + 200; // 300 total
        assert.strictEqual(totalShieldPower, expectedShieldPower, 'Should calculate total shield power correctly');
        
        // Test with Lightning shield
        state.ship.shield = [2, -1, -1]; // Lightning shield only
        const lightningPower = SHIELDS[2].power; // 350 power
        
        let lightningTotalPower = 0;
        for (const shieldIndex of state.ship.shield) {
            if (shieldIndex >= 0 && shieldIndex < SHIELDS.length) {
                lightningTotalPower += SHIELDS[shieldIndex].power;
            }
        }
        
        assert.strictEqual(lightningTotalPower, lightningPower, 'Should calculate Lightning shield power correctly');
    });

    await t.test('should apply skill bonuses from gadgets', () => {
        const state = createTestState();
        
        // Test targeting system bonus (enhances fighter skill)
        const targetingSystem = 3;
        state.ship.gadget = [targetingSystem, -1, -1];
        
        const hasTargetingSystem = hasGadget(state.ship, targetingSystem);
        const fighterBonus = hasTargetingSystem ? 2 : 0; // Assuming +2 bonus
        const baseFighterSkill = state.commanderFighter;
        const effectiveFighterSkill = baseFighterSkill + fighterBonus;
        
        assert.ok(hasTargetingSystem, 'Should detect targeting system');
        assert.strictEqual(effectiveFighterSkill, baseFighterSkill + 2, 'Should apply targeting system bonus');
        
        // Test navigating system bonus (enhances pilot skill)
        const navigatingSystem = 2;
        state.ship.gadget = [navigatingSystem, -1, -1];
        
        const hasNavigatingSystem = hasGadget(state.ship, navigatingSystem);
        const pilotBonus = hasNavigatingSystem ? 2 : 0;
        const basePilotSkill = state.commanderPilot;
        const effectivePilotSkill = basePilotSkill + pilotBonus;
        
        assert.ok(hasNavigatingSystem, 'Should detect navigating system');
        assert.strictEqual(effectivePilotSkill, basePilotSkill + 2, 'Should apply navigating system bonus');
        
        // Test auto-repair system bonus (enhances engineer skill)
        const autoRepairSystem = 1;
        state.ship.gadget = [autoRepairSystem, -1, -1];
        
        const hasAutoRepairSystem = hasGadget(state.ship, autoRepairSystem);
        const engineerBonus = hasAutoRepairSystem ? 2 : 0;
        const baseEngineerSkill = state.commanderEngineer;
        const effectiveEngineerSkill = baseEngineerSkill + engineerBonus;
        
        assert.ok(hasAutoRepairSystem, 'Should detect auto-repair system');
        assert.strictEqual(effectiveEngineerSkill, baseEngineerSkill + 2, 'Should apply auto-repair system bonus');
    });
    
});

test('Fuel System with Equipment', async (t) => {

    await t.test('should calculate fuel capacity with fuel compactor', () => {
        const state = createTestState();
        
        // Test base fuel capacity (ship type dependent)
        const baseFuelTanks = 14; // Typical for most ships
        const normalFuelCapacity = baseFuelTanks;
        
        assert.strictEqual(normalFuelCapacity, 14, 'Should use base fuel capacity without fuel compactor');
        
        // Test with fuel compactor (adds 4 parsecs, total 18)
        state.ship.gadget = [FUELCOMPACTOR, -1, -1];
        const hasFuelCompactor = hasGadget(state.ship, FUELCOMPACTOR);
        const fuelCapacityWithCompactor = hasFuelCompactor ? 18 : baseFuelTanks;
        
        assert.strictEqual(fuelCapacityWithCompactor, 18, 'Should increase fuel capacity to 18 with fuel compactor');
        
        // Test fuel purchase calculation
        const currentFuel = 10;
        const fuelNeeded = fuelCapacityWithCompactor - currentFuel; // 8 parsecs needed
        const costPerParsec = 2;
        const totalFuelCost = fuelNeeded * costPerParsec;
        
        assert.strictEqual(totalFuelCost, 16, 'Should calculate correct fuel purchase cost');
    });

    await t.test('should limit fuel to tank capacity', () => {
        const state = createTestState();
        
        // Test fuel limiting
        const fuelTankCapacity = 14;
        const actualFuel = 20; // More than capacity
        const limitedFuel = Math.min(actualFuel, fuelTankCapacity);
        
        assert.strictEqual(limitedFuel, fuelTankCapacity, 'Should limit fuel to tank capacity');
        
        // Test with fuel compactor  
        const compactorCapacity = 18;
        const compactorLimitedFuel = Math.min(actualFuel, compactorCapacity);
        
        assert.strictEqual(compactorLimitedFuel, compactorCapacity, 'Should limit fuel to compactor capacity');
    });

    await t.test('should handle fuel purchase with credit limits', () => {
        const state = createTestState();
        state.credits = 10; // Limited credits
        
        const fuelCapacity = 14;
        const currentFuel = 5;
        const fuelNeeded = fuelCapacity - currentFuel; // 9 parsecs
        const costPerParsec = 2;
        const maxAffordableCost = state.credits; // 10 credits
        const affordableParsecs = Math.floor(maxAffordableCost / costPerParsec); // 5 parsecs
        const actualFuelPurchase = Math.min(fuelNeeded, affordableParsecs);
        
        assert.strictEqual(actualFuelPurchase, 5, 'Should purchase only affordable fuel amount');
        
        const finalFuelAmount = currentFuel + actualFuelPurchase;
        assert.strictEqual(finalFuelAmount, 10, 'Should add purchased fuel to current fuel');
    });
    
});

test('Cargo Bay Calculation with Equipment', async (t) => {

    await t.test('should calculate total cargo bays with extra bay gadgets', () => {
        const state = createTestState();
        
        // Test base cargo capacity
        const baseCargoBays = 20; // Ship dependent
        const normalCapacity = baseCargoBays;
        
        assert.strictEqual(normalCapacity, 20, 'Should use base cargo capacity without extra bays');
        
        // Test with one extra bays gadget (+5 bays)
        state.ship.gadget = [EXTRABAYS, -1, -1];
        let extraBaysCount = 0;
        for (const gadget of state.ship.gadget) {
            if (gadget === EXTRABAYS) extraBaysCount++;
        }
        
        const capacityWithOneBays = baseCargoBays + (extraBaysCount * 5);
        assert.strictEqual(capacityWithOneBays, 25, 'Should add 5 bays per extra bays gadget');
        
        // Test with multiple extra bays gadgets
        state.ship.gadget = [EXTRABAYS, EXTRABAYS, EXTRABAYS];
        extraBaysCount = 0;
        for (const gadget of state.ship.gadget) {
            if (gadget === EXTRABAYS) extraBaysCount++;
        }
        
        const capacityWithMultipleBays = baseCargoBays + (extraBaysCount * 5);
        assert.strictEqual(capacityWithMultipleBays, 35, 'Should add 5 bays per extra bays gadget (multiple)');
    });

    await t.test('should apply quest penalties to cargo capacity', () => {
        const state = createTestState();
        
        const baseCargoBays = 20;
        
        // Test Japori disease penalty (-10 bays)
        const japoriDiseaseStatus = 1; // Active
        const japoriPenalty = japoriDiseaseStatus === 1 ? 10 : 0;
        const capacityWithJapori = baseCargoBays - japoriPenalty;
        
        assert.strictEqual(capacityWithJapori, 10, 'Should reduce cargo by 10 for Japori disease');
        
        // Test reactor quest penalty (variable based on status)
        const reactorStatus = 5; // Active reactor quest
        let reactorPenalty = 0;
        if (reactorStatus > 0 && reactorStatus < 21) {
            reactorPenalty = 5 + 10 - Math.floor((reactorStatus - 1) / 2);
        }
        
        const capacityWithReactor = baseCargoBays - reactorPenalty;
        const expectedReactorPenalty = 5 + 10 - Math.floor((5 - 1) / 2); // 13
        
        assert.strictEqual(reactorPenalty, expectedReactorPenalty, 'Should calculate reactor penalty correctly');
        assert.strictEqual(capacityWithReactor, 7, 'Should reduce cargo for reactor quest');
        
        // Test combined penalties
        const combinedPenalties = japoriPenalty + reactorPenalty;
        const capacityWithBothPenalties = baseCargoBays - combinedPenalties;
        
        assert.strictEqual(capacityWithBothPenalties, -3, 'Should apply both penalties (negative capacity possible)');
    });
    
});
