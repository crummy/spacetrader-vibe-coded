// Trading Functions Implementation
// Port of trading functionality from Palm OS Cargo.c and related files

import type { GameState, SolarSystem, TradeItemArray } from '../types.ts';
import { TradeItem } from '../types.ts';
import { getShipType } from '../data/shipTypes.ts';

// Constants from Palm OS
const DEBTTOOLARGE = 200000;
const EXTRABAYS = 2; // Gadget ID for extra cargo bays

// Result types for trading operations
export interface BuyResult {
  success: boolean;
  quantityBought?: number;
  totalCost?: number;
  reason?: string;
}

export interface SellResult {
  success: boolean;
  quantitySold?: number;
  totalRevenue?: number;
  reason?: string;
}


/**
 * Calculate total cargo bay capacity including extra cargo bay gadgets
 * Port of Palm OS TotalCargoBays function from Cargo.c
 * @param state Current game state
 * @returns Total cargo bay capacity
 */
export function getTotalCargoBays(state: GameState): number {
  const shipType = getShipType(state.ship.type);
  let bays = shipType.cargoBays;
  
  // Add extra bays from gadgets
  for (let i = 0; i < state.ship.gadget.length; i++) {
    if (state.ship.gadget[i] === EXTRABAYS) {
      bays += 5;
    }
  }
  
  // Special quest reductions
  // Japori Disease reduces cargo by 10
  if (state.japoriDiseaseStatus === 1) {
    bays -= 10;
  }
  
  // Reactor quest reduces cargo (5 + 10 - (ReactorStatus - 1)/2)
  if (state.reactorStatus > 0 && state.reactorStatus < 21) {
    bays -= (5 + 10 - Math.floor((state.reactorStatus - 1) / 2));
  }
  
  return bays;
}

/**
 * Calculate number of filled cargo bays
 * Port of Palm OS FilledCargoBays function from Cargo.c
 * @param state Current game state
 * @returns Number of filled cargo bays
 */
export function getFilledCargoBays(state: GameState): number {
  let sum = 0;
  for (let i = 0; i < state.ship.cargo.length; i++) {
    sum += state.ship.cargo[i];
  }
  return sum;
}

/**
 * Calculate available funds for trading
 * Port of Palm OS ToSpend function from Traveler.c
 * @param state Current game state
 * @returns Available credits for spending
 */
export function getAvailableFunds(state: GameState): number {
  if (!state.reserveMoney) {
    return state.credits;
  }
  
  // Reserve money for mercenaries and insurance
  // TODO: These functions need to be implemented in future phases
  const mercenaryMoney = 0; // MercenaryMoney()
  const insuranceMoney = 0; // InsuranceMoney()
  
  return Math.max(0, state.credits - mercenaryMoney - insuranceMoney);
}

/**
 * Buy cargo from the current system
 * Port of Palm OS BuyCargo function from Cargo.c
 * @param state Current game state (will be mutated)
 * @param currentSystem Current solar system
 * @param tradeItemIndex Trade item to buy
 * @param requestedAmount Amount requested to buy
 * @param buyPrices Current buy prices for all trade items
 * @returns Result of the buy operation
 */
export function buyCargo(
  state: GameState,
  currentSystem: SolarSystem,
  tradeItemIndex: number,
  requestedAmount: number,
  buyPrices: TradeItemArray
): BuyResult {
  // Check for large debt
  if (state.debt > DEBTTOOLARGE) {
    return {
      success: false,
      reason: 'Debt too large'
    };
  }
  
  // Check if item is available
  if (currentSystem.qty[tradeItemIndex] <= 0 || buyPrices[tradeItemIndex] <= 0) {
    return {
      success: false,
      reason: 'Item not available'
    };
  }
  
  // Check if there's cargo space
  const totalBays = getTotalCargoBays(state);
  const filledBays = getFilledCargoBays(state);
  const availableSpace = totalBays - filledBays - (state.leaveEmpty || 0);
  
  if (availableSpace <= 0) {
    return {
      success: false,
      reason: 'Insufficient cargo space'
    };
  }
  
  // Check if player has enough credits
  const availableFunds = getAvailableFunds(state);
  const pricePerUnit = buyPrices[tradeItemIndex];
  
  if (availableFunds < pricePerUnit) {
    return {
      success: false,
      reason: 'Insufficient credits'
    };
  }
  
  // Calculate actual amount to buy (limited by various factors)
  let actualAmount = Math.min(requestedAmount, currentSystem.qty[tradeItemIndex]);
  actualAmount = Math.min(actualAmount, availableSpace);
  actualAmount = Math.min(actualAmount, Math.floor(availableFunds / pricePerUnit));
  
  if (actualAmount <= 0) {
    return {
      success: false,
      reason: 'Cannot afford any units'
    };
  }
  
  // Execute the transaction
  const totalCost = actualAmount * pricePerUnit;
  
  state.ship.cargo[tradeItemIndex] += actualAmount;
  state.credits -= totalCost;
  state.buyingPrice[tradeItemIndex] += totalCost;
  currentSystem.qty[tradeItemIndex] -= actualAmount;
  
  return {
    success: true,
    quantityBought: actualAmount,
    totalCost: totalCost
  };
}

/**
 * Sell cargo
 * Port of Palm OS SellCargo function from Cargo.c (SELLCARGO operation)
 * @param state Current game state (will be mutated)
 * @param tradeItemIndex Trade item to sell
 * @param requestedAmount Amount requested to sell
 * @param sellPrices Current sell prices for all trade items
 * @returns Result of the sell operation
 */
export function sellCargo(
  state: GameState,
  tradeItemIndex: number,
  requestedAmount: number,
  sellPrices: TradeItemArray
): SellResult {
  // Check if player has cargo to sell
  if (state.ship.cargo[tradeItemIndex] <= 0) {
    return {
      success: false,
      reason: 'No cargo to sell'
    };
  }
  
  // Check if there's a market (sell price > 0)
  if (sellPrices[tradeItemIndex] <= 0) {
    return {
      success: false,
      reason: 'No market for item'
    };
  }
  
  // Calculate actual amount to sell (limited by available cargo)
  const actualAmount = Math.min(requestedAmount, state.ship.cargo[tradeItemIndex]);
  
  if (actualAmount <= 0) {
    return {
      success: false,
      reason: 'No cargo to sell'
    };
  }
  
  // Execute the transaction
  const pricePerUnit = sellPrices[tradeItemIndex];
  const totalRevenue = actualAmount * pricePerUnit;
  
  // Update buying price proportionally (Palm OS logic)
  if (state.ship.cargo[tradeItemIndex] - actualAmount > 0) {
    state.buyingPrice[tradeItemIndex] = Math.floor(
      (state.buyingPrice[tradeItemIndex] * (state.ship.cargo[tradeItemIndex] - actualAmount)) / 
      state.ship.cargo[tradeItemIndex]
    );
  } else {
    // All cargo sold, reset buying price
    state.buyingPrice[tradeItemIndex] = 0;
  }
  
  state.ship.cargo[tradeItemIndex] -= actualAmount;
  state.credits += totalRevenue;
  
  return {
    success: true,
    quantitySold: actualAmount,
    totalRevenue: totalRevenue
  };
}

/**
 * Dump cargo (jettison without payment)
 * Port of Palm OS SellCargo function from Cargo.c (DUMPCARGO operation)
 * @param state Current game state (will be mutated)
 * @param tradeItemIndex Trade item to dump
 * @param requestedAmount Amount requested to dump
 * @returns Result of the dump operation
 */
export function dumpCargo(
  state: GameState,
  tradeItemIndex: number,
  requestedAmount: number
): SellResult {
  // Check if player has cargo to dump
  if (state.ship.cargo[tradeItemIndex] <= 0) {
    return {
      success: false,
      reason: 'No cargo to dump'
    };
  }
  
  // Calculate actual amount to dump
  let actualAmount = Math.min(requestedAmount, state.ship.cargo[tradeItemIndex]);
  
  // Palm OS limits dumping based on credits and difficulty
  const availableFunds = getAvailableFunds(state);
  const dumpCost = 5 * (state.difficulty + 1);
  actualAmount = Math.min(actualAmount, Math.floor(availableFunds / dumpCost));
  
  if (actualAmount <= 0) {
    return {
      success: false,
      reason: 'Cannot afford to dump cargo'
    };
  }
  
  // Execute the dump
  const totalCost = actualAmount * dumpCost;
  
  // Update buying price proportionally
  if (state.ship.cargo[tradeItemIndex] - actualAmount > 0) {
    state.buyingPrice[tradeItemIndex] = Math.floor(
      (state.buyingPrice[tradeItemIndex] * (state.ship.cargo[tradeItemIndex] - actualAmount)) / 
      state.ship.cargo[tradeItemIndex]
    );
  } else {
    state.buyingPrice[tradeItemIndex] = 0;
  }
  
  state.ship.cargo[tradeItemIndex] -= actualAmount;
  state.credits -= totalCost;
  
  return {
    success: true,
    quantitySold: actualAmount,
    totalRevenue: -totalCost // Negative because it costs money
  };
}

/**
 * Get available cargo space
 * @param state Current game state
 * @returns Number of available cargo bays
 */
export function getAvailableCargoSpace(state: GameState): number {
  const totalBays = getTotalCargoBays(state);
  const filledBays = getFilledCargoBays(state);
  return Math.max(0, totalBays - filledBays - (state.leaveEmpty || 0));
}

/**
 * Check if a trade item can be bought in the current system
 * @param currentSystem Current solar system
 * @param tradeItemIndex Trade item to check
 * @param buyPrices Current buy prices
 * @returns True if item can be bought
 */
export function canBuyItem(
  currentSystem: SolarSystem,
  tradeItemIndex: number,
  buyPrices: TradeItemArray
): boolean {
  return currentSystem.qty[tradeItemIndex] > 0 && buyPrices[tradeItemIndex] > 0;
}

/**
 * Check if a trade item can be sold
 * @param state Current game state
 * @param tradeItemIndex Trade item to check
 * @param sellPrices Current sell prices
 * @returns True if item can be sold
 */
export function canSellItem(
  state: GameState,
  tradeItemIndex: number,
  sellPrices: TradeItemArray
): boolean {
  return state.ship.cargo[tradeItemIndex] > 0 && sellPrices[tradeItemIndex] > 0;
}