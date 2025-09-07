// Tribble System Enhancement - Port from Palm OS Space Trader
// Based on original C code in Traveler.c, Encounter.c, and SpecialEvent.c

import type { State } from '../types.ts';
import { TradeItem } from '../types.ts';

/**
 * Tribble System Constants (from spacetrader.h)
 */
export const MAX_TRIBBLES = 100000;
export const TRIBBLES_ON_SCREEN = 31; // Visual display limit
export const MIN_BREEDING_POPULATION = 10;
export const IRRADIATION_SURVIVAL_THRESHOLD = 10;

/**
 * Tribble breeding mechanics
 */
export const BREEDING_BASE_CHANCE = 0.5; // 50% base chance per day
export const BREEDING_POPULATION_FACTOR = 0.1; // Higher populations breed more
export const BREEDING_GROWTH_RATE = 1.5; // Population multiplier when breeding

/**
 * IGP (Intergalactic Peace) inspection mechanics
 */
export interface IGPInspectionResult {
  success: boolean;
  message: string;
  fine: number;
  tribblesConfiscated: number;
  state: State;
}

/**
 * Update tribble population through breeding
 * Called daily during time advancement
 */
export function breedTribbles(state: State): { message?: string; state: State } {
  if (state.ship.tribbles <= 0 || state.ship.tribbles >= MAX_TRIBBLES) {
    return { state };
  }

  // Calculate breeding chance based on population size
  const populationFactor = Math.min(BREEDING_POPULATION_FACTOR, state.ship.tribbles / 1000);
  const breedingChance = Math.min(0.9, BREEDING_BASE_CHANCE + populationFactor);
  
  if (Math.random() < breedingChance) {
    const newTribbles = Math.floor(state.ship.tribbles * BREEDING_GROWTH_RATE);
    const finalTribbles = Math.min(newTribbles, MAX_TRIBBLES);
    
    const newState = {
      ...state,
      ship: {
        ...state.ship,
        tribbles: finalTribbles
      }
    };

    // Generate message for significant population growth
    if (finalTribbles >= MAX_TRIBBLES && state.ship.tribbles < MAX_TRIBBLES) {
      return {
        message: 'An infestation of tribbles! Your cargo bays are overrun with cute, furry creatures.',
        state: newState
      };
    } else if (finalTribbles > state.ship.tribbles * 2) {
      return {
        message: `Your tribbles are breeding rapidly! Population: ${finalTribbles}`,
        state: newState
      };
    }

    return { state: newState };
  }

  return { state };
}

/**
 * Handle tribble interactions with radiation (reactor quest)
 * Radiation kills most tribbles
 */
export function irradiateTribbles(state: State): { message?: string; state: State } {
  if (state.ship.tribbles <= 0) {
    return { state };
  }

  // Radiation kills half the tribbles
  const survivingTribbles = Math.floor(state.ship.tribbles / 2);
  
  let message: string | undefined;
  let finalTribbles = survivingTribbles;

  if (survivingTribbles < IRRADIATION_SURVIVAL_THRESHOLD) {
    finalTribbles = 0;
    message = 'The radiation from the unstable reactor has irradiated all your tribbles!';
  } else {
    message = 'The radiation from the unstable reactor has killed half of your tribbles!';
  }

  return {
    message,
    state: {
      ...state,
      ship: {
        ...state.ship,
        tribbles: finalTribbles
      }
    }
  };
}

/**
 * Handle tribbles eating narcotics cargo
 * Tribbles reduce narcotics but get sick and die
 */
export function tribblesEatNarcotics(state: State): { message?: string; state: State } {
  if (state.ship.tribbles <= 0 || state.ship.cargo[TradeItem.Narcotics] <= 0) {
    return { state };
  }

  // Tribbles eat narcotics and get sick
  const narcoticsEaten = Math.min(state.ship.cargo[TradeItem.Narcotics], 5);
  const tribblesAfterSickness = 1 + Math.floor(Math.random() * 3); // 1-3 tribbles survive
  
  const newState = {
    ...state,
    ship: {
      ...state.ship,
      tribbles: tribblesAfterSickness,
      cargo: state.ship.cargo.map((qty, index) => 
        index === TradeItem.Narcotics ? qty - narcoticsEaten : qty
      ) as typeof state.ship.cargo
    }
  };

  return {
    message: 'Your tribbles ate your narcotics and got sick! Most of them died from the toxic cargo.',
    state: newState
  };
}

/**
 * Calculate cargo bay impact of tribbles
 * Large tribble populations consume cargo space
 */
export function calculateTribbleCargoBayImpact(tribbleCount: number): number {
  if (tribbleCount <= 0) return 0;
  if (tribbleCount >= MAX_TRIBBLES) return 10; // Maximum impact
  
  // Progressive cargo bay consumption: 1 bay per 10,000 tribbles
  return Math.floor(tribbleCount / 10000);
}

/**
 * Handle ship sale with tribbles aboard
 * Tribbles reduce ship value significantly
 */
export function calculateTribbleShipValuePenalty(shipPrice: number, tribbleCount: number, forInsurance: boolean): number {
  if (tribbleCount <= 0) return shipPrice;
  
  // From ShipPrice.c: tribbles reduce ship value to 1/4 unless for insurance
  if (forInsurance) {
    return shipPrice; // Insurance covers full value
  } else {
    return Math.floor(shipPrice / 4); // Tribbles make ship nearly worthless
  }
}

/**
 * Handle IGP (Intergalactic Peace) inspection for tribbles
 * IGP inspects for illegal tribble transport
 */
export function handleIGPInspection(state: State): IGPInspectionResult {
  if (state.ship.tribbles <= 0) {
    return {
      success: true,
      message: 'IGP inspection complete. No contraband detected.',
      fine: 0,
      tribblesConfiscated: 0,
      state
    };
  }

  // IGP confiscates all tribbles and imposes fine
  const fine = Math.min(50000, state.ship.tribbles * 5); // 5 credits per tribble, max 50k
  const tribblesConfiscated = state.ship.tribbles;
  
  const newState = {
    ...state,
    credits: Math.max(0, state.credits - fine),
    ship: {
      ...state.ship,
      tribbles: 0
    }
  };

  return {
    success: false,
    message: `IGP inspection! ${tribblesConfiscated} tribbles confiscated and ${fine} credit fine imposed. Tribbles are restricted in this sector.`,
    fine,
    tribblesConfiscated,
    state: newState
  };
}

/**
 * Handle tribble encounters during combat
 * Tribbles can survive ship destruction in rare cases
 */
export function handleTribbleSurvival(state: State, shipDestroyed: boolean): { message?: string; state: State } {
  if (!shipDestroyed || state.ship.tribbles <= 0) {
    return { state };
  }

  // Small chance (10%) that some tribbles survive in escape pods
  if (Math.random() < 0.1) {
    const survivors = Math.min(10, Math.floor(state.ship.tribbles * 0.01)); // 1% survive, max 10
    
    return {
      message: `Amazingly, ${survivors} tribbles managed to survive in the escape pod!`,
      state: {
        ...state,
        ship: {
          ...state.ship,
          tribbles: survivors
        }
      }
    };
  }

  // All tribbles die with ship
  return {
    message: 'Your tribbles did not survive the ship\'s destruction.',
    state: {
      ...state,
      ship: {
        ...state.ship,
        tribbles: 0
      }
    }
  };
}

/**
 * Handle selling tribbles to buyer
 * Tribble buyer pays half a credit per tribble
 */
export function sellTribblesToBuyer(state: State): { success: boolean; message: string; creditsEarned: number; state: State } {
  if (state.ship.tribbles <= 0) {
    return {
      success: false,
      message: 'You have no tribbles to sell.',
      creditsEarned: 0,
      state
    };
  }

  // Buyer pays 0.5 credits per tribble (rounded down)
  const creditsEarned = Math.floor(state.ship.tribbles / 2);
  
  const newState = {
    ...state,
    credits: state.credits + creditsEarned,
    ship: {
      ...state.ship,
      tribbles: 0
    }
  };

  return {
    success: true,
    message: `Sold ${state.ship.tribbles} tribbles for ${creditsEarned} credits. The buyer beams them off your ship.`,
    creditsEarned,
    state: newState
  };
}

/**
 * Get tribble population description for UI
 */
export function getTribbleDescription(tribbleCount: number): string {
  if (tribbleCount <= 0) return 'No tribbles aboard';
  if (tribbleCount === 1) return '1 cute, furry tribble';
  if (tribbleCount < 100) return `${tribbleCount} cute, furry tribbles`;
  if (tribbleCount < 1000) return `${tribbleCount} tribbles (growing population)`;
  if (tribbleCount < 10000) return `${tribbleCount} tribbles (large population)`;
  if (tribbleCount >= MAX_TRIBBLES) return 'An infestation of tribbles';
  return `${tribbleCount} tribbles (very large population)`;
}

/**
 * Check if tribbles are affecting ship operations
 * Large populations can interfere with ship systems
 */
export function getTribblesOperationalImpact(tribbleCount: number): {
  cargoReduction: number;
  message?: string;
  warningLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
} {
  if (tribbleCount <= 0) {
    return { cargoReduction: 0, warningLevel: 'none' };
  }

  const cargoReduction = calculateTribbleCargoBayImpact(tribbleCount);
  
  if (tribbleCount >= MAX_TRIBBLES) {
    return {
      cargoReduction,
      message: 'Your ship is overrun with tribbles! They are interfering with ship operations.',
      warningLevel: 'critical'
    };
  } else if (tribbleCount >= 50000) {
    return {
      cargoReduction,
      message: 'The large tribble population is starting to impact your cargo capacity.',
      warningLevel: 'high'
    };
  } else if (tribbleCount >= 10000) {
    return {
      cargoReduction,
      message: 'Your tribbles are multiplying rapidly.',
      warningLevel: 'medium'
    };
  } else if (tribbleCount >= 1000) {
    return {
      cargoReduction,
      message: 'Your tribbles are breeding steadily.',
      warningLevel: 'low'
    };
  }

  return { cargoReduction, warningLevel: 'none' };
}

/**
 * Check if player should be warned about tribbles when buying a ship
 */
export function shouldShowTribbleShipyardWarning(state: State): boolean {
  return state.ship.tribbles > 0 && !state.options.tribbleMessage;
}

/**
 * Mark tribble shipyard warning as shown
 */
export function markTribbleWarningShown(state: State): State {
  return {
    ...state,
    options: {
      ...state.options,
      tribbleMessage: true
    }
  };
}

/**
 * Get random tribble encounter message
 */
export function getRandomTribbleEncounterMessage(tribbleCount: number): string {
  const messages = [
    'A tribble scurries across your console, making happy chirping sounds.',
    'You hear the soft cooing of tribbles echoing through your ship.',
    'Several tribbles have somehow gotten into your food supplies.',
    'A tribble falls out of a storage compartment and rolls across the floor.',
    'You notice tribbles have nested in your spare parts storage.'
  ];

  if (tribbleCount >= MAX_TRIBBLES) {
    return 'Tribbles are everywhere! You can barely move without stepping on one.';
  } else if (tribbleCount >= 10000) {
    return 'The constant cooing of thousands of tribbles fills the air.';
  }

  return messages[Math.floor(Math.random() * messages.length)];
}
