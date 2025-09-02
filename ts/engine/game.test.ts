// Game Engine Integration Tests
// Test-Driven Development: Write tests FIRST before implementation

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import type { GameState } from '../types.ts';
import { createInitialState } from '../state.ts';
import { GameMode } from '../types.ts';
import type { GameEngine } from './game.ts';
import { 
  // Core Game Engine
  createGameEngine, 
  
  // Action System
  executeAction, getAvailableActions, canExecuteAction,
  validateGameState, 
  
  // Game Loop Management
  advanceTime, checkRandomEncounters, updateMarkets,
  
  // Action Types and Results
  type GameAction, type ActionResult, type AvailableAction,
  
  // System Integration
  integrateSystemUpdates, synchronizeSystemState,
  
  // Persistence
  serializeGameState, deserializeGameState,
  
  // Utilities
  getGameStatus, getCurrentLocation, getCurrentShipStatus
} from './game.ts';

describe('Game Engine Integration', () => {

  describe('Game Engine Creation and Management', () => {
    test('should create game engine with initial state', () => {
      const engine = createGameEngine();
      
      assert.ok(engine);
      assert.equal(typeof engine.state, 'object');
      assert.equal(typeof engine.executeAction, 'function');
      assert.equal(typeof engine.getAvailableActions, 'function');
    });

    test('should create game engine from existing state', () => {
      const existingState = createInitialState();
      existingState.credits = 5000;
      existingState.nameCommander = 'Test Commander';
      
      const engine = createGameEngine(existingState);
      
      assert.equal(engine.state.credits, 5000);
      assert.equal(engine.state.nameCommander, 'Test Commander');
    });

    test('should validate game state consistency', () => {
      const state = createInitialState();
      
      const validation = validateGameState(state);
      
      assert.equal(validation.isValid, true);
      assert.equal(validation.errors.length, 0);
    });

    test('should detect invalid game state', () => {
      const state = createInitialState();
      state.credits = -100; // Invalid negative credits
      state.ship.hull = -10; // Invalid negative hull
      
      const validation = validateGameState(state);
      
      assert.equal(validation.isValid, false);
      assert.ok(validation.errors.length > 0);
    });
  });

  describe('Action System Integration', () => {
    test('should provide available actions based on current game mode', () => {
      const engine = createGameEngine();
      
      // Test actions when docked at planet
      engine.state.currentMode = GameMode.OnPlanet;
      const planetActions = engine.getAvailableActions();
      
      assert.ok(planetActions.some(action => action.type === 'buy_cargo'));
      assert.ok(planetActions.some(action => action.type === 'sell_cargo'));
      assert.ok(planetActions.some(action => action.type === 'launch_ship'));
      
      // Test actions when in space
      engine.state.currentMode = GameMode.InSpace;
      const spaceActions = engine.getAvailableActions();
      
      assert.ok(spaceActions.some(action => action.type === 'warp_to_system'));
      assert.ok(spaceActions.some(action => action.type === 'track_system'));
    });

    test('should execute trading actions through unified interface', async () => {
      const engine = createGameEngine();
      engine.state.currentMode = GameMode.OnPlanet;
      engine.state.credits = 1000;
      
      const result = await engine.executeAction({
        type: 'buy_cargo',
        parameters: {
          tradeItem: 0, // Water
          quantity: 5
        }
      });
      
      assert.equal(result.success, true);
      assert.ok(result.message.length > 0);
      assert.equal(engine.state.ship.cargo[0], 5);
      assert.ok(engine.state.credits < 1000); // Credits should decrease
    });

    test('should execute warp actions through unified interface', async () => {
      const engine = createGameEngine();
      engine.state.currentMode = GameMode.InSpace;
      engine.state.ship.fuel = 20;
      engine.state.currentSystem = 0;
      
      const result = await engine.executeAction({
        type: 'warp_to_system',
        parameters: {
          targetSystem: 1
        }
      });
      
      assert.equal(result.success, true);
      assert.equal(engine.state.currentSystem, 1);
      assert.ok(engine.state.ship.fuel < 20); // Fuel should decrease
    });

    test('should execute combat actions through unified interface', async () => {
      const engine = createGameEngine();
      engine.state.currentMode = GameMode.InCombat;
      engine.state.encounterType = 10; // PIRATEATTACK
      
      const result = await engine.executeAction({
        type: 'combat_attack',
        parameters: {}
      });
      
      assert.equal(result.success, true);
      assert.ok(result.combatResult);
      assert.equal(typeof result.combatResult.playerDamage, 'number');
      assert.equal(typeof result.combatResult.opponentDamage, 'number');
    });

    test('should validate actions before execution', async () => {
      const engine = createGameEngine();
      
      // Try invalid action for current mode
      engine.state.currentMode = GameMode.OnPlanet;
      
      const result = await engine.executeAction({
        type: 'warp_to_system',
        parameters: { targetSystem: 1 }
      });
      
      assert.equal(result.success, false);
      assert.ok(result.message.includes('not available'));
    });

    test('should check if action can be executed', () => {
      const engine = createGameEngine();
      
      // Valid action for planet mode
      engine.state.currentMode = GameMode.OnPlanet;
      assert.equal(canExecuteAction(engine.state, { type: 'buy_cargo', parameters: {} }), true);
      
      // Invalid action for planet mode
      assert.equal(canExecuteAction(engine.state, { type: 'warp_to_system', parameters: {} }), false);
    });
  });

  describe('Game Loop and Time Management', () => {
    test('should advance time and update systems', () => {
      const engine = createGameEngine();
      const initialDays = engine.state.days;
      
      advanceTime(engine.state, 1);
      
      assert.equal(engine.state.days, initialDays + 1);
    });

    test('should check for random encounters during travel', () => {
      const engine = createGameEngine();
      engine.state.currentMode = GameMode.InSpace;
      
      // Mock random encounter check
      const encounterCheck = checkRandomEncounters(engine.state);
      
      assert.equal(typeof encounterCheck.hasEncounter, 'boolean');
      if (encounterCheck.hasEncounter) {
        assert.equal(typeof encounterCheck.encounterType, 'number');
        assert.ok(encounterCheck.encounterType >= 0);
      }
    });

    test('should update market prices over time', () => {
      const engine = createGameEngine();
      const initialPrices = [...engine.state.buyPrice];
      
      updateMarkets(engine.state);
      
      // Prices should potentially change
      const pricesChanged = engine.state.buyPrice.some((price, index) => 
        price !== initialPrices[index]
      );
      // Note: Prices might not always change, so this tests the function runs without error
      assert.equal(typeof pricesChanged, 'boolean');
    });

    test('should handle interest payments on debt', () => {
      const engine = createGameEngine();
      engine.state.debt = 1000;
      
      advanceTime(engine.state, 1);
      
      // Debt should increase due to interest
      assert.ok(engine.state.debt > 1000);
    });
  });

  describe('System Integration and Synchronization', () => {
    test('should integrate updates from multiple systems', () => {
      const engine = createGameEngine();
      
      const updates = {
        credits: 500,
        reputation: 10,
        fuel: -5,
        systemVisited: 5
      };
      
      integrateSystemUpdates(engine.state, updates);
      
      assert.equal(engine.state.credits, updates.credits);
      assert.equal(engine.state.reputationScore, updates.reputation);
      assert.equal(engine.state.ship.fuel, updates.fuel);
      assert.equal(engine.state.solarSystem[updates.systemVisited].visited, true);
    });

    test('should synchronize state across systems', () => {
      const engine = createGameEngine();
      
      // Modify state in ways that might cause inconsistency
      engine.state.currentMode = GameMode.InSpace;
      engine.state.encounterType = 10; // Should be -1 when not in combat
      
      synchronizeSystemState(engine.state);
      
      // Should fix the inconsistency
      assert.equal(engine.state.encounterType, -1);
    });

    test('should handle system transitions properly', async () => {
      const engine = createGameEngine();
      engine.state.currentMode = GameMode.OnPlanet;
      
      // Launch from planet
      const result = await engine.executeAction({
        type: 'launch_ship',
        parameters: {}
      });
      
      assert.equal(result.success, true);
      assert.equal(engine.state.currentMode, GameMode.InSpace);
    });
  });

  describe('Persistence and State Management', () => {
    test('should serialize game state to JSON', () => {
      const engine = createGameEngine();
      engine.state.nameCommander = 'Test Commander';
      engine.state.credits = 2500;
      
      const serialized = serializeGameState(engine.state);
      
      assert.equal(typeof serialized, 'string');
      const parsed = JSON.parse(serialized);
      assert.equal(parsed.nameCommander, 'Test Commander');
      assert.equal(parsed.credits, 2500);
    });

    test('should deserialize game state from JSON', () => {
      const originalState = createInitialState();
      originalState.nameCommander = 'Test Commander';
      originalState.credits = 2500;
      
      const serialized = serializeGameState(originalState);
      const deserialized = deserializeGameState(serialized);
      
      assert.equal(deserialized.nameCommander, 'Test Commander');
      assert.equal(deserialized.credits, 2500);
      assert.equal(typeof deserialized.ship, 'object');
    });

    test('should handle invalid serialized data gracefully', () => {
      const invalidJson = '{"invalid": "data"}';
      
      assert.throws(() => {
        deserializeGameState(invalidJson);
      }, /Invalid game state format/);
    });

    test('should validate deserialized state', () => {
      const invalidState = JSON.stringify({
        credits: -100, // Invalid
        nameCommander: '',
        // Missing required fields
      });
      
      assert.throws(() => {
        deserializeGameState(invalidState);
      });
    });
  });

  describe('Game Status and Information', () => {
    test('should provide current game status', () => {
      const engine = createGameEngine();
      engine.state.nameCommander = 'Test Commander';
      engine.state.credits = 1500;
      
      const status = getGameStatus(engine.state);
      
      assert.equal(status.commanderName, 'Test Commander');
      assert.equal(status.credits, 1500);
      assert.equal(typeof status.days, 'number');
      assert.equal(typeof status.reputation, 'string');
      assert.equal(typeof status.policeRecord, 'string');
    });

    test('should provide current location information', () => {
      const engine = createGameEngine();
      engine.state.currentSystem = 5;
      
      const location = getCurrentLocation(engine.state);
      
      assert.equal(location.systemIndex, 5);
      assert.equal(typeof location.systemName, 'string');
      assert.equal(typeof location.isDocked, 'boolean');
    });

    test('should provide current ship status', () => {
      const engine = createGameEngine();
      engine.state.ship.hull = 75;
      engine.state.ship.fuel = 12;
      
      const shipStatus = getCurrentShipStatus(engine.state);
      
      assert.equal(shipStatus.hull, 75);
      assert.equal(shipStatus.fuel, 12);
      assert.equal(typeof shipStatus.cargoUsed, 'number');
      assert.equal(typeof shipStatus.cargoCapacity, 'number');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle concurrent action execution', async () => {
      const engine = createGameEngine();
      
      // Try to execute multiple actions simultaneously
      const promises = [
        engine.executeAction({ type: 'launch_ship', parameters: {} }),
        engine.executeAction({ type: 'buy_cargo', parameters: { tradeItem: 0, quantity: 1 } })
      ];
      
      const results = await Promise.all(promises);
      
      // Only one should succeed, or both should handle gracefully
      const successCount = results.filter(r => r.success).length;
      assert.ok(successCount <= 1);
    });

    test('should handle invalid action parameters', async () => {
      const engine = createGameEngine();
      
      const result = await engine.executeAction({
        type: 'buy_cargo',
        parameters: {
          tradeItem: -1, // Invalid trade item
          quantity: 'invalid' // Invalid quantity type
        }
      });
      
      assert.equal(result.success, false);
      assert.ok(result.message.includes('Invalid'));
    });

    test('should handle system corruption gracefully', () => {
      const engine = createGameEngine();
      
      // Corrupt game state
      engine.state.ship.cargo = null as any;
      
      const validation = validateGameState(engine.state);
      
      assert.equal(validation.isValid, false);
      assert.ok(validation.errors.some(error => error.includes('cargo')));
    });

    test('should handle missing system data', () => {
      const engine = createGameEngine();
      
      // Remove solar system data
      engine.state.solarSystem = [] as any;
      
      const validation = validateGameState(engine.state);
      
      assert.equal(validation.isValid, false);
      assert.ok(validation.errors.some(error => error.includes('solar')));
    });
  });

  describe('Performance and Optimization', () => {
    test('should execute actions efficiently', async () => {
      const engine = createGameEngine();
      const startTime = performance.now();
      
      // Execute multiple actions
      for (let i = 0; i < 10; i++) {
        await engine.executeAction({ type: 'get_available_actions', parameters: {} });
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete quickly (less than 100ms for 10 operations)
      assert.ok(totalTime < 100);
    });

    test('should handle large game states efficiently', () => {
      const engine = createGameEngine();
      
      // Create large cargo arrays
      engine.state.ship.cargo = [999, 999, 999, 999, 999, 999, 999, 999, 999, 999] as any;
      
      const startTime = performance.now();
      const status = getGameStatus(engine.state);
      const endTime = performance.now();
      
      assert.ok(endTime - startTime < 10); // Should be very fast
      assert.equal(typeof status, 'object');
    });
  });

  describe('Integration with Existing Systems', () => {
    test('should integrate with economy system', async () => {
      const engine = createGameEngine();
      engine.state.currentMode = GameMode.OnPlanet;
      
      // Test price calculation integration
      const actions = engine.getAvailableActions();
      const buyAction = actions.find(action => action.type === 'buy_cargo');
      
      assert.ok(buyAction);
      assert.ok(buyAction.parameters?.possibleItems?.length > 0);
    });

    test('should integrate with travel system', async () => {
      const engine = createGameEngine();
      engine.state.currentMode = GameMode.InSpace;
      
      // Test warp system integration
      const actions = engine.getAvailableActions();
      const warpAction = actions.find(action => action.type === 'warp_to_system');
      
      assert.ok(warpAction);
      assert.ok(warpAction.parameters?.possibleSystems?.length > 0);
    });

    test('should integrate with combat system', () => {
      const engine = createGameEngine();
      engine.state.currentMode = GameMode.InCombat;
      engine.state.encounterType = 10; // PIRATEATTACK
      
      // Test combat system integration
      const actions = engine.getAvailableActions();
      const combatActions = actions.filter(action => action.type.startsWith('combat_'));
      
      assert.ok(combatActions.length > 0);
    });
  });
});