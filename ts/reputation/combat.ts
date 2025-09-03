// Combat Reputation System - Port from Palm OS Space Trader
// Based on original C code in Global.c and Encounter.c

import type { State } from '../types.ts';

/**
 * Combat Reputation Score Constants (from spacetrader.h)
 */
export const HARMLESS_REP = 0;
export const MOSTLY_HARMLESS_REP = 10;
export const POOR_REP = 20;
export const AVERAGE_SCORE = 40;
export const ABOVE_AVERAGE_SCORE = 80;
export const COMPETENT_REP = 150;
export const DANGEROUS_REP = 300;
export const DEADLY_REP = 600;
export const ELITE_SCORE = 1500;

/**
 * Kill point values based on opponent reputation
 */
export const KILL_POINTS = {
  HARMLESS: 1,
  MOSTLY_HARMLESS: 2,
  POOR: 4,
  AVERAGE: 8,
  ABOVE_AVERAGE: 16,
  COMPETENT: 32,
  DANGEROUS: 64,
  DEADLY: 128,
  ELITE: 256
};

/**
 * Combat Reputation interface matching Palm OS REPUTATION struct
 */
export interface ReputationDefinition {
  name: string;
  minScore: number;
}

/**
 * Combat reputation definitions (from Global.c)
 */
export const COMBAT_REPUTATIONS: ReputationDefinition[] = [
  { name: 'Harmless', minScore: HARMLESS_REP },
  { name: 'Mostly harmless', minScore: MOSTLY_HARMLESS_REP },
  { name: 'Poor', minScore: POOR_REP },
  { name: 'Average', minScore: AVERAGE_SCORE },
  { name: 'Above average', minScore: ABOVE_AVERAGE_SCORE },
  { name: 'Competent', minScore: COMPETENT_REP },
  { name: 'Dangerous', minScore: DANGEROUS_REP },
  { name: 'Deadly', minScore: DEADLY_REP },
  { name: 'Elite', minScore: ELITE_SCORE }
];

/**
 * Get combat reputation string from score (matches getReputationString in engine/game.ts)
 */
export function getReputationString(score: number): string {
  // Find the highest reputation the player qualifies for
  for (let i = COMBAT_REPUTATIONS.length - 1; i >= 0; i--) {
    if (score >= COMBAT_REPUTATIONS[i].minScore) {
      return COMBAT_REPUTATIONS[i].name;
    }
  }
  return 'Harmless'; // Fallback
}

/**
 * Calculate kill points earned from defeating an opponent
 * Based on opponent's reputation level
 */
export function calculateKillPoints(opponentReputationScore: number): number {
  const reputation = getReputationString(opponentReputationScore);
  
  switch (reputation) {
    case 'Elite': return KILL_POINTS.ELITE;
    case 'Deadly': return KILL_POINTS.DEADLY;
    case 'Dangerous': return KILL_POINTS.DANGEROUS;
    case 'Competent': return KILL_POINTS.COMPETENT;
    case 'Above average': return KILL_POINTS.ABOVE_AVERAGE;
    case 'Average': return KILL_POINTS.AVERAGE;
    case 'Poor': return KILL_POINTS.POOR;
    case 'Mostly harmless': return KILL_POINTS.MOSTLY_HARMLESS;
    case 'Harmless':
    default:
      return KILL_POINTS.HARMLESS;
  }
}

/**
 * Award combat reputation points for a kill
 */
export function awardKillPoints(state: State, opponentReputationScore: number): State {
  const killPoints = calculateKillPoints(opponentReputationScore);
  
  return {
    ...state,
    reputationScore: state.reputationScore + killPoints
  };
}

/**
 * Check if player qualifies for Elite status
 */
export function isEliteReputation(score: number): boolean {
  return score >= ELITE_SCORE;
}

/**
 * Check if player has dangerous reputation (affects encounter behavior)
 */
export function isDangerousReputation(score: number): boolean {
  return score >= DANGEROUS_REP;
}

/**
 * Calculate encounter probability modifier based on reputation
 * Elite/Dangerous pilots face more challenging encounters
 */
export function getReputationEncounterModifier(score: number): number {
  if (score >= ELITE_SCORE) {
    return 1.5; // Elite pilots face 50% more encounters
  } else if (score >= DANGEROUS_REP) {
    return 1.2; // Dangerous pilots face 20% more encounters
  } else if (score >= COMPETENT_REP) {
    return 1.1; // Competent pilots face 10% more encounters
  }
  return 1.0; // Normal encounter rate for lower reputations
}

/**
 * Calculate bounty reward based on target's reputation
 * Higher reputation targets yield higher bounties
 */
export function calculateBountyReward(targetReputationScore: number): number {
  const reputation = getReputationString(targetReputationScore);
  
  switch (reputation) {
    case 'Elite': return 10000;
    case 'Deadly': return 5000;
    case 'Dangerous': return 2500;
    case 'Competent': return 1000;
    case 'Above average': return 500;
    case 'Average': return 250;
    case 'Poor': return 100;
    case 'Mostly harmless': return 50;
    case 'Harmless':
    default:
      return 25;
  }
}

/**
 * Process combat victory and award appropriate reputation
 */
export function processCombatVictory(state: State, opponentShipType: number, opponentReputationScore?: number): State {
  // Default opponent reputation based on ship type if not specified
  const reputation = opponentReputationScore ?? getDefaultOpponentReputation(opponentShipType);
  
  // Award kill points
  let newState = awardKillPoints(state, reputation);
  
  // Award bounty if applicable
  const bounty = calculateBountyReward(reputation);
  if (bounty > 0) {
    newState = {
      ...newState,
      credits: newState.credits + bounty
    };
  }
  
  return newState;
}

/**
 * Get default reputation score for opponent based on ship type
 * Larger, more advanced ships have better pilots
 */
function getDefaultOpponentReputation(shipType: number): number {
  // Basic mapping - larger ship indices generally have better pilots
  if (shipType >= 8) return DANGEROUS_REP; // Advanced ships
  if (shipType >= 5) return COMPETENT_REP; // Mid-tier ships
  if (shipType >= 2) return AVERAGE_SCORE; // Basic ships
  return POOR_REP; // Small ships
}

/**
 * Check if reputation level affects pirate behavior
 * Elite pilots are less likely to be attacked by weak pirates
 */
export function calculatePirateIntimidationChance(playerReputationScore: number, pirateShipType: number): number {
  if (playerReputationScore >= ELITE_SCORE) {
    // Elite pilots intimidate weak pirates
    if (pirateShipType <= 2) return 0.3; // 30% chance pirates avoid Elite pilots
  } else if (playerReputationScore >= DANGEROUS_REP) {
    // Dangerous pilots intimidate some pirates
    if (pirateShipType <= 1) return 0.15; // 15% chance pirates avoid Dangerous pilots
  }
  return 0.0; // No intimidation effect
}

/**
 * Process reputation loss from negative actions
 */
export function applyReputationPenalty(state: State, penalty: number): State {
  return {
    ...state,
    reputationScore: Math.max(0, state.reputationScore - penalty)
  };
}
