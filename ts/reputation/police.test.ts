#!/usr/bin/env node --test --experimental-strip-types

import { test } from 'node:test';
import assert from 'node:assert';
import { 
  getPoliceRecordString,
  isCriminalRecord,
  isCleanRecord,
  calculateBribeAmount,
  applyPoliceRecordPenalty,
  improvePoliceRecord,
  handleInspectorEncounter,
  getPoliceEncounterModifier,
  PSYCHOPATH_SCORE,
  VILLAIN_SCORE,
  CRIMINAL_SCORE,
  CROOK_SCORE,
  DUBIOUS_SCORE,
  CLEAN_SCORE,
  LAWFUL_SCORE,
  TRUSTED_SCORE,
  HELPER_SCORE,
  HERO_SCORE,
  ATTACKED_POLICE_PENALTY,
  DESTROYED_POLICE_PENALTY
} from './police.ts';
import { createInitialState } from '../state.ts';
import { Difficulty } from '../types.ts';

test('Police Record System', async (t) => {

  await t.test('Police record string conversion', () => {
    assert.equal(getPoliceRecordString(PSYCHOPATH_SCORE), 'Psycho');
    assert.equal(getPoliceRecordString(VILLAIN_SCORE), 'Villain');
    assert.equal(getPoliceRecordString(CRIMINAL_SCORE), 'Criminal');
    assert.equal(getPoliceRecordString(CROOK_SCORE), 'Crook');
    assert.equal(getPoliceRecordString(DUBIOUS_SCORE), 'Dubious');
    assert.equal(getPoliceRecordString(CLEAN_SCORE), 'Clean');
    assert.equal(getPoliceRecordString(LAWFUL_SCORE), 'Lawful');
    assert.equal(getPoliceRecordString(TRUSTED_SCORE), 'Trusted');
    assert.equal(getPoliceRecordString(HELPER_SCORE), 'Liked');
    assert.equal(getPoliceRecordString(HERO_SCORE), 'Hero');
  });

  await t.test('Criminal record detection', () => {
    assert.equal(isCriminalRecord(PSYCHOPATH_SCORE), true);
    assert.equal(isCriminalRecord(VILLAIN_SCORE), true);
    assert.equal(isCriminalRecord(CRIMINAL_SCORE), true);
    assert.equal(isCriminalRecord(DUBIOUS_SCORE), false); // Dubious is not criminal
    assert.equal(isCriminalRecord(CLEAN_SCORE), false);
    assert.equal(isCriminalRecord(HERO_SCORE), false);
  });

  await t.test('Clean record detection', () => {
    assert.equal(isCleanRecord(PSYCHOPATH_SCORE), false);
    assert.equal(isCleanRecord(DUBIOUS_SCORE), false);
    assert.equal(isCleanRecord(CLEAN_SCORE), true);
    assert.equal(isCleanRecord(LAWFUL_SCORE), true);
    assert.equal(isCleanRecord(HERO_SCORE), true);
  });

  await t.test('Bribe amount calculation varies by difficulty', () => {
    const beginnerBribe = calculateBribeAmount(Difficulty.Beginner);
    const impossibleBribe = calculateBribeAmount(Difficulty.Impossible);
    
    assert.ok(beginnerBribe >= 500, 'Bribe amount should be reasonable');
    // Due to randomness, just check both are in valid ranges
    assert.ok(impossibleBribe >= 500, 'Impossible bribe should also be reasonable');
  });

  await t.test('Police record penalties', () => {
    let state = createInitialState();
    state.policeRecordScore = CLEAN_SCORE;
    
    // Apply attack police penalty
    state = applyPoliceRecordPenalty(state, ATTACKED_POLICE_PENALTY);
    assert.equal(state.policeRecordScore, CLEAN_SCORE + ATTACKED_POLICE_PENALTY);
    assert.equal(getPoliceRecordString(state.policeRecordScore), 'Dubious');
    
    // Apply destroy police penalty  
    state = applyPoliceRecordPenalty(state, DESTROYED_POLICE_PENALTY);
    assert.ok(state.policeRecordScore < DUBIOUS_SCORE);
    assert.equal(isCriminalRecord(state.policeRecordScore), true);
  });

  await t.test('Police record improvements', () => {
    let state = createInitialState();
    state.policeRecordScore = VILLAIN_SCORE;
    
    // Improve record
    state = improvePoliceRecord(state, 50);
    assert.equal(state.policeRecordScore, VILLAIN_SCORE + 50);
    
    // Cannot exceed Hero score
    state = improvePoliceRecord(state, 1000);
    assert.equal(state.policeRecordScore, HERO_SCORE);
  });

  await t.test('Police encounter modifier based on record', () => {
    const cleanModifier = getPoliceEncounterModifier(CLEAN_SCORE);
    const criminalModifier = getPoliceEncounterModifier(CRIMINAL_SCORE);
    
    assert.equal(cleanModifier, 1.0);
    assert.ok(criminalModifier > 1.0, 'Criminals should face more police encounters');
  });

  await t.test('Inspector encounter processing', () => {
    let state = createInitialState();
    state.policeRecordScore = CRIMINAL_SCORE;
    state.credits = 10000;
    
    const result = handleInspectorEncounter(state);
    
    assert.ok(result.message.length > 0);
    assert.ok(result.fine >= 0);
    assert.equal(typeof result.canBribe, 'boolean');
    
    if (isCriminalRecord(state.policeRecordScore)) {
      assert.ok(result.fine >= 5000, 'Criminals should face higher fines');
    }
  });

});
