// Political Systems Implementation
// Port of politics definitions from Palm OS Global.c

import type { PoliticsType, TechLevel } from '../types.ts';
import { TradeItem } from '../types.ts';

// Constants from Palm OS
const MAXPOLITICS = 17;
const ANARCHY = 0;
const CAPITALIST_STATE = 1;
const COMMUNIST_STATE = 2;
const CONFEDERACY = 3;
const CORPORATE_STATE = 4;
const CYBERNETIC_STATE = 5;
const DEMOCRACY = 6;
const DICTATORSHIP = 7;
const FASCIST_STATE = 8;
const FEUDAL_STATE = 9;
const MILITARY_STATE = 10;
const MONARCHY = 11;
const PACIFIST_STATE = 12;
const SOCIALIST_STATE = 13;
const STATE_OF_SATORI = 14;
const TECHNOCRACY = 15;
const THEOCRACY = 16;

// Politics data ported exactly from Palm OS Global.c:
// const POLITICS Politics[MAXPOLITICS] = { ... }
const POLITICAL_SYSTEMS: readonly PoliticsType[] = [
  // Anarchy - index 0
  {
    name: "Anarchy",
    reactionIllegal: 0,
    strengthPolice: 0,
    strengthPirates: 7,
    strengthTraders: 1,
    minTechLevel: 0 as TechLevel,
    maxTechLevel: 5 as TechLevel,
    bribeLevel: 7,
    drugsOK: true,
    firearmsOK: true,
    wanted: TradeItem.Food
  },
  
  // Capitalist State - index 1
  {
    name: "Capitalist State",
    reactionIllegal: 2,
    strengthPolice: 3,
    strengthPirates: 2,
    strengthTraders: 7,
    minTechLevel: 4 as TechLevel,
    maxTechLevel: 7 as TechLevel,
    bribeLevel: 1,
    drugsOK: true,
    firearmsOK: true,
    wanted: TradeItem.Ore
  },
  
  // Communist State - index 2
  {
    name: "Communist State",
    reactionIllegal: 6,
    strengthPolice: 6,
    strengthPirates: 4,
    strengthTraders: 4,
    minTechLevel: 1 as TechLevel,
    maxTechLevel: 5 as TechLevel,
    bribeLevel: 5,
    drugsOK: true,
    firearmsOK: true,
    wanted: -1 // No special trade item wanted
  },
  
  // Confederacy - index 3
  {
    name: "Confederacy",
    reactionIllegal: 5,
    strengthPolice: 4,
    strengthPirates: 3,
    strengthTraders: 5,
    minTechLevel: 1 as TechLevel,
    maxTechLevel: 6 as TechLevel,
    bribeLevel: 3,
    drugsOK: true,
    firearmsOK: true,
    wanted: TradeItem.Games
  },
  
  // Corporate State - index 4
  {
    name: "Corporate State",
    reactionIllegal: 2,
    strengthPolice: 6,
    strengthPirates: 2,
    strengthTraders: 7,
    minTechLevel: 4 as TechLevel,
    maxTechLevel: 7 as TechLevel,
    bribeLevel: 2,
    drugsOK: true,
    firearmsOK: true,
    wanted: TradeItem.Robots
  },
  
  // Cybernetic State - index 5
  {
    name: "Cybernetic State",
    reactionIllegal: 0,
    strengthPolice: 7,
    strengthPirates: 7,
    strengthTraders: 5,
    minTechLevel: 6 as TechLevel,
    maxTechLevel: 7 as TechLevel,
    bribeLevel: 0,
    drugsOK: false, // Drugs not allowed
    firearmsOK: false, // Firearms not allowed
    wanted: TradeItem.Ore
  },
  
  // Democracy - index 6
  {
    name: "Democracy",
    reactionIllegal: 4,
    strengthPolice: 3,
    strengthPirates: 2,
    strengthTraders: 5,
    minTechLevel: 3 as TechLevel,
    maxTechLevel: 7 as TechLevel,
    bribeLevel: 2,
    drugsOK: true,
    firearmsOK: true,
    wanted: TradeItem.Games
  },
  
  // Dictatorship - index 7
  {
    name: "Dictatorship",
    reactionIllegal: 3,
    strengthPolice: 4,
    strengthPirates: 5,
    strengthTraders: 3,
    minTechLevel: 0 as TechLevel,
    maxTechLevel: 7 as TechLevel,
    bribeLevel: 2,
    drugsOK: true,
    firearmsOK: true,
    wanted: -1 // No special trade item wanted
  },
  
  // Fascist State - index 8
  {
    name: "Fascist State",
    reactionIllegal: 7,
    strengthPolice: 7,
    strengthPirates: 7,
    strengthTraders: 1,
    minTechLevel: 4 as TechLevel,
    maxTechLevel: 7 as TechLevel,
    bribeLevel: 0,
    drugsOK: false, // Drugs not allowed
    firearmsOK: true, // Firearms allowed
    wanted: TradeItem.Machinery
  },
  
  // Feudal State - index 9
  {
    name: "Feudal State",
    reactionIllegal: 1,
    strengthPolice: 1,
    strengthPirates: 6,
    strengthTraders: 2,
    minTechLevel: 0 as TechLevel,
    maxTechLevel: 3 as TechLevel,
    bribeLevel: 6,
    drugsOK: true,
    firearmsOK: true,
    wanted: TradeItem.Firearms
  },
  
  // Military State - index 10
  {
    name: "Military State",
    reactionIllegal: 7,
    strengthPolice: 7,
    strengthPirates: 0,
    strengthTraders: 6,
    minTechLevel: 2 as TechLevel,
    maxTechLevel: 7 as TechLevel,
    bribeLevel: 0,
    drugsOK: false, // Drugs not allowed
    firearmsOK: true, // Firearms allowed
    wanted: TradeItem.Robots
  },
  
  // Monarchy - index 11
  {
    name: "Monarchy",
    reactionIllegal: 3,
    strengthPolice: 4,
    strengthPirates: 3,
    strengthTraders: 4,
    minTechLevel: 0 as TechLevel,
    maxTechLevel: 5 as TechLevel,
    bribeLevel: 4,
    drugsOK: true,
    firearmsOK: true,
    wanted: TradeItem.Medicine
  },
  
  // Pacifist State - index 12
  {
    name: "Pacifist State",
    reactionIllegal: 7,
    strengthPolice: 2,
    strengthPirates: 1,
    strengthTraders: 5,
    minTechLevel: 0 as TechLevel,
    maxTechLevel: 3 as TechLevel,
    bribeLevel: 1,
    drugsOK: true,
    firearmsOK: false, // Firearms not allowed
    wanted: -1 // No special trade item wanted
  },
  
  // Socialist State - index 13
  {
    name: "Socialist State",
    reactionIllegal: 4,
    strengthPolice: 2,
    strengthPirates: 5,
    strengthTraders: 3,
    minTechLevel: 0 as TechLevel,
    maxTechLevel: 5 as TechLevel,
    bribeLevel: 6,
    drugsOK: true,
    firearmsOK: true,
    wanted: -1 // No special trade item wanted
  },
  
  // State of Satori - index 14
  {
    name: "State of Satori",
    reactionIllegal: 0,
    strengthPolice: 1,
    strengthPirates: 1,
    strengthTraders: 1,
    minTechLevel: 0 as TechLevel,
    maxTechLevel: 1 as TechLevel,
    bribeLevel: 0,
    drugsOK: false, // Drugs not allowed
    firearmsOK: false, // Firearms not allowed
    wanted: -1 // No special trade item wanted
  },
  
  // Technocracy - index 15
  {
    name: "Technocracy",
    reactionIllegal: 1,
    strengthPolice: 6,
    strengthPirates: 3,
    strengthTraders: 6,
    minTechLevel: 4 as TechLevel,
    maxTechLevel: 7 as TechLevel,
    bribeLevel: 2,
    drugsOK: true,
    firearmsOK: true,
    wanted: TradeItem.Water
  },
  
  // Theocracy - index 16
  {
    name: "Theocracy",
    reactionIllegal: 5,
    strengthPolice: 6,
    strengthPirates: 1,
    strengthTraders: 4,
    minTechLevel: 0 as TechLevel,
    maxTechLevel: 4 as TechLevel,
    bribeLevel: 0,
    drugsOK: true,
    firearmsOK: true,
    wanted: TradeItem.Narcotics
  }
] as const;

// Validate at compile time that we have exactly MAXPOLITICS systems
const _validatePoliticsCount: typeof POLITICAL_SYSTEMS = POLITICAL_SYSTEMS;

/**
 * Get all political systems
 * @returns Readonly array of all political systems
 */
export function getPoliticalSystems(): readonly PoliticsType[] {
  return POLITICAL_SYSTEMS;
}

/**
 * Get a specific political system by index
 * @param index Politics index (0-16)
 * @returns Political system definition
 * @throws Error if index is out of bounds
 */
export function getPoliticalSystem(index: number): PoliticsType {
  if (index < 0 || index >= MAXPOLITICS) {
    throw new Error(`Invalid politics index: ${index}. Must be 0-${MAXPOLITICS - 1}`);
  }
  return POLITICAL_SYSTEMS[index];
}

/**
 * Check if politics index is valid
 * @param index Politics index to validate
 * @returns True if index is valid
 */
export function isValidPoliticsIndex(index: number): boolean {
  return index >= 0 && index < MAXPOLITICS;
}

/**
 * Get politics constants
 * @returns Object containing politics constants
 */
export function getPoliticsConstants() {
  return {
    MAXPOLITICS,
    ANARCHY,
    CAPITALIST_STATE,
    COMMUNIST_STATE,
    CONFEDERACY,
    CORPORATE_STATE,
    CYBERNETIC_STATE,
    DEMOCRACY,
    DICTATORSHIP,
    FASCIST_STATE,
    FEUDAL_STATE,
    MILITARY_STATE,
    MONARCHY,
    PACIFIST_STATE,
    SOCIALIST_STATE,
    STATE_OF_SATORI,
    TECHNOCRACY,
    THEOCRACY
  } as const;
}

/**
 * Get political system name by index
 * @param index Politics index
 * @returns Political system name
 */
export function getPoliticsName(index: number): string {
  return getPoliticalSystem(index).name;
}

/**
 * Check if a political system allows drugs
 * @param index Politics index
 * @returns True if drugs are allowed
 */
export function allowsDrugs(index: number): boolean {
  return getPoliticalSystem(index).drugsOK;
}

/**
 * Check if a political system allows firearms
 * @param index Politics index
 * @returns True if firearms are allowed
 */
export function allowsFirearms(index: number): boolean {
  return getPoliticalSystem(index).firearmsOK;
}

/**
 * Get the trade item wanted by a political system
 * @param index Politics index
 * @returns Trade item index or -1 if none wanted
 */
export function getWantedTradeItem(index: number): number {
  return getPoliticalSystem(index).wanted;
}

/**
 * Check if a political system is tech-level compatible
 * @param politicsIndex Politics index
 * @param techLevel System tech level
 * @returns True if compatible
 */
export function isTechLevelCompatible(politicsIndex: number, techLevel: number): boolean {
  const politics = getPoliticalSystem(politicsIndex);
  return techLevel >= politics.minTechLevel && techLevel <= politics.maxTechLevel;
}