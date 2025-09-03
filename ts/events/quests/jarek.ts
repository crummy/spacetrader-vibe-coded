// Ambassador Jarek Quest Implementation - Port from Palm OS Space Trader
// Based on original C code in SpecialEvent.c, Traveler.c, and Global.c

import type { State } from '../../types.ts';
import { getShipTypes } from '../../data/shipTypes.ts';

// System indices from Palm OS
const DEVIDIA_SYSTEM_ID = 22; // Devidia system where Jarek gets out

interface QuestResult {
  success: boolean;
  state: State;
  message?: string;
}

/**
 * Ambassador Jarek Quest Mechanics:
 * - Player encounters Ambassador Jarek at a system with AMBASSADORJAREK special event
 * - Jarek needs transport to Devidia system due to political crisis  
 * - JarekStatus tracks: 0=not started, 1=on board, 2=delivered
 * - Jarek takes up one crew quarter while aboard
 * - Delivery at Devidia system provides reward and completion
 * - If ship destroyed/surrendered while Jarek aboard, he's taken home by pirates
 */

/**
 * Pick up Ambassador Jarek - starts the quest
 */
export function pickupJarek(state: State): QuestResult {
  if (state.jarekStatus !== 0) {
    return {
      success: false,
      state,
      message: 'Ambassador Jarek is not available for pickup.'
    };
  }
  
  // Check if ship has crew quarters available
  const availableQuarters = getAvailableCrewQuarters(state);
  if (availableQuarters <= 0) {
    return {
      success: false,
      state,
      message: 'No crew quarters available for Ambassador Jarek.'
    };
  }
  
  return {
    success: true,
    state: {
      ...state,
      jarekStatus: 1,
    },
    message: 'Ambassador Jarek boards your ship. He needs transport to Devidia due to political crisis.'
  };
}

/**
 * Complete Jarek delivery at Devidia
 */
export function completeJarekDelivery(state: State): QuestResult {
  if (state.jarekStatus !== 1) {
    return {
      success: false,
      state,
      message: 'Ambassador Jarek is not aboard your ship.'
    };
  }
  
  if (state.currentSystemId !== DEVIDIA_SYSTEM_ID) {
    return {
      success: false,
      state,
      message: 'Jarek can only be delivered at Devidia system.'
    };
  }
  
  return {
    success: true,
    state: {
      ...state,
      jarekStatus: 2,
      credits: state.credits + 5000, // Reward amount from Palm OS
    },
    message: 'Ambassador Jarek safely delivered to Devidia. You receive 5,000 credits as a reward!'
  };
}

/**
 * Handle Jarek being taken by pirates when ship destroyed/surrendered
 */
export function jarekTakenByPirates(state: State): QuestResult {
  if (state.jarekStatus !== 1) {
    return {
      success: false,
      state,
      message: 'Jarek is not aboard ship.'
    };
  }
  
  return {
    success: true,
    state: {
      ...state,
      jarekStatus: 0, // Reset quest
    },
    message: 'The pirates take Ambassador Jarek home to Devidia.'
  };
}

/**
 * Check if Jarek pickup is available at current system
 */
export function isJarekPickupAvailable(state: State): boolean {
  return state.jarekStatus === 0 && getAvailableCrewQuarters(state) > 0;
}

/**
 * Check if Jarek delivery is available at current system
 */
export function isJarekDeliveryAvailable(state: State): boolean {
  return state.currentSystemId === DEVIDIA_SYSTEM_ID && state.jarekStatus === 1;
}

/**
 * Get available crew quarters accounting for passengers
 */
export function getAvailableCrewQuarters(state: State): number {
  const maxQuarters = getMaxCrewQuarters(state);
  
  // Count used quarters - crew members have index >= 0, empty slots are -1
  let usedQuarters = state.ship.crew.filter(crewIndex => crewIndex >= 0).length;
  
  if (state.jarekStatus === 1) usedQuarters++;
  if (state.wildStatus === 1) usedQuarters++; // Wild also takes quarters
  
  return maxQuarters - usedQuarters;
}

/**
 * Get maximum crew quarters from ship type
 */
function getMaxCrewQuarters(state: State): number {
  // Import ship type data
  return getShipTypeByIndex(state.ship.type).crewQuarters;
}

// Get ship type by index
function getShipTypeByIndex(index: number) {
  const shipTypes = getShipTypes();
  return shipTypes[index] || shipTypes[0]; // Default to first ship if invalid
}

/**
 * Get Jarek quest status information
 */
export function getJarekStatus(state: State): {
  phase: 'not_started' | 'pickup_available' | 'on_board' | 'delivery_available' | 'completed';
  description: string;
} {
  switch (state.jarekStatus) {
    case 0:
      if (isJarekPickupAvailable(state)) {
        return {
          phase: 'pickup_available',
          description: 'Ambassador Jarek needs transport to Devidia due to political crisis.'
        };
      }
      return {
        phase: 'not_started',
        description: 'Quest not available or no crew quarters available.'
      };
      
    case 1:
      if (isJarekDeliveryAvailable(state)) {
        return {
          phase: 'delivery_available', 
          description: 'Deliver Ambassador Jarek to Devidia to complete the quest.'
        };
      }
      return {
        phase: 'on_board',
        description: 'Ambassador Jarek is aboard. Transport him to Devidia system.'
      };
      
    case 2:
      return {
        phase: 'completed',
        description: 'Ambassador Jarek successfully delivered to Devidia.'
      };
      
    default:
      return {
        phase: 'not_started',
        description: 'Quest not started.'
      };
  }
}
