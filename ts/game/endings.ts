// End Game Conditions and Scoring - Port from Palm OS Space Trader  
// Based on original C code in Traveler.c and DataTypes.h

import type { State } from '../types.ts';

/**
 * End Game Status Constants (from spacetrader.h)
 */
export const KILLED = 0;
export const RETIRED = 1; 
export const MOON = 2;

export const MAX_HIGH_SCORE = 3;
export const COST_MOON = 500000; // Cost of purchasing moon

/**
 * High Score Entry interface (from DataTypes.h HIGHSCORE struct)
 */
export interface HighScoreEntry {
  name: string;
  status: number; // 0 = killed, 1 = retired, 2 = bought moon
  days: number;
  worth: number;
  difficulty: number;
}

/**
 * End Game Result interface
 */
export interface EndGameResult {
  isGameOver: boolean;
  endStatus: number;
  finalScore: number;
  finalWorth: number;
  days: number;
  message: string;
  highScoreQualified: boolean;
}

/**
 * Check if game has ended and determine end condition
 */
export function checkGameEndConditions(state: State): EndGameResult | null {
  // Death condition - ship hull at 0 or below
  if (state.ship.hull <= 0) {
    return processGameEnd(state, KILLED, 'Your ship has been destroyed! Game Over.');
  }
  
  // Moon purchase victory condition
  if (state.moonBought) {
    return processGameEnd(state, MOON, 'You have purchased a moon and achieved ultimate success!');
  }
  
  // Optional retirement condition (when player chooses to retire)
  // This would be triggered by a player action, not automatically
  return null; // Game continues
}

/**
 * Process retirement end condition
 */
export function processRetirement(state: State): EndGameResult {
  return processGameEnd(state, RETIRED, 'You have chosen to retire from space trading. Enjoy your well-earned rest!');
}

/**
 * Process game end and calculate final score
 */
function processGameEnd(state: State, endStatus: number, message: string): EndGameResult {
  const finalWorth = calculateNetWorth(state);
  const finalScore = calculateFinalScore(finalWorth, state.days, endStatus, state.difficulty);
  
  return {
    isGameOver: true,
    endStatus,
    finalScore,
    finalWorth,
    days: state.days,
    message,
    highScoreQualified: isHighScoreQualified(finalScore)
  };
}

/**
 * Calculate net worth including all assets
 * Based on CurrentWorth() function in Money.c
 */
export function calculateNetWorth(state: State): number {
  let worth = state.credits - state.debt;
  
  // Add ship value (insurance covers tribbles, but normal sale doesn't)
  worth += calculateShipValue(state, true); // Use insurance value
  
  // Add moon value if purchased
  if (state.moonBought) {
    worth += COST_MOON;
  }
  
  return Math.max(0, worth);
}

/**
 * Calculate ship value for end game scoring
 */
function calculateShipValue(state: State, forInsurance: boolean): number {
  // This should integrate with ship pricing, but for now use a simple calculation
  // In full implementation, this would call CurrentShipPrice(forInsurance)
  const baseShipValues = [400, 2000, 6000, 10000, 25000, 50000, 100000, 150000, 225000];
  let shipValue = baseShipValues[state.ship.type] || 1000;
  
  // Apply tribble penalty unless for insurance
  if (state.ship.tribbles > 0 && !forInsurance) {
    shipValue = Math.floor(shipValue / 4);
  }
  
  return shipValue;
}

/**
 * Calculate final score based on end conditions
 * From Traveler.c CalculateScore() function
 */
export function calculateFinalScore(worth: number, days: number, endStatus: number, difficulty: number): number {
  // Compress worth over 1 million (divide excess by 10)
  const adjustedWorth = worth < 1000000 ? worth : 1000000 + Math.floor((worth - 1000000) / 10);
  
  const level = difficulty + 1; // Difficulty levels 0-4, scoring levels 1-5
  
  if (endStatus === KILLED) {
    // Killed: (Level+1) * ((Worth * 90) / 50000)
    return level * Math.floor((adjustedWorth * 90) / 50000);
  } else if (endStatus === RETIRED) {
    // Retired: (Level+1) * ((Worth * 95) / 50000)  
    return level * Math.floor((adjustedWorth * 95) / 50000);
  } else {
    // Moon bought: (Level+1) * ((Worth + (max(0, (Level+1)*100 - Days) * 1000)) / 500)
    const timeBonus = Math.max(0, (level * 100) - days);
    const bonusWorth = adjustedWorth + (timeBonus * 1000);
    return level * Math.floor(bonusWorth / 500);
  }
}

/**
 * Check if score qualifies for high score table
 */
export function isHighScoreQualified(score: number, highScores: HighScoreEntry[] = []): boolean {
  // If high score table not full, always qualify
  if (highScores.length < MAX_HIGH_SCORE) {
    return true;
  }
  
  // Check if score beats lowest entry
  const lowestScore = Math.min(...highScores.map(entry => entry.finalScore || 0));
  return score > lowestScore;
}

/**
 * Add entry to high score table
 */
export function addHighScoreEntry(
  highScores: HighScoreEntry[], 
  name: string, 
  score: number, 
  worth: number, 
  days: number, 
  status: number, 
  difficulty: number
): HighScoreEntry[] {
  const newEntry: HighScoreEntry = {
    name,
    status,
    days,
    worth,
    difficulty,
    finalScore: score
  } as HighScoreEntry & { finalScore: number };
  
  // Add entry and sort by score (highest first)
  const updatedScores = [...highScores, newEntry]
    .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))
    .slice(0, MAX_HIGH_SCORE); // Keep only top 3
    
  return updatedScores;
}

/**
 * Get end status description
 */
export function getEndStatusDescription(status: number): string {
  switch (status) {
    case KILLED: return 'Killed in action';
    case RETIRED: return 'Retired';
    case MOON: return 'Claimed moon';
    default: return 'Unknown';
  }
}

/**
 * Process insurance claim after ship destruction
 */
export function processInsuranceClaim(state: State): { success: boolean; message: string; claimAmount: number; state: State } {
  if (!state.insurance) {
    return {
      success: false,
      message: 'No insurance policy active. Total loss.',
      claimAmount: 0,
      state
    };
  }
  
  // Insurance covers ship value and some cargo
  const shipValue = calculateShipValue(state, true); // Full insurance value
  const cargoValue = Math.floor(state.ship.cargo.reduce((sum, qty, index) => {
    // Basic cargo value estimation - in full implementation would use market prices
    const estimatedValues = [30, 100, 600, 750, 3500, 11000, 12000, 6500, 35000, 20000];
    return sum + (qty * (estimatedValues[index] || 0));
  }, 0) * 0.5); // Insurance covers 50% of cargo value
  
  const totalClaim = shipValue + cargoValue;
  
  const newState = {
    ...state,
    credits: state.credits + totalClaim,
    insurance: false, // Insurance policy expires after claim
    noClaim: 0, // Reset no-claim bonus
    ship: {
      ...state.ship,
      hull: 0 // Ship is destroyed
    }
  };
  
  return {
    success: true,
    message: `Insurance claim processed. Received ${totalClaim} credits for ship and cargo loss.`,
    claimAmount: totalClaim,
    state: newState
  };
}

/**
 * Check if player can retire (has bought moon and is at Utopia)
 */
export function canRetire(state: State): boolean {
  // Must have bought moon and be at Utopia system (system index 119)
  return state.moonBought && state.currentSystem === 119;
}

/**
 * Check if game should force end due to extreme conditions
 */
export function checkForceEndConditions(state: State): EndGameResult | null {
  // Force end if debt becomes impossible to repay (very negative worth)
  const worth = calculateNetWorth(state);
  if (worth < -100000) {
    return processGameEnd(state, KILLED, 'Massive debt has forced you into bankruptcy. Game Over.');
  }
  
  // Force end if tribbles completely overrun ship (humorous ending)
  if (state.ship.tribbles >= 100000 && state.ship.hull <= 10) {
    return processGameEnd(state, RETIRED, 'Your ship has been completely overrun by tribbles. You are forced to abandon space trading!');
  }
  
  return null;
}

/**
 * Get detailed end game summary
 */
export function getEndGameSummary(endResult: EndGameResult, state: State): string {
  const statusDesc = getEndStatusDescription(endResult.endStatus);
  const difficultyName = getDifficultyName(state.difficulty);
  
  return [
    `Game Over - ${statusDesc}`,
    `Final Score: ${endResult.finalScore}`,
    `Final Worth: ${endResult.finalWorth} credits`,
    `Days Played: ${endResult.days}`,
    `Difficulty: ${difficultyName}`,
    endResult.highScoreQualified ? '🏆 High Score Achieved!' : 'Try again for a higher score!'
  ].join('\n');
}

/**
 * Get difficulty name from level
 */
function getDifficultyName(level: number): string {
  const names = ['Beginner', 'Easy', 'Normal', 'Hard', 'Impossible'];
  return names[level] || 'Unknown';
}

/**
 * Export high score data for persistence
 */
export function serializeHighScores(highScores: HighScoreEntry[]): string {
  return JSON.stringify(highScores);
}

/**
 * Import high score data from persistence
 */
export function deserializeHighScores(data: string): HighScoreEntry[] {
  try {
    const scores = JSON.parse(data);
    if (Array.isArray(scores)) {
      return scores.slice(0, MAX_HIGH_SCORE); // Ensure max limit
    }
  } catch (error) {
    console.warn('Failed to parse high scores:', error);
  }
  return [];
}
