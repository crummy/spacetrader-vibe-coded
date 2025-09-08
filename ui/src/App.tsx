import React, { useState, useMemo } from 'react';
import { PalmInterface } from './components/PalmInterface.tsx';
import { EncounterScreen } from './components/EncounterScreen.tsx';
import { NewGameScreen, type NewGameConfig } from './components/NewGameScreen.tsx';
import { GameOverScreen } from './components/GameOverScreen.tsx';
import { createGameEngine } from '@game-engine';
import { createInitialState } from '@game-state';
import type { State, Difficulty } from '@game-types';
import { GameMode } from '@game-types';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [engine, setEngine] = useState<any>(null);
  const [gameState, setGameState] = useState<State | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const availableActions = useMemo(() => {
    return engine?.getAvailableActions() || [];
  }, [engine, gameState]);

  const handleStartGame = (config: NewGameConfig) => {
    setIsLoading(true);
    
    try {
      // Create custom initial state with player configuration
      const initialState = createInitialState();
      
      // Apply player customizations
      initialState.nameCommander = config.commanderName;
      initialState.difficulty = config.difficulty as Difficulty;
      initialState.commanderPilot = config.pilotSkill;
      initialState.commanderFighter = config.fighterSkill;
      initialState.commanderTrader = config.traderSkill;
      initialState.commanderEngineer = config.engineerSkill;
      
      // Create game engine with custom state
      const newEngine = createGameEngine(initialState);
      
      setEngine(newEngine);
      setGameState(newEngine.state);
      setGameStarted(true);
    } catch (error) {
      console.error('Failed to start new game:', error);
      alert('Failed to start new game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAction = async (action: any) => {
    if (!engine) return { success: false, message: 'Game engine not initialized' };
    
    try {
      const result = await engine.executeAction(action);
      
      // Update React state when game state changes
      if (result.stateChanged) {
        // Check for basic game over condition (ship destroyed)
        if (engine.state.ship.hull <= 0 && (engine.state.currentMode as any) !== 3) {
          (engine.state.currentMode as any) = 3; // Set GameOver mode
        }
        
        setGameState({ ...engine.state });
      }
      
      if (!result.success && result.message) {
        // Show error in a compact way for Palm interface
        console.error('Action failed:', result.message);
      }
      
      return result;
    } catch (error) {
      console.error('Action error:', error);
      throw error;
    }
  };

  const handleNewGame = () => {
    setGameStarted(false);
    setEngine(null);
    setGameState(null);
  };

  // Show new game screen if game hasn't started
  if (!gameStarted || !gameState || !engine) {
    return (
      <div className="game-screen">
        <div className="palm-device">
          <div className="palm-screen">
            <div className="palm-content">
              <NewGameScreen onStartGame={handleStartGame} />
            </div>
          </div>
          <div className="palm-buttons">
            <div className="palm-button" title="Home"></div>
            <div className="palm-button" title="Menu"></div>
            <div className="palm-button" title="Find"></div>
            <div className="palm-button" title="Calc"></div>
          </div>
        </div>
        {isLoading && (
          <div className="fixed inset-0 bg-space-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="text-neon-cyan text-sm animate-pulse">LOADING...</div>
          </div>
        )}
      </div>
    );
  }

  // Show game over screen if game has ended
  if ((gameState.currentMode as any) === 3) { // GameMode.GameOver
    return (
      <div className="game-screen">
        <div className="palm-device">
          <div className="palm-screen">
            <div className="palm-content">
              <GameOverScreen state={gameState} onNewGame={handleNewGame} />
            </div>
          </div>
          <div className="palm-buttons">
            <div className="palm-button" title="Home"></div>
            <div className="palm-button" title="Menu"></div>
            <div className="palm-button" title="Find"></div>
            <div className="palm-button" title="Calc"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show encounter screen when in combat
  if (gameState.currentMode === GameMode.InCombat) {
    return (
      <div className="game-screen">
        <div className="palm-device">
          <div className="palm-screen">
            <div className="palm-content">
              <EncounterScreen 
                state={gameState}
                onAction={handleAction}
              />
            </div>
          </div>
          <div className="palm-buttons">
            <div className="palm-button" title="Home"></div>
            <div className="palm-button" title="Menu"></div>
            <div className="palm-button" title="Find"></div>
            <div className="palm-button" title="Calc"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Default to Palm interface for other modes
  return (
    <div className="game-screen">
      <div className="palm-device">
        <div className="palm-screen">
          <PalmInterface
            state={gameState}
            onAction={handleAction}
            availableActions={availableActions}
          />
        </div>
        {/* Hardware buttons */}
        <div className="palm-buttons">
          <div className="palm-button" title="Home"></div>
          <div className="palm-button" title="Menu"></div>
          <div className="palm-button" title="Find"></div>
          <div className="palm-button" title="Calc"></div>
        </div>
      </div>
      {isLoading && (
        <div className="fixed inset-0 bg-space-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-neon-cyan text-sm animate-pulse">PROCESSING...</div>
        </div>
      )}
    </div>
  );
}

export default App;
