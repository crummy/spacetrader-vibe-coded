// Equipment System Implementation (Weapons, Shields, Gadgets)
// Port of equipment definitions from Palm OS Global.c

import type { WeaponType, ShieldType, GadgetType } from '../types.ts';

// Constants from Palm OS
const MAXWEAPONTYPE = 3;
const MAXSHIELDTYPE = 2; 
const MAXGADGETTYPE = 5;
const EXTRAWEAPONS = 1;
const EXTRASHIELDS = 1;
const EXTRAGADGETS = 1;

// Power constants from spacetrader.h
const PULSELASERPOWER = 15;
const BEAMLASERPOWER = 25;
const MILITARYLASERPOWER = 35;
const MORGANLASERPOWER = 85;
const ESHIELDPOWER = 100;
const RSHIELDPOWER = 200;
const LSHIELDPOWER = 350;

// Weapon type data ported exactly from Palm OS source:
// const WEAPON Weapontype[MAXWEAPONTYPE+EXTRAWEAPONS] = { ... }
const WEAPONS: readonly WeaponType[] = [
  // Buyable weapons (indices 0-2)
  {
    name: 'Pulse laser',
    power: PULSELASERPOWER, // 15
    price: 2000,
    techLevel: 5,
    chance: 50
  },
  
  {
    name: 'Beam laser',
    power: BEAMLASERPOWER, // 25
    price: 12500,
    techLevel: 6,
    chance: 35
  },
  
  {
    name: 'Military laser',
    power: MILITARYLASERPOWER, // 35
    price: 35000,
    techLevel: 7,
    chance: 15
  },
  
  // Special weapons (index 3) - cannot be bought
  {
    name: "Morgan's laser",
    power: MORGANLASERPOWER, // 85
    price: 50000,
    techLevel: 8,
    chance: 0 // not buyable
  }
] as const;

// Shield type data ported exactly from Palm OS source:
// const SHIELD Shieldtype[MAXSHIELDTYPE+EXTRASHIELDS] = { ... }
const SHIELDS: readonly ShieldType[] = [
  // Buyable shields (indices 0-1)
  {
    name: 'Energy shield',
    power: ESHIELDPOWER, // 100
    price: 5000,
    techLevel: 5,
    chance: 70
  },
  
  {
    name: 'Reflective shield',
    power: RSHIELDPOWER, // 200
    price: 20000,
    techLevel: 6,
    chance: 30
  },
  
  // Special shields (index 2) - cannot be bought
  {
    name: 'Lightning shield',
    power: LSHIELDPOWER, // 350
    price: 45000,
    techLevel: 8,
    chance: 0 // not buyable
  }
] as const;

// Gadget type data ported exactly from Palm OS source:
// const GADGET Gadgettype[MAXGADGETTYPE+EXTRAGADGETS] = { ... }
const GADGETS: readonly GadgetType[] = [
  // Buyable gadgets (indices 0-4)
  {
    name: '5 extra cargo bays',
    price: 2500,
    techLevel: 4,
    chance: 35
  },
  
  {
    name: 'Auto-repair system',
    price: 7500,
    techLevel: 5,
    chance: 20
  },
  
  {
    name: 'Navigating system',
    price: 15000,
    techLevel: 6,
    chance: 20
  },
  
  {
    name: 'Targeting system',
    price: 25000,
    techLevel: 6,
    chance: 20
  },
  
  {
    name: 'Cloaking device',
    price: 100000,
    techLevel: 7,
    chance: 5
  },
  
  // Special gadgets (index 5) - cannot be bought
  {
    name: 'Fuel compactor',
    price: 30000,
    techLevel: 8,
    chance: 0 // not buyable
  }
] as const;

// Validation types for compile-time checking (Runtime tests verify exact counts)
const _validateWeaponCount: typeof WEAPONS = WEAPONS;
const _validateShieldCount: typeof SHIELDS = SHIELDS;
const _validateGadgetCount: typeof GADGETS = GADGETS;

// Weapon functions
/**
 * Get all weapon type definitions
 * @returns Readonly array of all weapon types
 */
export function getWeapons(): readonly WeaponType[] {
  return WEAPONS;
}

/**
 * Get a specific weapon type by index
 * @param index Weapon type index (0-3)
 * @returns Weapon type definition
 * @throws Error if index is out of bounds
 */
export function getWeapon(index: number): WeaponType {
  if (index < 0 || index >= WEAPONS.length) {
    throw new Error(`Invalid weapon index: ${index}. Must be 0-${WEAPONS.length - 1}`);
  }
  return WEAPONS[index];
}

/**
 * Get only buyable weapon types (indices 0-2)
 * @returns Readonly array of buyable weapons
 */
export function getBuyableWeapons(): readonly WeaponType[] {
  return WEAPONS.slice(0, MAXWEAPONTYPE);
}

/**
 * Check if a weapon type is buyable by players
 * @param index Weapon type index
 * @returns True if weapon can be purchased
 */
export function isWeaponBuyable(index: number): boolean {
  return index >= 0 && index < MAXWEAPONTYPE;
}

// Shield functions
/**
 * Get all shield type definitions
 * @returns Readonly array of all shield types
 */
export function getShields(): readonly ShieldType[] {
  return SHIELDS;
}

/**
 * Get a specific shield type by index
 * @param index Shield type index (0-2)
 * @returns Shield type definition
 * @throws Error if index is out of bounds
 */
export function getShield(index: number): ShieldType {
  if (index < 0 || index >= SHIELDS.length) {
    throw new Error(`Invalid shield index: ${index}. Must be 0-${SHIELDS.length - 1}`);
  }
  return SHIELDS[index];
}

/**
 * Get only buyable shield types (indices 0-1)
 * @returns Readonly array of buyable shields
 */
export function getBuyableShields(): readonly ShieldType[] {
  return SHIELDS.slice(0, MAXSHIELDTYPE);
}

/**
 * Check if a shield type is buyable by players
 * @param index Shield type index
 * @returns True if shield can be purchased
 */
export function isShieldBuyable(index: number): boolean {
  return index >= 0 && index < MAXSHIELDTYPE;
}

// Gadget functions
/**
 * Get all gadget type definitions
 * @returns Readonly array of all gadget types
 */
export function getGadgets(): readonly GadgetType[] {
  return GADGETS;
}

/**
 * Get a specific gadget type by index
 * @param index Gadget type index (0-5)
 * @returns Gadget type definition
 * @throws Error if index is out of bounds
 */
export function getGadget(index: number): GadgetType {
  if (index < 0 || index >= GADGETS.length) {
    throw new Error(`Invalid gadget index: ${index}. Must be 0-${GADGETS.length - 1}`);
  }
  return GADGETS[index];
}

/**
 * Get only buyable gadget types (indices 0-4)
 * @returns Readonly array of buyable gadgets
 */
export function getBuyableGadgets(): readonly GadgetType[] {
  return GADGETS.slice(0, MAXGADGETTYPE);
}

/**
 * Check if a gadget type is buyable by players
 * @param index Gadget type index
 * @returns True if gadget can be purchased
 */
export function isGadgetBuyable(index: number): boolean {
  return index >= 0 && index < MAXGADGETTYPE;
}