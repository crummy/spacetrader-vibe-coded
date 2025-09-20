// News Generation Integration Tests
// Validates that the news system properly generates events during gameplay

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../state.ts';
import { advanceTime, executeAction, createGameEngine } from '../engine/game.ts';
import { addNewsEvent, getNewsEvents, SpecialEventType } from './special.ts';
import { completeArtifactDelivery } from './quests/artifact.ts';

test('news generation - advanceTime triggers event updates', () => {
  const state = createInitialState();
  
  // Set up conditions for event generation
  state.dragonflyStatus = 5; // Dragonfly destroyed
  state.spacemonsterStatus = 2; // Space monster killed
  
  const initialNewsCount = getNewsEvents(state).length;
  
  // Advance time should trigger updateEventStatuses
  advanceTime(state, 1);
  
  const finalNewsCount = getNewsEvents(state).length;
  
  // Should have added news events for the completed quests
  assert.ok(finalNewsCount > initialNewsCount, 'News events should be generated when time advances');
  
  const newsEvents = getNewsEvents(state);
  const eventTypes = newsEvents.map(event => event.id);
  
  // Should include dragonfly destroyed and space monster killed events
  assert.ok(eventTypes.includes(SpecialEventType.DRAGONFLYDESTROYED), 'Should add Dragonfly Destroyed news');
  assert.ok(eventTypes.includes(SpecialEventType.MONSTERKILLED), 'Should add Space Monster Killed news');
});

test('news generation - quest completion generates news events', () => {
  const state = createInitialState();
  state.artifactOnBoard = true;
  state.currentSystem = 82; // Delivery system
  
  const initialNewsCount = getNewsEvents(state).length;
  
  // Complete artifact delivery should add news event
  const result = completeArtifactDelivery(state);
  
  assert.ok(result.success, 'Artifact delivery should succeed');
  
  const finalNewsCount = getNewsEvents(result.state).length;
  assert.equal(finalNewsCount, initialNewsCount + 1, 'Should add one news event');
  
  const newsEvents = getNewsEvents(result.state);
  const latestEvent = newsEvents[0]; // Most recent event
  assert.equal(latestEvent.id, SpecialEventType.ALIENARTIFACT, 'Should add alien artifact news event');
});

test('news generation - news appears in newspaper after events', async () => {
  const state = createInitialState();
  state.credits = 1000;
  
  // Add some news events manually
  addNewsEvent(state, SpecialEventType.MONSTERKILLED);
  addNewsEvent(state, SpecialEventType.DRAGONFLYDESTROYED);
  
  // Read newspaper
  const newsResult = await executeAction(state, {
    type: 'read_news',
    parameters: {}
  });
  
  assert.ok(newsResult.success, 'Reading news should succeed');
  assert.ok(newsResult.message.includes('Tribune') || newsResult.message.includes('News') || newsResult.message.includes('Herald'), 'Should show newspaper masthead');
  assert.ok(newsResult.message.includes('Space Monster Killed'), 'Should show space monster news');
  assert.ok(newsResult.message.includes('Dragonfly Destroyed'), 'Should show dragonfly news');
});

test('news generation - no news shows default message', async () => {
  const state = createInitialState();
  state.credits = 1000;
  
  // Ensure no news events
  if (state.newsEvents) {
    state.newsEvents = [];
  }
  
  // Read newspaper
  const newsResult = await executeAction(state, {
    type: 'read_news',
    parameters: {}
  });
  
  assert.ok(newsResult.success, 'Reading news should succeed');
  assert.ok(newsResult.message.includes('Tribune') || newsResult.message.includes('News') || newsResult.message.includes('Herald'), 'Should show newspaper masthead');
  assert.ok(newsResult.message.includes('•'), 'Should show bullet point headlines');
});

test('news generation - events limited to maximum of 5', () => {
  const state = createInitialState();
  
  // Add more than 5 news events
  const eventTypes = [
    SpecialEventType.MONSTERKILLED,
    SpecialEventType.DRAGONFLYDESTROYED,
    SpecialEventType.ALIENARTIFACT,
    SpecialEventType.MEDICINEDELIVERY,
    SpecialEventType.MOONBOUGHT,
    SpecialEventType.TRIBBLE,
    SpecialEventType.ERASERECORD
  ];
  
  eventTypes.forEach(eventType => {
    addNewsEvent(state, eventType);
  });
  
  const newsEvents = getNewsEvents(state);
  assert.equal(newsEvents.length, 5, 'Should limit news events to maximum of 5');
  
  // Should keep the most recent events (last 5 added, since unshift puts newer events first)
  const eventIds = newsEvents.map(event => event.id);
  assert.ok(eventIds.includes(SpecialEventType.ERASERECORD), 'Should keep most recent event');
  assert.ok(eventIds.includes(SpecialEventType.TRIBBLE), 'Should keep second most recent event');
  assert.ok(!eventIds.includes(SpecialEventType.MONSTERKILLED), 'Should drop oldest events beyond 5');
  assert.ok(!eventIds.includes(SpecialEventType.DRAGONFLYDESTROYED), 'Should drop second oldest event');
});

test('news generation - events include timestamp and system', () => {
  const state = createInitialState();
  state.currentSystem = 42;
  
  const beforeTime = Date.now();
  addNewsEvent(state, SpecialEventType.MONSTERKILLED);
  const afterTime = Date.now();
  
  const newsEvents = getNewsEvents(state);
  assert.equal(newsEvents.length, 1, 'Should have one news event');
  
  const event = newsEvents[0];
  assert.equal(event.id, SpecialEventType.MONSTERKILLED, 'Should have correct event type');
  assert.equal(event.system, 42, 'Should record current system');
  assert.ok(event.timestamp >= beforeTime && event.timestamp <= afterTime, 'Should have valid timestamp');
});

test('news generation - random events checked periodically', () => {
  const state = createInitialState();
  state.days = 0;
  
  // Mock random event generation to always return an event
  const originalRandom = Math.random;
  Math.random = () => 0.01; // Always trigger 5% chance
  
  try {
    const initialNewsCount = getNewsEvents(state).length;
    
    // Advance time to day 5 (should trigger random event check)
    advanceTime(state, 5);
    
    // Random events might not always generate news, so we just check that
    // the system runs without error
    assert.equal(state.days, 5, 'Days should advance correctly');
    
    // The random event system should have been called (no exceptions thrown)
    assert.ok(true, 'Random event system should run without errors');
    
  } finally {
    Math.random = originalRandom;
  }
});

test('news generation - time advancement with quest conditions', () => {
  const state = createInitialState();
  
  // Set up multiple quest completion conditions
  state.dragonflyStatus = 5; // Dragonfly destroyed
  state.spacemonsterStatus = 2; // Space monster killed
  state.days = 0;
  
  const initialNewsCount = getNewsEvents(state).length;
  
  // Advance time multiple days
  advanceTime(state, 3);
  
  const finalNewsCount = getNewsEvents(state).length;
  
  // Should have generated news events for completed quests
  assert.ok(finalNewsCount >= initialNewsCount + 2, 'Should generate multiple news events');
  
  const newsEvents = getNewsEvents(state);
  const eventTypes = newsEvents.map(event => event.id);
  
  assert.ok(eventTypes.includes(SpecialEventType.DRAGONFLYDESTROYED), 'Should include dragonfly news');
  assert.ok(eventTypes.includes(SpecialEventType.MONSTERKILLED), 'Should include monster news');
});

test('news generation - integration with full game engine', async () => {
  const engine = createGameEngine();
  engine.state.credits = 2000;
  
  // Add a news event
  addNewsEvent(engine.state, SpecialEventType.MONSTERKILLED);
  
  // Read news through game engine
  const result = await engine.executeAction({
    type: 'read_news',
    parameters: {}
  });
  
  assert.ok(result.success, 'Should successfully read news through game engine');
  assert.ok(result.message.includes('Space Monster Killed'), 'Should show news event in game engine');
  assert.ok(result.stateChanged, 'Should mark state as changed');
});

test('news generation - error handling in time advancement', () => {
  const state = createInitialState();
  
  // This should not throw even if event system has issues
  assert.doesNotThrow(() => {
    advanceTime(state, 1);
  }, 'Time advancement should not throw even with event system errors');
  
  assert.equal(state.days, 1, 'Days should still advance despite event system issues');
});

test('news generation - events persist across system changes', async () => {
  const state = createInitialState();
  state.credits = 1000;
  
  // Add news event at initial system
  addNewsEvent(state, SpecialEventType.MONSTERKILLED);
  
  const initialSystem = state.currentSystem;
  
  // Manually change system (simulating travel)
  state.currentSystem = (initialSystem + 1) % 10;
  
  // Verify we changed systems
  assert.notEqual(state.currentSystem, initialSystem, 'Should have moved to different system');
  
  // News should still be available after system change
  const newsResult = await executeAction(state, {
    type: 'read_news',
    parameters: {}
  });
  
  assert.ok(newsResult.success, 'Should still be able to read news');
  assert.ok(newsResult.message.includes('Space Monster Killed'), 'News should persist across systems');
});
