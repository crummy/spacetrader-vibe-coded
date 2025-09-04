import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { 
  pickupJarek,
  completeJarekDelivery,
  jarekTakenByPirates,
  isJarekPickupAvailable,
  isJarekDeliveryAvailable,
  getAvailableCrewQuarters,
  getJarekStatus
} from './jarek.ts';
import { createInitialState } from '../../state.ts';
import { Difficulty } from '../../types.ts';

describe('Ambassador Jarek Quest', () => {
  test('isJarekPickupAvailable - available when quest not started and crew quarters available', () => {
    const state = createInitialState();
    state.jarekStatus = 0;
    // Default ship has crew quarters available
    
    const result = isJarekPickupAvailable(state);
    assert.equal(result, true);
  });

  test('isJarekPickupAvailable - not available when quest already started', () => {
    const state = createInitialState();
    state.jarekStatus = 1; // Already on board
    
    const result = isJarekPickupAvailable(state);
    assert.equal(result, false);
  });

  test('isJarekPickupAvailable - not available when no crew quarters', () => {
    const state = createInitialState();
    state.jarekStatus = 0;
    // Fill all crew quarters
    state.ship.crew = [0, -1, -1]; // Fill crew quarters with one crew member
    
    const result = isJarekPickupAvailable(state);
    assert.equal(result, false);
  });

  test('pickupJarek - successfully picks up Jarek', () => {
    const state = createInitialState();
    state.jarekStatus = 0;
    
    const result = pickupJarek(state);
    
    assert.equal(result.success, true);
    assert.equal(result.state.jarekStatus, 1);
    assert.match(result.message!, /jarek.*boards/i);
  });

  test('pickupJarek - fails when quest already active', () => {
    const state = createInitialState();
    state.jarekStatus = 1; // Already on board
    
    const result = pickupJarek(state);
    
    assert.equal(result.success, false);
    assert.equal(result.state.jarekStatus, 1); // Unchanged
  });

  test('pickupJarek - fails when no crew quarters available', () => {
    const state = createInitialState();
    state.jarekStatus = 0;
    state.ship.crew = [0, -1, -1]; // Fill available quarters
    
    const result = pickupJarek(state);
    
    assert.equal(result.success, false);
    assert.equal(result.state.jarekStatus, 0); // Unchanged
    assert.match(result.message!, /no crew quarters/i);
  });

  test('isJarekDeliveryAvailable - available when Jarek on board and at Devidia', () => {
    const state = createInitialState();
    state.currentSystem = 22; // DEVIDIA system
    state.jarekStatus = 1;
    
    const result = isJarekDeliveryAvailable(state);
    assert.equal(result, true);
  });

  test('isJarekDeliveryAvailable - not available when Jarek not on board', () => {
    const state = createInitialState();
    state.currentSystem = 22; // DEVIDIA system
    state.jarekStatus = 0;
    
    const result = isJarekDeliveryAvailable(state);
    assert.equal(result, false);
  });

  test('isJarekDeliveryAvailable - not available when not at Devidia', () => {
    const state = createInitialState();
    state.currentSystem = 67; // NIX system
    state.jarekStatus = 1;
    
    const result = isJarekDeliveryAvailable(state);
    assert.equal(result, false);
  });

  test('completeJarekDelivery - successfully completes delivery with reward', () => {
    const state = createInitialState();
    state.currentSystem = 22; // DEVIDIA system
    state.jarekStatus = 1;
    state.credits = 1000;
    
    const result = completeJarekDelivery(state);
    
    assert.equal(result.success, true);
    assert.equal(result.state.jarekStatus, 2);
    assert.equal(result.state.credits, 6000); // 1000 + 5000 reward
    assert.match(result.message!, /5.*credits/i);
  });

  test('completeJarekDelivery - fails when Jarek not on board', () => {
    const state = createInitialState();
    state.currentSystem = 22; // DEVIDIA system
    state.jarekStatus = 0;
    
    const result = completeJarekDelivery(state);
    
    assert.equal(result.success, false);
    assert.equal(result.state.credits, state.credits); // No reward
  });

  test('completeJarekDelivery - fails when not at Devidia', () => {
    const state = createInitialState();
    state.currentSystem = 67; // NIX system
    state.jarekStatus = 1;
    
    const result = completeJarekDelivery(state);
    
    assert.equal(result.success, false);
    assert.equal(result.state.jarekStatus, 1); // Still on board
  });

  test('jarekTakenByPirates - successfully removes Jarek when on board', () => {
    const state = createInitialState();
    state.jarekStatus = 1;
    
    const result = jarekTakenByPirates(state);
    
    assert.equal(result.success, true);
    assert.equal(result.state.jarekStatus, 0);
    assert.match(result.message!, /pirates.*jarek/i);
  });

  test('jarekTakenByPirates - fails when Jarek not on board', () => {
    const state = createInitialState();
    state.jarekStatus = 0;
    
    const result = jarekTakenByPirates(state);
    
    assert.equal(result.success, false);
    assert.equal(result.state.jarekStatus, 0);
  });

  test('getAvailableCrewQuarters - calculates available quarters correctly', () => {
    const state = createInitialState();
    state.ship.type = 2; // Ship with more crew quarters
    state.ship.crew = [-1, -1, -1]; // No crew
    state.jarekStatus = 0;
    state.wildStatus = 0;
    
    const quarters = getAvailableCrewQuarters(state);
    assert.equal(quarters, 1); // Ship type 2 should have 1 crew quarter
  });

  test('getAvailableCrewQuarters - accounts for Jarek taking quarters', () => {
    const state = createInitialState();
    state.ship.type = 4; // Ship with 2 crew quarters 
    state.ship.crew = [-1, -1, -1];
    state.jarekStatus = 1; // Jarek on board
    state.wildStatus = 0;
    
    const quarters = getAvailableCrewQuarters(state);
    assert.equal(quarters, 1); // 2 quarters - 1 for Jarek = 1 available
  });

  test('getAvailableCrewQuarters - accounts for Wild and Jarek both taking quarters', () => {
    const state = createInitialState();
    state.ship.type = 5; // Ship with 3 crew quarters
    state.ship.crew = [-1, -1, -1];
    state.jarekStatus = 1; // Jarek on board
    state.wildStatus = 1; // Wild on board
    
    const quarters = getAvailableCrewQuarters(state);
    assert.equal(quarters, 1); // 3 quarters - 1 for Jarek - 1 for Wild = 1 available
  });

  test('getJarekStatus - returns correct status for each quest stage', () => {
    const state = createInitialState();
    
    // Not started but available
    state.jarekStatus = 0;
    let status = getJarekStatus(state);
    assert.equal(status.phase, 'pickup_available');
    assert.match(status.description, /jarek.*transport/i);
    
    // On board
    state.jarekStatus = 1;
    status = getJarekStatus(state);
    assert.equal(status.phase, 'on_board');
    assert.match(status.description, /transport.*devidia/i);
    
    // Delivery available
    state.currentSystem = 22; // DEVIDIA system
    status = getJarekStatus(state);
    assert.equal(status.phase, 'delivery_available');
    assert.match(status.description, /deliver.*jarek/i);
    
    // Completed
    state.jarekStatus = 2;
    status = getJarekStatus(state);
    assert.equal(status.phase, 'completed');
    assert.match(status.description, /delivered.*devidia/i);
  });

  test('jarek quest - complete workflow from pickup to delivery', () => {
    const state = createInitialState();
    state.ship.type = 3; // Ship with crew quarters
    state.ship.crew = [-1, -1, -1];
    const initialCredits = state.credits;
    
    // Pick up Jarek
    assert.equal(isJarekPickupAvailable(state), true);
    
    const pickupResult = pickupJarek(state);
    assert.equal(pickupResult.success, true);
    assert.equal(pickupResult.state.jarekStatus, 1);
    
    // Travel to Devidia and complete delivery
    pickupResult.state.currentSystem = 22; // DEVIDIA system
    assert.equal(isJarekDeliveryAvailable(pickupResult.state), true);
    
    const deliveryResult = completeJarekDelivery(pickupResult.state);
    assert.equal(deliveryResult.success, true);
    assert.equal(deliveryResult.state.jarekStatus, 2);
    assert.equal(deliveryResult.state.credits, initialCredits + 5000);
  });

  test('jarek quest - pirates interrupt quest', () => {
    const state = createInitialState();
    state.ship.type = 3; // Ship with crew quarters
    state.ship.crew = [-1, -1, -1];
    
    // Pick up Jarek
    const pickupResult = pickupJarek(state);
    assert.equal(pickupResult.success, true);
    
    // Pirates take Jarek
    const pirateResult = jarekTakenByPirates(pickupResult.state);
    assert.equal(pirateResult.success, true);
    assert.equal(pirateResult.state.jarekStatus, 0);
    
    // Can pick up again
    assert.equal(isJarekPickupAvailable(pirateResult.state), true);
  });

  test('crew quarters - prevent pickup when ship full', () => {
    const state = createInitialState();
    state.ship.type = 0; // Ship with 1 crew quarter
    state.ship.crew = [0, -1, -1]; // Fill the only quarter
    state.jarekStatus = 0;
    
    assert.equal(isJarekPickupAvailable(state), false);
    
    const result = pickupJarek(state);
    assert.equal(result.success, false);
  });
});
