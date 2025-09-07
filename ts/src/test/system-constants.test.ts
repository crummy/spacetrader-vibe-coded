import { describe, test } from 'node:test';
import { strict as assert } from 'node:assert';

// System Constants from spacetrader.h
export const SYSTEM_CONSTANTS = {
  // Difficulty levels
  MAXDIFFICULTY: 5,
  BEGINNER: 0,
  EASY: 1,
  NORMAL: 2,
  HARD: 3,
  IMPOSSIBLE: 4,

  // Trade items
  MAXTRADEITEM: 10,
  MAXDIGITS: 8,
  MAXPRICEDIGITS: 5,
  MAXQTYDIGITS: 3,

  // Ship configuration
  MAXSHIPTYPE: 10,
  EXTRASHIPS: 5,
  MAXWEAPON: 3,
  MAXSHIELD: 3,
  MAXGADGET: 3,
  MAXCREW: 3,
  MAXTRIBBLES: 100000,

  // Galaxy
  MAXSOLARSYSTEM: 120,
  GALAXYWIDTH: 150,
  GALAXYHEIGHT: 110,
  MINDISTANCE: 6,
  CLOSEDISTANCE: 13,
  MAXWORMHOLE: 6,

  // Police record scores
  PSYCHOPATHSCORE: -70,
  VILLAINSCORE: -30,
  CRIMINALSCORE: -10,
  DUBIOUSSCORE: -5,
  CLEANSCORE: 0,
  LAWFULSCORE: 5,
  TRUSTEDSCORE: 10,
  HELPERSCORE: 25,
  HEROSCORE: 75,

  // Debt limits
  DEBTWARNING: 75000,
  DEBTTOOLARGE: 100000,

  // System status
  UNEVENTFUL: 0,
  WAR: 1,
  PLAGUE: 2,
  DROUGHT: 3,
  BOREDOM: 4,
  COLD: 5,
  CROPFAILURE: 6,
  LACKOFWORKERS: 7,

  // Trade items
  WATER: 0,
  FURS: 1,
  FOOD: 2,
  ORE: 3,
  GAMES: 4,
  FIREARMS: 5,
  MEDICINE: 6,
  MACHINERY: 7,
  NARCOTICS: 8,
  ROBOTS: 9,

  // Encounter types
  POLICE: 0,
  POLICEINSPECTION: 0,
  POLICEIGNORE: 1,
  POLICEATTACK: 2,
  POLICEFLEE: 3,
  MAXPOLICE: 9,

  PIRATE: 10,
  PIRATEATTACK: 10,
  PIRATEFLEE: 11,
  PIRATEIGNORE: 12,
  PIRATESURRENDER: 13,
  MAXPIRATE: 19,

  TRADER: 20,
  TRADERIGNORE: 20,
  TRADERFLEE: 21,
  TRADERATTACK: 22,
  TRADERSURRENDER: 23,
  TRADERSELL: 24,
  TRADERBUY: 25,
  MAXTRADER: 29
} as const;

// Validation functions
export function isDifficultyLevel(level: number): boolean {
  return Number.isInteger(level) && level >= 0 && level < SYSTEM_CONSTANTS.MAXDIFFICULTY;
}

export function isValidCredits(credits: number): boolean {
  return Number.isInteger(credits) && credits >= 0 && credits <= 99999999;
}

export function isValidPrice(price: number): boolean {
  return Number.isInteger(price) && price >= 0 && price <= 99999;
}

export function isValidQuantity(qty: number): boolean {
  return Number.isInteger(qty) && qty >= 0 && qty <= 999;
}

export function isValidTechLevel(level: number): boolean {
  return Number.isInteger(level) && level >= 0 && level <= 7;
}

export function isValidSystemCoords(x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) &&
         x >= 0 && x < SYSTEM_CONSTANTS.GALAXYWIDTH &&
         y >= 0 && y < SYSTEM_CONSTANTS.GALAXYHEIGHT;
}

export function isPoliceEncounter(encounterType: number): boolean {
  return encounterType >= SYSTEM_CONSTANTS.POLICE && encounterType <= SYSTEM_CONSTANTS.MAXPOLICE;
}

export function isPirateEncounter(encounterType: number): boolean {
  return encounterType >= SYSTEM_CONSTANTS.PIRATE && encounterType <= SYSTEM_CONSTANTS.MAXPIRATE;
}

export function isTraderEncounter(encounterType: number): boolean {
  return encounterType >= SYSTEM_CONSTANTS.TRADER && encounterType <= SYSTEM_CONSTANTS.MAXTRADER;
}

export function isValidTradeItem(itemType: number): boolean {
  return Number.isInteger(itemType) && itemType >= 0 && itemType < SYSTEM_CONSTANTS.MAXTRADEITEM;
}

export function isValidPoliceRecordScore(score: number): boolean {
  return Number.isInteger(score) && score >= -100 && score <= 100;
}

export function calculatePoliceStrength(baseStrength: number, policeRecordScore: number): number {
  if (policeRecordScore < SYSTEM_CONSTANTS.PSYCHOPATHSCORE) {
    return 3 * baseStrength;
  } else if (policeRecordScore < SYSTEM_CONSTANTS.VILLAINSCORE) {
    return 2 * baseStrength;
  } else {
    return baseStrength;
  }
}

describe('System Constants Validation', () => {
  test('difficulty level validation', () => {
    assert.strictEqual(isDifficultyLevel(SYSTEM_CONSTANTS.BEGINNER), true);
    assert.strictEqual(isDifficultyLevel(SYSTEM_CONSTANTS.EASY), true);
    assert.strictEqual(isDifficultyLevel(SYSTEM_CONSTANTS.NORMAL), true);
    assert.strictEqual(isDifficultyLevel(SYSTEM_CONSTANTS.HARD), true);
    assert.strictEqual(isDifficultyLevel(SYSTEM_CONSTANTS.IMPOSSIBLE), true);
    
    assert.strictEqual(isDifficultyLevel(-1), false);
    assert.strictEqual(isDifficultyLevel(5), false);
    assert.strictEqual(isDifficultyLevel(1.5), false);
    assert.strictEqual(isDifficultyLevel(NaN), false);
  });

  test('credits validation', () => {
    assert.strictEqual(isValidCredits(0), true);
    assert.strictEqual(isValidCredits(1000), true);
    assert.strictEqual(isValidCredits(99999999), true);
    
    assert.strictEqual(isValidCredits(-1), false);
    assert.strictEqual(isValidCredits(100000000), false);
    assert.strictEqual(isValidCredits(1.5), false);
  });

  test('price validation', () => {
    assert.strictEqual(isValidPrice(0), true);
    assert.strictEqual(isValidPrice(2000), true);
    assert.strictEqual(isValidPrice(99999), true);
    
    assert.strictEqual(isValidPrice(-1), false);
    assert.strictEqual(isValidPrice(100000), false);
    assert.strictEqual(isValidPrice(1.5), false);
  });

  test('quantity validation', () => {
    assert.strictEqual(isValidQuantity(0), true);
    assert.strictEqual(isValidQuantity(500), true);
    assert.strictEqual(isValidQuantity(999), true);
    
    assert.strictEqual(isValidQuantity(-1), false);
    assert.strictEqual(isValidQuantity(1000), false);
    assert.strictEqual(isValidQuantity(1.5), false);
  });

  test('tech level validation', () => {
    assert.strictEqual(isValidTechLevel(0), true);
    assert.strictEqual(isValidTechLevel(4), true);
    assert.strictEqual(isValidTechLevel(7), true);
    
    assert.strictEqual(isValidTechLevel(-1), false);
    assert.strictEqual(isValidTechLevel(8), false);
  });

  test('system coordinates validation', () => {
    assert.strictEqual(isValidSystemCoords(0, 0), true);
    assert.strictEqual(isValidSystemCoords(75, 55), true);
    assert.strictEqual(isValidSystemCoords(149, 109), true);
    
    assert.strictEqual(isValidSystemCoords(-1, 50), false);
    assert.strictEqual(isValidSystemCoords(150, 50), false);
    assert.strictEqual(isValidSystemCoords(50, -1), false);
    assert.strictEqual(isValidSystemCoords(50, 110), false);
    assert.strictEqual(isValidSystemCoords(1.5, 50), false);
  });

  test('encounter type validation', () => {
    assert.strictEqual(isPoliceEncounter(SYSTEM_CONSTANTS.POLICEINSPECTION), true);
    assert.strictEqual(isPoliceEncounter(SYSTEM_CONSTANTS.POLICEATTACK), true);
    assert.strictEqual(isPoliceEncounter(9), true);
    assert.strictEqual(isPoliceEncounter(10), false);
    
    assert.strictEqual(isPirateEncounter(SYSTEM_CONSTANTS.PIRATEATTACK), true);
    assert.strictEqual(isPirateEncounter(SYSTEM_CONSTANTS.PIRATESURRENDER), true);
    assert.strictEqual(isPirateEncounter(19), true);
    assert.strictEqual(isPirateEncounter(9), false);
    assert.strictEqual(isPirateEncounter(20), false);
    
    assert.strictEqual(isTraderEncounter(SYSTEM_CONSTANTS.TRADERIGNORE), true);
    assert.strictEqual(isTraderEncounter(SYSTEM_CONSTANTS.TRADERBUY), true);
    assert.strictEqual(isTraderEncounter(29), true);
    assert.strictEqual(isTraderEncounter(19), false);
    assert.strictEqual(isTraderEncounter(30), false);
  });

  test('trade item validation', () => {
    assert.strictEqual(isValidTradeItem(SYSTEM_CONSTANTS.WATER), true);
    assert.strictEqual(isValidTradeItem(SYSTEM_CONSTANTS.ROBOTS), true);
    assert.strictEqual(isValidTradeItem(9), true);
    
    assert.strictEqual(isValidTradeItem(-1), false);
    assert.strictEqual(isValidTradeItem(10), false);
  });

  test('police record score validation', () => {
    assert.strictEqual(isValidPoliceRecordScore(SYSTEM_CONSTANTS.PSYCHOPATHSCORE), true);
    assert.strictEqual(isValidPoliceRecordScore(SYSTEM_CONSTANTS.CLEANSCORE), true);
    assert.strictEqual(isValidPoliceRecordScore(SYSTEM_CONSTANTS.HEROSCORE), true);
    
    assert.strictEqual(isValidPoliceRecordScore(-101), false);
    assert.strictEqual(isValidPoliceRecordScore(101), false);
  });

  test('police strength calculation', () => {
    const baseStrength = 5;
    
    assert.strictEqual(calculatePoliceStrength(baseStrength, -80), 15); // Psychopath: 3x
    assert.strictEqual(calculatePoliceStrength(baseStrength, -50), 10); // Villain: 2x
    assert.strictEqual(calculatePoliceStrength(baseStrength, 0), 5);    // Clean: 1x
    assert.strictEqual(calculatePoliceStrength(baseStrength, 50), 5);   // Hero: 1x
  });

  test('debt thresholds', () => {
    assert.strictEqual(SYSTEM_CONSTANTS.DEBTWARNING, 75000);
    assert.strictEqual(SYSTEM_CONSTANTS.DEBTTOOLARGE, 100000);
    assert.ok(SYSTEM_CONSTANTS.DEBTWARNING < SYSTEM_CONSTANTS.DEBTTOOLARGE);
  });

  test('maximum values consistency', () => {
    // Ensure maximums are consistent
    assert.strictEqual(SYSTEM_CONSTANTS.MAXTRADEITEM, 10);
    assert.strictEqual(SYSTEM_CONSTANTS.MAXSHIPTYPE, 10);
    assert.strictEqual(SYSTEM_CONSTANTS.MAXWEAPON, 3);
    assert.strictEqual(SYSTEM_CONSTANTS.MAXSHIELD, 3);
    assert.strictEqual(SYSTEM_CONSTANTS.MAXGADGET, 3);
    assert.strictEqual(SYSTEM_CONSTANTS.MAXCREW, 3);
    
    // Tribble maximum
    assert.strictEqual(SYSTEM_CONSTANTS.MAXTRIBBLES, 100000);
    
    // Solar system maximum
    assert.strictEqual(SYSTEM_CONSTANTS.MAXSOLARSYSTEM, 120);
  });

  test('system status constants', () => {
    assert.strictEqual(SYSTEM_CONSTANTS.UNEVENTFUL, 0);
    assert.strictEqual(SYSTEM_CONSTANTS.WAR, 1);
    assert.strictEqual(SYSTEM_CONSTANTS.PLAGUE, 2);
    assert.strictEqual(SYSTEM_CONSTANTS.DROUGHT, 3);
    assert.strictEqual(SYSTEM_CONSTANTS.BOREDOM, 4);
    assert.strictEqual(SYSTEM_CONSTANTS.COLD, 5);
    assert.strictEqual(SYSTEM_CONSTANTS.CROPFAILURE, 6);
    assert.strictEqual(SYSTEM_CONSTANTS.LACKOFWORKERS, 7);
  });

  test('trade item indices', () => {
    assert.strictEqual(SYSTEM_CONSTANTS.WATER, 0);
    assert.strictEqual(SYSTEM_CONSTANTS.FURS, 1);
    assert.strictEqual(SYSTEM_CONSTANTS.FOOD, 2);
    assert.strictEqual(SYSTEM_CONSTANTS.ORE, 3);
    assert.strictEqual(SYSTEM_CONSTANTS.GAMES, 4);
    assert.strictEqual(SYSTEM_CONSTANTS.FIREARMS, 5);
    assert.strictEqual(SYSTEM_CONSTANTS.MEDICINE, 6);
    assert.strictEqual(SYSTEM_CONSTANTS.MACHINERY, 7);
    assert.strictEqual(SYSTEM_CONSTANTS.NARCOTICS, 8);
    assert.strictEqual(SYSTEM_CONSTANTS.ROBOTS, 9);
  });
});
