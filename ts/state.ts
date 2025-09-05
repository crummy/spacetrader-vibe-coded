// Space Trader Game State Implementation
import type { 
  State, 
  Ship, 
  CrewMember, 
  SolarSystem, 
  GameMode,
  DebugConfig,
  MutableTradeItemArray,
  MutableWeaponArray,
  MutableShieldArray,
  MutableGadgetArray,
  MutableCrewArray
} from './types.ts';

import {
  MAXTRADEITEM,
  MAXCREWMEMBER,  
  MAXSOLARSYSTEM,
  MAXWEAPON,
  MAXSHIELD,
  MAXGADGET,
  MAXCREW,
  MAXWORMHOLE,
  NAMELEN,
  MAXSHIPTYPE,
  GameMode as GameModeValues,
  Difficulty,
  SystemStatus
} from './types.ts';

import type {
  TradeItemArray,
  WeaponArray,
  ShieldArray,
  GadgetArray,
  CrewArray,
  WormholeArray
} from './types.ts';

import { generateRandomSolarSystems } from './data/systems.ts';
import { createCommander, createRandomCrewMember } from './data/crew.ts';
import { getShipType } from './data/shipTypes.ts';
import { getTradeItem } from './data/tradeItems.ts';
import { getPoliticalSystem } from './data/politics.ts';

// Create an empty ship with default values
export function createEmptyShip(): Ship {
  return {
    type: 0,
    cargo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as MutableTradeItemArray,
    weapon: [-1, -1, -1] as MutableWeaponArray, // -1 means no weapon installed
    shield: [-1, -1, -1] as MutableShieldArray, // -1 means no shield installed
    shieldStrength: [0, 0, 0] as MutableShieldArray,
    gadget: [-1, -1, -1] as MutableGadgetArray, // -1 means no gadget installed
    crew: [-1, -1, -1] as MutableCrewArray, // -1 means no crew member
    fuel: 0,
    hull: 0,
    tribbles: 0,
  };
}

// Create an empty crew member
export function createEmptyCrewMember(): CrewMember {
  return {
    nameIndex: 0,
    pilot: 0,
    fighter: 0,
    trader: 0,
    engineer: 0,
    curSystem: 0,
  };
}

/**
 * Initialize all mercenaries with commander at index 0 and random mercenaries for the rest
 */
function initializeMercenaries(): CrewMember[] {
  const mercenaries: CrewMember[] = [];
  
  // Index 0 is always the commander
  mercenaries[0] = createCommander();
  
  // Initialize regular mercenaries (indices 1 to MAXCREWMEMBER-1)
  for (let i = 1; i < MAXCREWMEMBER; i++) {
    // Place each mercenary in a random system
    const randomSystem = Math.floor(Math.random() * MAXSOLARSYSTEM);
    mercenaries[i] = createRandomCrewMember(i, randomSystem);
  }
  
  // Index MAXCREWMEMBER (31) is for special mercenaries like Jarek/Wild
  // Initialize it as empty for now
  mercenaries[MAXCREWMEMBER] = createEmptyCrewMember();
  
  return mercenaries;
}

// Create an empty solar system
export function createEmptySolarSystem(): SolarSystem {
  return {
    nameIndex: 0,
    techLevel: 0,
    politics: 0,
    status: SystemStatus.Uneventful,
    x: 0,
    y: 0,
    specialResources: 0,
    size: 0,
    qty: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as MutableTradeItemArray,
    countDown: 0,
    visited: false,
    special: -1, // -1 means no special event
  };
}

// Initialize trade item quantities for a system (port of Palm OS InitializeTradeitems)
function initializeTradeItems(system: SolarSystem): void {
  for (let i = 0; i < MAXTRADEITEM; i++) {
    const tradeItem = getTradeItem(i);
    const politics = getPoliticalSystem(system.politics);
    
    // Check restrictions (narcotics/firearms and tech level)
    if ((i === 8 && !politics.drugsOK) || // Narcotics  
        (i === 5 && !politics.firearmsOK) || // Firearms
        system.techLevel < tradeItem.techProduction) {
      system.qty[i] = 0;
      continue;
    }
    
    // Calculate quantity based on tech level and system size
    const baseQuantity = 9 + Math.floor(Math.random() * 5); // 9-13
    const techDiff = Math.abs(tradeItem.techTopProduction - system.techLevel);
    const sizeBonus = 1 + system.size;
    
    system.qty[i] = Math.max(0, (baseQuantity - techDiff) * sizeBonus);
  }
}

// Create initial/default game state
export function createInitialState(): State {
  // Generate the galaxy with a fixed seed for consistent testing
  const galaxySystems = generateRandomSolarSystems(12345);
  
  // Initialize trade items for all systems
  galaxySystems.forEach(system => initializeTradeItems(system));
  
  // Create starting ship with proper fuel
  const startingShip = createEmptyShip();
  startingShip.type = 1; // Gnat (starting ship type from Palm OS Traveler.c line 1674)
  const shipType = getShipType(1); // Gnat
  startingShip.fuel = shipType.fuelTanks; // Start with full fuel (matches Palm OS original)
  startingShip.hull = shipType.hullStrength; // Start with full hull
  
  // Player starts with commander as crew member
  startingShip.crew[0] = 0; // Commander is always mercenary index 0
  
  // Player starts with a basic weapon (Pulse Laser - index 0) per Palm OS Traveler.c line 1677
  startingShip.weapon[0] = 0; // Pulse Laser
  
  return {
    // Core player stats
    credits: 1000, // Starting credits (based on Palm original)
    debt: 0,
    days: 0,
    nameCommander: "Commander",
    
    // Commander skills (starting values from Palm OS)
    commanderPilot: 1,
    commanderFighter: 1, 
    commanderTrader: 1,
    commanderEngineer: 1,
    
    // Current location and travel
    currentSystem: 0, // Sol system (home) 
    warpSystem: 0, // Sol system (home)
    selectedShipType: 0, // Gnat (starting ship)
    galacticChartSystem: 0, // Initialize to current system
    
    // Trading prices - initialized to 0, will be calculated
    buyPrice: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    sellPrice: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    buyingPrice: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    shipPrice: new Array(MAXSHIPTYPE).fill(0), // Will be calculated
    
    // Combat and reputation
    policeKills: 0,
    traderKills: 0,
    pirateKills: 0,
    policeRecordScore: 0, // Clean record
    reputationScore: 0, // Harmless
    
    // Settings and flags
    autoFuel: true,
    autoRepair: true,
    clicks: 0, // Travel distance from target system, 0 = arrived
    
    // Current encounter
    encounterType: 0,
    raided: false,
    
    // Special quest statuses
    monsterStatus: 0,
    dragonflyStatus: 0,
    japoriDiseaseStatus: 0,
    moonBought: false,
    monsterHull: 0,
    jarekStatus: 0,
    invasionStatus: 0,
    experimentAndWildStatus: 0,
    fabricRipProbability: 25, // From constants
    veryRareEncounter: 0,
    reactorStatus: 0,
    scarabStatus: 0,
    
    // Additional quest statuses (aliases for compatibility)
    wildStatus: 0,
    spacemonsterStatus: 0,
    
    // UI state
    curForm: 0,
    trackedSystem: -1,
    showTrackedRange: true, // From Palm OS ShowTrackedRange default
    trackAutoOff: true, // From Palm OS TrackAutoOff default
    
    // Game objects
    ship: startingShip,
    opponent: createEmptyShip(),
    mercenary: initializeMercenaries(),
    solarSystem: galaxySystems,
    
    // Equipment and features
    escapePod: false,
    insurance: false,
    noClaim: 0,
    
    // User preferences  
    inspected: false,
    alwaysIgnoreTraders: false,
    alwaysIgnorePolice: false,
    alwaysIgnorePirates: false,
    alwaysIgnoreTradeInOrbit: false,
    textualEncounters: false,
    continuous: false,
    attackFleeing: false,
    reserveMoney: false,
    priceDifferences: true,
    aplScreen: false,
    tribbleMessage: false,
    alwaysInfo: false,
    
    // Additional auto-flight preferences (Palm OS defaults)
    autoAttack: false,           // Auto-attack during combat
    autoFlee: false,             // Auto-flee from combat
    useHWButtons: false,         // Hardware button shortcuts
    newsAutoPay: false,          // Auto-pay for newspapers
    remindLoans: true,           // Loan reminder system
    canSuperWarp: false,         // Portable Singularity capability
    attackIconStatus: false,     // Show attack indicators
    possibleToGoThroughRip: false, // Space-time rip travel
    justLootedMarie: false,      // Marie Celeste loot flag
    arrivedViaWormhole: false,   // Wormhole arrival tracking
    
    // Special items and features
    wormhole: [0, 0, 0, 0, 0, 0],
    artifactOnBoard: false,
    alreadyPaidForNewspaper: false,
    
    // Game state
    difficulty: Difficulty.Easy,
    versionMajor: 1,
    versionMinor: 2,
    gameLoaded: false,
    
    // Shortcuts
    shortcut1: -1,
    shortcut2: -1,
    shortcut3: -1,
    shortcut4: -1,
    
    // Misc flags
    leaveEmpty: 0,
    booleanCollection: 0,
    litterWarning: false,
    sharePreferences: false,
    identifyStartup: false,
    rectangularButtonsOn: false,
    
    // Current game mode (our addition)
    currentMode: GameModeValues.OnPlanet, // Start docked at Sol
    
    // Debug configuration (initialize disabled)
    debug: {
      enabled: false,
      log: {
        actions: false,
        encounters: false,
        travel: false,
        economy: false,
        combat: false,
      }
    }
  };
}

// Helper function to deep clone state for immutable updates
export function cloneState(state: State): State {
  return JSON.parse(JSON.stringify(state));
}