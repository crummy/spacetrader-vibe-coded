// React hook for game engine integration using TypeScript path aliases
import { useState, useCallback, useMemo } from 'react';
import { createGameEngine, type GameAction, type ActionResult } from '@game-engine';
import type { State } from '@game-types';

export function useGameEngine() {
  // Initialize the real game engine
  const [engine] = useState(() => {
    try {
      return createGameEngine();
    } catch (error) {
      console.error('Failed to initialize game engine:', error);
      throw error;
    }
  });
  
  const [gameState, setGameState] = useState<State>(engine.state);
  const [isLoading, setIsLoading] = useState(false);
  
  const executeAction = useCallback(async (action: GameAction): Promise<ActionResult> => {
    setIsLoading(true);
    try {
      const result = await engine.executeAction(action);
      
      // Always sync React state with engine state after any action
      const newState = { ...engine.state };
      setGameState(newState);
      
      return result;
    } catch (error) {
      console.error('Action execution failed:', error);
      return {
        success: false,
        message: `Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stateChanged: false
      };
    } finally {
      setIsLoading(false);
    }
  }, [engine, gameState]);
  
  const availableActions = useMemo(() => {
    try {
      return engine.getAvailableActions();
    } catch (error) {
      console.error('Failed to get available actions:', error);
      return [];
    }
  }, [engine, gameState]);
  
  return {
    state: gameState,
    executeAction,
    availableActions,
    isLoading,
    engine // Expose engine for direct access if needed
  };
}
