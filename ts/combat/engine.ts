// Combat System Engine Implementation
// Ported from Palm OS Space Trader Encounter.c and combat logic

import type { GameState, Ship } from '../types.ts';
import { executeOrbitalPurchase, executeOrbitalSale } from '../trading/orbital.ts';
import { GameMode } from '../types.ts';

// Combat Action Types
export type CombatAction = 'attack' | 'flee' | 'surrender' | 'bribe' | 'submit' | 'ignore' | 'trade' | 'board' | 'meet' | 'drink' | 'yield' | 'plunder';

// Combat Outcome Interface
export interface CombatOutcome {
  result: 'victory' | 'defeat' | 'flee' | 'surrender' | 'ongoing';
  playerDestroyed: boolean;
  opponentDestroyed: boolean;
  bounty: number;
  credits?: number;
  reputation?: number;
}

// Combat Round Result
export interface CombatRoundResult {
  success: boolean;
  playerDamage: number;
  opponentDamage: number;
  message: string;
}

// Encounter State for UI tracking
export interface EncounterState {
  type: number;
  isActive: boolean;
  name: string;
  availableActions: CombatAction[];
  turnNumber: number;
  combatLog: Array<{
    action: CombatAction;
    result: CombatRoundResult;
    timestamp: number;
  }>;
}

// Encounter Types - matching Palm OS constants exactly
export const EncounterType = {
  // Police encounters (0-9)
  POLICEINSPECTION: 0,    // Police asks to submit for inspection
  POLICEIGNORE: 1,        // Police just ignores you
  POLICEATTACK: 2,        // Police attacks you (sometimes on sight)
  POLICEFLEE: 3,          // Police is fleeing
  
  // Pirate encounters (10-19)
  PIRATEATTACK: 10,       // Pirate attacks
  PIRATEFLEE: 11,         // Pirate flees
  PIRATEIGNORE: 12,       // Pirate ignores you (because of cloak)
  PIRATESURRENDER: 13,    // Pirate surrenders
  
  // Trader encounters (20-29)
  TRADERIGNORE: 20,       // Trader passes
  TRADERFLEE: 21,         // Trader flees
  TRADERATTACK: 22,       // Trader is attacking (after being provoked)
  TRADERSURRENDER: 23,    // Trader surrenders
  TRADERSELL: 24,         // Trader will sell products in orbit
  TRADERBUY: 25,          // Trader will buy products in orbit
  
  // Monster encounters (30-39)
  SPACEMONSTERATTACK: 30, // Space monster attacks
  SPACEMONSTERIGNORE: 31, // Space monster ignores
  
  // Dragonfly encounters (40-49)
  DRAGONFLYATTACK: 40,    // Dragonfly attacks
  DRAGONFLYIGNORE: 41,    // Dragonfly ignores
  
  // Scarab encounters (60-69)
  SCARABATTACK: 60,       // Scarab attacks
  SCARABIGNORE: 61,       // Scarab ignores
  
  // Famous captain encounters (70-79)
  FAMOUSCAPTAIN: 70,      // Famous captain
  FAMOUSCAPATTACK: 71,    // Famous captain attacks
  
  // Special encounters (80+)
  MARIECELESTEENCOUNTER: 80,      // Marie Celeste encounter
  BOTTLEOLDENCOUNTER: 81,         // Bottle (old) encounter
  BOTTLEGOODENCOUNTER: 82,        // Bottle (good) encounter
  POSTMARIEPOLICEENCOUNTER: 83,   // Post-Marie police encounter
  
  // Famous captain encounters (70+)
  CAPTAINAHABENCOUNTER: 72,       // Captain Ahab encounter
  CAPTAINCONRADENCOUNTER: 73,     // Captain Conrad encounter  
  CAPTAINHUIEENCOUNTER: 74,       // Captain Huie encounter

  // Helper functions for encounter type checking (matching Palm OS macros)
  isPoliceEncounter: (type: number): boolean => type >= 0 && type <= 9,
  isPirateEncounter: (type: number): boolean => type >= 10 && type <= 19,
  isTraderEncounter: (type: number): boolean => type >= 20 && type <= 29,
  isMonsterEncounter: (type: number): boolean => type >= 30 && type <= 39,
  isDragonflyEncounter: (type: number): boolean => type >= 40 && type <= 49,
  isScarabEncounter: (type: number): boolean => type >= 60 && type <= 69,
  isFamousEncounter: (type: number): boolean => type >= 70 && type <= 79,
} as const;

// Encounter Management Functions

export function startEncounter(state: GameState, encounterType: number): { success: boolean; message?: string } {
  if (state.currentMode === GameMode.InCombat) {
    return { success: false, message: 'Already in combat' };
  }

  state.currentMode = GameMode.InCombat;
  state.encounterType = encounterType;
  
  return { success: true };
}

export function endEncounter(state: GameState): void {
  state.currentMode = GameMode.InSpace;
  state.encounterType = -1; // No encounter
}

export function getCurrentEncounter(state: GameState): { type: number; name: string; isActive: boolean } {
  const encounterNames: Record<number, string> = {
    [EncounterType.POLICEINSPECTION]: 'Police Inspection',
    [EncounterType.POLICEATTACK]: 'Police Attack', 
    [EncounterType.PIRATEATTACK]: 'Pirate Attack',
    [EncounterType.TRADERSELL]: 'Trader Selling',
    [EncounterType.SPACEMONSTERATTACK]: 'Space Monster Attack',
    [EncounterType.MARIECELESTEENCOUNTER]: 'Marie Celeste',
    [EncounterType.BOTTLEOLDENCOUNTER]: 'Message in Bottle',
    [EncounterType.BOTTLEGOODENCOUNTER]: 'Message in Bottle', 
    [EncounterType.CAPTAINAHABENCOUNTER]: 'Captain Ahab',
    [EncounterType.CAPTAINCONRADENCOUNTER]: 'Captain Conrad',
    [EncounterType.CAPTAINHUIEENCOUNTER]: 'Captain Huie',
  };

  return {
    type: state.encounterType,
    name: encounterNames[state.encounterType] || `Encounter ${state.encounterType}`,
    isActive: state.currentMode === GameMode.InCombat
  };
}

// Combat Action Functions

export function getAvailableActions(state: GameState): CombatAction[] {
  const encounterType = state.encounterType;
  const actions: CombatAction[] = [];

  if (encounterType === EncounterType.POLICEINSPECTION) {
    actions.push('attack', 'flee', 'submit', 'bribe');
  } else if (encounterType === EncounterType.POSTMARIEPOLICEENCOUNTER) {
    actions.push('attack', 'flee', 'yield', 'bribe');
  } else if (EncounterType.isPoliceEncounter(encounterType) || 
             EncounterType.isPirateEncounter(encounterType) ||
             EncounterType.isMonsterEncounter(encounterType)) {
    
    if (encounterType === EncounterType.POLICEFLEE || 
        encounterType === EncounterType.TRADERFLEE ||
        encounterType === EncounterType.PIRATEFLEE) {
      actions.push('attack', 'ignore');
    } else if (encounterType === EncounterType.PIRATEATTACK || 
               encounterType === EncounterType.POLICEATTACK ||
               encounterType === EncounterType.SPACEMONSTERATTACK) {
      actions.push('attack', 'flee', 'surrender');
    } else if (encounterType === EncounterType.PIRATESURRENDER || 
               encounterType === EncounterType.TRADERSURRENDER) {
      actions.push('attack', 'plunder');
    }
  } else if (EncounterType.isTraderEncounter(encounterType)) {
    if (encounterType === EncounterType.TRADERSELL || encounterType === EncounterType.TRADERBUY) {
      actions.push('attack', 'ignore', 'trade');
    } else if (encounterType === EncounterType.TRADERATTACK) {
      actions.push('attack', 'flee');
    }
  } else if (encounterType === EncounterType.MARIECELESTEENCOUNTER) {
    actions.push('board', 'ignore');
  } else if (encounterType === EncounterType.BOTTLEOLDENCOUNTER || 
             encounterType === EncounterType.BOTTLEGOODENCOUNTER) {
    actions.push('drink', 'ignore');
  } else if (encounterType === EncounterType.CAPTAINAHABENCOUNTER ||
             encounterType === EncounterType.CAPTAINCONRADENCOUNTER ||
             encounterType === EncounterType.CAPTAINHUIEENCOUNTER) {
    actions.push('attack', 'flee', 'ignore');
  }

  return actions;
}

export function canPerformAction(state: GameState, action: CombatAction): boolean {
  const availableActions = getAvailableActions(state);
  return availableActions.includes(action);
}

// Combat Calculation Functions

export function calculateWeaponPower(ship: Ship): number {
  let weaponPower = 0;
  
  for (const weaponIndex of ship.weapon) {
    if (weaponIndex >= 0) {
      // Weapon power calculation based on weapon type
      // Basic mapping: 0=Pulse Laser (15), 1=Beam Laser (25), 2=Military Laser (35)
      const weaponPowers = [15, 25, 35, 45, 55]; // Expandable for more weapon types
      weaponPower += weaponPowers[weaponIndex] || 10;
    }
  }
  
  return weaponPower;
}

export function calculateShieldPower(ship: Ship): number {
  let shieldPower = 0;
  
  for (let i = 0; i < ship.shield.length; i++) {
    const shieldIndex = ship.shield[i];
    if (shieldIndex >= 0) {
      // Shield power based on current strength and shield type
      const shieldStrength = ship.shieldStrength[i];
      const shieldTypes = [10, 20, 30, 40, 50]; // Different shield types
      const maxShieldPower = shieldTypes[shieldIndex] || 10;
      
      // Current shield power proportional to current strength
      shieldPower += (shieldStrength / maxShieldPower) * maxShieldPower;
    }
  }
  
  return Math.floor(shieldPower);
}

export function calculateHullStrength(ship: Ship): number {
  return ship.hull;
}

export function calculateDamage(attacker: Ship, defender: Ship): number {
  const weaponPower = calculateWeaponPower(attacker);
  const shieldPower = calculateShieldPower(defender);
  
  // Basic damage calculation: weapon power vs shield power
  let damage = weaponPower - (shieldPower * 0.5); // Shields reduce damage by 50%
  
  // Random factor (Palm OS uses random variation)
  const randomFactor = 0.5 + (Math.random() * 1.0); // 50% to 150% of base damage
  damage = Math.floor(damage * randomFactor);
  
  // Minimum damage of 1 if attacker has any weapons
  if (weaponPower > 0) {
    damage = Math.max(damage, 1);
  } else {
    damage = 0;
  }
  
  return damage;
}

export function applyDamage(ship: Ship, damage: number): void {
  let remainingDamage = damage;
  
  // Damage shields first
  for (let i = 0; i < ship.shieldStrength.length; i++) {
    if (remainingDamage <= 0) break;
    
    const shieldStrength = ship.shieldStrength[i];
    if (shieldStrength > 0) {
      const damageToShield = Math.min(remainingDamage, shieldStrength);
      ship.shieldStrength[i] -= damageToShield;
      remainingDamage -= damageToShield;
    }
  }
  
  // Apply remaining damage to hull
  if (remainingDamage > 0) {
    ship.hull = Math.max(0, ship.hull - remainingDamage);
  }
}

// Combat Resolution Functions

export function resolveCombatRound(state: GameState, playerAction: CombatAction): CombatRoundResult {
  if (!canPerformAction(state, playerAction)) {
    return {
      success: false,
      playerDamage: 0,
      opponentDamage: 0,
      message: `Cannot perform action: ${playerAction}`
    };
  }
  
  let playerDamage = 0;
  let opponentDamage = 0;
  let message = '';
  
  if (playerAction === 'attack') {
    // Player attacks opponent
    opponentDamage = calculateDamage(state.ship, state.opponent);
    applyDamage(state.opponent, opponentDamage);
    
    // Opponent counterattacks (if still alive)
    if (state.opponent.hull > 0) {
      playerDamage = calculateDamage(state.opponent, state.ship);
      applyDamage(state.ship, playerDamage);
    }
    
    message = `You deal ${opponentDamage} damage. Enemy deals ${playerDamage} damage.`;
  } else if (playerAction === 'flee') {
    // Attempt to flee - success based on ship speed vs opponent
    const fleeSuccess = Math.random() > 0.3; // 70% success rate for now
    if (fleeSuccess) {
      endEncounter(state);
      message = 'You successfully escape!';
    } else {
      // Failed flee - opponent gets free attack
      playerDamage = calculateDamage(state.opponent, state.ship);
      applyDamage(state.ship, playerDamage);
      message = `Escape failed! Enemy deals ${playerDamage} damage.`;
    }
  } else if (playerAction === 'ignore') {
    // Ignore the encounter - end peacefully
    endEncounter(state);
    message = 'You ignore the encounter and continue on your way.';
  } else if (playerAction === 'trade') {
    // Handle orbital trading
    if (state.encounterType === EncounterType.TRADERSELL) {
      // Trader is selling to player
      const tradeResult = executeOrbitalPurchase(state, state.encounterType);
      if (tradeResult.success) {
        endEncounter(state);
        message = tradeResult.reason || 'Trade completed successfully';
      } else {
        message = tradeResult.reason || 'Trade failed';
      }
    } else if (state.encounterType === EncounterType.TRADERBUY) {
      // Trader is buying from player
      const tradeResult = executeOrbitalSale(state, state.encounterType);
      if (tradeResult.success) {
        endEncounter(state);
        message = tradeResult.reason || 'Trade completed successfully';
      } else {
        message = tradeResult.reason || 'Trade failed';
      }
    } else {
      message = 'This encounter does not offer trading.';
    }
  } else if (playerAction === 'surrender') {
    // Surrender to opponent
    endEncounter(state);
    message = 'You surrender. The encounter ends.';
  } else if (playerAction === 'plunder') {
    // Plunder defeated opponent (when they surrender)
    // TODO: Implement plundering mechanics
    endEncounter(state);
    message = 'You plunder the defeated ship.';
  }
  
  return {
    success: true,
    playerDamage,
    opponentDamage,
    message
  };
}

export function determineCombatOutcome(state: GameState): CombatOutcome {
  const playerDestroyed = state.ship.hull <= 0;
  const opponentDestroyed = state.opponent.hull <= 0;
  
  if (playerDestroyed) {
    return {
      result: 'defeat',
      playerDestroyed: true,
      opponentDestroyed: false,
      bounty: 0
    };
  }
  
  if (opponentDestroyed) {
    // Calculate bounty based on opponent ship value
    const bounty = calculateBounty(state.opponent);
    return {
      result: 'victory',
      playerDestroyed: false,
      opponentDestroyed: true,
      bounty
    };
  }
  
  return {
    result: 'ongoing',
    playerDestroyed: false,
    opponentDestroyed: false,
    bounty: 0
  };
}

function calculateBounty(opponent: Ship): number {
  // Basic bounty calculation - can be expanded
  const shipTypeValues = [1000, 2500, 5000, 10000, 15000]; // Different ship types
  const baseValue = shipTypeValues[opponent.type] || 1000;
  
  // Bounty is a fraction of ship value
  let bounty = Math.floor(baseValue / 200);
  bounty = Math.floor(bounty / 25) * 25; // Round to nearest 25
  
  // Bounds from Palm OS source
  if (bounty <= 0) bounty = 25;
  if (bounty > 2500) bounty = 2500;
  
  return bounty;
}

export function attemptFlee(state: GameState): { success: boolean; message: string } {
  // Fleet success based on ship capabilities and difficulty
  const baseFleeChance = 0.7;
  
  // TODO: Factor in ship speed, pilot skill, etc.
  const success = Math.random() < baseFleeChance;
  
  if (success) {
    endEncounter(state);
    return { success: true, message: 'Successfully escaped from combat!' };
  } else {
    return { success: false, message: 'Failed to escape! The enemy is too fast.' };
  }
}

export function attemptSurrender(state: GameState): { success: boolean; message: string } {
  // Surrender success depends on encounter type and player reputation
  const encounterType = state.encounterType;
  
  if (EncounterType.isPirateEncounter(encounterType)) {
    // Pirates usually accept surrender and take cargo/credits
    const cargoValue = state.ship.cargo.reduce((sum, qty) => sum + qty, 0);
    const creditLoss = Math.min(state.credits, Math.floor(state.credits * 0.5));
    
    // Remove some cargo and credits
    state.credits -= creditLoss;
    // TODO: Remove some cargo items
    
    endEncounter(state);
    return { 
      success: true, 
      message: `You surrender. Pirates take ${creditLoss} credits and some cargo.`
    };
  } else if (EncounterType.isPoliceEncounter(encounterType)) {
    // Police may arrest you
    endEncounter(state);
    return { success: true, message: 'You surrender to the police.' };
  }
  
  return { success: false, message: 'They refuse to accept your surrender!' };
}

export function attemptBribe(state: GameState): { success: boolean; message: string } {
  const encounterType = state.encounterType;
  
  if (encounterType === EncounterType.POLICEINSPECTION) {
    const bribeAmount = 500; // Base bribe amount
    
    if (state.credits >= bribeAmount) {
      state.credits -= bribeAmount;
      endEncounter(state);
      return { success: true, message: `Bribe accepted. You pay ${bribeAmount} credits.` };
    } else {
      return { success: false, message: 'You do not have enough credits to pay the bribe.' };
    }
  }
  
  return { success: false, message: 'They cannot be bribed.' };
}

// Encounter State Management

export function createEncounterState(state: GameState, encounterType: number): EncounterState {
  return {
    type: encounterType,
    isActive: true,
    name: getCurrentEncounter({ ...state, encounterType }).name,
    availableActions: getAvailableActions({ ...state, encounterType }),
    turnNumber: 1,
    combatLog: []
  };
}

export function updateEncounterState(
  encounterState: EncounterState, 
  action: CombatAction, 
  result: CombatRoundResult
): EncounterState {
  return {
    ...encounterState,
    turnNumber: encounterState.turnNumber + 1,
    combatLog: [...encounterState.combatLog, {
      action,
      result,
      timestamp: Date.now()
    }]
  };
}