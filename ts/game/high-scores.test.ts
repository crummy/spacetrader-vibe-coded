// High Score System Comprehensive Tests
import { test } from 'node:test';
import assert from 'node:assert';

import { createInitialState } from '../state.ts';
import { calculateFinalScore, isHighScoreQualified, processGameEnd, type HighScoreEntry } from './endings.ts';

test('calculateFinalScore - factors in worth, days, end status, and difficulty', () => {
  // Test basic score calculation
  const score1 = calculateFinalScore(10000, 100, 0, 0); // Low worth, many days, killed, beginner
  const score2 = calculateFinalScore(100000, 50, 1, 2); // High worth, few days, retired, impossible
  
  assert.ok(score2 > score1, 'Higher worth and better ending should give better score');
  assert(typeof score1 === 'number' && score1 > 0, 'Score should be positive number');
  assert(typeof score2 === 'number' && score2 > 0, 'Score should be positive number');
});

test('calculateFinalScore - end status affects score', () => {
  const baseWorth = 50000;
  const baseDays = 200;
  const difficulty = 1; // Normal
  
  const killedScore = calculateFinalScore(baseWorth, baseDays, 0, difficulty); // Killed
  const retiredScore = calculateFinalScore(baseWorth, baseDays, 1, difficulty); // Retired  
  const moonScore = calculateFinalScore(baseWorth, baseDays, 2, difficulty); // Bought moon
  
  assert.ok(moonScore > retiredScore, 'Moon ending should score highest');
  assert.ok(retiredScore > killedScore, 'Retirement should score better than death');
});

test('calculateFinalScore - difficulty affects score multiplier', () => {
  const baseWorth = 30000;
  const baseDays = 150;
  const endStatus = 1; // Retired
  
  const beginnerScore = calculateFinalScore(baseWorth, baseDays, endStatus, 0); // Beginner
  const normalScore = calculateFinalScore(baseWorth, baseDays, endStatus, 1); // Normal
  const hardScore = calculateFinalScore(baseWorth, baseDays, endStatus, 2); // Hard
  const impossibleScore = calculateFinalScore(baseWorth, baseDays, endStatus, 3); // Impossible
  
  assert.ok(impossibleScore > hardScore, 'Impossible difficulty should score highest');
  assert.ok(hardScore > normalScore, 'Hard should score better than normal');
  assert.ok(normalScore > beginnerScore, 'Normal should score better than beginner');
});

test('calculateFinalScore - fewer days increases score', () => {
  const baseWorth = 40000;
  const endStatus = 2; // Moon (only moon endings get time bonus)
  const difficulty = 1; // Normal
  
  const slowScore = calculateFinalScore(baseWorth, 500, endStatus, difficulty); // Many days
  const fastScore = calculateFinalScore(baseWorth, 100, endStatus, difficulty); // Few days
  
  assert.ok(fastScore > slowScore, 'Finishing faster should give better score');
});

test('isHighScoreQualified - empty high score table accepts any score', () => {
  const emptyTable: HighScoreEntry[] = [];
  
  const qualified = isHighScoreQualified(1000, emptyTable);
  
  assert.equal(qualified, true, 'Should qualify for empty table');
});

test('isHighScoreQualified - score comparison with existing entries', () => {
  const existingScores: HighScoreEntry[] = [
    { name: 'Player1', score: 5000, status: 1, days: 100, worth: 50000, difficulty: 1 },
    { name: 'Player2', score: 3000, status: 1, days: 150, worth: 30000, difficulty: 1 },
    { name: 'Player3', score: 1000, status: 0, days: 200, worth: 10000, difficulty: 0 }
  ];
  
  const highScore = isHighScoreQualified(6000, existingScores);
  const lowScore = isHighScoreQualified(500, existingScores);
  
  assert.equal(highScore, true, 'High score should qualify');
  assert.equal(lowScore, false, 'Low score should not qualify');
});

test('processGameEnd - calculates complete end game statistics', () => {
  const state = createInitialState();
  state.credits = 25000;
  state.days = 180;
  state.moonBought = true; // Moon ending
  state.difficulty = 2; // Hard
  
  const result = processGameEnd(state);
  
  assert.equal(result.isGameOver, true);
  assert.equal(result.endStatus, 2, 'Should detect moon ending');
  assert.ok(result.finalWorth > 25000, 'Worth should include ship and assets');
  assert.ok(result.finalScore > 0, 'Should calculate final score');
  assert.equal(result.days, 180);
  assert(typeof result.highScoreQualified === 'boolean');
});

test('high score system - moon purchase ending', () => {
  const state = createInitialState();
  state.moonBought = true;
  state.currentSystem = 119; // Utopia system where moon is
  
  const result = processGameEnd(state);
  
  assert.equal(result.endStatus, 2, 'Moon purchase should be end status 2');
  assert.equal(result.message.includes('moon') || result.message.includes('Moon'), true);
});

test('high score system - retirement ending', () => {
  const state = createInitialState();
  state.days = 1000; // Long game
  state.credits = 100000; // Rich
  
  const result = processGameEnd(state);
  
  assert.ok(result.endStatus === 1 || result.endStatus === 0, 'Should have valid end status');
  assert.ok(result.finalScore > 0, 'Should calculate meaningful score for retirement');
});

test('high score system - score calculation edge cases', () => {
  // Test zero worth
  const zeroScore = calculateFinalScore(0, 100, 1, 1);
  assert.ok(zeroScore >= 0, 'Zero worth should still give non-negative score');
  
  // Test very high worth
  const highScore = calculateFinalScore(1000000, 50, 2, 3);
  assert.ok(highScore > 10000, 'High worth should give substantial score');
  
  // Test very long game
  const longGameScore = calculateFinalScore(50000, 9999, 1, 1);
  assert.ok(longGameScore > 0, 'Long game should still give positive score');
});

test('high score system - difficulty progression affects scoring', () => {
  const testParams = { worth: 50000, days: 200, endStatus: 1 };
  
  const scores = [0, 1, 2, 3].map(difficulty => 
    calculateFinalScore(testParams.worth, testParams.days, testParams.endStatus, difficulty)
  );
  
  // Each difficulty should give progressively higher scores
  assert.ok(scores[1] > scores[0], 'Normal > Beginner');
  assert.ok(scores[2] > scores[1], 'Hard > Normal');
  assert.ok(scores[3] > scores[2], 'Impossible > Hard');
});
