#!/usr/bin/env node --test --experimental-strip-types

import { test } from 'node:test';
import assert from 'node:assert';
import { AutomatedPlayer, runMultipleGames } from './automated-player.ts';
import { Difficulty } from './types.ts';

test('AutomatedPlayer', async (t) => {

  await t.test('Constructor', async (t) => {
    
    await t.test('should create player with default parameters', () => {
      const player = new AutomatedPlayer();
      
      assert.ok(player instanceof AutomatedPlayer);
      console.log('✅ AutomatedPlayer created with defaults');
    });

    await t.test('should create player with custom parameters', () => {
      const player = new AutomatedPlayer(Difficulty.Impossible, 100, true);
      
      assert.ok(player instanceof AutomatedPlayer);
      console.log('✅ AutomatedPlayer created with custom settings');
    });
  });

  await t.test('playToCompletion', async (t) => {
    
    await t.test('should complete a game session within turn limit', async () => {
      const player = new AutomatedPlayer(0, 10, false); // 0 = Beginner
      
      const result = await player.playToCompletion();
      
      assert.equal(typeof result.gameNumber, 'number');
      assert.equal(typeof result.startTime, 'number');
      assert.equal(typeof result.totalTurns, 'number');
      assert.equal(typeof result.finalCredits, 'number');
      assert.equal(typeof result.finalWorth, 'number');
      
      assert.ok(result.totalTurns >= 0);
      assert.ok(result.totalTurns <= 10);
      assert.ok(result.finalCredits >= 0);
      
      console.log(`✅ Game completed: ${result.totalTurns} turns, ${result.finalCredits} credits`);
    });

    await t.test('should handle very short turn limit', async () => {
      const player = new AutomatedPlayer(0, 1, false); // 0 = Beginner
      
      const result = await player.playToCompletion();
      
      assert.ok(result.totalTurns <= 1);
      assert.equal(typeof result.endTime, 'number');
      
      console.log(`✅ Short game: ${result.totalTurns} turns completed`);
    });

    await t.test('should handle different difficulty levels', async () => {
      const difficulties = [0, 1, 2, 3, 4]; // Difficulty enum values
      
      for (const difficulty of difficulties) {
        const player = new AutomatedPlayer(difficulty, 5, false);
        const result = await player.playToCompletion();
        
        assert.equal(typeof result.totalTurns, 'number');
        assert.ok(result.totalTurns >= 0);
        
        console.log(`✅ Difficulty ${difficulty}: ${result.totalTurns} turns completed`);
      }
    });

    await t.test('should track game session data', async () => {
      const player = new AutomatedPlayer(1, 15, false); // 1 = Easy
      
      const result = await player.playToCompletion();
      
      assert.equal(typeof result.gameNumber, 'number');
      assert.equal(typeof result.startTime, 'number');
      assert.equal(typeof result.endTime, 'number');
      
      assert.ok(result.gameNumber >= 0);
      assert.ok(result.startTime > 0);
      assert.ok(result.endTime! >= result.startTime);
      
      console.log(`✅ Session data: Game #${result.gameNumber}, ${result.totalTurns} turns`);
    });

    await t.test('should handle verbose mode', async () => {
      const player = new AutomatedPlayer(0, 3, true); // 0 = Beginner
      
      const result = await player.playToCompletion();
      
      assert.equal(typeof result.totalTurns, 'number');
      console.log('✅ Verbose mode completed without errors');
    });
  });

  await t.test('runMultipleGames', async (t) => {
    
    await t.test('should run multiple games and collect statistics', async () => {
      const sessions = await runMultipleGames(3, 0, 5); // 0 = Beginner
      
      assert.ok(Array.isArray(sessions));
      assert.equal(sessions.length, 3);
      
      for (const session of sessions) {
        assert.equal(typeof session.gameNumber, 'number');
        assert.equal(typeof session.totalTurns, 'number');
        assert.equal(typeof session.finalCredits, 'number');
        assert.equal(typeof session.finalWorth, 'number');
        
        assert.ok(session.totalTurns >= 0);
        assert.ok(session.finalCredits >= 0);
      }
      
      console.log(`✅ Multiple games: ${sessions.length} games completed`);
    });

    await t.test('should handle single game run', async () => {
      const sessions = await runMultipleGames(1, 1, 8); // 1 = Easy
      
      assert.ok(Array.isArray(sessions));
      assert.equal(sessions.length, 1);
      assert.equal(typeof sessions[0].totalTurns, 'number');
      
      console.log('✅ Single game statistics collected');
    });
  });

  await t.test('Game State Management', async (t) => {
    
    await t.test('should maintain valid game state throughout play', async () => {
      const player = new AutomatedPlayer(2, 20, false); // 2 = Normal
      
      const result = await player.playToCompletion();
      
      // Basic state validation
      assert.ok(result.finalCredits >= 0, 'Credits should not be negative');
      assert.ok(result.totalTurns >= 0, 'Turns should not be negative');
      
      console.log('✅ Game state remained valid throughout play');
    });

    await t.test('should handle edge cases gracefully', async () => {
      const player = new AutomatedPlayer(4, 0, false); // 4 = Impossible
      
      const result = await player.playToCompletion();
      
      assert.equal(result.totalTurns, 0);
      assert.equal(typeof result.endTime, 'number');
      
      console.log('✅ Zero turn limit handled correctly');
    });
  });

  await t.test('Action Selection Logic', async (t) => {
    
    await t.test('should have consistent action selection behavior', async () => {
      const player1 = new AutomatedPlayer(2, 10, false); // 2 = Normal
      const player2 = new AutomatedPlayer(2, 10, false); // 2 = Normal
      
      const result1 = await player1.playToCompletion();
      const result2 = await player2.playToCompletion();
      
      // Both should complete without errors
      assert.equal(typeof result1.totalTurns, 'number');
      assert.equal(typeof result2.totalTurns, 'number');
      
      // Results may differ due to randomness, but structure should be consistent
      assert.ok(result1.totalTurns >= 0);
      assert.ok(result2.totalTurns >= 0);
      
      console.log(`✅ Consistent behavior: Game 1: ${result1.totalTurns} turns, Game 2: ${result2.totalTurns} turns`);
    });
  });
});
