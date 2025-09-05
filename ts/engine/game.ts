// Game Engine Integration Implementation
// Orchestrates all game systems: economy, travel, combat, events

import type { GameState, Ship, TradeItemArray } from '../types.ts';
import { createInitialState } from '../state.ts';
import { GameMode } from '../types.ts';

// Import all system modules
import { buyCargo, sellCargo } from '../economy/trading.ts';
import { calculateStandardPrice, calculateBuyPrice, calculateSellPrice, getAllSystemPrices } from '../economy/pricing.ts';
import { refuelToFull, getFuelStatus } from '../economy/fuel.ts';
import { performWarp, canWarpTo, calculateWarpCost, calculateDistance } from '../travel/warp.ts';
import { startEncounter, endEncounter, resolveCombatRound, getAvailableActions as getCombatActions, canPerformAction as canPerformCombatAction } from '../combat/engine.ts';
import { getSolarSystemName } from '../data/systems.ts';
import { getPoliticalSystem } from '../data/politics.ts';
import { getShipType } from '../data/shipTypes.ts';
import { EncounterType } from '../combat/engine.ts';
import { buyWeapon, sellWeapon, buyShield, sellShield, buyGadget, sellGadget, getAvailableEquipment, getInstialledEquipmentSellPrices } from '../economy/equipment-trading.ts';
import { purchaseShip, getShipPurchaseInfo } from '../economy/ship-trading.ts';
import { getAvailableShipsForPurchase } from '../economy/ship-pricing.ts';
import { getMercenaryForHire, getAvailableCrewQuarters, calculateHiringPrice, getMercenaryName } from '../data/crew.ts';

// Action System Types
export type GameAction = {
  type: string;
  parameters: Record<string, any>;
};

export type ActionResult = {
  success: boolean;
  message: string;
  stateChanged?: boolean;
  combatResult?: any;
  encounterResult?: any;
  economyResult?: any;
  newState?: GameState;
  data?: any;
  gameOver?: boolean;
};

export type AvailableAction = {
  type: string;
  name: string;
  description: string;
  parameters?: Record<string, any>;
  available: boolean;
};

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

// Game Engine Class
export type GameEngine = {
  state: GameState;
  executeAction: (action: GameAction) => Promise<ActionResult>;
  getAvailableActions: () => AvailableAction[];
}

// Core Game Engine Functions

export function createGameEngine(initialState?: GameState): GameEngine {
  const state = initialState || createInitialState();
  
  return {
    state,
    
    async executeAction(action: GameAction): Promise<ActionResult> {
      return await executeAction(state, action);
    },
    
    getAvailableActions(): AvailableAction[] {
      return getAvailableActions(state);
    }
  };
}

export async function executeAction(state: GameState, action: GameAction): Promise<ActionResult> {
  // Debug logging for actions
  if (state.debug?.enabled && state.debug?.log?.actions) {
    console.log(`🔍 [DEBUG] Executing action: ${action.type}`, {
      parameters: action.parameters,
      currentMode: state.currentMode,
      currentSystem: state.currentSystem,
      credits: state.credits,
      fuel: state.ship.fuel
    });
  }

  // Validate action is available
  if (!canExecuteAction(state, action)) {
    return {
      success: false,
      message: `Action '${action.type}' is not available in current game mode`,
      stateChanged: false
    };
  }

  try {
    switch (action.type) {
      case 'buy_cargo':
        return await executeBuyCargoAction(state, action.parameters);
      
      case 'sell_cargo':
        return await executeSellCargoAction(state, action.parameters);
      
      case 'refuel_ship':
        return await executeRefuelAction(state);
      
      case 'repair_ship':
        return await executeRepairAction(state);

      case 'warp_to_system':
        return await executeWarpAction(state, action.parameters);
      
      case 'track_system':
        return await executeTrackSystemAction(state, action.parameters);
      
      case 'read_news':
        return await executeReadNewsAction(state);
      

      case 'dock_at_planet':
        return await executeDockAtPlanetAction(state);
      
      case 'buy_weapon':
        return await executeBuyWeaponAction(state, action.parameters);
      
      case 'sell_weapon':
        return await executeSellWeaponAction(state, action.parameters);
      
      case 'buy_shield':
        return await executeBuyShieldAction(state, action.parameters);
      
      case 'sell_shield':
        return await executeSellShieldAction(state, action.parameters);
      
      case 'buy_gadget':
        return await executeBuyGadgetAction(state, action.parameters);
      
      case 'sell_gadget':
        return await executeSellGadgetAction(state, action.parameters);
      
      case 'buy_equipment':
        return await executeBuyEquipmentAction(state, action.parameters);
      
      case 'sell_equipment':
        return await executeSellEquipmentAction(state, action.parameters);
      
      case 'buy_ship':
        return await executeBuyShipAction(state, action.parameters);
      
      case 'hire_crew':
        return await executeHireCrewAction(state, action.parameters);
      
      case 'fire_crew':
        return await executeFireCrewAction(state, action.parameters);
      
      case 'combat_continue':
        return await executeCombatContinueAction(state);
      
      case 'combat_attack':
      case 'combat_flee':
      case 'combat_surrender':
      case 'combat_submit':
      case 'combat_bribe':
      case 'combat_trade':
      case 'combat_ignore':
      case 'combat_board':
      case 'combat_meet':
      case 'combat_drink':
      case 'combat_yield':
      case 'combat_plunder':
        return await executeCombatAction(state, action);
      
      case 'get_available_actions':
        return {
          success: true,
          message: 'Available actions retrieved',
          stateChanged: false
        };
      
      default:
        return {
          success: false,
          message: `Unknown action type: ${action.type}`,
          stateChanged: false
        };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error executing action: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stateChanged: false
    };
  }
}

export function getAvailableActions(state: GameState): AvailableAction[] {
  const actions: AvailableAction[] = [];
  
  switch (state.currentMode) {
    case GameMode.OnPlanet:
      actions.push(...getPlanetActions(state));
      break;
    
    case GameMode.InSpace:
      actions.push(...getSpaceActions(state));
      break;
    
    case GameMode.InCombat:
      actions.push(...getCombatActionsForState(state));
      break;
  }
  
  return actions;
}

export function canExecuteAction(state: GameState, action: GameAction): boolean {
  const availableActions = getAvailableActions(state);
  return availableActions.some(availableAction => 
    availableAction.type === action.type && availableAction.available
  );
}

export function validateGameState(state: GameState): ValidationResult {
  const errors: string[] = [];
  
  // Validate basic state structure
  if (typeof state.credits !== 'number' || state.credits < 0) {
    errors.push('Invalid credits value');
  }
  
  if (!state.ship || typeof state.ship !== 'object') {
    errors.push('Invalid ship object');
  } else {
    if (typeof state.ship.hull !== 'number' || state.ship.hull < 0) {
      errors.push('Invalid ship hull value');
    }
    
    if (!Array.isArray(state.ship.cargo)) {
      errors.push('Invalid ship cargo array');
    }
  }
  
  if (!Array.isArray(state.solarSystem) || state.solarSystem.length === 0) {
    errors.push('Invalid solar system data');
  }
  
  if (typeof state.currentSystem !== 'number' || state.currentSystem < 0) {
    errors.push('Invalid current system');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Action Implementations

async function executeBuyCargoAction(state: GameState, parameters: any): Promise<ActionResult> {
  const { tradeItem, quantity } = parameters;
  
  if (typeof tradeItem !== 'number' || typeof quantity !== 'number') {
    return {
      success: false,
      message: 'Invalid parameters for buy cargo action',
      stateChanged: false
    };
  }
  
  try {
    const currentSystem = state.solarSystem[state.currentSystem];
    const allPrices = getAllSystemPrices(currentSystem, state.commanderTrader, state.policeRecordScore);
    const buyPrices = extractBuyPrices(allPrices);
    
    const result = buyCargo(state, currentSystem, tradeItem, quantity, buyPrices);
    return {
      success: result.success,
      message: result.reason || 'Trade completed',
      stateChanged: result.success,
      economyResult: result
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to buy cargo: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stateChanged: false
    };
  }
}

async function executeSellCargoAction(state: GameState, parameters: any): Promise<ActionResult> {
  const { tradeItem, quantity } = parameters;
  
  if (typeof tradeItem !== 'number' || typeof quantity !== 'number') {
    return {
      success: false,
      message: 'Invalid parameters for sell cargo action',
      stateChanged: false
    };
  }
  
  try {
    const currentSystem = state.solarSystem[state.currentSystem];
    const allPrices = getAllSystemPrices(currentSystem, state.commanderTrader, state.policeRecordScore);
    const sellPrices = extractSellPrices(allPrices);
    
    const result = sellCargo(state, tradeItem, quantity, sellPrices);
    return {
      success: result.success,
      message: result.reason || 'Trade completed',
      stateChanged: result.success,
      economyResult: result
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to sell cargo: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stateChanged: false
    };
  }
}

async function executeRefuelAction(state: GameState): Promise<ActionResult> {
  try {
    const fuelStatus = getFuelStatus(state);
    
    if (fuelStatus.currentFuel >= fuelStatus.maxFuel) {
      return {
        success: false,
        message: 'Fuel tanks are already full',
        stateChanged: false
      };
    }
    
    if (state.credits < fuelStatus.costPerUnit) {
      return {
        success: false,
        message: 'Insufficient credits to buy fuel',
        stateChanged: false
      };
    }
    
    const result = refuelToFull(state);
    
    if (result.success) {
      return {
        success: true,
        message: `Refueled ${result.fuelBought} units for ${result.costPaid} credits`,
        stateChanged: true
      };
    } else {
      return {
        success: false,
        message: result.reason || 'Refuel failed',
        stateChanged: false
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Refuel failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stateChanged: false
    };
  }
}

async function executeRepairAction(state: GameState): Promise<ActionResult> {
  try {
    const shipType = getShipType(state.ship.type);
    const maxHull = shipType.hullStrength;
    
    if (state.ship.hull >= maxHull) {
      return {
        success: false,
        message: 'Ship hull is already at full strength',
        stateChanged: false
      };
    }
    
    const damagePoints = maxHull - state.ship.hull;
    const repairCost = damagePoints * shipType.repairCosts;
    
    if (state.credits < repairCost) {
      return {
        success: false,
        message: `Insufficient credits for repairs (need ${repairCost} credits)`,
        stateChanged: false
      };
    }
    
    // Perform repair
    state.ship.hull = maxHull;
    state.credits -= repairCost;
    
    return {
      success: true,
      message: `Ship repaired to full hull strength for ${repairCost} credits`,
      stateChanged: true
    };
  } catch (error) {
    return {
      success: false,
      message: `Repair error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stateChanged: false
    };
  }
}

async function executeWarpAction(state: GameState, parameters: any): Promise<ActionResult> {
  const { targetSystem } = parameters;
  
  if (typeof targetSystem !== 'number') {
    return {
      success: false,
      message: 'Invalid target system for warp',
      stateChanged: false
    };
  }
  
  try {
    // Check if we can warp first (before any state changes)
    const validation = canWarpTo(state, targetSystem);
    if (!validation.canWarp) {
      return {
        success: false,
        message: validation.reason || 'Warp failed',
        stateChanged: false
      };
    }
    
    // Auto-launch ship if we're on a planet (only after validation passes)
    if (state.currentMode === GameMode.OnPlanet) {
      state.currentMode = GameMode.InSpace;
    }
    
    // Set warpSystem for encounter calculations but DON'T move yet
    const originalSystem = state.currentSystem;
    state.warpSystem = targetSystem;
    state.clicks = 21; // Original Palm OS travel time (always 21 regardless of distance)
    
    // Calculate costs and consume resources, but don't arrive yet  
    const systemName = getSolarSystemName(targetSystem);
    let message = `Traveling to ${systemName}...`;
    
    // Consume fuel and credits now that validation passed
    const distance = calculateDistance(state.solarSystem[originalSystem], state.solarSystem[targetSystem]);
    state.ship.fuel -= distance;
    message += ` (fuel used: ${distance})`;
    
    const cost = calculateWarpCost(state, originalSystem, targetSystem, false);
    state.credits -= cost.total;
    if (cost.total > 0) {
      message += ` (cost: ${cost.total})`;
    }
    
    // Check for encounters during first tick of travel
    state.clicks--; // Decrement first click
    const encounterCheck = checkEncounterThisTick(state, state.clicks);
    
    if (encounterCheck.hasEncounter) {
      // Initialize encounter using combat engine (this will set the mode and configure opponent)
      const encounterResult = startEncounter(state, encounterCheck.encounterType!);
      
      if (encounterResult.success) {
        message += ` - Combat encounter at ${state.clicks} clicks to ${systemName}!`;
      } else {
        message += ` - ${encounterResult.message} at ${state.clicks} clicks to ${systemName}`;
      }
      
      // DON'T arrive yet - keep currentSystem != warpSystem so continue travel is available
      return {
        success: true,
        message,
        stateChanged: true
      };
    } else {
      // No encounter - complete the warp and arrive (resources already consumed)
      const result = performWarp(state, targetSystem, true); // Use viaSingularity=true to skip resource consumption
      if (result.success) {
        state.currentMode = GameMode.OnPlanet;
        message = `Arrived safely at ${systemName}`;
        
        if (result.fuelConsumed && result.fuelConsumed > 0) {
          message += ` (fuel used: ${result.fuelConsumed})`;
        }
        if (result.costPaid && result.costPaid > 0) {
          message += ` (cost: ${result.costPaid})`;
        }
        
        return {
          success: true,
          message,
          stateChanged: true
        };
      } else {
        return {
          success: false,
          message: result.reason || 'Warp failed',
          stateChanged: false
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Warp failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stateChanged: false
    };
  }
}

// Helper function to automatically continue travel after encounter resolution
export function automaticTravelContinuation(state: GameState): { hasEncounter: boolean; encounterType?: number; arrivedSafely: boolean; message: string } {
  if (state.warpSystem === state.currentSystem) {
    // Already at destination - ensure we're on the planet
    state.currentMode = GameMode.OnPlanet;
    return { hasEncounter: false, arrivedSafely: true, message: '' };
  }
  
  const systemName = getSolarSystemName(state.warpSystem);
  
  // Continue travel using click-based system like Palm OS
  while (state.clicks > 0 && state.warpSystem !== state.currentSystem) {
    // Decrement clicks and check for encounter this click
    state.clicks--;
    const encounterCheck = checkEncounterThisTick(state, state.clicks);
    
    if (encounterCheck.hasEncounter) {
      // Another encounter found
      return { 
        hasEncounter: true, 
        encounterType: encounterCheck.encounterType,
        arrivedSafely: false,
        message: `En route to ${systemName} - Another encounter at ${state.clicks} clicks to ${systemName}!`
      };
    }
  }
  
  // Check if we've reached our destination (either by clicks running out or by system match)
  if (state.clicks === 0 || state.warpSystem === state.currentSystem) {
    // Arrive at destination
    state.currentSystem = state.warpSystem;
    state.currentMode = GameMode.OnPlanet;
    state.clicks = 0; // Reset travel clicks
    // Reset newspaper payment flag when arriving at new system
    state.alreadyPaidForNewspaper = false;
    return { 
      hasEncounter: false, 
      arrivedSafely: true,
      message: `Arrived safely at ${systemName}`
    };
  }
  
  // Still traveling with clicks remaining
  return { hasEncounter: false, arrivedSafely: false, message: '' };
}

async function executeTrackSystemAction(state: GameState, parameters: any): Promise<ActionResult> {
  const { systemIndex } = parameters;
  
  if (typeof systemIndex !== 'number') {
    return {
      success: false,
      message: 'Invalid system index for tracking',
      stateChanged: false
    };
  }
  
  state.trackedSystem = systemIndex;
  
  return {
    success: true,
    message: `Now tracking ${getSolarSystemName(systemIndex)}`,
    stateChanged: true
  };
}

async function executeReadNewsAction(state: GameState): Promise<ActionResult> {
  try {
    // News costs 1 credit base, +1 per difficulty level (like Palm OS)
    const newsCost = 1 + state.difficulty;
    let actualCost = 0;
    
    // Check if already paid for newspaper in this system
    if (!state.alreadyPaidForNewspaper) {
      if (state.credits < newsCost) {
        return {
          success: false,
          message: `Not enough credits to buy newspaper (costs ${newsCost} credits)`,
          stateChanged: false
        };
      }
      
      // Pay for newspaper
      state.credits -= newsCost;
      actualCost = newsCost;
      state.alreadyPaidForNewspaper = true;
    }
    
    // Generate news content
    const { getNewsEvents, getEventName } = await import('../events/special.ts');
    const newsEvents = getNewsEvents(state);
    const { getSolarSystemName } = await import('../data/systems.ts');
    const systemName = getSolarSystemName(state.currentSystem);
    
    let newsContent = `\n=== ${systemName} Daily News ===\n`;
    if (actualCost > 0) {
      newsContent += `Cost: ${actualCost} credits\n\n`;
    } else {
      newsContent += `Re-reading (already paid)\n\n`;
    }
    
    if (newsEvents.length > 0) {
      newsContent += 'Recent Headlines:\n';
      newsEvents.forEach((event, index) => {
        const eventName = getEventName(event.id);
        newsContent += `• ${eventName}\n`;
      });
    } else {
      newsContent += 'No major news today.\n';
      // Add some generic filler headlines like Palm OS
      const fillerHeadlines = [
        'Local weather continues to be pleasant',
        'Trade prices stable according to market analysts', 
        'Shipping lanes report normal traffic patterns',
        'No major incidents reported in local space'
      ];
      const randomHeadline = fillerHeadlines[Math.floor(Math.random() * fillerHeadlines.length)];
      newsContent += `• ${randomHeadline}\n`;
    }
    
    newsContent += '\nPress Enter to continue...';
    
    return {
      success: true,
      message: newsContent,
      stateChanged: true
    };
  } catch (error) {
    return {
      success: false,
      message: `Error reading news: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stateChanged: false
    };
  }
}



async function executeDockAtPlanetAction(state: GameState): Promise<ActionResult> {
  if (state.currentMode !== GameMode.InSpace) {
    return {
      success: false,
      message: 'Can only dock when in space around a planet',
      stateChanged: false
    };
  }
  
  state.currentMode = GameMode.OnPlanet;
  
  return {
    success: true,
    message: 'Docked at planet',
    stateChanged: true
  };
}

// Equipment trading action handlers
async function executeBuyWeaponAction(state: GameState, parameters: any): Promise<ActionResult> {
  const { weaponIndex } = parameters;
  
  if (typeof weaponIndex !== 'number') {
    return {
      success: false,
      message: 'Invalid weapon index',
      stateChanged: false
    };
  }
  
  try {
    const result = buyWeapon(state, weaponIndex);
    return {
      success: result.success,
      message: result.reason || 'Weapon purchase completed',
      stateChanged: result.success
    };
  } catch (error) {
    return {
      success: false,
      message: `Weapon purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stateChanged: false
    };
  }
}

async function executeSellWeaponAction(state: GameState, parameters: any): Promise<ActionResult> {
  const { slotIndex } = parameters;
  
  if (typeof slotIndex !== 'number') {
    return {
      success: false,
      message: 'Invalid weapon slot index',
      stateChanged: false
    };
  }
  
  try {
    const result = sellWeapon(state, slotIndex);
    return {
      success: result.success,
      message: result.reason || 'Weapon sale completed',
      stateChanged: result.success
    };
  } catch (error) {
    return {
      success: false,
      message: `Weapon sale failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stateChanged: false
    };
  }
}

async function executeBuyShieldAction(state: GameState, parameters: any): Promise<ActionResult> {
  const { shieldIndex } = parameters;
  
  if (typeof shieldIndex !== 'number') {
    return {
      success: false,
      message: 'Invalid shield index',
      stateChanged: false
    };
  }
  
  try {
    const result = buyShield(state, shieldIndex);
    return {
      success: result.success,
      message: result.reason || 'Shield purchase completed',
      stateChanged: result.success
    };
  } catch (error) {
    return {
      success: false,
      message: `Shield purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stateChanged: false
    };
  }
}

async function executeSellShieldAction(state: GameState, parameters: any): Promise<ActionResult> {
  const { slotIndex } = parameters;
  
  if (typeof slotIndex !== 'number') {
    return {
      success: false,
      message: 'Invalid shield slot index',
      stateChanged: false
    };
  }
  
  try {
    const result = sellShield(state, slotIndex);
    return {
      success: result.success,
      message: result.reason || 'Shield sale completed',
      stateChanged: result.success
    };
  } catch (error) {
    return {
      success: false,
      message: `Shield sale failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stateChanged: false
    };
  }
}

async function executeBuyGadgetAction(state: GameState, parameters: any): Promise<ActionResult> {
  const { gadgetIndex } = parameters;
  
  if (typeof gadgetIndex !== 'number') {
    return {
      success: false,
      message: 'Invalid gadget index',
      stateChanged: false
    };
  }
  
  try {
    const result = buyGadget(state, gadgetIndex);
    return {
      success: result.success,
      message: result.reason || 'Gadget purchase completed',
      stateChanged: result.success
    };
  } catch (error) {
    return {
      success: false,
      message: `Gadget purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stateChanged: false
    };
  }
}

async function executeSellGadgetAction(state: GameState, parameters: any): Promise<ActionResult> {
  const { slotIndex } = parameters;
  
  if (typeof slotIndex !== 'number') {
    return {
      success: false,
      message: 'Invalid gadget slot index',
      stateChanged: false
    };
  }
  
  try {
    const result = sellGadget(state, slotIndex);
    return {
      success: result.success,
      message: result.reason || 'Gadget sale completed',
      stateChanged: result.success
    };
  } catch (error) {
    return {
      success: false,
      message: `Gadget sale failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stateChanged: false
    };
  }
}

async function executeCombatAction(state: GameState, action: GameAction): Promise<ActionResult> {
  if (state.currentMode !== GameMode.InCombat) {
    return {
      success: false,
      message: 'Cannot perform combat action - not in combat',
      stateChanged: false
    };
  }
  
  const combatAction = action.type.replace('combat_', '');
  
  try {
    const result = resolveCombatRound(state, combatAction as any);
    let message = result.message;
    
    // If encounter ended, automatically continue travel (whether we have clicks remaining or arrived)
    if ((state.currentMode as GameMode) === GameMode.InSpace) {
      const travelResult = automaticTravelContinuation(state);
      
      if (travelResult.hasEncounter) {
        // Another encounter found - start it
        const encounterResult = startEncounter(state, travelResult.encounterType!);
        if (encounterResult.success) {
          message += ` ${travelResult.message}`;
        }
      } else if (travelResult.arrivedSafely) {
        // Arrived at destination
        message += ` ${travelResult.message}`;
      }
    }
    
    return {
      success: result.success,
      message,
      stateChanged: true,
      combatResult: result
    };
  } catch (error) {
    return {
      success: false,
      message: `Combat action failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stateChanged: false
    };
  }
}

// Available Actions by Mode

function getPlanetActions(state: GameState): AvailableAction[] {
  const actions: AvailableAction[] = [];
  
  // Check if any cargo can be bought
  const allPrices = getAllSystemPrices(state.solarSystem[state.currentSystem], state.commanderTrader, state.policeRecordScore);
  const canBuyAnything = allPrices.some(p => p.buyPrice > 0 && state.credits >= p.buyPrice);
  
  if (canBuyAnything) {
    // Find which items can be bought
    const possibleItems = allPrices
      .map((priceInfo, index) => ({ index, buyPrice: priceInfo.buyPrice }))
      .filter(item => item.buyPrice > 0 && state.credits >= item.buyPrice)
      .map(item => item.index);
    
    actions.push({
      type: 'buy_cargo',
      name: 'Buy Cargo',
      description: 'Purchase trade goods',
      parameters: { possibleItems },
      available: true
    });
  }
  
  // Check if any cargo can be sold
  const canSellAnything = state.ship.cargo.some((quantity, index) => 
    quantity > 0 && allPrices[index].sellPrice > 0
  );
  
  if (canSellAnything) {
    actions.push({
      type: 'sell_cargo',
      name: 'Sell Cargo',
      description: 'Sell trade goods',
      available: true
    });
  }
  
  // Refuel ship
  const fuelStatus = getFuelStatus(state);
  if (fuelStatus.currentFuel < fuelStatus.maxFuel) {
    actions.push({
      type: 'refuel_ship',
      name: 'Refuel Ship',
      description: `Fill fuel tanks (${fuelStatus.fullRefuelCost} credits)`,
      available: state.credits >= fuelStatus.costPerUnit
    });
  }
  
  // Repair ship
  const shipType = getShipType(state.ship.type);
  const maxHull = shipType.hullStrength;
  if (state.ship.hull < maxHull) {
    const damagePoints = maxHull - state.ship.hull;
    const repairCost = damagePoints * shipType.repairCosts;
    
    actions.push({
      type: 'repair_ship',
      name: 'Repair Ship',
      description: `Repair ${damagePoints} hull damage (${repairCost} credits)`,
      available: state.credits >= repairCost
    });
  }
  
  // Note: Warp actions are handled by launching to space first
  // This matches the original Palm OS game flow where you launch then warp

  // Equipment trading at shipyard
  const availableEquipment = getAvailableEquipment(state);
  const sellableEquipment = getInstialledEquipmentSellPrices(state);
  
  // Check if any equipment can be bought
  const canBuyEquipment = availableEquipment.weapons.length > 0 || 
                         availableEquipment.shields.length > 0 || 
                         availableEquipment.gadgets.length > 0;
  
  if (canBuyEquipment) {
    actions.push({
      type: 'buy_equipment',
      name: 'Buy Equipment',
      description: 'Visit shipyard to buy weapons, shields, or gadgets',
      parameters: { availableEquipment },
      available: true
    });
  }
  
  // Check if any equipment can be sold
  const canSellEquipment = sellableEquipment.weapons.length > 0 ||
                          sellableEquipment.shields.length > 0 ||
                          sellableEquipment.gadgets.length > 0;
  
  if (canSellEquipment) {
    actions.push({
      type: 'sell_equipment',
      name: 'Sell Equipment',
      description: 'Sell installed weapons, shields, or gadgets',
      parameters: { sellableEquipment },
      available: true
    });
  }
  
  // Ship trading at shipyard
  const availableShips = getAvailableShipsForPurchase(state);
  if (availableShips.length > 0) {
    actions.push({
      type: 'buy_ship',
      name: 'Buy Ship',
      description: 'Trade in current ship for a new one',
      parameters: { availableShips },
      available: true
    });
  }

  // News action - read local newspaper
  actions.push({
    type: 'read_news',
    name: 'Read News',
    description: 'Buy and read the local newspaper',
    available: true
  });

  // Warp to systems directly from planet
  const possibleSystems: number[] = [];
  for (let i = 0; i < state.solarSystem.length; i++) {
    if (i !== state.currentSystem && canWarpTo(state, i).canWarp) {
      possibleSystems.push(i);
    }
  }
  
  if (possibleSystems.length > 0) {
    actions.push({
      type: 'warp_to_system',
      name: 'Warp to System',
      description: 'Launch ship and warp to another solar system',
      parameters: { possibleSystems },
      available: state.ship.fuel > 0
    });
  }

  // Track system action (moved from space menu)
  actions.push({
    type: 'track_system',
    name: 'Track System',
    description: 'Set a system to track on the galactic map',
    available: true
  });

  // Crew management
  const mercenaryIndex = getMercenaryForHire(state);
  const availableQuarters = getAvailableCrewQuarters(state);
  

  
  if (mercenaryIndex !== -1 && availableQuarters > 0) {
    const mercenary = state.mercenary[mercenaryIndex];
    const hiringCost = calculateHiringPrice(mercenary);
    const mercenaryName = getMercenaryName(mercenaryIndex);
    
    actions.push({
      type: 'hire_crew',
      name: 'Hire Crew',
      description: `Hire ${mercenaryName} for ${hiringCost} credits`,
      available: state.credits >= hiringCost
    });
  }
  
  // Check if any crew can be fired (skip commander at index 0)
  const canFireCrew = state.ship.crew.slice(1).some(crewIndex => crewIndex !== -1);
  if (canFireCrew) {
    actions.push({
      type: 'fire_crew', 
      name: 'Fire Crew',
      description: 'Dismiss a crew member',
      available: true
    });
  }
  
  return actions;
}

function getSpaceActions(state: GameState): AvailableAction[] {
  const actions: AvailableAction[] = [];
  
  // Warp to systems when in space (for manual space travel)
  const possibleSystems: number[] = [];
  for (let i = 0; i < state.solarSystem.length; i++) {
    if (i !== state.currentSystem && canWarpTo(state, i).canWarp) {
      possibleSystems.push(i);
    }
  }
  
  if (possibleSystems.length > 0) {
    actions.push({
      type: 'warp_to_system',
      name: 'Warp to System',
      description: 'Warp to another solar system',
      parameters: { possibleSystems },
      available: state.ship.fuel > 0
    });
  }

  // Return to current planet (dock)
  actions.push({
    type: 'dock_at_planet',
    name: 'Dock at Planet',
    description: 'Return to planet surface',
    available: true
  });
  
  return actions;
}



function getCombatActionsForState(state: GameState): AvailableAction[] {
  const actions: AvailableAction[] = [];
  
  // First check if combat should auto-resolve (opponent or player destroyed)
  if (state.opponent.hull <= 0 || state.ship.hull <= 0) {
    // Combat should end - provide a continue action
    actions.push({
      type: 'combat_continue',
      name: 'Continue',
      description: 'Continue after combat resolution',
      available: true
    });
    return actions;
  }
  
  const combatActions = getCombatActions(state);
  
  for (const combatAction of combatActions) {
    actions.push({
      type: `combat_${combatAction}`,
      name: combatAction.charAt(0).toUpperCase() + combatAction.slice(1),
      description: `Perform ${combatAction} action in combat`,
      available: canPerformCombatAction(state, combatAction)
    });
  }
  
  return actions;
}

// Very Rare Encounter Constants (from Palm OS spacetrader.h)
const CHANCEOFVERYRAREENCOUNTER = 5; // 5 in 1000 chance
const MAXVERYRAREENCOUNTER = 6;

// Very rare encounter types
const MARIECELESTE = 0;
const CAPTAINAHAB = 1; 
const CAPTAINCONRAD = 2;
const CAPTAINHUIE = 3;
const BOTTLEOLD = 4;
const BOTTLEGOOD = 5;

// Already done flags (bitmask)
const ALREADYMARIE = 1;
const ALREADYAHAB = 2;
const ALREADYCONRAD = 4;
const ALREADYHUIE = 8;
const ALREADYBOTTLEOLD = 16;
const ALREADYBOTTLEGOOD = 32;

// Game Loop Management

export function advanceTime(state: GameState, days: number): void {
  state.days += days;
  
  // Handle daily interest on debt
  for (let i = 0; i < days; i++) {
    payInterest(state);
  }
  
  // Update markets periodically
  if (state.days % 3 === 0) {
    updateMarkets(state);
  }
}

function payInterest(state: GameState): void {
  if (state.debt > 0) {
    const interest = Math.floor(state.debt * 0.1); // 10% daily interest
    state.debt += interest;
  }
}

export function checkRandomEncounters(state: GameState): { hasEncounter: boolean; encounterType?: number } {
  if (state.currentMode !== GameMode.InSpace) {
    return { hasEncounter: false };
  }
  
  return checkRandomEncountersOnTravel(state);
}

export function checkRandomEncountersOnTravel(state: GameState): { hasEncounter: boolean; encounterType?: number } {
  // Use tick-based encounter system like Palm OS original
  return performTickBasedTravel(state);
}

// Original Palm OS tick-based travel system implementation
function performTickBasedTravel(state: GameState): { hasEncounter: boolean; encounterType?: number } {
  const ticks = 21; // Original travel time was 21 ticks
  
  // Process each tick for potential encounters (following original Palm OS logic exactly)
  // Original game checks encounters every tick and can have multiple encounters per trip
  for (let currentTick = ticks; currentTick > 0; currentTick--) {
    // Check for encounter this tick
    const encounterResult = checkEncounterThisTick(state, currentTick);
    if (encounterResult.hasEncounter) {
      // Return first encounter found - in Palm OS, after encounter resolution,
      // Travel() gets called again to continue with remaining ticks
      return encounterResult;
    }
  }
  
  return { hasEncounter: false };
}

function checkEncounterThisTick(state: GameState, currentTick: number): { hasEncounter: boolean; encounterType?: number } {
  // Get the destination system's politics
  const targetSystem = state.solarSystem[state.warpSystem || state.currentSystem];
  const politics = getPoliticalSystem(targetSystem.politics);
  
  // Original encounter test: GetRandom(44 - (2 * Difficulty))
  let encounterTest = Math.floor(Math.random() * (44 - (2 * state.difficulty)));
  
  // Encounters are half as likely if you're in a flea (ship type 0)
  if (state.ship.type === 0) {
    encounterTest *= 2;
  }
  
  // Calculate police strength based on criminal record (like STRENGTHPOLICE macro)
  const policeStrength = getPoliceStrength(state, targetSystem.politics);
  
  // First check for very rare encounters (5 in 1000 chance)
  if (Math.floor(Math.random() * 1000) < CHANCEOFVERYRAREENCOUNTER) {
    const veryRareResult = checkVeryRareEncounter(state);
    if (veryRareResult.hasEncounter) {
      return veryRareResult;
    }
  }
  
  // Special case: Wild at Kravat system creates extra police encounters
  if (state.wildStatus === 1 && state.warpSystem === 50) { // KRAVATSYSTEM = 50
    const rareEncounter = Math.floor(Math.random() * 100);
    let policeThreshold = 0;
    
    if (state.difficulty <= 0) { // EASY
      policeThreshold = 25;
    } else if (state.difficulty === 1) { // NORMAL  
      policeThreshold = 33;
    } else { // HARD or IMPOSSIBLE
      policeThreshold = 50;
    }
    
    if (rareEncounter < policeThreshold) {
      const policeEncounterType = determinePoliceEncounterType(state);
      return { hasEncounter: true, encounterType: policeEncounterType };
    }
  }
  
  // Check regular encounter types in order of priority (exact Palm OS logic)
  if (encounterTest < politics.strengthPirates && !state.raided) {
    // Pirate encounter - determine specific type based on reputation and ship
    const pirateEncounterType = determinePirateEncounterType(state);
    return { hasEncounter: true, encounterType: pirateEncounterType };
  } else if (encounterTest < politics.strengthPirates + policeStrength) {
    // Police encounter - determine specific type based on criminal record
    const policeEncounterType = determinePoliceEncounterType(state);
    return { hasEncounter: true, encounterType: policeEncounterType };
  } else if (encounterTest < politics.strengthPirates + policeStrength + politics.strengthTraders) {
    // Trader encounter - determine specific type based on criminal record and trade possibilities
    const traderEncounterType = determineTraderEncounterType(state);
    return { hasEncounter: true, encounterType: traderEncounterType };
  }
  
  // Special case: Mantis encounters when carrying artifact
  if (state.artifactOnBoard && Math.floor(Math.random() * 20) <= 3) {
    // Generate Mantis encounter (simplified)
    return { hasEncounter: true, encounterType: EncounterType.PIRATEATTACK }; // Treat as pirate attack for now
  }
  
  return { hasEncounter: false };
}

// Calculate police strength that adapts to criminal record (STRENGTHPOLICE macro)
function getPoliceStrength(state: GameState, politicsIndex: number): number {
  const basePolitics = getPoliticalSystem(politicsIndex);
  const baseStrength = basePolitics.strengthPolice;
  
  // Palm OS constants for police record thresholds
  const PSYCHOPATHSCORE = -70;
  const VILLAINSCORE = -30;
  
  // Exact Palm OS STRENGTHPOLICE macro logic
  if (state.policeRecordScore < PSYCHOPATHSCORE) {
    return 3 * baseStrength; // Psychopath - 3x police attention
  } else if (state.policeRecordScore < VILLAINSCORE) {
    return 2 * baseStrength; // Villain - 2x police attention  
  } else {
    return baseStrength; // Normal - 1x police attention
  }
}

// Encounter type determination functions (exact Palm OS logic)

function determinePirateEncounterType(state: GameState): number {
  // Palm OS constants
  const ELITESCORE = 1500; // From Palm OS
  
  // If cloaked, pirates ignore you (simplified - proper cloaking check needed)
  // For now, assume no cloaking (would need proper Cloaked() function implementation)
  
  // Pirates will mostly attack, but are cowardly if your reputation is too high
  const opponentType = 1; // Assume average pirate ship (would be determined by GenerateOpponent in Palm OS)
  
  // If opponent type >= 7 OR random check fails, pirates attack
  if (opponentType >= 7 || Math.floor(Math.random() * ELITESCORE) > (state.reputationScore * 4) / (1 + opponentType)) {
    return EncounterType.PIRATEATTACK; // 10
  } else {
    return EncounterType.PIRATEFLEE; // 11  
  }
}

function determinePoliceEncounterType(state: GameState): number {
  // Palm OS constants for police record thresholds
  const PSYCHOPATHSCORE = -70;
  const VILLAINSCORE = -30;
  const CRIMINALSCORE = -10;
  const DUBIOUSSCORE = -5;
  const CLEANSCORE = 0;
  const LAWFULSCORE = 5;
  
  // Exact Palm OS police encounter logic
  if (state.policeRecordScore < PSYCHOPATHSCORE) {
    // Psychopath - police attack on sight
    return EncounterType.POLICEATTACK; // 2
  } else if (state.policeRecordScore < VILLAINSCORE) {
    // Villain - police attack or flee based on ship comparison
    // Simplified: assume police flee (proper logic would compare ship types)
    return EncounterType.POLICEFLEE; // 3
  } else if (state.policeRecordScore >= DUBIOUSSCORE && state.policeRecordScore < CLEANSCORE) {
    // Dubious record - mandatory inspection
    return EncounterType.POLICEINSPECTION; // 0
  } else if (state.policeRecordScore < LAWFULSCORE) {
    // Clean record - 10% chance of inspection on Normal difficulty
    if (Math.floor(Math.random() * (12 - state.difficulty)) < 1) {
      return EncounterType.POLICEINSPECTION; // 0
    } else {
      return EncounterType.POLICEIGNORE; // 1
    }
  } else {
    // Lawful trader - 2.5% chance of inspection
    if (Math.floor(Math.random() * 40) === 0) {
      return EncounterType.POLICEINSPECTION; // 0
    } else {
      return EncounterType.POLICEIGNORE; // 1
    }
  }
}

function determineTraderEncounterType(state: GameState): number {
  // Start with ignore (default)
  let encounterType: number = EncounterType.TRADERIGNORE; // 20
  
  const CRIMINALSCORE = -10;
  const ELITESCORE = 1500;
  
  // If you're a criminal, traders tend to flee if you have reputation
  if (state.policeRecordScore <= CRIMINALSCORE) {
    const opponentType = 1; // Assume average trader ship
    if (Math.floor(Math.random() * ELITESCORE) <= (state.reputationScore * 10) / (1 + opponentType)) {
      encounterType = EncounterType.TRADERFLEE; // 21
    }
  }
  
  // Check for trade in orbit (10% chance)
  const CHANCEOFTRADEINORBIT = 100; // 100 out of 1000 = 10%
  if (encounterType === EncounterType.TRADERIGNORE && Math.floor(Math.random() * 1000) < CHANCEOFTRADEINORBIT) {
    // Simplified trade check - in Palm OS this checks HasTradeableItems()
    // For now, randomly choose between sell and buy
    if (Math.random() < 0.5) {
      encounterType = EncounterType.TRADERSELL; // 24
    } else {
      encounterType = EncounterType.TRADERBUY; // 25
    }
  }
  
  return encounterType;
}

// Check for very rare encounters (Marie Celeste, Famous Captains, etc.)
function checkVeryRareEncounter(state: GameState): { hasEncounter: boolean; encounterType?: number } {
  // Check which encounters haven't been done yet
  const availableEncounters: Array<{ type: number, encounterCode: number, flag: number }> = [];
  
  if (!(state.veryRareEncounter & ALREADYMARIE)) {
    availableEncounters.push({ type: MARIECELESTE, encounterCode: EncounterType.MARIECELESTEENCOUNTER, flag: ALREADYMARIE });
  }
  
  if (!(state.veryRareEncounter & ALREADYAHAB)) {
    availableEncounters.push({ type: CAPTAINAHAB, encounterCode: EncounterType.CAPTAINAHABENCOUNTER, flag: ALREADYAHAB });
  }
  
  if (!(state.veryRareEncounter & ALREADYCONRAD)) {
    availableEncounters.push({ type: CAPTAINCONRAD, encounterCode: EncounterType.CAPTAINCONRADENCOUNTER, flag: ALREADYCONRAD });
  }
  
  if (!(state.veryRareEncounter & ALREADYHUIE)) {
    availableEncounters.push({ type: CAPTAINHUIE, encounterCode: EncounterType.CAPTAINHUIEENCOUNTER, flag: ALREADYHUIE });
  }
  
  if (!(state.veryRareEncounter & ALREADYBOTTLEOLD)) {
    availableEncounters.push({ type: BOTTLEOLD, encounterCode: EncounterType.BOTTLEOLDENCOUNTER, flag: ALREADYBOTTLEOLD });
  }
  
  if (!(state.veryRareEncounter & ALREADYBOTTLEGOOD)) {
    availableEncounters.push({ type: BOTTLEGOOD, encounterCode: EncounterType.BOTTLEGOODENCOUNTER, flag: ALREADYBOTTLEGOOD });
  }
  
  // If no encounters available, return false
  if (availableEncounters.length === 0) {
    return { hasEncounter: false };
  }
  
  // Pick random available encounter
  const selectedEncounter = availableEncounters[Math.floor(Math.random() * availableEncounters.length)];
  
  // Mark this encounter as done
  state.veryRareEncounter |= selectedEncounter.flag;
  
  return { hasEncounter: true, encounterType: selectedEncounter.encounterCode };
}

export function updateMarkets(state: GameState): void {
  // Update trade prices based on market fluctuations
  const allPrices = getAllSystemPrices(state.solarSystem[state.currentSystem], state.commanderTrader, state.policeRecordScore);
  for (let i = 0; i < state.buyPrice.length; i++) {
    state.buyPrice[i] = allPrices[i].buyPrice;
    state.sellPrice[i] = allPrices[i].sellPrice;
  }
}

// System Integration

export function integrateSystemUpdates(state: GameState, updates: Record<string, any>): void {
  if (typeof updates.credits === 'number') {
    state.credits = Math.max(0, updates.credits);
  }
  
  if (typeof updates.reputation === 'number') {
    state.reputationScore = updates.reputation;
  }
  
  if (typeof updates.fuel === 'number') {
    state.ship.fuel = updates.fuel; // Allow negative values for testing
  }
  
  if (typeof updates.systemVisited === 'number' && updates.systemVisited < state.solarSystem.length) {
    state.solarSystem[updates.systemVisited].visited = true;
  }
}

export function synchronizeSystemState(state: GameState): void {
  // Fix common state inconsistencies
  
  // Clear encounter type if not in combat
  if (state.currentMode !== GameMode.InCombat) {
    state.encounterType = -1;
  }
  
  // Ensure valid current system
  if (state.currentSystem >= state.solarSystem.length) {
    state.currentSystem = 0; // Default to Sol system
  }
  
  // Ensure non-negative values
  state.credits = Math.max(0, state.credits);
  state.ship.hull = Math.max(0, state.ship.hull);
  state.ship.fuel = Math.max(0, state.ship.fuel);
}

// Persistence

export function serializeGameState(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

export function deserializeGameState(serializedState: string): GameState {
  try {
    const state = JSON.parse(serializedState);
    
    // Validate required fields
    if (!state.nameCommander || typeof state.credits !== 'number') {
      throw new Error('Invalid game state format');
    }
    
    const validation = validateGameState(state);
    if (!validation.isValid) {
      throw new Error(`Invalid game state: ${validation.errors.join(', ')}`);
    }
    
    return state;
  } catch (error) {
    throw new Error(`Failed to deserialize game state: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Game Status and Information

export function getGameStatus(state: GameState): {
  commanderName: string;
  credits: number;
  days: number;
  reputation: string;
  policeRecord: string;
} {
  return {
    commanderName: state.nameCommander,
    credits: state.credits,
    days: state.days,
    reputation: getReputationString(state.reputationScore),
    policeRecord: getPoliceRecordString(state.policeRecordScore)
  };
}

export function getCurrentLocation(state: GameState): {
  systemIndex: number;
  systemName: string;
  isDocked: boolean;
} {
  return {
    systemIndex: state.currentSystem,
    systemName: getSolarSystemName(state.currentSystem),
    isDocked: state.currentMode === GameMode.OnPlanet
  };
}

export function getCurrentShipStatus(state: GameState): {
  hull: number;
  hullPercentage: number;
  fuel: number;
  cargoUsed: number;
  cargoCapacity: number;
} {
  const shipType = getShipType(state.ship.type);
  const cargoUsed = state.ship.cargo.reduce((total, quantity) => total + quantity, 0);
  const cargoCapacity = shipType.cargoBays;
  const hullPercentage = Math.round((state.ship.hull / shipType.hullStrength) * 100);
  
  return {
    hull: state.ship.hull,
    hullPercentage,
    fuel: state.ship.fuel,
    cargoUsed,
    cargoCapacity
  };
}

// Helper Functions

function extractBuyPrices(allPrices: Array<{ buyPrice: number; sellPrice: number }>): TradeItemArray {
  if (allPrices.length !== 10) {
    throw new Error(`Expected exactly 10 trade items, got ${allPrices.length}`);
  }
  return [
    allPrices[0].buyPrice, allPrices[1].buyPrice, allPrices[2].buyPrice, allPrices[3].buyPrice, allPrices[4].buyPrice,
    allPrices[5].buyPrice, allPrices[6].buyPrice, allPrices[7].buyPrice, allPrices[8].buyPrice, allPrices[9].buyPrice
  ];
}

function extractSellPrices(allPrices: Array<{ buyPrice: number; sellPrice: number }>): TradeItemArray {
  if (allPrices.length !== 10) {
    throw new Error(`Expected exactly 10 trade items, got ${allPrices.length}`);
  }
  return [
    allPrices[0].sellPrice, allPrices[1].sellPrice, allPrices[2].sellPrice, allPrices[3].sellPrice, allPrices[4].sellPrice,
    allPrices[5].sellPrice, allPrices[6].sellPrice, allPrices[7].sellPrice, allPrices[8].sellPrice, allPrices[9].sellPrice
  ];
}

function getReputationString(score: number): string {
  if (score >= 80) return 'Elite';
  if (score >= 60) return 'Dangerous';
  if (score >= 40) return 'Competent';
  if (score >= 20) return 'Average';
  return 'Harmless';
}

function getPoliceRecordString(score: number): string {
  if (score >= 100) return 'Clean';
  if (score >= 0) return 'Lawful';
  if (score >= -100) return 'Dubious';
  if (score >= -200) return 'Criminal';
  return 'Villain';
}

/**
 * Execute buy equipment action (general equipment menu)
 */
async function executeBuyEquipmentAction(state: GameState, parameters: any): Promise<ActionResult> {
  // This is a menu action - return the available equipment for UI to display
  const currentSystem = state.solarSystem[state.currentSystem];
  const availableEquipment = getAvailableEquipment(state);
  
  return {
    success: true,
    message: 'Equipment shipyard available',
    stateChanged: false,
    data: { availableEquipment }
  };
}

/**
 * Execute sell equipment action (general equipment menu)
 */
async function executeSellEquipmentAction(state: GameState, parameters: any): Promise<ActionResult> {
  // This is a menu action - return the sellable equipment for UI to display
  const sellableEquipment = getInstialledEquipmentSellPrices(state);
  
  return {
    success: true,
    message: 'Equipment selling available',
    stateChanged: false,
    data: { sellableEquipment }
  };
}

/**
 * Execute buy ship action
 */
async function executeBuyShipAction(state: GameState, parameters: any): Promise<ActionResult> {
  if (parameters.shipType !== undefined) {
    // Actually purchase the ship
    const result = purchaseShip(state, parameters.shipType, {
      transferLightning: parameters.transferLightning,
      transferCompactor: parameters.transferCompactor, 
      transferMorgan: parameters.transferMorgan,
    });
    
    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Ship purchase failed',
        stateChanged: false
      };
    }
    
    return {
      success: true,
      message: `Successfully purchased ${getShipType(parameters.shipType).name}`,
      stateChanged: true,
      newState: result.newState
    };
  } else {
    // This is a menu action - return available ships for UI to display
    const availableShips = getAvailableShipsForPurchase(state);
    
    return {
      success: true,
      message: 'Ship trading available',
      stateChanged: false,
      data: { availableShips }
    };
  }
}

/**
 * Execute hire crew action
 */
async function executeHireCrewAction(state: GameState, parameters: any): Promise<ActionResult> {
  // Get mercenary available for hire in current system
  const mercenaryIndex = getMercenaryForHire(state);
  
  if (mercenaryIndex === -1) {
    return {
      success: false,
      message: 'No mercenaries available for hire in this system.',
      stateChanged: false
    };
  }
  
  // Check if we have crew quarters available
  const availableQuarters = getAvailableCrewQuarters(state);
  if (availableQuarters <= 0) {
    return {
      success: false,
      message: 'No crew quarters available. Need a larger ship or fire existing crew.',
      stateChanged: false
    };
  }
  
  // Get mercenary details and hiring cost
  const mercenary = state.mercenary[mercenaryIndex];
  const hiringCost = calculateHiringPrice(mercenary);
  const mercenaryName = getMercenaryName(mercenaryIndex);
  
  // Check if player can afford to hire
  if (state.credits < hiringCost) {
    return {
      success: false,
      message: `Cannot afford to hire ${mercenaryName}. Cost: ${hiringCost} credits, you have: ${state.credits} credits.`,
      stateChanged: false
    };
  }
  
  // Find first free crew slot
  let firstFreeSlot = -1;
  for (let i = 1; i < state.ship.crew.length; i++) { // Start at 1 (skip commander)
    if (state.ship.crew[i] === -1) {
      firstFreeSlot = i;
      break;
    }
  }
  
  if (firstFreeSlot === -1) {
    return {
      success: false,
      message: 'No free crew slots available.',
      stateChanged: false
    };
  }
  
  // Hire the mercenary
  state.ship.crew[firstFreeSlot] = mercenaryIndex;
  state.credits -= hiringCost;
  
  return {
    success: true,
    message: `Hired ${mercenaryName} for ${hiringCost} credits.`,
    stateChanged: true,
    newState: state
  };
}

/**
 * Execute fire crew action
 */
async function executeFireCrewAction(state: GameState, parameters: any): Promise<ActionResult> {
  const { crewSlot } = parameters;
  
  if (typeof crewSlot !== 'number' || crewSlot < 1 || crewSlot >= state.ship.crew.length) {
    return {
      success: false,
      message: 'Invalid crew slot specified.',
      stateChanged: false
    };
  }
  
  const crewIndex = state.ship.crew[crewSlot];
  if (crewIndex === -1) {
    return {
      success: false,
      message: 'No crew member in that slot to fire.',
      stateChanged: false
    };
  }
  
  const mercenaryName = getMercenaryName(crewIndex);
  
  // Fire the crew member (shift remaining crew up, based on Palm OS logic)
  if (crewSlot === 1 && state.ship.crew[2] !== -1) {
    // If firing slot 1 and slot 2 is occupied, move slot 2 to slot 1
    state.ship.crew[1] = state.ship.crew[2];
    state.ship.crew[2] = -1;
  } else {
    // Just clear the slot
    state.ship.crew[crewSlot] = -1;
  }
  
  return {
    success: true,
    message: `Fired ${mercenaryName}.`,
    stateChanged: true,
    newState: state
  };
}

/**
 * Execute combat continue action (resolve combat when ships are destroyed)
 */
async function executeCombatContinueAction(state: GameState): Promise<ActionResult> {
  // Import combat resolution function
  const { checkCombatResolution } = await import('../combat/engine.ts');
  
  const resolution = checkCombatResolution(state);
  
  if (resolution) {
    return {
      success: true,
      message: resolution.message,
      stateChanged: true,
      gameOver: resolution.gameOver,
      newState: state // Return updated state
    };
  } else {
    // Should not happen if we're in this action
    return {
      success: false,
      message: 'Combat continues',
      stateChanged: false
    };
  }
}