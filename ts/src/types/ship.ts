// Core ship and combat types for Space Trader

export const ShipType = {
  FLEA: 0,
  GNAT: 1,
  FIREFLY: 2,
  MOSQUITO: 3,
  BUMBLEBEE: 4,
  BEETLE: 5,
  HORNET: 6,
  GRASSHOPPER: 7,
  TERMITE: 8,
  WASP: 9,
  SPACEMONSTER: 10,
  DRAGONFLY: 11,
  MANTIS: 12,
  SCARAB: 13,
  BOTTLE: 14,
  LIGHTNING: 15,
} as const;

export type ShipType = typeof ShipType[keyof typeof ShipType];

export const Difficulty = {
  BEGINNER: 0,
  EASY: 1,
  NORMAL: 2,
  HARD: 3,
  IMPOSSIBLE: 4,
} as const;

export type Difficulty = typeof Difficulty[keyof typeof Difficulty];

export const EncounterType = {
  // Police encounters
  POLICE_IGNORE: 'POLICE_IGNORE',
  POLICE_INSPECT: 'POLICE_INSPECT',
  POLICE_ATTACK: 'POLICE_ATTACK',
  POLICE_FLEE: 'POLICE_FLEE',
  POLICE_SURRENDER: 'POLICE_SURRENDER',
  
  // Pirate encounters  
  PIRATE_IGNORE: 'PIRATE_IGNORE',
  PIRATE_ATTACK: 'PIRATE_ATTACK',
  PIRATE_FLEE: 'PIRATE_FLEE',
  PIRATE_SURRENDER: 'PIRATE_SURRENDER',
  
  // Trader encounters
  TRADER_IGNORE: 'TRADER_IGNORE',
  TRADER_ATTACK: 'TRADER_ATTACK',
  TRADER_FLEE: 'TRADER_FLEE',
  TRADER_SURRENDER: 'TRADER_SURRENDER',
  TRADER_BUY: 'TRADER_BUY',
  TRADER_SELL: 'TRADER_SELL',
  
  // Special encounters
  SPACE_MONSTER: 'SPACE_MONSTER',
  DRAGONFLY: 'DRAGONFLY',
  SCARAB: 'SCARAB',
  MANTIS: 'MANTIS',
  MARIE_CELESTE: 'MARIE_CELESTE',
  FAMOUS_CAPTAIN: 'FAMOUS_CAPTAIN',
  BOTTLE_GOOD: 'BOTTLE_GOOD',
  BOTTLE_OLD: 'BOTTLE_OLD',
  
  // Post-encounter states
  POLICEINSPECTION: 'POLICEINSPECTION',
  POSTMARIEPOLICEENCOUNTER: 'POSTMARIEPOLICEENCOUNTER',
  FAMOUSCAPATTACK: 'FAMOUSCAPATTACK',
  SPACEMONSTERATTACK: 'SPACEMONSTERATTACK',
  SPACEMONSTERIGNORE: 'SPACEMONSTERIGNORE',
  DRAGONFLYATTACK: 'DRAGONFLYATTACK',
  DRAGONFLYIGNORE: 'DRAGONFLYIGNORE',
  SCARABATTACK: 'SCARABATTACK',
  SCARABIGNORE: 'SCARABIGNORE',
} as const;

export type EncounterType = typeof EncounterType[keyof typeof EncounterType];

export const WeaponType = {
  PULSE_LASER: 0,
  BEAM_LASER: 1,
  MILITARY_LASER: 2,
  MORGAN_LASER: 3,
  PHOTON_DISRUPTOR: 4,
  QUANTUM_DISRUPTOR: 5,
} as const;

export type WeaponType = typeof WeaponType[keyof typeof WeaponType];

export const ShieldType = {
  ENERGY_SHIELD: 0,
  REFLECTIVE_SHIELD: 1,
  LIGHTNING_SHIELD: 2,
} as const;

export type ShieldType = typeof ShieldType[keyof typeof ShieldType];

export const Gadget = {
  CARGO_BAYS: 0,
  AUTO_REPAIR_SYSTEM: 1,
  NAVIGATING_SYSTEM: 2,
  TARGETING_SYSTEM: 3,
  CLOAKING_DEVICE: 4,
  FUEL_COMPACTOR: 5,
} as const;

export type Gadget = typeof Gadget[keyof typeof Gadget];

export interface Weapon {
  type: WeaponType;
  power: number;
}

export interface Shield {
  type: ShieldType;
  strength: number;
  maxStrength: number;
}

export interface CrewMember {
  pilot: number;
  fighter: number; 
  trader: number;
  engineer: number;
}

export interface Ship {
  type: ShipType;
  hull: number;
  maxHull: number;
  shields: Shield[];
  weapons: Weapon[];
  gadgets: Array<{ type: Gadget }>;
  crew: CrewMember[];
  fuel: number;
  cargo: number[];
  tribbles: number;
}

export interface CombatResult {
  playerHit: boolean;
  opponentHit: boolean;
  playerDamage: number;
  opponentDamage: number;
  playerShieldDamage: number;
  opponentShieldDamage: number;
  playerHullDamage: number;
  opponentHullDamage: number;
  playerDestroyed: boolean;
  opponentDestroyed: boolean;
}

export interface DamageResult {
  shieldDamage: number;
  hullDamage: number;
  totalDamage: number;
}

export interface EncounterContext {
  difficulty: Difficulty;
  systemStrengths: {
    pirates: number;
    police: number;
    traders: number;
  };
  playerReputation: number;
  policeRecord: number;
  hasArtifact: boolean;
  isRaided: boolean;
  isInspected: boolean;
  wildStatus: number;
  reactorStatus: number;
}

export interface OpponentShip extends Ship {
  encounterType: EncounterType;
  originalHull: number;
}

export interface TravelState {
  clicks: number;
  startingClicks: number;
  currentSystem: string;
  targetSystem: string;
  encountersEnabled: boolean;
  autoRepair: boolean;
}

export interface SpecialEncounterState {
  monsterStatus: number;
  monsterHull: number;
  scarabStatus: number;
  dragonflyStatus: number;
  arrivedViaWormhole: boolean;
  days: number;
  veryRareEncounterFlags: number;
  jarekStatus: number;
  wildStatus: number;
  artifactOnBoard: boolean;
  reactorStatus: number;
  experimentStatus: number;
  fabricRipProbability: number;
  invasionStatus: number;
}

export interface EscapePodResult {
  survived: boolean;
  effectsApplied: string[];
  creditsLost: number;
  newShipType?: ShipType;
  daysAdvanced: number;
}

export interface ArrestResult {
  fine: number;
  imprisonment: number;
  finalCredits: number;
  effectsApplied: string[];
}

export interface TravelCosts {
  fuel: number;
  mercenaryPayment: number;
  wormholeTax: number;
  insurance: number;
  interestPayment: number;
  total: number;
}

export interface PoliticalSystem {
  name: string;
  strengthPirates: number;
  strengthPolice: number;
  strengthTraders: number;
  bribeLevel: number;
  drugsOK: boolean;
  firearmsOK: boolean;
  wanted: number; // Trade good index
}

export interface TradeGood {
  name: string;
  techProduction: number;
  techUsage: number;
  priceLowTech: number;
  priceInc: number;
  variance: number;
  doublePriceStatus: number;
  cheapResource: number;
  expensiveResource: number;
  techTopProduction: number;
}

// Constants from the original game
export const MAXSKILL = 10;
export const SKILLBONUS = 2;
export const CLOAKBONUS = 5;
export const MAXWEAPON = 3;
export const MAXSHIELD = 3;
export const MAXGADGET = 3;
export const MAXCREW = 4;
export const MAXTRADEITEM = 10;

// Police record score constants
export const PSYCHOPATHSCORE = -100;
export const VILLAINSCORE = -70;
export const CRIMINALSCORE = -30;
export const DUBIOUSSCORE = -10;
export const CLEANSCORE = 10;
export const LAWFULSCORE = 30;

// Reputation score constants  
export const HARMLESSSCORE = 0;
export const MOSTLYHARMLESSSCORE = 100;
export const POORSCORE = 200;
export const AVERAGESCORE = 400;
export const ABOVEAVERAGESCORE = 800;
export const COMPETENTSCORE = 1600;
export const DANGEROUSSCORE = 3200;
export const DEADLYSCORE = 6400;
export const ELITESCORE = 12800;

// Ship type data
export const SHIP_DATA = {
  [ShipType.FLEA]: {
    name: 'Flea',
    size: 0,
    cargoBays: 10,
    weaponSlots: 0,
    shieldSlots: 0,
    gadgetSlots: 0,
    crewQuarters: 1,
    fuelTanks: 20,
    hullStrength: 25,
    police: -1,
    pirates: -1,
    traders: -1,
    occurrence: 2
  },
  [ShipType.GNAT]: {
    name: 'Gnat',
    size: 1,
    cargoBays: 15,
    weaponSlots: 1,
    shieldSlots: 0,
    gadgetSlots: 1,
    crewQuarters: 1,
    fuelTanks: 14,
    hullStrength: 100,
    police: 0,
    pirates: 0,
    traders: 0,
    occurrence: 28
  },
  // ... other ships would follow
} as const;

// Weapon data
export const WEAPON_DATA = {
  [WeaponType.PULSE_LASER]: {
    name: 'Pulse laser',
    power: 15,
    techLevel: 5,
    chance: 50
  },
  [WeaponType.BEAM_LASER]: {
    name: 'Beam laser', 
    power: 25,
    techLevel: 6,
    chance: 35
  },
  [WeaponType.MILITARY_LASER]: {
    name: 'Military laser',
    power: 35,
    techLevel: 7,
    chance: 15
  },
  // ... other weapons
} as const;

// Shield data
export const SHIELD_DATA = {
  [ShieldType.ENERGY_SHIELD]: {
    name: 'Energy shield',
    power: 100,
    techLevel: 5,
    chance: 50
  },
  [ShieldType.REFLECTIVE_SHIELD]: {
    name: 'Reflective shield',
    power: 200,
    techLevel: 6,
    chance: 35  
  },
  [ShieldType.LIGHTNING_SHIELD]: {
    name: 'Lightning shield',
    power: 350,
    techLevel: 7,
    chance: 15
  }
} as const;
