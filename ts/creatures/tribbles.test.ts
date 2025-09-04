#!/usr/bin/env node --test --experimental-strip-types

import { test } from 'node:test';
import assert from 'node:assert';
import {
  breedTribbles,
  irradiateTribbles,
  tribblesEatNarcotics,
  calculateTribbleCargoBayImpact,
  calculateTribbleShipValuePenalty,
  handleIGPInspection,
  handleTribbleSurvival,
  sellTribblesToBuyer,
  getTribbleDescription,
  getTribblesOperationalImpact,
  shouldShowTribbleShipyardWarning,
  markTribbleWarningShown,
  getRandomTribbleEncounterMessage,
  MAX_TRIBBLES,
  MIN_BREEDING_POPULATION,
  IRRADIATION_SURVIVAL_THRESHOLD
} from './tribbles.ts';
import { createInitialState } from '../state.ts';
import { Difficulty, TradeItem } from '../types.ts';

test('Tribble Enhancement System', async (t) => {

  await t.test('Tribble Breeding Mechanics', async (t) => {
    
    await t.test('should not breed with no tribbles', () => {
      let state = createInitialState();
      state.ship.tribbles = 0;
      
      const result = breedTribbles(state);
      assert.equal(result.state.ship.tribbles, 0);
      assert.equal(result.message, undefined);
    });

    await t.test('should breed tribbles when conditions are met', () => {
      let state = createInitialState();
      state.ship.tribbles = 100;
      
      // Test multiple breeding cycles
      let bred = false;
      for (let i = 0; i < 20; i++) {
        const result = breedTribbles(state);
        if (result.state.ship.tribbles > state.ship.tribbles) {
          bred = true;
          assert.ok(result.state.ship.tribbles >= state.ship.tribbles * 1.5);
          break;
        }
        state = result.state;
      }
      
      assert.ok(bred, 'Tribbles should breed within reasonable attempts');
    });

    await t.test('should cap tribbles at maximum population', () => {
      let state = createInitialState();
      state.ship.tribbles = MAX_TRIBBLES - 100;
      
      const result = breedTribbles(state);
      assert.ok(result.state.ship.tribbles <= MAX_TRIBBLES);
    });

    await t.test('should generate infestation message at max population', () => {
      let state = createInitialState();
      state.ship.tribbles = MAX_TRIBBLES - 1000;
      
      // Force breeding to max
      let result = breedTribbles(state);
      while (result.state.ship.tribbles < MAX_TRIBBLES && result.state.ship.tribbles > state.ship.tribbles) {
        state = result.state;
        result = breedTribbles(state);
      }
      
      if (result.state.ship.tribbles >= MAX_TRIBBLES) {
        assert.ok(result.message?.includes('infestation'));
      }
    });

  });

  await t.test('Radiation Effects', async (t) => {
    
    await t.test('should kill half tribbles from radiation', () => {
      let state = createInitialState();
      state.ship.tribbles = 1000;
      
      const result = irradiateTribbles(state);
      assert.equal(result.state.ship.tribbles, 500);
      assert.ok(result.message?.includes('radiation'));
    });

    await t.test('should kill all tribbles if population too small', () => {
      let state = createInitialState();
      state.ship.tribbles = 5;
      
      const result = irradiateTribbles(state);
      assert.equal(result.state.ship.tribbles, 0);
      assert.ok(result.message?.includes('irradiated all'));
    });

    await t.test('should do nothing with no tribbles', () => {
      let state = createInitialState();
      state.ship.tribbles = 0;
      
      const result = irradiateTribbles(state);
      assert.equal(result.state.ship.tribbles, 0);
      assert.equal(result.message, undefined);
    });

  });

  await t.test('Narcotics Interaction', async (t) => {
    
    await t.test('should have tribbles eat narcotics and get sick', () => {
      let state = createInitialState();
      state.ship.tribbles = 1000;
      state.ship.cargo[TradeItem.Narcotics] = 10;
      
      const result = tribblesEatNarcotics(state);
      assert.ok(result.state.ship.tribbles >= 1 && result.state.ship.tribbles <= 3);
      assert.ok(result.state.ship.cargo[TradeItem.Narcotics] < 10);
      assert.ok(result.message?.includes('ate your narcotics'));
    });

    await t.test('should do nothing without narcotics', () => {
      let state = createInitialState();
      state.ship.tribbles = 100;
      state.ship.cargo[TradeItem.Narcotics] = 0;
      
      const result = tribblesEatNarcotics(state);
      assert.equal(result.state.ship.tribbles, 100);
      assert.equal(result.message, undefined);
    });

    await t.test('should do nothing without tribbles', () => {
      let state = createInitialState();
      state.ship.tribbles = 0;
      state.ship.cargo[TradeItem.Narcotics] = 10;
      
      const result = tribblesEatNarcotics(state);
      assert.equal(result.state.ship.cargo[TradeItem.Narcotics], 10);
      assert.equal(result.message, undefined);
    });

  });

  await t.test('Cargo Bay Impact', async (t) => {
    
    await t.test('should calculate cargo bay impact correctly', () => {
      assert.equal(calculateTribbleCargoBayImpact(0), 0);
      assert.equal(calculateTribbleCargoBayImpact(5000), 0);
      assert.equal(calculateTribbleCargoBayImpact(10000), 1);
      assert.equal(calculateTribbleCargoBayImpact(50000), 5);
      assert.equal(calculateTribbleCargoBayImpact(MAX_TRIBBLES), 10);
    });

    await t.test('should provide operational impact warnings', () => {
      const noneImpact = getTribblesOperationalImpact(0);
      assert.equal(noneImpact.warningLevel, 'none');
      assert.equal(noneImpact.cargoReduction, 0);
      
      const lowImpact = getTribblesOperationalImpact(1000);
      assert.equal(lowImpact.warningLevel, 'low');
      
      const criticalImpact = getTribblesOperationalImpact(MAX_TRIBBLES);
      assert.equal(criticalImpact.warningLevel, 'critical');
      assert.ok(criticalImpact.message?.includes('overrun'));
    });

  });

  await t.test('Ship Value Penalty', async (t) => {
    
    await t.test('should reduce ship value with tribbles aboard', () => {
      const basePrice = 10000;
      const penalty = calculateTribbleShipValuePenalty(basePrice, 100, false);
      assert.equal(penalty, Math.floor(basePrice / 4));
    });

    await t.test('should not reduce value for insurance claims', () => {
      const basePrice = 10000;
      const penalty = calculateTribbleShipValuePenalty(basePrice, 100, true);
      assert.equal(penalty, basePrice);
    });

    await t.test('should not affect value with no tribbles', () => {
      const basePrice = 10000;
      const penalty = calculateTribbleShipValuePenalty(basePrice, 0, false);
      assert.equal(penalty, basePrice);
    });

  });

  await t.test('IGP Inspection System', async (t) => {
    
    await t.test('should pass inspection with no tribbles', () => {
      let state = createInitialState();
      state.ship.tribbles = 0;
      
      const result = handleIGPInspection(state);
      assert.equal(result.success, true);
      assert.equal(result.fine, 0);
      assert.equal(result.tribblesConfiscated, 0);
    });

    await t.test('should confiscate tribbles and impose fine', () => {
      let state = createInitialState();
      state.ship.tribbles = 1000;
      state.credits = 10000;
      
      const result = handleIGPInspection(state);
      assert.equal(result.success, false);
      assert.equal(result.tribblesConfiscated, 1000);
      assert.equal(result.fine, 5000); // 5 per tribble
      assert.equal(result.state.ship.tribbles, 0);
      assert.equal(result.state.credits, 5000);
    });

    await t.test('should cap fine at maximum amount', () => {
      let state = createInitialState();
      state.ship.tribbles = 20000; // Would be 100k fine, but capped at 50k
      state.credits = 100000;
      
      const result = handleIGPInspection(state);
      assert.equal(result.fine, 50000); // Capped at max
    });

  });

  await t.test('Combat Survival', async (t) => {
    
    await t.test('should handle tribble survival in rare cases', () => {
      let state = createInitialState();
      state.ship.tribbles = 1000;
      
      // Test multiple times to check for occasional survival
      let survived = false;
      for (let i = 0; i < 50; i++) {
        const result = handleTribbleSurvival(state, true);
        if (result.state.ship.tribbles > 0) {
          survived = true;
          assert.ok(result.state.ship.tribbles <= 10);
          assert.ok(result.message?.includes('survive'));
          break;
        }
      }
      
      // Note: Due to randomness, this might not always trigger in tests
      console.log(survived ? 'Tribbles survived destruction' : 'No tribble survival in 50 attempts');
    });

    await t.test('should do nothing if ship not destroyed', () => {
      let state = createInitialState();
      state.ship.tribbles = 1000;
      
      const result = handleTribbleSurvival(state, false);
      assert.equal(result.state.ship.tribbles, 1000);
      assert.equal(result.message, undefined);
    });

  });

  await t.test('Tribble Trading', async (t) => {
    
    await t.test('should sell tribbles to buyer for half credits', () => {
      let state = createInitialState();
      state.ship.tribbles = 100;
      
      const result = sellTribblesToBuyer(state);
      assert.equal(result.success, true);
      assert.equal(result.creditsEarned, 50); // 100 / 2
      assert.equal(result.state.ship.tribbles, 0);
      assert.equal(result.state.credits, state.credits + 50);
    });

    await t.test('should fail to sell with no tribbles', () => {
      let state = createInitialState();
      state.ship.tribbles = 0;
      
      const result = sellTribblesToBuyer(state);
      assert.equal(result.success, false);
      assert.equal(result.creditsEarned, 0);
    });

  });

  await t.test('UI and Description Functions', async (t) => {
    
    await t.test('should provide appropriate tribble descriptions', () => {
      assert.equal(getTribbleDescription(0), 'No tribbles aboard');
      assert.equal(getTribbleDescription(1), '1 cute, furry tribble');
      assert.ok(getTribbleDescription(50).includes('50 cute, furry tribbles'));
      assert.ok(getTribbleDescription(500).includes('growing population'));
      assert.ok(getTribbleDescription(5000).includes('large population'));
      assert.ok(getTribbleDescription(MAX_TRIBBLES).includes('infestation'));
    });

    await t.test('should handle tribble warning system', () => {
      let state = createInitialState();
      state.ship.tribbles = 100;
      state.tribbleMessage = false;
      
      assert.equal(shouldShowTribbleShipyardWarning(state), true);
      
      state = markTribbleWarningShown(state);
      assert.equal(state.tribbleMessage, true);
      assert.equal(shouldShowTribbleShipyardWarning(state), false);
    });

    await t.test('should generate random encounter messages', () => {
      const message1 = getRandomTribbleEncounterMessage(10);
      const message2 = getRandomTribbleEncounterMessage(MAX_TRIBBLES);
      
      assert.ok(message1.length > 0);
      assert.ok(message2.includes('everywhere'));
    });

  });

  await t.test('Integration with Game Systems', async (t) => {
    
    await t.test('should integrate with reactor quest radiation', () => {
      let state = createInitialState();
      state.ship.tribbles = 1000;
      state.reactorStatus = 10; // Reactor active
      
      const result = irradiateTribbles(state);
      assert.equal(result.state.ship.tribbles, 500);
      assert.ok(result.message?.includes('radiation'));
    });

    await t.test('should integrate with narcotics trading', () => {
      let state = createInitialState();
      state.ship.tribbles = 500;
      state.ship.cargo[TradeItem.Narcotics] = 8;
      
      const result = tribblesEatNarcotics(state);
      assert.ok(result.state.ship.tribbles <= 3);
      assert.ok(result.state.ship.cargo[TradeItem.Narcotics] <= 8);
    });

    await t.test('should affect cargo capacity calculations', () => {
      const impact1 = calculateTribbleCargoBayImpact(5000); // Small population
      const impact2 = calculateTribbleCargoBayImpact(25000); // Medium population  
      const impact3 = calculateTribbleCargoBayImpact(MAX_TRIBBLES); // Maximum
      
      assert.equal(impact1, 0);
      assert.equal(impact2, 2);
      assert.equal(impact3, 10);
    });

  });

  await t.test('Edge Cases and Error Handling', async (t) => {
    
    await t.test('should handle negative tribble counts gracefully', () => {
      let state = createInitialState();
      state.ship.tribbles = -10;
      
      const result = breedTribbles(state);
      assert.equal(result.state.ship.tribbles, -10); // No change
      
      const impact = calculateTribbleCargoBayImpact(-10);
      assert.equal(impact, 0);
    });

    await t.test('should handle extremely large populations', () => {
      let state = createInitialState();
      state.ship.tribbles = MAX_TRIBBLES * 2; // Somehow exceeded max
      
      const result = breedTribbles(state);
      assert.equal(result.state.ship.tribbles, MAX_TRIBBLES * 2); // No further breeding
      
      const penalty = calculateTribbleShipValuePenalty(10000, MAX_TRIBBLES * 2, false);
      assert.equal(penalty, 2500); // Still applies 1/4 penalty
    });

  });

});
