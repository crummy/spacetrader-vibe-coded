/**
 * Palm OS compliant newspaper system
 * Based on palm/Src/SystemInfoEvent.c and spacetrader.h constants
 */

import type { State, SolarSystem } from '../types.ts';
import { getNewsEvents, getEventName } from '../events/special.ts';
import { getSolarSystemName } from '../data/systems.ts';
import { random, randomFloor } from '../math/random.ts';

// Palm OS constants
export const MAXTECHLEVEL = 8;
export const STORYPROBABILITY = 50 / MAXTECHLEVEL; // 6.25
export const MAXMASTHEADS = 3;
export const MAXSTORIES = 4;
export const NEWSINDENT1 = 5;
export const NEWSINDENT2 = 5;

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
 * Generate news stories about other systems' status conditions
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
 * Generate full newspaper content using Palm OS logic
 */
export function generateNewspaper(state: State): string {
  const currentSystem = state.solarSystem[state.currentSystem];
  
  // Generate masthead using Palm OS logic (use warp system % MAXMASTHEADS)
  const mastheadIndex = state.currentSystem % MAXMASTHEADS;
  const masthead = generateMasthead(currentSystem, mastheadIndex);
  
  let content = `${masthead}\n${'='.repeat(masthead.length)}\n\n`;
  
  // Add quest events from newsEvents array (special events go first)
  const newsEvents = getNewsEvents(state);
  let realNews = false;
  
  if (newsEvents.length > 0) {
    newsEvents.forEach(event => {
      const eventName = getEventName(event.id);
      content += formatNewsText(`• ${eventName}`) + '\n';
      realNews = true;
    });
    content += '\n';
  }
  
  // Generate status stories about other systems
  const statusStories = generateStatusStories(state);
  if (statusStories.length > 0) {
    statusStories.forEach(story => {
      content += formatNewsText(`• ${story}`) + '\n';
      realNews = true;
    });
    content += '\n';
  }
  
  // If no real news, use canned stories (Palm OS fallback)
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
