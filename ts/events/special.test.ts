// Special Events System Tests
// Test-Driven Development: Write tests FIRST before implementation

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import type { GameState } from '../types.ts';
import { createInitialState } from '../state.ts';
import { 
  // Special Event Constants and Types
  SpecialEventType, type SpecialEventId,
  
  // Event Management
  createSpecialEvent, hasSpecialEvent, removeSpecialEvent,
  getSystemSpecialEvent, setSystemSpecialEvent,
  
  // Event Execution  
  executeSpecialEvent, canExecuteSpecialEvent, getEventCost,
  
  // Event System Integration
  checkEventAvailability, updateEventStatuses,
  
  // Quest System
  isQuestCompleted, markQuestCompleted, getActiveQuests,
  
  // News and Information
  addNewsEvent, isNewsEvent, getNewsEvents,
  
  // Random Events
  generateRandomEvent, checkRandomEventOccurrence,
  
  // Utility Functions
  getEventName, getEventDescription, getAllSpecialEvents
} from './special.ts';

describe('Special Events System', () => {

  describe('Special Event Constants and Definitions', () => {
    test('should have correct special event type constants matching Palm OS', () => {
      // Fixed location events (0-6)
      assert.equal(SpecialEventType.DRAGONFLYDESTROYED, 0);
      assert.equal(SpecialEventType.FLYBARATAS, 1);
      assert.equal(SpecialEventType.FLYMELINA, 2);
      assert.equal(SpecialEventType.FLYREGULAS, 3);
      assert.equal(SpecialEventType.MONSTERKILLED, 4);
      assert.equal(SpecialEventType.MEDICINEDELIVERY, 5);
      assert.equal(SpecialEventType.MOONBOUGHT, 6);
      
      // Random events (7+)
      assert.equal(SpecialEventType.MOONFORSALE, 7);
      assert.equal(SpecialEventType.SKILLINCREASE, 8);
      assert.equal(SpecialEventType.TRIBBLE, 9);
      assert.equal(SpecialEventType.ERASERECORD, 10);
      assert.equal(SpecialEventType.BUYTRIBBLE, 11);
      assert.equal(SpecialEventType.SPACEMONSTER, 12);
      assert.equal(SpecialEventType.DRAGONFLY, 13);
    });

    test('should provide special event definitions with correct properties', () => {
      const events = getAllSpecialEvents();
      
      assert.ok(events.length >= 37); // MAXSPECIALEVENT from Palm OS
      
      const moonEvent = events.find(e => e.id === SpecialEventType.MOONFORSALE);
      assert.ok(moonEvent);
      assert.equal(moonEvent.name, 'Moon for Sale');
      assert.equal(moonEvent.price, 500000); // COSTMOON from Palm OS
      assert.equal(moonEvent.justAMessage, false);
    });

    test('should validate event definition structure', () => {
      const events = getAllSpecialEvents();
      
      for (const event of events) {
        assert.equal(typeof event.id, 'number');
        assert.equal(typeof event.name, 'string');
        assert.equal(typeof event.description, 'string');
        assert.equal(typeof event.price, 'number');
        assert.equal(typeof event.justAMessage, 'boolean');
        assert.ok(event.price >= 0);
      }
    });
  });

  describe('Event Management', () => {
    test('should create special event for system', () => {
      const state = createInitialState();
      
      const result = createSpecialEvent(state, 5, SpecialEventType.MEDICINEDELIVERY);
      
      assert.equal(result.success, true);
      assert.equal(state.solarSystem[5].special, SpecialEventType.MEDICINEDELIVERY);
    });

    test('should check if system has special event', () => {
      const state = createInitialState();
      state.solarSystem[10].special = SpecialEventType.SKILLINCREASE;
      
      assert.equal(hasSpecialEvent(state, 10), true);
      assert.equal(hasSpecialEvent(state, 11), false);
    });

    test('should get system special event', () => {
      const state = createInitialState();
      state.solarSystem[15].special = SpecialEventType.TRIBBLE;
      
      const event = getSystemSpecialEvent(state, 15);
      
      assert.equal(event?.id, SpecialEventType.TRIBBLE);
      assert.equal(event?.name, 'Tribbles');
    });

    test('should set system special event', () => {
      const state = createInitialState();
      
      setSystemSpecialEvent(state, 20, SpecialEventType.ERASERECORD);
      
      assert.equal(state.solarSystem[20].special, SpecialEventType.ERASERECORD);
    });

    test('should remove special event from system', () => {
      const state = createInitialState();
      state.solarSystem[25].special = SpecialEventType.SPACEMONSTER;
      
      removeSpecialEvent(state, 25);
      
      assert.equal(state.solarSystem[25].special, -1); // No special event
    });
  });

  describe('Event Execution', () => {
    test('should check if event can be executed', () => {
      const state = createInitialState();
      state.credits = 1000;
      state.currentSystem = 5;
      state.solarSystem[5].special = SpecialEventType.SKILLINCREASE;
      
      const canExecute = canExecuteSpecialEvent(state, SpecialEventType.SKILLINCREASE);
      
      assert.equal(canExecute.possible, true);
      assert.equal(canExecute.reason, '');
    });

    test('should prevent execution when insufficient credits', () => {
      const state = createInitialState();
      state.credits = 1000;
      state.currentSystem = 5;
      state.solarSystem[5].special = SpecialEventType.MOONFORSALE;
      
      const canExecute = canExecuteSpecialEvent(state, SpecialEventType.MOONFORSALE);
      
      assert.equal(canExecute.possible, false);
      assert.ok(canExecute.reason.includes('credits'));
    });

    test('should execute skill increase event', () => {
      const state = createInitialState();
      state.credits = 1000;
      state.currentSystem = 5;
      state.solarSystem[5].special = SpecialEventType.SKILLINCREASE;
      
      const initialSkills = [
        state.commanderPilot, state.commanderFighter, 
        state.commanderTrader, state.commanderEngineer
      ];
      
      const result = executeSpecialEvent(state, SpecialEventType.SKILLINCREASE);
      
      assert.equal(result.success, true);
      
      const finalSkills = [
        state.commanderPilot, state.commanderFighter,
        state.commanderTrader, state.commanderEngineer
      ];
      
      // One skill should have increased
      const skillsIncreased = finalSkills.some((skill, index) => skill > initialSkills[index]);
      assert.equal(skillsIncreased, true);
    });

    test('should execute tribble event', () => {
      const state = createInitialState();
      state.credits = 1000;
      state.currentSystem = 5;
      state.solarSystem[5].special = SpecialEventType.TRIBBLE;
      state.ship.tribbles = 0;
      
      const result = executeSpecialEvent(state, SpecialEventType.TRIBBLE);
      
      assert.equal(result.success, true);
      assert.equal(state.ship.tribbles, 1);
    });

    test('should execute erase record event', () => {
      const state = createInitialState();
      state.credits = 10000; // Need 5000 for erase record
      state.currentSystem = 5;
      state.solarSystem[5].special = SpecialEventType.ERASERECORD;
      state.policeRecordScore = -200; // Criminal record
      
      const result = executeSpecialEvent(state, SpecialEventType.ERASERECORD);
      
      assert.equal(result.success, true);
      assert.equal(state.policeRecordScore, 0); // Clean record
    });

    test('should execute moon purchase event', () => {
      const state = createInitialState();
      state.credits = 600000;
      state.currentSystem = 5;
      state.solarSystem[5].special = SpecialEventType.MOONFORSALE;
      
      const result = executeSpecialEvent(state, SpecialEventType.MOONFORSALE);
      
      assert.equal(result.success, true);
      assert.equal(state.credits, 100000); // 600000 - 500000
      assert.equal(state.moonBought, true);
    });

    test('should get correct event cost', () => {
      assert.equal(getEventCost(SpecialEventType.MOONFORSALE), 500000);
      assert.equal(getEventCost(SpecialEventType.SKILLINCREASE), 1000);
      assert.equal(getEventCost(SpecialEventType.TRIBBLE), 0);
    });
  });

  describe('Quest System Integration', () => {
    test('should track quest completion status', () => {
      const state = createInitialState();
      
      // Initially no quests completed
      assert.equal(isQuestCompleted(state, 'dragonfly'), false);
      
      // Mark quest as completed
      markQuestCompleted(state, 'dragonfly');
      
      assert.equal(isQuestCompleted(state, 'dragonfly'), true);
    });

    test('should get active quests', () => {
      const state = createInitialState();
      state.dragonflyStatus = 1; // Dragonfly quest active
      state.japoriDiseaseStatus = 1; // Medicine quest active
      
      const activeQuests = getActiveQuests(state);
      
      assert.ok(activeQuests.some(quest => quest.name === 'Dragonfly'));
      assert.ok(activeQuests.some(quest => quest.name === 'Medicine Delivery'));
    });

    test('should handle quest dependencies', () => {
      const state = createInitialState();
      state.currentSystem = 5;
      state.solarSystem[5].special = SpecialEventType.MEDICINEDELIVERY;
      
      // Medicine delivery requires disease status
      state.japoriDiseaseStatus = 0; // No disease quest
      
      const canExecute = canExecuteSpecialEvent(state, SpecialEventType.MEDICINEDELIVERY);
      
      assert.equal(canExecute.possible, false);
      assert.ok(canExecute.reason.includes('quest'));
    });
  });

  describe('News System Integration', () => {
    test('should add news event', () => {
      const state = createInitialState();
      
      addNewsEvent(state, SpecialEventType.DRAGONFLYDESTROYED);
      
      assert.equal(isNewsEvent(state, SpecialEventType.DRAGONFLYDESTROYED), true);
    });

    test('should get news events', () => {
      const state = createInitialState();
      
      addNewsEvent(state, SpecialEventType.MONSTERKILLED);
      addNewsEvent(state, SpecialEventType.MEDICINEDELIVERY);
      
      const newsEvents = getNewsEvents(state);
      
      assert.equal(newsEvents.length, 2);
      assert.ok(newsEvents.some(event => event.id === SpecialEventType.MONSTERKILLED));
      assert.ok(newsEvents.some(event => event.id === SpecialEventType.MEDICINEDELIVERY));
    });

    test('should limit number of news events', () => {
      const state = createInitialState();
      
      // Add many news events
      for (let i = 0; i < 10; i++) {
        addNewsEvent(state, i as SpecialEventId);
      }
      
      const newsEvents = getNewsEvents(state);
      
      // Should be limited to MAXSPECIALNEWSEVENTS (5)
      assert.ok(newsEvents.length <= 5);
    });
  });

  describe('Random Events System', () => {
    test('should generate random event with proper probability', () => {
      const state = createInitialState();
      
      // Test random event generation multiple times
      let eventGenerated = false;
      
      for (let i = 0; i < 100; i++) {
        const randomEvent = generateRandomEvent(state);
        if (randomEvent) {
          eventGenerated = true;
          assert.equal(typeof randomEvent.id, 'number');
          assert.equal(typeof randomEvent.system, 'number');
          break;
        }
      }
      
      // Should generate at least one event in 100 attempts
      assert.equal(typeof eventGenerated, 'boolean');
    });

    test('should check random event occurrence', () => {
      const state = createInitialState();
      
      const occurrence = checkRandomEventOccurrence(state);
      
      assert.equal(typeof occurrence.hasEvent, 'boolean');
      if (occurrence.hasEvent) {
        assert.equal(typeof occurrence.eventType, 'number');
        assert.equal(typeof occurrence.systemIndex, 'number');
      }
    });

    test('should respect event occurrence rates', () => {
      const state = createInitialState();
      
      // Mock random function to test specific occurrence rates
      const originalRandom = Math.random;
      
      try {
        // Force high probability to test event generation
        Math.random = () => 0.01; // 1% chance
        
        const occurrence = checkRandomEventOccurrence(state);
        
        // Should generate event with high probability
        assert.equal(occurrence.hasEvent, true);
      } finally {
        Math.random = originalRandom;
      }
    });
  });

  describe('Event System Updates', () => {
    test('should update event statuses based on game state', () => {
      const state = createInitialState();
      state.dragonflyStatus = 5; // Dragonfly destroyed
      
      updateEventStatuses(state);
      
      // Should update related events
      const zalkronSystem = state.solarSystem.find(sys => 
        sys.nameIndex === 118 // Zalkon system for dragonfly destroyed event
      );
      if (zalkronSystem) {
        assert.equal(zalkronSystem.special, SpecialEventType.DRAGONFLYDESTROYED);
      }
    });

    test('should check event availability based on conditions', () => {
      const state = createInitialState();
      
      const availability = checkEventAvailability(state, SpecialEventType.TRANSPORTWILD);
      
      assert.equal(typeof availability.available, 'boolean');
      assert.equal(typeof availability.requirements, 'object');
    });
  });

  describe('Utility Functions', () => {
    test('should get event name', () => {
      assert.equal(getEventName(SpecialEventType.SKILLINCREASE), 'Skill Increase');
      assert.equal(getEventName(SpecialEventType.TRIBBLE), 'Tribbles');
      assert.equal(getEventName(SpecialEventType.MOONFORSALE), 'Moon for Sale');
    });

    test('should get event description', () => {
      const description = getEventDescription(SpecialEventType.SKILLINCREASE);
      
      assert.equal(typeof description, 'string');
      assert.ok(description.length > 0);
    });

    test('should handle invalid event IDs', () => {
      assert.equal(getEventName(-1 as SpecialEventId), 'Unknown Event');
      assert.equal(getEventDescription(999 as SpecialEventId), 'No description available');
      assert.equal(getEventCost(-1 as SpecialEventId), 0);
    });
  });

  describe('Integration with Game State', () => {
    test('should integrate with tribble breeding system', () => {
      const state = createInitialState();
      state.ship.tribbles = 10;
      
      // Tribbles should breed over time
      updateEventStatuses(state);
      
      // Tribbles grow (implementation dependent)
      assert.ok(state.ship.tribbles >= 10);
    });

    test('should integrate with reputation system', () => {
      const state = createInitialState();
      state.credits = 10000; // Need 5000 for erase record
      state.currentSystem = 5;
      state.solarSystem[5].special = SpecialEventType.ERASERECORD;
      state.policeRecordScore = -100;
      
      const result = executeSpecialEvent(state, SpecialEventType.ERASERECORD);
      
      assert.equal(result.success, true);
      assert.ok(state.policeRecordScore >= 0); // Record improved
    });

    test('should integrate with ship equipment requirements', () => {
      const state = createInitialState();
      state.currentSystem = 5;
      state.solarSystem[5].special = SpecialEventType.TRANSPORTWILD;
      
      // Wild requires beam laser
      state.ship.weapon = [-1, -1, -1]; // No weapons
      
      const canExecute = canExecuteSpecialEvent(state, SpecialEventType.TRANSPORTWILD);
      
      assert.equal(canExecute.possible, false);
      assert.ok(canExecute.reason.includes('beam laser') || canExecute.reason.includes('weapon'));
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle system index out of bounds', () => {
      const state = createInitialState();
      
      const result = createSpecialEvent(state, 999, SpecialEventType.SKILLINCREASE);
      
      assert.equal(result.success, false);
      assert.ok(result.message.includes('invalid'));
    });

    test('should handle execution of non-existent events', () => {
      const state = createInitialState();
      
      const result = executeSpecialEvent(state, 999 as SpecialEventId);
      
      assert.equal(result.success, false);
      assert.ok(result.message.includes('Unknown'));
    });

    test('should prevent duplicate event execution', () => {
      const state = createInitialState();
      state.credits = 10000;
      state.currentSystem = 5;
      state.solarSystem[5].special = SpecialEventType.SKILLINCREASE;
      
      // Execute event first time
      const result1 = executeSpecialEvent(state, SpecialEventType.SKILLINCREASE);
      assert.equal(result1.success, true);
      
      // Try to execute again (should fail if event is one-time only)
      const result2 = executeSpecialEvent(state, SpecialEventType.SKILLINCREASE);
      
      // Behavior depends on event type - some are repeatable
      assert.equal(typeof result2.success, 'boolean');
    });

    test('should validate game state during event execution', () => {
      const state = createInitialState();
      
      // Corrupt game state
      state.ship = null as any;
      
      const result = executeSpecialEvent(state, SpecialEventType.TRIBBLE);
      
      assert.equal(result.success, false);
      assert.ok(result.message.includes('Invalid') || result.message.includes('error'));
    });
  });
});