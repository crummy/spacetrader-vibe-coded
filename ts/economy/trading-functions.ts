// Trading functions for economy integration
// Provides simplified trading functions that match Palm OS interface

import type { State, SolarSystem } from '../types.ts';
import { calculateFinalPrices } from './pricing.ts';
import { calculateEffectiveTraderSkill } from './skill-utils.ts';

/**
 * Calculate buy price for a specific trade item in a system (Palm OS interface)
 * @param tradeItem Trade item index (0-9)
 * @param system System data or system object
 * @param state Game state
 * @returns Buy price for the trade item
 */
export function calculateBuyPrice(tradeItem: number, system: any, state: State, randomFunc?: () => number): number {
  const effectiveTraderSkill = calculateEffectiveTraderSkill(state);
  
  // Handle both full SolarSystem objects and simplified system objects
  const systemData = {
    size: system.size ?? 0,
    techLevel: system.techLevel ?? 4,
    politics: system.government ?? system.politics ?? 0,
    specialResources: system.specialResources ?? 0,
    status: system.status ?? 0
  };
  
  const prices = calculateFinalPrices(
    tradeItem,
    systemData,
    effectiveTraderSkill,
    state.policeRecordScore,
    randomFunc
  );

  return prices.buyPrice;
}

/**
 * Calculate sell price for a specific trade item in a system (Palm OS interface)
 * @param tradeItem Trade item index (0-9)
 * @param system System data or system object
 * @param state Game state
 * @returns Sell price for the trade item
 */
export function calculateSellPrice(tradeItem: number, system: any, state: State, randomFunc?: () => number): number {
  const effectiveTraderSkill = calculateEffectiveTraderSkill(state);
  
  // Handle both full SolarSystem objects and simplified system objects
  const systemData = {
    size: system.size ?? 0,
    techLevel: system.techLevel ?? 4,
    politics: system.government ?? system.politics ?? 0,
    specialResources: system.specialResources ?? 0,
    status: system.status ?? 0
  };
  
  const prices = calculateFinalPrices(
    tradeItem,
    systemData,
    effectiveTraderSkill,
    state.policeRecordScore,
    randomFunc
  );

  return prices.sellPrice;
}
