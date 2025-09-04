// Special Ship Encounters - Port from Palm OS Space Trader
// Based on original C code in SpecialEvent.c and Traveler.c

import type { State } from '../types.ts';
import { GameMode } from '../types.ts';
import { EncounterType } from './engine.ts';
import { EXTRABAYS } from '../economy/trading.ts';
// No need for specific random utilities - use Math.random() directly

/**
 * Special Ship Encounter Types from Palm OS
 */
export const SPACEMONSTERATTACK = 30;
export const DRAGONFLYATTACK = 40; 
export const SCARABATTACK = 60;
export const MARIECELESTEENCOUNTER = 80;

/**
 * Handle boarding the Marie Celeste derelict ship
 * Discovers a bottle with mysterious contents
 */
export function boardMarieCeleste(state: State): { success: boolean; message: string; state: State } {
  // Check if ship has available cargo bay for bottle
  const currentCargo = state.ship.cargo.reduce((sum, qty) => sum + qty, 0);
  const maxCargo = getShipCargoBays(state);
  
  if (currentCargo >= maxCargo) {
    return {
      success: false,
      message: 'Your cargo holds are full. You cannot take the bottle.',
      state
    };
  }
  
  // Add bottle to cargo (bottle is trade item index 9 in some implementations)
  // For now, we'll track this as a special flag
  const newState = {
    ...state,
    justLootedMarie: true,
    ship: {
      ...state.ship,
      // Add bottle to cargo - using trade item 9 (could vary by implementation)
      cargo: state.ship.cargo.map((qty, index) => index === 9 ? qty + 1 : qty) as [number, number, number, number, number, number, number, number, number, number]
    }
  };
  
  return {
    success: true,
    message: 'You board the Marie Celeste and find a strange bottle with mysterious contents.',
    state: newState
  };
}

/**
 * Handle drinking from the bottle found on Marie Celeste
 * Can have positive or negative effects on the player
 */
export function drinkBottle(state: State): { success: boolean; message: string; state: State } {
  // Check if player has a bottle
  if (!state.justLootedMarie || state.ship.cargo[9] === 0) {
    return {
      success: false,
      message: 'You do not have a bottle to drink from.',
      state
    };
  }
  
  // Random chance for good vs bad effects (50/50 in original)
  const goodEffect = Math.random() < 0.5;
  
  const newState = {
    ...state,
    justLootedMarie: false, // Bottle consumed
    ship: {
      ...state.ship,
      // Remove bottle from cargo
      cargo: state.ship.cargo.map((qty, index) => index === 9 ? Math.max(0, qty - 1) : qty) as [number, number, number, number, number, number, number, number, number, number]
    }
  };
  
  if (goodEffect) {
    // Good effect: Restore health/hull or grant skill bonus
    newState.ship.hull = Math.min(newState.ship.hull + 10, 100);
    return {
      success: true,
      message: 'The bottle contains a healing elixir! Your ship is partially repaired.',
      state: newState
    };
  } else {
    // Bad effect: Damage or temporary debuff
    newState.ship.hull = Math.max(1, newState.ship.hull - 10);
    return {
      success: true, 
      message: 'The bottle contains a foul liquid! Your ship takes damage.',
      state: newState
    };
  }
}

/**
 * Handle Space Monster encounter mechanics
 * Extremely dangerous enemy with special attack patterns
 */
export function handleSpaceMonsterEncounter(state: State): { message: string; state: State } {
  // Space Monster always attacks aggressively
  // No negotiation possible - fight or flee only
  const newState = {
    ...state,
    encounterType: SPACEMONSTERATTACK,
    currentMode: GameMode.InCombat
  };
  
  return {
    message: 'A massive space monster appears and attacks without warning!',
    state: newState
  };
}

/**
 * Handle Dragonfly encounter mechanics
 * Fast, lightly armed ship that attempts to board and rob
 */
export function handleDragonflyEncounter(state: State): { message: string; state: State } {
  // Dragonfly encounters are pirate-like but with unique characteristics
  const newState = {
    ...state,
    encounterType: DRAGONFLYATTACK,
    currentMode: GameMode.InCombat
  };
  
  return {
    message: 'A sleek Dragonfly ship intercepts you! They demand your cargo.',
    state: newState
  };
}

/**
 * Handle Scarab encounter mechanics
 * Heavily armed and armored, very dangerous but rewards hull upgrade when destroyed
 */
export function handleScarabEncounter(state: State): { message: string; state: State } {
  const newState = {
    ...state,
    encounterType: SCARABATTACK,
    currentMode: GameMode.InCombat
  };
  
  return {
    message: 'A deadly Scarab ship drops out of warp and begins attacking!',
    state: newState
  };
}

/**
 * Handle Scarab destruction rewards
 * Player gets permanent hull upgrade when they destroy a Scarab
 */
export function handleScarabDestroyed(state: State): { message: string; state: State } {
  if (state.scarabStatus === 1) { // Already got hull upgrade
    return {
      message: 'The Scarab is destroyed, but you already have the hull upgrade.',
      state
    };
  }
  
  const newState = {
    ...state,
    scarabStatus: 1, // Mark hull upgrade acquired
    ship: {
      ...state.ship,
      hull: Math.min(state.ship.hull + 10, 200), // Permanent +10 hull bonus
      hullUpgrades: (state.ship.hullUpgrades || 0) + 1
    }
  };
  
  return {
    message: 'The Scarab explodes! You salvage advanced hull plating that permanently improves your ship!',
    state: newState
  };
}

/**
 * Handle Marie Celeste encounter setup
 * Peaceful derelict ship that can be boarded
 */
export function handleMarieEncounter(state: State): { message: string; state: State } {
  const newState = {
    ...state,
    encounterType: MARIECELESTEENCOUNTER,
    currentMode: GameMode.InCombat // (though peaceful)
  };
  
  return {
    message: 'You discover the famous derelict ship Marie Celeste floating in space.',
    state: newState
  };
}

/**
 * Get ship cargo bay capacity including upgrades
 */
function getShipCargoBays(state: State): number {
  // This should match getTotalCargoBays from economy/trading.ts
  // but we'll implement a simpler version here to avoid circular imports
  let bays = 20; // Default cargo bays
  
  // Add extra bays from gadgets
  for (let i = 0; i < state.ship.gadget.length; i++) {
    if (state.ship.gadget[i] === EXTRABAYS) {
      bays += 5;
    }
  }
  
  return bays;
}

/**
 * Check if special ship encounter is very rare type
 */
export function isVeryRareEncounter(encounterType: number): boolean {
  return encounterType === MARIECELESTEENCOUNTER ||
         encounterType === EncounterType.CAPTAINAHABENCOUNTER ||
         encounterType === EncounterType.CAPTAINCONRADENCOUNTER ||
         encounterType === EncounterType.CAPTAINHUIEENCOUNTER;
}

/**
 * Get special ship encounter name
 */
export function getSpecialShipName(encounterType: number): string {
  switch (encounterType) {
    case SPACEMONSTERATTACK: return 'Space Monster';
    case DRAGONFLYATTACK: return 'Dragonfly';
    case SCARABATTACK: return 'Scarab';
    case MARIECELESTEENCOUNTER: return 'Marie Celeste';
    case EncounterType.CAPTAINAHABENCOUNTER: return 'Captain Ahab';
    case EncounterType.CAPTAINCONRADENCOUNTER: return 'Captain Conrad';
    case EncounterType.CAPTAINHUIEENCOUNTER: return 'Captain Huie';
    default: return 'Unknown Ship';
  }
}

/**
 * Check if player has already encountered this very rare ship
 */
export function hasEncounteredBefore(state: State, encounterType: number): boolean {
  const flags = state.veryRareEncounter;
  
  switch (encounterType) {
    case MARIECELESTEENCOUNTER:
      return (flags & (1 << 0)) !== 0; // ALREADYMARIE bit
    case EncounterType.CAPTAINAHABENCOUNTER:
      return (flags & (1 << 1)) !== 0; // ALREADYAHAB bit
    case EncounterType.CAPTAINCONRADENCOUNTER:
      return (flags & (1 << 2)) !== 0; // ALREADYCONRAD bit
    case EncounterType.CAPTAINHUIEENCOUNTER:
      return (flags & (1 << 3)) !== 0; // ALREADYHUIE bit
    default:
      return false;
  }
}

/**
 * Mark very rare encounter as completed
 */
export function markEncounterCompleted(state: State, encounterType: number): State {
  let flags = state.veryRareEncounter;
  
  switch (encounterType) {
    case MARIECELESTEENCOUNTER:
      flags |= (1 << 0); // Set ALREADYMARIE bit
      break;
    case EncounterType.CAPTAINAHABENCOUNTER:
      flags |= (1 << 1); // Set ALREADYAHAB bit
      break;
    case EncounterType.CAPTAINCONRADENCOUNTER:
      flags |= (1 << 2); // Set ALREADYCONRAD bit
      break;
    case EncounterType.CAPTAINHUIEENCOUNTER:
      flags |= (1 << 3); // Set ALREADYHUIE bit
      break;
  }
  
  return {
    ...state,
    veryRareEncounter: flags
  };
}
