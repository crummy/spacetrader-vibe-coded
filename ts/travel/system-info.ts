// System Information Module
// Provides detailed information about systems based on player's knowledge and range

import type { GameState, SolarSystem, TechLevel, SystemSize } from '../types.ts';
import { getSolarSystemName } from '../data/systems.ts';
import { getPoliticalSystem } from '../data/politics.ts';
import { getAllSystemPrices } from '../economy/pricing.ts';
import { calculateDistance, getCurrentFuel } from '../travel/warp.ts';
import { getSystemsWithinRange } from './galaxy.ts';
import { getTradeItemName } from '../data/tradeItems.ts';

// System information levels
export type SystemInfoLevel = 'detailed' | 'summary' | 'unknown';

// Detailed system information (for systems within fuel range)
export interface DetailedSystemInfo {
  level: 'detailed';
  index: number;
  name: string;
  distance: number;
  
  // System properties
  size: SystemSize;
  techLevel: TechLevel;
  government: string;
  
  // Activity levels
  policeStrength: number;
  pirateStrength: number;
  traderStrength: number;
  
  // Economic information
  averagePrices: {
    item: string;
    buyPrice: number;
    sellPrice: number;
    relativeToBest: 'best' | 'good' | 'average' | 'poor';
  }[];
  
  // Special information
  specialResource?: string;
  specialEvent?: string;
  visited: boolean;
  
  // Costs
  fuelCost: number;
  warpCosts?: {
    total: number;
    fuel: number;
    mercenaryPay: number;
    insurance: number;
    interest: number;
  };
}

// Summary system information (for distant systems or galactic chart)
export interface SummarySystemInfo {
  level: 'summary';
  index: number;
  name: string;
  distance: number;
  description: string; // e.g., "Small Industrial Confederacy"
  visited: boolean;
}

// Unknown system information (for systems the player hasn't discovered)
export interface UnknownSystemInfo {
  level: 'unknown';
  index: number;
  name?: string; // May be known from maps/rumors
  distance?: number;
}

export type SystemInfo = DetailedSystemInfo | SummarySystemInfo | UnknownSystemInfo;

/**
 * Get comprehensive information about a system based on player knowledge
 */
export function getSystemInfo(state: GameState, systemIndex: number): SystemInfo {
  const system = state.solarSystem[systemIndex];
  const currentSys = state.solarSystem[state.currentSystem];
  const distance = calculateDistance(currentSys, system);
  const fuelRange = getCurrentFuel(state.ship);
  
  // Determine information level based on distance and visited status
  const isWithinRange = distance <= fuelRange;
  const isCurrentSystem = systemIndex === state.currentSystem;
  
  if (isWithinRange || isCurrentSystem) {
    return getDetailedSystemInfo(state, systemIndex, system, distance);
  } else if (system.visited) {
    return getSummarySystemInfo(state, systemIndex, system, distance);
  } else {
    return getUnknownSystemInfo(systemIndex, distance);
  }
}

/**
 * Get detailed information for systems within range
 */
function getDetailedSystemInfo(state: GameState, index: number, system: SolarSystem, distance: number): DetailedSystemInfo {
  const name = getSolarSystemName(index);
  const politics = getPoliticalSystem(system.politics);
  const prices = getAllSystemPrices(system, state.commanderTrader, state.policeRecordScore);
  
  // Calculate average prices and relative rankings
  const averagePrices = prices.map((priceInfo, itemIndex) => ({
    item: getTradeItemName(itemIndex),
    buyPrice: priceInfo.buyPrice,
    sellPrice: priceInfo.sellPrice,
    relativeToBest: calculatePriceRating(state, itemIndex, priceInfo.buyPrice, priceInfo.sellPrice)
  }));
  
  // Get special resource name if any
  let specialResource: string | undefined;
  if (system.specialResources >= 0 && system.specialResources <= 12) {
    const resourceNames = [
      'Nothing Special', 'Mineral Rich', 'Mineral Poor', 'Desert', 'Lots of Water',
      'Rich Soil', 'Poor Soil', 'Rich Fauna', 'Lifeless', 'Weird Mushrooms',
      'Lots of Herbs', 'Artistic', 'Warlike'
    ];
    specialResource = resourceNames[system.specialResources];
  }
  
  return {
    level: 'detailed',
    index,
    name,
    distance,
    size: system.size,
    techLevel: system.techLevel,
    government: politics.name,
    policeStrength: politics.strengthPolice,
    pirateStrength: politics.strengthPirates,
    traderStrength: politics.strengthTraders,
    averagePrices,
    specialResource: specialResource !== 'Nothing Special' ? specialResource : undefined,
    specialEvent: system.special >= 0 ? 'Special Event Available' : undefined,
    visited: system.visited,
    fuelCost: distance,
    // Note: warp costs would need to be calculated separately if needed
  };
}

/**
 * Get summary information for distant but visited systems
 */
function getSummarySystemInfo(state: GameState, index: number, system: SolarSystem, distance: number): SummarySystemInfo {
  const name = getSolarSystemName(index);
  const politics = getPoliticalSystem(system.politics);
  
  // Create description combining size, tech level, and government
  const sizeNames = ['Tiny', 'Small', 'Medium', 'Large', 'Huge'];
  const techNames = ['Pre-Agricultural', 'Agricultural', 'Medieval', 'Renaissance', 'Early Industrial', 'Industrial', 'Post-Industrial', 'Hi-Tech'];
  
  const sizeName = sizeNames[system.size] || 'Unknown';
  const techName = techNames[system.techLevel] || 'Unknown';
  const description = `${sizeName} ${techName} ${politics.name}`;
  
  return {
    level: 'summary',
    index,
    name,
    distance,
    description,
    visited: system.visited
  };
}

/**
 * Get unknown system information
 */
function getUnknownSystemInfo(index: number, distance?: number): UnknownSystemInfo {
  // In the original game, system names were always known
  // but other details were hidden until visited
  return {
    level: 'unknown',
    index,
    name: getSolarSystemName(index),
    distance
  };
}

/**
 * Calculate price rating relative to all systems
 */
function calculatePriceRating(state: GameState, itemIndex: number, buyPrice: number, sellPrice: number): 'best' | 'good' | 'average' | 'poor' {
  // This is a simplified version - could be enhanced to compare across all known systems
  // For now, just use basic thresholds
  const averagePrice = (buyPrice + sellPrice) / 2;
  
  if (averagePrice === 0) return 'poor';
  if (buyPrice > 0 && sellPrice > buyPrice * 1.5) return 'best';
  if (sellPrice > buyPrice * 1.2) return 'good';
  if (sellPrice > buyPrice) return 'average';
  return 'poor';
}

/**
 * Get information about all systems within fuel range
 */
export function getNearbySystemsInfo(state: GameState): DetailedSystemInfo[] {
  const fuelRange = getCurrentFuel(state.ship);
  const nearbySystemIndices = getSystemsWithinRange(state, fuelRange);
  
  return nearbySystemIndices
    .map(index => getSystemInfo(state, index))
    .filter((info): info is DetailedSystemInfo => info.level === 'detailed');
}

/**
 * Get galactic chart information (summary of all systems)
 */
export function getGalacticChartInfo(state: GameState): SystemInfo[] {
  const allSystems: SystemInfo[] = [];
  
  for (let i = 0; i < state.solarSystem.length; i++) {
    if (state.solarSystem[i]) {
      allSystems.push(getSystemInfo(state, i));
    }
  }
  
  return allSystems.sort((a, b) => {
    // Sort by distance, then by name
    if (a.distance !== undefined && b.distance !== undefined) {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
    }
    return (a.name || '').localeCompare(b.name || '');
  });
}

/**
 * Get information about systems with the best prices for a specific trade item
 */
export function getBestPriceSystemsForItem(state: GameState, tradeItemIndex: number, buying: boolean = true): DetailedSystemInfo[] {
  const nearbyInfo = getNearbySystemsInfo(state);
  
  return nearbyInfo
    .filter(info => {
      const priceInfo = info.averagePrices[tradeItemIndex];
      return buying ? priceInfo.buyPrice > 0 : priceInfo.sellPrice > 0;
    })
    .sort((a, b) => {
      const priceA = buying ? a.averagePrices[tradeItemIndex].buyPrice : a.averagePrices[tradeItemIndex].sellPrice;
      const priceB = buying ? b.averagePrices[tradeItemIndex].buyPrice : b.averagePrices[tradeItemIndex].sellPrice;
      return buying ? priceA - priceB : priceB - priceA; // Ascending for buying, descending for selling
    });
}

/**
 * Format system information for display
 */
export function formatSystemInfo(info: SystemInfo): string {
  switch (info.level) {
    case 'detailed':
      return `${info.name} (${info.distance}ly) - ${info.government}, Tech ${info.techLevel}, ${info.size === 0 ? 'Tiny' : info.size === 1 ? 'Small' : info.size === 2 ? 'Medium' : info.size === 3 ? 'Large' : 'Huge'}`;
    
    case 'summary':
      return `${info.name} (${info.distance}ly) - ${info.description}`;
    
    case 'unknown':
      return info.distance !== undefined 
        ? `${info.name || 'Unknown'} (${info.distance}ly) - Unexplored`
        : `${info.name || 'Unknown'} - Unexplored`;
  }
}
