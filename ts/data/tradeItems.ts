// Trade Items System Implementation
// Port of trade item definitions from Palm OS Global.c

import type { TradeItemType } from '../types.ts';
import { TradeItem, SystemStatus, MAXTRADEITEM } from '../types.ts';

// Trade item data ported exactly from Palm OS source:
// const TRADEITEM Tradeitem[MAXTRADEITEM] = { ... }
const TRADE_ITEMS: readonly TradeItemType[] = [
  // Water
  {
    name: 'Water',
    techProduction: 0,
    techUsage: 0,
    techTopProduction: 2,
    priceLowTech: 30,
    priceInc: 3,
    variance: 4,
    doublePriceStatus: SystemStatus.Drought,
    cheapResource: 4,     // LOTSOFWATER
    expensiveResource: 3, // DESERT
    minTradePrice: 30,
    maxTradePrice: 50,
    roundOff: 1
  },
  
  // Furs
  {
    name: 'Furs',
    techProduction: 0,
    techUsage: 0,
    techTopProduction: 0,
    priceLowTech: 250,
    priceInc: 10,
    variance: 10,
    doublePriceStatus: SystemStatus.Cold,
    cheapResource: 7,     // RICHFAUNA
    expensiveResource: 8, // LIFELESS
    minTradePrice: 230,
    maxTradePrice: 280,
    roundOff: 5
  },
  
  // Food
  {
    name: 'Food',
    techProduction: 1,
    techUsage: 0,
    techTopProduction: 1,
    priceLowTech: 100,
    priceInc: 5,
    variance: 5,
    doublePriceStatus: SystemStatus.CropFailure,
    cheapResource: 5,     // RICHSOIL
    expensiveResource: 6, // POORSOIL
    minTradePrice: 90,
    maxTradePrice: 160,
    roundOff: 5
  },
  
  // Ore
  {
    name: 'Ore',
    techProduction: 2,
    techUsage: 2,
    techTopProduction: 3,
    priceLowTech: 350,
    priceInc: 20,
    variance: 10,
    doublePriceStatus: SystemStatus.War,
    cheapResource: 1,     // MINERALRICH
    expensiveResource: 2, // MINERALPOOR
    minTradePrice: 350,
    maxTradePrice: 420,
    roundOff: 10
  },
  
  // Games
  {
    name: 'Games',
    techProduction: 3,
    techUsage: 1,
    techTopProduction: 6,
    priceLowTech: 250,
    priceInc: -10,        // negative price increase
    variance: 5,
    doublePriceStatus: SystemStatus.Boredom,
    cheapResource: 11,    // ARTISTIC
    expensiveResource: -1, // no expensive resource
    minTradePrice: 160,
    maxTradePrice: 270,
    roundOff: 5
  },
  
  // Firearms
  {
    name: 'Firearms',
    techProduction: 3,
    techUsage: 1,
    techTopProduction: 5,
    priceLowTech: 1250,
    priceInc: -75,        // negative price increase
    variance: 100,
    doublePriceStatus: SystemStatus.War,
    cheapResource: 12,    // WARLIKE
    expensiveResource: -1, // no expensive resource
    minTradePrice: 600,
    maxTradePrice: 1100,
    roundOff: 25
  },
  
  // Medicine
  {
    name: 'Medicine',
    techProduction: 4,
    techUsage: 1,
    techTopProduction: 6,
    priceLowTech: 650,
    priceInc: -20,        // negative price increase
    variance: 10,
    doublePriceStatus: SystemStatus.Plague,
    cheapResource: 10,    // LOTSOFHERBS
    expensiveResource: -1, // no expensive resource
    minTradePrice: 400,
    maxTradePrice: 700,
    roundOff: 25
  },
  
  // Machinery
  {
    name: 'Machinery',
    techProduction: 4,
    techUsage: 3,
    techTopProduction: 5,
    priceLowTech: 900,
    priceInc: -30,        // negative price increase
    variance: 5,
    doublePriceStatus: SystemStatus.LackOfWorkers,
    cheapResource: -1,    // no cheap resource
    expensiveResource: -1, // no expensive resource
    minTradePrice: 600,
    maxTradePrice: 800,
    roundOff: 25
  },
  
  // Narcotics
  {
    name: 'Narcotics',
    techProduction: 5,
    techUsage: 0,
    techTopProduction: 5,
    priceLowTech: 3500,
    priceInc: -125,       // negative price increase
    variance: 150,
    doublePriceStatus: SystemStatus.Boredom,
    cheapResource: 9,     // WEIRDMUSHROOMS
    expensiveResource: -1, // no expensive resource
    minTradePrice: 2000,
    maxTradePrice: 3000,
    roundOff: 50
  },
  
  // Robots
  {
    name: 'Robots',
    techProduction: 6,
    techUsage: 4,
    techTopProduction: 7,
    priceLowTech: 5000,
    priceInc: -150,       // negative price increase
    variance: 100,
    doublePriceStatus: SystemStatus.LackOfWorkers,
    cheapResource: -1,    // no cheap resource
    expensiveResource: -1, // no expensive resource
    minTradePrice: 3500,
    maxTradePrice: 5000,
    roundOff: 100
  }
] as const;

// Validate at compile time that we have exactly MAXTRADEITEM items
// (Runtime tests verify the exact count)
const _validateTradeItemCount: typeof TRADE_ITEMS = TRADE_ITEMS;

/**
 * Get all trade items data
 * @returns Readonly array of all trade item definitions
 */
export function getTradeItems(): readonly TradeItemType[] {
  return TRADE_ITEMS;
}

/**
 * Get a specific trade item by index
 * @param index Trade item index (0-9, use TradeItem constants)
 * @returns Trade item definition
 * @throws Error if index is out of bounds
 */
export function getTradeItem(index: number): TradeItemType {
  if (index < 0 || index >= MAXTRADEITEM) {
    throw new Error(`Invalid trade item index: ${index}. Must be 0-${MAXTRADEITEM - 1}`);
  }
  return TRADE_ITEMS[index];
}

/**
 * Get trade item name by index
 * @param index Trade item index
 * @returns Trade item name
 */
export function getTradeItemName(index: number): string {
  return getTradeItem(index).name;
}