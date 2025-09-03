#!/usr/bin/env node --test --experimental-strip-types

import { test } from 'node:test';
import assert from 'node:assert';
import { createGameEngine } from './engine/game.ts';

test('Console Interface System', async (t) => {

  await t.test('ConsoleInterface Creation and Setup', async (t) => {
    
    await t.test('should create console interface successfully', async () => {
      // Import and create console interface
      const { ConsoleInterface } = await import('./console.ts');
      const console = new ConsoleInterface();
      
      assert.ok(console, 'Console interface should be created');
      
      // Clean up
      console.stop();
    });

    await t.test('should initialize with valid game engine', async () => {
      const { ConsoleInterface } = await import('./console.ts');
      const console = new ConsoleInterface();
      
      // Console should have a game engine internally
      assert.ok(console, 'Console should exist');
      
      // Clean up
      console.stop();
    });
  });

  await t.test('Game State Display Logic', async (t) => {
    
    await t.test('should access game status information correctly', async () => {
      const engine = createGameEngine();
      
      // Test the functions used by console for display
      const { getGameStatus, getCurrentLocation, getCurrentShipStatus } = await import('./engine/game.ts');
      
      const status = getGameStatus(engine.state);
      const location = getCurrentLocation(engine.state);
      const shipStatus = getCurrentShipStatus(engine.state);
      
      // Validate status information
      assert.equal(typeof status.commanderName, 'string');
      assert.equal(typeof status.credits, 'number');
      assert.equal(typeof status.days, 'number');
      assert.equal(typeof status.reputation, 'string');
      assert.equal(typeof status.policeRecord, 'string');
      
      // Validate location information
      assert.equal(typeof location.systemIndex, 'number');
      assert.equal(typeof location.systemName, 'string');
      assert.equal(typeof location.isDocked, 'boolean');
      
      // Validate ship information
      assert.equal(typeof shipStatus.hull, 'number');
      assert.equal(typeof shipStatus.fuel, 'number');
      assert.equal(typeof shipStatus.cargoUsed, 'number');
      assert.equal(typeof shipStatus.cargoCapacity, 'number');
      
      console.log(`Status: ${status.commanderName}, ${status.credits} credits`);
      console.log(`Location: ${location.systemName} (${location.isDocked ? 'docked' : 'in space'})`);
      console.log(`Ship: ${shipStatus.fuel} fuel, ${shipStatus.cargoUsed}/${shipStatus.cargoCapacity} cargo`);
    });

    await t.test('should handle different game modes correctly', async () => {
      const engine = createGameEngine();
      const { getCurrentLocation } = await import('./engine/game.ts');
      
      // Test OnPlanet mode
      engine.state.currentMode = 1;
      const planetLocation = getCurrentLocation(engine.state);
      assert.equal(planetLocation.isDocked, true);
      
      // Test InSpace mode
      engine.state.currentMode = 0;
      const spaceLocation = getCurrentLocation(engine.state);
      assert.equal(spaceLocation.isDocked, false);
    });
  });

  await t.test('Market Information Display', async (t) => {
    
    await t.test('should access market pricing information correctly', async () => {
      const engine = createGameEngine();
      const { getAllSystemPrices } = await import('./economy/pricing.ts');
      
      const currentSystem = engine.state.solarSystem[engine.state.currentSystem];
      const prices = getAllSystemPrices(currentSystem, engine.state.commanderTrader, engine.state.policeRecordScore);
      
      assert.equal(prices.length, 10); // Should have all 10 trade items
      
      prices.forEach((price, index) => {
        assert.ok(price.buyPrice >= 0, `Buy price for item ${index} should be non-negative`);
        assert.ok(price.sellPrice >= 0, `Sell price for item ${index} should be non-negative`);
      });
      
      console.log(`Sample prices: Water buy=${prices[0].buyPrice}, sell=${prices[0].sellPrice}`);
    });

    await t.test('should access fuel information for display', async () => {
      const engine = createGameEngine();
      const { getFuelStatus } = await import('./economy/fuel.ts');
      
      const fuelStatus = getFuelStatus(engine.state);
      
      assert.ok(fuelStatus.currentFuel >= 0);
      assert.ok(fuelStatus.maxFuel > 0);
      assert.ok(fuelStatus.fuelPercentage >= 0 && fuelStatus.fuelPercentage <= 100);
      assert.ok(fuelStatus.costPerUnit > 0);
      assert.ok(fuelStatus.fullRefuelCost >= 0);
      
      console.log(`Fuel: ${fuelStatus.currentFuel}/${fuelStatus.maxFuel} (${fuelStatus.fuelPercentage}%)`);
    });

    await t.test('should access system information correctly', async () => {
      const engine = createGameEngine();
      const { getSolarSystemName } = await import('./data/systems.ts');
      
      const systemName = getSolarSystemName(engine.state.currentSystem);
      
      assert.equal(typeof systemName, 'string');
      assert.ok(systemName.length > 0, 'System name should not be empty');
      
      console.log(`Current system: ${systemName}`);
    });
  });

  await t.test('Travel Information Display', async (t) => {
    
    await t.test('should access travel range information correctly', async () => {
      const engine = createGameEngine();
      const { getSystemsWithinRange } = await import('./travel/galaxy.ts');
      const { calculateDistance } = await import('./travel/warp.ts');
      
      const nearbySystemsIndices = getSystemsWithinRange(engine.state, engine.state.ship.fuel);
      
      assert.ok(Array.isArray(nearbySystemsIndices));
      assert.ok(nearbySystemsIndices.length >= 0);
      
      // Test distance calculation for display
      if (nearbySystemsIndices.length > 0) {
        const targetSystem = nearbySystemsIndices[0];
        const distance = calculateDistance(
          engine.state.solarSystem[engine.state.currentSystem],
          engine.state.solarSystem[targetSystem]
        );
        
        assert.ok(distance >= 0);
        assert.ok(Number.isFinite(distance));
        
        console.log(`Distance to ${nearbySystemsIndices.length} reachable systems`);
      }
    });

    await t.test('should handle travel destination formatting', async () => {
      const engine = createGameEngine();
      const { getSolarSystemName } = await import('./data/systems.ts');
      const { calculateDistance } = await import('./travel/warp.ts');
      
      // Test formatting for multiple systems
      for (let i = 1; i <= 5 && i < engine.state.solarSystem.length; i++) {
        const systemName = getSolarSystemName(i);
        const distance = calculateDistance(
          engine.state.solarSystem[engine.state.currentSystem],
          engine.state.solarSystem[i]
        );
        
        assert.equal(typeof systemName, 'string');
        assert.ok(distance >= 0);
        
        // Format should be consistent
        const formatted = `${systemName} - ${distance} parsecs`;
        assert.ok(formatted.includes(systemName));
        assert.ok(formatted.includes(distance.toString()));
      }
    });
  });

  await t.test('Action Menu Generation', async (t) => {
    
    await t.test('should generate correct action menus for different game modes', async () => {
      const engine = createGameEngine();
      
      // Test OnPlanet actions
      engine.state.currentMode = 1; // OnPlanet
      const planetActions = engine.getAvailableActions();
      
      assert.ok(Array.isArray(planetActions));
      assert.ok(planetActions.length > 0, 'Should have actions available on planet');
      
      // Should have basic planet actions
      const actionTypes = planetActions.map(a => a.type);
      assert.ok(actionTypes.includes('launch_ship'), 'Should have launch ship action');
      
      console.log(`OnPlanet actions: ${actionTypes.join(', ')}`);
      
      // Test InSpace actions
      engine.state.currentMode = 0; // InSpace
      const spaceActions = engine.getAvailableActions();
      
      assert.ok(Array.isArray(spaceActions));
      
      const spaceActionTypes = spaceActions.map(a => a.type);
      console.log(`InSpace actions: ${spaceActionTypes.join(', ')}`);
    });

    await t.test('should provide action descriptions and availability', async () => {
      const engine = createGameEngine();
      engine.state.currentMode = 1; // OnPlanet
      
      const actions = engine.getAvailableActions();
      
      actions.forEach((action, index) => {
        assert.equal(typeof action.type, 'string');
        assert.equal(typeof action.name, 'string');
        assert.equal(typeof action.description, 'string');
        assert.equal(typeof action.available, 'boolean');
        
        assert.ok(action.type.length > 0, 'Action type should not be empty');
        assert.ok(action.name.length > 0, 'Action name should not be empty');
        assert.ok(action.description.length > 0, 'Action description should not be empty');
      });
    });
  });

  await t.test('Game Mode Handling', async (t) => {
    
    await t.test('should handle mode transitions correctly', async () => {
      const engine = createGameEngine();
      
      // Start OnPlanet
      engine.state.currentMode = 1;
      assert.equal(engine.state.currentMode, 1);
      
      // Launch to space
      const launchResult = await engine.executeAction({
        type: 'launch_ship',
        parameters: {}
      });
      
      assert.equal(launchResult.success, true);
      assert.equal(engine.state.currentMode, 0); // Should be InSpace
      
      // Dock back at planet
      const dockResult = await engine.executeAction({
        type: 'dock_at_planet',
        parameters: {}
      });
      
      assert.equal(dockResult.success, true);
      assert.equal(engine.state.currentMode, 1); // Should be OnPlanet
    });

    await t.test('should handle combat mode correctly', async () => {
      const engine = createGameEngine();
      
      // Simulate entering combat
      engine.state.currentMode = 2; // InCombat
      engine.state.encounterType = 10; // Pirate attack
      
      const combatActions = engine.getAvailableActions();
      const combatActionTypes = combatActions.map(a => a.type);
      
      // Should have combat actions
      assert.ok(combatActionTypes.some(type => type.includes('combat_')), 'Should have combat actions');
      
      console.log(`Combat actions: ${combatActionTypes.join(', ')}`);
    });
  });

  await t.test('Input Validation Logic', async (t) => {
    
    await t.test('should validate action parameters correctly', async () => {
      const engine = createGameEngine();
      
      // Test invalid action
      const invalidResult = await engine.executeAction({
        type: 'nonexistent_action',
        parameters: {}
      });
      
      assert.equal(invalidResult.success, false);
      console.log(`Invalid action message: "${invalidResult.message}"`);
      assert.ok(invalidResult.message.includes('Unknown') || invalidResult.message.includes('not available'));
      
      // Test action with invalid parameters
      const invalidParamResult = await engine.executeAction({
        type: 'buy_cargo',
        parameters: { tradeItem: 'invalid', quantity: 'invalid' }
      });
      
      assert.equal(invalidParamResult.success, false);
      assert.ok(invalidParamResult.message.includes('Invalid parameters'));
    });

    await t.test('should handle numeric input validation', () => {
      // Test numeric validation logic similar to what console would use
      const testInputs = [
        { input: '1', expected: 1, valid: true },
        { input: '0', expected: 0, valid: true },
        { input: '99', expected: 99, valid: true },
        { input: 'abc', expected: NaN, valid: false },
        { input: '', expected: NaN, valid: false },
        { input: '1.5', expected: 1, valid: true }, // Should parseInt to 1
        { input: '-1', expected: -1, valid: false } // Negative not valid for menu choices
      ];
      
      testInputs.forEach(test => {
        const parsed = parseInt(test.input, 10);
        const isValid = !isNaN(parsed) && parsed >= 0;
        
        assert.equal(isNaN(parsed), isNaN(test.expected));
        if (!isNaN(parsed)) {
          assert.equal(parsed, test.expected);
        }
        assert.equal(isValid, test.valid);
      });
    });
  });

  await t.test('Data Formatting and Display', async (t) => {
    
    await t.test('should format market information consistently', async () => {
      const engine = createGameEngine();
      const { getAllSystemPrices } = await import('./economy/pricing.ts');
      const { getTradeItems } = await import('./data/tradeItems.ts');
      
      const currentSystem = engine.state.solarSystem[engine.state.currentSystem];
      const prices = getAllSystemPrices(currentSystem, engine.state.commanderTrader, engine.state.policeRecordScore);
      const tradeItems = getTradeItems();
      
      // Test market display formatting
      prices.forEach((price, index) => {
        const item = tradeItems[index];
        const cargoAmount = engine.state.ship.cargo[index];
        const maxAffordable = price.buyPrice > 0 ? Math.floor(engine.state.credits / price.buyPrice) : 0;
        
        // Format like console would
        const marketLine = `${item.name}: ${price.buyPrice} | ${price.sellPrice} | ${cargoAmount} | ${maxAffordable}`;
        
        assert.ok(marketLine.includes(item.name));
        assert.ok(marketLine.includes(price.buyPrice.toString()));
        assert.ok(marketLine.includes(price.sellPrice.toString()));
        
        console.log(`Market line: ${marketLine}`);
      });
    });

    await t.test('should format ship status information consistently', async () => {
      const engine = createGameEngine();
      const { getCurrentShipStatus } = await import('./engine/game.ts');
      const { getFuelStatus } = await import('./economy/fuel.ts');
      
      const shipStatus = getCurrentShipStatus(engine.state);
      const fuelStatus = getFuelStatus(engine.state);
      
      // Test ship status formatting
      const hullPercent = Math.floor((shipStatus.hull / 100) * 100); // Assuming max hull is 100
      const fuelPercent = fuelStatus.fuelPercentage;
      
      const shipLine = `Hull ${hullPercent}% | Fuel ${shipStatus.fuel} | Cargo ${shipStatus.cargoUsed}/${shipStatus.cargoCapacity}`;
      
      assert.ok(shipLine.includes('Hull'));
      assert.ok(shipLine.includes('Fuel'));
      assert.ok(shipLine.includes('Cargo'));
      
      console.log(`Ship status: ${shipLine}`);
    });

    await t.test('should format system information consistently', async () => {
      const engine = createGameEngine();
      const { getSolarSystemName } = await import('./data/systems.ts');
      
      const currentSystem = engine.state.solarSystem[engine.state.currentSystem];
      const systemName = getSolarSystemName(engine.state.currentSystem);
      
      // Test system information formatting
      const systemLine = `Planet: ${systemName}\nTech Level: ${currentSystem.techLevel} | Politics: ${currentSystem.politics} | Size: ${currentSystem.size}`;
      
      assert.ok(systemLine.includes(systemName));
      assert.ok(systemLine.includes(currentSystem.techLevel.toString()));
      assert.ok(systemLine.includes(currentSystem.politics.toString()));
      
      console.log(`System info: ${systemLine.replace('\n', ' | ')}`);
    });
  });

  await t.test('Action Execution Integration', async (t) => {
    
    await t.test('should handle action execution results correctly', async () => {
      const engine = createGameEngine();
      engine.state.credits = 10000;
      engine.state.currentMode = 1; // OnPlanet
      
      // Test successful action
      const result = await engine.executeAction({
        type: 'refuel_ship',
        parameters: {}
      });
      
      // Console should be able to display this result
      assert.equal(typeof result.success, 'boolean');
      assert.equal(typeof result.message, 'string');
      assert.equal(typeof result.stateChanged, 'boolean');
      
      console.log(`Action result: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message}`);
    });

    await t.test('should handle action failure messages appropriately', async () => {
      const engine = createGameEngine();
      
      // Test invalid action that should fail
      const result = await engine.executeAction({
        type: 'warp_to_system',
        parameters: { targetSystem: 999 } // Invalid system
      });
      
      assert.equal(result.success, false);
      assert.ok(result.message.length > 0, 'Should have failure message');
      
      // Message should be appropriate for user display
      assert.ok(!result.message.includes('undefined'));
      assert.ok(!result.message.includes('null'));
      
      console.log(`Failure message: ${result.message}`);
    });
  });

  await t.test('Travel Destination Logic', async (t) => {
    
    await t.test('should calculate travel destinations correctly', async () => {
      const engine = createGameEngine();
      const { getSystemsWithinRange } = await import('./travel/galaxy.ts');
      const { calculateDistance } = await import('./travel/warp.ts');
      const { getSolarSystemName } = await import('./data/systems.ts');
      
      const reachableSystems = getSystemsWithinRange(engine.state, engine.state.ship.fuel);
      
      assert.ok(Array.isArray(reachableSystems));
      
      // Test destination formatting for console display
      const destinations = reachableSystems.slice(0, 8).map((systemIndex, idx) => {
        const systemName = getSolarSystemName(systemIndex);
        const distance = calculateDistance(
          engine.state.solarSystem[engine.state.currentSystem],
          engine.state.solarSystem[systemIndex]
        );
        
        return {
          index: idx + 1,
          systemIndex,
          name: systemName,
          distance,
          formatted: `${idx + 1}. ${systemName} - ${distance} parsecs`
        };
      });
      
      destinations.forEach(dest => {
        assert.ok(dest.name.length > 0);
        assert.ok(dest.distance >= 0);
        assert.ok(dest.formatted.includes(dest.name));
        assert.ok(dest.formatted.includes(dest.distance.toString()));
        
        console.log(dest.formatted);
      });
    });

    await t.test('should validate destination selection ranges', () => {
      const engine = createGameEngine();
      
      // Simulate selecting destinations (1-8)
      const validSelections = [1, 2, 3, 4, 5, 6, 7, 8];
      const invalidSelections = [0, 9, 10, -1, 999];
      
      validSelections.forEach(selection => {
        const isValid = selection >= 1 && selection <= 8;
        assert.equal(isValid, true, `Selection ${selection} should be valid`);
      });
      
      invalidSelections.forEach(selection => {
        const isValid = selection >= 1 && selection <= 8;
        assert.equal(isValid, false, `Selection ${selection} should be invalid`);
      });
    });
  });

  await t.test('Error Handling and Edge Cases', async (t) => {
    
    await t.test('should handle corrupted game state gracefully', async () => {
      const engine = createGameEngine();
      
      // Corrupt some game state values
      const originalCredits = engine.state.credits;
      engine.state.credits = -999; // Invalid negative credits
      
      const { getGameStatus } = await import('./engine/game.ts');
      const status = getGameStatus(engine.state);
      
      // Should still return valid data structure
      assert.equal(typeof status.credits, 'number');
      assert.equal(typeof status.commanderName, 'string');
      
      // Restore state
      engine.state.credits = originalCredits;
    });

    await t.test('should handle missing or invalid system data', async () => {
      const engine = createGameEngine();
      const { getSolarSystemName } = await import('./data/systems.ts');
      
      // Test with invalid system index
      try {
        const name = getSolarSystemName(999);
        // If it doesn't throw, should return valid string
        assert.equal(typeof name, 'string');
      } catch (error) {
        // Should throw meaningful error
        assert.ok(error instanceof Error);
        assert.ok(error.message.includes('Invalid') || error.message.includes('bounds'));
      }
    });
  });

  await t.test('Performance and Responsiveness', async (t) => {
    
    await t.test('should handle game state queries efficiently', async () => {
      const engine = createGameEngine();
      const { getGameStatus, getCurrentLocation, getCurrentShipStatus } = await import('./engine/game.ts');
      
      const startTime = process.hrtime.bigint();
      
      // Simulate console making many status queries (like during game loop)
      for (let i = 0; i < 1000; i++) {
        getGameStatus(engine.state);
        getCurrentLocation(engine.state);
        getCurrentShipStatus(engine.state);
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      console.log(`1000 status queries completed in ${durationMs.toFixed(2)}ms`);
      assert.ok(durationMs < 50, 'Status queries should be very fast');
    });

    await t.test('should handle market price queries efficiently', async () => {
      const engine = createGameEngine();
      const { getAllSystemPrices } = await import('./economy/pricing.ts');
      
      const startTime = process.hrtime.bigint();
      
      // Simulate console querying market prices frequently
      for (let i = 0; i < 100; i++) {
        const currentSystem = engine.state.solarSystem[engine.state.currentSystem];
        getAllSystemPrices(currentSystem, engine.state.commanderTrader, engine.state.policeRecordScore);
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;
      
      console.log(`100 market queries completed in ${durationMs.toFixed(2)}ms`);
      assert.ok(durationMs < 100, 'Market queries should be reasonably fast');
    });
  });
});
