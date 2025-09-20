// Orbital Trading System Implementation  
// Handles trading with merchant ships encountered in space

import type { GameState, TradeItemArray } from '../types.ts';
import { getTradeItem } from '../data/tradeItems.ts';
import { random, randomFloor, randomBool } from '../math/random.ts';

/**
 * Result of orbital trading transaction
 */
export interface OrbitalTradeResult {
  success: boolean;
  reason?: string;
  itemsSold?: number;
  itemsBought?: number;
  creditsGained?: number;
  creditsSpent?: number;
  tradeItemIndex?: number;
  quantity?: number;
}

/**
 * Calculate orbital trading price using min/max price ranges from trade items
 * Orbital traders offer prices between minTradePrice and maxTradePrice
 */
function calculateOrbitalPrice(tradeItemIndex: number, isBuying: boolean): number {
  const tradeItem = getTradeItem(tradeItemIndex);
  
  if (isBuying) {
    // When buying from orbital trader, price is closer to maxTradePrice
    const range = tradeItem.maxTradePrice - tradeItem.minTradePrice;
    const variation = randomFloor(range * 0.3); // Top 30% of range
    return tradeItem.maxTradePrice - variation;
  } else {
    // When selling to orbital trader, price is closer to minTradePrice  
    const range = tradeItem.maxTradePrice - tradeItem.minTradePrice;
    const variation = randomFloor(range * 0.3); // Bottom 30% of range
    return tradeItem.minTradePrice + variation;
  }
}

/**
 * Get random trade item that the orbital trader is interested in
 * Based on what the player has in cargo
 */
function selectTraderInterest(state: GameState, isSellingToPlayer: boolean): number {
  if (isSellingToPlayer) {
    // Trader is selling to player - pick any trade item
    return randomFloor(10);
  } else {
    // Trader wants to buy from player - pick something player has
    const availableItems = [];
    for (let i = 0; i < 10; i++) {
      if (state.ship.cargo[i] > 0) {
        availableItems.push(i);
      }
    }
    
    if (availableItems.length === 0) {
      return -1; // No items to sell
    }
    
    return availableItems[randomFloor(availableItems.length)];
  }
}

/**
 * Calculate available cargo space
 */
function getAvailableCargoSpace(state: GameState): number {
  const usedSpace = state.ship.cargo.reduce((total, quantity) => total + quantity, 0);
  const totalSpace = 50; // Base cargo capacity - could be enhanced with gadgets
  return totalSpace - usedSpace;
}

/**
 * Execute trade with orbital trader (trader selling to player)
 * @param state Game state (will be modified)
 * @param encounterType The specific trader encounter type
 * @returns Result of the trading transaction
 */
export function executeOrbitalPurchase(state: GameState, encounterType: number): OrbitalTradeResult {
  // Select what the trader is selling
  const tradeItemIndex = selectTraderInterest(state, true);
  const tradeItem = getTradeItem(tradeItemIndex);
  
  // Calculate orbital price (trader selling to player)
  const price = calculateOrbitalPrice(tradeItemIndex, true);
  
  // Determine quantity trader wants to sell (1-10 units)
  const maxQuantity = Math.min(10, Math.floor(state.credits / price));
  const availableSpace = getAvailableCargoSpace(state);
  const quantity = Math.min(maxQuantity, availableSpace, 1 + randomFloor(5));
  
  if (quantity <= 0) {
    return {
      success: false,
      reason: 'Unable to trade - insufficient credits or cargo space'
    };
  }
  
  const totalCost = price * quantity;
  
  if (state.credits < totalCost) {
    return {
      success: false,
      reason: 'Insufficient credits for trade'
    };
  }
  
  if (availableSpace < quantity) {
    return {
      success: false,
      reason: 'Insufficient cargo space for trade'
    };
  }
  
  // Execute the trade
  state.credits -= totalCost;
  state.ship.cargo[tradeItemIndex] += quantity;
  
  return {
    success: true,
    reason: `Bought ${quantity} ${tradeItem.name} for ${totalCost} credits`,
    itemsBought: quantity,
    creditsSpent: totalCost,
    tradeItemIndex,
    quantity
  };
}

/**
 * Execute trade with orbital trader (trader buying from player)
 * @param state Game state (will be modified)  
 * @param encounterType The specific trader encounter type
 * @returns Result of the trading transaction
 */
export function executeOrbitalSale(state: GameState, encounterType: number): OrbitalTradeResult {
  // Select what the trader wants to buy (from player's cargo)
  const tradeItemIndex = selectTraderInterest(state, false);
  
  if (tradeItemIndex === -1) {
    return {
      success: false,
      reason: 'Nothing to sell - no cargo aboard'
    };
  }
  
  const tradeItem = getTradeItem(tradeItemIndex);
  const availableQuantity = state.ship.cargo[tradeItemIndex];
  
  if (availableQuantity <= 0) {
    return {
      success: false,
      reason: `No ${tradeItem.name} to sell`
    };
  }
  
  // Calculate orbital price (trader buying from player)
  const price = calculateOrbitalPrice(tradeItemIndex, false);
  
  // Determine quantity trader wants to buy (1 to all available)
  const maxWanted = Math.min(availableQuantity, 5 + randomFloor(10));
  const quantity = Math.min(maxWanted, availableQuantity);
  
  const totalPayment = price * quantity;
  
  // Execute the trade
  state.credits += totalPayment;
  state.ship.cargo[tradeItemIndex] -= quantity;
  
  return {
    success: true,
    reason: `Sold ${quantity} ${tradeItem.name} for ${totalPayment} credits`,
    itemsSold: quantity,
    creditsGained: totalPayment,
    tradeItemIndex,
    quantity
  };
}

/**
 * Check if orbital trading should be offered during encounter
 * From Palm OS: 100 in 1000 chance (CHANCEOFTRADEINORBIT)
 */
export function shouldOfferOrbitalTrade(): boolean {
  return randomFloor(1000) < 100; // 100 in 1000 chance
}

/**
 * Generate orbital trade encounter if conditions are met
 * @param state Game state
 * @returns Trade encounter info or null if no trade offered
 */
export function generateOrbitalTradeEncounter(state: GameState): {
  encounterType: number;
  tradeItemIndex: number;
  price: number;
  quantity: number;
  tradeItemName: string;
} | null {
  if (!shouldOfferOrbitalTrade()) {
    return null;
  }
  
  // Decide if trader is buying or selling
  const isTraderSelling = randomBool(0.5);
  const encounterType = isTraderSelling ? 24 : 25; // TRADERSELL or TRADERBUY
  
  const tradeItemIndex = selectTraderInterest(state, isTraderSelling);
  
  if (tradeItemIndex === -1) {
    return null; // No valid trade
  }
  
  const tradeItem = getTradeItem(tradeItemIndex);
  const price = calculateOrbitalPrice(tradeItemIndex, isTraderSelling);
  
  let quantity;
  if (isTraderSelling) {
    // Trader selling to player
    const maxBuyable = Math.floor(state.credits / price);
    const cargoSpace = getAvailableCargoSpace(state);
    quantity = Math.min(maxBuyable, cargoSpace, 1 + randomFloor(5));
  } else {
    // Trader buying from player
    const available = state.ship.cargo[tradeItemIndex];
    quantity = Math.min(available, 1 + randomFloor(Math.min(5, available)));
  }
  
  if (quantity <= 0) {
    return null;
  }
  
  return {
    encounterType,
    tradeItemIndex,
    price,
    quantity,
    tradeItemName: tradeItem.name
  };
}
