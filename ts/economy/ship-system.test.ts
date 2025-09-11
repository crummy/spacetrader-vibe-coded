// Ship Trading System Integration Tests

import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import type { GameState } from '../types.ts';
import { createGameEngine } from '../engine/game.ts';
import { GameMode } from '../types.ts';
import { getShipType } from '../data/shipTypes.ts';

describe('Ship Trading Integration', () => {
  test('ship trading action is available on planets', () => {
    const engine = createGameEngine();
    const state = engine.state;
    state.currentMode = GameMode.OnPlanet;
    
    const actions = engine.getAvailableActions();
    const shipAction = actions.find(a => a.type === 'buy_ship');
    
    assert(shipAction, 'Ship trading action should be available on planets');
    assert(shipAction.available, 'Ship trading action should be marked as available');
    assert(shipAction.parameters?.availableShips, 'Should include available ships data');
  });

  test('ship trading not available in space', () => {
    const engine = createGameEngine();
    const state = engine.state;
    state.currentMode = GameMode.InSpace;
    
    const actions = engine.getAvailableActions();
    const shipAction = actions.find(a => a.type === 'buy_ship');
    
    assert(!shipAction, 'Ship trading should not be available in space');
  });

  test('complete ship purchase flow', async () => {
    const engine = createGameEngine();
    const state = engine.state;
    state.currentMode = GameMode.OnPlanet;
    state.credits = 50000; // Enough for several ships
    
    const originalShipType = state.ship.type;
    const originalCredits = state.credits;
    
    // Execute ship purchase
    const result = await engine.executeAction({
      type: 'buy_ship',
      parameters: {
        shipType: 2, // Firefly
        transferLightning: false,
        transferCompactor: false,
        transferMorgan: false,
      }
    });
    
    assert(result.success, 'Ship purchase should succeed');
    assert(result.stateChanged, 'Purchase should change state');
    assert(result.newState, 'Should return new state');
    
    if (result.newState) {
      assert(result.newState.ship.type === 2, 'Should have new ship type');
      assert(result.newState.ship.type !== originalShipType, 'Ship type should change');
      assert(result.newState.credits < originalCredits, 'Should spend credits');
      assert(result.newState.ship.hull > 0, 'New ship should have good hull');
      assert(result.newState.ship.fuel > 0, 'New ship should have fuel');
    }
  });

  test('ship purchase with insufficient funds', async () => {
    const engine = createGameEngine();
    const state = engine.state;
    state.currentMode = GameMode.OnPlanet;
    state.credits = 1000; // Not enough for expensive ships
    
    const result = await engine.executeAction({
      type: 'buy_ship',
      parameters: {
        shipType: 9, // Wasp (expensive)
        transferLightning: false,
        transferCompactor: false,
        transferMorgan: false,
      }
    });
    
    assert(!result.success, 'Expensive ship purchase should fail');
    assert(result.message.includes('funds'), 'Should mention insufficient funds');
    assert(!result.stateChanged, 'Should not change state on failure');
  });

  test('ship menu action returns available ships', async () => {
    const engine = createGameEngine();
    const state = engine.state;
    state.currentMode = GameMode.OnPlanet;
    
    // Execute buy_ship action without shipType parameter (menu action)
    const result = await engine.executeAction({
      type: 'buy_ship',
      parameters: {}
    });
    
    assert(result.success, 'Ship menu action should succeed');
    assert(!result.stateChanged, 'Menu action should not change state');
    assert(result.data?.availableShips, 'Should return available ships data');
  });

  test('engine state updates after successful ship purchase', async () => {
    const engine = createGameEngine();
    const state = engine.state;
    state.currentMode = GameMode.OnPlanet;
    state.credits = 20000; // Sufficient credits
    state.debt = 0; // No debt
    
    const originalShipType = state.ship.type;
    const originalCredits = state.credits;
    
    // Purchase a different ship (Firefly)
    const result = await engine.executeAction({
      type: 'buy_ship',
      parameters: {
        shipType: 2 // Firefly
      }
    });
    
    assert(result.success, 'Ship purchase should succeed');
    assert(result.stateChanged, 'State should be marked as changed');
    
    // Verify engine's internal state was updated
    assert.equal(engine.state.ship.type, 2, 'Engine state should show new ship type');
    assert(engine.state.credits !== originalCredits, 'Engine state should show updated credits');
    assert(originalShipType !== engine.state.ship.type, 'Ship type should actually change');
  });
});
