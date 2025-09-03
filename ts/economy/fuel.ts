// Fuel Buying System Implementation
// Port of fuel functionality from Palm OS Fuel.c

import type { GameState, Ship } from '../types.ts';
import { getShipType } from '../data/shipTypes.ts';
import { getFuelTanks, getCurrentFuel } from '../travel/warp.ts';

export interface RefuelResult {
  success: boolean;
  fuelBought?: number;
  costPaid?: number;
  reason?: string;
}

/**
 * Calculate the cost to fully refuel the ship
 * @param state Current game state
 * @returns Cost in credits to fill fuel tanks
 */
export function calculateFullRefuelCost(state: GameState): number {
  const maxFuel = getFuelTanks(state.ship);
  const currentFuel = getCurrentFuel(state.ship);
  const fuelNeeded = maxFuel - currentFuel;
  const shipType = getShipType(state.ship.type);
  
  return fuelNeeded * shipType.costOfFuel;
}

/**
 * Calculate how much fuel can be bought with given credits
 * @param state Current game state
 * @param credits Amount of credits to spend
 * @returns Amount of fuel that can be purchased
 */
export function calculateAffordableFuel(state: GameState, credits: number): number {
  const shipType = getShipType(state.ship.type);
  const maxFuel = getFuelTanks(state.ship);
  const currentFuel = getCurrentFuel(state.ship);
  const fuelNeeded = maxFuel - currentFuel;
  const affordableFuel = Math.floor(credits / shipType.costOfFuel);
  
  return Math.min(fuelNeeded, affordableFuel);
}

/**
 * Buy fuel for a specified amount of credits
 * Port of Palm OS BuyFuel function from Fuel.c
 * @param state Current game state
 * @param requestedAmount Amount of credits to spend on fuel
 * @returns Result of the fuel purchase
 */
export function buyFuel(state: GameState, requestedAmount: number): RefuelResult {
  const shipType = getShipType(state.ship.type);
  const maxFuel = getFuelTanks(state.ship);
  const currentFuel = getCurrentFuel(state.ship);
  const fuelNeeded = maxFuel - currentFuel;
  
  // Check if fuel is needed
  if (fuelNeeded <= 0) {
    return {
      success: false,
      reason: 'Fuel tanks are already full'
    };
  }
  
  // Calculate maximum cost for full fuel
  const maxCost = fuelNeeded * shipType.costOfFuel;
  
  // Limit amount by what's needed and what player can afford
  let amount = Math.min(requestedAmount, maxCost);
  amount = Math.min(amount, state.credits);
  
  if (amount <= 0) {
    return {
      success: false,
      reason: 'Insufficient credits to buy fuel'
    };
  }
  
  // Calculate fuel units purchased
  const fuelBought = Math.floor(amount / shipType.costOfFuel);
  const actualCost = fuelBought * shipType.costOfFuel;
  
  if (fuelBought <= 0) {
    return {
      success: false,
      reason: 'Cannot afford any fuel units'
    };
  }
  
  // Execute the transaction
  state.ship.fuel += fuelBought;
  state.credits -= actualCost;
  
  return {
    success: true,
    fuelBought,
    costPaid: actualCost
  };
}

/**
 * Refuel ship to full capacity
 * @param state Current game state
 * @returns Result of the refuel operation
 */
export function refuelToFull(state: GameState): RefuelResult {
  const fullCost = calculateFullRefuelCost(state);
  return buyFuel(state, fullCost);
}

/**
 * Get fuel status information for display
 * @param state Current game state
 * @returns Fuel status object
 */
export function getFuelStatus(state: GameState): {
  currentFuel: number;
  maxFuel: number;
  fuelPercentage: number;
  costPerUnit: number;
  fullRefuelCost: number;
} {
  const currentFuel = getCurrentFuel(state.ship);
  const maxFuel = getFuelTanks(state.ship);
  const shipType = getShipType(state.ship.type);
  const fullRefuelCost = calculateFullRefuelCost(state);
  
  return {
    currentFuel,
    maxFuel,
    fuelPercentage: Math.floor((currentFuel / maxFuel) * 100),
    costPerUnit: shipType.costOfFuel,
    fullRefuelCost
  };
}
