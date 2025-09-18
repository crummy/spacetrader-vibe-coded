// System Status Shuffling Implementation
// Port of ShuffleStatus from Palm OS Traveler.c lines 715-729
// Updates system special events (droughts, wars, etc.) with 15% probability

import type { GameState } from '../types.ts';
import { SystemStatus, MAXSOLARSYSTEM } from '../types.ts';
import { getRandom } from '../math/random.ts';

/**
 * ShuffleStatus - Randomly updates system special events
 * 
 * Called every time the player arrives at a system.
 * For each system in the galaxy:
 * - If it has a special status: 15% chance to clear it to Uneventful
 * - If it has no special status: 15% chance to assign a random new status
 * 
 * Based on Palm OS Traveler.c ShuffleStatus() function
 */
export function shuffleStatus(state: GameState): { 
  statusChanges: Array<{systemIndex: number, oldStatus: SystemStatus, newStatus: SystemStatus}>
} {
  const statusChanges: Array<{systemIndex: number, oldStatus: SystemStatus, newStatus: SystemStatus}> = [];
  
  for (let i = 0; i < Math.min(MAXSOLARSYSTEM, state.solarSystem.length); i++) {
    const system = state.solarSystem[i];
    const oldStatus = system.status;
    
    // If system has a special status (not Uneventful)
    if (system.status > SystemStatus.Uneventful) {
      // 15% chance to clear the status (Palm OS: GetRandom(100) < 15)
      if (getRandom(100) < 15) {
        system.status = SystemStatus.Uneventful;
        statusChanges.push({
          systemIndex: i,
          oldStatus,
          newStatus: SystemStatus.Uneventful
        });
      }
    } 
    // If system has no special status (Uneventful)
    else if (system.status === SystemStatus.Uneventful) {
      // 15% chance to assign a random new status (Palm OS: GetRandom(100) < 15)
      if (getRandom(100) < 15) {
        // Generate random status from 1 to 7 (War=1, Plague=2, Drought=3, Boredom=4, Cold=5, CropFailure=6, LackOfWorkers=7)
        // This matches Palm OS: SolarSystem[i].Status = 1 + GetRandom( MAXSTATUS - 1 );
        const MAXSTATUS = 8; // From Palm OS spacetrader.h
        const newStatus = (1 + getRandom(MAXSTATUS - 1)) as SystemStatus;
        system.status = newStatus;
        statusChanges.push({
          systemIndex: i,
          oldStatus,
          newStatus
        });
      }
    }
  }
  
  return { statusChanges };
}

/**
 * Get human-readable description of status changes for logging/debugging
 */
export function describeStatusChanges(statusChanges: Array<{systemIndex: number, oldStatus: SystemStatus, newStatus: SystemStatus}>): string[] {
  const statusNames = {
    [SystemStatus.Uneventful]: 'Uneventful',
    [SystemStatus.War]: 'War',
    [SystemStatus.Plague]: 'Plague', 
    [SystemStatus.Drought]: 'Drought',
    [SystemStatus.Boredom]: 'Boredom',
    [SystemStatus.Cold]: 'Cold',
    [SystemStatus.CropFailure]: 'Crop Failure',
    [SystemStatus.LackOfWorkers]: 'Lack of Workers'
  };
  
  return statusChanges.map(change => {
    const oldName = statusNames[change.oldStatus] || `Unknown(${change.oldStatus})`;
    const newName = statusNames[change.newStatus] || `Unknown(${change.newStatus})`;
    return `System ${change.systemIndex}: ${oldName} → ${newName}`;
  });
}

/**
 * Count systems by status for analysis/testing
 */
export function countSystemsByStatus(state: GameState): Record<SystemStatus, number> {
  const counts: Record<SystemStatus, number> = {
    [SystemStatus.Uneventful]: 0,
    [SystemStatus.War]: 0,
    [SystemStatus.Plague]: 0,
    [SystemStatus.Drought]: 0,
    [SystemStatus.Boredom]: 0,
    [SystemStatus.Cold]: 0,
    [SystemStatus.CropFailure]: 0,
    [SystemStatus.LackOfWorkers]: 0
  };
  
  state.solarSystem.forEach(system => {
    if (counts[system.status] !== undefined) {
      counts[system.status]++;
    }
  });
  
  return counts;
}
