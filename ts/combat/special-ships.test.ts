// Special Ship Encounters Tests

import { describe, test } from 'node:test';
import assert from 'node:assert';
import { createInitialState } from '../state.ts';
import { GameMode } from '../types.ts';
import { 
  boardMarieCeleste,
  drinkBottle,
  handleSpaceMonsterEncounter,
  handleDragonflyEncounter,
  handleScarabEncounter,
  handleScarabDestroyed,
  handleMarieEncounter,
  isVeryRareEncounter,
  getSpecialShipName,
  hasEncounteredBefore,
  markEncounterCompleted,
  SPACEMONSTERATTACK,
  DRAGONFLYATTACK,
  SCARABATTACK,
  MARIECELESTEENCOUNTER
} from './special-ships.ts';
import { EncounterType } from './engine.ts';

describe('Special Ship Encounters', () => {
  
  test('Marie Celeste boarding - successful with cargo space', () => {
    const state = createInitialState();
    state.ship.cargo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Empty cargo
    
    const result = boardMarieCeleste(state);
    
    assert.equal(result.success, true);
    assert.match(result.message, /Marie Celeste.*bottle/i);
    assert.equal(result.state.justLootedMarie, true);
    assert.equal(result.state.ship.cargo[9], 1); // Bottle added
  });
  
  test('Marie Celeste boarding - fails when cargo full', () => {
    const state = createInitialState();
    state.ship.cargo = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2]; // Full cargo (20 items)
    
    const result = boardMarieCeleste(state);
    
    assert.equal(result.success, false);
    assert.match(result.message, /cargo.*full.*bottle/i);
    assert.equal(result.state.justLootedMarie, false); // Should remain false when boarding fails
  });
  
  test('Bottle drinking - success with bottle available', () => {
    const state = createInitialState();
    state.justLootedMarie = true;
    state.ship.cargo[9] = 1; // Has bottle
    state.ship.hull = 50;
    
    const result = drinkBottle(state);
    
    assert.equal(result.success, true);
    assert.match(result.message, /bottle/i);
    assert.equal(result.state.ship.cargo[9], 0); // Bottle consumed
    assert.notEqual(result.state.ship.hull, 50); // Hull changed
  });
  
  test('Bottle drinking - fails without bottle', () => {
    const state = createInitialState();
    state.justLootedMarie = false;
    state.ship.cargo[9] = 0; // No bottle
    
    const result = drinkBottle(state);
    
    assert.equal(result.success, false);
    assert.match(result.message, /not have.*bottle/i);
  });
  
  test('Space Monster encounter setup', () => {
    const state = createInitialState();
    
    const result = handleSpaceMonsterEncounter(state);
    
    assert.equal(result.state.encounterType, SPACEMONSTERATTACK);
    assert.equal(result.state.currentMode, GameMode.InCombat);
    assert.match(result.message, /space monster.*attack/i);
  });
  
  test('Dragonfly encounter setup', () => {
    const state = createInitialState();
    
    const result = handleDragonflyEncounter(state);
    
    assert.equal(result.state.encounterType, DRAGONFLYATTACK);
    assert.equal(result.state.currentMode, GameMode.InCombat);
    assert.match(result.message, /dragonfly.*cargo/i);
  });
  
  test('Scarab encounter setup', () => {
    const state = createInitialState();
    
    const result = handleScarabEncounter(state);
    
    assert.equal(result.state.encounterType, SCARABATTACK);
    assert.equal(result.state.currentMode, GameMode.InCombat);
    assert.match(result.message, /scarab.*attack/i);
  });
  
  test('Scarab destruction rewards - first time', () => {
    const state = createInitialState();
    state.scarabStatus = 0; // Not yet destroyed
    state.ship.hull = 50;
    
    const result = handleScarabDestroyed(state);
    
    assert.equal(result.state.scarabStatus, 2); // SCARABDESTROYED
    assert.equal(result.state.ship.hull, 100); // +50 hull bonus (UPGRADEDHULL from Palm OS)
    assert.equal(result.state.ship.hullUpgrades, 1);
    assert.match(result.message, /scarab.*hull.*plating|hull.*upgrade/i);
  });
  
  test('Scarab destruction rewards - already acquired', () => {
    const state = createInitialState();
    state.scarabStatus = 2; // Already destroyed Scarab
    state.ship.hull = 50;
    
    const result = handleScarabDestroyed(state);
    
    assert.equal(result.state.scarabStatus, 2);
    assert.equal(result.state.ship.hull, 50); // No additional bonus
    assert.match(result.message, /already.*upgrade/i);
  });
  
  test('Marie encounter setup', () => {
    const state = createInitialState();
    
    const result = handleMarieEncounter(state);
    
    assert.equal(result.state.encounterType, MARIECELESTEENCOUNTER);
    assert.equal(result.state.currentMode, GameMode.InCombat);
    assert.match(result.message, /marie celeste.*derelict|derelict.*marie/i);
  });
  
  test('Very rare encounter identification', () => {
    assert.equal(isVeryRareEncounter(MARIECELESTEENCOUNTER), true);
    assert.equal(isVeryRareEncounter(EncounterType.CAPTAINAHABENCOUNTER), true);
    assert.equal(isVeryRareEncounter(EncounterType.CAPTAINCONRADENCOUNTER), true);
    assert.equal(isVeryRareEncounter(EncounterType.CAPTAINHUIEENCOUNTER), true);
    assert.equal(isVeryRareEncounter(SPACEMONSTERATTACK), false);
    assert.equal(isVeryRareEncounter(DRAGONFLYATTACK), false);
  });
  
  test('Special ship names', () => {
    assert.equal(getSpecialShipName(SPACEMONSTERATTACK), 'Space Monster');
    assert.equal(getSpecialShipName(DRAGONFLYATTACK), 'Dragonfly');
    assert.equal(getSpecialShipName(SCARABATTACK), 'Scarab');
    assert.equal(getSpecialShipName(MARIECELESTEENCOUNTER), 'Marie Celeste');
    assert.equal(getSpecialShipName(EncounterType.CAPTAINAHABENCOUNTER), 'Captain Ahab');
  });
  
  test('Very rare encounter tracking - not encountered before', () => {
    const state = createInitialState();
    state.veryRareEncounter = 0; // No encounters yet
    
    assert.equal(hasEncounteredBefore(state, MARIECELESTEENCOUNTER), false);
    assert.equal(hasEncounteredBefore(state, EncounterType.CAPTAINAHABENCOUNTER), false);
    assert.equal(hasEncounteredBefore(state, EncounterType.CAPTAINCONRADENCOUNTER), false);
    assert.equal(hasEncounteredBefore(state, EncounterType.CAPTAINHUIEENCOUNTER), false);
  });
  
  test('Very rare encounter tracking - mark as completed', () => {
    const state = createInitialState();
    state.veryRareEncounter = 0; // No encounters yet
    
    const newState = markEncounterCompleted(state, MARIECELESTEENCOUNTER);
    assert.equal(hasEncounteredBefore(newState, MARIECELESTEENCOUNTER), true);
    assert.equal(hasEncounteredBefore(newState, EncounterType.CAPTAINAHABENCOUNTER), false);
  });
  
  test('Very rare encounter tracking - multiple encounters', () => {
    const state = createInitialState();
    state.veryRareEncounter = 0;
    
    let newState = markEncounterCompleted(state, MARIECELESTEENCOUNTER);
    newState = markEncounterCompleted(newState, EncounterType.CAPTAINAHABENCOUNTER);
    newState = markEncounterCompleted(newState, EncounterType.CAPTAINCONRADENCOUNTER);
    
    assert.equal(hasEncounteredBefore(newState, MARIECELESTEENCOUNTER), true);
    assert.equal(hasEncounteredBefore(newState, EncounterType.CAPTAINAHABENCOUNTER), true);
    assert.equal(hasEncounteredBefore(newState, EncounterType.CAPTAINCONRADENCOUNTER), true);
    assert.equal(hasEncounteredBefore(newState, EncounterType.CAPTAINHUIEENCOUNTER), false);
  });
  
  test('Complete Marie Celeste workflow - board and drink', () => {
    const state = createInitialState();
    state.ship.cargo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Empty cargo
    state.ship.hull = 50;
    
    // First board the ship
    const boardResult = boardMarieCeleste(state);
    assert.equal(boardResult.success, true);
    
    // Then drink the bottle
    const drinkResult = drinkBottle(boardResult.state);
    assert.equal(drinkResult.success, true);
    assert.equal(drinkResult.state.justLootedMarie, false); // Bottle consumed
    assert.equal(drinkResult.state.ship.cargo[9], 0); // Bottle removed
    assert.notEqual(drinkResult.state.ship.hull, 50); // Hull changed
  });
  
  test('Special ship encounters all set correct combat mode', () => {
    const state = createInitialState();
    
    const monsterResult = handleSpaceMonsterEncounter(state);
    assert.equal(monsterResult.state.currentMode, GameMode.InCombat);
    
    const dragonflyResult = handleDragonflyEncounter(state);
    assert.equal(dragonflyResult.state.currentMode, GameMode.InCombat);
    
    const scarabResult = handleScarabEncounter(state);
    assert.equal(scarabResult.state.currentMode, GameMode.InCombat);
    
    const marieResult = handleMarieEncounter(state);
    assert.equal(marieResult.state.currentMode, GameMode.InCombat);
  });
  
  test('Scarab hull upgrade - multiple destructions only grant one upgrade', () => {
    const state = createInitialState();
    state.ship.hull = 60;
    
    // First destruction
    const firstResult = handleScarabDestroyed(state);
    assert.equal(firstResult.state.scarabStatus, 2); // SCARABDESTROYED
    assert.equal(firstResult.state.ship.hull, 110); // 60 + 50 (UPGRADEDHULL)
    assert.equal(firstResult.state.ship.hullUpgrades, 1);
    
    // Second destruction (should not grant additional upgrade)
    const secondResult = handleScarabDestroyed(firstResult.state);
    assert.equal(secondResult.state.scarabStatus, 2);
    assert.equal(secondResult.state.ship.hull, 110); // No additional bonus
    assert.match(secondResult.message, /already.*upgrade/i);
  });
});
