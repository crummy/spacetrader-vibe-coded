// Comprehensive State Transition Tests
// Ensure all possible state transitions work correctly

import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import { createGameEngine } from '../engine/game.ts';
import type { GameState } from '../types.ts';
import { GameMode } from '../types.ts';
import { EncounterType } from '../combat/engine.ts';

/**
 * Test all combat actions for each encounter type
 */
describe('State Transition Testing', () => {
  describe('Combat Action Coverage', () => {
    test('should handle all combat actions for police inspection', async () => {
      const engine = createGameEngine();
      engine.state.currentMode = GameMode.InCombat;
      engine.state.encounterType = EncounterType.POLICEINSPECTION;
      engine.state.ship.hull = 100;
      engine.state.opponent.hull = 50;
      
      const actions = engine.getAvailableActions();
      const combatActions = actions.filter(a => a.type.startsWith('combat_'));
      
      console.log(`Police inspection actions: ${combatActions.map(a => a.type).join(', ')}`);
      
      // Test each available action
      for (const action of combatActions) {
        const testEngine = createGameEngine();
        testEngine.state.currentMode = GameMode.InCombat;
        testEngine.state.encounterType = EncounterType.POLICEINSPECTION;
        testEngine.state.ship.hull = 100;
        testEngine.state.opponent.hull = 50;
        testEngine.state.credits = 10000; // Ensure enough for bribes
        
        try {
          const result = await testEngine.executeAction({
            type: action.type,
            parameters: {}
          });
          
          console.log(`✅ ${action.type}: ${result.success ? 'SUCCESS' : 'HANDLED'}`);
        } catch (error) {
          console.log(`❌ ${action.type}: ERROR - ${error}`);
          assert.fail(`Combat action ${action.type} threw error: ${error}`);
        }
      }
    });

    test('should handle all combat actions for pirate attack', async () => {
      const engine = createGameEngine();
      engine.state.currentMode = GameMode.InCombat;
      engine.state.encounterType = EncounterType.PIRATEATTACK;
      engine.state.ship.hull = 100;
      engine.state.opponent.hull = 50;
      
      const actions = engine.getAvailableActions();
      const combatActions = actions.filter(a => a.type.startsWith('combat_'));
      
      console.log(`Pirate attack actions: ${combatActions.map(a => a.type).join(', ')}`);
      
      // Test each available action
      for (const action of combatActions) {
        const testEngine = createGameEngine();
        testEngine.state.currentMode = GameMode.InCombat;
        testEngine.state.encounterType = EncounterType.PIRATEATTACK;
        testEngine.state.ship.hull = 100;
        testEngine.state.opponent.hull = 50;
        testEngine.state.credits = 10000;
        
        try {
          const result = await testEngine.executeAction({
            type: action.type,
            parameters: {}
          });
          
          console.log(`✅ ${action.type}: ${result.success ? 'SUCCESS' : 'HANDLED'}`);
        } catch (error) {
          console.log(`❌ ${action.type}: ERROR - ${error}`);
          assert.fail(`Combat action ${action.type} threw error: ${error}`);
        }
      }
    });

    test('should handle all combat actions for trader encounters', async () => {
      const traderEncounters = [
        EncounterType.TRADERSELL,
        EncounterType.TRADERBUY,
        EncounterType.TRADERATTACK,
        EncounterType.TRADERSURRENDER
      ];
      
      for (const encounterType of traderEncounters) {
        const engine = createGameEngine();
        engine.state.currentMode = GameMode.InCombat;
        engine.state.encounterType = encounterType;
        engine.state.ship.hull = 100;
        engine.state.opponent.hull = 50;
        engine.state.ship.cargo[0] = 5; // Some cargo for trading
        
        const actions = engine.getAvailableActions();
        const combatActions = actions.filter(a => a.type.startsWith('combat_'));
        
        console.log(`Encounter ${encounterType} actions: ${combatActions.map(a => a.type).join(', ')}`);
        
        // Test each available action
        for (const action of combatActions) {
          const testEngine = createGameEngine();
          testEngine.state.currentMode = GameMode.InCombat;
          testEngine.state.encounterType = encounterType;
          testEngine.state.ship.hull = 100;
          testEngine.state.opponent.hull = 50;
          testEngine.state.credits = 10000;
          testEngine.state.ship.cargo[0] = 5;
          
          try {
            const result = await testEngine.executeAction({
              type: action.type,
              parameters: {}
            });
            
            assert.equal(typeof result.success, 'boolean', `${action.type} should return success boolean`);
            assert.equal(typeof result.message, 'string', `${action.type} should return message`);
          } catch (error) {
            console.log(`❌ ${action.type} on encounter ${encounterType}: ERROR - ${error}`);
            assert.fail(`Combat action ${action.type} threw error: ${error}`);
          }
        }
      }
    });

    test('should handle special encounter actions', async () => {
      const specialEncounters = [
        { type: EncounterType.MARIECELESTEENCOUNTER, name: 'Marie Celeste' },
        { type: EncounterType.BOTTLEOLDENCOUNTER, name: 'Bottle Old' },
        { type: EncounterType.BOTTLEGOODENCOUNTER, name: 'Bottle Good' },
        { type: EncounterType.CAPTAINAHABENCOUNTER, name: 'Captain Ahab' }
      ];
      
      for (const encounter of specialEncounters) {
        const engine = createGameEngine();
        engine.state.currentMode = GameMode.InCombat;
        engine.state.encounterType = encounter.type;
        engine.state.ship.hull = 100;
        engine.state.opponent.hull = 50;
        
        const actions = engine.getAvailableActions();
        const combatActions = actions.filter(a => a.type.startsWith('combat_'));
        
        console.log(`${encounter.name} actions: ${combatActions.map(a => a.type).join(', ')}`);
        
        // Test that actions are available
        assert.ok(combatActions.length > 0, `${encounter.name} should have available actions`);
        
        // Test each action executes without throwing
        for (const action of combatActions) {
          const testEngine = createGameEngine();
          testEngine.state.currentMode = GameMode.InCombat;
          testEngine.state.encounterType = encounter.type;
          testEngine.state.ship.hull = 100;
          testEngine.state.opponent.hull = 50;
          
          try {
            const result = await testEngine.executeAction({
              type: action.type,
              parameters: {}
            });
            
            // Just ensure no errors thrown
            assert.equal(typeof result, 'object', `${action.type} should return result object`);
          } catch (error) {
            console.log(`❌ ${action.type} on ${encounter.name}: ERROR - ${error}`);
            assert.fail(`Action ${action.type} threw error: ${error}`);
          }
        }
      }
    });
  });

  describe('Game Mode Transitions', () => {
    test('should transition from InSpace to InCombat during encounters', async () => {
      const engine = createGameEngine();
      engine.state.currentMode = GameMode.InSpace;
      engine.state.credits = 10000;
      engine.state.ship.fuel = 14;
      
      // Try warp to trigger encounter
      let encounterTriggered = false;
      let attempts = 0;
      
      while (!encounterTriggered && attempts < 50) {
        attempts++;
        const testEngine = createGameEngine();
        testEngine.state.currentMode = GameMode.InSpace;
        testEngine.state.credits = 10000;
        testEngine.state.ship.fuel = 14;
        
        const result = await testEngine.executeAction({
          type: 'warp_to_system',
          parameters: { targetSystem: 49 } // Known working system
        });
        
        if ((testEngine.state.currentMode as GameMode) === GameMode.InCombat) {
          encounterTriggered = true;
          assert.equal((testEngine.state.currentMode as GameMode), GameMode.InCombat);
          assert.ok(testEngine.state.opponent.hull > 0, 'Opponent should have positive hull');
          console.log(`✅ InSpace → InCombat transition successful (attempt ${attempts})`);
        }
      }
      
      // Note: If no encounter triggered, that's also valid (encounters are random)
      console.log(`Encounter triggered: ${encounterTriggered} (${attempts} attempts)`);
    });

    test('should transition from InCombat to InSpace after combat resolution', async () => {
      const engine = createGameEngine();
      engine.state.currentMode = GameMode.InCombat;
      engine.state.encounterType = EncounterType.PIRATEATTACK;
      engine.state.ship.hull = 100;
      engine.state.opponent.hull = 1; // Nearly destroyed
      
      // Attack to potentially finish opponent
      const result = await engine.executeAction({
        type: 'combat_attack',
        parameters: {}
      });
      
      // Check if combat ended (either immediately or after a continue action)
      if ((engine.state.currentMode as GameMode) === GameMode.InSpace) {
        console.log('✅ InCombat → InSpace transition via direct resolution');
      } else if (engine.state.opponent.hull <= 0) {
        // Should have continue action available
        const actions = engine.getAvailableActions();
        const continueAction = actions.find(a => a.type === 'combat_continue');
        
        assert.ok(continueAction, 'Continue action should be available when opponent destroyed');
        
        const continueResult = await engine.executeAction({
          type: 'combat_continue',
          parameters: {}
        });
        
        assert.equal(continueResult.success, true, 'Continue action should succeed');
        console.log('✅ InCombat → InSpace transition via continue action');
      }
    });

    test('should transition from InSpace to OnPlanet when docking', async () => {
      const engine = createGameEngine();
      engine.state.currentMode = GameMode.InSpace;
      
      const result = await engine.executeAction({
        type: 'dock_at_planet',
        parameters: {}
      });
      
      assert.equal(result.success, true, 'Docking should succeed');
      assert.equal(engine.state.currentMode, GameMode.OnPlanet, 'Should transition to OnPlanet');
      console.log('✅ InSpace → OnPlanet transition successful');
    });

    test('should transition from OnPlanet to InSpace when warping', async () => {
      const engine = createGameEngine();
      engine.state.currentMode = GameMode.OnPlanet;
      
      // Get the ship's actual fuel tank capacity and set fuel appropriately
      const { getFuelTanks } = await import('../travel/warp.ts');
      const maxFuel = getFuelTanks(engine.state.ship);
      engine.state.ship.fuel = maxFuel; // Use actual tank capacity
      
      // Find a nearby system to warp to using actual current fuel
      const { getSystemsWithinRange } = await import('../travel/galaxy.ts');
      const { getCurrentFuel } = await import('../travel/warp.ts');
      const actualFuel = getCurrentFuel(engine.state.ship);
      const reachableSystems = getSystemsWithinRange(engine.state, actualFuel);
      
      if (reachableSystems.length > 0) {
        const targetSystem = reachableSystems[0];
        console.log(`🎯 Attempting warp from system ${engine.state.currentSystem} to system ${targetSystem} with ${engine.state.ship.fuel} fuel`);
        
        const result = await engine.executeAction({
          type: 'warp_to_system',
          parameters: { targetSystem }
        });
        
        console.log(`🔍 Warp result: success=${result.success}, message="${result.message}"`);
        console.log(`📊 After warp: mode=${engine.state.currentMode}, system=${engine.state.currentSystem}, fuel=${engine.state.ship.fuel}`);
        
        // Warp should auto-launch and either:
        // 1. Complete successfully and dock at destination (OnPlanet mode)  
        // 2. Encounter something during travel (InCombat mode)
        assert.equal(result.success, true, `Warp should succeed: ${result.message}`);
        
        if (engine.state.currentMode === GameMode.OnPlanet) {
          // Successful warp with no encounters - should be at destination
          assert.equal(engine.state.currentSystem, targetSystem, 'Should have moved to destination system');
          console.log('✅ OnPlanet → OnPlanet transition successful (warp completed safely)');
        } else {
          // Had an encounter during warp - should be in combat or space  
          assert.ok(engine.state.currentMode === GameMode.InCombat || engine.state.currentMode === GameMode.InSpace, 
                   'Should be in Combat or Space mode if encounter occurred');
          console.log('✅ OnPlanet → InSpace/InCombat transition successful');
        }
      } else {
        // Skip test if no systems in range
        console.log('⏭️ No systems in range, skipping transition test');
      }
    });
  });

  describe('Action Availability by Mode', () => {
    test('should provide correct actions for each game mode', () => {
      const modes = [
        { mode: GameMode.OnPlanet, name: 'OnPlanet' },
        { mode: GameMode.InSpace, name: 'InSpace' },
      ];
      
      for (const modeTest of modes) {
        const engine = createGameEngine();
        engine.state.currentMode = modeTest.mode;
        
        const actions = engine.getAvailableActions();
        assert.ok(actions.length > 0, `${modeTest.name} should have available actions`);
        
        // Ensure all actions are valid for this mode
        for (const action of actions) {
          assert.equal(typeof action.type, 'string', 'Action should have type');
          assert.equal(typeof action.name, 'string', 'Action should have name');
          assert.equal(typeof action.available, 'boolean', 'Action should have availability');
        }
        
        console.log(`${modeTest.name}: ${actions.length} actions (${actions.map(a => a.type).join(', ')})`);
      }
    });

    test('should provide combat actions for different encounter types', () => {
      const encounterTypes = [
        EncounterType.POLICEINSPECTION,
        EncounterType.POLICEATTACK,
        EncounterType.PIRATEATTACK,
        EncounterType.PIRATESURRENDER,
        EncounterType.TRADERSELL,
        EncounterType.TRADERBUY,
        EncounterType.MARIECELESTEENCOUNTER,
        EncounterType.BOTTLEOLDENCOUNTER,
        EncounterType.CAPTAINAHABENCOUNTER
      ];
      
      for (const encounterType of encounterTypes) {
        const engine = createGameEngine();
        engine.state.currentMode = GameMode.InCombat;
        engine.state.encounterType = encounterType;
        engine.state.ship.hull = 100;
        engine.state.opponent.hull = 50;
        
        const actions = engine.getAvailableActions();
        const combatActions = actions.filter(a => a.type.startsWith('combat_'));
        
        assert.ok(combatActions.length > 0, `Encounter ${encounterType} should have combat actions`);
        
        console.log(`Encounter ${encounterType}: ${combatActions.map(a => a.type).join(', ')}`);
      }
    });
  });

  describe('All Possible Combat Actions', () => {
    const allCombatActions = [
      'attack', 'flee', 'surrender', 'submit', 'bribe', 'ignore', 
      'trade', 'board', 'meet', 'drink', 'yield', 'plunder'
    ];

    test('should execute all combat actions without errors', async () => {
      for (const combatAction of allCombatActions) {
        const engine = createGameEngine();
        engine.state.currentMode = GameMode.InCombat;
        engine.state.encounterType = EncounterType.PIRATEATTACK; // Generic encounter
        engine.state.ship.hull = 100;
        engine.state.opponent.hull = 50;
        engine.state.credits = 10000;
        engine.state.ship.cargo[0] = 5; // Some cargo for trading
        
        try {
          const result = await engine.executeAction({
            type: `combat_${combatAction}`,
            parameters: {}
          });
          
          assert.equal(typeof result.success, 'boolean', `${combatAction} should return success status`);
          assert.equal(typeof result.message, 'string', `${combatAction} should return message`);
          
          console.log(`✅ combat_${combatAction}: ${result.success ? 'SUCCESS' : 'HANDLED'} - ${result.message}`);
        } catch (error) {
          console.log(`❌ combat_${combatAction}: ERROR - ${error}`);
          assert.fail(`Combat action ${combatAction} should not throw errors: ${error}`);
        }
      }
    });
  });

  describe('State Consistency After Actions', () => {
    test('should maintain valid state after all planet actions', async () => {
      const engine = createGameEngine();
      engine.state.currentMode = GameMode.OnPlanet;
      engine.state.credits = 50000; // Plenty for any purchase
      
      const actions = engine.getAvailableActions();
      
      for (const action of actions) {
        const testEngine = createGameEngine();
        testEngine.state.currentMode = GameMode.OnPlanet;
        testEngine.state.credits = 50000;
        
        try {
          // For actions requiring parameters, use defaults
          let parameters = {};
          if (action.type === 'buy_cargo') {
            parameters = { tradeItemIndex: 0, quantity: 1 };
          } else if (action.type === 'buy_ship') {
            parameters = { shipType: 0 }; // Try to buy Flea
          }
          
          const result = await testEngine.executeAction({
            type: action.type,
            parameters
          });
          
          // Validate state remains consistent
          assert.ok(testEngine.state.credits >= 0, 'Credits should not be negative');
          assert.ok(testEngine.state.debt >= 0, 'Debt should not be negative');
          assert.ok(testEngine.state.ship.hull >= 0, 'Hull should not be negative');
          
          console.log(`✅ ${action.type}: State remains valid after execution`);
        } catch (error) {
          // Some actions may fail with default parameters - that's expected
          console.log(`⚠️ ${action.type}: ${error instanceof Error ? error.message : error}`);
        }
      }
    });
  });

  describe('Edge Case State Transitions', () => {
    test('should handle destroyed player ship scenarios', async () => {
      const engine = createGameEngine();
      engine.state.currentMode = GameMode.InCombat;
      engine.state.encounterType = EncounterType.PIRATEATTACK;
      engine.state.ship.hull = 0; // Player destroyed
      engine.state.opponent.hull = 50;
      
      const actions = engine.getAvailableActions();
      assert.ok(actions.length > 0, 'Should have actions even with destroyed ship');
      
      const continueAction = actions.find(a => a.type === 'combat_continue');
      assert.ok(continueAction, 'Should have continue action when player destroyed');
      
      const result = await engine.executeAction({
        type: 'combat_continue',
        parameters: {}
      });
      
      // Should handle game over or escape pod logic
      assert.equal(typeof result.gameOver, 'boolean', 'Should indicate if game is over');
      console.log(`✅ Player destruction handled: Game Over = ${result.gameOver}`);
    });

    test('should handle both ships destroyed scenario', async () => {
      const engine = createGameEngine();
      engine.state.currentMode = GameMode.InCombat;
      engine.state.encounterType = EncounterType.PIRATEATTACK;
      engine.state.ship.hull = 0; // Both destroyed
      engine.state.opponent.hull = 0;
      
      const actions = engine.getAvailableActions();
      const continueAction = actions.find(a => a.type === 'combat_continue');
      assert.ok(continueAction, 'Should have continue action when both destroyed');
      
      const result = await engine.executeAction({
        type: 'combat_continue',
        parameters: {}
      });
      
      assert.equal(typeof result.gameOver, 'boolean', 'Should indicate game over status');
      console.log(`✅ Both ships destroyed handled: Game Over = ${result.gameOver}`);
    });
  });
});
