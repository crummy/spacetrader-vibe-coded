/**
 * Palm OS compliant newspaper system
 * Based on palm/Src/SystemInfoEvent.c and spacetrader.h constants
 * Enhanced with full Palm OS news algorithm including:
 * - Dynamic player-based stories (reputation-based)
 * - Quest-based headlines  
 * - Distance-based news filtering
 * - Fallback canned stories
 * - Special always-show stories
 */

import type { State, SolarSystem } from '../types.ts';
import { getNewsEvents, getEventName, SpecialEventType } from '../events/special.ts';
import { getSolarSystemName } from '../data/systems.ts';
import { random, randomFloor } from '../math/random.ts';
import { calculateDistance, isWormholeTravel, getFuelTanks } from '../travel/warp.ts';
import { realDistanceInteger } from '../math/core-math.ts';

// Palm OS constants
export const MAXTECHLEVEL = 8;
export const STORYPROBABILITY = 50 / MAXTECHLEVEL; // 6.25
export const MAXMASTHEADS = 3;
export const MAXSTORIES = 4;
export const NEWSINDENT1 = 5;
export const NEWSINDENT2 = 5;

// Police record scores (from Palm OS spacetrader.h)
export const VILLAINSCORE = -30;
export const HEROSCORE = 75;

// Special Resources (from Palm OS spacetrader.h)
export const MOONFORSALE = 10;
export const BUYTRIBBLE = 11;

// Additional event constants not yet in SpecialEventType
const CAUGHTLITTERING = 100; // Temporary constant until added to special.ts
const GEMULONRESCUED = 101; // Temporary constant until added to special.ts  
const ARRIVALVIASINGULARITY = 102; // Temporary constant until added to special.ts

// Story prefixes - Palm OS uses 6 different prefixes
export const STORY_PREFIXES = [
  'Reports of',
  'News of', 
  'New Rumors of',
  'Sources say',
  'Notice:',
  'Evidence Suggests'
] as const;

// Status messages - Palm OS has 7 status conditions
export const STATUS_MESSAGES = {
  1: 'Strife and War',        // WAR
  2: 'Plague Outbreaks',      // PLAGUE
  3: 'Severe Drought',        // DROUGHT
  4: 'Terrible Boredom',      // BOREDOM
  5: 'Cold Weather',          // COLD
  6: 'Crop Failures',         // CROPFAILURE
  7: 'Labor Shortages'        // LACKOFWORKERS
} as const;

// Government-specific newspaper mastheads (3 per government type)
export const NEWSPAPER_MASTHEADS = {
  0: [ // Democracy
    'The * Tribune',
    '+ Daily News', 
    'The * Chronicle'
  ],
  1: [ // Feudal State
    'The * Herald',
    '+ Royal Gazette',
    'The * Court Circular'
  ],
  2: [ // Multi-Government
    'The * Coalition Press',
    '+ Unity Times',
    'The * Alliance Journal'
  ],
  3: [ // Dictatorship
    'The * State News',
    '+ Official Bulletin',
    'The * Party Paper'
  ],
  4: [ // Communist State
    'The * People\'s Voice',
    '+ Workers\' Daily',
    'The * Red Star'
  ],
  5: [ // Confederacy
    'The * Independent',
    '+ Freedom Press',
    'The * Liberty Times'
  ],
  6: [ // Anarchist
    'The * Underground',
    '+ Free Press',
    'The * Rebel Voice'
  ],
  7: [ // Capitalist State
    'The * Business Times',
    '+ Market News',
    'The * Trade Journal'
  ]
} as const;

// Government-specific canned stories (4 per government type)
export const CANNED_STORIES = {
  0: [ // Democracy
    'Local Elections Show Increased Voter Participation',
    'Parliamentary Committee Approves New Trade Measures',
    'Citizens\' Rights Group Calls for Expanded Freedoms',
    'Public Debate Scheduled on System Defense Budget'
  ],
  1: [ // Feudal State
    'Noble Houses Gather for Traditional Ceremony',
    'Royal Court Announces New Trade Privileges',
    'Feudal Lords Meet to Discuss Border Security',
    'Ancient Customs Celebration Draws Large Crowds'
  ],
  2: [ // Multi-Government
    'Coalition Partners Reach Agreement on Trade Policy',
    'Multi-System Conference Yields Positive Results',
    'Diplomatic Relations Show Continued Improvement',
    'Joint Council Meeting Addresses Economic Concerns'
  ],
  3: [ // Dictatorship
    'Leader\'s Latest Speech Inspires Renewed Dedication',
    'State Planning Committee Announces Production Goals',
    'Security Forces Report Successful Anti-Crime Operations',
    'National Unity Rally Demonstrates Citizens\' Loyalty'
  ],
  4: [ // Communist State
    'Workers\' Collective Exceeds Production Quotas',
    'Party Leadership Announces New Five-Year Plan',
    'Comrades Celebrate Revolutionary Anniversary',
    'People\'s Committee Reports Progress on Social Programs'
  ],
  5: [ // Confederacy
    'Member States Reaffirm Commitment to Cooperation',
    'Independent Traders Report Strong Quarterly Earnings',
    'Confederate Assembly Passes Mutual Defense Pact',
    'Local Autonomy Measures Gain Support Across Systems'
  ],
  6: [ // Anarchist
    'Underground Networks Coordinate Successful Trade Routes',
    'Free Collectives Report Voluntary Cooperation Increases',
    'Independent Groups Form New Mutual Aid Societies',
    'Autonomous Zones Demonstrate Self-Governance Success'
  ],
  7: [ // Capitalist State
    'Stock Markets Show Strong Performance This Quarter',
    'Corporate Mergers Create New Trade Opportunities',
    'Private Enterprise Drives Economic Growth',
    'Business Leaders Optimistic About Market Expansion'
  ]
} as const;

/**
 * Calculate story probability using Palm OS formula
 * STORYPROBABILITY * techLevel + 10 * (5 - difficulty)
 */
export function calculateStoryProbability(techLevel: number, difficulty: number): number {
  return STORYPROBABILITY * techLevel + 10 * (5 - difficulty);
}

/**
 * Determine if a story should be generated based on Palm OS probability
 */
export function shouldGenerateStory(system: SolarSystem, difficulty: number): boolean {
  const probability = calculateStoryProbability(system.techLevel, difficulty);
  return random() * 100 <= probability;
}

/**
 * Format newspaper text with Palm OS indentation constants
 */
export function formatNewsText(headline: string, content?: string): string {
  let formatted = `${' '.repeat(NEWSINDENT1)}${headline}`;
  if (content) {
    formatted += `\n${' '.repeat(NEWSINDENT2)}${content}`;
  }
  return formatted;
}

/**
 * Get newspaper mastheads for a government type (MAXMASTHEADS = 3)
 */
export function getNewspaperMastheads(government: number): string[] {
  return NEWSPAPER_MASTHEADS[government as keyof typeof NEWSPAPER_MASTHEADS] || NEWSPAPER_MASTHEADS[0];
}

/**
 * Get canned stories for a government type (MAXSTORIES = 4)
 */
export function getCannedStories(government: number): string[] {
  return CANNED_STORIES[government as keyof typeof CANNED_STORIES] || CANNED_STORIES[0];
}

/**
 * Generate masthead name, replacing Palm OS tokens (* = "The [System]", + = "[System]")
 */
export function generateMasthead(system: SolarSystem, mastheadIndex: number): string {
  const mastheads = getNewspaperMastheads(system.politics);
  const masthead = mastheads[mastheadIndex % MAXMASTHEADS];
  const systemName = getSolarSystemName(system.nameIndex);
  
  return masthead
    .replace('*', systemName)
    .replace('+', systemName);
}

/**
 * Check if a news event should be displayed
 * Port of Palm OS isNewsEvent() function
 */
function isNewsEvent(state: State, eventType: number): boolean {
  // Check if event exists in newsEvents array
  return state.newsEvents?.some(event => event.id === eventType) ?? false;
}

/**
 * Generate quest-based headlines (lines 520-589 in Palm OS)
 * These are specific headlines for major quest events
 */
export function generateQuestHeadlines(state: State): string[] {
  const headlines: string[] = [];
  
  // Dragonfly theft and destruction events
  if (isNewsEvent(state, SpecialEventType.DRAGONFLY)) {
    headlines.push('Experimental Craft Stolen! Critics Demand Security Review.');
  }
  if (isNewsEvent(state, SpecialEventType.SCARAB)) {
    headlines.push('Security Scandal: Test Craft Confirmed Stolen.');
  }
  if (isNewsEvent(state, SpecialEventType.FLYBARATAS)) {
    headlines.push('Investigators Report Strange Craft.');
  }
  if (isNewsEvent(state, SpecialEventType.FLYMELINA)) {
    headlines.push('Rumors Continue: Melina Orbitted by Odd Starcraft.');
  }
  if (isNewsEvent(state, SpecialEventType.FLYREGULAS)) {
    headlines.push('Strange Ship Observed in Regulas Orbit.');
  }
  
  // Special case: Dragonfly destruction threat at Zalkon
  if (state.solarSystem[state.currentSystem].special === SpecialEventType.DRAGONFLYDESTROYED && 
      state.dragonflyStatus === 4 && 
      !isNewsEvent(state, SpecialEventType.DRAGONFLYDESTROYED)) {
    headlines.push('Unidentified Ship: A Threat to Zalkon?');
  }
  
  if (isNewsEvent(state, SpecialEventType.DRAGONFLYDESTROYED)) {
    headlines.push('Spectacular Display as Stolen Ship Destroyed in Fierce Space Battle.');
  }
  if (isNewsEvent(state, SpecialEventType.SCARABDESTROYED)) {
    headlines.push('Wormhole Traffic Delayed as Stolen Craft Destroyed.');
  }
  
  // Space Monster and other combat events
  if (isNewsEvent(state, SpecialEventType.MONSTERKILLED)) {
    headlines.push('Hero Slays Space Monster! Parade, Honors Planned for Today.');
  }
  
  // Medicine and disease events
  if (isNewsEvent(state, SpecialEventType.MEDICINEDELIVERY)) {
    headlines.push('Disease Antidotes Arrive! Health Officials Optimistic.');
  }
  if (isNewsEvent(state, SpecialEventType.JAPORI)) {
    headlines.push('Editorial: We Must Help Japori!');
  }
  
  // Artifact delivery
  if (isNewsEvent(state, SpecialEventType.ARTIFACTDELIVERY)) {
    headlines.push('Scientist Adds Alien Artifact to Museum Collection.');
  }
  
  // Jarek and Wild rescue events
  if (isNewsEvent(state, SpecialEventType.JAREKGETSOUT)) {
    headlines.push('Ambassador Jarek Returns from Crisis.');
  }
  if (isNewsEvent(state, SpecialEventType.WILDGETSOUT)) {
    headlines.push('Rumors Suggest Known Criminal J. Wild May Come to Kravat!');
  }
  
  // Alien invasion warnings
  if (isNewsEvent(state, GEMULONRESCUED)) {
    headlines.push('Invasion Imminent! Plans in Place to Repel Hostile Invaders.');
  }
  
  // Special case: Gemulon invasion if not rescued
  if (state.solarSystem[state.currentSystem].special === GEMULONRESCUED && 
      !isNewsEvent(state, GEMULONRESCUED)) {
    headlines.push('Alien Invasion Devastates Planet!');
  }
  
  if (isNewsEvent(state, SpecialEventType.ALIENINVASION)) {
    headlines.push('Editorial: Who Will Warn Gemulon?');
  }
  if (isNewsEvent(state, ARRIVALVIASINGULARITY)) {
    headlines.push('Travelers Claim Sighting of Ship Materializing in Orbit!');
  }
  
  return headlines;
}

/**
 * Generate local system status headlines (lines 592-618 in Palm OS)
 */
export function generateLocalStatusHeadlines(system: SolarSystem): string[] {
  const headlines: string[] = [];
  
  if (system.status > 0) {
    switch (system.status) {
      case 1: // WAR
        headlines.push('War News: Offensives Continue!');
        break;
      case 2: // PLAGUE
        headlines.push('Plague Spreads! Outlook Grim.');
        break;
      case 3: // DROUGHT
        headlines.push('No Rain in Sight!');
        break;
      case 4: // BOREDOM
        headlines.push('Editors: Won\'t Someone Entertain Us?');
        break;
      case 5: // COLD
        headlines.push('Cold Snap Continues!');
        break;
      case 6: // CROPFAILURE
        headlines.push('Serious Crop Failure! Must We Ration?');
        break;
      case 7: // LACKOFWORKERS
        headlines.push('Jobless Rate at All-Time Low!');
        break;
    }
  }
  
  return headlines;
}

/**
 * Generate player-specific headlines based on reputation (lines 621-685 in Palm OS)
 */
export function generatePlayerHeadlines(state: State): string[] {
  const headlines: string[] = [];
  const currentSystem = state.solarSystem[state.currentSystem];
  const systemName = getSolarSystemName(currentSystem.nameIndex);
  
  // Villain/Criminal stories (3 variations)
  if (state.policeRecordScore <= VILLAINSCORE) {
    const storyIndex = randomFloor(4);
    switch (storyIndex) {
      case 0:
        headlines.push(`Police Warning: ${state.nameCommander} Will Dock At ${systemName}!`);
        break;
      case 1:
        headlines.push(`Notorious Criminal ${state.nameCommander} Sighted in ${systemName}!`);
        break;
      case 2:
        headlines.push(`Locals Rally to Deny Spaceport Access to ${state.nameCommander}!`);
        break;
      case 3:
        headlines.push(`Terror Strikes Locals on Arrival of ${state.nameCommander}!`);
        break;
    }
  }
  
  // Hero stories (3 variations)
  if (state.policeRecordScore === HEROSCORE) {
    const storyIndex = randomFloor(3);
    switch (storyIndex) {
      case 0:
        headlines.push(`Locals Welcome Visiting Hero ${state.nameCommander}!`);
        break;
      case 1:
        headlines.push(`Famed Hero ${state.nameCommander} to Visit System!`);
        break;
      case 2:
        headlines.push(`Large Turnout At Spaceport to Welcome ${state.nameCommander}!`);
        break;
    }
  }
  
  // Littering story
  if (isNewsEvent(state, CAUGHTLITTERING)) {
    headlines.push(`Police Trace Orbiting Space Litter to ${state.nameCommander}.`);
  }
  
  return headlines;
}

/**
 * Check if system is within news range (fuel range or wormhole connected)
 * Port of Palm OS distance checking logic (lines 693-696)
 */
function isSystemInNewsRange(state: State, systemIndex: number): boolean {
  const currentSystem = state.currentSystem;
  const targetSystem = state.solarSystem[systemIndex];
  const currentSystemData = state.solarSystem[currentSystem];
  
  // Check direct fuel range
  const distance = realDistanceInteger(
    currentSystemData.x, currentSystemData.y,
    targetSystem.x, targetSystem.y
  );
  
  const fuelTanks = getFuelTanks(state.ship);
  
  if (distance <= fuelTanks) {
    return true;
  }
  
  // Check wormhole connection
  return isWormholeTravel(state, currentSystem, systemIndex);
}

/**
 * Generate distance-based news stories (lines 691-774 in Palm OS)
 * Only show news from systems within fuel range or wormhole connections
 */
export function generateDistanceBasedNews(state: State): string[] {
  const stories: string[] = [];
  const currentSystem = state.solarSystem[state.currentSystem];
  
  for (let i = 0; i < state.solarSystem.length; i++) {
    if (i === state.currentSystem) continue;
    
    const system = state.solarSystem[i];
    
    // Only consider systems in range and with status
    if (!isSystemInNewsRange(state, i) || system.status === 0) continue;
    
    // Special stories that always get shown: moon for sale and tribble buyer
    if (system.specialResources === MOONFORSALE) {
      stories.push(`Seller in ${getSolarSystemName(system.nameIndex)} System has Utopian Moon available.`);
      continue;
    }
    
    if (system.specialResources === BUYTRIBBLE) {
      stories.push(`Collector in ${getSolarSystemName(system.nameIndex)} System seeks to purchase Tribbles.`);
      continue;
    }
    
    // Probabilistic stories using Palm OS formula
    if (shouldGenerateStory(currentSystem, state.difficulty)) {
      const prefixIndex = randomFloor(STORY_PREFIXES.length);
      const prefix = STORY_PREFIXES[prefixIndex];
      const statusMessage = STATUS_MESSAGES[system.status as keyof typeof STATUS_MESSAGES];
      
      if (statusMessage) {
        stories.push(`${prefix} ${statusMessage} in the ${getSolarSystemName(system.nameIndex)} System.`);
      }
    }
  }
  
  return stories;
}

/**
 * Generate news stories about other systems' status conditions
 * @deprecated Use generateDistanceBasedNews instead for full Palm OS compatibility
 */
export function generateStatusStories(state: State, maxStories: number = 10): string[] {
  const stories: string[] = [];
  const systems = state.solarSystem;
  const currentSystem = systems[state.currentSystem];
  
  // Check each system for news stories (excluding current system)
  for (let i = 0; i < systems.length && stories.length < maxStories; i++) {
    if (i === state.currentSystem || systems[i].status === 0) continue;
    
    const system = systems[i];
    
    // Always show special stories (moon sales and tribble buyers)
    if (system.specialResources === 10) { // MOONFORSALE equivalent
      stories.push(`Seller in ${getSolarSystemName(system.nameIndex)} System has Utopian Moon available.`);
      continue;
    }
    
    if (system.specialResources === 11) { // BUYTRIBBLE equivalent  
      stories.push(`Collector in ${getSolarSystemName(system.nameIndex)} System seeks to purchase Tribbles.`);
      continue;
    }
    
    // Generate probabilistic stories using Palm OS formula
    if (shouldGenerateStory(currentSystem, state.difficulty)) {
      const prefixIndex = randomFloor(STORY_PREFIXES.length);
      const prefix = STORY_PREFIXES[prefixIndex];
      const statusMessage = STATUS_MESSAGES[system.status as keyof typeof STATUS_MESSAGES];
      
      if (statusMessage) {
        stories.push(`${prefix} ${statusMessage} in the ${getSolarSystemName(system.nameIndex)} System.`);
      }
    }
  }
  
  return stories;
}

/**
 * Generate full newspaper content using enhanced Palm OS logic
 * Implements the complete algorithm from SystemInfoEvent.c lines 520-795
 */
export function generateNewspaper(state: State): string {
  const currentSystem = state.solarSystem[state.currentSystem];
  
  // Generate masthead using Palm OS logic (use warp system % MAXMASTHEADS)
  const mastheadIndex = state.currentSystem % MAXMASTHEADS;
  const masthead = generateMasthead(currentSystem, mastheadIndex);
  
  let content = `${masthead}\n${'='.repeat(masthead.length)}\n\n`;
  let realNews = false;
  
  // 1. Quest-based headlines (lines 520-589)
  const questHeadlines = generateQuestHeadlines(state);
  if (questHeadlines.length > 0) {
    questHeadlines.forEach(headline => {
      content += formatNewsText(`• ${headline}`) + '\n';
      realNews = true;
    });
    content += '\n';
  }
  
  // 2. Local system status headlines (lines 592-618)
  const localHeadlines = generateLocalStatusHeadlines(currentSystem);
  if (localHeadlines.length > 0) {
    localHeadlines.forEach(headline => {
      content += formatNewsText(`• ${headline}`) + '\n';
      realNews = true;
    });
    content += '\n';
  }
  
  // 3. Player-specific headlines based on reputation (lines 621-685)
  const playerHeadlines = generatePlayerHeadlines(state);
  if (playerHeadlines.length > 0) {
    playerHeadlines.forEach(headline => {
      content += formatNewsText(`• ${headline}`) + '\n';
      realNews = true;
    });
    content += '\n';
  }
  
  // 4. Distance-based news from other systems (lines 691-774)
  const distanceBasedNews = generateDistanceBasedNews(state);
  if (distanceBasedNews.length > 0) {
    distanceBasedNews.forEach(story => {
      content += formatNewsText(`• ${story}`) + '\n';
      realNews = true;
    });
    content += '\n';
  }
  
  // 5. Fallback canned stories if no real news (lines 777-794)
  if (!realNews) {
    const cannedStories = getCannedStories(currentSystem.politics);
    const shown: boolean[] = new Array(MAXSTORIES).fill(false);
    const numStories = randomFloor(MAXSTORIES) + 1;
    
    for (let i = 0; i < numStories; i++) {
      const storyIndex = randomFloor(MAXSTORIES);
      if (!shown[storyIndex]) {
        content += formatNewsText(`• ${cannedStories[storyIndex]}`) + '\n';
        shown[storyIndex] = true;
      }
    }
  }
  
  return content;
}

/**
 * Generate newspaper with comprehensive Palm OS news algorithm
 * This is the main enhanced function that should be used
 */
export function generateEnhancedNewspaper(state: State): string {
  return generateNewspaper(state);
}
