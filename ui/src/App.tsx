import React, { useState, useMemo } from 'react';
import { Layout, Header, ActionBar } from './components/Layout.tsx';
import { ScreenRouter } from './components/ScreenRouter.tsx';
import { EncounterScreen } from './components/EncounterScreen.tsx';
import { NewGameScreen, type NewGameConfig } from './components/NewGameScreen.tsx';
import { GameOverScreen } from './components/GameOverScreen.tsx';
import { createGameEngine } from '@game-engine';
import { createInitialState } from '@game-state';
import { useNavigation } from './hooks/useNavigation.ts';
import type { State, Difficulty } from '@game-types';
import { GameMode } from '@game-types';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [engine, setEngine] = useState<any>(null);
  const [gameState, setGameState] = useState<State | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { currentScreen, navigate, goBack, canGoBack } = useNavigation();

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
      console.log('Action result:', result);
      
      if (!result.success) {
        alert(`Action failed: ${result.message}`);
      }
      
      return result;
    } catch (error) {
      console.error('Action error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  const handleNewGame = () => {
    setGameStarted(false);
    setEngine(null);
    setGameState(null);
    navigate('planet'); // Reset navigation
  };

  // Show new game screen if game hasn't started
  if (!gameStarted || !gameState || !engine) {
    return <NewGameScreen onStartGame={handleStartGame} />;
  }

  // Show game over screen if game has ended
  if ((gameState.currentMode as any) === 3) { // GameMode.GameOver
    return <GameOverScreen state={gameState} onNewGame={handleNewGame} />;
  }
  
  return (
    <Layout
      header={
        <Header 
          systemName={`System ${gameState.currentSystem}`}
          credits={`${gameState.credits.toLocaleString()} cr.`}
          status={
            gameState.currentMode === GameMode.OnPlanet ? 'Docked' : 
            gameState.currentMode === GameMode.InCombat ? 'In Combat' :
            (gameState.currentMode as any) === 3 ? 'Game Over' :
            'In Space'
          }
        />
      }
      actionBar={
        // Show action bar only on planet view or if we have actions to display
        (currentScreen === 'planet' && availableActions.length > 0) ? (
          <ActionBar 
            actions={availableActions}
            onAction={handleAction}
          />
        ) : canGoBack ? (
          <div className="flex justify-between items-center">
            <button 
              onClick={goBack}
              className="neon-button"
            >
              ← Back to {currentScreen === 'planet' ? 'Planet' : 'Previous'}
            </button>
            <div className="text-sm text-palm-gray">
              {currentScreen.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </div>
          </div>
        ) : undefined
      }
    >
      <div className="max-w-4xl mx-auto">
        {/* Show encounter screen when in combat */}
        {gameState.currentMode === GameMode.InCombat ? (
          <EncounterScreen 
            state={gameState}
            onAction={handleAction}
          />
        ) : (
          <ScreenRouter
            currentScreen={currentScreen}
            onNavigate={navigate}
            onBack={goBack}
            state={gameState}
            onAction={handleAction}
            availableActions={availableActions}
            isLoading={isLoading}
          />
        )}
        
        {isLoading && (
          <div className="fixed inset-0 bg-space-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="space-panel text-center">
              <div className="retro-title text-lg text-neon-cyan animate-pulse">
                PROCESSING...
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

export default App;
