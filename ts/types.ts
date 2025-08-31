// Space Trader TypeScript Types
// Based on the Palm Pilot C source code DataTypes.h and spacetrader.h

// Core Constants from spacetrader.h
export const MAXTRADEITEM = 10;
export const MAXCREWMEMBER = 31;
export const MAXSOLARSYSTEM = 120;
export const MAXWEAPON = 3;
export const MAXSHIELD = 3;
export const MAXGADGET = 3;
export const MAXCREW = 3;
export const MAXWORMHOLE = 6;
export const NAMELEN = 20;
export const MAXSHIPTYPE = 10;
export const MAXTECHLEVEL = 8;
export const MAXPOLITICS = 17;
export const MAXSIZE = 5;
export const MAXDIFFICULTY = 5;
export const MAXACTIVITY = 8;
export const MAXSTATUS = 8;
export const MAXSKILL = 10;

// Game Mode - represents what screen/state the game is in
export const GameMode = {
  InSpace: 0,     // Traveling between planets or in space
  OnPlanet: 1,    // Docked at a planet
  InCombat: 2,    // In combat encounter
} as const;

export type GameMode = typeof GameMode[keyof typeof GameMode];

// Trade Items (from spacetrader.h)
export const TradeItem = {
  Water: 0,
  Furs: 1,
  Food: 2,
  Ore: 3,
  Games: 4,
  Firearms: 5,
  Medicine: 6,
  Machinery: 7,
  Narcotics: 8,
  Robots: 9,
} as const;

export type TradeItem = typeof TradeItem[keyof typeof TradeItem];

// Difficulty Levels
export const Difficulty = {
  Beginner: 0,
  Easy: 1,
  Normal: 2,
  Hard: 3,
  Impossible: 4,
} as const;

export type Difficulty = typeof Difficulty[keyof typeof Difficulty];

// System Status
export const SystemStatus = {
  Uneventful: 0,
  War: 1,
  Plague: 2,
  Drought: 3,
  Boredom: 4,
  Cold: 5,
  CropFailure: 6,
  LackOfWorkers: 7,
} as const;

export type SystemStatus = typeof SystemStatus[keyof typeof SystemStatus];

// Skill Types
export const SkillType = {
  Pilot: 1,
  Fighter: 2,
  Trader: 3,
  Engineer: 4,
} as const;

export type SkillType = typeof SkillType[keyof typeof SkillType];

// Tech Level (0-8, where 8 is for special items)
export type TechLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// System Size (0-4)  
export type SystemSize = 0 | 1 | 2 | 3 | 4;

// Politics/Government (0-16)
export type PoliticsIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

// Fixed-length tuple types for arrays
export type TradeItemArray = readonly [number, number, number, number, number, number, number, number, number, number];
export type WeaponArray = readonly [number, number, number];
export type ShieldArray = readonly [number, number, number];
export type GadgetArray = readonly [number, number, number];
export type CrewArray = readonly [number, number, number];
export type WormholeArray = readonly [number, number, number, number, number, number];

// Static Data Structures from DataTypes.h

// Weapon Definition
export interface WeaponType {
  name: string;
  power: number;
  price: number;
  techLevel: TechLevel;
  chance: number; // Chance that this is fitted in a slot
}

// Shield Definition  
export interface ShieldType {
  name: string;
  power: number;
  price: number;
  techLevel: TechLevel;
  chance: number; // Chance that this is fitted in a slot
}

// Gadget Definition
export interface GadgetType {
  name: string;
  price: number;
  techLevel: TechLevel;
  chance: number; // Chance that this is fitted in a slot
}

// Ship Type Definition
export interface ShipType {
  name: string;
  cargoBays: number;
  weaponSlots: number;
  shieldSlots: number;
  gadgetSlots: number;
  crewQuarters: number;
  fuelTanks: number;
  minTechLevel: TechLevel;
  costOfFuel: number;
  price: number;
  bounty: number;
  occurrence: number; // Percentage of ships you meet
  hullStrength: number;
  police: number; // Encountered as police with at least this strength
  pirates: number; // Encountered as pirates
  traders: number; // Encountered as traders
  repairCosts: number; // Repair costs for 1 point of hull strength
  size: number; // Determines how easy it is to hit this ship
}

// Trade Item Definition
export interface TradeItemType {
  name: string;
  techProduction: TechLevel; // Tech level needed for production
  techUsage: TechLevel; // Tech level needed to use
  techTopProduction: TechLevel; // Tech level which produces this item the most
  priceLowTech: number; // Medium price at lowest tech level
  priceInc: number; // Price increase per tech level
  variance: number; // Max percentage above or below calculated price
  doublePriceStatus: SystemStatus; // Price increases considerably when this event occurs
  cheapResource: number; // When this resource is available, this trade item is cheap
  expensiveResource: number; // When this resource is available, this trade item is expensive
  minTradePrice: number; // Minimum price to buy/sell in orbit
  maxTradePrice: number; // Maximum price to buy/sell in orbit
  roundOff: number; // Roundoff price for trade in orbit
}

// Politics/Government Definition
export interface PoliticsType {
  name: string;
  reactionIllegal: number; // Reaction level of illegal goods (0 = total acceptance)
  strengthPolice: number; // Strength level of police force (0 = no police)
  strengthPirates: number; // Strength level of pirates (0 = no pirates)
  strengthTraders: number; // Strength level of traders (0 = no traders)
  minTechLevel: TechLevel; // Minimum tech level needed
  maxTechLevel: TechLevel; // Maximum tech level where this is found
  bribeLevel: number; // How easily someone can be bribed (0 = unbribeable)
  drugsOK: boolean; // Drugs can be traded
  firearmsOK: boolean; // Firearms can be traded
  wanted: TradeItem | -1; // Trade item requested in particular in this type of government (-1 = none)
}

// Ship Structure (player/opponent ships)
export interface Ship {
  type: number; // Index into ship types array
  cargo: TradeItemArray;
  weapon: WeaponArray; // -1 means no weapon installed
  shield: ShieldArray; // -1 means no shield installed
  shieldStrength: ShieldArray;
  gadget: GadgetArray; // -1 means no gadget installed  
  crew: CrewArray; // -1 means no crew member
  fuel: number;
  hull: number;
  tribbles: number;
}

// Crew Member
export interface CrewMember {
  nameIndex: number;
  pilot: number; // 0-10 skill level
  fighter: number; // 0-10 skill level  
  trader: number; // 0-10 skill level
  engineer: number; // 0-10 skill level
  curSystem: number; // Current system index
}

// Solar System
export interface SolarSystem {
  nameIndex: number;
  techLevel: TechLevel;
  politics: PoliticsIndex;
  status: SystemStatus;
  x: number; // 0-150 (GALAXYWIDTH)
  y: number; // 0-110 (GALAXYHEIGHT)
  specialResources: number;
  size: SystemSize;
  qty: TradeItemArray; // Quantities of trade items
  countDown: number;
  visited: boolean;
  special: number; // Special event index (-1 = none)
}

// Main Game State - based on SAVEGAMETYPE
export interface State {
  // Core player stats
  credits: number;
  debt: number;
  days: number;
  nameCommander: string;
  
  // Current location and travel
  warpSystem: number;
  selectedShipType: number;
  galacticChartSystem: number;
  
  // Trading prices
  buyPrice: TradeItemArray;
  sellPrice: TradeItemArray;
  buyingPrice: TradeItemArray;
  shipPrice: readonly number[]; // [MAXSHIPTYPE]
  
  // Combat and reputation
  policeKills: number;
  traderKills: number;
  pirateKills: number;
  policeRecordScore: number;
  reputationScore: number;
  
  // Settings and flags
  autoFuel: boolean;
  autoRepair: boolean;
  clicks: boolean;
  
  // Current encounter
  encounterType: number;
  raided: boolean;
  
  // Special quest statuses
  monsterStatus: number;
  dragonflyStatus: number;
  japoriDiseaseStatus: number;
  moonBought: boolean;
  monsterHull: number;
  jarekStatus: number;
  invasionStatus: number;
  experimentAndWildStatus: number;
  fabricRipProbability: number;
  veryRareEncounter: number;
  reactorStatus: number;
  scarabStatus: number;
  
  // UI state
  curForm: number;
  trackedSystem: number;
  showTrackedRange: boolean;
  trackAutoOff: boolean;
  
  // Game objects
  ship: Ship;
  opponent: Ship;
  mercenary: CrewMember[]; // [MAXCREWMEMBER+1]
  solarSystem: SolarSystem[]; // [MAXSOLARSYSTEM]
  
  // Equipment and features
  escapePod: boolean;
  insurance: boolean;
  noClaim: number;
  
  // User preferences
  inspected: boolean;
  alwaysIgnoreTraders: boolean;
  alwaysIgnorePolice: boolean;
  alwaysIgnorePirates: boolean;
  alwaysIgnoreTradeInOrbit: boolean;
  textualEncounters: boolean;
  continuous: boolean;
  attackFleeing: boolean;
  reserveMoney: boolean;
  priceDifferences: boolean;
  aplScreen: boolean;
  tribbleMessage: boolean;
  alwaysInfo: boolean;
  
  // Special items and features
  wormhole: WormholeArray;
  artifactOnBoard: boolean;
  alreadyPaidForNewspaper: boolean;
  
  // Game state
  difficulty: Difficulty;
  versionMajor: number;
  versionMinor: number;
  gameLoaded: boolean;
  
  // Shortcuts
  shortcut1: number;
  shortcut2: number;
  shortcut3: number;
  shortcut4: number;
  
  // Misc flags
  leaveEmpty: number;
  booleanCollection: number;
  litterWarning: boolean;
  sharePreferences: boolean;
  identifyStartup: boolean;
  rectangularButtonsOn: boolean;
  
  // Current game mode (our addition for managing UI state)
  currentMode: GameMode;
}