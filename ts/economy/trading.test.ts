// Trading Functions Tests  
// Test-Driven Development: Write tests FIRST before implementation

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import type { GameState, SolarSystem } from '../types.ts';
import { TradeItem, Difficulty } from '../types.ts';
import { createInitialState } from '../state.ts';
import { 
  buyCargo, sellCargo, getTotalCargoBays, getFilledCargoBays, 
  getAvailableFunds
} from './trading.ts';
import type { BuyResult, SellResult } from './trading.ts';

describe('Trading Functions', () => {

  describe('Cargo Bay Management', () => {
    test('should calculate total cargo bays correctly', () => {
      const state = createInitialState();
      
      // Gnat ship has 15 cargo bays by default
      const totalBays = getTotalCargoBays(state);
      assert.equal(totalBays, 15);
    });

    test('should account for extra cargo bay gadgets', () => {
      const state = createInitialState();
      
      // Add extra cargo bay gadget (+5 bays)
      state.ship.gadget[0] = 2; // EXTRABAYS gadget
      
      const totalBays = getTotalCargoBays(state);
      assert.equal(totalBays, 20); // 15 + 5
    });

    test('should calculate filled cargo bays correctly', () => {
      const state = createInitialState();
      
      // Add some cargo
      state.ship.cargo[TradeItem.Water] = 5;
      state.ship.cargo[TradeItem.Food] = 3;
      
      const filledBays = getFilledCargoBays(state);
      assert.equal(filledBays, 8);
    });

    test('should calculate available cargo space', () => {
      const state = createInitialState();
      
      // Add some cargo
      state.ship.cargo[TradeItem.Water] = 6;
      
      const totalBays = getTotalCargoBays(state);
      const filledBays = getFilledCargoBays(state);
      const available = totalBays - filledBays;
      
      assert.equal(available, 9); // 15 - 6
    });
  });

  describe('Available Funds Calculation', () => {
    test('should return all credits when reserve money is disabled', () => {
      const state = createInitialState();
      state.credits = 5000;
      state.reserveMoney = false;
      
      const funds = getAvailableFunds(state);
      assert.equal(funds, 5000);
    });

    test('should reserve money for expenses when enabled', () => {
      const state = createInitialState();
      state.credits = 5000;
      state.reserveMoney = true;
      
      // Should reserve money for mercenaries, insurance, etc.
      const funds = getAvailableFunds(state);
      assert.ok(funds <= 5000, 'Should reserve some money');
    });

    test('should not return negative funds', () => {
      const state = createInitialState();
      state.credits = 10; // Very low credits
      state.reserveMoney = true;
      
      const funds = getAvailableFunds(state);
      assert.ok(funds >= 0, 'Funds should never be negative');
    });
  });

  describe('Buy Cargo Operations', () => {
    test('should successfully buy cargo when conditions are met', () => {
      const state = createInitialState();
      state.credits = 5000;
      
      // Setup system with available water
      const currentSystem: SolarSystem = {
        ...state.solarSystem[0],
        qty: [10, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 10 water available
      };
      
      const result = buyCargo(state, currentSystem, TradeItem.Water, 5, [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      
      assert.equal(result.success, true);
      assert.equal(result.quantityBought, 5);
      assert.equal(state.ship.cargo[TradeItem.Water], 5);
      assert.equal(state.credits, 4500); // 5000 - 5*100
    });

    test('should succeed but limit purchase when insufficient credits', () => {
      const state = createInitialState();
      state.credits = 100; // Only enough for 1 unit at 100 credits each
      
      const currentSystem: SolarSystem = {
        ...state.solarSystem[0],
        qty: [10, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      };
      
      const result = buyCargo(state, currentSystem, TradeItem.Water, 5, [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      
      assert.equal(result.success, true);
      assert.equal(result.quantityBought, 1); // Limited by credits
      assert.equal(state.credits, 0); // All credits spent
    });

    test('should fail when insufficient cargo space', () => {
      const state = createInitialState();
      state.credits = 5000;
      
      // Fill up cargo space completely
      state.ship.cargo[TradeItem.Food] = 15; // Fill all 15 spaces
      
      const currentSystem: SolarSystem = {
        ...state.solarSystem[0],
        qty: [10, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      };
      
      const result = buyCargo(state, currentSystem, TradeItem.Water, 5, [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      
      assert.equal(result.success, false);
      assert.equal(result.reason, 'Insufficient cargo space');
    });

    test('should fail when item not available in system', () => {
      const state = createInitialState();
      state.credits = 5000;
      
      const currentSystem: SolarSystem = {
        ...state.solarSystem[0],
        qty: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // No items available
      };
      
      const result = buyCargo(state, currentSystem, TradeItem.Water, 5, [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      
      assert.equal(result.success, false);
      assert.equal(result.reason, 'Item not available');
    });

    test('should limit purchase to available quantity', () => {
      const state = createInitialState();
      state.credits = 5000;
      
      const currentSystem: SolarSystem = {
        ...state.solarSystem[0],
        qty: [3, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Only 3 available
      };
      
      const result = buyCargo(state, currentSystem, TradeItem.Water, 5, [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      
      assert.equal(result.success, true);
      assert.equal(result.quantityBought, 3); // Limited by availability
    });

    test('should fail when item price is zero', () => {
      const state = createInitialState();
      state.credits = 5000;
      
      const currentSystem: SolarSystem = {
        ...state.solarSystem[0],
        qty: [10, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      };
      
      const result = buyCargo(state, currentSystem, TradeItem.Water, 5, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      
      assert.equal(result.success, false);
      assert.equal(result.reason, 'Item not available');
    });

    test('should fail when debt is too large', () => {
      const state = createInitialState();
      state.credits = 5000;
      state.debt = 200001; // Greater than DEBTTOOLARGE (200000)
      
      const currentSystem: SolarSystem = {
        ...state.solarSystem[0],
        qty: [10, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      };
      
      const result = buyCargo(state, currentSystem, TradeItem.Water, 5, [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      
      assert.equal(result.success, false);
      assert.equal(result.reason, 'Debt too large');
    });

    test('should update buying price tracking', () => {
      const state = createInitialState();
      state.credits = 5000;
      state.buyingPrice[TradeItem.Water] = 100; // Already bought 1 unit at 100
      state.ship.cargo[TradeItem.Water] = 1;
      
      const currentSystem: SolarSystem = {
        ...state.solarSystem[0],
        qty: [10, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      };
      
      const result = buyCargo(state, currentSystem, TradeItem.Water, 2, [120, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      
      assert.equal(result.success, true);
      assert.equal(result.quantityBought, 2);
      
      // Total buying price should be: 100 + (2 * 120) = 340
      assert.equal(state.buyingPrice[TradeItem.Water], 340);
    });
  });

  describe('Sell Cargo Operations', () => {
    test('should successfully sell cargo when conditions are met', () => {
      const state = createInitialState();
      state.credits = 1000;
      state.ship.cargo[TradeItem.Water] = 5;
      state.buyingPrice[TradeItem.Water] = 400; // Bought for 400 total
      
      const result = sellCargo(state, TradeItem.Water, 3, [80, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      
      assert.equal(result.success, true);
      assert.equal(result.quantitySold, 3);
      assert.equal(state.ship.cargo[TradeItem.Water], 2);
      assert.equal(state.credits, 1240); // 1000 + 3*80
      
      // Buying price should be adjusted: 400 * (2/5) = 160
      assert.equal(state.buyingPrice[TradeItem.Water], 160);
    });

    test('should fail when no cargo to sell', () => {
      const state = createInitialState();
      state.ship.cargo[TradeItem.Water] = 0;
      
      const result = sellCargo(state, TradeItem.Water, 5, [80, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      
      assert.equal(result.success, false);
      assert.equal(result.reason, 'No cargo to sell');
    });

    test('should fail when sell price is zero', () => {
      const state = createInitialState();
      state.ship.cargo[TradeItem.Water] = 5;
      
      const result = sellCargo(state, TradeItem.Water, 3, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      
      assert.equal(result.success, false);
      assert.equal(result.reason, 'No market for item');
    });

    test('should limit sale to available cargo', () => {
      const state = createInitialState();
      state.credits = 1000;
      state.ship.cargo[TradeItem.Water] = 3; // Only 3 available
      state.buyingPrice[TradeItem.Water] = 300;
      
      const result = sellCargo(state, TradeItem.Water, 5, [80, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      
      assert.equal(result.success, true);
      assert.equal(result.quantitySold, 3); // Limited by available cargo
      assert.equal(state.ship.cargo[TradeItem.Water], 0);
    });

    test('should handle selling all cargo', () => {
      const state = createInitialState();
      state.credits = 1000;
      state.ship.cargo[TradeItem.Water] = 5;
      state.buyingPrice[TradeItem.Water] = 500;
      
      const result = sellCargo(state, TradeItem.Water, 999, [80, 0, 0, 0, 0, 0, 0, 0, 0, 0]); // Sell all
      
      assert.equal(result.success, true);
      assert.equal(result.quantitySold, 5);
      assert.equal(state.ship.cargo[TradeItem.Water], 0);
      assert.equal(state.buyingPrice[TradeItem.Water], 0); // Reset when all sold
    });
  });

  describe('Integration Tests', () => {
    test('should handle buy and sell cycle correctly', () => {
      const state = createInitialState();
      state.credits = 5000;
      
      const currentSystem: SolarSystem = {
        ...state.solarSystem[0],
        qty: [10, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      };
      
      // Buy 5 water at 100 each
      const buyResult = buyCargo(state, currentSystem, TradeItem.Water, 5, [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      assert.equal(buyResult.success, true);
      assert.equal(state.credits, 4500);
      assert.equal(state.ship.cargo[TradeItem.Water], 5);
      
      // Sell 3 water at 120 each
      const sellResult = sellCargo(state, TradeItem.Water, 3, [120, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      assert.equal(sellResult.success, true);
      assert.equal(state.credits, 4860); // 4500 + 3*120
      assert.equal(state.ship.cargo[TradeItem.Water], 2);
    });

    test('should respect cargo space limits in realistic scenario', () => {
      const state = createInitialState();
      state.credits = 10000;
      
      // Fill ship almost to capacity
      for (let i = 0; i < 10; i++) {
        state.ship.cargo[i] = 1;
      }
      // Ship now has 10/15 bays filled
      
      const currentSystem: SolarSystem = {
        ...state.solarSystem[0],
        qty: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50], // Plenty available
      };
      
      // Try to buy more (should succeed with 5 spaces available)
      const result = buyCargo(state, currentSystem, TradeItem.Water, 5, [100, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      
      assert.equal(result.success, true); // Should succeed - has space
      assert.equal(result.quantityBought, 5);
      assert.equal(getFilledCargoBays(state), 15); // Ship now full
    });
  });
});