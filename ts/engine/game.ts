// Game Engine Integration Implementation
// Orchestrates all game systems: economy, travel, combat, events

import type { GameState, Ship } from '../types.ts';
import { createInitialState } from '../state.ts';
import { GameMode } from '../types.ts';

// Import all system modules
import { buyCargo, sellCargo } from '../economy/trading.ts';
import { calculateStandardPrice, calculateBuyPrice, calculateSellPrice, calculateFinalPrices } from '../economy/pricing.ts';
import { performWarp, canWarpTo, calculateWarpCost } from '../travel/warp.ts';
import { startEncounter, endEncounter, resolveCombatRound, getAvailableActions as getCombatActions, canPerformAction as canPerformCombatAction } from '../combat/engine.ts';
import { getSolarSystemName } from '../data/systems.ts';

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
      
      case 'launch_ship':
        return await executeLaunchShipAction(state);
      
      case 'dock_ship':
        return await executeDockShipAction(state);
      
      case 'warp_to_system':
        return await executeWarpAction(state, action.parameters);
      
      case 'track_system':
        return await executeTrackSystemAction(state, action.parameters);
      
      case 'combat_attack':
      case 'combat_flee':
      case 'combat_surrender':
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
    const result = buyTradeItem(state, tradeItem, quantity);
    return {
      success: result.success,
      message: result.message,
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
    const result = sellTradeItem(state, tradeItem, quantity);
    return {
      success: result.success,
      message: result.message,
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

async function executeLaunchShipAction(state: GameState): Promise<ActionResult> {
  if (state.currentMode !== GameMode.OnPlanet) {
    return {
      success: false,
      message: 'Cannot launch ship - not on planet',
      stateChanged: false
    };
  }
  
  state.currentMode = GameMode.InSpace;
  
  return {
    success: true,
    message: 'Ship launched successfully',
    stateChanged: true
  };
}

async function executeDockShipAction(state: GameState): Promise<ActionResult> {
  if (state.currentMode !== GameMode.InSpace) {
    return {
      success: false,
      message: 'Cannot dock ship - not in space',
      stateChanged: false
    };
  }
  
  state.currentMode = GameMode.OnPlanet;
  
  return {
    success: true,
    message: 'Ship docked successfully',
    stateChanged: true
  };
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
    const result = warpToSystem(state, targetSystem);
    return {
      success: result.success,
      message: result.message,
      stateChanged: result.success
    };
  } catch (error) {
    return {
      success: false,
      message: `Warp failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stateChanged: false
    };
  }
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
    return {
      success: result.success,
      message: result.message,
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
  
  // Buy cargo actions
  const prices = calculateFinalPrices(state.solarSystem[state.currentSystem], state.commanderTrader, state.policeRecordScore);
  for (let i = 0; i < 10; i++) {
    const price = prices.buyPrices[i];
    if (price > 0) {
      actions.push({
        type: 'buy_cargo',
        name: `Buy cargo (item ${i})`,
        description: `Buy trade goods for ${price} credits each`,
        parameters: { possibleItems: [i] },
        available: state.credits >= price
      });
    }
  }
  
  // Sell cargo actions
  for (let i = 0; i < state.ship.cargo.length; i++) {
    if (state.ship.cargo[i] > 0) {
      const price = prices.sellPrices[i];
      actions.push({
        type: 'sell_cargo',
        name: `Sell cargo (item ${i})`,
        description: `Sell ${state.ship.cargo[i]} units for ${price} credits each`,
        available: true
      });
    }
  }
  
  // Launch ship
  actions.push({
    type: 'launch_ship',
    name: 'Launch Ship',
    description: 'Leave the planet and enter space',
    available: true
  });
  
  return actions;
}

function getSpaceActions(state: GameState): AvailableAction[] {
  const actions: AvailableAction[] = [];
  
  // Warp to systems
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
      description: 'Travel to another solar system',
      parameters: { possibleSystems },
      available: state.ship.fuel > 0
    });
  }
  
  // Track system
  actions.push({
    type: 'track_system',
    name: 'Track System',
    description: 'Set navigation target for a system',
    available: true
  });
  
  // Dock at current system
  actions.push({
    type: 'dock_ship',
    name: 'Dock Ship',
    description: 'Land on the planet in current system',
    available: true
  });
  
  return actions;
}

function getCombatActionsForState(state: GameState): AvailableAction[] {
  const actions: AvailableAction[] = [];
  
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
  
  // 10% chance of random encounter
  const encounterChance = Math.random();
  if (encounterChance < 0.1) {
    // Random encounter type (simplified)
    const encounterTypes = [10, 11, 12, 20, 21, 22]; // Various pirate/trader encounters
    const encounterType = encounterTypes[Math.floor(Math.random() * encounterTypes.length)];
    
    return { hasEncounter: true, encounterType };
  }
  
  return { hasEncounter: false };
}

export function updateMarkets(state: GameState): void {
  // Update trade prices based on market fluctuations
  const prices = calculateFinalPrices(state.solarSystem[state.currentSystem], state.commanderTrader, state.policeRecordScore);
  for (let i = 0; i < state.buyPrice.length; i++) {
    state.buyPrice[i] = prices.buyPrices[i];
    state.sellPrice[i] = prices.sellPrices[i];
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
    state.ship.fuel = Math.max(0, updates.fuel);
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
  fuel: number;
  cargoUsed: number;
  cargoCapacity: number;
} {
  const cargoUsed = state.ship.cargo.reduce((total, quantity) => total + quantity, 0);
  const cargoCapacity = 50; // Base cargo capacity - would come from ship data
  
  return {
    hull: state.ship.hull,
    fuel: state.ship.fuel,
    cargoUsed,
    cargoCapacity
  };
}

// Helper Functions

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