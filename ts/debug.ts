// Debug Utilities for Space Trader
// Provides helper functions for enabling and configuring debug logging

import type { GameState, DebugConfig } from './types.ts';

/**
 * Enable debug logging for specific categories
 */
export function enableDebug(state: GameState, options: Partial<DebugConfig['log']> = {}): void {
  if (!state.debug) {
    state.debug = {
      enabled: false,
      log: {
        actions: false,
        encounters: false,
        travel: false,
        economy: false,
        combat: false,
      }
    };
  }

  state.debug.enabled = true;
  
  // Apply specific logging options
  if (options.actions !== undefined) state.debug.log.actions = options.actions;
  if (options.encounters !== undefined) state.debug.log.encounters = options.encounters;
  if (options.travel !== undefined) state.debug.log.travel = options.travel;
  if (options.economy !== undefined) state.debug.log.economy = options.economy;
  if (options.combat !== undefined) state.debug.log.combat = options.combat;
}

/**
 * Enable all debug logging
 */
export function enableAllDebug(state: GameState): void {
  enableDebug(state, {
    actions: true,
    encounters: true,
    travel: true,
    economy: true,
    combat: true,
  });
}

/**
 * Enable only action logging (most common use case)
 */
export function enableActionLogging(state: GameState): void {
  enableDebug(state, { actions: true });
}

/**
 * Disable debug logging
 */
export function disableDebug(state: GameState): void {
  if (state.debug) {
    state.debug.enabled = false;
    state.debug.log = {
      actions: false,
      encounters: false,
      travel: false,
      economy: false,
      combat: false,
    };
  }
}

/**
 * Check if debug logging is enabled for a category
 */
export function isDebugEnabled(state: GameState, category: keyof DebugConfig['log']): boolean {
  return state.debug?.enabled === true && state.debug?.log?.[category] === true;
}

/**
 * Debug log helper - only logs if debug is enabled for the category
 */
export function debugLog(state: GameState, category: keyof DebugConfig['log'], message: string, data?: any): void {
  if (isDebugEnabled(state, category)) {
    const prefix = `🔍 [DEBUG:${category.toUpperCase()}]`;
    if (data) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  }
}

/**
 * Create debug configuration from environment variables
 */
export function createDebugConfigFromEnv(): DebugConfig {
  const enabled = process.env.ST_DEBUG === 'true' || process.env.ST_DEBUG === '1';
  
  return {
    enabled,
    log: {
      actions: process.env.ST_DEBUG_ACTIONS === 'true' || enabled,
      encounters: process.env.ST_DEBUG_ENCOUNTERS === 'true' || false,
      travel: process.env.ST_DEBUG_TRAVEL === 'true' || false,
      economy: process.env.ST_DEBUG_ECONOMY === 'true' || false,
      combat: process.env.ST_DEBUG_COMBAT === 'true' || false,
    }
  };
}

/**
 * Apply environment-based debug configuration to game state
 */
export function applyEnvDebugConfig(state: GameState): void {
  const envConfig = createDebugConfigFromEnv();
  state.debug = envConfig;
}
