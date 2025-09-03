// Combat Statistics Tracking - Port from Palm OS Space Trader
// Based on original C code in Encounter.c and Global.c

import type { State } from '../types.ts';
import { EncounterType } from './engine.ts';

/**
 * Police Record Score Changes for Kills (from spacetrader.h)
 */
export const KILL_POLICE_SCORE = -6;  // KILLPOLICESCORE 
export const KILL_TRADER_SCORE = -4;  // KILLTRADERSCORE
export const KILL_PIRATE_SCORE = 1;   // KILLPIRATESCORE

/**
 * Combat statistics interface
 */
export interface CombatStatistics {
  policeKills: number;
  traderKills: number;
  pirateKills: number;
  totalKills: number;
}

/**
 * Record a ship kill and update statistics and police record
 * Based on kill tracking logic from Encounter.c lines 981-1035
 */
export function recordShipKill(state: State, encounterType: number): State {
  let newState = { ...state };
  
  // Determine encounter category and update appropriate kill counter
  if (isPoliceEncounter(encounterType)) {
    newState.policeKills += 1;
    newState.policeRecordScore += KILL_POLICE_SCORE;
  } 
  else if (isTraderEncounter(encounterType)) {
    newState.traderKills += 1;
    newState.policeRecordScore += KILL_TRADER_SCORE;
  }
  else if (isPirateEncounter(encounterType) || isMonsterEncounter(encounterType) || 
           isDragonflyEncounter(encounterType) || isScarabEncounter(encounterType)) {
    newState.pirateKills += 1;
    newState.policeRecordScore += KILL_PIRATE_SCORE;
    
    // Handle special ship status updates
    if (isMonsterEncounter(encounterType)) {
      newState.spacemonsterStatus = 2; // Monster killed
    } else if (isDragonflyEncounter(encounterType)) {
      newState.dragonflyStatus = 5; // Dragonfly killed  
    } else if (isScarabEncounter(encounterType)) {
      newState.scarabStatus = 2; // Scarab killed
    }
  }
  
  // Basic reputation increase for any kill: 1 + (OpponentType >> 1)
  // For now, estimate opponent type from encounter type
  const opponentTypeEstimate = getOpponentTypeFromEncounter(encounterType);
  newState.reputationScore += 1 + Math.floor(opponentTypeEstimate / 2);
  
  return newState;
}

/**
 * Get current combat statistics
 */
export function getCombatStatistics(state: State): CombatStatistics {
  return {
    policeKills: state.policeKills,
    traderKills: state.traderKills, 
    pirateKills: state.pirateKills,
    totalKills: state.policeKills + state.traderKills + state.pirateKills
  };
}

/**
 * Check if encounter is police type (from Palm OS ENCOUNTERPOLICE macro)
 */
function isPoliceEncounter(encounterType: number): boolean {
  return encounterType >= 0 && encounterType <= 9;
}

/**
 * Check if encounter is trader type (from Palm OS ENCOUNTERTRADER macro)
 */
function isTraderEncounter(encounterType: number): boolean {
  return encounterType >= 20 && encounterType <= 29;
}

/**
 * Check if encounter is pirate type (from Palm OS ENCOUNTERPIRATE macro)
 */
function isPirateEncounter(encounterType: number): boolean {
  return encounterType >= 10 && encounterType <= 19;
}

/**
 * Check if encounter is space monster (from Palm OS ENCOUNTERMONSTER macro)
 */
function isMonsterEncounter(encounterType: number): boolean {
  return encounterType >= 30 && encounterType <= 39;
}

/**
 * Check if encounter is dragonfly (from Palm OS ENCOUNTERDRAGONFLY macro)
 */
function isDragonflyEncounter(encounterType: number): boolean {
  return encounterType >= 40 && encounterType <= 49;
}

/**
 * Check if encounter is scarab (from Palm OS ENCOUNTERSCARAB macro)
 */
function isScarabEncounter(encounterType: number): boolean {
  return encounterType >= 60 && encounterType <= 69;
}

/**
 * Estimate opponent ship type from encounter type for reputation calculations
 */
function getOpponentTypeFromEncounter(encounterType: number): number {
  // Police encounters - typically small to medium ships
  if (isPoliceEncounter(encounterType)) {
    return 2; // Estimate: police use mid-tier ships
  }
  
  // Pirate encounters - varies widely
  if (isPirateEncounter(encounterType)) {
    return 3; // Estimate: pirates use varied ships
  }
  
  // Trader encounters - typically larger ships  
  if (isTraderEncounter(encounterType)) {
    return 4; // Estimate: traders use larger cargo ships
  }
  
  // Special ships have specific types
  if (isMonsterEncounter(encounterType)) {
    return 10; // Space monster (MAXSHIPTYPE)
  }
  if (isDragonflyEncounter(encounterType)) {
    return 11; // Dragonfly (MAXSHIPTYPE+1)
  }
  if (isScarabEncounter(encounterType)) {
    return 13; // Scarab (MAXSHIPTYPE+3)
  }
  
  return 1; // Default small ship
}

/**
 * Get formatted kill statistics display
 */
export function formatCombatStatistics(stats: CombatStatistics): string {
  return [
    `Total Kills: ${stats.totalKills}`,
    `  Police: ${stats.policeKills}`,
    `  Traders: ${stats.traderKills}`, 
    `  Pirates: ${stats.pirateKills}`
  ].join('\n');
}

/**
 * Calculate kill-based achievements
 */
export function getKillAchievements(stats: CombatStatistics): string[] {
  const achievements: string[] = [];
  
  if (stats.totalKills >= 100) {
    achievements.push('Veteran Fighter (100+ kills)');
  }
  if (stats.totalKills >= 500) {
    achievements.push('Elite Pilot (500+ kills)');
  }
  if (stats.policeKills >= 50) {
    achievements.push('Enemy of the State (50+ police kills)');
  }
  if (stats.pirateKills >= 100) {
    achievements.push('Pirate Hunter (100+ pirate kills)');
  }
  if (stats.traderKills === 0 && stats.totalKills >= 50) {
    achievements.push('Honorable Fighter (no trader kills)');
  }
  
  return achievements;
}

/**
 * Reset combat statistics (for new game)
 */
export function resetCombatStatistics(state: State): State {
  return {
    ...state,
    policeKills: 0,
    traderKills: 0,
    pirateKills: 0
  };
}

/**
 * Check if encounter should award reputation/score
 * Some encounters (like famous captains) have special reputation rules
 */
export function shouldAwardStandardReputation(encounterType: number): boolean {
  // Famous captain encounters have special reputation handling
  const famousEncounters = [
    EncounterType.CAPTAINAHABENCOUNTER,
    EncounterType.CAPTAINCONRADENCOUNTER, 
    EncounterType.CAPTAINHUIEENCOUNTER
  ];
  
  return !famousEncounters.includes(encounterType);
}

/**
 * Handle famous captain kill (special reputation boost)
 */
export function handleFamousCaptainKill(state: State, encounterType: number): State {
  let newState = { ...state };
  
  // Famous captain kills boost reputation significantly
  if (newState.reputationScore < 300) { // DANGEROUSREP
    newState.reputationScore = 300; // Instant promotion to Dangerous
  } else {
    newState.reputationScore += 100; // Additional 100 points if already Dangerous+
  }
  
  return newState;
}
