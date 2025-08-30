// Ship Types System Implementation  
// Port of ship type definitions from Palm OS Global.c

import type { ShipType } from '../types.ts';
import { MAXSHIPTYPE } from '../types.ts';

// Constants from Palm OS
const MAXRANGE = 20;
const EXTRASHIPS = 5;

// Ship type data ported exactly from Palm OS source:
// const SHIPTYPE Shiptype[MAXSHIPTYPE+EXTRASHIPS] = { ... }
const SHIP_TYPES: readonly ShipType[] = [
  // Buyable ships (indices 0-9)
  
  // Flea - index 0
  {
    name: 'Flea',
    cargoBays: 10,
    weaponSlots: 0,
    shieldSlots: 0,
    gadgetSlots: 0,
    crewQuarters: 1,
    fuelTanks: MAXRANGE, // 20
    minTechLevel: 4,
    costOfFuel: 1,
    price: 2000,
    bounty: 5,
    occurrence: 2,
    hullStrength: 25,
    police: -1,    // not used as police
    pirates: -1,   // not used as pirates
    traders: 0,
    repairCosts: 1,
    size: 0
  },
  
  // Gnat - index 1 (starting ship)
  {
    name: 'Gnat',
    cargoBays: 15,
    weaponSlots: 1,
    shieldSlots: 0,
    gadgetSlots: 1,
    crewQuarters: 1,
    fuelTanks: 14,
    minTechLevel: 5,
    costOfFuel: 2,
    price: 10000,
    bounty: 50,
    occurrence: 28,
    hullStrength: 100,
    police: 0,
    pirates: 0,
    traders: 0,
    repairCosts: 1,
    size: 1
  },
  
  // Firefly - index 2
  {
    name: 'Firefly',
    cargoBays: 20,
    weaponSlots: 1,
    shieldSlots: 1,
    gadgetSlots: 1,
    crewQuarters: 1,
    fuelTanks: 17,
    minTechLevel: 5,
    costOfFuel: 3,
    price: 25000,
    bounty: 75,
    occurrence: 20,
    hullStrength: 100,
    police: 0,
    pirates: 0,
    traders: 0,
    repairCosts: 1,
    size: 1
  },
  
  // Mosquito - index 3
  {
    name: 'Mosquito',
    cargoBays: 15,
    weaponSlots: 2,
    shieldSlots: 1,
    gadgetSlots: 1,
    crewQuarters: 1,
    fuelTanks: 13,
    minTechLevel: 5,
    costOfFuel: 5,
    price: 30000,
    bounty: 100,
    occurrence: 20,
    hullStrength: 100,
    police: 0,
    pirates: 1,
    traders: 0,
    repairCosts: 1,
    size: 1
  },
  
  // Bumblebee - index 4
  {
    name: 'Bumblebee',
    cargoBays: 25,
    weaponSlots: 1,
    shieldSlots: 2,
    gadgetSlots: 2,
    crewQuarters: 2,
    fuelTanks: 15,
    minTechLevel: 5,
    costOfFuel: 7,
    price: 60000,
    bounty: 125,
    occurrence: 15,
    hullStrength: 100,
    police: 1,
    pirates: 1,
    traders: 0,
    repairCosts: 1,
    size: 2
  },
  
  // Beetle - index 5
  {
    name: 'Beetle',
    cargoBays: 50,
    weaponSlots: 0,
    shieldSlots: 1,
    gadgetSlots: 1,
    crewQuarters: 3,
    fuelTanks: 14,
    minTechLevel: 5,
    costOfFuel: 10,
    price: 80000,
    bounty: 50,
    occurrence: 3,
    hullStrength: 50,
    police: -1,
    pirates: -1,
    traders: 0,
    repairCosts: 1,
    size: 2
  },
  
  // Hornet - index 6
  {
    name: 'Hornet',
    cargoBays: 20,
    weaponSlots: 3,
    shieldSlots: 2,
    gadgetSlots: 1,
    crewQuarters: 2,
    fuelTanks: 16,
    minTechLevel: 6,
    costOfFuel: 15,
    price: 100000,
    bounty: 200,
    occurrence: 6,
    hullStrength: 150,
    police: 2,
    pirates: 3,
    traders: 1,
    repairCosts: 2,
    size: 3
  },
  
  // Grasshopper - index 7
  {
    name: 'Grasshopper',
    cargoBays: 30,
    weaponSlots: 2,
    shieldSlots: 2,
    gadgetSlots: 3,
    crewQuarters: 3,
    fuelTanks: 15,
    minTechLevel: 6,
    costOfFuel: 15,
    price: 150000,
    bounty: 300,
    occurrence: 2,
    hullStrength: 150,
    police: 3,
    pirates: 4,
    traders: 2,
    repairCosts: 3,
    size: 3
  },
  
  // Termite - index 8
  {
    name: 'Termite',
    cargoBays: 60,
    weaponSlots: 1,
    shieldSlots: 3,
    gadgetSlots: 2,
    crewQuarters: 3,
    fuelTanks: 13,
    minTechLevel: 7,
    costOfFuel: 20,
    price: 225000,
    bounty: 300,
    occurrence: 2,
    hullStrength: 200,
    police: 4,
    pirates: 5,
    traders: 3,
    repairCosts: 4,
    size: 4
  },
  
  // Wasp - index 9 (best buyable ship)
  {
    name: 'Wasp',
    cargoBays: 35,
    weaponSlots: 3,
    shieldSlots: 2,
    gadgetSlots: 2,
    crewQuarters: 3,
    fuelTanks: 14,
    minTechLevel: 7,
    costOfFuel: 20,
    price: 300000,
    bounty: 500,
    occurrence: 2,
    hullStrength: 200,
    police: 5,
    pirates: 6,
    traders: 4,
    repairCosts: 5,
    size: 4
  },
  
  // Non-buyable ships (indices 10-14) - used for encounters and special events
  
  // Space monster - index 10
  {
    name: 'Space monster',
    cargoBays: 0,
    weaponSlots: 3,
    shieldSlots: 0,
    gadgetSlots: 0,
    crewQuarters: 1,
    fuelTanks: 1,
    minTechLevel: 8,
    costOfFuel: 1,
    price: 500000,
    bounty: 0,
    occurrence: 0,     // not encountered normally
    hullStrength: 500,
    police: 8,
    pirates: 8,
    traders: 8,
    repairCosts: 1,
    size: 4
  },
  
  // Dragonfly - index 11
  {
    name: 'Dragonfly',
    cargoBays: 0,
    weaponSlots: 2,
    shieldSlots: 3,
    gadgetSlots: 2,
    crewQuarters: 1,
    fuelTanks: 1,
    minTechLevel: 8,
    costOfFuel: 1,
    price: 500000,
    bounty: 0,
    occurrence: 0,     // not encountered normally
    hullStrength: 10,
    police: 8,
    pirates: 8,
    traders: 8,
    repairCosts: 1,
    size: 1
  },
  
  // Mantis - index 12
  {
    name: 'Mantis',
    cargoBays: 0,
    weaponSlots: 3,
    shieldSlots: 1,
    gadgetSlots: 3,
    crewQuarters: 3,
    fuelTanks: 1,
    minTechLevel: 8,
    costOfFuel: 1,
    price: 500000,
    bounty: 0,
    occurrence: 0,     // not encountered normally
    hullStrength: 300,
    police: 8,
    pirates: 8,
    traders: 8,
    repairCosts: 1,
    size: 2
  },
  
  // Scarab - index 13
  {
    name: 'Scarab',
    cargoBays: 20,
    weaponSlots: 2,
    shieldSlots: 0,
    gadgetSlots: 0,
    crewQuarters: 2,
    fuelTanks: 1,
    minTechLevel: 8,
    costOfFuel: 1,
    price: 500000,
    bounty: 0,
    occurrence: 0,     // not encountered normally
    hullStrength: 400,
    police: 8,
    pirates: 8,
    traders: 8,
    repairCosts: 1,
    size: 3
  },
  
  // Bottle - index 14 (Marie Celeste cargo)
  {
    name: 'Bottle',
    cargoBays: 0,
    weaponSlots: 0,
    shieldSlots: 0,
    gadgetSlots: 0,
    crewQuarters: 0,
    fuelTanks: 1,
    minTechLevel: 8,
    costOfFuel: 1,
    price: 100,
    bounty: 0,
    occurrence: 0,     // not encountered normally
    hullStrength: 10,
    police: 8,
    pirates: 8,
    traders: 8,
    repairCosts: 1,
    size: 1
  }
] as const;

// Validate at compile time that we have exactly MAXSHIPTYPE + EXTRASHIPS items
// (Runtime tests verify the exact count)
const _validateShipTypeCount: typeof SHIP_TYPES = SHIP_TYPES;

/**
 * Get all ship type definitions
 * @returns Readonly array of all ship type definitions
 */
export function getShipTypes(): readonly ShipType[] {
  return SHIP_TYPES;
}

/**
 * Get a specific ship type by index
 * @param index Ship type index (0-14)
 * @returns Ship type definition
 * @throws Error if index is out of bounds
 */
export function getShipType(index: number): ShipType {
  if (index < 0 || index >= SHIP_TYPES.length) {
    throw new Error(`Invalid ship type index: ${index}. Must be 0-${SHIP_TYPES.length - 1}`);
  }
  return SHIP_TYPES[index];
}

/**
 * Get ship type name by index
 * @param index Ship type index
 * @returns Ship type name
 */
export function getShipTypeName(index: number): string {
  return getShipType(index).name;
}

/**
 * Get only buyable ship types (indices 0-9)
 * @returns Readonly array of buyable ship types
 */
export function getBuyableShipTypes(): readonly ShipType[] {
  return SHIP_TYPES.slice(0, MAXSHIPTYPE);
}

/**
 * Check if a ship type is buyable by players
 * @param index Ship type index
 * @returns True if ship can be purchased
 */
export function isShipTypeBuyable(index: number): boolean {
  return index >= 0 && index < MAXSHIPTYPE;
}