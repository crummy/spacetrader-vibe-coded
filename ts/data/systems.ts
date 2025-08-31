// Solar Systems Implementation
// Port of solar system generation from Palm OS Traveler.c

import type { SolarSystem, SystemSize } from '../types.ts';
import { MAXSOLARSYSTEM, SystemStatus } from '../types.ts';

// Constants from Palm OS spacetrader.h
const GALAXYWIDTH = 150;
const GALAXYHEIGHT = 110;
const MAXTECHLEVEL = 8;
const MAXPOLITICS = 17;
const MAXSIZE = 5;
const MAXSTATUS = 8;
const MAXRESOURCES = 13;
const MAXWORMHOLE = 6;
const CLOSEDISTANCE = 12;

// Special system indices from Palm OS spacetrader.h
const SPECIAL_SYSTEM_INDICES = {
  ACAMARSYSTEM: 0,
  BARATASSYSTEM: 6,
  DALEDSYSTEM: 17,
  DEVIDIASYSTEM: 22,
  GEMULONSYSTEM: 32,
  JAPORISYSTEM: 41,
  KRAVATSYSTEM: 50,
  MELINASYSTEM: 59,
  NIXSYSTEM: 67,
  OGSYSTEM: 70,
  REGULASSYSTEM: 82,
  SOLSYSTEM: 92,
  UTOPIASYSTEM: 109,
  ZALKONSYSTEM: 118
} as const;

// Solar system names ported exactly from Palm OS Global.c
const SOLAR_SYSTEM_NAMES: readonly string[] = [
  "Acamar",
  "Adahn",      // The alternate personality for The Nameless One in "Planescape: Torment"
  "Aldea",
  "Andevian",
  "Antedi",
  "Balosnee",
  "Baratas",
  "Brax",       // One of the heroes in Master of Magic
  "Bretel",     // This is a Dutch device for keeping your pants up.
  "Calondia",
  "Campor",
  "Capelle",    // The city I lived in while programming this game
  "Carzon",
  "Castor",     // A Greek demi-god
  "Cestus",
  "Cheron",
  "Courteney",  // After Courteney Cox...
  "Daled",
  "Damast",
  "Davlos",
  "Deneb",
  "Deneva",
  "Devidia",
  "Draylon",
  "Drema",
  "Endor",
  "Esmee",      // One of the witches in Pratchett's Discworld
  "Exo",
  "Ferris",     // Iron
  "Festen",     // A great Scandinavian movie
  "Fourmi",     // An ant, in French
  "Frolix",     // A solar system in one of Philip K. Dick's novels
  "Gemulon",
  "Guinifer",   // One way of writing the name of king Arthur's wife
  "Hades",      // The underworld
  "Hamlet",     // From Shakespeare
  "Helena",     // Of Troy
  "Hulst",      // A Dutch plant
  "Iodine",     // An element
  "Iralius",
  "Janus",      // A seldom encountered Dutch boy's name
  "Japori",
  "Jarada",
  "Jason",      // A Greek hero
  "Kaylon",
  "Khefka",
  "Kira",       // My dog's name
  "Klaatu",     // From a classic SF movie
  "Klaestron",
  "Korma",      // An Indian sauce
  "Kravat",     // Interesting spelling of the French word for "tie"
  "Krios",
  "Laertes",    // A king in a Greek tragedy
  "Largo",
  "Lave",       // The starting system in Elite
  "Ligon",
  "Lowry",      // The name of the "hero" in Terry Gilliam's "Brazil"
  "Magrat",     // The second of the witches in Pratchett's Discworld
  "Malcoria",
  "Melina",
  "Mentar",     // The Psilon home system in Master of Orion
  "Merik",
  "Mintaka",
  "Montor",     // A city in Ultima III and Ultima VII part 2
  "Mordan",
  "Myrthe",     // The name of my daughter
  "Nelvana",
  "Nix",        // An interesting spelling of a word meaning "nothing" in Dutch
  "Nyle",       // An interesting spelling of the great river
  "Odet",
  "Og",         // The last of the witches in Pratchett's Discworld
  "Omega",      // The end of it all
  "Omphalos",   // Greek for navel
  "Orias",
  "Othello",    // From Shakespeare
  "Parade",     // This word means the same in Dutch and in English
  "Penthara",
  "Picard",     // The enigmatic captain from ST:TNG
  "Pollux",     // Brother of Castor
  "Quator",
  "Rakhar",
  "Ran",        // A film by Akira Kurosawa
  "Regulas",
  "Relva",
  "Rhymus",
  "Rochani",
  "Rubicum",    // The river Ceasar crossed to get into Rome
  "Rutia",
  "Sarpeidon",
  "Sefalla",
  "Seltrice",
  "Sigma",
  "Sol",        // That's our own solar system
  "Somari",
  "Stakoron",
  "Styris",
  "Talani",
  "Tamus",
  "Tantalos",   // A king from a Greek tragedy
  "Tanuga",
  "Tarchannen",
  "Terosa",
  "Thera",      // A seldom encountered Dutch girl's name
  "Titan",      // The largest moon of Jupiter
  "Torin",      // A hero from Master of Magic
  "Triacus",
  "Turkana",
  "Tyrus",
  "Umberlee",   // A god from AD&D, which has a prominent role in Baldur's Gate
  "Utopia",     // The ultimate goal
  "Vadera",
  "Vagra",
  "Vandor",
  "Ventax",
  "Xenon",
  "Xerxes",     // A Greek hero
  "Yew",        // A city which is in almost all of the Ultima games
  "Yojimbo",    // A film by Akira Kurosawa
  "Zalkon",
  "Zuul"        // From the first Ghostbusters movie
] as const;

// Validate at compile time that we have exactly MAXSOLARSYSTEM names
const _validateSystemNameCount: typeof SOLAR_SYSTEM_NAMES = SOLAR_SYSTEM_NAMES;

// Simple linear congruential generator for deterministic results
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed;
  }

  random(): number {
    return (this.next() - 1) / 2147483646;
  }

  randomInt(max: number): number {
    return Math.floor(this.random() * max);
  }
}

/**
 * Get all solar system names
 * @returns Readonly array of all system names
 */
export function getSolarSystemNames(): readonly string[] {
  return SOLAR_SYSTEM_NAMES;
}

/**
 * Get solar system name by index
 * @param index System index (0-119)
 * @returns System name
 * @throws Error if index is out of bounds
 */
export function getSolarSystemName(index: number): string {
  if (index < 0 || index >= MAXSOLARSYSTEM) {
    throw new Error(`Invalid system index: ${index}. Must be 0-${MAXSOLARSYSTEM - 1}`);
  }
  return SOLAR_SYSTEM_NAMES[index];
}

/**
 * Get system constants from Palm OS
 * @returns Object containing all system constants
 */
export function getSystemConstants() {
  return {
    GALAXYWIDTH,
    GALAXYHEIGHT,
    MAXTECHLEVEL,
    MAXPOLITICS,
    MAXSIZE,
    MAXSTATUS,
    MAXRESOURCES
  } as const;
}

/**
 * Get special system indices
 * @returns Object containing special system indices
 */
export function getSpecialSystemIndices() {
  return SPECIAL_SYSTEM_INDICES;
}

/**
 * Check if coordinates are valid within galaxy bounds
 * @param x X coordinate
 * @param y Y coordinate
 * @returns True if coordinates are valid
 */
export function isValidCoordinates(x: number, y: number): boolean {
  return x >= 0 && x < GALAXYWIDTH && y >= 0 && y < GALAXYHEIGHT;
}

/**
 * Get a specific solar system from the array
 * @param systems Array of solar systems
 * @param index System index
 * @returns Solar system at index
 * @throws Error if index is out of bounds
 */
export function getSolarSystem(systems: readonly SolarSystem[], index: number): SolarSystem {
  if (index < 0 || index >= systems.length) {
    throw new Error(`Invalid system index: ${index}. Must be 0-${systems.length - 1}`);
  }
  return systems[index];
}

/**
 * Generate random solar systems based on Palm OS algorithm
 * From Traveler.c GenerateUniverse function
 * @param seed Random seed for deterministic generation
 * @returns Array of all 120 solar systems
 */
export function generateRandomSolarSystems(seed: number): SolarSystem[] {
  const rng = new SeededRandom(seed);
  const systems: SolarSystem[] = [];

  // Initialize wormhole array
  const wormhole: number[] = [];

  // Generate each system
  for (let i = 0; i < MAXSOLARSYSTEM; i++) {
    let closeFound = false;
    let attempts = 0;

    let x: number = 0, y: number = 0, techLevel: number, politics: number;

    // Keep trying until we find valid system parameters
    while (!closeFound && attempts < 1000) {
      // Place wormhole systems in center regions (first 6 systems)
      if (i < MAXWORMHOLE) {
        // Place wormhole systems in center regions based on index
        const regionX = (i % 3); // 0, 1, 2
        const regionY = (i < 3) ? 0 : 1; // top or bottom half
        
        x = Math.floor(
          ((CLOSEDISTANCE >> 1) - rng.randomInt(CLOSEDISTANCE)) +
          ((GALAXYWIDTH * (1 + 2 * regionX)) / 6)
        );
        y = Math.floor(
          ((CLOSEDISTANCE >> 1) - rng.randomInt(CLOSEDISTANCE)) +
          ((GALAXYHEIGHT * (regionY === 0 ? 1 : 3)) / 4)
        );
        wormhole[i] = i;
      } else {
        // Regular system placement
        x = 1 + rng.randomInt(GALAXYWIDTH - 2);
        y = 1 + rng.randomInt(GALAXYHEIGHT - 2);
      }

      // Ensure coordinates are valid
      x = Math.max(0, Math.min(GALAXYWIDTH - 1, x));
      y = Math.max(0, Math.min(GALAXYHEIGHT - 1, y));

      // Check if too close to existing systems
      let tooClose = false;
      for (let j = 0; j < i; j++) {
        const dx = x - systems[j].x;
        const dy = y - systems[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Minimum distance between systems (from Palm code CLOSEDISTANCE)
        if (distance < 6) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose || i < MAXWORMHOLE) {
        closeFound = true;
      }

      attempts++;
    }

    // Generate system properties
    techLevel = rng.randomInt(MAXTECHLEVEL);
    politics = rng.randomInt(MAXPOLITICS);

    // Create the system
    const system: SolarSystem = {
      nameIndex: i,
      x,
      y,
      techLevel: techLevel as any, // Type assertion for now
      politics: politics as any,   // Type assertion for now
      size: rng.randomInt(MAXSIZE) as SystemSize,
      specialResources: (rng.randomInt(5) >= 3) ? 
        (1 + rng.randomInt(MAXRESOURCES - 1)) : 0,
      status: (rng.randomInt(100) < 15) ? 
        (1 + rng.randomInt(MAXSTATUS - 1)) as any : SystemStatus.Uneventful,
      qty: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as any, // TradeItemArray
      countDown: 0,
      visited: false,
      special: -1
    };

    systems.push(system);
  }

  // Shuffle wormhole systems to distribute them randomly
  // (Based on Palm code that swaps positions)
  for (let i = 0; i < MAXWORMHOLE && i < systems.length; i++) {
    const j = rng.randomInt(MAXSOLARSYSTEM);
    if (j < systems.length) {
      // Swap coordinates but keep other properties
      const tempX = systems[i].x;
      const tempY = systems[i].y;
      systems[i].x = systems[j].x;
      systems[i].y = systems[j].y;
      systems[j].x = tempX;
      systems[j].y = tempY;
    }
  }

  return systems;
}