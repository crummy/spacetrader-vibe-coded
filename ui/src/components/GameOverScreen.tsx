// Game Over Screen - Displays final score and death reason
import React from 'react';
import { getSolarSystemName } from '@game-data/systems.ts';
import type { State } from '@game-types';

interface GameOverScreenProps {
  state: State;
  onNewGame: () => void;
}

export function GameOverScreen({ state, onNewGame }: GameOverScreenProps) {
  const currentSystemName = getSolarSystemName(state.currentSystem);
  
  // Calculate final statistics
  const netWorth = state.credits - state.debt;
  const finalScore = netWorth + (state.days * 100); // Simple score calculation
  
  return (
    <div className="min-h-screen bg-space-black flex items-center justify-center p-4">
      <div className="space-panel max-w-lg w-full text-center">
        {/* Game Over Header */}
        <div className="mb-6">
          <div className="text-6xl mb-4">💥</div>
          <h1 className="retro-title text-3xl text-neon-red mb-2">GAME OVER</h1>
          <div className="text-lg text-palm-gray">Your adventure has ended</div>
        </div>

        {/* Death Message */}
        <div className="space-panel bg-red-900 border-red-500 mb-6">
          <div className="text-neon-red font-bold mb-2">Final Transmission:</div>
          <div className="text-sm text-red-300">
            Your ship was destroyed in combat. The void of space has claimed another trader.
          </div>
        </div>

        {/* Final Statistics */}
        <div className="space-panel bg-space-black mb-6">
          <div className="text-neon-amber font-bold mb-3">Final Statistics</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="text-palm-gray">
                <div>Commander:</div>
                <div className="text-neon-cyan font-bold">{state.nameCommander}</div>
              </div>
              <div className="text-palm-gray">
                <div>Days Survived:</div>
                <div className="text-neon-cyan font-bold">{state.days}</div>
              </div>
              <div className="text-palm-gray">
                <div>Final Location:</div>
                <div className="text-neon-cyan font-bold">{currentSystemName}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-palm-gray">
                <div>Credits:</div>
                <div className="text-neon-green font-bold">{state.credits.toLocaleString()}</div>
              </div>
              <div className="text-palm-gray">
                <div>Debt:</div>
                <div className="text-neon-red font-bold">{state.debt.toLocaleString()}</div>
              </div>
              <div className="text-palm-gray">
                <div>Net Worth:</div>
                <div className={`font-bold ${netWorth >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                  {netWorth.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Commander Skills */}
        <div className="space-panel bg-space-black mb-6">
          <div className="text-neon-amber font-bold mb-3">Final Skills</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-palm-gray">Pilot:</span>
              <span className="text-neon-cyan font-bold">{state.commanderPilot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-palm-gray">Fighter:</span>
              <span className="text-neon-cyan font-bold">{state.commanderFighter}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-palm-gray">Trader:</span>
              <span className="text-neon-cyan font-bold">{state.commanderTrader}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-palm-gray">Engineer:</span>
              <span className="text-neon-cyan font-bold">{state.commanderEngineer}</span>
            </div>
          </div>
        </div>

        {/* Score Info */}
        {finalScore > 10000 && (
          <div className="space-panel bg-yellow-900 border-yellow-500 mb-6">
            <div className="text-yellow-300 font-bold mb-2">🏆 Final Score</div>
            <div className="text-sm text-yellow-200">
              {finalScore.toLocaleString()} points
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onNewGame}
            className="neon-button w-full h-12 font-bold text-lg"
          >
            🚀 Start New Game
          </button>
          
          <div className="text-xs text-palm-gray">
            "In space, no one can hear your cargo bay doors slam."
          </div>
        </div>
      </div>
    </div>
  );
}
