// Equipment Trading System Implementation
// Handles buying, selling, and installing weapons, shields, and gadgets

import type { GameState } from '../types.ts';
import { getWeapon, getShield, getGadget, isWeaponBuyable, isShieldBuyable, isGadgetBuyable } from '../data/equipment.ts';

/**
 * Result of an equipment transaction
 */
export interface EquipmentTradeResult {
  success: boolean;
  reason?: string;
  costPaid?: number;
  pricePaid?: number;
  itemInstalled?: boolean;
  slotIndex?: number;
}

/**
 * Calculate base sell price for equipment (from Palm OS BaseSellPrice macro)
 * Equipment sells for 3/4 of base price (75%)
 */
function calculateSellPrice(basePrice: number): number {
  return Math.floor((basePrice * 3) / 4);
}

/**
 * Calculate buy price for equipment with trader skill bonus
 * Trader skill reduces prices by up to 10% (similar to cargo trading)
 */
function calculateBuyPrice(basePrice: number, traderSkill: number): number {
  const discountPercent = Math.min(traderSkill, 10); // Max 10% discount
  return Math.floor(basePrice * (100 - discountPercent) / 100);
}

/**
 * Check if system's tech level supports buying this equipment
 */
function canSystemSellEquipment(systemTechLevel: number, equipmentTechLevel: number): boolean {
  return systemTechLevel >= equipmentTechLevel;
}

/**
 * Find first empty weapon slot
 * @param state Game state
 * @returns Slot index (0-2) or -1 if no empty slots
 */
function findEmptyWeaponSlot(state: GameState): number {
  for (let i = 0; i < 3; i++) {
    if (state.ship.weapon[i] === -1) {
      return i;
    }
  }
  return -1;
}

/**
 * Find first empty shield slot  
 * @param state Game state
 * @returns Slot index (0-2) or -1 if no empty slots
 */
function findEmptyShieldSlot(state: GameState): number {
  for (let i = 0; i < 3; i++) {
    if (state.ship.shield[i] === -1) {
      return i;
    }
  }
  return -1;
}

/**
 * Find first empty gadget slot
 * @param state Game state  
 * @returns Slot index (0-2) or -1 if no empty slots
 */
function findEmptyGadgetSlot(state: GameState): number {
  for (let i = 0; i < 3; i++) {
    if (state.ship.gadget[i] === -1) {
      return i;
    }
  }
  return -1;
}

/**
 * Buy and install a weapon
 * @param state Game state (will be modified)
 * @param weaponIndex Index of weapon type to buy (0-2 for buyable weapons)
 * @returns Result of the transaction
 */
export function buyWeapon(state: GameState, weaponIndex: number): EquipmentTradeResult {
  // Validate weapon index
  if (!isWeaponBuyable(weaponIndex)) {
    return { success: false, reason: 'Weapon not available for purchase' };
  }

  const weapon = getWeapon(weaponIndex);
  const currentSystem = state.solarSystem[state.currentSystem];

  // Check tech level requirement
  if (!canSystemSellEquipment(currentSystem.techLevel, weapon.techLevel)) {
    return { success: false, reason: `Weapon requires tech level ${weapon.techLevel}` };
  }

  // Calculate price with trader skill discount
  const buyPrice = calculateBuyPrice(weapon.price, state.commanderTrader);

  // Check if player has enough credits
  if (state.credits < buyPrice) {
    return { success: false, reason: 'Insufficient credits' };
  }

  // Find empty weapon slot
  const slotIndex = findEmptyWeaponSlot(state);
  if (slotIndex === -1) {
    return { success: false, reason: 'No empty weapon slots available' };
  }

  // Complete the transaction
  state.credits -= buyPrice;
  state.ship.weapon[slotIndex] = weaponIndex;

  return {
    success: true,
    reason: `${weapon.name} purchased and installed`,
    costPaid: buyPrice,
    itemInstalled: true,
    slotIndex
  };
}

/**
 * Sell an installed weapon
 * @param state Game state (will be modified)
 * @param slotIndex Weapon slot to sell from (0-2)
 * @returns Result of the transaction
 */
export function sellWeapon(state: GameState, slotIndex: number): EquipmentTradeResult {
  // Validate slot index
  if (slotIndex < 0 || slotIndex >= 3) {
    return { success: false, reason: 'Invalid weapon slot' };
  }

  const weaponIndex = state.ship.weapon[slotIndex];
  if (weaponIndex === -1) {
    return { success: false, reason: 'No weapon in that slot' };
  }

  const weapon = getWeapon(weaponIndex);
  const sellPrice = calculateSellPrice(weapon.price);

  // Complete the transaction
  state.credits += sellPrice;
  state.ship.weapon[slotIndex] = -1;

  return {
    success: true,
    reason: `${weapon.name} sold`,
    pricePaid: sellPrice
  };
}

/**
 * Buy and install a shield
 * @param state Game state (will be modified)
 * @param shieldIndex Index of shield type to buy (0-1 for buyable shields)
 * @returns Result of the transaction
 */
export function buyShield(state: GameState, shieldIndex: number): EquipmentTradeResult {
  // Validate shield index
  if (!isShieldBuyable(shieldIndex)) {
    return { success: false, reason: 'Shield not available for purchase' };
  }

  const shield = getShield(shieldIndex);
  const currentSystem = state.solarSystem[state.currentSystem];

  // Check tech level requirement
  if (!canSystemSellEquipment(currentSystem.techLevel, shield.techLevel)) {
    return { success: false, reason: `Shield requires tech level ${shield.techLevel}` };
  }

  // Calculate price with trader skill discount
  const buyPrice = calculateBuyPrice(shield.price, state.commanderTrader);

  // Check if player has enough credits
  if (state.credits < buyPrice) {
    return { success: false, reason: 'Insufficient credits' };
  }

  // Find empty shield slot
  const slotIndex = findEmptyShieldSlot(state);
  if (slotIndex === -1) {
    return { success: false, reason: 'No empty shield slots available' };
  }

  // Complete the transaction
  state.credits -= buyPrice;
  state.ship.shield[slotIndex] = shieldIndex;
  state.ship.shieldStrength[slotIndex] = shield.power; // Full shield strength

  return {
    success: true,
    reason: `${shield.name} purchased and installed`,
    costPaid: buyPrice,
    itemInstalled: true,
    slotIndex
  };
}

/**
 * Sell an installed shield
 * @param state Game state (will be modified)
 * @param slotIndex Shield slot to sell from (0-2)
 * @returns Result of the transaction
 */
export function sellShield(state: GameState, slotIndex: number): EquipmentTradeResult {
  // Validate slot index
  if (slotIndex < 0 || slotIndex >= 3) {
    return { success: false, reason: 'Invalid shield slot' };
  }

  const shieldIndex = state.ship.shield[slotIndex];
  if (shieldIndex === -1) {
    return { success: false, reason: 'No shield in that slot' };
  }

  const shield = getShield(shieldIndex);
  const sellPrice = calculateSellPrice(shield.price);

  // Complete the transaction
  state.credits += sellPrice;
  state.ship.shield[slotIndex] = -1;
  state.ship.shieldStrength[slotIndex] = 0;

  return {
    success: true,
    reason: `${shield.name} sold`,
    pricePaid: sellPrice
  };
}

/**
 * Buy and install a gadget
 * @param state Game state (will be modified)
 * @param gadgetIndex Index of gadget type to buy (0-4 for buyable gadgets)
 * @returns Result of the transaction
 */
export function buyGadget(state: GameState, gadgetIndex: number): EquipmentTradeResult {
  // Validate gadget index
  if (!isGadgetBuyable(gadgetIndex)) {
    return { success: false, reason: 'Gadget not available for purchase' };
  }

  const gadget = getGadget(gadgetIndex);
  const currentSystem = state.solarSystem[state.currentSystem];

  // Check tech level requirement
  if (!canSystemSellEquipment(currentSystem.techLevel, gadget.techLevel)) {
    return { success: false, reason: `Gadget requires tech level ${gadget.techLevel}` };
  }

  // Calculate price with trader skill discount
  const buyPrice = calculateBuyPrice(gadget.price, state.commanderTrader);

  // Check if player has enough credits
  if (state.credits < buyPrice) {
    return { success: false, reason: 'Insufficient credits' };
  }

  // Find empty gadget slot
  const slotIndex = findEmptyGadgetSlot(state);
  if (slotIndex === -1) {
    return { success: false, reason: 'No empty gadget slots available' };
  }

  // Complete the transaction
  state.credits -= buyPrice;
  state.ship.gadget[slotIndex] = gadgetIndex;

  return {
    success: true,
    reason: `${gadget.name} purchased and installed`,
    costPaid: buyPrice,
    itemInstalled: true,
    slotIndex
  };
}

/**
 * Sell an installed gadget
 * @param state Game state (will be modified)
 * @param slotIndex Gadget slot to sell from (0-2)
 * @returns Result of the transaction
 */
export function sellGadget(state: GameState, slotIndex: number): EquipmentTradeResult {
  // Validate slot index
  if (slotIndex < 0 || slotIndex >= 3) {
    return { success: false, reason: 'Invalid gadget slot' };
  }

  const gadgetIndex = state.ship.gadget[slotIndex];
  if (gadgetIndex === -1) {
    return { success: false, reason: 'No gadget in that slot' };
  }

  const gadget = getGadget(gadgetIndex);
  const sellPrice = calculateSellPrice(gadget.price);

  // Complete the transaction
  state.credits += sellPrice;
  state.ship.gadget[slotIndex] = -1;

  return {
    success: true,
    reason: `${gadget.name} sold`,
    pricePaid: sellPrice
  };
}

/**
 * Get all buyable equipment for current system with prices
 * @param state Game state
 * @returns Available equipment with prices
 */
export function getAvailableEquipment(state: GameState) {
  const currentSystem = state.solarSystem[state.currentSystem];
  const availableWeapons = [];
  const availableShields = [];
  const availableGadgets = [];

  // Check weapons
  for (let i = 0; i < 3; i++) { // 3 buyable weapons
    const weapon = getWeapon(i);
    if (currentSystem.techLevel >= weapon.techLevel) {
      availableWeapons.push({
        index: i,
        name: weapon.name,
        price: calculateBuyPrice(weapon.price, state.commanderTrader),
        techLevel: weapon.techLevel,
        power: weapon.power
      });
    }
  }

  // Check shields
  for (let i = 0; i < 2; i++) { // 2 buyable shields
    const shield = getShield(i);
    if (currentSystem.techLevel >= shield.techLevel) {
      availableShields.push({
        index: i,
        name: shield.name,
        price: calculateBuyPrice(shield.price, state.commanderTrader),
        techLevel: shield.techLevel,
        power: shield.power
      });
    }
  }

  // Check gadgets
  for (let i = 0; i < 5; i++) { // 5 buyable gadgets
    const gadget = getGadget(i);
    if (currentSystem.techLevel >= gadget.techLevel) {
      availableGadgets.push({
        index: i,
        name: gadget.name,
        price: calculateBuyPrice(gadget.price, state.commanderTrader),
        techLevel: gadget.techLevel
      });
    }
  }

  return {
    weapons: availableWeapons,
    shields: availableShields,
    gadgets: availableGadgets
  };
}

/**
 * Get sell prices for currently installed equipment
 * @param state Game state
 * @returns Equipment that can be sold with prices
 */
export function getInstialledEquipmentSellPrices(state: GameState) {
  const sellableWeapons = [];
  const sellableShields = [];
  const sellableGadgets = [];

  // Check installed weapons
  for (let i = 0; i < 3; i++) {
    const weaponIndex = state.ship.weapon[i];
    if (weaponIndex !== -1) {
      const weapon = getWeapon(weaponIndex);
      sellableWeapons.push({
        slotIndex: i,
        weaponIndex,
        name: weapon.name,
        sellPrice: calculateSellPrice(weapon.price)
      });
    }
  }

  // Check installed shields
  for (let i = 0; i < 3; i++) {
    const shieldIndex = state.ship.shield[i];
    if (shieldIndex !== -1) {
      const shield = getShield(shieldIndex);
      sellableShields.push({
        slotIndex: i,
        shieldIndex,
        name: shield.name,
        sellPrice: calculateSellPrice(shield.price),
        currentStrength: state.ship.shieldStrength[i],
        maxStrength: shield.power
      });
    }
  }

  // Check installed gadgets
  for (let i = 0; i < 3; i++) {
    const gadgetIndex = state.ship.gadget[i];
    if (gadgetIndex !== -1) {
      const gadget = getGadget(gadgetIndex);
      sellableGadgets.push({
        slotIndex: i,
        gadgetIndex,
        name: gadget.name,
        sellPrice: calculateSellPrice(gadget.price)
      });
    }
  }

  return {
    weapons: sellableWeapons,
    shields: sellableShields,
    gadgets: sellableGadgets
  };
}
