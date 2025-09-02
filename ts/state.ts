// Space Trader Game State Implementation
import type { 
  State, 
  Ship, 
  CrewMember, 
  SolarSystem, 
  GameMode
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
import { getShipType } from './data/shipTypes.ts';

// Create an empty ship with default values
export function createEmptyShip(): Ship {
  return {
    type: 0,
    cargo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as TradeItemArray,
    weapon: [-1, -1, -1] as WeaponArray, // -1 means no weapon installed
    shield: [-1, -1, -1] as ShieldArray, // -1 means no shield installed
    shieldStrength: [0, 0, 0] as ShieldArray,
    gadget: [-1, -1, -1] as GadgetArray, // -1 means no gadget installed
    crew: [-1, -1, -1] as CrewArray, // -1 means no crew member
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
    qty: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as TradeItemArray,
    countDown: 0,
    visited: false,
    special: -1, // -1 means no special event
  };
}

// Create initial/default game state
export function createInitialState(): State {
  // Generate the galaxy with a fixed seed for consistent testing
  const galaxySystems = generateRandomSolarSystems(12345);
  
  // Create starting ship with proper fuel
  const startingShip = createEmptyShip();
  const shipType = getShipType(0); // Gnat
  startingShip.fuel = shipType.fuelTanks; // Start with full fuel
  startingShip.hull = shipType.hullStrength; // Start with full hull
  
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
    buyPrice: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as TradeItemArray,
    sellPrice: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as TradeItemArray,
    buyingPrice: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as TradeItemArray,
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
    clicks: true,
    
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
    
    // UI state
    curForm: 0,
    trackedSystem: -1,
    showTrackedRange: true, // From Palm OS ShowTrackedRange default
    trackAutoOff: true, // From Palm OS TrackAutoOff default
    
    // Game objects
    ship: startingShip,
    opponent: createEmptyShip(),
    mercenary: Array.from({ length: MAXCREWMEMBER + 1 }, () => createEmptyCrewMember()),
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
    
    // Special items and features
    wormhole: [0, 0, 0, 0, 0, 0] as WormholeArray,
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
  };
}

// Helper function to deep clone state for immutable updates
export function cloneState(state: State): State {
  return JSON.parse(JSON.stringify(state));
}