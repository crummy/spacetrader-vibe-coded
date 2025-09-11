// UI Fields Generation Tests
// Comprehensive tests for deriving UI information from game state

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getUiFields } from './ui-fields.ts';
import { createInitialState } from '../state.ts';
import { GameMode, SystemStatus } from '../types.ts';

test('ui fields - planet mode basic information', () => {
    const state = createInitialState();
    state.currentMode = GameMode.OnPlanet;
    state.currentSystem = 0; // Acamar
    
    const ui = getUiFields(state);
    
    // Should have location information
    assert.ok(ui.location, 'Should have location information');
    assert.equal(ui.location.systemName, 'Acamar', 'Should show current system name');
    assert.equal(ui.location.statusMessage, 'under no particular pressure', 'Should show default status');
    
    // Should have primary message
    assert.equal(ui.primary, 'Docked at Acamar', 'Should show docked message');
    
    // Should have ship status
    assert.ok(ui.ship, 'Should have ship information');
    assert.equal(ui.ship.repairStatus, 'No repairs are needed.', 'Should show no repair needed for full hull');
    assert.ok(ui.ship.fuelStatus.includes('You have fuel to fly'), 'Should show fuel status');
});

test('ui fields - system status messages', () => {
    const state = createInitialState();
    state.currentMode = GameMode.OnPlanet;
    
    // Test different system statuses
    const statusTests = [
        { status: SystemStatus.Uneventful, expected: 'under no particular pressure' },
        { status: SystemStatus.War, expected: 'at war' },
        { status: SystemStatus.Plague, expected: 'ravaged by a plague' },
        { status: SystemStatus.Drought, expected: 'suffering from a drought' },
        { status: SystemStatus.Boredom, expected: 'suffering from extreme boredom' },
        { status: SystemStatus.Cold, expected: 'suffering from a cold spell' },
        { status: SystemStatus.CropFailure, expected: 'suffering from a crop failure' },
        { status: SystemStatus.LackOfWorkers, expected: 'lacking enough workers' }
    ];
    
    statusTests.forEach(({ status, expected }) => {
        state.solarSystem[state.currentSystem].status = status;
        const ui = getUiFields(state);
        assert.equal(ui.location?.statusMessage, expected, `Should show correct status for ${status}`);
    });
});

test('ui fields - space travel mode', () => {
    const state = createInitialState();
    state.currentMode = GameMode.InSpace;
    state.currentSystem = 0; // Acamar  
    state.warpSystem = 5;     // Different system
    state.clicks = 8;         // Travel in progress
    
    const ui = getUiFields(state);
    
    // Should show travel information
    assert.ok(ui.primary.includes('En route to'), 'Should show travel message');
    assert.ok(ui.primary.includes('8 clicks remaining'), 'Should show remaining clicks');
    
    // Should have travel information in secondary
    assert.ok(ui.secondary.length > 0, 'Should have secondary information');
    assert.ok(ui.secondary.some(msg => msg.includes('Fuel consumption')), 'Should show fuel consumption');
});

test('ui fields - arrived at destination', () => {
    const state = createInitialState();
    state.currentMode = GameMode.InSpace;
    state.currentSystem = 0;
    state.warpSystem = 0; // Same system
    state.clicks = 0;     // Arrived
    
    const ui = getUiFields(state);
    
    assert.ok(ui.primary.includes('Arrived at'), 'Should show arrival message');
});

test('ui fields - combat encounter mode', () => {
    const state = createInitialState();
    state.currentMode = GameMode.InCombat;
    state.currentSystem = 0;
    state.warpSystem = 5;
    state.clicks = 12;
    state.encounterType = 10; // Pirate attack
    state.opponent.type = 2;  // Firefly
    state.opponent.hull = 85;
    
    const ui = getUiFields(state);
    
    // Should have encounter information
    assert.ok(ui.encounter, 'Should have encounter information');
    assert.ok(ui.encounter.locationMessage.includes('12 clicks from'), 'Should show location');
    assert.ok(ui.encounter.locationMessage.includes('encountered a'), 'Should show encounter type');
    assert.ok(ui.encounter.opponentDescription.includes('Hull: 85'), 'Should show opponent hull');
    
    // Should have combat status
    assert.ok(ui.encounter.combatStatus.length > 0, 'Should have combat status');
    assert.ok(ui.encounter.tacticalInfo.length > 0, 'Should have tactical information');
});

test('ui fields - ship damage and repair costs', () => {
    const state = createInitialState();
    state.currentMode = GameMode.OnPlanet;
    state.ship.hull = 65; // Damaged (normal max is 100)
    
    const ui = getUiFields(state);
    
    assert.ok(ui.ship?.repairStatus.includes('Full repair will cost'), 'Should show repair cost for damaged ship');
    assert.ok(ui.ship?.repairStatus.includes('cr.'), 'Should mention repair cost in credits');
});

test('ui fields - critical ship warnings', () => {
    const state = createInitialState();
    state.currentMode = GameMode.OnPlanet;
    state.ship.hull = 25;  // Critical damage (30% of 100)
    state.ship.fuel = 2;   // Critical fuel
    
    const ui = getUiFields(state);
    
    // Should have critical warnings
    assert.ok(ui.warnings.some(w => w.includes('Your hull strength is at')), 'Should warn about critical hull damage');
    assert.ok(ui.warnings.some(w => w.includes('You have fuel to fly')), 'Should warn about critical fuel');
    assert.ok(ui.ship?.warnings.some(w => w.includes('Your hull strength is at')), 'Should have ship-specific warnings');
});

test('ui fields - financial information', () => {
    const state = createInitialState();
    state.currentMode = GameMode.OnPlanet;
    state.credits = 15000;
    state.debt = 5000;
    
    const ui = getUiFields(state);
    
    assert.ok(ui.financial, 'Should have financial information');
    assert.equal(ui.financial.creditStatus, '15,000 cr.', 'Should show formatted credits');
    assert.equal(ui.financial.debtStatus, 'You have a debt of 5,000 credits.', 'Should show debt information');
});

test('ui fields - debt warnings', () => {
    const state = createInitialState();
    state.currentMode = GameMode.OnPlanet;
    state.debt = 80000; // Above warning threshold
    
    const ui = getUiFields(state);
    
    assert.ok(ui.warnings.some(w => w.includes('You have a debt of')), 'Should warn about high debt');
});

test('ui fields - escape pod requirement', () => {
    const state = createInitialState();
    state.currentMode = GameMode.OnPlanet;
    state.credits = 1500;   // Below escape pod cost (2000)
    state.escapePod = false; // No escape pod
    
    const ui = getUiFields(state);
    
    assert.ok(ui.financial?.purchaseRequirements.some(req => 
        req.includes('You need 2000 cr. for an escape pod.')
    ), 'Should show escape pod requirement');
});

test('ui fields - cargo status', () => {
    const state = createInitialState();
    state.currentMode = GameMode.OnPlanet;
    state.ship.cargo[0] = 5; // Water
    state.ship.cargo[2] = 3; // Food
    
    const ui = getUiFields(state);
    
    assert.ok(ui.ship?.cargoStatus.includes('5 Water'), 'Should show cargo items');
    assert.ok(ui.ship?.cargoStatus.includes('3 Food'), 'Should list cargo items');
    assert.ok(ui.ship?.cargoStatus.endsWith('.'), 'Should end with period');
});

test('ui fields - empty cargo hold', () => {
    const state = createInitialState();
    state.currentMode = GameMode.OnPlanet;
    // Default state has empty cargo
    
    const ui = getUiFields(state);
    
    assert.equal(ui.ship?.cargoStatus, 'No cargo.', 'Should show empty cargo message');
});

test('ui fields - equipment status', () => {
    const state = createInitialState();
    state.currentMode = GameMode.OnPlanet;
    state.ship.weapon[0] = 0; // Pulse Laser
    state.ship.shield[0] = 0; // Energy Shield
    
    const ui = getUiFields(state);
    
    assert.ok(ui.ship?.equipmentStatus.some(eq => eq.includes('Pulse laser')), 'Should show installed weapons');
    assert.ok(ui.ship?.equipmentStatus.some(eq => eq.includes('Energy shield')), 'Should show installed shields');
});

test('ui fields - active quests', () => {
    const state = createInitialState();
    state.currentMode = GameMode.OnPlanet;
    state.japoriDiseaseStatus = 1; // Active Japori quest
    state.monsterStatus = 1;       // Active monster quest
    
    const ui = getUiFields(state);
    
    assert.ok(ui.quests?.activeQuests.some(quest => 
        quest.includes('Deliver antidote to Japori.')
    ), 'Should show Japori disease quest');
    
    assert.ok(ui.quests?.activeQuests.some(quest => 
        quest.includes('Kill the space monster at Acamar.')
    ), 'Should show monster hunt quest');
});

test('ui fields - tribble warnings', () => {
    const state = createInitialState();
    state.currentMode = GameMode.OnPlanet;
    state.ship.tribbles = 150; // Above warning threshold
    
    const ui = getUiFields(state);
    
    assert.ok(ui.quests?.specialNotices.some(notice => 
        notice.includes('150 cute, furry tribbles.')
    ), 'Should show tribble count');
    
    assert.ok(ui.warnings.includes('An infestation of tribbles.'), 
        'Should warn about tribble overpopulation');
});

test('ui fields - resource flavor text', () => {
    const state = createInitialState();
    state.currentMode = GameMode.OnPlanet;
    state.solarSystem[state.currentSystem].specialResources = 1; // Mineral rich
    
    const ui = getUiFields(state);
    
    assert.ok(ui.flavor.some(text => 
        text.includes('Mineral rich')
    ), 'Should show resource flavor text');
});

test('ui fields - market conditions', () => {
    const state = createInitialState();
    state.currentMode = GameMode.OnPlanet;
    state.solarSystem[state.currentSystem].techLevel = 8; // High tech
    state.solarSystem[state.currentSystem].size = 4;     // Large
    
    const ui = getUiFields(state);
    
    assert.ok(ui.location?.marketConditions.some(cond => 
        cond.includes('High-tech market')
    ), 'Should show high-tech market condition');
    
    assert.ok(ui.location?.marketConditions.some(cond => 
        cond.includes('Large market')
    ), 'Should show large market condition');
});

test('ui fields - combat tactical information', () => {
    const state = createInitialState();
    state.currentMode = GameMode.InCombat;
    state.ship.weapon[0] = 2;     // Military laser (35 power)
    state.opponent.weapon[0] = 0; // Pulse laser (15 power)
    
    const ui = getUiFields(state);
    
    assert.ok(ui.encounter?.tacticalInfo.some(info => 
        info.includes('superior firepower')
    ), 'Should show tactical advantage');
});

test('ui fields - primary message fallbacks', () => {
    const state = createInitialState();
    
    // Test each mode has appropriate primary message
    state.currentMode = GameMode.OnPlanet;
    let ui = getUiFields(state);
    assert.ok(ui.primary.length > 0, 'Should have primary message for planet mode');
    
    state.currentMode = GameMode.InSpace;
    ui = getUiFields(state);
    assert.ok(ui.primary.length > 0, 'Should have primary message for space mode');
    
    state.currentMode = GameMode.InCombat;
    ui = getUiFields(state);
    assert.ok(ui.primary.length > 0, 'Should have primary message for combat mode');
});

test('ui fields - structure consistency', () => {
    const state = createInitialState();
    const ui = getUiFields(state);
    
    // Verify required fields exist
    assert.ok(typeof ui.primary === 'string', 'Primary should be string');
    assert.ok(Array.isArray(ui.secondary), 'Secondary should be array');
    assert.ok(Array.isArray(ui.warnings), 'Warnings should be array');
    assert.ok(Array.isArray(ui.flavor), 'Flavor should be array');
    
    // Verify contextual fields have proper structure when present
    if (ui.location) {
        assert.ok(typeof ui.location.systemName === 'string', 'System name should be string');
        assert.ok(typeof ui.location.statusMessage === 'string', 'Status message should be string');
        assert.ok(Array.isArray(ui.location.specialEvents), 'Special events should be array');
        assert.ok(Array.isArray(ui.location.marketConditions), 'Market conditions should be array');
    }
    
    if (ui.ship) {
        assert.ok(typeof ui.ship.repairStatus === 'string', 'Repair status should be string');
        assert.ok(typeof ui.ship.fuelStatus === 'string', 'Fuel status should be string');
        assert.ok(typeof ui.ship.cargoStatus === 'string', 'Cargo status should be string');
        assert.ok(Array.isArray(ui.ship.equipmentStatus), 'Equipment status should be array');
        assert.ok(Array.isArray(ui.ship.warnings), 'Ship warnings should be array');
    }
});
