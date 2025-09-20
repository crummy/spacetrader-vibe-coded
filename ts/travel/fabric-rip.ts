// Fabric Rip System - Port from Palm OS Space Trader
// Based on original C code in Traveler.c and SpecialEvent.c

import type { State } from '../types.ts';
import { random, randomFloor } from '../math/random.ts';

/**
 * Fabric Rip System Mechanics:
 * - Dr. Fehler's experiment creates space-time distortions
 * - Initial probability: 25% (FABRICRIPINITIALPROBABILITY)
 * - Probability decreases by 1% per day during experiment
 * - When fabric rip occurs during warp, player is randomly transported
 * - Experiment can be stopped to end fabric rip effects
 */

export const FABRICRIP_INITIAL_PROBABILITY = 25; // 25% initial chance
export const FABRICRIP_DAILY_DECREASE = 1; // Decreases by 1% per day

/**
 * Check if Dr. Fehler's experiment is active
 */
export function isExperimentActive(state: State): boolean {
  return state.experimentAndWildStatus === 1; // Experiment running
}

/**
 * Start Dr. Fehler's space-time experiment
 * Sets experiment status and initializes fabric rip probability
 */
export function startExperiment(state: State): { success: boolean; message: string; state: State } {
  if (isExperimentActive(state)) {
    return {
      success: false,
      message: 'Dr. Fehler\'s experiment is already in progress.',
      state
    };
  }
  
  const newState = {
    ...state,
    experimentAndWildStatus: 1, // Start experiment
    fabricRipProbability: FABRICRIP_INITIAL_PROBABILITY
  };
  
  return {
    success: true,
    message: 'Dr. Fehler begins his dangerous space-time experiment. Reality becomes unstable.',
    state: newState
  };
}

/**
 * Stop Dr. Fehler's experiment
 * Ends fabric rip effects and resets probability
 */
export function stopExperiment(state: State): { success: boolean; message: string; state: State } {
  if (!isExperimentActive(state)) {
    return {
      success: false,
      message: 'No experiment is currently running.',
      state
    };
  }
  
  const newState = {
    ...state,
    experimentAndWildStatus: 0, // Stop experiment
    fabricRipProbability: 0 // Reset probability
  };
  
  return {
    success: true,
    message: 'Dr. Fehler concludes his experiment. Space-time returns to normal.',
    state: newState
  };
}

/**
 * Update fabric rip probability (decreases daily during experiment)
 */
export function updateFabricRipProbability(state: State): State {
  if (!isExperimentActive(state)) {
    return state; // No update if experiment not running
  }
  
  const newProbability = Math.max(0, state.fabricRipProbability - FABRICRIP_DAILY_DECREASE);
  
  return {
    ...state,
    fabricRipProbability: newProbability
  };
}

/**
 * Check if fabric rip occurs during travel
 * Returns true if fabric rip happens (random transport)
 */
export function checkFabricRipOccurrence(state: State): boolean {
  if (!isExperimentActive(state) || state.fabricRipProbability <= 0) {
    return false;
  }
  
  // Roll against current fabric rip probability
  const roll = random() * 100;
  return roll < state.fabricRipProbability;
}

/**
 * Execute fabric rip travel - randomly transport to another system
 * Returns the destination system index
 */
export function executeFabricRipTravel(state: State, numSystems: number): { 
  destinationSystem: number; 
  message: string; 
  state: State 
} {
  if (!isExperimentActive(state)) {
    return {
      destinationSystem: state.currentSystem,
      message: 'No fabric rip - experiment not active.',
      state
    };
  }
  
  // Select random system (different from current)
  let randomSystem;
  do {
    randomSystem = randomFloor(numSystems);
  } while (randomSystem === state.currentSystem);
  
  // Update state with new location
  const newState = {
    ...state,
    currentSystem: randomSystem,
    // Mark system as visited
    solarSystem: state.solarSystem.map((system, index) => 
      index === randomSystem ? { ...system, visited: true } : system
    )
  };
  
  return {
    destinationSystem: randomSystem,
    message: 'Space-time fabric rips! You are transported through a dimensional rift to an unexpected location!',
    state: newState
  };
}

/**
 * Get current fabric rip status for display
 */
export function getFabricRipStatus(state: State): {
  experimentActive: boolean;
  probability: number;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  daysRemaining?: number;
} {
  const experimentActive = isExperimentActive(state);
  const probability = state.fabricRipProbability;
  
  let riskLevel: 'none' | 'low' | 'medium' | 'high' = 'none';
  if (experimentActive && probability > 0) {
    if (probability >= 20) riskLevel = 'high';
    else if (probability >= 10) riskLevel = 'medium';
    else riskLevel = 'low';
  }
  
  // Estimate days until probability reaches 0
  const daysRemaining = experimentActive && probability > 0 ? 
    Math.ceil(probability / FABRICRIP_DAILY_DECREASE) : undefined;
  
  return {
    experimentActive,
    probability,
    riskLevel,
    daysRemaining
  };
}

/**
 * Check if fabric rip travel is possible
 */
export function canTravelThroughRip(state: State): boolean {
  return isExperimentActive(state) && state.fabricRipProbability > 0;
}

/**
 * Simulate what would happen if fabric rip occurs during travel
 * Used for travel planning and UI warnings
 */
export function simulateFabricRipDestination(state: State, numSystems: number): {
  wouldOccur: boolean;
  possibleDestinations: number[];
} {
  if (!canTravelThroughRip(state)) {
    return {
      wouldOccur: false,
      possibleDestinations: []
    };
  }
  
  // All systems except current are possible destinations
  const possibleDestinations = Array.from({ length: numSystems }, (_, i) => i)
    .filter(i => i !== state.currentSystem);
  
  return {
    wouldOccur: true,
    possibleDestinations
  };
}

/**
 * Get experiment warning messages based on current state
 */
export function getExperimentWarnings(state: State): string[] {
  const warnings: string[] = [];
  
  if (!isExperimentActive(state)) {
    return warnings;
  }
  
  const status = getFabricRipStatus(state);
  
  if (status.probability >= 20) {
    warnings.push('WARNING: Space-time fabric is highly unstable! Extreme risk of dimensional displacement!');
  } else if (status.probability >= 10) {
    warnings.push('CAUTION: Space-time distortions detected. Risk of unexpected travel.');
  } else if (status.probability > 0) {
    warnings.push('NOTICE: Minor space-time anomalies present. Low risk of fabric rip.');
  }
  
  if (status.daysRemaining !== undefined && status.daysRemaining <= 5) {
    warnings.push(`Experiment stability improving. Approximately ${status.daysRemaining} days until normal space-time.`);
  }
  
  return warnings;
}
