// Combat System Engine Implementation
// Ported from Palm OS Space Trader Encounter.c and combat logic

import type { GameState, Ship } from '../types.ts';
import { executeOrbitalPurchase, executeOrbitalSale } from '../trading/orbital.ts';
import { GameMode } from '../types.ts';
import { getShipType } from '../data/shipTypes.ts';
import { getWeapons, getShields } from '../data/equipment.ts';
import { createEmptyShip } from '../state.ts';

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
  
  // Configure opponent ship based on encounter type
  configureOpponentShip(state, encounterType);
  
  return { success: true };
}

export function endEncounter(state: GameState): void {
  state.encounterType = -1; // No encounter
  // Mode will be determined by travel continuation:
  // - OnPlanet if at destination or no travel in progress
  // - InCombat if another encounter occurs during travel
  
  // If not traveling (warpSystem same as current), go to planet
  if (state.warpSystem === state.currentSystem || state.clicks === 0) {
    state.currentMode = GameMode.OnPlanet;
  } else {
    // Still traveling - mode will be set by travel continuation logic
    // Don't change mode here, let automaticTravelContinuation handle it
  }
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

  // Handle invalid encounter type (encounter ended but still in combat mode)
  if (encounterType === -1) {
    actions.push('continue');
    return actions;
  }

  if (encounterType === EncounterType.POLICEINSPECTION) {
    actions.push('attack', 'flee', 'submit', 'bribe');
  } else if (encounterType === EncounterType.POSTMARIEPOLICEENCOUNTER) {
    actions.push('attack', 'flee', 'yield', 'bribe');
  } else if (EncounterType.isPoliceEncounter(encounterType) || 
             EncounterType.isPirateEncounter(encounterType) ||
             EncounterType.isMonsterEncounter(encounterType) ||
             EncounterType.isDragonflyEncounter(encounterType) ||
             EncounterType.isScarabEncounter(encounterType)) {
    
    if (encounterType === EncounterType.POLICEIGNORE ||
        encounterType === EncounterType.POLICEFLEE || 
        encounterType === EncounterType.PIRATEFLEE ||
        encounterType === EncounterType.PIRATEIGNORE ||
        encounterType === EncounterType.SPACEMONSTERIGNORE ||
        encounterType === EncounterType.DRAGONFLYIGNORE ||
        encounterType === EncounterType.SCARABIGNORE) {
      actions.push('attack', 'ignore');
    } else if (encounterType === EncounterType.PIRATEATTACK || 
               encounterType === EncounterType.POLICEATTACK ||
               encounterType === EncounterType.SPACEMONSTERATTACK ||
               encounterType === EncounterType.DRAGONFLYATTACK ||
               encounterType === EncounterType.SCARABATTACK) {
      actions.push('attack', 'flee', 'surrender');
    } else if (encounterType === EncounterType.PIRATESURRENDER) {
      actions.push('attack', 'plunder');
    }
  } else if (EncounterType.isTraderEncounter(encounterType)) {
    if (encounterType === EncounterType.TRADERSELL || encounterType === EncounterType.TRADERBUY) {
      actions.push('attack', 'ignore', 'trade');
    } else if (encounterType === EncounterType.TRADERATTACK) {
      actions.push('attack', 'flee');
    } else if (encounterType === EncounterType.TRADERIGNORE || 
               encounterType === EncounterType.TRADERFLEE ||
               encounterType === EncounterType.TRADERSURRENDER) {
      actions.push('attack', 'ignore');
    }
  } else if (encounterType === EncounterType.MARIECELESTEENCOUNTER) {
    actions.push('board', 'ignore');
  } else if (encounterType === EncounterType.BOTTLEOLDENCOUNTER || 
             encounterType === EncounterType.BOTTLEGOODENCOUNTER) {
    actions.push('drink', 'ignore');
  } else if (encounterType === EncounterType.CAPTAINAHABENCOUNTER ||
             encounterType === EncounterType.CAPTAINCONRADENCOUNTER ||
             encounterType === EncounterType.CAPTAINHUIEENCOUNTER ||
             encounterType === EncounterType.FAMOUSCAPTAIN ||
             encounterType === EncounterType.FAMOUSCAPATTACK) {
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
  
  // Ensure opponent is configured if not already
  if (state.opponent.hull <= 0 || state.opponent.type === 0) {
    configureOpponentShip(state, state.encounterType);
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
    
    // Check for combat resolution
    const resolution = checkCombatResolution(state);
    if (resolution) {
      message += ` ${resolution.message}`;
      return {
        success: true,
        playerDamage,
        opponentDamage,
        message
      };
    }
  } else if (playerAction === 'flee') {
    // Attempt to flee - success based on ship speed vs opponent
    const fleeSuccess = Math.random() > 0.3; // 70% success rate for now
    if (fleeSuccess) {
      endEncounter(state);
      message = 'You have managed to escape your opponent.';
    } else {
      // Failed flee - opponent gets free attack
      playerDamage = calculateDamage(state.opponent, state.ship);
      applyDamage(state.ship, playerDamage);
      message = `Escape failed! Enemy deals ${playerDamage} damage.`;
    }
  } else if (playerAction === 'ignore') {
    // Ignore the encounter - end peacefully
    endEncounter(state);
    message = ''; // No message - let travel continuation handle messaging
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
  } else if (playerAction === 'submit') {
    // Submit to police inspection
    if (state.encounterType === EncounterType.POLICEINSPECTION) {
      message = handlePoliceSubmit(state);
      endEncounter(state);
    } else {
      message = 'Submit is only available for police inspections.';
    }
  } else if (playerAction === 'bribe') {
    // Bribe police to avoid inspection
    if (state.encounterType === EncounterType.POLICEINSPECTION) {
      message = handlePoliceBribe(state);
      endEncounter(state);
    } else {
      message = 'Bribe is only available for police inspections.';
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
  } else if (playerAction === 'board') {
    // Handle boarding actions for special ships like Marie Celeste
    if (state.encounterType === EncounterType.MARIECELESTEENCOUNTER) {
      message = 'You board the Marie Celeste and find a strange bottle. Use the drink action to consume it.';
      // Set flag that bottle is available
      state.justLootedMarie = true;
      endEncounter(state);
    } else {
      message = 'This ship cannot be boarded.';
    }
  } else if (playerAction === 'drink') {
    // Handle drinking from bottle found on Marie Celeste
    if (state.justLootedMarie) {
      // Random effect from drinking bottle
      const goodEffect = Math.random() < 0.5;
      if (goodEffect) {
        state.ship.hull = Math.min(state.ship.hull + 10, 100);
        message = 'The bottle contains a healing elixir! Your ship is partially repaired.';
      } else {
        state.ship.hull = Math.max(1, state.ship.hull - 10);
        message = 'The bottle contains a foul liquid! Your ship takes damage.';
      }
      state.justLootedMarie = false; // Consume the bottle
    } else {
      message = 'You do not have a bottle to drink from.';
    }
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
    // Special handling for Scarab destruction - hull upgrade reward
    if (state.encounterType === EncounterType.SCARABATTACK && state.scarabStatus !== 1) {
      state.scarabStatus = 1; // Mark hull upgrade acquired
      state.ship.hull = Math.min(state.ship.hull + 10, 200); // Permanent +10 hull bonus
      // Note: Full scarab destruction mechanics are in special-ships.ts
    }
    
    // Mark very rare encounters as completed
    if (state.encounterType === EncounterType.MARIECELESTEENCOUNTER ||
        state.encounterType === EncounterType.CAPTAINAHABENCOUNTER ||
        state.encounterType === EncounterType.CAPTAINCONRADENCOUNTER ||
        state.encounterType === EncounterType.CAPTAINHUIEENCOUNTER) {
      // Set the appropriate flag bit
      if (state.encounterType === EncounterType.MARIECELESTEENCOUNTER) {
        state.veryRareEncounter |= (1 << 0); // ALREADYMARIE
      } else if (state.encounterType === EncounterType.CAPTAINAHABENCOUNTER) {
        state.veryRareEncounter |= (1 << 1); // ALREADYAHAB  
      } else if (state.encounterType === EncounterType.CAPTAINCONRADENCOUNTER) {
        state.veryRareEncounter |= (1 << 2); // ALREADYCONRAD
      } else if (state.encounterType === EncounterType.CAPTAINHUIEENCOUNTER) {
        state.veryRareEncounter |= (1 << 3); // ALREADYHUIE
      }
    }
    
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

export function calculateBounty(opponent: Ship): number {
  // Port of Palm OS GetBounty() function from Encounter.c
  // Uses EnemyShipPrice() equivalent for ship valuation
  
  const shipType = getShipType(opponent.type);
  const weapons = getWeapons();
  const shields = getShields();
  
  // Calculate ship price including equipment (EnemyShipPrice equivalent)
  let shipPrice = shipType.price;
  
  // Add weapon values
  for (let i = 0; i < opponent.weapon.length; i++) {
    if (opponent.weapon[i] >= 0) {
      shipPrice += weapons[opponent.weapon[i]].price;
    }
  }
  
  // Add shield values
  for (let i = 0; i < opponent.shield.length; i++) {
    if (opponent.shield[i] >= 0) {
      shipPrice += shields[opponent.shield[i]].price;
    }
  }
  
  // Apply Palm OS bounty formula
  let bounty = Math.floor(shipPrice / 200);
  bounty = Math.floor(bounty / 25);
  bounty = bounty * 25;
  
  // Apply bounds
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

// Configure opponent ship based on encounter type  
export function configureOpponentShip(state: GameState, encounterType: number): void {
  // Reset opponent to empty ship
  state.opponent = createEmptyShip();
  
  if (EncounterType.isPoliceEncounter(encounterType)) {
    // Police ships - use Gnat or better
    state.opponent.type = 1; // Gnat
    const shipType = getShipType(1);
    state.opponent.hull = shipType.hullStrength;
    state.opponent.weapon[0] = 1; // Beam Laser (stronger than player's pulse laser)
    
  } else if (EncounterType.isPirateEncounter(encounterType)) {
    // Pirate ships - varied types
    const pirateShipTypes = [1, 2]; // Gnat, Firefly
    state.opponent.type = pirateShipTypes[Math.floor(Math.random() * pirateShipTypes.length)];
    const shipType = getShipType(state.opponent.type);
    state.opponent.hull = shipType.hullStrength;
    state.opponent.weapon[0] = 0; // Pulse Laser (same as player)
    
  } else if (EncounterType.isTraderEncounter(encounterType)) {
    // Trader ships - usually weaker
    state.opponent.type = 1; // Gnat
    const shipType = getShipType(1);
    state.opponent.hull = shipType.hullStrength;
    state.opponent.weapon[0] = 0; // Pulse Laser
    
  } else if (encounterType === EncounterType.BOTTLEOLDENCOUNTER ||
             encounterType === EncounterType.BOTTLEGOODENCOUNTER) {
    // Bottle encounters - special bottle "ship"
    state.opponent.type = 14; // Bottle
    const shipType = getShipType(14);
    state.opponent.hull = shipType.hullStrength;
    // Bottles have no weapons
    
  } else {
    // Default opponent setup
    state.opponent.type = 1; // Gnat
    const shipType = getShipType(1);
    state.opponent.hull = shipType.hullStrength;
    state.opponent.weapon[0] = 0; // Pulse Laser
  }
}

// Check if combat should end due to hull destruction
export function checkCombatResolution(state: GameState): { message: string; gameOver?: boolean } | null {
  const bothDestroyed = state.ship.hull <= 0 && state.opponent.hull <= 0;
  const playerDestroyed = state.ship.hull <= 0;
  const opponentDestroyed = state.opponent.hull <= 0;
  
  if (bothDestroyed) {
    // Both ships destroyed - escape pod check
    if (state.escapePod) {
      handleEscapeWithPod(state);
      return { message: 'Both ships destroyed! Your escape pod activates...' };
    } else {
      // Player dies - hull will be 0 for ending system to detect
      state.currentMode = GameMode.GameOver;
      return { message: 'Both ships destroyed! Your ship is destroyed.', gameOver: true };
    }
  } else if (opponentDestroyed) {
    // Enemy destroyed - victory!
    const reward = handleVictory(state);
    endEncounter(state);
    return { message: reward.message };
  } else if (playerDestroyed) {
    // Player destroyed
    if (state.escapePod) {
      handleEscapeWithPod(state);
      return { message: 'Your ship is destroyed! Your escape pod activates...' };
    } else {
      // Player dies - keep hull at 0 for ending system to detect
      state.currentMode = GameMode.GameOver;
      return { message: 'Your ship is destroyed! Game Over.', gameOver: true };
    }
  }
  
  return null; // Combat continues
}

// Handle escape pod activation (simplified version of Palm OS EscapeWithPod)
function handleEscapeWithPod(state: GameState): void {
  // Reset to a basic Flea ship
  const newShip = createEmptyShip();
  newShip.type = 0; // Flea
  newShip.hull = getShipType(0).hullStrength;
  newShip.fuel = getShipType(0).fuelTanks;
  newShip.crew[0] = state.ship.crew[0]; // Keep commander
  
  // Clear other crew members and equipment 
  state.ship = newShip;
  
  // Financial cost
  if (state.credits > 500) {
    state.credits -= 500;
  } else {
    state.debt += (500 - state.credits);
    state.credits = 0;
  }
  
  // Clear quest items and status
  state.jarekStatus = 0;
  state.wildStatus = 0;
  state.reactorStatus = 0;
  state.ship.tribbles = 0;
  
  // Insurance payout
  if (state.insurance) {
    // Calculate ship value and add insurance payout
    const insurancePayout = 15000; // Simplified - should calculate actual ship value
    state.credits += insurancePayout;
  }
  
  // Advance time and reset
  state.days += 3;
  state.escapePod = false;
  state.insurance = false;
  
  endEncounter(state);
}

// Handle victory rewards (simplified version of Palm OS victory logic)
function handleVictory(state: GameState): { message: string } {
  const encounterType = state.encounterType;
  let message = 'Enemy destroyed!';
  let bounty = 0;
  
  // Calculate bounty based on opponent ship type
  const opponentShipType = getShipType(state.opponent.type);
  bounty = opponentShipType.bounty;
  
  if (EncounterType.isPoliceEncounter(encounterType)) {
    // Killing police - bad for police record
    state.policeKills++;
    state.policeRecordScore -= 3; // KILLPOLICESCORE equivalent
    message += ` You are now wanted by the police!`;
  } else if (EncounterType.isPirateEncounter(encounterType)) {
    // Killing pirates - good for police record, bounty reward
    state.pirateKills++;
    state.policeRecordScore += 1; // KILLPIRATESCORE equivalent
    state.credits += bounty;
    message += ` Bounty earned: ${bounty} credits.`;
    
    // Chance to scoop cargo (simplified)
    if (Math.random() < 0.5) {
      const randomItem = Math.floor(Math.random() * 5); // Focus on cheaper items
      if (state.ship.cargo.reduce((sum, qty) => sum + qty, 0) < getShipType(state.ship.type).cargoBays) {
        state.ship.cargo[randomItem]++;
        const tradeItemNames = ['Water', 'Furs', 'Food', 'Ore', 'Games'];
        message += ` Found 1 ${tradeItemNames[randomItem]} in the debris.`;
      }
    }
  } else if (EncounterType.isTraderEncounter(encounterType)) {
    // Killing traders - bad for police record
    state.traderKills++;
    state.policeRecordScore -= 2; // KILLTRADERSCORE equivalent  
    message += ` You are now considered a criminal!`;
    
    // Trader cargo scoop
    if (Math.random() < 0.7) {
      const randomItem = Math.floor(Math.random() * 10);
      if (state.ship.cargo.reduce((sum, qty) => sum + qty, 0) < getShipType(state.ship.type).cargoBays) {
        state.ship.cargo[randomItem]++;
        const tradeItemNames = ['Water', 'Furs', 'Food', 'Ore', 'Games', 'Firearms', 'Medicine', 'Machinery', 'Narcotics', 'Robots'];
        message += ` Found 1 ${tradeItemNames[randomItem]} in the wreckage.`;
      }
    }
  }
  
  // Reputation increase for victory
  state.reputationScore += 1 + Math.floor(state.opponent.type / 2);
  
  return { message };
}

// Police encounter specific functions  
function handlePoliceSubmit(state: GameState): string {
  // TradeItem enum constants
  const FIREARMS = 4;
  const NARCOTICS = 5;
  
  // Check for illegal goods (firearms, narcotics) and Jonathan Wild
  const hasFirearms = state.ship.cargo[FIREARMS] > 0;
  const hasNarcotics = state.ship.cargo[NARCOTICS] > 0;
  const hasWild = state.wildStatus === 1; // Wild aboard
  const hasReactor = state.reactorStatus > 0 && state.reactorStatus < 21; // Dangerous reactor
  
  if (hasFirearms || hasNarcotics || hasWild || hasReactor) {
    let message = 'Police inspection reveals illegal items! ';
    
    if (hasFirearms || hasNarcotics) {
      // Confiscate illegal goods
      state.ship.cargo[FIREARMS] = 0;
      state.buyingPrice[FIREARMS] = 0;
      state.ship.cargo[NARCOTICS] = 0;
      state.buyingPrice[NARCOTICS] = 0;
      
      // Calculate fine based on worth and difficulty
      const currentWorth = state.credits + state.ship.cargo.reduce((total, qty, i) => total + (qty * state.sellPrice[i]), 0);
      let fine = Math.floor(currentWorth / ((7 - state.difficulty) * 10));
      if (fine % 50 !== 0) {
        fine += (50 - (fine % 50));
      }
      fine = Math.max(100, Math.min(fine, 10000));
      
      // Apply fine
      if (state.credits >= fine) {
        state.credits -= fine;
      } else {
        state.debt += (fine - state.credits);
        state.credits = 0;
      }
      
      message += `Illegal goods confiscated and fined ${fine} credits. `;
    }
    
    if (hasWild) {
      // Jonathan Wild captured - severe consequences
      state.wildStatus = 0; // Remove Wild
      state.days += 10; // Jail time
      message += 'Jonathan Wild arrested! You spend 10 days in jail. ';
    }
    
    // Worsen police record for having illegal items
    state.policeRecordScore += 70; // TRAFFICKING penalty
    message += 'Your police record is damaged.';
    
    return message;
  } else {
    // Clean inspection - improve police record
    state.policeRecordScore -= 70; // Improve record (negative is better)
    return 'Police inspection found nothing illegal. Your lawfulness record improves.';
  }
}

function handlePoliceBribe(state: GameState): string {
  // Calculate bribe amount based on worth and system politics
  const currentWorth = state.credits + state.ship.cargo.reduce((total, qty, i) => total + (qty * state.sellPrice[i]), 0);
  
  // Use hardcoded politics bribeLevel for now (should be imported properly)
  const bribeLevel = 1; // Default bribe level
  
  let bribe = Math.floor(currentWorth / ((10 + 5 * (4 - state.difficulty)) * bribeLevel));
  if (bribe % 100 !== 0) {
    bribe += (100 - (bribe % 100));
  }
  
  // Higher bribe if carrying Wild or dangerous reactor
  if (state.wildStatus === 1 || (state.reactorStatus > 0 && state.reactorStatus < 21)) {
    if (state.difficulty <= 1) { // NORMAL difficulty or easier
      bribe *= 2;
    } else {
      bribe *= 3;
    }
  }
  
  bribe = Math.max(100, Math.min(bribe, 10000));
  
  if (state.credits >= bribe) {
    state.credits -= bribe;
    // Small police record penalty for bribing
    state.policeRecordScore += 10;
    return `You successfully bribed the police for ${bribe} credits.`;
  } else {
    return `Bribe amount is ${bribe} credits, but you only have ${state.credits} credits.`;
  }
}