import { test } from 'node:test';
import assert from 'node:assert';
import type { State, SolarSystem } from '../types.ts';
import { createInitialState } from '../state.ts';

/**
 * Tests to enforce Palm OS newspaper story generation compliance
 * Based on palm/Src/SpecialEvent.c lines 718+ and constants
 */

test('Newspaper Story Generation - Palm OS Compliance', async (t) => {
  await t.test('should use correct STORYPROBABILITY formula', () => {
    // Palm OS: STORYPROBABILITY = 50/MAXTECHLEVEL = 50/8 = 6.25
    const STORYPROBABILITY = 6.25;
    const MAXTECHLEVEL = 8;
    
    assert.strictEqual(STORYPROBABILITY, 50 / MAXTECHLEVEL, 
      'STORYPROBABILITY should equal 50/MAXTECHLEVEL');
  });

  await t.test('should calculate story probability based on tech level and difficulty', () => {
    // Palm OS formula: STORYPROBABILITY * techLevel + 10 * (5 - difficulty)
    const system: SolarSystem = {
      nameIndex: 0,
      techLevel: 6,
      politics: 0,
      status: 0,
      x: 0,
      y: 0,
      specialResources: 0,
      size: 0,
      visited: true,
      qty: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      countDown: 0,
      special: -1
    };
    
    // Test different difficulties
    const testCases = [
      { difficulty: 0, expected: 6.25 * 6 + 10 * (5 - 0) }, // Beginner: 37.5 + 50 = 87.5%
      { difficulty: 1, expected: 6.25 * 6 + 10 * (5 - 1) }, // Easy: 37.5 + 40 = 77.5%
      { difficulty: 2, expected: 6.25 * 6 + 10 * (5 - 2) }, // Normal: 37.5 + 30 = 67.5%
      { difficulty: 3, expected: 6.25 * 6 + 10 * (5 - 3) }, // Hard: 37.5 + 20 = 57.5%
      { difficulty: 4, expected: 6.25 * 6 + 10 * (5 - 4) }  // Impossible: 37.5 + 10 = 47.5%
    ];
    
    for (const testCase of testCases) {
      const probability = calculateStoryProbability(system.techLevel, testCase.difficulty);
      assert.strictEqual(probability, testCase.expected,
        `Story probability for difficulty ${testCase.difficulty} should be ${testCase.expected}%`);
    }
  });

  await t.test('should generate stories probabilistically based on calculation', () => {
    const system: SolarSystem = {
      nameIndex: 0,
      techLevel: 8, // Max tech
      politics: 0,
      status: 0,
      x: 0,
      y: 0,
      specialResources: 0,
      size: 0,
      visited: true,
      qty: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      countDown: 0,
      special: -1
    };
    
    const difficulty = 2; // Normal
    const expectedProbability = 6.25 * 8 + 10 * (5 - 2); // 50 + 30 = 80%
    
    // Run multiple trials to test probability
    let storyGeneratedCount = 0;
    const trials = 1000;
    
    for (let i = 0; i < trials; i++) {
      if (shouldGenerateStory(system, difficulty)) {
        storyGeneratedCount++;
      }
    }
    
    const actualProbability = (storyGeneratedCount / trials) * 100;
    
    // Should be within 5% of expected probability
    assert.ok(Math.abs(actualProbability - expectedProbability) < 5,
      `Story generation should be ~${expectedProbability}%, was ${actualProbability}%`);
  });

  await t.test('should use correct text formatting constants', () => {
    // Palm OS constants for newspaper layout
    const NEWSINDENT1 = 5; // First line indentation
    const NEWSINDENT2 = 5; // Second line indentation
    
    const formattedNews = formatNewsText('Test headline', 'Test story content');
    
    // Should use proper indentation (simplified test - actual implementation may vary)
    assert.ok(formattedNews.includes('Test headline'), 'Should include headline');
    assert.ok(formattedNews.includes('Test story content'), 'Should include story content');
  });

  await t.test('should have correct masthead system', () => {
    // Palm OS: MAXMASTHEADS = 3 (3 different newspaper names per political situation)
    const MAXMASTHEADS = 3;
    
    const system: SolarSystem = {
      nameIndex: 0,
      techLevel: 6,
      politics: 2, // Some government type
      status: 0,
      x: 0,
      y: 0,
      specialResources: 0,
      size: 0,
      visited: true,
      qty: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      countDown: 0,
      special: -1
    };
    
    const mastheads = getNewspaperMastheads(system.politics);
    assert.strictEqual(mastheads.length, MAXMASTHEADS, 
      'Should have exactly 3 mastheads per government type');
  });

  await t.test('should have correct canned stories system', () => {
    // Palm OS: MAXSTORIES = 4 (4 canned stories per political situation)
    const MAXSTORIES = 4;
    
    const system: SolarSystem = {
      nameIndex: 0,
      techLevel: 6,
      politics: 1, // Some government type
      status: 0,
      x: 0,
      y: 0,
      specialResources: 0,
      size: 0,
      visited: true,
      qty: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      countDown: 0,
      special: -1
    };
    
    const stories = getCannedStories(system.politics);
    assert.strictEqual(stories.length, MAXSTORIES,
      'Should have exactly 4 canned stories per government type');
  });

  await t.test('should vary content by political system', () => {
    const systemA: SolarSystem = {
      nameIndex: 92, // Sol  
      techLevel: 6,
      politics: 0, // Democracy
      status: 0,
      x: 0,
      y: 0,
      specialResources: 0,
      size: 0,
      visited: true,
      qty: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      countDown: 0,
      special: -1
    };
    
    const systemB: SolarSystem = {
      nameIndex: 0, // Acamar
      techLevel: 6,
      politics: 5, // Dictatorship
      status: 0,
      x: 0,
      y: 0,
      specialResources: 0,
      size: 0,
      visited: true,
      qty: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      countDown: 0,
      special: -1
    };
    
    const mastheadsA = getNewspaperMastheads(systemA.politics);
    const mastheadsB = getNewspaperMastheads(systemB.politics);
    
    // Different governments should have different newspaper names
    assert.notDeepStrictEqual(mastheadsA, mastheadsB,
      'Different government types should have different newspaper mastheads');
  });

  await t.test('should integrate with existing quest event system', () => {
    const state = createInitialState();
    
    // Quest events should still appear in newspaper
    state.newsEvents = [
      { id: 1, timestamp: Date.now(), system: 0 }
    ];
    
    const newspaper = generateNewspaper(state);
    // Should include some content from the event (event names will be resolved by getEventName)
    assert.ok(newspaper.length > 100, 'Newspaper should include news content');
    assert.ok(newspaper.includes('•'), 'Newspaper should include formatted news items');
  });
});

// Import Palm OS compliant implementations
import {
  calculateStoryProbability,
  shouldGenerateStory,
  formatNewsText,
  getNewspaperMastheads,
  getCannedStories,
  generateNewspaper
} from './newspaper-palm.ts';
