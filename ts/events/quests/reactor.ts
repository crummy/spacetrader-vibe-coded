// Reactor Quest Implementation - Port from Palm OS Space Trader
// Based on original C code in SpecialEvent.c and Traveler.c

import type { State } from '../../types.ts';
import { getTotalCargoBays, getFilledCargoBays } from '../../economy/trading.ts';
import { getShipType } from '../../data/shipTypes.ts';

/**
 * Reactor Quest Mechanics:
 * - Player picks up unstable reactor at Nix (requires 15 empty cargo bays)
 * - ReactorStatus starts at 1 and increments each day of travel
 * - Cargo bays are reduced: available = 10 - (ReactorStatus/2)
 * - Warnings at ReactorStatus 2, 16, 18
 * - Meltdown at ReactorStatus 20 (ship destroyed unless escape pod)
 * - Must deliver to Utopia before day 20
 */

export interface ReactorQuestState {
  reactorStatus: number; // 0=not started, 1-20=days carrying reactor, 21=delivered
  reactorWarningsShown: {
    day2: boolean;  // ReactorConsumeAlert
    day16: boolean; // ReactorNoiseAlert  
    day18: boolean; // ReactorSmokeAlert
  };
}

/**
 * Start the reactor quest - pick up unstable reactor at Nix
 * Requires 15 empty cargo bays and Wild cannot be aboard
 */
export function startReactorQuest(state: State): State {
  const filledBays = getFilledCargoBays(state);
  const totalBays = getTotalCargoBays(state);
  
  // Check if player has enough empty cargo bays
  if (filledBays > totalBays - 15) {
    throw new Error('Not enough cargo bays - need 15 empty bays for reactor');
  }
  
  // Check if Wild is aboard (he won't stay with dangerous reactor)
  if (state.wildStatus === 1) {
    throw new Error('Jonathan Wild refuses to stay aboard with unstable reactor');
  }
  
  return {
    ...state,
    reactorStatus: 1,
    credits: state.credits - 1000, // Cost from Palm OS
  };
}

/**
 * Advance reactor quest by one day - called during travel
 * Handles cargo bay reduction and warnings
 */
export function advanceReactorQuest(state: State): State {
  if (state.reactorStatus === 0 || state.reactorStatus >= 21) {
    return state; // No reactor or already delivered
  }
  
  const newReactorStatus = state.reactorStatus + 1;
  
  // Check for meltdown at day 20
  if (newReactorStatus >= 20) {
  // Reactor meltdown - ship destroyed
  if (!state.escapePod) {
      // Player dies - game over
      return {
      ...state,
      gameStatus: 'ended',
      reactorStatus: 0, // Reset reactor status
      };
      } else {
      // Escape pod saves player
      return escapeWithPod({
          ...state,
        reactorStatus: 0, // Reset reactor status
      });
      }
      }
      
      return {
      ...state,
      reactorStatus: newReactorStatus,
      };
}

/**
 * Get current cargo bay capacity (already accounts for reactor consumption in getTotalCargoBays)
 */
export function getAvailableCargoBays(state: State): number {
  return getTotalCargoBays(state) - getFilledCargoBays(state);
}

/**
 * Check if reactor warnings should be shown
 */
export function checkReactorWarnings(state: State): string[] {
  const warnings: string[] = [];
  const status = state.reactorStatus;
  
  if (status === 2) {
    warnings.push('REACTOR FUEL CONSUMPTION WARNING: The reactor is consuming fuel rapidly!');
  } else if (status === 16) {
    warnings.push('REACTOR NOISE WARNING: The reactor is making dangerous noises!');
  } else if (status === 18) {
    warnings.push('REACTOR SMOKE WARNING: The reactor is smoking - deliver immediately!');
  }
  
  return warnings;
}

/**
 * Complete reactor delivery at Utopia
 */
export function completeReactorDelivery(state: State): State {
  if (state.reactorStatus === 0 || state.reactorStatus >= 21) {
    throw new Error('No reactor to deliver');
  }
  
  return {
    ...state,
    reactorStatus: 21, // Mark as delivered
    credits: state.credits + 20000, // Reward from Palm OS
  };
}

/**
 * Escape with pod helper function (simplified)
 */
function escapeWithPod(state: State): State {
  return {
    ...state,
    ship: {
      ...state.ship,
      hull: 1, // Minimal hull
      // Reset ship to basic state
    },
    credits: Math.max(0, state.credits - 1000), // Escape pod cost
  };
}

/**
 * Check if reactor quest is available at current system
 */
export function isReactorQuestAvailable(state: State): boolean {
  // Available at Nix system when not already started/completed
  return state.currentSystem.name === 'Nix' &&
         state.reactorStatus === 0;
}

/**
 * Check if reactor delivery is available at current system  
 */
export function isReactorDeliveryAvailable(state: State): boolean {
  // Available at Utopia when reactor is being carried
  return state.currentSystem.name === 'Utopia' &&
         state.reactorStatus > 0 &&
         state.reactorStatus < 21;
}
