// Ship Pricing System
// Port of Palm OS ShipPrice.c functionality

import type { GameState, Ship } from '../types.ts';
import { getShipTypes, getShipType, getBuyableShipTypes, isShipTypeBuyable } from '../data/shipTypes.ts';
import { getWeapons, getShields, getGadgets } from '../data/equipment.ts';
import { calculateTribbleShipValuePenalty } from '../creatures/tribbles.ts';
// Helper function to get trader skill from state
function getTraderSkill(state: GameState): number {
  return state.commanderTrader;
}
import { MAXWEAPON, MAXSHIELD, MAXGADGET } from '../types.ts';

/**
 * Calculate the trade-in value of a ship without cargo
 * Based on Palm OS CurrentShipPriceWithoutCargo function
 */
export function calculateShipTradeInValue(state: GameState, forInsurance: boolean = false): number {
  const ship = state.ship;
  const shipType = getShipType(ship.type);
  const weaponTypes = getWeapons();
  const shieldTypes = getShields();
  const gadgetTypes = getGadgets();

  // Trade-in value is three-fourths the original price
  // Reduced to 1/4 if tribbles are present (unless for insurance)
  const tribblePenalty = ship.tribbles > 0 && !forInsurance ? 1 : 3;
  let tradeInValue = Math.floor((shipType.price * tribblePenalty) / 4);

  // Subtract repair costs (damage to hull)
  const maxHull = shipType.hullStrength;
  const currentHull = ship.hull;
  const repairCosts = (maxHull - currentHull) * shipType.repairCosts;
  tradeInValue -= repairCosts;

  // Subtract costs to fill tank with fuel
  const maxFuel = shipType.fuelTanks;
  const currentFuel = ship.fuel;
  const fuelCosts = (maxFuel - currentFuel) * shipType.costOfFuel;
  tradeInValue -= fuelCosts;

  // Add 2/3 of the price of each item of equipment
  for (let i = 0; i < MAXWEAPON; i++) {
    if (ship.weapon[i] >= 0) {
      const weaponPrice = weaponTypes[ship.weapon[i]].price;
      tradeInValue += Math.floor((weaponPrice * 2) / 3);
    }
  }

  for (let i = 0; i < MAXSHIELD; i++) {
    if (ship.shield[i] >= 0) {
      const shieldPrice = shieldTypes[ship.shield[i]].price;
      tradeInValue += Math.floor((shieldPrice * 2) / 3);
    }
  }

  for (let i = 0; i < MAXGADGET; i++) {
    if (ship.gadget[i] >= 0) {
      const gadgetPrice = gadgetTypes[ship.gadget[i]].price;
      tradeInValue += Math.floor((gadgetPrice * 2) / 3);
    }
  }

  return Math.max(0, tradeInValue);
}

/**
 * Calculate the trade-in value of a ship including cargo
 * Based on Palm OS CurrentShipPrice function
 */
export function calculateShipTotalValue(state: GameState, forInsurance: boolean = false): number {
  let totalValue = calculateShipTradeInValue(state, forInsurance);

  // Add value of cargo (based on buying prices)
  for (let i = 0; i < state.ship.cargo.length; i++) {
    const quantity = state.ship.cargo[i];
    if (quantity > 0 && state.buyingPrice[i] > 0) {
      totalValue += quantity * state.buyingPrice[i];
    }
  }

  return totalValue;
}

/**
 * Calculate the base price of a ship for purchase (without trade-in)
 * Based on Palm OS BASESHIPPRICE macro
 */
export function calculateShipBasePrice(state: GameState, shipTypeIndex: number): number {
  if (!isShipTypeBuyable(shipTypeIndex)) {
    throw new Error(`Ship type ${shipTypeIndex} is not buyable`);
  }

  const shipType = getShipType(shipTypeIndex);
  const traderSkill = getTraderSkill(state);
  
  // Base price adjusted by trader skill (higher skill = lower prices)
  const basePrice = Math.floor((shipType.price * (100 - traderSkill)) / 100);
  
  return basePrice;
}

/**
 * Calculate the net cost to buy a ship (base price minus trade-in value)
 * Based on Palm OS DetermineShipPrices function
 * Returns negative values when trade-in exceeds purchase price (cash back to player)
 */
export function calculateShipNetPrice(state: GameState, shipTypeIndex: number): number {
  if (!isShipTypeBuyable(shipTypeIndex)) {
    return 0; // Can't buy this ship
  }

  if (state.ship.type === shipTypeIndex) {
    return 0; // Already have this ship
  }

  const basePrice = calculateShipBasePrice(state, shipTypeIndex);
  const tradeInValue = calculateShipTradeInValue(state, false);
  
  // Net price can be negative (cash back when trade-in exceeds purchase price)
  return basePrice - tradeInValue;
}

/**
 * Get all available ships for purchase with their net prices
 */
export function getAvailableShipsForPurchase(state: GameState): Array<{
  shipType: number;
  name: string;
  netPrice: number;
  basePrice: number;
  tradeInValue: number;
  canAfford: boolean;
}> {
  const tradeInValue = calculateShipTradeInValue(state, false);
  const availableCash = state.credits;
  
  return getBuyableShipTypes().map((shipType, index) => {
    const netPrice = calculateShipNetPrice(state, index);
    const basePrice = calculateShipBasePrice(state, index);
    
    return {
      shipType: index,
      name: shipType.name,
      netPrice,
      basePrice,
      tradeInValue,
      canAfford: netPrice <= 0 || netPrice <= availableCash, // Always affordable if cash back (negative price)
    };
  }).filter(ship => ship.shipType !== state.ship.type); // Exclude current ship
}

/**
 * Check if a specific ship can be purchased
 */
export function canPurchaseShip(state: GameState, shipTypeIndex: number): {
  canPurchase: boolean;
  reason?: string;
} {
  if (!isShipTypeBuyable(shipTypeIndex)) {
    return { canPurchase: false, reason: 'Ship not available for purchase' };
  }

  if (state.ship.type === shipTypeIndex) {
    return { canPurchase: false, reason: 'Already own this ship' };
  }

  if (state.debt > 0) {
    return { canPurchase: false, reason: 'Cannot buy ship while in debt' };
  }

  const netPrice = calculateShipNetPrice(state, shipTypeIndex);
  if (netPrice > state.credits) {
    return { canPurchase: false, reason: 'Insufficient funds' };
  }

  // Check for special equipment that might not transfer
  const newShipType = getShipType(shipTypeIndex);
  
  // Check for passengers that need quarters
  if (state.jarekStatus === 1 && newShipType.crewQuarters < 2) {
    return { canPurchase: false, reason: 'Ambassador Jarek needs crew quarters' };
  }
  
  if (state.wildStatus === 1 && newShipType.crewQuarters < 2) {
    return { canPurchase: false, reason: 'Jonathan Wild needs crew quarters' };
  }

  // Check for reactor (prevents ship sale in original)
  if (state.reactorStatus > 0 && state.reactorStatus < 21) {
    return { canPurchase: false, reason: 'Cannot sell ship with unstable reactor' };
  }

  return { canPurchase: true };
}
