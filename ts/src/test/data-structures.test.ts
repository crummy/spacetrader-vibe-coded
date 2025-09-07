import { describe, test } from 'node:test';
import { strict as assert } from 'node:assert';
import { SYSTEM_CONSTANTS } from './system-constants.test.ts';

// Data structure interfaces based on DataTypes.h
export interface Ship {
  type: number;
  cargo: number[];
  weapon: number[];
  shield: number[];
  shieldStrength: number[];
  gadget: number[];
  crew: number[];
  fuel: number;
  hull: number;
  tribbles: number;
  forFutureUse: number[];
}

export interface CrewMember {
  nameIndex: number;
  pilot: number;
  fighter: number;
  trader: number;
  engineer: number;
  curSystem: number;
}

export interface SolarSystem {
  nameIndex: number;
  techLevel: number;
  politics: number;
  status: number;
  x: number;
  y: number;
  specialResources: number;
  size: number;
  qty: number[];
  countDown: number;
  visited: boolean;
  special: number;
}

export interface TradeItem {
  name: string;
  techProduction: number;
  techUsage: number;
  techTopProduction: number;
  priceLowTech: number;
  priceInc: number;
  variance: number;
  doublePriceStatus: number;
  cheapResource: number;
  expensiveResource: number;
  minTradePrice: number;
  maxTradePrice: number;
  roundOff: number;
}

export interface ShipType {
  name: string;
  cargoBays: number;
  weaponSlots: number;
  shieldSlots: number;
  gadgetSlots: number;
  crewQuarters: number;
  fuelTanks: number;
  minTechLevel: number;
  costOfFuel: number;
  price: number;
  bounty: number;
  occurrence: number;
  hullStrength: number;
  police: number;
  pirates: number;
  traders: number;
  repairCosts: number;
  size: number;
}

export interface Politics {
  name: string;
  reactionIllegal: number;
  strengthPolice: number;
  strengthPirates: number;
  strengthTraders: number;
  minTechLevel: number;
  maxTechLevel: number;
  bribeLevel: number;
  drugsOK: boolean;
  firearmsOK: boolean;
  wanted: number;
}

export interface PoliceRecord {
  name: string;
  minScore: number;
}

export interface Reputation {
  name: string;
  minScore: number;
}

export interface Politics {
  name: string;
  reactionIllegal: number;
  strengthPolice: number;
  strengthPirates: number;
  strengthTraders: number;
  minTechLevel: number;
  maxTechLevel: number;
  bribeLevel: number;
  drugsOK: boolean;
  firearmsOK: boolean;
  wanted: number;
}

// Validation functions for data structures
export function isValidShip(ship: Ship): string[] {
  const errors: string[] = [];
  
  // Type validation
  if (!Number.isInteger(ship.type) || ship.type < 0) {
    errors.push('Ship type must be a non-negative integer');
  }
  
  // Cargo validation
  if (!Array.isArray(ship.cargo) || ship.cargo.length !== SYSTEM_CONSTANTS.MAXTRADEITEM) {
    errors.push(`Cargo array must have exactly ${SYSTEM_CONSTANTS.MAXTRADEITEM} elements`);
  } else {
    ship.cargo.forEach((qty, i) => {
      if (!Number.isInteger(qty) || qty < 0) {
        errors.push(`Cargo[${i}] must be a non-negative integer`);
      }
    });
  }
  
  // Weapon validation
  if (!Array.isArray(ship.weapon) || ship.weapon.length !== SYSTEM_CONSTANTS.MAXWEAPON) {
    errors.push(`Weapon array must have exactly ${SYSTEM_CONSTANTS.MAXWEAPON} elements`);
  } else {
    ship.weapon.forEach((weaponId, i) => {
      if (!Number.isInteger(weaponId) || (weaponId !== -1 && weaponId < 0)) {
        errors.push(`Weapon[${i}] must be -1 or a non-negative integer`);
      }
    });
  }
  
  // Shield validation
  if (!Array.isArray(ship.shield) || ship.shield.length !== SYSTEM_CONSTANTS.MAXSHIELD) {
    errors.push(`Shield array must have exactly ${SYSTEM_CONSTANTS.MAXSHIELD} elements`);
  } else {
    ship.shield.forEach((shieldId, i) => {
      if (!Number.isInteger(shieldId) || (shieldId !== -1 && shieldId < 0)) {
        errors.push(`Shield[${i}] must be -1 or a non-negative integer`);
      }
    });
  }
  
  // Shield strength validation
  if (!Array.isArray(ship.shieldStrength) || ship.shieldStrength.length !== SYSTEM_CONSTANTS.MAXSHIELD) {
    errors.push(`ShieldStrength array must have exactly ${SYSTEM_CONSTANTS.MAXSHIELD} elements`);
  } else {
    ship.shieldStrength.forEach((strength, i) => {
      if (!Number.isInteger(strength) || strength < 0) {
        errors.push(`ShieldStrength[${i}] must be a non-negative integer`);
      }
    });
  }
  
  // Gadget validation
  if (!Array.isArray(ship.gadget) || ship.gadget.length !== SYSTEM_CONSTANTS.MAXGADGET) {
    errors.push(`Gadget array must have exactly ${SYSTEM_CONSTANTS.MAXGADGET} elements`);
  } else {
    ship.gadget.forEach((gadgetId, i) => {
      if (!Number.isInteger(gadgetId) || (gadgetId !== -1 && gadgetId < 0)) {
        errors.push(`Gadget[${i}] must be -1 or a non-negative integer`);
      }
    });
  }
  
  // Crew validation
  if (!Array.isArray(ship.crew) || ship.crew.length !== SYSTEM_CONSTANTS.MAXCREW) {
    errors.push(`Crew array must have exactly ${SYSTEM_CONSTANTS.MAXCREW} elements`);
  } else {
    ship.crew.forEach((crewId, i) => {
      if (!Number.isInteger(crewId) || (crewId !== -1 && crewId < 0)) {
        errors.push(`Crew[${i}] must be -1 or a non-negative integer`);
      }
    });
  }
  
  // Fuel validation
  if (!Number.isInteger(ship.fuel) || ship.fuel < 0) {
    errors.push('Fuel must be a non-negative integer');
  }
  
  // Hull validation
  if (!Number.isInteger(ship.hull) || ship.hull < 0) {
    errors.push('Hull must be a non-negative integer');
  }
  
  // Tribbles validation
  if (!Number.isInteger(ship.tribbles) || ship.tribbles < 0 || ship.tribbles > SYSTEM_CONSTANTS.MAXTRIBBLES) {
    errors.push(`Tribbles must be between 0 and ${SYSTEM_CONSTANTS.MAXTRIBBLES}`);
  }
  
  return errors;
}

export function isValidSolarSystem(system: SolarSystem): string[] {
  const errors: string[] = [];
  
  // Name index validation
  if (!Number.isInteger(system.nameIndex) || system.nameIndex < 0) {
    errors.push('NameIndex must be a non-negative integer');
  }
  
  // Tech level validation
  if (!Number.isInteger(system.techLevel) || system.techLevel < 0 || system.techLevel > 7) {
    errors.push('TechLevel must be between 0 and 7');
  }
  
  // Politics validation
  if (!Number.isInteger(system.politics) || system.politics < 0 || system.politics > 16) {
    errors.push('Politics must be between 0 and 16');
  }
  
  // Status validation
  if (!Number.isInteger(system.status) || system.status < 0 || system.status > 7) {
    errors.push('Status must be between 0 and 7');
  }
  
  // Coordinate validation
  if (!Number.isInteger(system.x) || system.x < 0 || system.x >= SYSTEM_CONSTANTS.GALAXYWIDTH) {
    errors.push(`X coordinate must be between 0 and ${SYSTEM_CONSTANTS.GALAXYWIDTH - 1}`);
  }
  
  if (!Number.isInteger(system.y) || system.y < 0 || system.y >= SYSTEM_CONSTANTS.GALAXYHEIGHT) {
    errors.push(`Y coordinate must be between 0 and ${SYSTEM_CONSTANTS.GALAXYHEIGHT - 1}`);
  }
  
  // Special resources validation
  if (!Number.isInteger(system.specialResources) || system.specialResources < 0 || system.specialResources > 12) {
    errors.push('SpecialResources must be between 0 and 12');
  }
  
  // Size validation
  if (!Number.isInteger(system.size) || system.size < 0 || system.size > 4) {
    errors.push('Size must be between 0 and 4');
  }
  
  // Quantities validation
  if (!Array.isArray(system.qty) || system.qty.length !== SYSTEM_CONSTANTS.MAXTRADEITEM) {
    errors.push(`Qty array must have exactly ${SYSTEM_CONSTANTS.MAXTRADEITEM} elements`);
  } else {
    system.qty.forEach((qty, i) => {
      if (!Number.isInteger(qty) || qty < 0) {
        errors.push(`Qty[${i}] must be a non-negative integer`);
      }
    });
  }
  
  // Countdown validation
  if (!Number.isInteger(system.countDown) || system.countDown < 0) {
    errors.push('CountDown must be a non-negative integer');
  }
  
  // Visited validation
  if (typeof system.visited !== 'boolean') {
    errors.push('Visited must be a boolean');
  }
  
  // Special validation
  if (!Number.isInteger(system.special)) {
    errors.push('Special must be an integer');
  }
  
  return errors;
}

export function isValidCrewMember(crew: CrewMember): string[] {
  const errors: string[] = [];
  
  // Name index validation
  if (!Number.isInteger(crew.nameIndex) || crew.nameIndex < 0) {
    errors.push('NameIndex must be a non-negative integer');
  }
  
  // Skill validation (0-10 range based on MAXSKILL)
  if (!Number.isInteger(crew.pilot) || crew.pilot < 0 || crew.pilot > 10) {
    errors.push('Pilot skill must be between 0 and 10');
  }
  
  if (!Number.isInteger(crew.fighter) || crew.fighter < 0 || crew.fighter > 10) {
    errors.push('Fighter skill must be between 0 and 10');
  }
  
  if (!Number.isInteger(crew.trader) || crew.trader < 0 || crew.trader > 10) {
    errors.push('Trader skill must be between 0 and 10');
  }
  
  if (!Number.isInteger(crew.engineer) || crew.engineer < 0 || crew.engineer > 10) {
    errors.push('Engineer skill must be between 0 and 10');
  }
  
  // Current system validation
  if (!Number.isInteger(crew.curSystem) || crew.curSystem < 0 || crew.curSystem >= SYSTEM_CONSTANTS.MAXSOLARSYSTEM) {
    errors.push(`CurSystem must be between 0 and ${SYSTEM_CONSTANTS.MAXSOLARSYSTEM - 1}`);
  }
  
  return errors;
}

export function calculateDistance(system1: SolarSystem, system2: SolarSystem): number {
  const dx = system1.x - system2.x;
  const dy = system1.y - system2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function isWithinRange(system1: SolarSystem, system2: SolarSystem, range: number): boolean {
  return calculateDistance(system1, system2) <= range;
}

export function validateMinimumDistance(systems: SolarSystem[]): string[] {
  const errors: string[] = [];
  
  for (let i = 0; i < systems.length; i++) {
    for (let j = i + 1; j < systems.length; j++) {
      const distance = calculateDistance(systems[i], systems[j]);
      if (distance < SYSTEM_CONSTANTS.MINDISTANCE) {
        errors.push(`Systems ${i} and ${j} are too close (distance: ${distance}, minimum: ${SYSTEM_CONSTANTS.MINDISTANCE})`);
      }
    }
  }
  
  return errors;
}

describe('Data Structure Validation', () => {
  test('valid ship structure', () => {
    const validShip: Ship = {
      type: 1,
      cargo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      weapon: [0, -1, -1],
      shield: [-1, -1, -1],
      shieldStrength: [0, 0, 0],
      gadget: [-1, -1, -1],
      crew: [0, -1, -1],
      fuel: 14,
      hull: 100,
      tribbles: 0,
      forFutureUse: [0, 0, 0, 0]
    };
    
    const errors = isValidShip(validShip);
    assert.strictEqual(errors.length, 0, `Validation errors: ${errors.join(', ')}`);
  });
  
  test('invalid ship structure - negative values', () => {
    const invalidShip: Ship = {
      type: -1,
      cargo: [-1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      weapon: [0, -2, -1],
      shield: [-1, -1, -1],
      shieldStrength: [-1, 0, 0],
      gadget: [-1, -1, -1],
      crew: [0, -1, -1],
      fuel: -5,
      hull: -10,
      tribbles: -1,
      forFutureUse: [0, 0, 0, 0]
    };
    
    const errors = isValidShip(invalidShip);
    assert.ok(errors.length > 0);
    assert.ok(errors.some(e => e.includes('Ship type')));
    assert.ok(errors.some(e => e.includes('Cargo[0]')));
    assert.ok(errors.some(e => e.includes('Weapon[1]')));
    assert.ok(errors.some(e => e.includes('ShieldStrength[0]')));
    assert.ok(errors.some(e => e.includes('Fuel')));
    assert.ok(errors.some(e => e.includes('Hull')));
    assert.ok(errors.some(e => e.includes('Tribbles')));
  });
  
  test('invalid ship structure - wrong array sizes', () => {
    const invalidShip: Ship = {
      type: 1,
      cargo: [0, 0, 0, 0, 0], // Wrong size
      weapon: [0, -1],        // Wrong size
      shield: [-1, -1, -1, -1], // Wrong size
      shieldStrength: [0, 0, 0],
      gadget: [-1, -1, -1],
      crew: [0, -1, -1],
      fuel: 14,
      hull: 100,
      tribbles: 0,
      forFutureUse: [0, 0, 0, 0]
    };
    
    const errors = isValidShip(invalidShip);
    assert.ok(errors.length > 0);
    assert.ok(errors.some(e => e.includes('Cargo array must have exactly')));
    assert.ok(errors.some(e => e.includes('Weapon array must have exactly')));
    assert.ok(errors.some(e => e.includes('Shield array must have exactly')));
  });
  
  test('tribbles limit validation', () => {
    const shipWithMaxTribbles: Ship = {
      type: 1,
      cargo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      weapon: [0, -1, -1],
      shield: [-1, -1, -1],
      shieldStrength: [0, 0, 0],
      gadget: [-1, -1, -1],
      crew: [0, -1, -1],
      fuel: 14,
      hull: 100,
      tribbles: SYSTEM_CONSTANTS.MAXTRIBBLES,
      forFutureUse: [0, 0, 0, 0]
    };
    
    const errors = isValidShip(shipWithMaxTribbles);
    assert.strictEqual(errors.length, 0);
    
    shipWithMaxTribbles.tribbles = SYSTEM_CONSTANTS.MAXTRIBBLES + 1;
    const errorsOverLimit = isValidShip(shipWithMaxTribbles);
    assert.ok(errorsOverLimit.some(e => e.includes('Tribbles must be between')));
  });
  
  test('valid solar system structure', () => {
    const validSystem: SolarSystem = {
      nameIndex: 0,
      techLevel: 4,
      politics: 6,
      status: 0,
      x: 75,
      y: 50,
      specialResources: 1,
      size: 2,
      qty: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      countDown: 5,
      visited: false,
      special: -1
    };
    
    const errors = isValidSolarSystem(validSystem);
    assert.strictEqual(errors.length, 0, `Validation errors: ${errors.join(', ')}`);
  });
  
  test('invalid solar system coordinates', () => {
    const invalidSystem: SolarSystem = {
      nameIndex: 0,
      techLevel: 4,
      politics: 6,
      status: 0,
      x: SYSTEM_CONSTANTS.GALAXYWIDTH, // Out of bounds
      y: SYSTEM_CONSTANTS.GALAXYHEIGHT, // Out of bounds
      specialResources: 1,
      size: 2,
      qty: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      countDown: 5,
      visited: false,
      special: -1
    };
    
    const errors = isValidSolarSystem(invalidSystem);
    assert.ok(errors.some(e => e.includes('X coordinate must be between')));
    assert.ok(errors.some(e => e.includes('Y coordinate must be between')));
  });
  
  test('valid crew member structure', () => {
    const validCrew: CrewMember = {
      nameIndex: 0,
      pilot: 5,
      fighter: 7,
      trader: 3,
      engineer: 9,
      curSystem: 50
    };
    
    const errors = isValidCrewMember(validCrew);
    assert.strictEqual(errors.length, 0, `Validation errors: ${errors.join(', ')}`);
  });
  
  test('invalid crew member skills', () => {
    const invalidCrew: CrewMember = {
      nameIndex: 0,
      pilot: 15, // Over limit
      fighter: -1, // Under limit
      trader: 3,
      engineer: 9,
      curSystem: 50
    };
    
    const errors = isValidCrewMember(invalidCrew);
    assert.ok(errors.some(e => e.includes('Pilot skill must be between')));
    assert.ok(errors.some(e => e.includes('Fighter skill must be between')));
  });
  
  test('distance calculations', () => {
    const system1: SolarSystem = {
      nameIndex: 0, techLevel: 4, politics: 6, status: 0,
      x: 0, y: 0, specialResources: 1, size: 2,
      qty: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      countDown: 0, visited: false, special: -1
    };
    
    const system2: SolarSystem = {
      nameIndex: 1, techLevel: 4, politics: 6, status: 0,
      x: 3, y: 4, specialResources: 1, size: 2,
      qty: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      countDown: 0, visited: false, special: -1
    };
    
    const distance = calculateDistance(system1, system2);
    assert.strictEqual(distance, 5); // 3-4-5 triangle
    
    assert.strictEqual(isWithinRange(system1, system2, 5), true);
    assert.strictEqual(isWithinRange(system1, system2, 4), false);
  });
  
  test('minimum distance validation', () => {
    const systems: SolarSystem[] = [
      {
        nameIndex: 0, techLevel: 4, politics: 6, status: 0,
        x: 0, y: 0, specialResources: 1, size: 2,
        qty: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        countDown: 0, visited: false, special: -1
      },
      {
        nameIndex: 1, techLevel: 4, politics: 6, status: 0,
        x: 3, y: 0, specialResources: 1, size: 2, // Distance = 3, less than MINDISTANCE (6)
        qty: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        countDown: 0, visited: false, special: -1
      }
    ];
    
    const errors = validateMinimumDistance(systems);
    assert.ok(errors.length > 0);
    assert.ok(errors[0].includes('too close'));
  });
  
  test('boundary value testing', () => {
    // Test maximum valid values
    const maxValidSystem: SolarSystem = {
      nameIndex: 119,
      techLevel: 7,
      politics: 16,
      status: 7,
      x: SYSTEM_CONSTANTS.GALAXYWIDTH - 1,
      y: SYSTEM_CONSTANTS.GALAXYHEIGHT - 1,
      specialResources: 12,
      size: 4,
      qty: [999, 999, 999, 999, 999, 999, 999, 999, 999, 999],
      countDown: 255,
      visited: true,
      special: 36
    };
    
    const errors = isValidSolarSystem(maxValidSystem);
    assert.strictEqual(errors.length, 0);
  });
});
