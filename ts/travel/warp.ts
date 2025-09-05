// Warp System Implementation
// Ported from Palm OS Space Trader Traveler.c, Math.c, and Fuel.c

import type { GameState, SolarSystem, Ship } from '../types.ts';
import { MAXWORMHOLE, MAXSOLARSYSTEM } from '../types.ts';
import { getShipType } from '../data/shipTypes.ts';
import { getShield } from '../data/equipment.ts';
import { 
  checkFabricRipOccurrence, 
  executeFabricRipTravel, 
  updateFabricRipProbability 
} from './fabric-rip.ts';

// Constants from Palm OS source
const DEBTTOOLARGE = 100000; // Maximum debt before restrictions (from Palm OS spacetrader.h)
const FUELCOMPACTOR = 5; // Gadget index for fuel compactor
const BEAMLASERWEAPON = 1; // Weapon index for beam laser
const WILD_ABOARD = 1; // Wild status when aboard

// Result interfaces for warp operations
export interface WarpCost {
  wormholeTax: number;
  mercenaryPay: number;
  insurance: number;
  interest: number;
  fuel: number;
  total: number;
}

export interface WarpValidation {
  canWarp: boolean;
  reason?: string;
}

export interface WarpResult {
  success: boolean;
  reason?: string;
  fuelConsumed?: number;
  costPaid?: number;
  fabricRipOccurred?: boolean;
  actualDestination?: number;
}

// Calculate distance between two solar systems
// From Palm OS Math.c RealDistance() and SqrDistance()
export function calculateDistance(systemA: SolarSystem, systemB: SolarSystem): number {
  const dx = systemA.x - systemB.x;
  const dy = systemA.y - systemB.y;
  const sqrDistance = dx * dx + dy * dy;
  return Math.floor(Math.sqrt(sqrDistance));
}

// Determine size of fuel tanks (with fuel compactor modification)
// From Palm OS Fuel.c GetFuelTanks()
export function getFuelTanks(ship: Ship): number {
  // Check if ship has fuel compactor gadget
  const hasFuelCompactor = ship.gadget.some(gadget => gadget === FUELCOMPACTOR);
  
  if (hasFuelCompactor) {
    return 18; // Palm OS: fuel compactor gives 18 tanks regardless of ship
  }
  
  const shipType = getShipType(ship.type);
  return shipType.fuelTanks;
}

// Determine current fuel in tanks
// From Palm OS Fuel.c GetFuel()
export function getCurrentFuel(ship: Ship): number {
  return Math.min(ship.fuel, getFuelTanks(ship));
}

// Check if wormhole exists between two systems
// From Palm OS Traveler.c WormholeExists()
export function isWormholeTravel(state: GameState, fromSystem: number, toSystem: number): boolean {
  for (let i = 0; i < MAXWORMHOLE; i++) {
    const wormholeA = state.wormhole[i];
    const wormholeB = state.wormhole[(i + 1) % MAXWORMHOLE];
    
    if ((wormholeA === fromSystem && wormholeB === toSystem) ||
        (wormholeB === fromSystem && wormholeA === toSystem)) {
      return true;
    }
  }
  return false;
}

// Calculate wormhole tax
// From Palm OS Traveler.c WormholeTax()
export function calculateWormholeTax(ship: Ship): number {
  const shipType = getShipType(ship.type);
  return shipType.costOfFuel * 25;
}

// Calculate mercenary pay for crew members
// From Palm OS Traveler.c MercenaryMoney()
function calculateMercenaryPay(state: GameState): number {
  let totalPay = 0;
  
  // Skip commander (index 0), calculate pay for other crew
  for (let i = 1; i < state.ship.crew.length; i++) {
    const mercenaryIndex = state.ship.crew[i];
    if (mercenaryIndex >= 0 && mercenaryIndex < state.mercenary.length) {
      const mercenary = state.mercenary[mercenaryIndex];
      const totalSkills = mercenary.pilot + mercenary.fighter + mercenary.trader + mercenary.engineer;
      totalPay += totalSkills * 3;
    }
  }
  
  return totalPay;
}

// Calculate insurance money
// From Palm OS Traveler.c InsuranceMoney()
function calculateInsurance(state: GameState): number {
  if (!state.insurance) {
    return 0;
  }
  
  // Basic insurance calculation - will be enhanced when ship pricing is complete
  const shipValue = 10000; // Placeholder - TODO: implement CurrentShipPriceWithoutCargo
  const baseCost = Math.floor((shipValue * 5) / 2000);
  const noClaim = Math.min(state.noClaim, 90);
  
  return Math.max(1, baseCost * (100 - noClaim) / 100);
}

// Calculate interest on debt
// From Palm OS Money.c PayInterest() 
function calculateInterest(debt: number): number {
  if (debt <= 0) {
    return 0;
  }
  return Math.max(1, Math.floor(debt / 10));
}

// Calculate total warp cost
export function calculateWarpCost(state: GameState, fromSystem: number, toSystem: number, isWormhole: boolean): WarpCost {
  const wormholeTax = isWormhole ? calculateWormholeTax(state.ship) : 0;
  const mercenaryPay = calculateMercenaryPay(state);
  const insurance = calculateInsurance(state);
  const interest = calculateInterest(state.debt);
  const fuel = isWormhole ? 0 : calculateDistance(state.solarSystem[fromSystem], state.solarSystem[toSystem]);
  
  return {
    wormholeTax,
    mercenaryPay,
    insurance,
    interest,
    fuel,
    total: wormholeTax + mercenaryPay + insurance + interest
  };
}

// Check if ship has specific weapon
function hasWeapon(ship: Ship, weaponType: number): boolean {
  return ship.weapon.some(weapon => weapon === weaponType);
}

// Validate if warp is possible
// From Palm OS Traveler.c DoWarp() validation logic
export function canWarpTo(state: GameState, toSystem: number): WarpValidation {
  // Validate system index
  if (toSystem < 0 || toSystem >= MAXSOLARSYSTEM) {
    return { canWarp: false, reason: 'Invalid destination system' };
  }
  
  // Cannot warp to same system
  if (toSystem === state.currentSystem) {
    return { canWarp: false, reason: 'Cannot warp to current system' };
  }
  
  // Check if debt is too large
  if (state.debt > DEBTTOOLARGE) {
    return { canWarp: false, reason: 'Debt too large' };
  }
  
  // Check if Wild is aboard without proper weapon
  if (state.wildStatus === WILD_ABOARD && !hasWeapon(state.ship, BEAMLASERWEAPON)) {
    return { canWarp: false, reason: 'Wild refuses to travel without beam laser' };
  }
  
  const fromSystem = state.currentSystem;
  const isWormhole = isWormholeTravel(state, fromSystem, toSystem);
  
  // Check fuel range (unless using wormhole)
  if (!isWormhole) {
    const distance = calculateDistance(state.solarSystem[fromSystem], state.solarSystem[toSystem]);
    const currentFuel = getCurrentFuel(state.ship);
    
    if (distance > currentFuel) {
      return { canWarp: false, reason: 'Out of fuel range' };
    }
  }
  
  // Check if can afford costs
  const cost = calculateWarpCost(state, fromSystem, toSystem, isWormhole);
  if (cost.total > state.credits) {
    return { canWarp: false, reason: 'Insufficient credits' };
  }
  
  return { canWarp: true };
}

// Reset shield strength to full
// From Palm OS Traveler.c DoWarp() shield reset logic
function resetShields(ship: Ship): void {
  for (let i = 0; i < ship.shield.length; i++) {
    const shieldType = ship.shield[i];
    if (shieldType >= 0) {
      try {
        const shield = getShield(shieldType);
        ship.shieldStrength[i] = shield.power;
      } catch {
        // Invalid shield type, skip
      }
    }
  }
}

// Execute warp to destination system
// From Palm OS Traveler.c DoWarp()
export function performWarp(state: GameState, toSystem: number, viaSingularity: boolean): WarpResult {
  // Basic validations that apply even to singularity warps
  if (toSystem < 0 || toSystem >= MAXSOLARSYSTEM) {
    return { success: false, reason: 'Invalid destination system' };
  }
  
  if (toSystem === state.currentSystem) {
    return { success: false, reason: 'Cannot warp to current system' };
  }
  
  // For normal warps, do full validation
  if (!viaSingularity) {
    const validation = canWarpTo(state, toSystem);
    if (!validation.canWarp) {
      return { success: false, reason: validation.reason };
    }
  }
  
  const fromSystem = state.currentSystem;
  const isWormhole = isWormholeTravel(state, fromSystem, toSystem);
  const cost = calculateWarpCost(state, fromSystem, toSystem, isWormhole);
  
  let fuelConsumed = 0;
  let costPaid = 0;
  
  // Deduct costs (unless via singularity)
  if (!viaSingularity) {
    state.credits -= cost.total;
    costPaid = cost.total;
    
    // Consume fuel for normal travel (not wormhole)
    if (!isWormhole) {
      const distance = calculateDistance(state.solarSystem[fromSystem], state.solarSystem[toSystem]);
      state.ship.fuel -= distance;
      fuelConsumed = distance;
    }
  }
  
  // Reset shield strength to full
  resetShields(state.ship);
  
  // Check for fabric rip during travel (Dr. Fehler's experiment)
  let finalDestination = toSystem;
  let fabricRipOccurred = false;
  
  if (checkFabricRipOccurrence(state)) {
    // Fabric rip occurs - transport to random system
    const ripResult = executeFabricRipTravel(state, state.solarSystem.length);
    finalDestination = ripResult.destinationSystem;
    fabricRipOccurred = true;
    Object.assign(state, ripResult.state);
    // Reset newspaper payment flag when arriving at new system via fabric rip
    state.alreadyPaidForNewspaper = false;
  } else {
    // Normal warp - execute as planned
    state.currentSystem = toSystem;
    state.solarSystem[toSystem].visited = true;
    // Reset newspaper payment flag when arriving at new system
    state.alreadyPaidForNewspaper = false;
  }
  
  // Update fabric rip probability (decreases daily during experiment)
  Object.assign(state, updateFabricRipProbability(state));
  
  return { 
    success: true, 
    fuelConsumed,
    costPaid,
    fabricRipOccurred,
    actualDestination: finalDestination
  };
}