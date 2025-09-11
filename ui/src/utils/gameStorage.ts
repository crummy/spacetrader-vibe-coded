import type { State } from '@game-types';

const STORAGE_KEY = 'spacetrader-game-state';
const VERSION_KEY = 'spacetrader-save-version';
const CURRENT_VERSION = '1.0.0';

export interface SavedGame {
  version: string;
  timestamp: number;
  gameState: State;
  engineState?: any; // For any additional engine state we might need
}

/**
 * Save game state to localStorage
 */
export function saveGameState(gameState: State, engineState?: any): boolean {
  try {
    const savedGame: SavedGame = {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      gameState: gameState,
      engineState: engineState
    };

    const serialized = JSON.stringify(savedGame);
    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    
    console.debug('Game state saved successfully');
    return true;
  } catch (error) {
    console.error('Failed to save game state:', error);
    
    // Handle quota exceeded error specifically
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
      // Optionally show user-friendly error message
    }
    
    return false;
  }
}

/**
 * Load game state from localStorage
 */
export function loadGameState(): SavedGame | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      console.debug('No saved game found');
      return null;
    }

    const parsed = JSON.parse(serialized) as SavedGame;
    
    // Version check
    if (parsed.version !== CURRENT_VERSION) {
      console.warn(`Save version mismatch: saved=${parsed.version}, current=${CURRENT_VERSION}`);
      // For now, we'll try to load anyway, but we could add migration logic here
    }

    console.debug('Game state loaded successfully', {
      version: parsed.version,
      timestamp: new Date(parsed.timestamp),
      commander: parsed.gameState.nameCommander,
      day: parsed.gameState.days
    });

    return parsed;
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
}

/**
 * Check if a saved game exists
 */
export function hasSavedGame(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Delete saved game from localStorage
 */
export function deleteSavedGame(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VERSION_KEY);
    console.debug('Saved game deleted');
    return true;
  } catch (error) {
    console.error('Failed to delete saved game:', error);
    return false;
  }
}

/**
 * Get save game info without loading full state
 */
export function getSaveInfo(): { commander: string; day: number; timestamp: number } | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;

    const parsed = JSON.parse(serialized) as SavedGame;
    return {
      commander: parsed.gameState.nameCommander,
      day: parsed.gameState.days,
      timestamp: parsed.timestamp
    };
  } catch (error) {
    console.error('Failed to get save info:', error);
    return null;
  }
}

/**
 * Check localStorage availability and space
 */
export function checkStorageAvailability(): { available: boolean; spaceUsed?: number; totalSpace?: number } {
  try {
    const test = 'storage-test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    
    // Try to estimate storage usage (not perfect but gives an idea)
    let spaceUsed = 0;
    let totalSpace = 0;
    
    try {
      // Rough estimate of used space
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        spaceUsed = new Blob([serialized]).size;
      }
      
      // Try to estimate total localStorage space (this is approximate)
      // Most browsers have 5-10MB limit for localStorage per origin
      totalSpace = 5 * 1024 * 1024; // Assume 5MB default
    } catch (e) {
      // Ignore estimation errors
    }

    return { available: true, spaceUsed, totalSpace };
  } catch (error) {
    console.error('localStorage not available:', error);
    return { available: false };
  }
}

/**
 * Auto-save with throttling to avoid excessive saves
 */
let saveTimeout: number | null = null;
const SAVE_DELAY = 1000; // 1 second delay

export function autoSaveGameState(gameState: State, engineState?: any): void {
  // Clear existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  // Set new timeout to save after delay
  saveTimeout = setTimeout(() => {
    saveGameState(gameState, engineState);
    saveTimeout = null;
  }, SAVE_DELAY);
}
