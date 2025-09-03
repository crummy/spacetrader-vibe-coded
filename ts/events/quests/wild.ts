// Jonathan Wild Quest Implementation - Port from Palm OS Space Trader
// Based on original C code in SpecialEvent.c, Traveler.c, and Global.c

import type { State } from '../../types.ts';
import { getShipTypes } from '../../data/shipTypes.ts';

// System indices from Palm OS
const KRAVAT_SYSTEM_ID = 50; // Kravat system where Wild gets out

// Weapon constants
const BEAM_LASER_WEAPON = 2; // Beam laser weapon index

interface QuestResult {
  success: boolean;
  state: State;
  message?: string;
}

/**
 * Jonathan Wild Quest Mechanics:
 * - Player encounters Wild at a system with TRANSPORTWILD special event
 * - Wild is a notorious criminal who needs transport to Kravat
 * - WildStatus tracks: 0=not started, 1=on board, 2=delivered
 * - Wild takes up one crew quarter while aboard
 * - Ship must have beam laser or better weapon for Wild to board
 * - Police will arrest Wild if ship surrenders/destroyed (reputation penalty)
 * - Police record must be Dubious or better for Wild to consider transport
 * - Wild won't board ship with unstable reactor
 */

/**
 * Pick up Jonathan Wild - starts the quest
 */
export function pickupWild(state: State): QuestResult {
  if (state.wildStatus !== 0) {
    return {
      success: false,
      state,
      message: 'Jonathan Wild is not available for pickup.'
    };
  }
  
  // Check if ship has crew quarters available
  const availableQuarters = getAvailableCrewQuarters(state);
  if (availableQuarters <= 0) {
    return {
      success: false,
      state,
      message: 'No crew quarters available for Jonathan Wild.'
    };
  }
  
  // Check if player's record is good enough (must be Dubious or better)
  if (state.policeRecordScore < -3) { // VILLAINSCORE threshold
    return {
      success: false,
      state,
      message: 'Jonathan Wild refuses to trust you with his safety.'
    };
  }
  
  // Check for beam laser or better weapon
  if (!hasRequiredWeapon(state)) {
    return {
      success: false,
      state,
      message: 'Jonathan Wild demands that you install a beam laser before he boards your ship.'
    };
  }
  
  // Check if reactor is aboard (Wild is afraid of reactor)
  if (state.reactorStatus > 0 && state.reactorStatus < 21) {
    return {
      success: false,
      state,
      message: 'Jonathan Wild is afraid of the unstable reactor and refuses to board.'
    };
  }
  
  return {
    success: true,
    state: {
      ...state,
      wildStatus: 1,
    },
    message: 'Jonathan Wild boards your ship. He needs transport to Kravat system.'
  };
}

/**
 * Complete Wild delivery at Kravat
 */
export function completeWildDelivery(state: State): QuestResult {
  if (state.wildStatus !== 1) {
    return {
      success: false,
      state,
      message: 'Jonathan Wild is not aboard your ship.'
    };
  }
  
  if (state.currentSystemId !== KRAVAT_SYSTEM_ID) {
    return {
      success: false,
      state,
      message: 'Wild can only be delivered at Kravat system.'
    };
  }
  
  return {
    success: true,
    state: {
      ...state,
      wildStatus: 2,
      credits: state.credits + 10000, // Reward amount from Palm OS
    },
    message: 'Jonathan Wild safely delivered to Kravat. He rewards you with 10,000 credits!'
  };
}

/**
 * Handle Wild being arrested when ship surrenders/destroyed
 */
export function wildArrested(state: State): QuestResult {
  if (state.wildStatus !== 1) {
    return {
      success: false,
      state,
      message: 'Wild is not aboard ship.'
    };
  }
  
  return {
    success: true,
    state: {
      ...state,
      wildStatus: 0, // Reset quest
      policeRecordScore: state.policeRecordScore - 4, // CAUGHTWITHWILDSCORE penalty
    },
    message: 'The police arrest Jonathan Wild. Your reputation suffers for harboring a criminal!'
  };
}

/**
 * Handle Wild leaving ship due to lack of weapons
 */
export function wildLeavesShip(state: State): QuestResult {
  if (state.wildStatus !== 1) {
    return {
      success: false,
      state,
      message: 'Wild is not aboard ship.'
    };
  }
  
  return {
    success: true,
    state: {
      ...state,
      wildStatus: 0, // Reset quest
    },
    message: 'Jonathan Wild leaves your ship because it lacks proper weapons.'
  };
}

/**
 * Check if Wild pickup is available
 */
export function isWildPickupAvailable(state: State): boolean {
  return state.wildStatus === 0 && 
         getAvailableCrewQuarters(state) > 0 &&
         state.policeRecordScore >= -3 && // Dubious or better
         hasRequiredWeapon(state) &&
         !(state.reactorStatus > 0 && state.reactorStatus < 21);
}

/**
 * Check if Wild delivery is available at current system
 */
export function isWildDeliveryAvailable(state: State): boolean {
  return state.currentSystemId === KRAVAT_SYSTEM_ID && state.wildStatus === 1;
}

/**
 * Check if ship has beam laser or better weapon
 */
export function hasRequiredWeapon(state: State): boolean {
  // Check if ship has beam laser (weapon index 2) or better
  for (const weaponIndex of state.ship.weapon) {
    if (weaponIndex >= BEAM_LASER_WEAPON) {
      return true;
    }
  }
  return false;
}

/**
 * Get available crew quarters accounting for passengers
 */
export function getAvailableCrewQuarters(state: State): number {
  const maxQuarters = getMaxCrewQuarters(state);
  
  // Count used quarters - crew members have index >= 0, empty slots are -1
  let usedQuarters = state.ship.crew.filter(crewIndex => crewIndex >= 0).length;
  
  if (state.jarekStatus === 1) usedQuarters++;
  if (state.wildStatus === 1) usedQuarters++;
  
  return maxQuarters - usedQuarters;
}

/**
 * Get maximum crew quarters from ship type
 */
function getMaxCrewQuarters(state: State): number {
  return getShipTypeByIndex(state.ship.type).crewQuarters;
}

// Get ship type by index
function getShipTypeByIndex(index: number) {
  const shipTypes = getShipTypes();
  return shipTypes[index] || shipTypes[0]; // Default to first ship if invalid
}

/**
 * Get Wild quest status information
 */
export function getWildStatus(state: State): {
  phase: 'not_started' | 'pickup_available' | 'on_board' | 'delivery_available' | 'completed';
  description: string;
} {
  switch (state.wildStatus) {
    case 0:
      if (isWildPickupAvailable(state)) {
        return {
          phase: 'pickup_available',
          description: 'Notorious criminal Jonathan Wild needs transport to Kravat.'
        };
      }
      return {
        phase: 'not_started',
        description: 'Quest not available. Wild requires good reputation, crew quarters, and armed ship.'
      };
      
    case 1:
      if (isWildDeliveryAvailable(state)) {
        return {
          phase: 'delivery_available',
          description: 'Deliver Jonathan Wild to Kravat to complete the quest.'
        };
      }
      return {
        phase: 'on_board',
        description: 'Jonathan Wild is aboard. Transport him to Kravat system.'
      };
      
    case 2:
      return {
        phase: 'completed',
        description: 'Jonathan Wild successfully delivered to Kravat.'
      };
      
    default:
      return {
        phase: 'not_started',
        description: 'Quest not started.'
      };
  }
}
