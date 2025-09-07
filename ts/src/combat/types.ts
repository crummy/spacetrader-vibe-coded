// Re-export the existing types from the test files for combat system use
export type { Ship, CrewMember, ShipType, SolarSystem } from '../test/data-structures.test.js';

// Combat-specific enums and types
export const Difficulty = {
  BEGINNER: 0,
  EASY: 1,
  NORMAL: 2,
  HARD: 3,
  IMPOSSIBLE: 4,
} as const;

export type Difficulty = typeof Difficulty[keyof typeof Difficulty];

export const WeaponType = {
  PULSE_LASER: 0,
  BEAM_LASER: 1,
  MILITARY_LASER: 2,
  MORGAN_LASER: 3,
  PHOTON_DISRUPTOR: 4,
  QUANTUM_DISRUPTOR: 5,
} as const;

export type WeaponType = typeof WeaponType[keyof typeof WeaponType];

export interface CombatResult {
  playerHit: boolean;
  opponentHit: boolean;
  playerDamage: number;
  opponentDamage: number;
  playerDestroyed: boolean;
  opponentDestroyed: boolean;
}

// Constants from the original C code
export const MAXSKILL = 10;
export const SKILLBONUS = 2;
export const CLOAKBONUS = 5;

// Police record score thresholds
export const PSYCHOPATHSCORE = -100;
export const CRIMINALSCORE = -30;
export const DUBIOUSSCORE = -10;
export const CLEANSCORE = 10;
export const LAWFULSCORE = 30;

// Reputation score thresholds
export const AVERAGESCORE = 400;
export const ELITESCORE = 12800;
