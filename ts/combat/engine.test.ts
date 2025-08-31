// Combat System Tests
// Test-Driven Development: Write tests FIRST before implementation

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import type { GameState } from '../types.ts';
import { createInitialState } from '../state.ts';
import { GameMode } from '../types.ts';
import { 
  // Encounter Type Management
  EncounterType,
  startEncounter, endEncounter, getCurrentEncounter,
  
  // Combat Actions
  attemptFlee, attemptSurrender, attemptBribe,
  canPerformAction, getAvailableActions,
  
  // Combat Calculations
  calculateWeaponPower, calculateShieldPower, calculateHullStrength,
  calculateDamage, applyDamage,
  
  // Combat Resolution
  resolveCombatRound, determineCombatOutcome,
  
  // Encounter System Integration
  createEncounterState, updateEncounterState
} from './engine.ts';
import type { 
  CombatAction, CombatOutcome, EncounterState 
} from './engine.ts';

describe('Combat System Engine', () => {

  describe('Encounter Type Constants', () => {
    test('should have correct encounter type values matching Palm OS', () => {
      // Police encounters
      assert.equal(EncounterType.POLICEINSPECTION, 0);
      assert.equal(EncounterType.POLICEIGNORE, 1);
      assert.equal(EncounterType.POLICEATTACK, 2);
      assert.equal(EncounterType.POLICEFLEE, 3);
      
      // Pirate encounters
      assert.equal(EncounterType.PIRATEATTACK, 10);
      assert.equal(EncounterType.PIRATEFLEE, 11);
      assert.equal(EncounterType.PIRATEIGNORE, 12);
      assert.equal(EncounterType.PIRATESURRENDER, 13);
      
      // Trader encounters
      assert.equal(EncounterType.TRADERIGNORE, 20);
      assert.equal(EncounterType.TRADERFLEE, 21);
      assert.equal(EncounterType.TRADERATTACK, 22);
      assert.equal(EncounterType.TRADERSELL, 24);
      assert.equal(EncounterType.TRADERBUY, 25);
      
      // Monster encounters
      assert.equal(EncounterType.SPACEMONSTERATTACK, 30);
      assert.equal(EncounterType.SPACEMONSTERIGNORE, 31);
      
      // Special encounters
      assert.equal(EncounterType.MARIECELESTEENCOUNTER, 80);
    });

    test('should provide encounter type validation functions', () => {
      assert.equal(typeof EncounterType.isPoliceEncounter, 'function');
      assert.equal(typeof EncounterType.isPirateEncounter, 'function');
      assert.equal(typeof EncounterType.isTraderEncounter, 'function');
      assert.equal(typeof EncounterType.isMonsterEncounter, 'function');
    });
  });

  describe('Encounter Management', () => {
    test('should start encounter and change game mode to combat', () => {
      const state = createInitialState();
      const result = startEncounter(state, EncounterType.PIRATEATTACK);
      
      assert.equal(result.success, true);
      assert.equal(state.currentMode, GameMode.InCombat);
      assert.equal(state.encounterType, EncounterType.PIRATEATTACK);
    });

    test('should not start encounter if already in combat', () => {
      const state = createInitialState();
      state.currentMode = GameMode.InCombat;
      state.encounterType = EncounterType.POLICEATTACK;
      
      const result = startEncounter(state, EncounterType.PIRATEATTACK);
      
      assert.equal(result.success, false);
      assert.equal(result.message, 'Already in combat');
      assert.equal(state.encounterType, EncounterType.POLICEATTACK); // Unchanged
    });

    test('should end encounter and return to space mode', () => {
      const state = createInitialState();
      state.currentMode = GameMode.InCombat;
      state.encounterType = EncounterType.PIRATEATTACK;
      
      endEncounter(state);
      
      assert.equal(state.currentMode, GameMode.InSpace);
      assert.equal(state.encounterType, -1); // No encounter
    });

    test('should get current encounter information', () => {
      const state = createInitialState();
      state.encounterType = EncounterType.POLICEINSPECTION;
      
      const encounter = getCurrentEncounter(state);
      
      assert.equal(encounter.type, EncounterType.POLICEINSPECTION);
      assert.equal(encounter.name, 'Police Inspection');
      assert.equal(encounter.isActive, false); // Not in combat mode
    });
  });

  describe('Combat Actions', () => {
    test('should validate available actions based on encounter type', () => {
      const state = createInitialState();
      state.encounterType = EncounterType.PIRATEATTACK;
      
      const actions = getAvailableActions(state);
      
      assert.ok(actions.includes('attack'));
      assert.ok(actions.includes('flee'));
      assert.ok(actions.includes('surrender'));
      assert.ok(!actions.includes('bribe')); // Not available for pirate attack
    });

    test('should validate police inspection actions', () => {
      const state = createInitialState();
      state.encounterType = EncounterType.POLICEINSPECTION;
      
      const actions = getAvailableActions(state);
      
      assert.ok(actions.includes('attack'));
      assert.ok(actions.includes('flee'));
      assert.ok(actions.includes('submit'));
      assert.ok(actions.includes('bribe'));
    });

    test('should check if action can be performed', () => {
      const state = createInitialState();
      state.encounterType = EncounterType.PIRATEATTACK;
      
      assert.equal(canPerformAction(state, 'attack'), true);
      assert.equal(canPerformAction(state, 'flee'), true);
      assert.equal(canPerformAction(state, 'bribe'), false);
      assert.equal(canPerformAction(state, 'trade'), false);
    });
  });

  describe('Combat Calculations', () => {
    test('should calculate weapon power correctly', () => {
      const state = createInitialState();
      
      // Set up ship with weapons
      state.ship.weapon = [0, 1, -1]; // Pulse laser + Beam laser + empty
      
      const weaponPower = calculateWeaponPower(state.ship);
      
      assert.ok(weaponPower > 0);
      assert.equal(typeof weaponPower, 'number');
    });

    test('should calculate shield power correctly', () => {
      const state = createInitialState();
      
      // Set up ship with shields
      state.ship.shield = [0, 1, -1]; // Energy shield + Reflective shield + empty
      state.ship.shieldStrength = [10, 15, 0]; // Current shield strength
      
      const shieldPower = calculateShieldPower(state.ship);
      
      assert.ok(shieldPower > 0);
      assert.equal(typeof shieldPower, 'number');
    });

    test('should calculate hull strength correctly', () => {
      const state = createInitialState();
      state.ship.hull = 100;
      
      const hullStrength = calculateHullStrength(state.ship);
      
      assert.equal(hullStrength, 100);
    });

    test('should calculate damage based on weapons vs shields', () => {
      const state = createInitialState();
      
      // Attacker with weapons
      state.ship.weapon = [0, 1, -1]; 
      
      // Defender with shields
      state.opponent.shield = [0, -1, -1];
      state.opponent.shieldStrength = [5, 0, 0];
      
      const damage = calculateDamage(state.ship, state.opponent);
      
      assert.ok(damage >= 0);
      assert.equal(typeof damage, 'number');
    });

    test('should apply damage to shields first, then hull', () => {
      const state = createInitialState();
      
      // Set up defender
      state.opponent.shield = [0, -1, -1];
      state.opponent.shieldStrength = [10, 0, 0];
      state.opponent.hull = 50;
      
      const damage = 15; // More than shield strength
      
      applyDamage(state.opponent, damage);
      
      // Shield should be depleted, hull should take remaining damage
      assert.equal(state.opponent.shieldStrength[0], 0);
      assert.equal(state.opponent.hull, 45); // 50 - (15 - 10)
    });
  });

  describe('Combat Resolution', () => {
    test('should resolve combat round with mutual attacks', () => {
      const state = createInitialState();
      state.currentMode = GameMode.InCombat;
      state.encounterType = EncounterType.PIRATEATTACK;
      
      // Set up ships for combat
      state.ship.weapon = [0, -1, -1]; // Basic weapon
      state.ship.hull = 50;
      state.opponent.weapon = [0, -1, -1]; // Basic weapon  
      state.opponent.hull = 30;
      
      const result = resolveCombatRound(state, 'attack');
      
      assert.equal(result.success, true);
      assert.ok(result.playerDamage >= 0);
      assert.ok(result.opponentDamage >= 0);
      assert.equal(typeof result.message, 'string');
    });

    test('should determine combat outcome when ship is destroyed', () => {
      const state = createInitialState();
      state.ship.hull = 0; // Player ship destroyed
      state.opponent.hull = 10; // Opponent still alive
      
      const outcome = determineCombatOutcome(state);
      
      assert.equal(outcome.result, 'defeat');
      assert.equal(outcome.playerDestroyed, true);
      assert.equal(outcome.opponentDestroyed, false);
    });

    test('should determine combat outcome when opponent is destroyed', () => {
      const state = createInitialState();
      state.ship.hull = 25; // Player still alive
      state.opponent.hull = 0; // Opponent destroyed
      
      const outcome = determineCombatOutcome(state);
      
      assert.equal(outcome.result, 'victory');
      assert.equal(outcome.playerDestroyed, false);
      assert.equal(outcome.opponentDestroyed, true);
      assert.ok(outcome.bounty >= 0);
    });

    test('should handle flee attempts based on ship capabilities', () => {
      const state = createInitialState();
      state.encounterType = EncounterType.PIRATEATTACK;
      
      const result = attemptFlee(state);
      
      assert.equal(typeof result.success, 'boolean');
      assert.equal(typeof result.message, 'string');
      
      if (result.success) {
        assert.equal(state.currentMode, GameMode.InSpace);
      }
    });

    test('should handle surrender attempts', () => {
      const state = createInitialState();
      state.encounterType = EncounterType.PIRATEATTACK;
      
      const result = attemptSurrender(state);
      
      assert.equal(typeof result.success, 'boolean');
      assert.equal(typeof result.message, 'string');
      
      if (result.success) {
        // Should lose cargo/credits but end combat
        assert.equal(state.currentMode, GameMode.InSpace);
      }
    });
  });

  describe('Encounter State Management', () => {
    test('should create encounter state with proper initialization', () => {
      const state = createInitialState();
      const encounterState = createEncounterState(state, EncounterType.PIRATEATTACK);
      
      assert.equal(encounterState.type, EncounterType.PIRATEATTACK);
      assert.equal(encounterState.isActive, true);
      assert.ok(Array.isArray(encounterState.availableActions));
      assert.equal(typeof encounterState.turnNumber, 'number');
    });

    test('should update encounter state after actions', () => {
      const state = createInitialState();
      let encounterState = createEncounterState(state, EncounterType.PIRATEATTACK);
      
      encounterState = updateEncounterState(encounterState, 'attack', {
        playerDamage: 10,
        opponentDamage: 5,
        success: true,
        message: 'Attack successful'
      });
      
      assert.equal(encounterState.turnNumber, 2);
      assert.ok(encounterState.combatLog.length > 0);
      assert.equal(encounterState.combatLog[0].action, 'attack');
    });
  });

  describe('Integration with Game State', () => {
    test('should properly integrate with ship equipment system', () => {
      const state = createInitialState();
      
      // Set up ship with specific equipment
      state.ship.weapon = [2, -1, -1]; // Military laser
      state.ship.shield = [1, -1, -1]; // Reflective shield
      
      const weaponPower = calculateWeaponPower(state.ship);
      const shieldPower = calculateShieldPower(state.ship);
      
      // Should reflect the equipment capabilities
      assert.ok(weaponPower > 0);
      assert.ok(shieldPower > 0);
    });

    test('should handle crew skill bonuses in combat', () => {
      const state = createInitialState();
      
      // Set up crew with fighter skills
      state.ship.crew = [0, -1, -1]; // Commander only
      // Crew skills would be checked from mercenary data
      
      const weaponPower = calculateWeaponPower(state.ship);
      
      // Should factor in crew fighter skills
      assert.ok(weaponPower >= 0);
    });

    test('should integrate with reputation and police record', () => {
      const state = createInitialState();
      state.policeRecordScore = -500; // Criminal record
      
      const encounterState = createEncounterState(state, EncounterType.POLICEINSPECTION);
      
      // Criminal record should affect available actions
      assert.ok(encounterState.availableActions.length > 0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle ships with no weapons', () => {
      const state = createInitialState();
      state.ship.weapon = [-1, -1, -1]; // No weapons
      
      const weaponPower = calculateWeaponPower(state.ship);
      
      assert.equal(weaponPower, 0); // No weapon power
    });

    test('should handle ships with no shields', () => {
      const state = createInitialState();
      state.ship.shield = [-1, -1, -1]; // No shields
      state.ship.shieldStrength = [0, 0, 0];
      
      const shieldPower = calculateShieldPower(state.ship);
      
      assert.equal(shieldPower, 0); // No shield power
    });

    test('should validate encounter type ranges', () => {
      assert.equal(EncounterType.isPoliceEncounter(EncounterType.POLICEATTACK), true);
      assert.equal(EncounterType.isPoliceEncounter(EncounterType.PIRATEATTACK), false);
      
      assert.equal(EncounterType.isPirateEncounter(EncounterType.PIRATEATTACK), true);
      assert.equal(EncounterType.isPirateEncounter(EncounterType.POLICEATTACK), false);
      
      assert.equal(EncounterType.isTraderEncounter(EncounterType.TRADERSELL), true);
      assert.equal(EncounterType.isTraderEncounter(EncounterType.PIRATEATTACK), false);
    });

    test('should handle invalid combat actions gracefully', () => {
      const state = createInitialState();
      state.encounterType = EncounterType.PIRATEATTACK;
      
      assert.equal(canPerformAction(state, 'invalidAction'), false);
      assert.equal(canPerformAction(state, ''), false);
    });
  });
});