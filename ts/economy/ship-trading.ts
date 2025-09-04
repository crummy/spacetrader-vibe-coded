// Ship Trading System
// Port of Palm OS BuyShipEvent.c functionality

import type { GameState, Ship } from '../types.ts';
import { getShipType, isShipTypeBuyable } from '../data/shipTypes.ts';
import { getWeapons, getShields, getGadgets } from '../data/equipment.ts';
import { 
  calculateShipNetPrice, 
  canPurchaseShip,
  calculateShipTradeInValue,
  calculateShipBasePrice,
  getAvailableShipsForPurchase
} from './ship-pricing.ts';
import { MAXWEAPON, MAXSHIELD, MAXGADGET } from '../types.ts';

/**
 * Equipment transfer result for special equipment
 */
export interface EquipmentTransferInfo {
  hasLightningShield: boolean;
  hasFuelCompactor: boolean;
  hasMorganLaser: boolean;
  canTransferLightning: boolean;
  canTransferCompactor: boolean;
  canTransferMorgan: boolean;
  lightningTransferCost: number;
  compactorTransferCost: number;
  morganTransferCost: number;
}

/**
 * Ship purchase result
 */
export interface ShipPurchaseResult {
  success: boolean;
  error?: string;
  newState?: GameState;
  transferInfo?: EquipmentTransferInfo;
}

/**
 * Create a new ship of the specified type
 * Based on Palm OS CreateShip function
 */
function createShip(shipTypeIndex: number): Ship {
  const shipType = getShipType(shipTypeIndex);
  
  return {
    type: shipTypeIndex,
    hull: shipType.hullStrength,
    fuel: shipType.fuelTanks,
    
    // Initialize all equipment slots to empty (-1)
    weapon: [-1, -1, -1] as [number, number, number],
    shield: [-1, -1, -1] as [number, number, number],
    gadget: [-1, -1, -1] as [number, number, number],
    
    // Initialize cargo to empty
    cargo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as [number, number, number, number, number, number, number, number, number, number],
    
    // Initialize crew quarters to empty
    crew: [-1, -1, -1] as [number, number, number],
    
    // Track filled vs. used slots
    filledCargo: 0,
  };
}

/**
 * Check what special equipment can be transferred to a new ship
 */
function analyzeEquipmentTransfer(currentShip: Ship, targetShipTypeIndex: number): EquipmentTransferInfo {
  const targetShipType = getShipType(targetShipTypeIndex);
  
  // Constants for special equipment (from Palm OS)
  const LIGHTNINGSHIELD = 0; // Assuming Lightning Shield is index 0 in shields
  const FUELCOMPACTOR = 0;   // Assuming Fuel Compactor is index 0 in gadgets  
  const MORGANLASERWEAPON = 0; // Assuming Morgan's Laser is index 0 in weapons
  
  // Check if current ship has special equipment
  const hasLightningShield = currentShip.shield.includes(LIGHTNINGSHIELD);
  const hasFuelCompactor = currentShip.gadget.includes(FUELCOMPACTOR);
  const hasMorganLaser = currentShip.weapon.includes(MORGANLASERWEAPON);
  
  // Check if new ship can accommodate the equipment
  const canTransferLightning = hasLightningShield && targetShipType.shieldSlots > 0;
  const canTransferCompactor = hasFuelCompactor && targetShipType.gadgetSlots > 0;
  const canTransferMorgan = hasMorganLaser && targetShipType.weaponSlots > 0;
  
  return {
    hasLightningShield,
    hasFuelCompactor,
    hasMorganLaser,
    canTransferLightning,
    canTransferCompactor,
    canTransferMorgan,
    lightningTransferCost: 30000,
    compactorTransferCost: 20000,
    morganTransferCost: 33333,
  };
}

/**
 * Transfer equipment from old ship to new ship
 */
function transferEquipment(
  oldShip: Ship, 
  newShip: Ship, 
  transferInfo: EquipmentTransferInfo,
  transferLightning: boolean = false,
  transferCompactor: boolean = false,
  transferMorgan: boolean = false
): Ship {
  const weaponTypes = getWeapons();
  const shieldTypes = getShields();
  const gadgetTypes = getGadgets();
  
  let weaponSlot = 0;
  let shieldSlot = 0;
  let gadgetSlot = 0;
  
  const newShipType = getShipType(newShip.type);
  
  // Transfer regular equipment that fits
  for (let i = 0; i < MAXWEAPON; i++) {
    if (oldShip.weapon[i] >= 0 && weaponSlot < newShipType.weaponSlots) {
      // For now, transfer all equipment (special equipment handling will be refined later)
      newShip.weapon[weaponSlot] = oldShip.weapon[i];
      weaponSlot++;
    }
  }
  
  for (let i = 0; i < MAXSHIELD; i++) {
    if (oldShip.shield[i] >= 0 && shieldSlot < newShipType.shieldSlots) {
      // For now, transfer all equipment (special equipment handling will be refined later)
      newShip.shield[shieldSlot] = oldShip.shield[i];
      shieldSlot++;
    }
  }
  
  for (let i = 0; i < MAXGADGET; i++) {
    if (oldShip.gadget[i] >= 0 && gadgetSlot < newShipType.gadgetSlots) {
      // For now, transfer all equipment (special equipment handling will be refined later)
      newShip.gadget[gadgetSlot] = oldShip.gadget[i];
      gadgetSlot++;
    }
  }
  
  // Transfer special equipment if requested
  if (transferLightning && transferInfo.canTransferLightning && shieldSlot < newShipType.shieldSlots) {
    newShip.shield[shieldSlot] = 0; // Lightning Shield
  }
  
  if (transferCompactor && transferInfo.canTransferCompactor && gadgetSlot < newShipType.gadgetSlots) {
    newShip.gadget[gadgetSlot] = 0; // Fuel Compactor
  }
  
  if (transferMorgan && transferInfo.canTransferMorgan && weaponSlot < newShipType.weaponSlots) {
    newShip.weapon[weaponSlot] = 0; // Morgan's Laser
  }
  
  // Transfer crew (up to capacity)
  const crewToTransfer = Math.min(oldShip.crew.filter(c => c >= 0).length, newShipType.crewQuarters);
  for (let i = 0; i < crewToTransfer; i++) {
    if (oldShip.crew[i] >= 0) {
      newShip.crew[i] = oldShip.crew[i];
    }
  }
  
  return newShip;
}

/**
 * Transfer cargo from old ship to new ship
 */
function transferCargo(oldShip: Ship, newShip: Ship): Ship {
  const newShipType = getShipType(newShip.type);
  const maxCargoSpace = newShipType.cargoBays;
  
  let totalCargo = 0;
  const transferredCargo = [...newShip.cargo] as [number, number, number, number, number, number, number, number, number, number];
  
  // Transfer as much cargo as possible
  for (let i = 0; i < oldShip.cargo.length; i++) {
    const available = oldShip.cargo[i];
    const spaceLeft = maxCargoSpace - totalCargo;
    const toTransfer = Math.min(available, spaceLeft);
    
    transferredCargo[i] = toTransfer;
    totalCargo += toTransfer;
    
    if (totalCargo >= maxCargoSpace) break;
  }
  
  newShip.cargo = transferredCargo;
  newShip.filledCargo = totalCargo;
  
  return newShip;
}

/**
 * Purchase a ship
 * Based on Palm OS BuyShipEvent.c logic
 */
export function purchaseShip(
  state: GameState, 
  shipTypeIndex: number,
  transferOptions: {
    transferLightning?: boolean;
    transferCompactor?: boolean;
    transferMorgan?: boolean;
  } = {}
): ShipPurchaseResult {
  // Validate purchase
  const canPurchase = canPurchaseShip(state, shipTypeIndex);
  if (!canPurchase.canPurchase) {
    return { success: false, error: canPurchase.reason };
  }
  
  // Calculate costs
  const netPrice = calculateShipNetPrice(state, shipTypeIndex);
  const transferInfo = analyzeEquipmentTransfer(state.ship, shipTypeIndex);
  
  // Calculate special equipment transfer costs
  let totalEquipmentCost = 0;
  if (transferOptions.transferLightning && transferInfo.canTransferLightning) {
    totalEquipmentCost += transferInfo.lightningTransferCost;
  }
  if (transferOptions.transferCompactor && transferInfo.canTransferCompactor) {
    totalEquipmentCost += transferInfo.compactorTransferCost;
  }
  if (transferOptions.transferMorgan && transferInfo.canTransferMorgan) {
    totalEquipmentCost += transferInfo.morganTransferCost;
  }
  
  const totalCost = netPrice + totalEquipmentCost;
  
  if (totalCost > state.credits) {
    return { success: false, error: 'Insufficient funds including equipment transfer costs' };
  }
  
  // Create the new ship
  let newShip = createShip(shipTypeIndex);
  
  // Transfer equipment and cargo
  newShip = transferEquipment(
    state.ship, 
    newShip, 
    transferInfo,
    transferOptions.transferLightning,
    transferOptions.transferCompactor,
    transferOptions.transferMorgan
  );
  
  newShip = transferCargo(state.ship, newShip);
  
  // Update game state
  const newState: GameState = {
    ...state,
    ship: newShip,
    credits: state.credits - totalCost,
  };
  
  return {
    success: true,
    newState,
    transferInfo,
  };
}

/**
 * Get detailed information about a potential ship purchase
 */
export function getShipPurchaseInfo(state: GameState, shipTypeIndex: number): {
  shipType: number;
  name: string;
  netPrice: number;
  basePrice: number;
  tradeInValue: number;
  canAfford: boolean;
  canPurchase: boolean;
  reason?: string;
  transferInfo: EquipmentTransferInfo;
  cargoLoss: number; // Units of cargo that would be lost
} {
  const shipType = getShipType(shipTypeIndex);
  const netPrice = calculateShipNetPrice(state, shipTypeIndex);
  const basePrice = calculateShipBasePrice(state, shipTypeIndex);
  const tradeInValue = calculateShipTradeInValue(state, false);
  const canAfford = netPrice <= state.credits;
  const purchaseCheck = canPurchaseShip(state, shipTypeIndex);
  const transferInfo = analyzeEquipmentTransfer(state.ship, shipTypeIndex);
  
  // Calculate cargo loss
  const currentCargo = state.ship.filledCargo;
  const newCargoCapacity = shipType.cargoBays;
  const cargoLoss = Math.max(0, currentCargo - newCargoCapacity);
  
  return {
    shipType: shipTypeIndex,
    name: shipType.name,
    netPrice,
    basePrice,
    tradeInValue,
    canAfford,
    canPurchase: purchaseCheck.canPurchase,
    reason: purchaseCheck.reason,
    transferInfo,
    cargoLoss,
  };
}
