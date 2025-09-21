// Plunder System Tests
import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert';

import type { GameState, Ship } from '../types.ts';
import { createInitialState, createEmptyShip } from '../state.ts';
import { EncounterType } from './engine.ts';
import {
  canPlunder,
  initializePlunderState,
  getPlunderableItems,
  getMaxPlunderAmount,
  validatePlunderAmount,
  plunderCargo,
  plunderAllCargo,
  applyPlunderPenalty,
  finishPlundering,
  getPlunderSummary,
  createPlunderActions,
  processPlunderAction,
  type PlunderAction
} from './plunder.ts';
import { PLUNDER_TRADER_PENALTY, PLUNDER_PIRATE_PENALTY } from '../reputation/police.ts';

describe('Plunder System', () => {
  let state: GameState;
  let opponent: Ship;

  beforeEach(() => {
    state = createInitialState();
    state.currentMode = 1; // InCombat
    
    // Set up player ship with some empty cargo space
    state.ship = createEmptyShip();
    state.ship.type = 1; // Gnat with 15 cargo bays
    state.ship.cargo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Empty cargo
    
    // Set up opponent with some cargo
    opponent = createEmptyShip();
    opponent.type = 1; // Gnat
    opponent.cargo = [5, 3, 0, 2, 0, 1, 0, 0, 4, 0]; // Mixed cargo: Water=5, Furs=3, Ore=2, Firearms=1, Narcotics=4
    state.opponent = opponent;
  });

  describe('canPlunder', () => {
    it('should allow plundering when player has space and opponent has cargo', () => {
      const result = canPlunder(state);
      assert.strictEqual(result.canPlunder, true);
      assert.strictEqual(result.reason, undefined);
    });

    it('should prevent plundering when player has no cargo space', () => {
      // Fill all cargo bays
      state.ship.cargo = [2, 2, 2, 2, 2, 1, 0, 0, 0, 0]; // Total 11 units < Gnat's 15 cargo space 
      // Actually need to make it exactly full
      state.ship.cargo = [2, 2, 2, 2, 2, 1, 1, 1, 1, 1]; // Total 15 units = Gnat's 15 cargo space
      
      const result = canPlunder(state);
      assert.strictEqual(result.canPlunder, false);
      assert.strictEqual(result.reason, 'No empty cargo bays available for plunder.');
    });

    it('should prevent plundering when opponent has no cargo', () => {
      state.opponent.cargo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      
      const result = canPlunder(state);
      assert.strictEqual(result.canPlunder, false);
      assert.strictEqual(result.reason, 'Opponent ship has no cargo to plunder.');
    });
  });

  describe('initializePlunderState', () => {
    it('should create proper plunder state', () => {
      const plunderState = initializePlunderState(state);
      
      assert.strictEqual(plunderState.isActive, true);
      assert.deepStrictEqual(plunderState.opponentCargo, opponent.cargo);
      assert.strictEqual(plunderState.selectedItem, -1);
      assert.strictEqual(plunderState.availableSpace, 15); // Gnat default cargo space
      assert.strictEqual(plunderState.totalPlundered, 0);
    });
  });

  describe('getPlunderableItems', () => {
    it('should return all items with quantities > 0', () => {
      const items = getPlunderableItems(opponent);
      
      assert.strictEqual(items.length, 5); // Water, Furs, Ore, Firearms, Narcotics
      assert.strictEqual(items[0].itemIndex, 0); // Water
      assert.strictEqual(items[0].quantity, 5);
      assert.strictEqual(items[0].itemName, 'Water');
      assert.strictEqual(items[0].canPlunderAll, true);
    });

    it('should return empty array when opponent has no cargo', () => {
      opponent.cargo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const items = getPlunderableItems(opponent);
      
      assert.strictEqual(items.length, 0);
    });
  });

  describe('getMaxPlunderAmount', () => {
    it('should be limited by cargo space when space < opponent quantity', () => {
      // Fill player cargo to leave only 2 spaces
      state.ship.cargo = [2, 2, 2, 2, 2, 1, 1, 1, 0, 0]; // 13/15 used, 2 available
      
      const result = getMaxPlunderAmount(state, 0); // Water (opponent has 5)
      assert.strictEqual(result.maxAmount, 2);
      assert.strictEqual(result.limitedBy, 'space');
    });

    it('should be limited by availability when opponent quantity < space', () => {
      const result = getMaxPlunderAmount(state, 3); // Ore (opponent has 2)
      assert.strictEqual(result.maxAmount, 2);
      assert.strictEqual(result.limitedBy, 'availability');
    });

    it('should return 0 when opponent has none of the item', () => {
      const result = getMaxPlunderAmount(state, 2); // Food (opponent has 0)
      assert.strictEqual(result.maxAmount, 0);
      assert.strictEqual(result.limitedBy, 'availability');
    });
  });

  describe('validatePlunderAmount', () => {
    it('should accept valid amount', () => {
      const result = validatePlunderAmount(state, 0, 3); // 3 Water (opponent has 5, player has space)
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.adjustedAmount, undefined);
    });

    it('should adjust amount when exceeding space', () => {
      // Fill cargo to leave only 2 spaces
      state.ship.cargo = [2, 2, 2, 2, 2, 1, 1, 1, 0, 0]; // 13/15 used
      
      const result = validatePlunderAmount(state, 0, 4); // Want 4 Water but only 2 space
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.adjustedAmount, 2);
      assert.strictEqual(result.error, 'Amount adjusted to available space/cargo.');
    });

    it('should reject zero or negative amounts', () => {
      const result = validatePlunderAmount(state, 0, 0);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, 'Amount must be greater than zero.');
    });

    it('should reject when opponent has none of item', () => {
      const result = validatePlunderAmount(state, 2, 1); // Food (opponent has 0)
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, 'Opponent has none of this item.');
    });
  });

  describe('plunderCargo', () => {
    it('should successfully transfer cargo from opponent to player', () => {
      const result = plunderCargo(state, 0, 3); // 3 Water
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.message, 'Plundered 3 units of Water.');
      assert.strictEqual(state.ship.cargo[0], 3);
      assert.strictEqual(state.opponent.cargo[0], 2); // 5 - 3 = 2
      assert.strictEqual(result.itemsPlundered?.length, 1);
      assert.strictEqual(result.itemsPlundered?.[0].quantity, 3);
    });

    it('should limit plunder to available cargo space', () => {
      // Fill cargo to leave only 2 spaces
      state.ship.cargo = [2, 2, 2, 2, 2, 1, 1, 1, 0, 0]; // 13/15 used
      
      const result = plunderCargo(state, 0, 5); // Want 5 Water but only 2 space
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.message, 'Plundered 2 units of Water.');
      assert.strictEqual(state.ship.cargo[0], 4); // Had 2, now has 2 + 2 = 4
      assert.strictEqual(state.opponent.cargo[0], 3); // Had 5, now has 5 - 2 = 3
    });

    it('should limit plunder to opponent available quantity', () => {
      const result = plunderCargo(state, 3, 5); // Want 5 Ore but opponent only has 2
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.message, 'Plundered 2 units of Ore.');
      assert.strictEqual(state.ship.cargo[3], 2);
      assert.strictEqual(state.opponent.cargo[3], 0);
    });

    it('should fail when opponent has none of the item', () => {
      const result = plunderCargo(state, 2, 1); // Food (opponent has 0)
      
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.message, 'Opponent has no Food to plunder.');
    });

    it('should fail when player has no cargo space', () => {
      // Fill all cargo
      state.ship.cargo = [2, 2, 2, 2, 2, 1, 1, 1, 1, 1]; // 15/15 used
      
      const result = plunderCargo(state, 0, 1);
      
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.message, 'No empty cargo bays available for plunder.');
    });
  });

  describe('plunderAllCargo', () => {
    it('should plunder all available cargo of specified type', () => {
      const result = plunderAllCargo(state, 3); // All Ore (opponent has 2)
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.message, 'Plundered 2 units of Ore.');
      assert.strictEqual(state.ship.cargo[3], 2);
      assert.strictEqual(state.opponent.cargo[3], 0);
    });

    it('should be limited by available cargo space', () => {
      // Fill cargo to leave only 2 spaces
      state.ship.cargo = [2, 2, 2, 2, 2, 1, 1, 1, 0, 0]; // 13/15 used
      
      const result = plunderAllCargo(state, 0); // All Water (opponent has 5, but only 2 space)
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.message, 'Plundered 2 units of Water.');
      assert.strictEqual(state.ship.cargo[0], 4); // Had 2, gained 2
      assert.strictEqual(state.opponent.cargo[0], 3); // Had 5, lost 2
    });
  });

  describe('applyPlunderPenalty', () => {
    it('should apply trader penalty when plundering traders', () => {
      state.encounterType = EncounterType.TRADERSURRENDER;
      const initialScore = state.policeRecordScore;
      
      const penalty = applyPlunderPenalty(state);
      
      assert.strictEqual(penalty, PLUNDER_TRADER_PENALTY);
      assert.strictEqual(state.policeRecordScore, initialScore + PLUNDER_TRADER_PENALTY);
    });

    it('should apply pirate penalty when plundering pirates', () => {
      state.encounterType = EncounterType.PIRATESURRENDER;
      const initialScore = state.policeRecordScore;
      
      const penalty = applyPlunderPenalty(state);
      
      assert.strictEqual(penalty, PLUNDER_PIRATE_PENALTY);
      assert.strictEqual(state.policeRecordScore, initialScore + PLUNDER_PIRATE_PENALTY);
    });

    it('should apply no penalty for other encounter types', () => {
      state.encounterType = EncounterType.SPACEMONSTERATTACK;
      const initialScore = state.policeRecordScore;
      
      const penalty = applyPlunderPenalty(state);
      
      assert.strictEqual(penalty, 0);
      assert.strictEqual(state.policeRecordScore, initialScore);
    });
  });

  describe('finishPlundering', () => {
    it('should apply appropriate penalty and return completion message', () => {
      state.encounterType = EncounterType.TRADERSURRENDER;
      
      const result = finishPlundering(state);
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.policeRecordPenalty, PLUNDER_TRADER_PENALTY);
      assert(result.message.includes('Your attack on innocent traders'));
    });
  });

  describe('getPlunderSummary', () => {
    it('should return comprehensive plunder status', () => {
      // Set some player cargo
      state.ship.cargo = [2, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 2/15 used
      
      const summary = getPlunderSummary(state);
      
      assert.strictEqual(summary.playerCargoSpace.total, 15);
      assert.strictEqual(summary.playerCargoSpace.filled, 2);
      assert.strictEqual(summary.playerCargoSpace.available, 13);
      assert.strictEqual(summary.opponentCargo.length, 5); // Water, Furs, Ore, Firearms, Narcotics
      assert.strictEqual(summary.canPlunderMore, true);
    });

    it('should indicate when no more plundering is possible', () => {
      // Fill all player cargo
      state.ship.cargo = [2, 2, 2, 2, 2, 1, 1, 1, 1, 1]; // 15/15 used
      
      const summary = getPlunderSummary(state);
      
      assert.strictEqual(summary.canPlunderMore, false);
    });
  });

  describe('createPlunderActions', () => {
    it('should create actions for all plunderable items', () => {
      const actions = createPlunderActions(state);
      
      // Should have 2 actions per plunderable item (plunder_all + select_item) + finish
      // 5 plunderable items * 2 + 1 finish = 11 actions
      assert.strictEqual(actions.length, 11);
      
      const waterActions = actions.filter(a => a.itemName === 'Water');
      assert.strictEqual(waterActions.length, 2); // plunder_all and select_item
      
      const finishAction = actions.find(a => a.action === 'finish_plunder');
      assert(finishAction);
      assert.strictEqual(finishAction.description, 'Finish plundering and continue');
    });

    it('should not create actions when player has no cargo space', () => {
      // Fill all cargo
      state.ship.cargo = [2, 2, 2, 2, 2, 1, 1, 1, 1, 1]; // 15/15 used
      
      const actions = createPlunderActions(state);
      
      // Should only have finish action when no space available
      assert.strictEqual(actions.length, 1);
      assert.strictEqual(actions[0].action, 'finish_plunder');
    });
  });

  describe('processPlunderAction', () => {
    it('should process plunder_all action', () => {
      const result = processPlunderAction(state, 'plunder_all', 0); // All Water
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.message, 'Plundered 5 units of Water.');
      assert.strictEqual(state.ship.cargo[0], 5);
      assert.strictEqual(state.opponent.cargo[0], 0);
    });

    it('should process plunder_amount action', () => {
      const result = processPlunderAction(state, 'plunder_amount', 1, 2); // 2 Furs
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.message, 'Plundered 2 units of Furs.');
      assert.strictEqual(state.ship.cargo[1], 2);
      assert.strictEqual(state.opponent.cargo[1], 1); // 3 - 2 = 1
    });

    it('should process finish_plunder action', () => {
      state.encounterType = EncounterType.PIRATESURRENDER;
      
      const result = processPlunderAction(state, 'finish_plunder');
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.policeRecordPenalty, PLUNDER_PIRATE_PENALTY);
    });

    it('should handle invalid actions', () => {
      const result = processPlunderAction(state, 'invalid_action' as PlunderAction);
      
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.message, 'Unknown plunder action.');
    });

    it('should handle missing parameters', () => {
      const result = processPlunderAction(state, 'plunder_all'); // Missing itemIndex
      
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.message, 'Item index required for plunder_all action.');
    });
  });

  describe('Integration tests', () => {
    it('should handle complete plundering session', () => {
      // Initial state check
      assert.strictEqual(state.ship.cargo[0], 0); // No Water initially
      assert.strictEqual(state.opponent.cargo[0], 5); // Opponent has 5 Water
      
      // Plunder some water
      let result = processPlunderAction(state, 'plunder_amount', 0, 3);
      assert.strictEqual(result.success, true);
      assert.strictEqual(state.ship.cargo[0], 3);
      assert.strictEqual(state.opponent.cargo[0], 2);
      
      // Plunder all remaining water
      result = processPlunderAction(state, 'plunder_all', 0);
      assert.strictEqual(result.success, true);
      assert.strictEqual(state.ship.cargo[0], 5);
      assert.strictEqual(state.opponent.cargo[0], 0);
      
      // Plunder some furs
      result = processPlunderAction(state, 'plunder_all', 1);
      assert.strictEqual(result.success, true);
      assert.strictEqual(state.ship.cargo[1], 3);
      assert.strictEqual(state.opponent.cargo[1], 0);
      
      // Finish plundering
      state.encounterType = EncounterType.TRADERSURRENDER;
      result = processPlunderAction(state, 'finish_plunder');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.policeRecordPenalty, PLUNDER_TRADER_PENALTY);
    });

    it('should respect cargo space limits throughout session', () => {
      // Fill cargo to leave only 3 spaces
      state.ship.cargo = [2, 2, 2, 2, 2, 1, 1, 0, 0, 0]; // 12/15 used, 3 available
      
      // Try to plunder 5 water (should be limited to 3)
      let result = processPlunderAction(state, 'plunder_all', 0);
      assert.strictEqual(result.success, true);
      assert.strictEqual(state.ship.cargo[0], 5); // Had 2, gained 3, now 5
      assert.strictEqual(state.opponent.cargo[0], 2); // Had 5, lost 3, now 2
      
      // Now no space left - further plundering should fail
      result = processPlunderAction(state, 'plunder_amount', 1, 1);
      assert.strictEqual(result.success, false);
      assert(result.message.includes('No empty cargo bays'));
    });
  });
});
