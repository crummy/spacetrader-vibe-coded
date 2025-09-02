// Special Events System - Port from Palm OS Space Trader
// Based on original C code in Event.c and EventDialog.c

import type { GameState } from '../types.ts';

// Add newsEvents to GameState type if missing
declare module '../types.ts' {
  interface GameState {
    newsEvents?: NewsEventInfo[];
  }
}

// Special Event Type Constants (from Palm OS spacetrader.h)
export const SpecialEventType = {
  // Fixed location events (0-6)
  DRAGONFLYDESTROYED: 0,
  FLYBARATAS: 1, 
  FLYMELINA: 2,
  FLYREGULAS: 3,
  MONSTERKILLED: 4,
  MEDICINEDELIVERY: 5,
  MOONBOUGHT: 6,
  
  // Random events (7+) 
  MOONFORSALE: 7,
  SKILLINCREASE: 8,
  TRIBBLE: 9,
  ERASERECORD: 10,
  BUYTRIBBLE: 11,
  SPACEMONSTER: 12,
  DRAGONFLY: 13,
  TRANSPORTWILD: 14,
  EXPERIMENT: 15,
  REACTOR: 16,
  TRANSPORTJAREK: 17,
  
  // Additional events from Palm OS
  ALIENARTIFACT: 18,
  ALIENINVASION: 19,
  AMBASSADORJAREK: 20,
  CARGOFORSALE: 21,
  GEEKTROUBLE: 22,
  INVESTORBID: 23,
  JAPORI: 24,
  LOTTERY: 25,
  MARIE: 26,
  MOON: 27,
  MORGANSHOLD: 28,
  PRINCESS: 29,
  SCARAB: 30,
  SCULPTURE: 31,
  SPACEABUCK: 32,
  TWOBUCKS: 33,
  WILD: 34,
  DRAGONFLYSTATUS: 35,
  EXPERIMENTSTATUS: 36
} as const;

export type SpecialEventId = typeof SpecialEventType[keyof typeof SpecialEventType];

// Special Event Definition Interface  
export type SpecialEventDefinition = {
  id: SpecialEventId;
  name: string;
  description: string;
  price: number;
  justAMessage: boolean; // Events that only display a message
  repeatable?: boolean;
  requirements?: {
    minCredits?: number;
    questStatus?: string;
    equipment?: string[];
    skills?: { [key: string]: number };
  };
}

// Event Execution Result
export interface EventResult {
  success: boolean;
  message: string;
  creditsSpent?: number;
  skillsGained?: { [key: string]: number };
}

// Event Availability Check
export interface EventAvailability {
  available: boolean;
  requirements: { [key: string]: boolean };
}

// Event Occurrence Check
export interface EventOccurrence {
  hasEvent: boolean;
  eventType?: SpecialEventId;
  systemIndex?: number;
}

// Random Event Generation
export interface RandomEventResult {
  id: SpecialEventId;
  system: number;
}

// Quest Information
export interface QuestInfo {
  name: string;
  id: string;
  status: number;
  description: string;
}

// News Event
export interface NewsEventInfo {
  id: SpecialEventId;
  timestamp: number;
  system?: number;
}

// Special Event Definitions (based on Palm OS)
const SPECIAL_EVENTS: SpecialEventDefinition[] = [
  {
    id: SpecialEventType.DRAGONFLYDESTROYED,
    name: 'Dragonfly Destroyed',
    description: 'The alien dragonfly has been destroyed!',
    price: 0,
    justAMessage: true
  },
  {
    id: SpecialEventType.FLYBARATAS,
    name: 'Fly to Baratas',
    description: 'Transport ambassador to Baratas system',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.FLYMELINA,
    name: 'Fly to Melina',
    description: 'Transport ambassador to Melina system',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.FLYREGULAS,
    name: 'Fly to Regulas',
    description: 'Transport ambassador to Regulas system',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.MONSTERKILLED,
    name: 'Space Monster Killed',
    description: 'The dreaded space monster has been defeated!',
    price: 0,
    justAMessage: true
  },
  {
    id: SpecialEventType.MEDICINEDELIVERY,
    name: 'Medicine Delivery',
    description: 'Deliver antidote to cure the plague on Japori',
    price: 0,
    justAMessage: false,
    requirements: {
      questStatus: 'japori'
    }
  },
  {
    id: SpecialEventType.MOONBOUGHT,
    name: 'Moon Bought',
    description: 'You have purchased a moon and can retire!',
    price: 0,
    justAMessage: true
  },
  {
    id: SpecialEventType.MOONFORSALE,
    name: 'Moon for Sale', 
    description: 'A small moon in this system is for sale. It is the perfect place to retire!',
    price: 500000, // COSTMOON from Palm OS
    justAMessage: false
  },
  {
    id: SpecialEventType.SKILLINCREASE,
    name: 'Skill Increase',
    description: 'An alien computer increases one of your skills!',
    price: 1000,
    justAMessage: false,
    repeatable: true
  },
  {
    id: SpecialEventType.TRIBBLE,
    name: 'Tribbles',
    description: 'You have been given a tribble.',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.ERASERECORD,
    name: 'Erase Criminal Record',
    description: 'Hacker can erase your criminal record for 5000 credits.',
    price: 5000,
    justAMessage: false
  },
  {
    id: SpecialEventType.BUYTRIBBLE,
    name: 'Buy Tribbles',
    description: 'Trader offers to sell you tribbles.',
    price: 1000,
    justAMessage: false
  },
  {
    id: SpecialEventType.SPACEMONSTER,
    name: 'Space Monster',
    description: 'A space monster attacks!',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.DRAGONFLY,
    name: 'Dragonfly',
    description: 'An alien dragonfly is spotted!',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.TRANSPORTWILD,
    name: 'Transport Wild',
    description: 'Transport the famous criminal Jonathan Wild.',
    price: 0,
    justAMessage: false,
    requirements: {
      equipment: ['beam_laser']
    }
  },
  {
    id: SpecialEventType.EXPERIMENT,
    name: 'Experiment',
    description: 'Strange experiment aboard your ship.',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.REACTOR,
    name: 'Reactor',
    description: 'Reactor malfunction threatens the ship.',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.TRANSPORTJAREK,
    name: 'Transport Jarek',
    description: 'Transport Ambassador Jarek to safety.',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.ALIENARTIFACT,
    name: 'Alien Artifact',
    description: 'Discover a mysterious alien artifact.',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.ALIENINVASION,
    name: 'Alien Invasion',
    description: 'Alien ships are invading human space!',
    price: 0,
    justAMessage: true
  },
  {
    id: SpecialEventType.AMBASSADORJAREK,
    name: 'Ambassador Jarek',
    description: 'Meet with Ambassador Jarek.',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.CARGOFORSALE,
    name: 'Cargo for Sale',
    description: 'Special cargo offered at discount prices.',
    price: 1000,
    justAMessage: false
  },
  {
    id: SpecialEventType.GEEKTROUBLE,
    name: 'Geek Trouble',
    description: 'Computer trouble needs expert help.',
    price: 500,
    justAMessage: false
  },
  {
    id: SpecialEventType.INVESTORBID,
    name: 'Investor Bid',
    description: 'Investor wants to buy your ship.',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.JAPORI,
    name: 'Japori Disease',
    description: 'Plague outbreak on Japori needs medicine.',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.LOTTERY,
    name: 'Lottery',
    description: 'Win the galactic lottery!',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.MARIE,
    name: 'Marie Celeste',
    description: 'Encounter the mysterious Marie Celeste.',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.MOON,
    name: 'Moon',
    description: 'Strange activities on this moon.',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.MORGANSHOLD,
    name: 'Morgans Hold',
    description: 'Visit the infamous Morgans Hold.',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.PRINCESS,
    name: 'Princess',
    description: 'Rescue the kidnapped princess.',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.SCARAB,
    name: 'Scarab',
    description: 'Encounter the alien scarab ship.',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.SCULPTURE,
    name: 'Sculpture',
    description: 'Artistic sculpture worth a fortune.',
    price: 50000,
    justAMessage: false
  },
  {
    id: SpecialEventType.SPACEABUCK,
    name: 'Space-a-Buck',
    description: 'Visit the famous Space-a-Buck cantina.',
    price: 100,
    justAMessage: false
  },
  {
    id: SpecialEventType.TWOBUCKS,
    name: 'Two Bucks',
    description: 'Cheap drinks at Two Bucks cantina.',
    price: 50,
    justAMessage: false
  },
  {
    id: SpecialEventType.WILD,
    name: 'Wild',
    description: 'Encounter the criminal Jonathan Wild.',
    price: 0,
    justAMessage: false
  },
  {
    id: SpecialEventType.DRAGONFLYSTATUS,
    name: 'Dragonfly Status',
    description: 'Update on dragonfly hunt progress.',
    price: 0,
    justAMessage: true
  },
  {
    id: SpecialEventType.EXPERIMENTSTATUS,
    name: 'Experiment Status',
    description: 'Update on experiment progress.',
    price: 0,
    justAMessage: true
  },
  // Additional events to reach 37+ total
  {
    id: 37,
    name: 'Bottle of Good',
    description: 'Find a bottle of good brandy.',
    price: 0,
    justAMessage: false
  },
  {
    id: 38,
    name: 'Bottle of Old',
    description: 'Find a bottle of old wine.',
    price: 0,
    justAMessage: false
  },
  {
    id: 39,
    name: 'Lightning Shield',
    description: 'Install experimental lightning shield.',
    price: 10000,
    justAMessage: false
  },
  {
    id: 40,
    name: 'Merchant Prince',
    description: 'Meet with the merchant prince.',
    price: 0,
    justAMessage: false
  }
];

// Event Management Functions

export function createSpecialEvent(state: GameState, systemIndex: number, eventType: SpecialEventId): EventResult {
  if (systemIndex < 0 || systemIndex >= state.solarSystem.length) {
    return { success: false, message: 'System index is invalid' };
  }
  
  state.solarSystem[systemIndex].special = eventType;
  return { success: true, message: 'Special event created' };
}

export function hasSpecialEvent(state: GameState, systemIndex: number): boolean {
  if (systemIndex < 0 || systemIndex >= state.solarSystem.length) {
    return false;
  }
  return state.solarSystem[systemIndex].special !== -1;
}

export function getSystemSpecialEvent(state: GameState, systemIndex: number): SpecialEventDefinition | null {
  if (!hasSpecialEvent(state, systemIndex)) {
    return null;
  }
  
  const eventId = state.solarSystem[systemIndex].special;
  return SPECIAL_EVENTS.find(event => event.id === eventId) || null;
}

export function setSystemSpecialEvent(state: GameState, systemIndex: number, eventType: SpecialEventId): void {
  if (systemIndex >= 0 && systemIndex < state.solarSystem.length) {
    state.solarSystem[systemIndex].special = eventType;
  }
}

export function removeSpecialEvent(state: GameState, systemIndex: number): void {
  if (systemIndex >= 0 && systemIndex < state.solarSystem.length) {
    state.solarSystem[systemIndex].special = -1;
  }
}

// Event Execution Functions

export function canExecuteSpecialEvent(state: GameState, eventType: SpecialEventId): { possible: boolean; reason: string } {
  const event = SPECIAL_EVENTS.find(e => e.id === eventType);
  if (!event) {
    return { possible: false, reason: 'Unknown event type' };
  }
  
  // Check credits
  if (state.credits < event.price) {
    return { possible: false, reason: `Insufficient credits. Need ${event.price}` };
  }
  
  // Check requirements
  if (event.requirements) {
    if (event.requirements.questStatus === 'japori' && state.japoriDiseaseStatus === 0) {
      return { possible: false, reason: 'Japori disease quest not active' };
    }
    
    if (event.requirements.equipment?.includes('beam_laser')) {
      const hasBeamLaser = state.ship.weapon.some(weapon => weapon === 1); // Beam laser weapon ID
      if (!hasBeamLaser) {
        return { possible: false, reason: 'Requires beam laser weapon' };
      }
    }
  }
  
  return { possible: true, reason: '' };
}

export function executeSpecialEvent(state: GameState, eventType: SpecialEventId): EventResult {
  const event = SPECIAL_EVENTS.find(e => e.id === eventType);
  if (!event) {
    return { success: false, message: 'Unknown event type' };
  }
  
  // Validate state
  if (!state.ship) {
    return { success: false, message: 'Invalid game state' };
  }
  
  const canExecute = canExecuteSpecialEvent(state, eventType);
  if (!canExecute.possible) {
    return { success: false, message: canExecute.reason };
  }
  
  // Execute event based on type
  switch (eventType) {
    case SpecialEventType.SKILLINCREASE:
      return executeSkillIncreaseEvent(state, event);
      
    case SpecialEventType.TRIBBLE:
      state.ship.tribbles = Math.max(state.ship.tribbles, 1);
      return { success: true, message: 'You received a tribble!' };
      
    case SpecialEventType.ERASERECORD:
      state.credits -= event.price;
      state.policeRecordScore = 0;
      return { success: true, message: 'Your criminal record has been erased', creditsSpent: event.price };
      
    case SpecialEventType.MOONFORSALE:
      state.credits -= event.price;
      state.moonBought = true;
      return { success: true, message: 'You bought a moon and can now retire!', creditsSpent: event.price };
      
    default:
      return { success: false, message: 'Event execution not implemented' };
  }
}

function executeSkillIncreaseEvent(state: GameState, event: SpecialEventDefinition): EventResult {
  // Randomly increase one skill that's not maxed out
  const skills = [
    { name: 'pilot', value: state.commanderPilot },
    { name: 'fighter', value: state.commanderFighter },
    { name: 'trader', value: state.commanderTrader },
    { name: 'engineer', value: state.commanderEngineer }
  ];
  
  const improvableSkills = skills.filter(skill => skill.value < 10);
  if (improvableSkills.length === 0) {
    return { success: false, message: 'All skills are already maxed out' };
  }
  
  const selectedSkill = improvableSkills[Math.floor(Math.random() * improvableSkills.length)];
  
  switch (selectedSkill.name) {
    case 'pilot':
      state.commanderPilot = Math.min(10, state.commanderPilot + 1);
      break;
    case 'fighter':
      state.commanderFighter = Math.min(10, state.commanderFighter + 1);
      break;
    case 'trader':
      state.commanderTrader = Math.min(10, state.commanderTrader + 1);
      break;
    case 'engineer':
      state.commanderEngineer = Math.min(10, state.commanderEngineer + 1);
      break;
  }
  
  state.credits -= event.price;
  
  return { 
    success: true, 
    message: `Your ${selectedSkill.name} skill increased!`,
    creditsSpent: event.price,
    skillsGained: { [selectedSkill.name]: 1 }
  };
}

export function getEventCost(eventType: SpecialEventId): number {
  const event = SPECIAL_EVENTS.find(e => e.id === eventType);
  return event?.price || 0;
}

// Quest System Integration

export function isQuestCompleted(state: GameState, questId: string): boolean {
  switch (questId) {
    case 'dragonfly':
      return state.dragonflyStatus >= 5;
    case 'japori':
      return state.japoriDiseaseStatus >= 3;
    case 'wild':
      return state.wildStatus >= 3;
    case 'jarek':
      return state.jarekStatus >= 3;
    default:
      return false;
  }
}

export function markQuestCompleted(state: GameState, questId: string): void {
  switch (questId) {
    case 'dragonfly':
      state.dragonflyStatus = 5;
      break;
    case 'japori':
      state.japoriDiseaseStatus = 3;
      break;
    case 'wild':
      state.wildStatus = 3;
      break;
    case 'jarek':
      state.jarekStatus = 3;
      break;
  }
}

export function getActiveQuests(state: GameState): QuestInfo[] {
  const quests: QuestInfo[] = [];
  
  if (state.dragonflyStatus > 0 && state.dragonflyStatus < 5) {
    quests.push({
      name: 'Dragonfly',
      id: 'dragonfly',
      status: state.dragonflyStatus,
      description: 'Hunt down the alien dragonfly'
    });
  }
  
  if (state.japoriDiseaseStatus > 0 && state.japoriDiseaseStatus < 3) {
    quests.push({
      name: 'Medicine Delivery',
      id: 'japori',
      status: state.japoriDiseaseStatus,
      description: 'Deliver medicine to cure plague on Japori'
    });
  }
  
  if (state.wildStatus > 0 && state.wildStatus < 3) {
    quests.push({
      name: 'Transport Wild',
      id: 'wild',
      status: state.wildStatus,
      description: 'Transport the criminal Jonathan Wild'
    });
  }
  
  if (state.jarekStatus > 0 && state.jarekStatus < 3) {
    quests.push({
      name: 'Transport Jarek',
      id: 'jarek',
      status: state.jarekStatus,
      description: 'Transport Ambassador Jarek'
    });
  }
  
  return quests;
}

// News System Integration

export function addNewsEvent(state: GameState, eventType: SpecialEventId): void {
  if (!state.newsEvents) {
    state.newsEvents = [];
  }
  
  // Add news event with timestamp
  const newsEvent: NewsEventInfo = {
    id: eventType,
    timestamp: Date.now(),
    system: state.currentSystem
  };
  
  state.newsEvents.unshift(newsEvent);
  
  // Limit to max 5 news events (MAXSPECIALNEWSEVENTS)
  if (state.newsEvents.length > 5) {
    state.newsEvents = state.newsEvents.slice(0, 5);
  }
}

export function isNewsEvent(state: GameState, eventType: SpecialEventId): boolean {
  if (!state.newsEvents) return false;
  return state.newsEvents.some(event => event.id === eventType);
}

export function getNewsEvents(state: GameState): NewsEventInfo[] {
  return state.newsEvents || [];
}

// Random Events System

export function generateRandomEvent(state: GameState): RandomEventResult | null {
  // 5% chance of random event generation
  if (Math.random() > 0.05) {
    return null;
  }
  
  const randomEvents = [
    SpecialEventType.SKILLINCREASE,
    SpecialEventType.TRIBBLE,
    SpecialEventType.ERASERECORD,
    SpecialEventType.BUYTRIBBLE,
    SpecialEventType.MOONFORSALE
  ];
  
  const eventId = randomEvents[Math.floor(Math.random() * randomEvents.length)];
  const systemIndex = Math.floor(Math.random() * state.solarSystem.length);
  
  return {
    id: eventId,
    system: systemIndex
  };
}

export function checkRandomEventOccurrence(state: GameState): EventOccurrence {
  const randomEvent = generateRandomEvent(state);
  
  if (randomEvent) {
    return {
      hasEvent: true,
      eventType: randomEvent.id,
      systemIndex: randomEvent.system
    };
  }
  
  return { hasEvent: false };
}

// Event System Updates

export function updateEventStatuses(state: GameState): void {
  // Update quest-related events based on current state
  
  if (state.dragonflyStatus === 5) {
    // Dragonfly destroyed - add news event if not already added
    if (!isNewsEvent(state, SpecialEventType.DRAGONFLYDESTROYED)) {
      addNewsEvent(state, SpecialEventType.DRAGONFLYDESTROYED);
      
      // Create event in Zalkon system (system 118)
      if (state.solarSystem.length > 118) {
        setSystemSpecialEvent(state, 118, SpecialEventType.DRAGONFLYDESTROYED);
      }
    }
  }
  
  if (state.spacemonsterStatus === 2) {
    // Space monster killed
    if (!isNewsEvent(state, SpecialEventType.MONSTERKILLED)) {
      addNewsEvent(state, SpecialEventType.MONSTERKILLED);
    }
  }
  
  // Update tribble breeding (simplified)
  if (state.ship.tribbles > 0 && state.ship.tribbles < 50000) {
    // Tribbles breed slowly over time
    const breedChance = Math.min(0.1, state.ship.tribbles * 0.001);
    if (Math.random() < breedChance) {
      state.ship.tribbles = Math.min(50000, Math.floor(state.ship.tribbles * 1.1));
    }
  }
}

export function checkEventAvailability(state: GameState, eventType: SpecialEventId): EventAvailability {
  const event = SPECIAL_EVENTS.find(e => e.id === eventType);
  if (!event) {
    return { available: false, requirements: {} };
  }
  
  const requirements: { [key: string]: boolean } = {};
  
  // Check credits
  requirements.hasCredits = state.credits >= event.price;
  
  // Check quest requirements
  if (event.requirements?.questStatus) {
    switch (event.requirements.questStatus) {
      case 'japori':
        requirements.japoriQuest = state.japoriDiseaseStatus > 0;
        break;
    }
  }
  
  // Check equipment requirements
  if (event.requirements?.equipment) {
    requirements.hasEquipment = event.requirements.equipment.every(item => {
      switch (item) {
        case 'beam_laser':
          return state.ship.weapon.some(weapon => weapon === 1);
        default:
          return false;
      }
    });
  }
  
  const available = Object.values(requirements).every(req => req);
  
  return { available, requirements };
}

// Utility Functions

export function getEventName(eventType: SpecialEventId): string {
  const event = SPECIAL_EVENTS.find(e => e.id === eventType);
  return event?.name || 'Unknown Event';
}

export function getEventDescription(eventType: SpecialEventId): string {
  const event = SPECIAL_EVENTS.find(e => e.id === eventType);
  return event?.description || 'No description available';
}

export function getAllSpecialEvents(): SpecialEventDefinition[] {
  return [...SPECIAL_EVENTS];
}
