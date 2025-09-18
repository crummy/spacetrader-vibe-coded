// Price Calculation System Implementation
// Port of pricing algorithms from Palm OS Traveler.c and Skill.c

import type { SolarSystem, TechLevel, State } from '../types.ts';
import { TradeItem, SystemStatus } from '../types.ts';
import { getTradeItem } from '../data/tradeItems.ts';
import { getPoliticalSystem } from '../data/politics.ts';

// Constants from Palm OS
const MAXSKILL = 10;
const DUBIOUSSCORE = -100; // Police record threshold for criminal status

/**
 * Calculate standard base price for a trade item
 * Port of Palm OS StandardPrice function from Traveler.c
 * @param tradeItemIndex Trade item index (0-9)
 * @param systemSize System size (0-4, affects production)
 * @param techLevel System tech level (0-7) 
 * @param politicsIndex Government type index (0-16)
 * @param specialResources Special resource type (0-12, or 0 for none)
 * @returns Base price in credits, 0 if unavailable
 */
export function calculateStandardPrice(
  tradeItemIndex: number,
  systemSize: number,
  techLevel: number,
  politicsIndex: number,
  specialResources: number
): number {
  // Validate inputs
  if (tradeItemIndex < 0 || tradeItemIndex >= 10) {
    throw new Error(`Invalid trade item index: ${tradeItemIndex}`);
  }

  const tradeItem = getTradeItem(tradeItemIndex);
  const politics = getPoliticalSystem(politicsIndex);

  // Check political restrictions
  if (isPoliticallyRestricted(tradeItemIndex, politicsIndex)) {
    return 0;
  }

  // Check if system can use this item
  if (!canSystemUseItem(tradeItemIndex, techLevel)) {
    return 0;
  }

  // Calculate base price from tech level
  let price = tradeItem.priceLowTech + (techLevel * tradeItem.priceInc);

  // Government wanted item bonus (+33%)
  if (politics.wanted === tradeItemIndex) {
    price = Math.floor((price * 4) / 3);
  }

  // High trader activity decreases prices
  price = Math.floor((price * (100 - (2 * politics.strengthTraders))) / 100);

  // Large system production decreases prices
  price = Math.floor((price * (100 - systemSize)) / 100);

  // Apply special resource modifiers
  if (specialResources > 0) {
    // Cheap resource reduces price to 75%
    if (tradeItem.cheapResource >= 0 && specialResources === tradeItem.cheapResource) {
      price = Math.floor((price * 3) / 4);
    }
    
    // Expensive resource increases price to 133%
    if (tradeItem.expensiveResource >= 0 && specialResources === tradeItem.expensiveResource) {
      price = Math.floor((price * 4) / 3);
    }
  }

  // Ensure non-negative price
  return Math.max(0, price);
}

/**
 * Apply special event price modifier
 * Port of special event logic from Palm OS Traveler.c
 * @param tradeItemIndex Trade item index
 * @param systemStatus Current system status
 * @param basePrice Base price before modifier
 * @returns Modified price (1.5x if event matches item's DoublePriceStatus)
 */
export function applySpecialEventModifier(
  tradeItemIndex: number,
  systemStatus: SystemStatus,
  basePrice: number
): number {
  const tradeItem = getTradeItem(tradeItemIndex);

  // Apply 1.5x multiplier if system status matches item's double price status
  if (tradeItem.doublePriceStatus === systemStatus && systemStatus !== SystemStatus.Uneventful) {
    // Palm OS: (Price * 3) >> 1  (equivalent to * 1.5)
    return Math.floor((basePrice * 3) / 2);
  }

  return basePrice;
}

/**
 * Apply random price variance
 * Port of variance logic from Palm OS Traveler.c
 * @param tradeItemIndex Trade item index
 * @param basePrice Base price before variance
 * @param randomFunc Optional random function (for testing)
 * @returns Price with random variance applied
 */
export function applyRandomVariance(
  tradeItemIndex: number,
  basePrice: number,
  randomFunc: () => number = Math.random
): number {
  const tradeItem = getTradeItem(tradeItemIndex);
  
  // Palm OS: Price + GetRandom(Variance) - GetRandom(Variance)
  // GetRandom(n) returns 0 to n-1
  const variance1 = Math.floor(randomFunc() * tradeItem.variance);
  const variance2 = Math.floor(randomFunc() * tradeItem.variance);
  
  const finalPrice = basePrice + variance1 - variance2;
  
  // Ensure price never goes negative
  return Math.max(0, finalPrice);
}

/**
 * Calculate buy price including trader skill and criminal penalties
 * Port of buy price logic from Palm OS RecalculateBuyPrices in Skill.c
 * @param sellPrice Current sell price
 * @param traderSkill Player's trader skill (1-10)
 * @param isCriminal Whether player has criminal record
 * @param policeRecord Player's police record score
 * @returns Final buy price
 */
export function calculateBuyPrice(
  sellPrice: number,
  traderSkill: number,
  isCriminal: boolean,
  policeRecord: number
): number {
  if (sellPrice <= 0) {
    return 0;
  }

  let buyPrice = sellPrice;

  // Apply criminal penalty (reverse the 90% sell price reduction)
  if (isCriminal) {
    buyPrice = Math.floor((sellPrice * 100) / 90);
  }

  // Apply trader skill modifier: 3% to 12% markup based on skill
  // Palm OS: (Price * (103 + (MAXSKILL - TraderSkill))) / 100
  const markup = 103 + (MAXSKILL - traderSkill);
  buyPrice = Math.floor((buyPrice * markup) / 100);

  // Ensure buy price is always at least 1 higher than sell price
  if (buyPrice <= sellPrice) {
    buyPrice = sellPrice + 1;
  }

  return buyPrice;
}

/**
 * Calculate sell price with criminal penalty
 * Port of sell price logic from Palm OS Traveler.c
 * @param basePrice Base calculated price
 * @param isCriminal Whether player has criminal record (police score < DUBIOUS)
 * @returns Final sell price
 */
export function calculateSellPrice(basePrice: number, isCriminal: boolean): number {
  if (basePrice <= 0) {
    return 0;
  }

  // Apply criminal penalty: criminals only get 90% of normal sell price
  if (isCriminal) {
    return Math.floor((basePrice * 90) / 100);
  }

  return basePrice;
}

/**
 * Check if a trade item is politically restricted in a system
 * @param tradeItemIndex Trade item index
 * @param politicsIndex Government type index
 * @returns True if item cannot be traded due to political restrictions
 */
export function isPoliticallyRestricted(tradeItemIndex: number, politicsIndex: number): boolean {
  const politics = getPoliticalSystem(politicsIndex);

  if (tradeItemIndex === TradeItem.Narcotics && !politics.drugsOK) {
    return true;
  }

  if (tradeItemIndex === TradeItem.Firearms && !politics.firearmsOK) {
    return true;
  }

  return false;
}

/**
 * Check if a system can produce a trade item
 * @param tradeItemIndex Trade item index
 * @param techLevel System tech level
 * @returns True if system tech level is high enough to produce item
 */
export function canSystemProduceItem(tradeItemIndex: number, techLevel: number): boolean {
  const tradeItem = getTradeItem(tradeItemIndex);
  return techLevel >= tradeItem.techProduction;
}

/**
 * Check if a system can use a trade item
 * @param tradeItemIndex Trade item index
 * @param techLevel System tech level
 * @returns True if system tech level is high enough to use item
 */
export function canSystemUseItem(tradeItemIndex: number, techLevel: number): boolean {
  const tradeItem = getTradeItem(tradeItemIndex);
  return techLevel >= tradeItem.techUsage;
}

/**
 * Calculate complete final prices for a system including all modifiers
 * This is the main function that combines all pricing logic
 * @param tradeItemIndex Trade item index
 * @param system Solar system data
 * @param traderSkill Player's trader skill
 * @param policeRecord Player's police record score  
 * @param randomFunc Optional random function for testing
 * @returns Object with buy and sell prices
 */
export function calculateFinalPrices(
  tradeItemIndex: number,
  system: Pick<SolarSystem, 'size' | 'techLevel' | 'politics' | 'specialResources' | 'status'>,
  traderSkill: number,
  policeRecord: number,
  randomFunc?: () => number
): { buyPrice: number; sellPrice: number } {
  // Check if system can USE this item (required for sell prices)
  if (!canSystemUseItem(tradeItemIndex, system.techLevel)) {
    return { buyPrice: 0, sellPrice: 0 };
  }

  // Check political restrictions (affects both buy and sell)
  if (isPoliticallyRestricted(tradeItemIndex, system.politics)) {
    return { buyPrice: 0, sellPrice: 0 };
  }

  // Calculate standard base price (this is the sell price foundation)
  let basePrice = calculateStandardPrice(
    tradeItemIndex,
    system.size,
    system.techLevel,
    system.politics,
    system.specialResources
  );

  if (basePrice <= 0) {
    return { buyPrice: 0, sellPrice: 0 };
  }

  // Apply special event modifiers
  basePrice = applySpecialEventModifier(tradeItemIndex, system.status, basePrice);

  // Apply random variance
  basePrice = applyRandomVariance(tradeItemIndex, basePrice, randomFunc);

  if (basePrice <= 0) {
    return { buyPrice: 0, sellPrice: 0 };
  }

  // Calculate sell price (systems can sell items they can USE)
  const isCriminal = policeRecord < DUBIOUSSCORE;
  const sellPrice = calculateSellPrice(basePrice, isCriminal);

  // Calculate buy price (systems can only buy items they can PRODUCE)
  let buyPrice = 0;
  if (canSystemProduceItem(tradeItemIndex, system.techLevel)) {
    buyPrice = calculateBuyPrice(sellPrice, traderSkill, isCriminal, policeRecord);
  }

  return { buyPrice, sellPrice };
}

/**
 * Get all prices for all trade items in a system
 * @param system Solar system data
 * @param traderSkill Player's trader skill
 * @param policeRecord Player's police record score
 * @param randomFunc Optional random function for testing
 * @returns Array of price objects for all 10 trade items
 */
export function getAllSystemPrices(
  system: Pick<SolarSystem, 'size' | 'techLevel' | 'politics' | 'specialResources' | 'status'>,
  traderSkill: number,
  policeRecord: number,
  randomFunc?: () => number
): Array<{ buyPrice: number; sellPrice: number }> {
  const prices = [];
  
  for (let i = 0; i < 10; i++) {
    prices.push(calculateFinalPrices(i, system, traderSkill, policeRecord, randomFunc));
  }
  
  return prices;
}

/**
 * Get current system's prices on-demand (Palm OS style)
 * Matches Palm OS behavior of computing prices when needed rather than storing them
 * @param state Current game state
 * @param systemId Optional system ID to get prices for (defaults to current system)
 * @returns Object with buyPrice and sellPrice arrays
 */
export function getCurrentSystemPrices(
  state: Pick<State, 'solarSystem' | 'currentSystem' | 'commanderTrader' | 'policeRecordScore'>,
  systemId?: number
): { buyPrice: number[]; sellPrice: number[] } {
  const targetSystemId = systemId ?? state.currentSystem;
  const system = state.solarSystem[targetSystemId];
  const allPrices = getAllSystemPrices(system, state.commanderTrader, state.policeRecordScore);
  
  const buyPrice: number[] = [];
  const sellPrice: number[] = [];
  
  for (let i = 0; i < 10; i++) {
    buyPrice[i] = allPrices[i].buyPrice;
    sellPrice[i] = allPrices[i].sellPrice;
  }
  
  return { buyPrice, sellPrice };
}

/**
 * Get stable prices for UI display (no random variance)
 * Used for destination screen and other UI that should show consistent prices until travel
 * @param state Current game state
 * @param systemId Optional system ID to get prices for (defaults to current system)
 * @returns Object with buyPrice and sellPrice arrays (stable, no randomness)
 */
export function getStablePricesForDisplay(
  state: Pick<State, 'solarSystem' | 'currentSystem' | 'commanderTrader' | 'policeRecordScore'>,
  systemId?: number
): { buyPrice: number[]; sellPrice: number[] } {
  const targetSystemId = systemId ?? state.currentSystem;
  const system = state.solarSystem[targetSystemId];
  
  // Use a fixed random function (always returns 0.5) for stable prices
  const stableRandom = () => 0.5;
  const allPrices = getAllSystemPrices(system, state.commanderTrader, state.policeRecordScore, stableRandom);
  
  const buyPrice: number[] = [];
  const sellPrice: number[] = [];
  
  for (let i = 0; i < 10; i++) {
    buyPrice[i] = allPrices[i].buyPrice;
    sellPrice[i] = allPrices[i].sellPrice;
  }
  
  return { buyPrice, sellPrice };
}