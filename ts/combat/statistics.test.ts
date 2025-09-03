#!/usr/bin/env node --test --experimental-strip-types

import { test } from 'node:test';
import assert from 'node:assert';
import {
  recordShipKill,
  getCombatStatistics,
  formatCombatStatistics,
  getKillAchievements,
  resetCombatStatistics,
  shouldAwardStandardReputation,
  handleFamousCaptainKill,
  KILL_POLICE_SCORE,
  KILL_TRADER_SCORE,
  KILL_PIRATE_SCORE
} from './statistics.ts';
import { EncounterType } from './engine.ts';
import { createInitialState } from '../state.ts';
import { Difficulty } from '../types.ts';

test('Combat Statistics System', async (t) => {

  await t.test('Police Kill Tracking', async (t) => {
    
    await t.test('should track police kills and apply score penalty', () => {
      let state = createInitialState(Difficulty.Easy);
      const initialPoliceRecord = state.policeRecordScore;
      
      // Kill a police ship
      state = recordShipKill(state, EncounterType.POLICEATTACK);
      
      assert.equal(state.policeKills, 1);
      assert.equal(state.policeRecordScore, initialPoliceRecord + KILL_POLICE_SCORE);
      assert.ok(state.reputationScore > 0); // Should gain some reputation
    });

    await t.test('should track multiple police kills', () => {
      let state = createInitialState(Difficulty.Easy);
      
      // Kill 3 police ships
      state = recordShipKill(state, EncounterType.POLICEATTACK);
      state = recordShipKill(state, EncounterType.POLICEATTACK);
      state = recordShipKill(state, EncounterType.POLICEATTACK);
      
      assert.equal(state.policeKills, 3);
      assert.equal(state.policeRecordScore, KILL_POLICE_SCORE * 3);
    });

  });

  await t.test('Trader Kill Tracking', async (t) => {
    
    await t.test('should track trader kills and apply score penalty', () => {
      let state = createInitialState(Difficulty.Easy);
      const initialPoliceRecord = state.policeRecordScore;
      
      // Kill a trader ship
      state = recordShipKill(state, EncounterType.TRADERSELL);
      
      assert.equal(state.traderKills, 1);
      assert.equal(state.policeRecordScore, initialPoliceRecord + KILL_TRADER_SCORE);
      assert.ok(state.reputationScore > 0);
    });

  });

  await t.test('Pirate Kill Tracking', async (t) => {
    
    await t.test('should track pirate kills and improve police record', () => {
      let state = createInitialState(Difficulty.Easy);
      const initialPoliceRecord = state.policeRecordScore;
      
      // Kill a pirate ship
      state = recordShipKill(state, EncounterType.PIRATEATTACK);
      
      assert.equal(state.pirateKills, 1);
      assert.equal(state.policeRecordScore, initialPoliceRecord + KILL_PIRATE_SCORE);
      assert.ok(state.reputationScore > 0);
    });

  });

  await t.test('Special Ship Kill Tracking', async (t) => {
    
    await t.test('should track space monster kill and update status', () => {
      let state = createInitialState(Difficulty.Easy);
      const initialPirateKills = state.pirateKills;
      
      state = recordShipKill(state, EncounterType.SPACEMONSTERATTACK);
      
      assert.equal(state.pirateKills, initialPirateKills + 1);
      assert.equal(state.spacemonsterStatus, 2); // Monster killed status
      assert.equal(state.policeRecordScore, KILL_PIRATE_SCORE);
    });

    await t.test('should track dragonfly kill and update status', () => {
      let state = createInitialState(Difficulty.Easy);
      
      state = recordShipKill(state, EncounterType.DRAGONFLYATTACK);
      
      assert.equal(state.pirateKills, 1);
      assert.equal(state.dragonflyStatus, 5); // Dragonfly killed status
    });

    await t.test('should track scarab kill and update status', () => {
      let state = createInitialState(Difficulty.Easy);
      
      state = recordShipKill(state, EncounterType.SCARABATTACK);
      
      assert.equal(state.pirateKills, 1);
      assert.equal(state.scarabStatus, 2); // Scarab killed status
    });

  });

  await t.test('Famous Captain Kill Handling', async (t) => {
    
    await t.test('should handle famous captain kill with special reputation boost', () => {
      let state = createInitialState(Difficulty.Easy);
      state.reputationScore = 100; // Below DANGEROUSREP (300)
      
      state = handleFamousCaptainKill(state, EncounterType.CAPTAINAHABENCOUNTER);
      
      assert.equal(state.reputationScore, 300); // Boosted to Dangerous level
    });

    await t.test('should add bonus points if already dangerous reputation', () => {
      let state = createInitialState(Difficulty.Easy);
      state.reputationScore = 400; // Already above DANGEROUSREP
      
      state = handleFamousCaptainKill(state, EncounterType.CAPTAINCONRADENCOUNTER);
      
      assert.equal(state.reputationScore, 500); // 400 + 100 bonus
    });

    await t.test('should identify famous captain encounters correctly', () => {
      assert.equal(shouldAwardStandardReputation(EncounterType.CAPTAINAHABENCOUNTER), false);
      assert.equal(shouldAwardStandardReputation(EncounterType.CAPTAINCONRADENCOUNTER), false);
      assert.equal(shouldAwardStandardReputation(EncounterType.CAPTAINHUIEENCOUNTER), false);
      assert.equal(shouldAwardStandardReputation(EncounterType.PIRATEATTACK), true);
    });

  });

  await t.test('Statistics Retrieval and Formatting', async (t) => {
    
    await t.test('should retrieve combat statistics correctly', () => {
      let state = createInitialState(Difficulty.Easy);
      
      // Add some kills
      state.policeKills = 5;
      state.traderKills = 3;
      state.pirateKills = 12;
      
      const stats = getCombatStatistics(state);
      
      assert.equal(stats.policeKills, 5);
      assert.equal(stats.traderKills, 3);
      assert.equal(stats.pirateKills, 12);
      assert.equal(stats.totalKills, 20);
    });

    await t.test('should format statistics for display', () => {
      const stats = {
        policeKills: 5,
        traderKills: 3,
        pirateKills: 12,
        totalKills: 20
      };
      
      const formatted = formatCombatStatistics(stats);
      
      assert.ok(formatted.includes('Total Kills: 20'));
      assert.ok(formatted.includes('Police: 5'));
      assert.ok(formatted.includes('Traders: 3'));
      assert.ok(formatted.includes('Pirates: 12'));
    });

  });

  await t.test('Kill Achievement System', async (t) => {
    
    await t.test('should award veteran fighter achievement', () => {
      const stats = { policeKills: 20, traderKills: 30, pirateKills: 50, totalKills: 100 };
      const achievements = getKillAchievements(stats);
      
      assert.ok(achievements.some(a => a.includes('Veteran Fighter')));
    });

    await t.test('should award elite pilot achievement', () => {
      const stats = { policeKills: 100, traderKills: 100, pirateKills: 300, totalKills: 500 };
      const achievements = getKillAchievements(stats);
      
      assert.ok(achievements.some(a => a.includes('Elite Pilot')));
    });

    await t.test('should award enemy of the state achievement', () => {
      const stats = { policeKills: 60, traderKills: 5, pirateKills: 20, totalKills: 85 };
      const achievements = getKillAchievements(stats);
      
      assert.ok(achievements.some(a => a.includes('Enemy of the State')));
    });

    await t.test('should award pirate hunter achievement', () => {
      const stats = { policeKills: 5, traderKills: 10, pirateKills: 120, totalKills: 135 };
      const achievements = getKillAchievements(stats);
      
      assert.ok(achievements.some(a => a.includes('Pirate Hunter')));
    });

    await t.test('should award honorable fighter achievement', () => {
      const stats = { policeKills: 10, traderKills: 0, pirateKills: 50, totalKills: 60 };
      const achievements = getKillAchievements(stats);
      
      assert.ok(achievements.some(a => a.includes('Honorable Fighter')));
    });

    await t.test('should not award achievements below thresholds', () => {
      const stats = { policeKills: 2, traderKills: 1, pirateKills: 5, totalKills: 8 };
      const achievements = getKillAchievements(stats);
      
      assert.equal(achievements.length, 0);
    });

  });

  await t.test('Statistics Reset', async (t) => {
    
    await t.test('should reset all kill counters', () => {
      let state = createInitialState(Difficulty.Easy);
      state.policeKills = 10;
      state.traderKills = 5;
      state.pirateKills = 15;
      
      state = resetCombatStatistics(state);
      
      assert.equal(state.policeKills, 0);
      assert.equal(state.traderKills, 0);
      assert.equal(state.pirateKills, 0);
    });

  });

  await t.test('Encounter Type Classification', async (t) => {
    
    await t.test('should correctly classify encounter types', () => {
      let state = createInitialState(Difficulty.Easy);
      
      // Test police encounter
      state = recordShipKill(state, EncounterType.POLICEATTACK);
      assert.equal(state.policeKills, 1);
      
      // Test pirate encounter  
      state = recordShipKill(state, EncounterType.PIRATEATTACK);
      assert.equal(state.pirateKills, 1);
      
      // Test trader encounter
      state = recordShipKill(state, EncounterType.TRADERSELL);
      assert.equal(state.traderKills, 1);
    });

  });

  await t.test('Integration with Reputation System', async (t) => {
    
    await t.test('should integrate kill tracking with reputation scoring', () => {
      let state = createInitialState(Difficulty.Easy);
      const initialReputation = state.reputationScore;
      
      // Kill a pirate (should improve both reputation and police record)
      state = recordShipKill(state, EncounterType.PIRATEATTACK);
      
      assert.ok(state.reputationScore > initialReputation);
      assert.equal(state.policeRecordScore, KILL_PIRATE_SCORE);
    });

  });

  await t.test('Edge Cases', async (t) => {
    
    await t.test('should handle unknown encounter types gracefully', () => {
      let state = createInitialState(Difficulty.Easy);
      const initialStats = getCombatStatistics(state);
      
      // Unknown encounter type should not crash
      state = recordShipKill(state, 999);
      const finalStats = getCombatStatistics(state);
      
      // Should not change kill counters for unknown encounters
      assert.equal(finalStats.totalKills, initialStats.totalKills);
    });

    await t.test('should handle multiple rapid kills correctly', () => {
      let state = createInitialState(Difficulty.Easy);
      
      // Rapid succession of kills
      for (let i = 0; i < 10; i++) {
        state = recordShipKill(state, EncounterType.PIRATEATTACK);
      }
      
      assert.equal(state.pirateKills, 10);
      assert.equal(state.policeRecordScore, KILL_PIRATE_SCORE * 10);
    });

  });

});
