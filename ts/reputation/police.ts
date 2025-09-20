// Police Record System - Port from Palm OS Space Trader
// Based on original C code in Global.c and Encounter.c

import type { State } from '../types.ts';
import { randomFloor, randomBool } from '../math/random.ts';

/**
 * Police Record Score Constants (from spacetrader.h)
 */
export const PSYCHOPATH_SCORE = -100;
export const VILLAIN_SCORE = -70;
export const CRIMINAL_SCORE = -30;
export const CROOK_SCORE = -10;
export const DUBIOUS_SCORE = -5;
export const CLEAN_SCORE = 0;
export const LAWFUL_SCORE = 5;
export const TRUSTED_SCORE = 10;
export const HELPER_SCORE = 25;
export const HERO_SCORE = 75;

/**
 * Police Record Penalties/Bonuses
 */
export const ATTACKED_POLICE_PENALTY = -3;
export const DESTROYED_POLICE_PENALTY = -5;
export const ATTACKED_TRADER_PENALTY = -2;
export const DESTROYED_TRADER_PENALTY = -3;
export const CAUGHT_WITH_WILD_PENALTY = -4;
export const INSPECTOR_BRIBE_PENALTY = -1;
export const INSURANCE_FRAUD_PENALTY = -1;

/**
 * Police Record interface matching Palm OS POLICERECORD struct
 */
export interface PoliceRecordDefinition {
  name: string;
  minScore: number;
}

/**
 * Police record definitions (from Global.c)
 */
export const POLICE_RECORDS: PoliceRecordDefinition[] = [
  { name: 'Psycho', minScore: PSYCHOPATH_SCORE },
  { name: 'Villain', minScore: VILLAIN_SCORE },
  { name: 'Criminal', minScore: CRIMINAL_SCORE },
  { name: 'Crook', minScore: CROOK_SCORE },
  { name: 'Dubious', minScore: DUBIOUS_SCORE },
  { name: 'Clean', minScore: CLEAN_SCORE },
  { name: 'Lawful', minScore: LAWFUL_SCORE },
  { name: 'Trusted', minScore: TRUSTED_SCORE },
  { name: 'Liked', minScore: HELPER_SCORE },
  { name: 'Hero', minScore: HERO_SCORE }
];

/**
 * Get police record string from score (matches getPoliceRecordString in engine/game.ts)
 */
export function getPoliceRecordString(score: number): string {
  // Find the highest record the player qualifies for
  for (let i = POLICE_RECORDS.length - 1; i >= 0; i--) {
    if (score >= POLICE_RECORDS[i].minScore) {
      return POLICE_RECORDS[i].name;
    }
  }
  return 'Psycho'; // Fallback for extreme negative scores
}

/**
 * Check if police record qualifies as criminal (worse than Dubious)
 */
export function isCriminalRecord(score: number): boolean {
  return score < DUBIOUS_SCORE;
}

/**
 * Check if police record qualifies as clean (Clean or better)
 */
export function isCleanRecord(score: number): boolean {
  return score >= CLEAN_SCORE;
}

/**
 * Calculate bribe amount based on difficulty and police record
 * From Encounter.c: Bribe = GetRandom(250) + 250 + GetRandom(250) + 250 + 10 * (IMPOSSIBLE - Difficulty)
 * Note: The formula means easier difficulty = more expensive bribes
 */
export function calculateBribeAmount(difficulty: number): number {
  const baseAmount = randomFloor(250) + 250;
  const bonusAmount = randomFloor(250) + 250;
  const difficultyBonus = 10 * (4 - difficulty); // IMPOSSIBLE (4) - difficulty - easier pays more
  
  return baseAmount + bonusAmount + difficultyBonus;
}

/**
 * Apply police record penalty to player
 */
export function applyPoliceRecordPenalty(state: State, penalty: number): State {
  return {
    ...state,
    policeRecordScore: state.policeRecordScore + penalty // penalty is negative
  };
}

/**
 * Improve police record (for good deeds)
 */
export function improvePoliceRecord(state: State, improvement: number): State {
  const newScore = Math.min(state.policeRecordScore + improvement, HERO_SCORE);
  return {
    ...state,
    policeRecordScore: newScore
  };
}

/**
 * Check if player can attempt bribery based on credits
 */
export function canAttemptBribery(state: State, bribeAmount: number): boolean {
  return state.credits >= bribeAmount;
}

/**
 * Execute bribery attempt
 * Returns success and updates state
 */
export function attemptBribery(state: State, bribeAmount: number): { success: boolean; message: string; state: State } {
  if (!canAttemptBribery(state, bribeAmount)) {
    return {
      success: false,
      message: 'You do not have enough credits for the bribe.',
      state
    };
  }

  // Bribery success depends on amount and current record
  const baseSuccessChance = 0.7; // 70% base success
  const recordModifier = Math.max(0, state.policeRecordScore + 100) / 200; // Better record = higher chance
  const finalChance = Math.min(0.95, baseSuccessChance + recordModifier);
  
  const success = randomBool(finalChance);
  
  if (success) {
    // Successful bribery: deduct credits
    const newState = {
      ...state,
      credits: state.credits - bribeAmount
    };
    return {
      success: true,
      message: `Bribery successful! The police officer accepts ${bribeAmount} credits and looks the other way.`,
      state: newState
    };
  } else {
    // Failed bribery: no credits deducted, but record worsens
    const newState = applyPoliceRecordPenalty(state, INSPECTOR_BRIBE_PENALTY);
    return {
      success: false,
      message: `Bribery failed! The officer is offended and your police record suffers.`,
      state: newState
    };
  }
}

/**
 * Calculate police encounter probability modifier based on record
 * Criminals are more likely to be pursued
 */
export function getPoliceEncounterModifier(score: number): number {
  if (score < DUBIOUS_SCORE) {
    // Criminals have increased police encounters
    const criminalLevel = Math.abs(score - DUBIOUS_SCORE) / 10;
    return Math.min(2.0, 1.0 + criminalLevel * 0.1);
  }
  return 1.0; // Normal encounter rate for clean records
}

/**
 * Process inspector encounter based on police record
 */
export function handleInspectorEncounter(state: State): { message: string; fine: number; canBribe: boolean; state: State } {
  const record = getPoliceRecordString(state.policeRecordScore);
  const bribeAmount = calculateBribeAmount(state.difficulty);
  
  let fine = 0;
  let message = '';
  let canBribe = true;

  if (isCriminalRecord(state.policeRecordScore)) {
    fine = randomFloor(10000) + 5000; // Higher fines for criminals
    message = `Inspector finds irregularities in your ship records! As a known ${record}, you face a ${fine} credit fine.`;
  } else {
    fine = randomFloor(1000) + 500; // Lower fines for clean records
    message = `Routine inspection finds minor violations. Clean record reduces penalty to ${fine} credits.`;
    
    // Clean records might avoid fines entirely
    if (state.policeRecordScore >= LAWFUL_SCORE && randomBool(0.3)) {
      fine = 0;
      message = `Routine inspection. Your ${record} record helps you avoid any penalties.`;
      canBribe = false;
    }
  }

  return {
    message,
    fine,
    canBribe,
    state
  };
}
