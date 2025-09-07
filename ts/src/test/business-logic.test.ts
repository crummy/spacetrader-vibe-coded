import { describe, test } from 'node:test';
import { strict as assert } from 'node:assert';
import { SYSTEM_CONSTANTS } from './system-constants.test.ts';

// Local interfaces
interface Ship {
  type: number;
  cargo: number[];
  weapon: number[];
  shield: number[];
  shieldStrength: number[];
  gadget: number[];
  crew: number[];
  fuel: number;
  hull: number;
  tribbles: number;
  forFutureUse: number[];
}

interface SolarSystem {
  nameIndex: number;
  techLevel: number;
  politics: number;
  status: number;
  x: number;
  y: number;
  specialResources: number;
  size: number;
  qty: number[];
  countDown: number;
  visited: boolean;
  special: number;
}
export interface TradeItem {
  name: string;
  techProduction: number;
  techUsage: number;
  techTopProduction: number;
  priceLowTech: number;
  priceInc: number;
  variance: number;
  doublePriceStatus: number;
  cheapResource: number;
  expensiveResource: number;
  minTradePrice: number;
  maxTradePrice: number;
  roundOff: number;
}

export interface Politics {
  name: string;
  reactionIllegal: number;
  strengthPolice: number;
  strengthPirates: number;
  strengthTraders: number;
  minTechLevel: number;
  maxTechLevel: number;
  bribeLevel: number;
  drugsOK: boolean;
  firearmsOK: boolean;
  wanted: number;
}

// Business logic implementations from the Palm OS code
export const TRADE_ITEMS: TradeItem[] = [
  { name: "Water", techProduction: 0, techUsage: 0, techTopProduction: 2, priceLowTech: 30, priceInc: 3, variance: 4, doublePriceStatus: 3, cheapResource: 4, expensiveResource: 3, minTradePrice: 30, maxTradePrice: 50, roundOff: 1 },
  { name: "Furs", techProduction: 0, techUsage: 0, techTopProduction: 0, priceLowTech: 250, priceInc: 10, variance: 10, doublePriceStatus: 5, cheapResource: 7, expensiveResource: 8, minTradePrice: 230, maxTradePrice: 280, roundOff: 5 },
  { name: "Food", techProduction: 1, techUsage: 0, techTopProduction: 1, priceLowTech: 100, priceInc: 5, variance: 5, doublePriceStatus: 6, cheapResource: 5, expensiveResource: 6, minTradePrice: 90, maxTradePrice: 160, roundOff: 5 },
  { name: "Ore", techProduction: 2, techUsage: 2, techTopProduction: 3, priceLowTech: 350, priceInc: 20, variance: 10, doublePriceStatus: 1, cheapResource: 1, expensiveResource: 2, minTradePrice: 350, maxTradePrice: 420, roundOff: 10 },
  { name: "Games", techProduction: 3, techUsage: 1, techTopProduction: 6, priceLowTech: 250, priceInc: -10, variance: 5, doublePriceStatus: 4, cheapResource: 11, expensiveResource: -1, minTradePrice: 160, maxTradePrice: 270, roundOff: 5 },
  { name: "Firearms", techProduction: 3, techUsage: 1, techTopProduction: 5, priceLowTech: 1250, priceInc: -75, variance: 100, doublePriceStatus: 1, cheapResource: 12, expensiveResource: -1, minTradePrice: 600, maxTradePrice: 1100, roundOff: 25 },
  { name: "Medicine", techProduction: 4, techUsage: 1, techTopProduction: 6, priceLowTech: 650, priceInc: -20, variance: 10, doublePriceStatus: 2, cheapResource: 10, expensiveResource: -1, minTradePrice: 400, maxTradePrice: 700, roundOff: 25 },
  { name: "Machines", techProduction: 4, techUsage: 3, techTopProduction: 5, priceLowTech: 900, priceInc: -30, variance: 5, doublePriceStatus: 7, cheapResource: -1, expensiveResource: -1, minTradePrice: 600, maxTradePrice: 800, roundOff: 25 },
  { name: "Narcotics", techProduction: 5, techUsage: 0, techTopProduction: 5, priceLowTech: 3500, priceInc: -125, variance: 150, doublePriceStatus: 4, cheapResource: 9, expensiveResource: -1, minTradePrice: 2000, maxTradePrice: 3000, roundOff: 50 },
  { name: "Robots", techProduction: 6, techUsage: 4, techTopProduction: 7, priceLowTech: 5000, priceInc: -150, variance: 100, doublePriceStatus: 7, cheapResource: -1, expensiveResource: -1, minTradePrice: 3500, maxTradePrice: 5000, roundOff: 100 }
];

export const POLITICS_TYPES: Politics[] = [
  { name: "Anarchy", reactionIllegal: 0, strengthPolice: 0, strengthPirates: 7, strengthTraders: 1, minTechLevel: 0, maxTechLevel: 5, bribeLevel: 7, drugsOK: true, firearmsOK: true, wanted: 2 },
  { name: "Capitalist State", reactionIllegal: 2, strengthPolice: 3, strengthPirates: 2, strengthTraders: 7, minTechLevel: 4, maxTechLevel: 7, bribeLevel: 1, drugsOK: true, firearmsOK: true, wanted: 3 },
  { name: "Communist State", reactionIllegal: 6, strengthPolice: 6, strengthPirates: 4, strengthTraders: 4, minTechLevel: 1, maxTechLevel: 5, bribeLevel: 5, drugsOK: true, firearmsOK: true, wanted: -1 },
  { name: "Confederacy", reactionIllegal: 5, strengthPolice: 4, strengthPirates: 3, strengthTraders: 5, minTechLevel: 1, maxTechLevel: 6, bribeLevel: 3, drugsOK: true, firearmsOK: true, wanted: 4 },
  { name: "Corporate State", reactionIllegal: 2, strengthPolice: 6, strengthPirates: 2, strengthTraders: 7, minTechLevel: 4, maxTechLevel: 7, bribeLevel: 2, drugsOK: true, firearmsOK: true, wanted: 9 },
  { name: "Cybernetic State", reactionIllegal: 0, strengthPolice: 7, strengthPirates: 7, strengthTraders: 5, minTechLevel: 6, maxTechLevel: 7, bribeLevel: 0, drugsOK: false, firearmsOK: false, wanted: 3 },
  { name: "Democracy", reactionIllegal: 4, strengthPolice: 3, strengthPirates: 2, strengthTraders: 5, minTechLevel: 3, maxTechLevel: 7, bribeLevel: 2, drugsOK: true, firearmsOK: true, wanted: 4 },
  { name: "Dictatorship", reactionIllegal: 3, strengthPolice: 4, strengthPirates: 5, strengthTraders: 3, minTechLevel: 0, maxTechLevel: 7, bribeLevel: 2, drugsOK: true, firearmsOK: true, wanted: -1 },
  { name: "Fascist State", reactionIllegal: 7, strengthPolice: 7, strengthPirates: 7, strengthTraders: 1, minTechLevel: 4, maxTechLevel: 7, bribeLevel: 0, drugsOK: false, firearmsOK: true, wanted: 7 },
  { name: "Feudal State", reactionIllegal: 1, strengthPolice: 1, strengthPirates: 6, strengthTraders: 2, minTechLevel: 0, maxTechLevel: 3, bribeLevel: 6, drugsOK: true, firearmsOK: true, wanted: 5 },
  { name: "Military State", reactionIllegal: 7, strengthPolice: 7, strengthPirates: 0, strengthTraders: 6, minTechLevel: 2, maxTechLevel: 7, bribeLevel: 0, drugsOK: false, firearmsOK: true, wanted: 9 },
  { name: "Monarchy", reactionIllegal: 3, strengthPolice: 4, strengthPirates: 3, strengthTraders: 4, minTechLevel: 0, maxTechLevel: 5, bribeLevel: 4, drugsOK: true, firearmsOK: true, wanted: 6 },
  { name: "Pacifist State", reactionIllegal: 7, strengthPolice: 2, strengthPirates: 1, strengthTraders: 5, minTechLevel: 0, maxTechLevel: 3, bribeLevel: 1, drugsOK: true, firearmsOK: false, wanted: -1 },
  { name: "Socialist State", reactionIllegal: 4, strengthPolice: 2, strengthPirates: 5, strengthTraders: 3, minTechLevel: 0, maxTechLevel: 5, bribeLevel: 6, drugsOK: true, firearmsOK: true, wanted: -1 },
  { name: "State of Satori", reactionIllegal: 0, strengthPolice: 1, strengthPirates: 1, strengthTraders: 1, minTechLevel: 0, maxTechLevel: 1, bribeLevel: 0, drugsOK: false, firearmsOK: false, wanted: -1 },
  { name: "Technocracy", reactionIllegal: 1, strengthPolice: 6, strengthPirates: 3, strengthTraders: 6, minTechLevel: 4, maxTechLevel: 7, bribeLevel: 2, drugsOK: true, firearmsOK: true, wanted: 0 },
  { name: "Theocracy", reactionIllegal: 5, strengthPolice: 6, strengthPirates: 1, strengthTraders: 4, minTechLevel: 0, maxTechLevel: 4, bribeLevel: 0, drugsOK: true, firearmsOK: true, wanted: 8 }
];

// Price calculation functions
export function calculateBasePrice(techLevel: number, basePrice: number): number {
  // Simplified base price calculation
  return basePrice;
}

export function calculateTradePrice(
  item: TradeItem, 
  systemTechLevel: number, 
  systemStatus: number, 
  systemResources: number,
  systemSize: number
): number {
  let price = item.priceLowTech + (item.priceInc * systemTechLevel);
  
  // Status effects - double price for certain events
  if (systemStatus === item.doublePriceStatus) {
    price *= 2;
  }
  
  // Resource effects
  if (systemResources === item.cheapResource) {
    price = Math.floor(price * 0.7); // 30% cheaper
  } else if (systemResources === item.expensiveResource) {
    price = Math.floor(price * 1.5); // 50% more expensive
  }
  
  // System size effect (larger systems have more supply/demand variation)
  const sizeMultiplier = 0.9 + (systemSize * 0.05); // 0.9 to 1.1
  price = Math.floor(price * sizeMultiplier);
  
  // Apply variance (simplified)
  const variance = Math.random() * item.variance * 2 - item.variance;
  price = Math.floor(price * (1 + variance / 100));
  
  // Ensure minimum price
  return Math.max(price, 1);
}

export function calculateShipPrice(basePrice: number, traderSkill: number, difficulty: number): number {
  // From BASESHIPPRICE macro
  return Math.floor((basePrice * (100 - traderSkill)) / 100);
}

export function getPoliceReactionLevel(policeRecordScore: number): string {
  if (policeRecordScore < SYSTEM_CONSTANTS.PSYCHOPATHSCORE) return "Psycho";
  if (policeRecordScore < SYSTEM_CONSTANTS.VILLAINSCORE) return "Villain";
  if (policeRecordScore < SYSTEM_CONSTANTS.CRIMINALSCORE) return "Criminal";
  if (policeRecordScore < SYSTEM_CONSTANTS.DUBIOUSSCORE) return "Crook";
  if (policeRecordScore < SYSTEM_CONSTANTS.CLEANSCORE) return "Dubious";
  if (policeRecordScore < SYSTEM_CONSTANTS.LAWFULSCORE) return "Clean";
  if (policeRecordScore < SYSTEM_CONSTANTS.TRUSTEDSCORE) return "Lawful";
  if (policeRecordScore < SYSTEM_CONSTANTS.HELPERSCORE) return "Trusted";
  if (policeRecordScore < SYSTEM_CONSTANTS.HEROSCORE) return "Liked";
  return "Hero";
}

export function getReputationLevel(killScore: number): string {
  if (killScore < 10) return "Harmless";
  if (killScore < 20) return "Mostly harmless";
  if (killScore < 40) return "Poor";
  if (killScore < 80) return "Average";
  if (killScore < 150) return "Above average";
  if (killScore < 300) return "Competent";
  if (killScore < 600) return "Dangerous";
  if (killScore < 1500) return "Deadly";
  return "Elite";
}

export function calculatePoliceStrengthForSystem(
  basePoliticsStrength: number, 
  policeRecordScore: number
): number {
  if (policeRecordScore < SYSTEM_CONSTANTS.PSYCHOPATHSCORE) {
    return 3 * basePoliticsStrength;
  } else if (policeRecordScore < SYSTEM_CONSTANTS.VILLAINSCORE) {
    return 2 * basePoliticsStrength;
  } else {
    return basePoliticsStrength;
  }
}

export function isDebtWarning(debt: number): boolean {
  return debt >= SYSTEM_CONSTANTS.DEBTWARNING;
}

export function isDebtTooLarge(debt: number): boolean {
  return debt >= SYSTEM_CONSTANTS.DEBTTOOLARGE;
}

export function isValidTradeTransaction(
  ship: Ship, 
  tradeItemIndex: number, 
  quantity: number, 
  isBuying: boolean
): { valid: boolean; error?: string } {
  if (tradeItemIndex < 0 || tradeItemIndex >= SYSTEM_CONSTANTS.MAXTRADEITEM) {
    return { valid: false, error: "Invalid trade item index" };
  }
  
  if (quantity < 0) {
    return { valid: false, error: "Quantity cannot be negative" };
  }
  
  if (isBuying) {
    // Check cargo space
    const currentCargo = ship.cargo.reduce((sum, qty) => sum + qty, 0);
    const maxCargo = getShipCargoBays(ship.type);
    
    if (currentCargo + quantity > maxCargo) {
      return { valid: false, error: "Not enough cargo space" };
    }
  } else {
    // Check if we have enough to sell
    if (ship.cargo[tradeItemIndex] < quantity) {
      return { valid: false, error: "Not enough cargo to sell" };
    }
  }
  
  return { valid: true };
}

export function getShipCargoBays(shipType: number): number {
  // Simplified ship cargo bay calculation based on ship types from Global.c
  const cargoBaysByType = [10, 15, 20, 15, 25, 50, 20, 30, 60, 35];
  return cargoBaysByType[shipType] || 10;
}

export function calculateTradeGoodsValue(ship: Ship, prices: number[]): number {
  return ship.cargo.reduce((total, qty, index) => {
    return total + (qty * prices[index]);
  }, 0);
}

export function canEquipItem(ship: Ship, itemType: 'weapon' | 'shield' | 'gadget'): boolean {
  const slots = ship[itemType];
  return slots.some(slot => slot === -1); // Has empty slot
}

export function getEmptySlotIndex(ship: Ship, itemType: 'weapon' | 'shield' | 'gadget'): number {
  const slots = ship[itemType];
  return slots.findIndex(slot => slot === -1);
}

export function calculateFuelNeeded(distance: number): number {
  // Fuel consumption: 1 unit per parsec, minimum 1
  return Math.max(1, Math.ceil(distance));
}

export function canReachSystem(ship: Ship, distance: number): boolean {
  const fuelNeeded = calculateFuelNeeded(distance);
  return ship.fuel >= fuelNeeded;
}

export function hasSpecialEquipment(ship: Ship, equipmentType: number): boolean {
  return ship.gadget.includes(equipmentType);
}

export function isSystemInRange(
  currentSystem: SolarSystem, 
  targetSystem: SolarSystem, 
  maxRange: number
): boolean {
  const dx = currentSystem.x - targetSystem.x;
  const dy = currentSystem.y - targetSystem.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= maxRange;
}

describe('Business Logic Validation', () => {
  test('trade price calculations', () => {
    const waterItem = TRADE_ITEMS[SYSTEM_CONSTANTS.WATER];
    
    // Test basic price calculation
    const lowTechPrice = calculateTradePrice(waterItem, 0, 0, -1, 2);
    const highTechPrice = calculateTradePrice(waterItem, 7, 0, -1, 2);
    
    // Higher tech should generally increase price due to priceInc being positive for water
    assert.ok(highTechPrice > lowTechPrice);
    
    // Test drought status effect (should double price)
    const droughtPrice = calculateTradePrice(waterItem, 0, SYSTEM_CONSTANTS.DROUGHT, -1, 2);
    const normalPrice = calculateTradePrice(waterItem, 0, SYSTEM_CONSTANTS.UNEVENTFUL, -1, 2);
    
    // During drought, water should be more expensive
    assert.ok(droughtPrice > normalPrice);
  });
  
  test('police record levels', () => {
    assert.strictEqual(getPoliceReactionLevel(-80), "Psycho");
    assert.strictEqual(getPoliceReactionLevel(-40), "Villain");
    assert.strictEqual(getPoliceReactionLevel(-15), "Criminal");
    assert.strictEqual(getPoliceReactionLevel(-7), "Crook");
    assert.strictEqual(getPoliceReactionLevel(-3), "Dubious");
    assert.strictEqual(getPoliceReactionLevel(0), "Clean");
    assert.strictEqual(getPoliceReactionLevel(7), "Lawful");
    assert.strictEqual(getPoliceReactionLevel(15), "Trusted");
    assert.strictEqual(getPoliceReactionLevel(50), "Liked");
    assert.strictEqual(getPoliceReactionLevel(100), "Hero");
  });
  
  test('reputation levels', () => {
    assert.strictEqual(getReputationLevel(5), "Harmless");
    assert.strictEqual(getReputationLevel(15), "Mostly harmless");
    assert.strictEqual(getReputationLevel(30), "Poor");
    assert.strictEqual(getReputationLevel(60), "Average");
    assert.strictEqual(getReputationLevel(120), "Above average");
    assert.strictEqual(getReputationLevel(200), "Competent");
    assert.strictEqual(getReputationLevel(400), "Dangerous");
    assert.strictEqual(getReputationLevel(800), "Deadly");
    assert.strictEqual(getReputationLevel(2000), "Elite");
  });
  
  test('police strength calculation', () => {
    const baseStrength = 5;
    
    assert.strictEqual(calculatePoliceStrengthForSystem(baseStrength, -80), 15); // Psycho
    assert.strictEqual(calculatePoliceStrengthForSystem(baseStrength, -40), 10); // Villain
    assert.strictEqual(calculatePoliceStrengthForSystem(baseStrength, 0), 5);    // Clean
    assert.strictEqual(calculatePoliceStrengthForSystem(baseStrength, 50), 5);   // Hero
  });
  
  test('debt warnings', () => {
    assert.strictEqual(isDebtWarning(50000), false);
    assert.strictEqual(isDebtWarning(75000), true);
    assert.strictEqual(isDebtWarning(80000), true);
    
    assert.strictEqual(isDebtTooLarge(90000), false);
    assert.strictEqual(isDebtTooLarge(100000), true);
    assert.strictEqual(isDebtTooLarge(150000), true);
  });
  
  test('trade transaction validation', () => {
    const testShip: Ship = {
      type: 1,
      cargo: [5, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      weapon: [0, -1, -1],
      shield: [-1, -1, -1],
      shieldStrength: [0, 0, 0],
      gadget: [-1, -1, -1],
      crew: [0, -1, -1],
      fuel: 14,
      hull: 100,
      tribbles: 0,
      forFutureUse: [0, 0, 0, 0]
    };
    
    // Valid buy transaction
    const buyResult = isValidTradeTransaction(testShip, SYSTEM_CONSTANTS.WATER, 5, true);
    assert.strictEqual(buyResult.valid, true);
    
    // Invalid - not enough cargo space (assuming ship has 15 cargo bays, already has 5 water)
    const buyTooMuchResult = isValidTradeTransaction(testShip, SYSTEM_CONSTANTS.FOOD, 15, true);
    assert.strictEqual(buyTooMuchResult.valid, false);
    assert.ok(buyTooMuchResult.error?.includes("cargo space"));
    
    // Valid sell transaction
    const sellResult = isValidTradeTransaction(testShip, SYSTEM_CONSTANTS.WATER, 3, false);
    assert.strictEqual(sellResult.valid, true);
    
    // Invalid - not enough cargo to sell
    const sellTooMuchResult = isValidTradeTransaction(testShip, SYSTEM_CONSTANTS.WATER, 10, false);
    assert.strictEqual(sellTooMuchResult.valid, false);
    assert.ok(sellTooMuchResult.error?.includes("Not enough cargo"));
    
    // Invalid trade item index
    const invalidItemResult = isValidTradeTransaction(testShip, -1, 1, true);
    assert.strictEqual(invalidItemResult.valid, false);
    assert.ok(invalidItemResult.error?.includes("Invalid trade item"));
  });
  
  test('ship equipment management', () => {
    const testShip: Ship = {
      type: 1,
      cargo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      weapon: [0, -1, -1],
      shield: [-1, -1, -1],
      shieldStrength: [0, 0, 0],
      gadget: [-1, -1, -1],
      crew: [0, -1, -1],
      fuel: 14,
      hull: 100,
      tribbles: 0,
      forFutureUse: [0, 0, 0, 0]
    };
    
    // Can equip weapon (has empty slots)
    assert.strictEqual(canEquipItem(testShip, 'weapon'), true);
    assert.strictEqual(getEmptySlotIndex(testShip, 'weapon'), 1);
    
    // Can equip shield (all empty)
    assert.strictEqual(canEquipItem(testShip, 'shield'), true);
    assert.strictEqual(getEmptySlotIndex(testShip, 'shield'), 0);
    
    // Can equip gadget (all empty)
    assert.strictEqual(canEquipItem(testShip, 'gadget'), true);
    assert.strictEqual(getEmptySlotIndex(testShip, 'gadget'), 0);
  });
  
  test('fuel and range calculations', () => {
    const testShip: Ship = {
      type: 1,
      cargo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      weapon: [0, -1, -1],
      shield: [-1, -1, -1],
      shieldStrength: [0, 0, 0],
      gadget: [-1, -1, -1],
      crew: [0, -1, -1],
      fuel: 10,
      hull: 100,
      tribbles: 0,
      forFutureUse: [0, 0, 0, 0]
    };
    
    // Test fuel calculations
    assert.strictEqual(calculateFuelNeeded(5.2), 6); // Rounds up
    assert.strictEqual(calculateFuelNeeded(0.5), 1); // Minimum 1
    assert.strictEqual(calculateFuelNeeded(10), 10);
    
    // Test range validation
    assert.strictEqual(canReachSystem(testShip, 5), true);   // Has 10 fuel, needs 5
    assert.strictEqual(canReachSystem(testShip, 10), true);  // Exactly enough
    assert.strictEqual(canReachSystem(testShip, 15), false); // Not enough fuel
  });
  
  test('system range checking', () => {
    const system1: SolarSystem = {
      nameIndex: 0, techLevel: 4, politics: 6, status: 0,
      x: 10, y: 10, specialResources: 1, size: 2,
      qty: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      countDown: 0, visited: false, special: -1
    };
    
    const system2: SolarSystem = {
      nameIndex: 1, techLevel: 4, politics: 6, status: 0,
      x: 13, y: 14, specialResources: 1, size: 2, // Distance = 5
      qty: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      countDown: 0, visited: false, special: -1
    };
    
    const farSystem: SolarSystem = {
      nameIndex: 2, techLevel: 4, politics: 6, status: 0,
      x: 50, y: 50, specialResources: 1, size: 2, // Distance > 50
      qty: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      countDown: 0, visited: false, special: -1
    };
    
    assert.strictEqual(isSystemInRange(system1, system2, 10), true);
    assert.strictEqual(isSystemInRange(system1, system2, 3), false);
    assert.strictEqual(isSystemInRange(system1, farSystem, 20), false);
  });
  
  test('special equipment checks', () => {
    const shipWithGadget: Ship = {
      type: 1,
      cargo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      weapon: [0, -1, -1],
      shield: [-1, -1, -1],
      shieldStrength: [0, 0, 0],
      gadget: [2, -1, -1], // Has navigating system (index 2)
      crew: [0, -1, -1],
      fuel: 14,
      hull: 100,
      tribbles: 0,
      forFutureUse: [0, 0, 0, 0]
    };
    
    assert.strictEqual(hasSpecialEquipment(shipWithGadget, 2), true);  // Has navigating system
    assert.strictEqual(hasSpecialEquipment(shipWithGadget, 4), false); // Doesn't have cloaking device
  });
  
  test('cargo value calculation', () => {
    const testShip: Ship = {
      type: 1,
      cargo: [5, 3, 0, 2, 0, 0, 1, 0, 0, 0], // 5 water, 3 furs, 2 ore, 1 medicine
      weapon: [0, -1, -1],
      shield: [-1, -1, -1],
      shieldStrength: [0, 0, 0],
      gadget: [-1, -1, -1],
      crew: [0, -1, -1],
      fuel: 14,
      hull: 100,
      tribbles: 0,
      forFutureUse: [0, 0, 0, 0]
    };
    
    const prices = [30, 250, 100, 350, 250, 1250, 650, 900, 3500, 5000];
    const totalValue = calculateTradeGoodsValue(testShip, prices);
    
    // 5*30 + 3*250 + 0*100 + 2*350 + 0*250 + 0*1250 + 1*650 + 0*900 + 0*3500 + 0*5000
    const expectedValue = 150 + 750 + 0 + 700 + 0 + 0 + 650 + 0 + 0 + 0;
    assert.strictEqual(totalValue, expectedValue);
  });
  
  test('political system trade restrictions', () => {
    const cyberneticState = POLITICS_TYPES[5]; // Cybernetic State
    const pacifistState = POLITICS_TYPES[12]; // Pacifist State
    const anarchy = POLITICS_TYPES[0]; // Anarchy
    
    // Cybernetic State doesn't allow drugs or firearms
    assert.strictEqual(cyberneticState.drugsOK, false);
    assert.strictEqual(cyberneticState.firearmsOK, false);
    
    // Pacifist State doesn't allow firearms but allows drugs
    assert.strictEqual(pacifistState.drugsOK, true);
    assert.strictEqual(pacifistState.firearmsOK, false);
    
    // Anarchy allows both
    assert.strictEqual(anarchy.drugsOK, true);
    assert.strictEqual(anarchy.firearmsOK, true);
  });
  
  test('ship price calculation with trader skill', () => {
    const basePrice = 10000;
    
    // No trading skill (0) - full price
    assert.strictEqual(calculateShipPrice(basePrice, 0, 2), 10000);
    
    // High trading skill (20) - 20% discount
    assert.strictEqual(calculateShipPrice(basePrice, 20, 2), 8000);
    
    // Max practical trading skill (50) - 50% discount
    assert.strictEqual(calculateShipPrice(basePrice, 50, 2), 5000);
  });
  
  test('boundary conditions for trade items', () => {
    // Test all trade items have valid indices
    TRADE_ITEMS.forEach((item, index) => {
      assert.ok(index >= 0 && index < SYSTEM_CONSTANTS.MAXTRADEITEM);
      assert.ok(item.name.length > 0);
      assert.ok(item.techProduction >= 0 && item.techProduction <= 7);
      assert.ok(item.techUsage >= 0 && item.techUsage <= 7);
      assert.ok(item.techTopProduction >= 0 && item.techTopProduction <= 7);
      assert.ok(item.priceLowTech > 0);
      assert.ok(item.variance >= 0);
    });
  });
  
  test('political system constraints', () => {
    POLITICS_TYPES.forEach((politics, index) => {
      assert.ok(politics.name.length > 0);
      assert.ok(politics.reactionIllegal >= 0 && politics.reactionIllegal <= 7);
      assert.ok(politics.strengthPolice >= 0 && politics.strengthPolice <= 7);
      assert.ok(politics.strengthPirates >= 0 && politics.strengthPirates <= 7);
      assert.ok(politics.strengthTraders >= 0 && politics.strengthTraders <= 7);
      assert.ok(politics.minTechLevel >= 0 && politics.minTechLevel <= 7);
      assert.ok(politics.maxTechLevel >= 0 && politics.maxTechLevel <= 7);
      assert.ok(politics.minTechLevel <= politics.maxTechLevel);
      assert.ok(politics.bribeLevel >= 0 && politics.bribeLevel <= 7);
      assert.ok(typeof politics.drugsOK === 'boolean');
      assert.ok(typeof politics.firearmsOK === 'boolean');
      assert.ok(politics.wanted >= -1 && politics.wanted < SYSTEM_CONSTANTS.MAXTRADEITEM);
    });
  });
});
