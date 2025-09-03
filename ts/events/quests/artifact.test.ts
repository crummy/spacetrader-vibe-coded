import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { 
  pickupArtifact,
  checkArtifactStolen,
  stealArtifact,
  completeArtifactDelivery,
  isArtifactPickupAvailable,
  isArtifactDeliveryAvailable,
  getArtifactStatus
} from './artifact.ts';
import { createInitialState } from '../../state.ts';
import { Difficulty } from '../../types.ts';

describe('Artifact Quest', () => {
  test('isArtifactPickupAvailable - available when quest not started and at correct system', () => {
    const state = createInitialState(Difficulty.Easy);
    state.currentSystemId = 67; // NIX system
    
    const result = isArtifactPickupAvailable(state);
    assert.equal(result, true);
  });

  test('isArtifactPickupAvailable - not available when artifact already aboard', () => {
    const state = createInitialState(Difficulty.Easy);
    state.currentSystemId = 67; // NIX system
    state.artifactOnBoard = true;
    
    const result = isArtifactPickupAvailable(state);
    assert.equal(result, false);
  });

  test('isArtifactPickupAvailable - not available when not at Nix', () => {
    const state = createInitialState(Difficulty.Easy);
    state.currentSystemId = 0; // ACAMAR system
    
    const result = isArtifactPickupAvailable(state);
    assert.equal(result, false);
  });

  test('pickupArtifact - successfully picks up artifact', () => {
    const state = createInitialState(Difficulty.Easy);
    state.currentSystemId = 67; // NIX system
    
    const result = pickupArtifact(state);
    
    assert.equal(result.success, true);
    assert.equal(result.state.artifactOnBoard, true);
    assert.match(result.message!, /discover.*artifact/i);
  });

  test('pickupArtifact - fails when artifact already aboard', () => {
    const state = createInitialState(Difficulty.Easy);
    state.currentSystemId = 67; // NIX system
    state.artifactOnBoard = true;
    
    const result = pickupArtifact(state);
    
    assert.equal(result.success, false);
    assert.equal(result.state.artifactOnBoard, true);
  });

  test('isArtifactDeliveryAvailable - available when artifact on board and at correct system', () => {
    const state = createInitialState(Difficulty.Easy);
    state.currentSystemId = 82; // REGULAS system (delivery point)
    state.artifactOnBoard = true;
    
    const result = isArtifactDeliveryAvailable(state);
    assert.equal(result, true);
  });

  test('isArtifactDeliveryAvailable - not available when no artifact on board', () => {
    const state = createInitialState(Difficulty.Easy);
    state.currentSystemId = 82; // REGULAS system (delivery point)
    state.artifactOnBoard = false;
    
    const result = isArtifactDeliveryAvailable(state);
    assert.equal(result, false);
  });

  test('isArtifactDeliveryAvailable - not available when not at delivery system', () => {
    const state = createInitialState(Difficulty.Easy);
    state.currentSystemId = 67; // NIX system
    state.artifactOnBoard = true;
    
    const result = isArtifactDeliveryAvailable(state);
    assert.equal(result, false);
  });

  test('completeArtifactDelivery - successfully completes delivery with reward', () => {
    const state = createInitialState(Difficulty.Easy);
    state.currentSystemId = 82; // REGULAS system (delivery point)
    state.artifactOnBoard = true;
    state.credits = 1000;
    
    const result = completeArtifactDelivery(state);
    
    assert.equal(result.success, true);
    assert.equal(result.state.artifactOnBoard, false);
    assert.equal(result.state.credits, 21000); // 1000 + 20000 reward
    assert.match(result.message!, /20.*credits/i);
  });

  test('completeArtifactDelivery - fails when no artifact on board', () => {
    const state = createInitialState(Difficulty.Easy);
    state.currentSystemId = 82; // REGULAS system (delivery point)
    state.artifactOnBoard = false;
    
    const result = completeArtifactDelivery(state);
    
    assert.equal(result.success, false);
    assert.equal(result.state.credits, state.credits); // No reward
  });

  test('checkArtifactStolen - chance of theft when artifact on board', () => {
    const state = createInitialState(Difficulty.Easy);
    state.artifactOnBoard = true;
    
    // Mock Math.random to return 0.01 (below 2% threshold)
    const originalRandom = Math.random;
    Math.random = () => 0.01;
    
    const result = checkArtifactStolen(state);
    
    assert.equal(result.success, true);
    assert.equal(result.state.artifactOnBoard, false);
    assert.match(result.message!, /steal.*artifact/i);
    
    Math.random = originalRandom;
  });

  test('checkArtifactStolen - no theft when random above threshold', () => {
    const state = createInitialState(Difficulty.Easy);
    state.artifactOnBoard = true;
    
    // Mock Math.random to return 0.5 (above 2% threshold)
    const originalRandom = Math.random;
    Math.random = () => 0.5;
    
    const result = checkArtifactStolen(state);
    
    assert.equal(result.success, false);
    assert.equal(result.state.artifactOnBoard, true);
    
    Math.random = originalRandom;
  });

  test('checkArtifactStolen - no theft when no artifact on board', () => {
    const state = createInitialState(Difficulty.Easy);
    state.artifactOnBoard = false;
    
    const result = checkArtifactStolen(state);
    
    assert.equal(result.success, false);
    assert.equal(result.state.artifactOnBoard, false);
  });

  test('stealArtifact - successfully steals artifact when available', () => {
    const state = createInitialState(Difficulty.Easy);
    state.artifactOnBoard = true;
    
    const result = stealArtifact(state);
    
    assert.equal(result.success, true);
    assert.equal(result.state.artifactOnBoard, false);
    assert.match(result.message!, /stolen/i);
  });

  test('stealArtifact - fails when no artifact on board', () => {
    const state = createInitialState(Difficulty.Easy);
    state.artifactOnBoard = false;
    
    const result = stealArtifact(state);
    
    assert.equal(result.success, false);
    assert.equal(result.state.artifactOnBoard, false);
  });

  test('getArtifactStatus - returns correct status for each quest stage', () => {
    const state = createInitialState(Difficulty.Easy);
    
    // Not started
    let status = getArtifactStatus(state);
    assert.equal(status.phase, 'not_started');
    assert.equal(status.description, 'Quest not started');
    
    // Artifact available for pickup
    state.currentSystemId = 67; // NIX system
    status = getArtifactStatus(state);
    assert.equal(status.phase, 'pickup_available');
    assert.match(status.description, /artifact.*available/i);
    
    // In progress - artifact on board
    state.artifactOnBoard = true;
    status = getArtifactStatus(state);
    assert.equal(status.phase, 'in_progress');
    assert.match(status.description, /find.*high-tech/i);
    
    // Delivery available
    state.currentSystemId = 82; // REGULAS system (delivery point)
    status = getArtifactStatus(state);
    assert.equal(status.phase, 'delivery_available');
    assert.match(status.description, /deliver.*artifact/i);
    
    // Back to not started when artifact not on board and not at Nix
    state.artifactOnBoard = false;
    state.currentSystemId = 0; // ACAMAR system
    status = getArtifactStatus(state);
    assert.equal(status.phase, 'not_started');
    assert.match(status.description, /not started/i);
  });

  test('artifact quest - complete workflow from pickup to delivery', () => {
    const state = createInitialState(Difficulty.Easy);
    const initialCredits = state.credits;
    
    // Travel to Nix and pick up artifact
    state.currentSystemId = 67; // NIX system
    assert.equal(isArtifactPickupAvailable(state), true);
    
    const pickupResult = pickupArtifact(state);
    assert.equal(pickupResult.success, true);
    assert.equal(pickupResult.state.artifactOnBoard, true);
    
    // Travel to delivery system and complete delivery
    pickupResult.state.currentSystemId = 82; // REGULAS system (delivery point)
    assert.equal(isArtifactDeliveryAvailable(pickupResult.state), true);
    
    const deliveryResult = completeArtifactDelivery(pickupResult.state);
    assert.equal(deliveryResult.success, true);
    assert.equal(deliveryResult.state.artifactOnBoard, false);
    assert.equal(deliveryResult.state.credits, initialCredits + 20000);
  });

  test('artifact quest - theft interrupts quest', () => {
    const state = createInitialState(Difficulty.Easy);
    state.currentSystemId = 67; // NIX system
    
    // Pick up artifact
    const pickupResult = pickupArtifact(state);
    assert.equal(pickupResult.success, true);
    
    // Artifact gets stolen
    const stealResult = stealArtifact(pickupResult.state);
    assert.equal(stealResult.success, true);
    assert.equal(stealResult.state.artifactOnBoard, false);
    
    // Can pick up again
    stealResult.state.currentSystemId = 67; // NIX system
    assert.equal(isArtifactPickupAvailable(stealResult.state), true);
  });
});
