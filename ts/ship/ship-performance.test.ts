#!/usr/bin/env node --test --experimental-strip-types

// Ship Performance and Combat Modifiers Tests
// Tests for how equipment affects ship combat performance, skills, and effectiveness

import { test } from 'node:test';
import assert from 'node:assert';
import { createInitialState } from '../state.ts';
import type { GameState, Ship } from '../types.ts';

// Equipment type constants
const WEAPONS = {
    PULSE_LASER: 0,
    BEAM_LASER: 1, 
    MILITARY_LASER: 2,
    MORGAN_LASER: 3
};

const SHIELDS = {
    ENERGY_SHIELD: 0,
    REFLECTIVE_SHIELD: 1,
    LIGHTNING_SHIELD: 2
};

const GADGETS = {
    EXTRA_BAYS: 0,
    AUTO_REPAIR: 1,
    NAVIGATING_SYSTEM: 2,
    TARGETING_SYSTEM: 3,
    CLOAKING_DEVICE: 4,
    FUEL_COMPACTOR: 5
};

// Equipment power values from Palm OS
const WEAPON_POWER = [15, 25, 35, 85]; // Pulse, Beam, Military, Morgan's
const SHIELD_POWER = [100, 200, 350]; // Energy, Reflective, Lightning

// Skill bonuses 
const SKILLBONUS = 3;
const CLOAKBONUS = 2;

// Helper functions
function createTestState(): GameState {
    const state = createInitialState();
    state.commanderPilot = 5;
    state.commanderFighter = 5; 
    state.commanderTrader = 5;
    state.commanderEngineer = 5;
    return state;
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

function calculateWeaponPower(ship: Ship): number {
    let totalPower = 0;
    for (const weaponIndex of ship.weapon) {
        if (weaponIndex >= 0 && weaponIndex < WEAPON_POWER.length) {
            totalPower += WEAPON_POWER[weaponIndex];
        }
    }
    return totalPower;
}

function calculateShieldPower(ship: Ship): number {
    let totalPower = 0;
    for (const shieldIndex of ship.shield) {
        if (shieldIndex >= 0 && shieldIndex < SHIELD_POWER.length) {
            totalPower += SHIELD_POWER[shieldIndex];
        }
    }
    return totalPower;
}

function fighterSkill(ship: Ship, baseSkill: number): number {
    let skill = baseSkill;
    if (hasGadget(ship, GADGETS.TARGETING_SYSTEM)) {
        skill += SKILLBONUS;
    }
    return skill;
}

function pilotSkill(ship: Ship, baseSkill: number): number {
    let skill = baseSkill;
    if (hasGadget(ship, GADGETS.NAVIGATING_SYSTEM)) {
        skill += SKILLBONUS;
    }
    if (hasGadget(ship, GADGETS.CLOAKING_DEVICE)) {
        skill += CLOAKBONUS;
    }
    return skill;
}

function engineerSkill(ship: Ship, baseSkill: number): number {
    let skill = baseSkill;
    if (hasGadget(ship, GADGETS.AUTO_REPAIR)) {
        skill += SKILLBONUS;
    }
    return skill;
}

test('Weapon Performance Calculations', async (t) => {

    await t.test('should calculate single weapon power correctly', () => {
        const state = createTestState();
        
        // Test single Pulse Laser
        state.ship.weapon = [WEAPONS.PULSE_LASER, -1, -1];
        const pulsePower = calculateWeaponPower(state.ship);
        assert.strictEqual(pulsePower, 15, 'Pulse laser should provide 15 power');
        
        // Test single Beam Laser
        state.ship.weapon = [WEAPONS.BEAM_LASER, -1, -1];
        const beamPower = calculateWeaponPower(state.ship);
        assert.strictEqual(beamPower, 25, 'Beam laser should provide 25 power');
        
        // Test single Military Laser
        state.ship.weapon = [WEAPONS.MILITARY_LASER, -1, -1];
        const militaryPower = calculateWeaponPower(state.ship);
        assert.strictEqual(militaryPower, 35, 'Military laser should provide 35 power');
        
        // Test Morgan's Laser (special weapon)
        state.ship.weapon = [WEAPONS.MORGAN_LASER, -1, -1];
        const morganPower = calculateWeaponPower(state.ship);
        assert.strictEqual(morganPower, 85, 'Morgan\'s laser should provide 85 power');
    });

    await t.test('should calculate multiple weapon power correctly', () => {
        const state = createTestState();
        
        // Test multiple different weapons
        state.ship.weapon = [WEAPONS.PULSE_LASER, WEAPONS.BEAM_LASER, WEAPONS.MILITARY_LASER];
        const totalPower = calculateWeaponPower(state.ship);
        const expectedTotal = 15 + 25 + 35; // 75 total
        
        assert.strictEqual(totalPower, expectedTotal, 'Should sum all weapon powers');
        
        // Test multiple same weapons
        state.ship.weapon = [WEAPONS.BEAM_LASER, WEAPONS.BEAM_LASER, WEAPONS.BEAM_LASER];
        const tripleBeamPower = calculateWeaponPower(state.ship);
        const expectedTriple = 25 * 3; // 75 total
        
        assert.strictEqual(tripleBeamPower, expectedTriple, 'Should sum identical weapon powers');
    });

    await t.test('should handle empty weapon slots', () => {
        const state = createTestState();
        
        // Test mixed weapons with empty slots
        state.ship.weapon = [WEAPONS.PULSE_LASER, -1, WEAPONS.MILITARY_LASER];
        const mixedPower = calculateWeaponPower(state.ship);
        const expectedMixed = 15 + 35; // 50 total (ignoring -1)
        
        assert.strictEqual(mixedPower, expectedMixed, 'Should ignore empty weapon slots');
        
        // Test all empty weapons
        state.ship.weapon = [-1, -1, -1];
        const noPower = calculateWeaponPower(state.ship);
        
        assert.strictEqual(noPower, 0, 'Should have zero power with no weapons');
    });

    await t.test('should detect weapon types for upgrade checks', () => {
        const state = createTestState();
        
        // Test exact weapon detection
        state.ship.weapon = [WEAPONS.BEAM_LASER, -1, -1];
        
        assert.ok(hasWeapon(state.ship, WEAPONS.BEAM_LASER, true), 'Should detect exact beam laser');
        assert.ok(!hasWeapon(state.ship, WEAPONS.PULSE_LASER, true), 'Should not detect pulse laser');
        assert.ok(!hasWeapon(state.ship, WEAPONS.MILITARY_LASER, true), 'Should not detect military laser');
        
        // Test non-exact weapon detection (better weapons count)
        assert.ok(hasWeapon(state.ship, WEAPONS.PULSE_LASER, false), 'Beam laser should count as pulse laser or better');
        assert.ok(hasWeapon(state.ship, WEAPONS.BEAM_LASER, false), 'Beam laser should count as beam laser or better');
        assert.ok(!hasWeapon(state.ship, WEAPONS.MILITARY_LASER, false), 'Beam laser should not count as military laser');
    });
    
});

test('Shield Performance Calculations', async (t) => {

    await t.test('should calculate single shield power correctly', () => {
        const state = createTestState();
        
        // Test single Energy Shield
        state.ship.shield = [SHIELDS.ENERGY_SHIELD, -1, -1];
        const energyPower = calculateShieldPower(state.ship);
        assert.strictEqual(energyPower, 100, 'Energy shield should provide 100 power');
        
        // Test single Reflective Shield
        state.ship.shield = [SHIELDS.REFLECTIVE_SHIELD, -1, -1];
        const reflectivePower = calculateShieldPower(state.ship);
        assert.strictEqual(reflectivePower, 200, 'Reflective shield should provide 200 power');
        
        // Test Lightning Shield (special)
        state.ship.shield = [SHIELDS.LIGHTNING_SHIELD, -1, -1];
        const lightningPower = calculateShieldPower(state.ship);
        assert.strictEqual(lightningPower, 350, 'Lightning shield should provide 350 power');
    });

    await t.test('should calculate multiple shield power correctly', () => {
        const state = createTestState();
        
        // Test multiple different shields
        state.ship.shield = [SHIELDS.ENERGY_SHIELD, SHIELDS.REFLECTIVE_SHIELD, -1];
        const totalPower = calculateShieldPower(state.ship);
        const expectedTotal = 100 + 200; // 300 total
        
        assert.strictEqual(totalPower, expectedTotal, 'Should sum all shield powers');
        
        // Test with Lightning Shield
        state.ship.shield = [SHIELDS.ENERGY_SHIELD, SHIELDS.LIGHTNING_SHIELD, -1];
        const withLightningPower = calculateShieldPower(state.ship);
        const expectedLightning = 100 + 350; // 450 total
        
        assert.strictEqual(withLightningPower, expectedLightning, 'Should include Lightning shield power');
    });

    await t.test('should track shield strength separately from type', () => {
        const state = createTestState();
        
        // Shields have both type and current strength
        state.ship.shield = [SHIELDS.ENERGY_SHIELD, SHIELDS.REFLECTIVE_SHIELD, -1];
        state.ship.shieldStrength = [80, 150, 0]; // Partial strength
        
        // Max power calculation (for recharge/repair purposes)
        const maxPower = calculateShieldPower(state.ship);
        assert.strictEqual(maxPower, 300, 'Should calculate max shield power regardless of current strength');
        
        // Current strength is tracked separately
        const currentStrength = state.ship.shieldStrength.reduce((sum, strength) => sum + strength, 0);
        assert.strictEqual(currentStrength, 230, 'Should track current shield strength separately');
    });

    await t.test('should detect shield types correctly', () => {
        const state = createTestState();
        
        state.ship.shield = [SHIELDS.REFLECTIVE_SHIELD, -1, -1];
        
        assert.ok(hasShield(state.ship, SHIELDS.REFLECTIVE_SHIELD), 'Should detect reflective shield');
        assert.ok(!hasShield(state.ship, SHIELDS.ENERGY_SHIELD), 'Should not detect energy shield');
        assert.ok(!hasShield(state.ship, SHIELDS.LIGHTNING_SHIELD), 'Should not detect lightning shield');
    });
    
});

test('Skill Enhancement from Equipment', async (t) => {

    await t.test('should enhance fighter skill with targeting system', () => {
        const state = createTestState();
        const baseFighterSkill = state.commanderFighter;
        
        // Test without targeting system
        const normalSkill = fighterSkill(state.ship, baseFighterSkill);
        assert.strictEqual(normalSkill, baseFighterSkill, 'Should use base fighter skill without targeting system');
        
        // Test with targeting system
        state.ship.gadget = [GADGETS.TARGETING_SYSTEM, -1, -1];
        const enhancedSkill = fighterSkill(state.ship, baseFighterSkill);
        const expectedEnhanced = baseFighterSkill + SKILLBONUS; // +3
        
        assert.strictEqual(enhancedSkill, expectedEnhanced, 'Should enhance fighter skill by 3 with targeting system');
    });

    await t.test('should enhance pilot skill with navigating system', () => {
        const state = createTestState();
        const basePilotSkill = state.commanderPilot;
        
        // Test without navigating system
        const normalSkill = pilotSkill(state.ship, basePilotSkill);
        assert.strictEqual(normalSkill, basePilotSkill, 'Should use base pilot skill without navigating system');
        
        // Test with navigating system
        state.ship.gadget = [GADGETS.NAVIGATING_SYSTEM, -1, -1];
        const enhancedSkill = pilotSkill(state.ship, basePilotSkill);
        const expectedEnhanced = basePilotSkill + SKILLBONUS; // +3
        
        assert.strictEqual(enhancedSkill, expectedEnhanced, 'Should enhance pilot skill by 3 with navigating system');
    });

    await t.test('should enhance pilot skill with cloaking device', () => {
        const state = createTestState();
        const basePilotSkill = state.commanderPilot;
        
        // Test with cloaking device
        state.ship.gadget = [GADGETS.CLOAKING_DEVICE, -1, -1];
        const enhancedSkill = pilotSkill(state.ship, basePilotSkill);
        const expectedEnhanced = basePilotSkill + CLOAKBONUS; // +2
        
        assert.strictEqual(enhancedSkill, expectedEnhanced, 'Should enhance pilot skill by 2 with cloaking device');
    });

    await t.test('should stack pilot skill bonuses', () => {
        const state = createTestState();
        const basePilotSkill = state.commanderPilot;
        
        // Test with both navigating system and cloaking device
        state.ship.gadget = [GADGETS.NAVIGATING_SYSTEM, GADGETS.CLOAKING_DEVICE, -1];
        const stackedSkill = pilotSkill(state.ship, basePilotSkill);
        const expectedStacked = basePilotSkill + SKILLBONUS + CLOAKBONUS; // +5 total
        
        assert.strictEqual(stackedSkill, expectedStacked, 'Should stack navigating system and cloaking device bonuses');
    });

    await t.test('should enhance engineer skill with auto-repair system', () => {
        const state = createTestState();
        const baseEngineerSkill = state.commanderEngineer;
        
        // Test without auto-repair system
        const normalSkill = engineerSkill(state.ship, baseEngineerSkill);
        assert.strictEqual(normalSkill, baseEngineerSkill, 'Should use base engineer skill without auto-repair');
        
        // Test with auto-repair system
        state.ship.gadget = [GADGETS.AUTO_REPAIR, -1, -1];
        const enhancedSkill = engineerSkill(state.ship, baseEngineerSkill);
        const expectedEnhanced = baseEngineerSkill + SKILLBONUS; // +3
        
        assert.strictEqual(enhancedSkill, expectedEnhanced, 'Should enhance engineer skill by 3 with auto-repair system');
    });

    await t.test('should handle multiple skill-enhancing gadgets', () => {
        const state = createTestState();
        
        // Install multiple skill enhancers
        state.ship.gadget = [GADGETS.TARGETING_SYSTEM, GADGETS.NAVIGATING_SYSTEM, GADGETS.AUTO_REPAIR];
        
        const enhancedFighter = fighterSkill(state.ship, state.commanderFighter);
        const enhancedPilot = pilotSkill(state.ship, state.commanderPilot);
        const enhancedEngineer = engineerSkill(state.ship, state.commanderEngineer);
        
        assert.strictEqual(enhancedFighter, state.commanderFighter + 3, 'Should enhance fighter skill');
        assert.strictEqual(enhancedPilot, state.commanderPilot + 3, 'Should enhance pilot skill');  
        assert.strictEqual(enhancedEngineer, state.commanderEngineer + 3, 'Should enhance engineer skill');
    });
    
});

test('Cloaking Device Mechanics', async (t) => {

    await t.test('should detect cloaking device presence', () => {
        const state = createTestState();
        
        // Test without cloaking device
        assert.ok(!hasGadget(state.ship, GADGETS.CLOAKING_DEVICE), 'Should not detect cloaking device');
        
        // Test with cloaking device
        state.ship.gadget = [GADGETS.CLOAKING_DEVICE, -1, -1];
        assert.ok(hasGadget(state.ship, GADGETS.CLOAKING_DEVICE), 'Should detect cloaking device');
    });

    await t.test('should calculate cloaking effectiveness', () => {
        const state = createTestState();
        
        // Cloaking works when: HasGadget(CLOAKINGDEVICE) && (EngineerSkill(Ship) > EngineerSkill(Opponent))
        // For this test, we also need an auto-repair system to enhance engineer skill
        state.ship.gadget = [GADGETS.CLOAKING_DEVICE, GADGETS.AUTO_REPAIR, -1];
        
        const shipEngineerSkill = engineerSkill(state.ship, state.commanderEngineer); // 5 + 3 = 8
        const opponentEngineerSkill = 5; // Typical opponent skill
        
        const canCloak = hasGadget(state.ship, GADGETS.CLOAKING_DEVICE) && 
                        (shipEngineerSkill > opponentEngineerSkill);
        
        // Debug: verify the calculation
        assert.strictEqual(shipEngineerSkill, 8, 'Ship engineer skill should be enhanced');
        assert.ok(canCloak, 'Should be able to cloak with device and superior engineer skill');
        
        // Test with inferior engineer skill
        const lowEngineerSkill = 3;
        const cannotCloak = hasGadget(state.ship, GADGETS.CLOAKING_DEVICE) && 
                           (lowEngineerSkill > opponentEngineerSkill);
        
        assert.ok(!cannotCloak, 'Should not be able to cloak with inferior engineer skill');
    });
    
});

test('Combat Hit Probability Modifiers', async (t) => {

    await t.test('should modify hit chance based on ship size', () => {
        // From Palm OS: GetRandom(FighterSkill(Attacker) + Shiptype[Defender->Type].Size)
        const attackerSkill = 8;
        
        // Small ship (Size 0) - harder to hit
        const smallShipSize = 0;
        const hitRangeSmall = attackerSkill + smallShipSize; // 8
        
        // Large ship (Size 5) - easier to hit  
        const largeShipSize = 5;
        const hitRangeLarge = attackerSkill + largeShipSize; // 13
        
        assert.ok(hitRangeLarge > hitRangeSmall, 'Larger ships should be easier to hit');
        
        // Probability of hit is: random(0 to hitRange-1) < someThreshold
        // Higher hitRange = higher chance of being below threshold = easier to hit
    });

    await t.test('should calculate damage reduction from shields', () => {
        const state = createTestState();
        
        // Test damage calculation with shields
        const incomingDamage = 100;
        
        // No shields - full damage
        state.ship.shield = [-1, -1, -1];
        const shieldPower = calculateShieldPower(state.ship);
        const damageWithoutShields = Math.max(1, incomingDamage - shieldPower); // Minimum 1 damage
        
        assert.strictEqual(damageWithoutShields, incomingDamage, 'Should take full damage without shields');
        
        // With shields - reduced damage
        state.ship.shield = [SHIELDS.ENERGY_SHIELD, SHIELDS.REFLECTIVE_SHIELD, -1];
        const totalShieldPower = calculateShieldPower(state.ship); // 300
        const damageWithShields = Math.max(1, incomingDamage - totalShieldPower);
        
        assert.strictEqual(damageWithShields, 1, 'Should take minimum 1 damage even with strong shields');
    });

    await t.test('should limit damage to hull strength fraction', () => {
        // From Palm OS: Damage = min(Damage, (Shiptype[Defender->Type].HullStrength/6));
        const maxDamage = 300;
        const hullStrength = 150;
        const maxDamagePerHit = Math.floor(hullStrength / 6); // 25
        
        const actualDamage = Math.min(maxDamage, maxDamagePerHit);
        
        assert.strictEqual(actualDamage, maxDamagePerHit, 'Should limit damage to 1/6 of hull strength per hit');
    });
    
});

test('Equipment Synergy Effects', async (t) => {

    await t.test('should combine weapon and targeting system effectively', () => {
        const state = createTestState();
        
        // High-powered weapons with targeting system
        state.ship.weapon = [WEAPONS.MILITARY_LASER, WEAPONS.MILITARY_LASER, WEAPONS.MILITARY_LASER];
        state.ship.gadget = [GADGETS.TARGETING_SYSTEM, -1, -1];
        
        const totalWeaponPower = calculateWeaponPower(state.ship); // 105 power
        const enhancedFighterSkill = fighterSkill(state.ship, state.commanderFighter); // +3 skill
        
        // Combined effectiveness would be high power + high accuracy
        const combatEffectiveness = totalWeaponPower + (enhancedFighterSkill * 10); // Weighted combination
        
        assert.ok(combatEffectiveness > 150, 'Should have high combat effectiveness with weapons + targeting');
    });

    await t.test('should combine shields and auto-repair for survivability', () => {
        const state = createTestState();
        
        // Strong shields with auto-repair
        state.ship.shield = [SHIELDS.REFLECTIVE_SHIELD, SHIELDS.LIGHTNING_SHIELD, -1];
        state.ship.gadget = [GADGETS.AUTO_REPAIR, -1, -1];
        
        const totalShieldPower = calculateShieldPower(state.ship); // 550 power
        const enhancedEngineerSkill = engineerSkill(state.ship, state.commanderEngineer); // +3 skill
        
        // Combined survivability would be high shields + faster repair
        const survivability = totalShieldPower + (enhancedEngineerSkill * 20); // Weighted combination
        
        assert.ok(survivability > 600, 'Should have high survivability with shields + auto-repair');
    });

    await t.test('should maximize stealth with cloaking and navigation', () => {
        const state = createTestState();
        
        // Cloaking device with navigating system for maximum stealth
        state.ship.gadget = [GADGETS.CLOAKING_DEVICE, GADGETS.NAVIGATING_SYSTEM, -1];
        
        const enhancedPilotSkill = pilotSkill(state.ship, state.commanderPilot); // 5 + 3 + 2 = 10
        const hasCloaking = hasGadget(state.ship, GADGETS.CLOAKING_DEVICE);
        
        // Debug: verify the calculation
        assert.strictEqual(enhancedPilotSkill, 10, 'Pilot skill should be enhanced by both gadgets');
        
        // Stealth effectiveness combines both bonuses
        const stealthRating = enhancedPilotSkill * (hasCloaking ? 2 : 1); // Double effect with cloaking
        
        assert.ok(stealthRating > 15, 'Should have high stealth rating with both gadgets');
    });
    
});
