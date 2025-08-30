// Equipment System Tests (Weapons, Shields, Gadgets)
// Test-Driven Development: Write tests FIRST before implementation

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import type { WeaponType, ShieldType, GadgetType } from '../types.ts';
import { 
  getWeapons, getShields, getGadgets,
  getWeapon, getShield, getGadget,
  getBuyableWeapons, getBuyableShields, getBuyableGadgets,
  isWeaponBuyable, isShieldBuyable, isGadgetBuyable
} from './equipment.ts';

describe('Equipment System', () => {
  
  describe('Weapons', () => {
    test('should have exactly 4 weapon types (MAXWEAPONTYPE + EXTRAWEAPONS)', () => {
      const weapons = getWeapons();
      assert.equal(weapons.length, 4); // 3 + 1 extra
    });

    test('should match exact Palm OS weapon data', () => {
      const weapons = getWeapons();

      // Pulse laser - index 0
      const pulseLaser = weapons[0];
      assert.equal(pulseLaser.name, 'Pulse laser');
      assert.equal(pulseLaser.power, 15); // PULSELASERPOWER
      assert.equal(pulseLaser.price, 2000);
      assert.equal(pulseLaser.techLevel, 5);
      assert.equal(pulseLaser.chance, 50);

      // Beam laser - index 1  
      const beamLaser = weapons[1];
      assert.equal(beamLaser.name, 'Beam laser');
      assert.equal(beamLaser.power, 25); // BEAMLASERPOWER
      assert.equal(beamLaser.price, 12500);
      assert.equal(beamLaser.techLevel, 6);
      assert.equal(beamLaser.chance, 35);

      // Military laser - index 2
      const militaryLaser = weapons[2];
      assert.equal(militaryLaser.name, 'Military laser');
      assert.equal(militaryLaser.power, 35); // MILITARYLASERPOWER
      assert.equal(militaryLaser.price, 35000);
      assert.equal(militaryLaser.techLevel, 7);
      assert.equal(militaryLaser.chance, 15);

      // Morgan's laser - index 3 (special, not buyable)
      const morganLaser = weapons[3];
      assert.equal(morganLaser.name, "Morgan's laser");
      assert.equal(morganLaser.power, 85); // MORGANLASERPOWER
      assert.equal(morganLaser.price, 50000);
      assert.equal(morganLaser.techLevel, 8);
      assert.equal(morganLaser.chance, 0); // not buyable
    });

    test('should provide individual weapon access', () => {
      const pulseLaser = getWeapon(0);
      assert.equal(pulseLaser.name, 'Pulse laser');
    });

    test('should distinguish buyable vs special weapons', () => {
      const buyableWeapons = getBuyableWeapons();
      assert.equal(buyableWeapons.length, 3);
      
      assert.equal(isWeaponBuyable(0), true);  // Pulse laser
      assert.equal(isWeaponBuyable(1), true);  // Beam laser
      assert.equal(isWeaponBuyable(2), true);  // Military laser
      assert.equal(isWeaponBuyable(3), false); // Morgan's laser
    });
  });

  describe('Shields', () => {
    test('should have exactly 3 shield types (MAXSHIELDTYPE + EXTRASHIELDS)', () => {
      const shields = getShields();
      assert.equal(shields.length, 3); // 2 + 1 extra
    });

    test('should match exact Palm OS shield data', () => {
      const shields = getShields();

      // Energy shield - index 0
      const energyShield = shields[0];
      assert.equal(energyShield.name, 'Energy shield');
      assert.equal(energyShield.power, 100); // ESHIELDPOWER
      assert.equal(energyShield.price, 5000);
      assert.equal(energyShield.techLevel, 5);
      assert.equal(energyShield.chance, 70);

      // Reflective shield - index 1
      const reflectiveShield = shields[1];
      assert.equal(reflectiveShield.name, 'Reflective shield');
      assert.equal(reflectiveShield.power, 200); // RSHIELDPOWER
      assert.equal(reflectiveShield.price, 20000);
      assert.equal(reflectiveShield.techLevel, 6);
      assert.equal(reflectiveShield.chance, 30);

      // Lightning shield - index 2 (special, not buyable)
      const lightningShield = shields[2];
      assert.equal(lightningShield.name, 'Lightning shield');
      assert.equal(lightningShield.power, 350); // LSHIELDPOWER
      assert.equal(lightningShield.price, 45000);
      assert.equal(lightningShield.techLevel, 8);
      assert.equal(lightningShield.chance, 0); // not buyable
    });

    test('should provide individual shield access', () => {
      const energyShield = getShield(0);
      assert.equal(energyShield.name, 'Energy shield');
    });

    test('should distinguish buyable vs special shields', () => {
      const buyableShields = getBuyableShields();
      assert.equal(buyableShields.length, 2);
      
      assert.equal(isShieldBuyable(0), true);  // Energy shield
      assert.equal(isShieldBuyable(1), true);  // Reflective shield
      assert.equal(isShieldBuyable(2), false); // Lightning shield
    });
  });

  describe('Gadgets', () => {
    test('should have exactly 6 gadget types (MAXGADGETTYPE + EXTRAGADGETS)', () => {
      const gadgets = getGadgets();
      assert.equal(gadgets.length, 6); // 5 + 1 extra
    });

    test('should match exact Palm OS gadget data', () => {
      const gadgets = getGadgets();

      // 5 extra cargo bays - index 0
      const extraCargo = gadgets[0];
      assert.equal(extraCargo.name, '5 extra cargo bays');
      assert.equal(extraCargo.price, 2500);
      assert.equal(extraCargo.techLevel, 4);
      assert.equal(extraCargo.chance, 35);

      // Auto-repair system - index 1
      const autoRepair = gadgets[1];
      assert.equal(autoRepair.name, 'Auto-repair system');
      assert.equal(autoRepair.price, 7500);
      assert.equal(autoRepair.techLevel, 5);
      assert.equal(autoRepair.chance, 20);

      // Navigating system - index 2
      const navigation = gadgets[2];
      assert.equal(navigation.name, 'Navigating system');
      assert.equal(navigation.price, 15000);
      assert.equal(navigation.techLevel, 6);
      assert.equal(navigation.chance, 20);

      // Targeting system - index 3
      const targeting = gadgets[3];
      assert.equal(targeting.name, 'Targeting system');
      assert.equal(targeting.price, 25000);
      assert.equal(targeting.techLevel, 6);
      assert.equal(targeting.chance, 20);

      // Cloaking device - index 4
      const cloaking = gadgets[4];
      assert.equal(cloaking.name, 'Cloaking device');
      assert.equal(cloaking.price, 100000);
      assert.equal(cloaking.techLevel, 7);
      assert.equal(cloaking.chance, 5);

      // Fuel compactor - index 5 (special, not buyable)
      const fuelCompactor = gadgets[5];
      assert.equal(fuelCompactor.name, 'Fuel compactor');
      assert.equal(fuelCompactor.price, 30000);
      assert.equal(fuelCompactor.techLevel, 8);
      assert.equal(fuelCompactor.chance, 0); // not buyable
    });

    test('should provide individual gadget access', () => {
      const extraCargo = getGadget(0);
      assert.equal(extraCargo.name, '5 extra cargo bays');
    });

    test('should distinguish buyable vs special gadgets', () => {
      const buyableGadgets = getBuyableGadgets();
      assert.equal(buyableGadgets.length, 5);
      
      assert.equal(isGadgetBuyable(0), true);  // Extra cargo
      assert.equal(isGadgetBuyable(1), true);  // Auto-repair
      assert.equal(isGadgetBuyable(2), true);  // Navigation
      assert.equal(isGadgetBuyable(3), true);  // Targeting
      assert.equal(isGadgetBuyable(4), true);  // Cloaking
      assert.equal(isGadgetBuyable(5), false); // Fuel compactor
    });
  });

  describe('Error Handling', () => {
    test('should throw error for invalid equipment indices', () => {
      assert.throws(() => getWeapon(-1));
      assert.throws(() => getWeapon(4));
      
      assert.throws(() => getShield(-1));
      assert.throws(() => getShield(3));
      
      assert.throws(() => getGadget(-1));
      assert.throws(() => getGadget(6));
    });
  });

  describe('Data Validation', () => {
    test('should have valid tech levels for all equipment', () => {
      const weapons = getWeapons();
      const shields = getShields();
      const gadgets = getGadgets();
      
      [...weapons, ...shields, ...gadgets].forEach((item, index) => {
        assert.ok(item.techLevel >= 0 && item.techLevel <= 8, 
          `Equipment item ${index} techLevel should be 0-8`);
      });
    });

    test('should have positive prices for all equipment', () => {
      const weapons = getWeapons();
      const shields = getShields();
      const gadgets = getGadgets();
      
      [...weapons, ...shields, ...gadgets].forEach((item, index) => {
        assert.ok(item.price > 0, 
          `Equipment item ${index} price should be positive`);
      });
    });

    test('should have valid chance values (0-100) for all equipment', () => {
      const weapons = getWeapons();
      const shields = getShields();
      const gadgets = getGadgets();
      
      [...weapons, ...shields, ...gadgets].forEach((item, index) => {
        assert.ok(item.chance >= 0 && item.chance <= 100, 
          `Equipment item ${index} chance should be 0-100`);
      });
    });

    test('should have positive power for weapons and shields', () => {
      const weapons = getWeapons();
      const shields = getShields();
      
      weapons.forEach((weapon, index) => {
        assert.ok(weapon.power > 0, 
          `Weapon ${index} power should be positive`);
      });

      shields.forEach((shield, index) => {
        assert.ok(shield.power > 0, 
          `Shield ${index} power should be positive`);
      });
    });

    test('should have non-empty names for all equipment', () => {
      const weapons = getWeapons();
      const shields = getShields();
      const gadgets = getGadgets();
      
      [...weapons, ...shields, ...gadgets].forEach((item, index) => {
        assert.ok(item.name.length > 0, 
          `Equipment item ${index} should have non-empty name`);
        assert.equal(typeof item.name, 'string', 
          `Equipment item ${index} name should be string`);
      });
    });
  });
});