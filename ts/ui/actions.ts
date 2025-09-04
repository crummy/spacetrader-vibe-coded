// Action System - Pure functions for action handling
// No state management, just pure transformations

import type { GameState } from '../types.ts';
import type { AvailableAction } from '../engine/game.ts';
import { getAllSystemPrices } from '../economy/pricing.ts';
import { getCurrentShipStatus } from '../engine/game.ts';
import { getSystemsWithinRange } from '../travel/galaxy.ts';
import { getSolarSystemName } from '../data/systems.ts';
import { calculateDistance } from '../travel/warp.ts';

/**
 * Render available actions as menu text
 * Pure function: AvailableAction[] → string
 */
export function renderActionMenu(actions: AvailableAction[]): string {
  if (actions.length === 0) {
    return 'No actions available. Press Enter to continue...';
  }
  
  const lines = ['Available Actions:'];
  
  actions.forEach((action, index) => {
    const status = action.available ? '' : ' (unavailable)';
    lines.push(`${index + 1}. ${action.name}${status}`);
  });
  
  lines.push('0. Quit Game');
  
  return lines.join('\n');
}

/**
 * Get action parameters for actions that need additional input
 * Returns the UI prompts and validation for parameter collection
 */
export function getActionParameterPrompts(action: AvailableAction, state: GameState): ActionParameterPrompt | null {
  switch (action.type) {
    case 'buy_cargo':
    case 'sell_cargo':
      return createTradeParameterPrompt(action, state);
    case 'warp_to_system':
      return createWarpParameterPrompt(action, state);
    case 'buy_ship':
      return createShipPurchaseParameterPrompt(action, state);
    default:
      return null; // No parameters needed
  }
}

export interface ActionParameterPrompt {
  prompts: Array<{
    question: string;
    validation: (input: string) => { valid: boolean; errorMessage?: string; value?: any };
  }>;
  buildParameters: (responses: any[]) => any;
}

/**
 * Create trade parameter collection prompts
 */
function createTradeParameterPrompt(action: AvailableAction, state: GameState): ActionParameterPrompt {
  const tradeItemNames = ['Water', 'Furs', 'Food', 'Ore', 'Games', 'Firearms', 'Medicine', 'Machinery', 'Narcotics', 'Robots'];
  const shipStatus = getCurrentShipStatus(state);
  const availableCargoSpace = shipStatus.cargoCapacity - shipStatus.cargoUsed;
  const currentSystem = state.solarSystem[state.currentSystem];
  const allPrices = getAllSystemPrices(currentSystem, state.commanderTrader, state.policeRecordScore);
  
  // Build item list
  const itemOptions = [];
  if (action.type === 'buy_cargo') {
    for (let i = 0; i < tradeItemNames.length; i++) {
      const buyPrice = allPrices[i].buyPrice;
      if (buyPrice > 0) {
        const maxAffordable = Math.min(Math.floor(state.credits / buyPrice), availableCargoSpace);
        itemOptions.push({
          index: i,
          name: tradeItemNames[i],
          price: buyPrice,
          max: maxAffordable,
          description: `${tradeItemNames[i]} - ${buyPrice} credits each (max: ${maxAffordable})`
        });
      }
    }
  } else {
    for (let i = 0; i < tradeItemNames.length; i++) {
      const current = state.ship.cargo[i] || 0;
      const sellPrice = allPrices[i].sellPrice;
      if (current > 0 && sellPrice > 0) {
        itemOptions.push({
          index: i,
          name: tradeItemNames[i],
          price: sellPrice,
          max: current,
          description: `${tradeItemNames[i]} - ${sellPrice} credits each (you have: ${current})`
        });
      }
    }
  }
  
  const itemListText = action.type === 'buy_cargo' ? 'Available for Purchase:' : 'Available for Sale:';
  const itemMenu = [itemListText, ...itemOptions.map((item, idx) => `${idx + 1}. ${item.description}`)].join('\n');
  
  return {
    prompts: [
      {
        question: `${itemMenu}\n\nSelect item (1-${itemOptions.length}): `,
        validation: (input: string) => {
          const choice = parseInt(input.trim());
          if (isNaN(choice) || choice < 1 || choice > itemOptions.length) {
            return { valid: false, errorMessage: `Please enter a number between 1 and ${itemOptions.length}` };
          }
          return { valid: true, value: itemOptions[choice - 1] };
        }
      },
      {
        question: '', // Will be set dynamically based on first choice
        validation: (input: string) => {
          const quantity = parseInt(input.trim());
          return { valid: !isNaN(quantity) && quantity > 0, value: quantity };
        }
      }
    ],
    buildParameters: (responses: any[]) => {
      const selectedItem = responses[0];
      const quantity = responses[1];
      
      // Update second prompt question dynamically
      const prompts = createTradeParameterPrompt(action, state);
      prompts.prompts[1].question = `Enter quantity (1-${selectedItem.max}): `;
      prompts.prompts[1].validation = (input: string) => {
        const qty = parseInt(input.trim());
        if (isNaN(qty) || qty <= 0 || qty > selectedItem.max) {
          return { valid: false, errorMessage: `Must be between 1 and ${selectedItem.max}` };
        }
        return { valid: true, value: qty };
      };
      
      return { tradeItem: selectedItem.index, quantity };
    }
  };
}

/**
 * Create warp parameter collection prompts
 */
function createWarpParameterPrompt(action: AvailableAction, state: GameState): ActionParameterPrompt {
  const possibleSystems = action.parameters?.possibleSystems || [];
  const currentSystem = state.solarSystem[state.currentSystem];
  
  // Create system list with distances
  const systemOptions = [];
  for (const systemIndex of possibleSystems) {
    const targetSystem = state.solarSystem[systemIndex];
    const distance = calculateDistance(currentSystem, targetSystem);
    systemOptions.push({
      index: systemIndex,
      name: getSolarSystemName(systemIndex),
      distance,
      canAfford: state.ship.fuel >= distance
    });
  }
  
  // Sort by distance
  systemOptions.sort((a, b) => a.distance - b.distance);
  
  const systemMenu = [
    'Available Destinations:',
    ...systemOptions.map((sys, idx) => {
      const fuelInfo = sys.canAfford ? '' : ' (insufficient fuel)';
      return `${idx + 1}. ${sys.name} - ${sys.distance} parsecs${fuelInfo}`;
    })
  ].join('\n');
  
  return {
    prompts: [
      {
        question: `${systemMenu}\n\nSelect destination (1-${systemOptions.length}): `,
        validation: (input: string) => {
          const choice = parseInt(input.trim());
          if (isNaN(choice) || choice < 1 || choice > systemOptions.length) {
            return { valid: false, errorMessage: `Please enter a number between 1 and ${systemOptions.length}` };
          }
          return { valid: true, value: systemOptions[choice - 1] };
        }
      }
    ],
    buildParameters: (responses: any[]) => {
      const selectedSystem = responses[0];
      return { targetSystem: selectedSystem.index };
    }
  };
}



/**
 * Get encounter type name
 */
function getEncounterTypeName(encounterType: number): string {
  const encounterNames: { [key: number]: string } = {
    0: 'Police Inspector', 1: 'Police (Ignoring)', 2: 'Police (Attacking)', 3: 'Police (Fleeing)',
    10: 'Pirate (Attacking)', 11: 'Pirate (Fleeing)', 12: 'Pirate (Ignoring)', 13: 'Pirate (Surrendering)',
    20: 'Trader (Passing)', 21: 'Trader (Fleeing)', 22: 'Trader (Attacking)', 23: 'Trader (Surrendering)', 24: 'Trader (Selling)', 25: 'Trader (Buying)',
    30: 'Space Monster (Attacking)', 31: 'Space Monster (Ignoring)',
    40: 'Dragonfly (Attacking)', 41: 'Dragonfly (Ignoring)',
    60: 'Scarab (Attacking)', 61: 'Scarab (Ignoring)',
    70: 'Famous Captain', 71: 'Famous Captain (Attacking)', 72: 'Captain Ahab', 73: 'Captain Conrad', 74: 'Captain Huie',
    80: 'Marie Celeste', 81: 'Bottle (Old)', 82: 'Bottle (Good)', 83: 'Post-Marie Police'
  };
  
  return encounterNames[encounterType] || `Unknown (${encounterType})`;
}

/**
 * Handle ship purchase action
 */
function createShipPurchaseParameterPrompt(action: AvailableAction, state: GameState): ActionParameterPrompt {
  const availableShips = action.parameters?.availableShips || [];
  
  return {
    prompts: [
      {
        question: `Available Ships for Purchase:

${availableShips.map((ship: any, index: number) => 
  `${index + 1}. ${ship.name} - Net Cost: ${ship.netPrice} credits ${!ship.canAfford ? '(Cannot afford)' : ''}`
).join('\n')}

Enter ship number (1-${availableShips.length}):`,
        validation: (input: string) => {
          const choice = parseInt(input);
          if (isNaN(choice) || choice < 1 || choice > availableShips.length) {
            return { valid: false, errorMessage: `Please enter a number between 1 and ${availableShips.length}` };
          }
          const selectedShip = availableShips[choice - 1];
          if (!selectedShip.canAfford) {
            return { valid: false, errorMessage: 'Insufficient funds for this ship' };
          }
          return { valid: true, value: selectedShip };
        }
      }
    ],
    buildParameters: (responses: any[]) => {
      const selectedShip = responses[0];
      return { 
        shipType: selectedShip.shipType,
        // For now, don't transfer special equipment automatically
        // This could be enhanced to ask the user about special equipment
        transferLightning: false,
        transferCompactor: false,
        transferMorgan: false,
      };
    }
  };
}
