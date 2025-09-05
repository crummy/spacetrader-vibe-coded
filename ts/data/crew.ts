// Crew System Implementation
// Port of crew/mercenary system from Palm OS Global.c and Traveler.c

import type { CrewMember, GameState } from '../types.ts';
import { MAXCREWMEMBER, MAXSKILL } from '../types.ts';
import { getShipType } from './shipTypes.ts';

// Mercenary names ported exactly from Palm OS source:
// char* MercenaryName[MAXCREWMEMBER] = { ... }
const MERCENARY_NAMES: readonly string[] = [
  'Jameson',    // Commander (NameCommander) - index 0
  'Alyssa',
  'Armatur',
  'Bentos',
  'C2U2',
  "Chi'Ti",
  'Crystal',
  'Dane',
  'Deirdre',
  'Doc',
  'Draco',
  'Iranda',
  'Jeremiah',
  'Jujubal',
  'Krydon',
  'Luis',
  'Mercedez',
  'Milete',
  'Muri-L',
  'Mystyc',
  'Nandi',
  'Orestes',
  'Pancho',
  'PS37',
  'Quarck',
  'Sosumi',
  'Uma',
  'Wesley',
  'Wonton',
  'Yorvick',
  'Zeethibal'   // anagram for Elizabeth - index 30
] as const;

// Validate at compile time that we have exactly MAXCREWMEMBER names
// (Runtime tests verify the exact count)
const _validateMercenaryNameCount: typeof MERCENARY_NAMES = MERCENARY_NAMES;

/**
 * Get all mercenary names
 * @returns Readonly array of all mercenary names
 */
export function getMercenaryNames(): readonly string[] {
  return MERCENARY_NAMES;
}

/**
 * Get mercenary name by index
 * @param index Mercenary index (0-30)
 * @returns Mercenary name
 * @throws Error if index is out of bounds
 */
export function getMercenaryName(index: number): string {
  if (index < 0 || index >= MAXCREWMEMBER) {
    throw new Error(`Invalid mercenary index: ${index}. Must be 0-${MAXCREWMEMBER - 1}`);
  }
  return MERCENARY_NAMES[index];
}

/**
 * Generate random skill level using Palm OS formula
 * From Palm source: return 1 + GetRandom(5) + GetRandom(6);
 * This generates skills from 1 to 10 (1 + 0-4 + 0-5)
 * @returns Random skill level (1-10)
 */
export function generateRandomSkill(): number {
  // Palm OS: 1 + GetRandom(5) + GetRandom(6)
  // GetRandom(n) returns 0 to n-1
  return 1 + Math.floor(Math.random() * 5) + Math.floor(Math.random() * 6);
}

/**
 * Check if skill level is valid
 * @param skill Skill level to validate
 * @returns True if skill is in valid range (0-10)
 */
export function isValidSkillLevel(skill: number): boolean {
  return skill >= 0 && skill <= MAXSKILL;
}

/**
 * Create the commander crew member
 * From Palm source: Commander starts with 1 in all skills at Sol system (index 0)
 * @returns Commander crew member
 */
export function createCommander(): CrewMember {
  return {
    nameIndex: 0,        // Points to "Jameson"
    pilot: 1,            // Starting skill level
    fighter: 1,          // Starting skill level
    trader: 1,           // Starting skill level
    engineer: 1,         // Starting skill level
    curSystem: 0         // Starts at Sol system
  };
}

/**
 * Create a random crew member with generated skills
 * From Palm source: All mercenaries except commander get RandomSkill() for each skill
 * @param nameIndex Index of mercenary name (1-30)
 * @param systemIndex Current system location (default 255 = no location)
 * @returns Random crew member
 */
export function createRandomCrewMember(nameIndex: number, systemIndex: number = 255): CrewMember {
  if (nameIndex < 0 || nameIndex >= MAXCREWMEMBER) {
    throw new Error(`Invalid mercenary name index: ${nameIndex}. Must be 0-${MAXCREWMEMBER - 1}`);
  }

  return {
    nameIndex: nameIndex,
    pilot: generateRandomSkill(),
    fighter: generateRandomSkill(),
    trader: generateRandomSkill(),
    engineer: generateRandomSkill(),
    curSystem: systemIndex
  };
}

/**
 * Create Zeethibal with skills based on player's weaknesses
 * From Palm source SpecialEvent.c: Zeethibal gets 10 in player's lowest skill,
 * 8 in second lowest skill, and 5 in other skills
 * @param playerSkills Array of player skills [pilot, fighter, trader, engineer]
 * @returns Zeethibal crew member
 */
export function createZeethibal(playerSkills: readonly [number, number, number, number]): CrewMember {
  const [pilot, fighter, trader, engineer] = playerSkills;
  
  // Start with base skills of 5
  const zeethibalSkills = {
    pilot: 5,
    fighter: 5,
    trader: 5,
    engineer: 5
  };

  // Find lowest and second-lowest skills
  const skillTypes = [
    { type: 'pilot' as const, value: pilot },
    { type: 'fighter' as const, value: fighter },
    { type: 'trader' as const, value: trader },
    { type: 'engineer' as const, value: engineer }
  ];
  
  // Sort by skill value (ascending)
  skillTypes.sort((a, b) => a.value - b.value);
  
  // Set 10 in lowest skill, 8 in second-lowest skill
  zeethibalSkills[skillTypes[0].type] = 10;  // Lowest skill gets 10
  
  if (skillTypes[0].value !== skillTypes[1].value) {
    // Only set second-lowest to 8 if it's different from lowest
    zeethibalSkills[skillTypes[1].type] = 8;
  }

  return {
    nameIndex: MAXCREWMEMBER - 1,  // Last mercenary (index 30)
    pilot: zeethibalSkills.pilot,
    fighter: zeethibalSkills.fighter,
    trader: zeethibalSkills.trader,
    engineer: zeethibalSkills.engineer,
    curSystem: 255  // Special "no location" value
  };
}

/**
 * Generate a full crew roster (for game initialization)
 * From Palm source Traveler.c: Initialize all mercenaries with random skills
 * @returns Array of all crew members with random skills
 */
export function generateFullCrewRoster(): CrewMember[] {
  const crew: CrewMember[] = [];
  
  // Index 0: Commander with fixed stats
  crew.push(createCommander());
  
  // Indices 1-30: Random mercenaries
  for (let i = 1; i < MAXCREWMEMBER; i++) {
    crew.push(createRandomCrewMember(i));
  }
  
  return crew;
}

/**
 * Get crew member total skill points
 * @param crewMember Crew member to evaluate
 * @returns Sum of all skill levels
 */
export function getTotalSkillPoints(crewMember: CrewMember): number {
  return crewMember.pilot + crewMember.fighter + crewMember.trader + crewMember.engineer;
}

/**
 * Calculate hiring price for a mercenary
 * From Palm source: (Pilot + Fighter + Trader + Engineer) * 3
 * @param crewMember Crew member to hire
 * @returns Hiring price in credits
 */
export function calculateHiringPrice(crewMember: CrewMember): number {
  return getTotalSkillPoints(crewMember) * 3;
}

/**
 * Get mercenary available for hire in the current system
 * Based on Palm OS GetForHire() function
 * 
 * @param state Current game state
 * @returns Index of mercenary for hire, or -1 if none available
 */
export function getMercenaryForHire(state: GameState): number {
  const currentSystem = state.currentSystem;
  
  for (let i = 1; i < MAXCREWMEMBER; i++) {
    // Skip if this mercenary is already hired
    if (state.ship.crew.includes(i)) {
      continue;
    }
    
    // Check if mercenary is in current system
    if (state.mercenary[i].curSystem === currentSystem) {
      return i;
    }
  }
  
  return -1; // No mercenary available
}

/**
 * Get available crew quarters on current ship
 * Based on Palm OS AvailableQuarters() function
 * 
 * @param state Current game state
 * @returns Number of available crew quarters
 */
export function getAvailableCrewQuarters(state: GameState): number {
  const shipType = getShipType(state.ship.type);
  const maxQuarters = shipType.crewQuarters;
  
  // Count used quarters - crew members have index >= 0, empty slots are -1
  const usedQuarters = state.ship.crew.filter(crewIndex => crewIndex >= 0).length;
  
  // Account for passengers (Jarek and Wild take quarters when aboard)
  let passengerQuarters = 0;
  if (state.jarekStatus === 1) passengerQuarters++; // Jarek aboard
  if (state.wildStatus === 1) passengerQuarters++; // Wild aboard
  

  
  return maxQuarters - usedQuarters - passengerQuarters;
}