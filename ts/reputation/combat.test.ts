#!/usr/bin/env node --test --experimental-strip-types

import { test } from 'node:test';
import assert from 'node:assert';
import { 
  getReputationString,
  calculateKillPoints,
  awardKillPoints,
  isEliteReputation,
  isDangerousReputation,
  getReputationEncounterModifier,
  calculateBountyReward,
  processCombatVictory,
  calculatePirateIntimidationChance,
  applyReputationPenalty,
  HARMLESS_REP,
  MOSTLY_HARMLESS_REP,
  POOR_REP,
  AVERAGE_SCORE,
  ABOVE_AVERAGE_SCORE,
  COMPETENT_REP,
  DANGEROUS_REP,
  DEADLY_REP,
  ELITE_SCORE
} from './combat.ts';
import { createInitialState } from '../state.ts';
import { Difficulty } from '../types.ts';

test('Combat Reputation System', async (t) => {

  await t.test('Reputation string conversion', () => {
    assert.equal(getReputationString(HARMLESS_REP), 'Harmless');
    assert.equal(getReputationString(MOSTLY_HARMLESS_REP), 'Mostly harmless');
    assert.equal(getReputationString(POOR_REP), 'Poor');
    assert.equal(getReputationString(AVERAGE_SCORE), 'Average');
    assert.equal(getReputationString(ABOVE_AVERAGE_SCORE), 'Above average');
    assert.equal(getReputationString(COMPETENT_REP), 'Competent');
    assert.equal(getReputationString(DANGEROUS_REP), 'Dangerous');
    assert.equal(getReputationString(DEADLY_REP), 'Deadly');
    assert.equal(getReputationString(ELITE_SCORE), 'Elite');
  });

  await t.test('Kill points calculation based on opponent reputation', () => {
    assert.equal(calculateKillPoints(HARMLESS_REP), 1);
    assert.equal(calculateKillPoints(MOSTLY_HARMLESS_REP), 2);
    assert.equal(calculateKillPoints(POOR_REP), 4);
    assert.equal(calculateKillPoints(AVERAGE_SCORE), 8);
    assert.equal(calculateKillPoints(ABOVE_AVERAGE_SCORE), 16);
    assert.equal(calculateKillPoints(COMPETENT_REP), 32);
    assert.equal(calculateKillPoints(DANGEROUS_REP), 64);
    assert.equal(calculateKillPoints(DEADLY_REP), 128);
    assert.equal(calculateKillPoints(ELITE_SCORE), 256);
  });

  await t.test('Award kill points progression', () => {
    let state = createInitialState(Difficulty.Easy);
    state.reputationScore = HARMLESS_REP;
    
    // Kill a competent opponent
    state = awardKillPoints(state, COMPETENT_REP);
    assert.equal(state.reputationScore, HARMLESS_REP + 32);
    
    // Kill an elite opponent
    state = awardKillPoints(state, ELITE_SCORE);
    assert.equal(state.reputationScore, HARMLESS_REP + 32 + 256);
  });

  await t.test('Elite and dangerous reputation checks', () => {
    assert.equal(isEliteReputation(ELITE_SCORE), true);
    assert.equal(isEliteReputation(DEADLY_REP), false);
    
    assert.equal(isDangerousReputation(DANGEROUS_REP), true);
    assert.equal(isDangerousReputation(COMPETENT_REP), false);
    assert.equal(isDangerousReputation(ELITE_SCORE), true);
  });

  await t.test('Reputation encounter modifiers', () => {
    const harmlessModifier = getReputationEncounterModifier(HARMLESS_REP);
    const competentModifier = getReputationEncounterModifier(COMPETENT_REP);
    const dangerousModifier = getReputationEncounterModifier(DANGEROUS_REP);
    const eliteModifier = getReputationEncounterModifier(ELITE_SCORE);
    
    assert.equal(harmlessModifier, 1.0);
    assert.equal(competentModifier, 1.1);
    assert.equal(dangerousModifier, 1.2);
    assert.equal(eliteModifier, 1.5);
  });

  await t.test('Bounty reward calculation', () => {
    assert.equal(calculateBountyReward(HARMLESS_REP), 25);
    assert.equal(calculateBountyReward(AVERAGE_SCORE), 250);
    assert.equal(calculateBountyReward(DANGEROUS_REP), 2500);
    assert.equal(calculateBountyReward(ELITE_SCORE), 10000);
  });

  await t.test('Combat victory processing', () => {
    let state = createInitialState(Difficulty.Easy);
    const initialCredits = state.credits;
    const initialReputation = state.reputationScore;
    
    // Defeat an elite opponent
    state = processCombatVictory(state, 8, ELITE_SCORE);
    
    assert.equal(state.reputationScore, initialReputation + 256); // Elite kill points
    assert.equal(state.credits, initialCredits + 10000); // Elite bounty
  });

  await t.test('Pirate intimidation chance', () => {
    const eliteVsWeak = calculatePirateIntimidationChance(ELITE_SCORE, 1);
    const eliteVsStrong = calculatePirateIntimidationChance(ELITE_SCORE, 5);
    const harmlessVsWeak = calculatePirateIntimidationChance(HARMLESS_REP, 1);
    
    assert.equal(eliteVsWeak, 0.3); // Elite intimidates weak pirates
    assert.equal(eliteVsStrong, 0.0); // No intimidation vs strong pirates
    assert.equal(harmlessVsWeak, 0.0); // Harmless pilots don't intimidate
  });

  await t.test('Reputation penalty application', () => {
    let state = createInitialState(Difficulty.Easy);
    state.reputationScore = COMPETENT_REP;
    
    // Apply penalty
    state = applyReputationPenalty(state, 100);
    assert.equal(state.reputationScore, COMPETENT_REP - 100);
    
    // Cannot go below 0
    state = applyReputationPenalty(state, 1000);
    assert.equal(state.reputationScore, 0);
  });

});
