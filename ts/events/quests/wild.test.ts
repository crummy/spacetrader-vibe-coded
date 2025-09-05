// Jonathan Wild Quest Tests
// Tests for the notorious criminal transport quest from Palm OS Space Trader

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../../state.ts';
import {
    pickupWild,
    completeWildDelivery,
    wildArrested,
    wildLeavesShip,
    isWildPickupAvailable,
    isWildDeliveryAvailable,
    hasRequiredWeapon,
    getAvailableCrewQuarters,
    getWildStatus
} from './wild.ts';

// Define police record scores locally since they're not exported as constants
const PoliceRecordScore = {
    PSYCHOPATH: -70,
    VILLAIN: -30,
    CRIMINAL: -10,
    DUBIOUS: -5,
    CLEAN: 0,
    LAWFUL: 5,
    TRUSTED: 10,
    HELPER: 25,
    HERO: 75
};

const KRAVAT_SYSTEM_ID = 50;
const BEAM_LASER_WEAPON = 2;

test('wild quest - initial state and availability check', () => {
    const state = createInitialState();
    state.wildStatus = 0; // Not started
    state.policeRecordScore = PoliceRecordScore.CLEAN; // Good record
    state.ship.weapon = [BEAM_LASER_WEAPON, -1, -1]; // Has beam laser
    state.ship.type = 4; // Bumblebee (2 crew quarters)
    
    // Should be available if all conditions met
    const available = isWildPickupAvailable(state);
    assert.equal(available, true, 'Wild pickup should be available with good conditions');
    
    const status = getWildStatus(state);
    assert.equal(status.phase, 'pickup_available');
    assert.ok(status.description.includes('Jonathan Wild'));
});

test('wild quest - pickup requires beam laser weapon', () => {
    const state = createInitialState();
    state.wildStatus = 0;
    state.policeRecordScore = PoliceRecordScore.CLEAN;
    state.ship.weapon = [1, -1, -1]; // Only pulse laser (index 1)
    state.ship.type = 4; // Bumblebee (2 crew quarters)
    
    const result = pickupWild(state);
    
    assert.equal(result.success, false);
    assert.ok(result.message?.includes('beam laser'));
    assert.equal(result.state.wildStatus, 0); // Status unchanged
});

test('wild quest - pickup requires good police record', () => {
    const state = createInitialState();
    state.wildStatus = 0;
    state.policeRecordScore = PoliceRecordScore.VILLAIN; // Bad record
    state.ship.weapon = [BEAM_LASER_WEAPON, -1, -1];
    state.ship.type = 4; // Bumblebee (2 crew quarters)
    
    const result = pickupWild(state);
    
    assert.equal(result.success, false);
    assert.ok(result.message?.includes('refuses to trust'));
    assert.equal(result.state.wildStatus, 0);
});

test('wild quest - pickup requires crew quarters', () => {
    const state = createInitialState();
    state.wildStatus = 0;
    state.policeRecordScore = PoliceRecordScore.CLEAN;
    state.ship.weapon = [BEAM_LASER_WEAPON, -1, -1];
    
    // Fill all crew quarters
    state.ship.crew = [0, 1, 2]; // All crew slots occupied
    
    const result = pickupWild(state);
    
    assert.equal(result.success, false);
    assert.ok(result.message?.includes('No crew quarters'));
    assert.equal(result.state.wildStatus, 0);
});

test('wild quest - pickup fails with unstable reactor aboard', () => {
    const state = createInitialState();
    state.wildStatus = 0;
    state.policeRecordScore = PoliceRecordScore.CLEAN;
    state.ship.weapon = [BEAM_LASER_WEAPON, -1, -1];
    state.ship.type = 4; // Bumblebee (2 crew quarters)
    state.reactorStatus = 10; // Reactor is aboard and unstable
    
    const result = pickupWild(state);
    
    assert.equal(result.success, false);
    assert.ok(result.message?.includes('afraid of the unstable reactor'));
    assert.equal(result.state.wildStatus, 0);
});

test('wild quest - successful pickup', () => {
    const state = createInitialState();
    state.wildStatus = 0;
    state.policeRecordScore = PoliceRecordScore.CLEAN;
    state.ship.weapon = [BEAM_LASER_WEAPON, -1, -1];
    state.ship.type = 4; // Bumblebee (2 crew quarters)
    state.ship.crew = [0, -1, -1]; // One crew slot free
    
    const result = pickupWild(state);
    
    assert.equal(result.success, true);
    assert.equal(result.state.wildStatus, 1); // Wild is aboard
    assert.ok(result.message?.includes('boards your ship'));
    assert.ok(result.message?.includes('Kravat'));
});

test('wild quest - delivery at wrong system fails', () => {
    const state = createInitialState();
    state.wildStatus = 1; // Wild is aboard
    state.currentSystem = 10; // Not Kravat
    
    const result = completeWildDelivery(state);
    
    assert.equal(result.success, false);
    assert.ok(result.message?.includes('Kravat system'));
    assert.equal(result.state.wildStatus, 1); // Status unchanged
});

test('wild quest - successful delivery at Kravat', () => {
    const state = createInitialState();
    state.wildStatus = 1; // Wild is aboard
    state.currentSystem = KRAVAT_SYSTEM_ID;
    const initialCredits = state.credits;
    
    const result = completeWildDelivery(state);
    
    assert.equal(result.success, true);
    assert.equal(result.state.wildStatus, 2); // Quest completed
    assert.equal(result.state.credits, initialCredits + 10000);
    assert.ok(result.message?.includes('10,000 credits'));
});

test('wild quest - arrest when ship surrenders', () => {
    const state = createInitialState();
    state.wildStatus = 1; // Wild is aboard
    const initialRecord = state.policeRecordScore;
    
    const result = wildArrested(state);
    
    assert.equal(result.success, true);
    assert.equal(result.state.wildStatus, 0); // Quest reset
    assert.equal(result.state.policeRecordScore, initialRecord - 4); // CAUGHTWITHWILDSCORE penalty
    assert.ok(result.message?.includes('police arrest'));
});

test('wild quest - leaves ship when weapons removed', () => {
    const state = createInitialState();
    state.wildStatus = 1; // Wild is aboard
    
    const result = wildLeavesShip(state);
    
    assert.equal(result.success, true);
    assert.equal(result.state.wildStatus, 0); // Quest reset
    assert.ok(result.message?.includes('leaves your ship'));
});

test('wild quest - weapon requirements', () => {
    const state = createInitialState();
    
    // Test no weapons
    state.ship.weapon = [-1, -1, -1];
    assert.equal(hasRequiredWeapon(state), false);
    
    // Test pulse laser (insufficient)
    state.ship.weapon = [1, -1, -1];
    assert.equal(hasRequiredWeapon(state), false);
    
    // Test beam laser (sufficient)
    state.ship.weapon = [BEAM_LASER_WEAPON, -1, -1];
    assert.equal(hasRequiredWeapon(state), true);
    
    // Test military laser (better than required)
    state.ship.weapon = [3, -1, -1];
    assert.equal(hasRequiredWeapon(state), true);
});

test('wild quest - crew quarters calculation', () => {
    const state = createInitialState();
    
    // Test empty ship
    state.ship.crew = [-1, -1, -1];
    state.jarekStatus = 0;
    state.wildStatus = 0;
    
    const quarters1 = getAvailableCrewQuarters(state);
    assert.ok(quarters1 > 0, 'Should have available quarters on empty ship');
    
    // Test with crew members
    state.ship.crew = [0, 1, -1];
    const quarters2 = getAvailableCrewQuarters(state);
    assert.equal(quarters2, quarters1 - 2, 'Should have 2 fewer quarters with 2 crew');
    
    // Test with Jarek aboard
    state.jarekStatus = 1;
    const quarters3 = getAvailableCrewQuarters(state);
    assert.equal(quarters3, quarters2 - 1, 'Should have 1 fewer quarter with Jarek');
    
    // Test with Wild aboard
    state.wildStatus = 1;
    const quarters4 = getAvailableCrewQuarters(state);
    assert.equal(quarters4, quarters3 - 1, 'Should have 1 fewer quarter with Wild');
});

test('wild quest - delivery availability check', () => {
    const state = createInitialState();
    
    // Not at Kravat, Wild not aboard
    state.currentSystem = 10;
    state.wildStatus = 0;
    assert.equal(isWildDeliveryAvailable(state), false);
    
    // At Kravat, Wild not aboard
    state.currentSystem = KRAVAT_SYSTEM_ID;
    state.wildStatus = 0;
    assert.equal(isWildDeliveryAvailable(state), false);
    
    // Not at Kravat, Wild aboard
    state.currentSystem = 10;
    state.wildStatus = 1;
    assert.equal(isWildDeliveryAvailable(state), false);
    
    // At Kravat, Wild aboard
    state.currentSystem = KRAVAT_SYSTEM_ID;
    state.wildStatus = 1;
    assert.equal(isWildDeliveryAvailable(state), true);
});

test('wild quest - complete quest lifecycle', () => {
    let state = createInitialState();
    state.wildStatus = 0;
    state.policeRecordScore = PoliceRecordScore.CLEAN;
    state.ship.weapon = [BEAM_LASER_WEAPON, -1, -1];
    state.ship.type = 4; // Bumblebee (2 crew quarters)
    state.ship.crew = [0, -1, -1]; // One crew slot free
    
    // Phase 1: Quest available but not started
    let status = getWildStatus(state);
    assert.equal(status.phase, 'pickup_available');
    
    // Phase 2: Pick up Wild
    let result = pickupWild(state);
    assert.equal(result.success, true);
    state = result.state;
    
    status = getWildStatus(state);
    assert.equal(status.phase, 'on_board');
    
    // Phase 3: Travel to Kravat
    state.currentSystem = KRAVAT_SYSTEM_ID;
    
    status = getWildStatus(state);
    assert.equal(status.phase, 'delivery_available');
    
    // Phase 4: Complete delivery
    result = completeWildDelivery(state);
    assert.equal(result.success, true);
    state = result.state;
    
    status = getWildStatus(state);
    assert.equal(status.phase, 'completed');
    
    // Verify final state
    assert.equal(state.wildStatus, 2);
});

test('wild quest - edge cases', () => {
    const state = createInitialState();
    
    // Try to pickup when already completed
    state.wildStatus = 2; // Completed
    let result = pickupWild(state);
    assert.equal(result.success, false);
    
    // Try to deliver when not aboard
    state.wildStatus = 0; // Not started
    result = completeWildDelivery(state);
    assert.equal(result.success, false);
    
    // Try to arrest when not aboard
    result = wildArrested(state);
    assert.equal(result.success, false);
    
    // Try to have leave when not aboard
    result = wildLeavesShip(state);
    assert.equal(result.success, false);
});

test('wild quest - interaction with reactor quest', () => {
    const state = createInitialState();
    state.wildStatus = 0;
    state.policeRecordScore = PoliceRecordScore.CLEAN;
    state.ship.weapon = [BEAM_LASER_WEAPON, -1, -1];
    state.ship.type = 4; // Bumblebee (2 crew quarters)
    
    // With reactor aboard, Wild won't board
    state.reactorStatus = 10; // Reactor aboard
    assert.equal(isWildPickupAvailable(state), false);
    
    // After reactor delivered, Wild should be available again
    state.reactorStatus = 0; // No reactor
    assert.equal(isWildPickupAvailable(state), true);
});
