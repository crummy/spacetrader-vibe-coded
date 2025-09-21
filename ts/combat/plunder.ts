// Plunder System - Port from Palm OS Space Trader Cargo.c
// Implements cargo plundering from defeated opponents

import type { GameState, Ship, MutableTradeItemArray } from '../types.ts';
import { MAXTRADEITEM } from '../types.ts';
import { getTotalCargoBays, getFilledCargoBays, getAvailableCargoSpace } from '../economy/trading.ts';
import { getTradeItemName } from '../data/tradeItems.ts';
import { EncounterType } from './engine.ts';
import { PLUNDER_TRADER_PENALTY, PLUNDER_PIRATE_PENALTY } from '../reputation/police.ts';

/**
 * Plunder action types
 */
export type PlunderAction = 'select_item' | 'plunder_amount' | 'plunder_all' | 'finish_plunder';

/**
 * Plunder state for UI interaction
 */
export interface PlunderState {
  isActive: boolean;
  opponentCargo: MutableTradeItemArray;
  selectedItem: number;
  availableSpace: number;
  totalPlundered: number;
}

/**
 * Result of a plunder operation
 */
export interface PlunderResult {
  success: boolean;
  message: string;
  itemsPlundered?: Array<{
    itemIndex: number;
    itemName: string;
    quantity: number;
  }>;
  policeRecordPenalty?: number;
}

/**
 * Initialize plunder state for defeated opponent
 */
export function initializePlunderState(state: GameState): PlunderState {
  return {
    isActive: true,
    opponentCargo: [...state.opponent.cargo] as MutableTradeItemArray,
    selectedItem: -1,
    availableSpace: getAvailableCargoSpace(state),
    totalPlundered: 0
  };
}

/**
 * Check if player can plunder (has space and opponent has cargo)
 */
export function canPlunder(state: GameState): { canPlunder: boolean; reason?: string } {
  const availableSpace = getAvailableCargoSpace(state);
  
  if (availableSpace <= 0) {
    return { 
      canPlunder: false, 
      reason: 'No empty cargo bays available for plunder.' 
    };
  }
  
  const opponentHasCargo = state.opponent.cargo.some(qty => qty > 0);
  if (!opponentHasCargo) {
    return { 
      canPlunder: false, 
      reason: 'Opponent ship has no cargo to plunder.' 
    };
  }
  
  return { canPlunder: true };
}

/**
 * Get items available for plundering from opponent
 */
export function getPlunderableItems(opponent: Ship): Array<{
  itemIndex: number;
  itemName: string;
  quantity: number;
  canPlunderAll: boolean;
}> {
  const items: Array<{
    itemIndex: number;
    itemName: string;
    quantity: number;
    canPlunderAll: boolean;
  }> = [];
  
  for (let i = 0; i < MAXTRADEITEM; i++) {
    const quantity = opponent.cargo[i];
    if (quantity > 0) {
      items.push({
        itemIndex: i,
        itemName: getTradeItemName(i),
        quantity,
        canPlunderAll: true
      });
    }
  }
  
  return items;
}

/**
 * Calculate maximum amount that can be plundered of a specific item
 * Based on available space and opponent's cargo
 */
export function getMaxPlunderAmount(
  state: GameState, 
  itemIndex: number
): { maxAmount: number; limitedBy: 'space' | 'availability' | 'none' } {
  const availableSpace = getAvailableCargoSpace(state);
  const opponentQuantity = state.opponent.cargo[itemIndex];
  
  if (opponentQuantity <= 0) {
    return { maxAmount: 0, limitedBy: 'availability' };
  }
  
  if (availableSpace <= 0) {
    return { maxAmount: 0, limitedBy: 'space' };
  }
  
  const maxAmount = Math.min(availableSpace, opponentQuantity);
  
  if (maxAmount === availableSpace && availableSpace < opponentQuantity) {
    return { maxAmount, limitedBy: 'space' };
  } else if (maxAmount === opponentQuantity && opponentQuantity < availableSpace) {
    return { maxAmount, limitedBy: 'availability' };
  } else {
    return { maxAmount, limitedBy: 'none' };
  }
}

/**
 * Validate plunder amount for a specific item
 */
export function validatePlunderAmount(
  state: GameState, 
  itemIndex: number, 
  amount: number
): { valid: boolean; error?: string; adjustedAmount?: number } {
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than zero.' };
  }
  
  const opponentQuantity = state.opponent.cargo[itemIndex];
  if (opponentQuantity <= 0) {
    return { valid: false, error: 'Opponent has none of this item.' };
  }
  
  const availableSpace = getAvailableCargoSpace(state);
  if (availableSpace <= 0) {
    return { valid: false, error: 'No empty cargo bays available.' };
  }
  
  // Calculate the actual amount that can be plundered
  const maxAmount = Math.min(amount, opponentQuantity, availableSpace);
  
  if (maxAmount !== amount) {
    return { 
      valid: true, 
      adjustedAmount: maxAmount,
      error: maxAmount < amount ? 'Amount adjusted to available space/cargo.' : undefined
    };
  }
  
  return { valid: true };
}

/**
 * Execute cargo plundering - port of PlunderCargo() from Cargo.c lines 786-810
 */
export function plunderCargo(
  state: GameState, 
  itemIndex: number, 
  amount: number
): PlunderResult {
  // Validate item index
  if (itemIndex < 0 || itemIndex >= MAXTRADEITEM) {
    return {
      success: false,
      message: 'Invalid item index for plundering.'
    };
  }
  
  // Check if opponent has any of this item
  if (state.opponent.cargo[itemIndex] <= 0) {
    return {
      success: false,
      message: `Opponent has no ${getTradeItemName(itemIndex)} to plunder.`
    };
  }
  
  // Check if player has cargo space
  const availableSpace = getAvailableCargoSpace(state);
  if (availableSpace <= 0) {
    return {
      success: false,
      message: 'No empty cargo bays available for plunder.'
    };
  }
  
  // Calculate actual amount to plunder (minimum of requested, available, space)
  const toPlunder = Math.min(amount, state.opponent.cargo[itemIndex], availableSpace);
  
  // Transfer cargo from opponent to player
  state.ship.cargo[itemIndex] += toPlunder;
  state.opponent.cargo[itemIndex] -= toPlunder;
  
  const itemName = getTradeItemName(itemIndex);
  
  return {
    success: true,
    message: `Plundered ${toPlunder} units of ${itemName}.`,
    itemsPlundered: [{
      itemIndex,
      itemName,
      quantity: toPlunder
    }]
  };
}

/**
 * Plunder all available cargo of a specific item
 */
export function plunderAllCargo(
  state: GameState, 
  itemIndex: number
): PlunderResult {
  const maxAmount = getMaxPlunderAmount(state, itemIndex);
  return plunderCargo(state, itemIndex, maxAmount.maxAmount);
}

/**
 * Apply police record penalty for plundering based on encounter type
 * Based on Encounter.c lines 2144-2147
 */
export function applyPlunderPenalty(state: GameState): number {
  let penalty = 0;
  
  if (EncounterType.isTraderEncounter(state.encounterType)) {
    // Plundering traders is worse for police record
    penalty = PLUNDER_TRADER_PENALTY;
    state.policeRecordScore += penalty;
  } else if (EncounterType.isPirateEncounter(state.encounterType)) {
    // Plundering pirates is less severe
    penalty = PLUNDER_PIRATE_PENALTY;
    state.policeRecordScore += penalty;
  }
  
  return penalty;
}

/**
 * Complete plundering session and apply consequences
 */
export function finishPlundering(state: GameState): PlunderResult {
  const penalty = applyPlunderPenalty(state);
  
  let message = 'Plundering complete.';
  if (penalty !== 0) {
    const recordChange = penalty === PLUNDER_TRADER_PENALTY ? 
      'Your attack on innocent traders damages your reputation.' :
      'Your criminal activity is noted by authorities.';
    message += ` ${recordChange}`;
  }
  
  return {
    success: true,
    message,
    policeRecordPenalty: penalty
  };
}

/**
 * Get plunder state summary for UI display
 */
export function getPlunderSummary(state: GameState): {
  playerCargoSpace: {
    total: number;
    filled: number;
    available: number;
  };
  opponentCargo: Array<{
    itemIndex: number;
    itemName: string;
    quantity: number;
  }>;
  canPlunderMore: boolean;
} {
  const totalSpace = getTotalCargoBays(state);
  const filledSpace = getFilledCargoBays(state);
  const availableSpace = totalSpace - filledSpace;
  
  const opponentCargo = [];
  for (let i = 0; i < MAXTRADEITEM; i++) {
    const quantity = state.opponent.cargo[i];
    if (quantity > 0) {
      opponentCargo.push({
        itemIndex: i,
        itemName: getTradeItemName(i),
        quantity
      });
    }
  }
  
  return {
    playerCargoSpace: {
      total: totalSpace,
      filled: filledSpace,
      available: availableSpace
    },
    opponentCargo,
    canPlunderMore: availableSpace > 0 && opponentCargo.length > 0
  };
}

/**
 * Create plunder actions for UI selection
 */
export function createPlunderActions(state: GameState): Array<{
  action: PlunderAction;
  itemIndex?: number;
  itemName?: string;
  maxAmount?: number;
  description: string;
}> {
  const actions: Array<{
    action: PlunderAction;
    itemIndex?: number;
    itemName?: string;
    maxAmount?: number;
    description: string;
  }> = [];
  
  const plunderableItems = getPlunderableItems(state.opponent);
  const availableSpace = getAvailableCargoSpace(state);
  
  for (const item of plunderableItems) {
    if (availableSpace > 0) {
      const maxAmount = Math.min(item.quantity, availableSpace);
      
      // Action to plunder all of this item type
      actions.push({
        action: 'plunder_all',
        itemIndex: item.itemIndex,
        itemName: item.itemName,
        maxAmount,
        description: `Take all ${item.itemName} (${maxAmount} units)`
      });
      
      // Action to select specific amount
      actions.push({
        action: 'select_item',
        itemIndex: item.itemIndex,
        itemName: item.itemName,
        maxAmount,
        description: `Select amount of ${item.itemName} to take`
      });
    }
  }
  
  // Always include finish action
  actions.push({
    action: 'finish_plunder',
    description: 'Finish plundering and continue'
  });
  
  return actions;
}

/**
 * Process plunder action based on player choice
 */
export function processPlunderAction(
  state: GameState,
  action: PlunderAction,
  itemIndex?: number,
  amount?: number
): PlunderResult {
  switch (action) {
    case 'plunder_all':
      if (itemIndex === undefined) {
        return { success: false, message: 'Item index required for plunder_all action.' };
      }
      return plunderAllCargo(state, itemIndex);
      
    case 'plunder_amount':
      if (itemIndex === undefined || amount === undefined) {
        return { success: false, message: 'Item index and amount required for plunder_amount action.' };
      }
      return plunderCargo(state, itemIndex, amount);
      
    case 'finish_plunder':
      return finishPlundering(state);
      
    default:
      return { success: false, message: 'Unknown plunder action.' };
  }
}
