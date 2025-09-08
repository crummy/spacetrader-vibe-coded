// Buy Cargo Screen - Simplified version working with actual UI fields
import React, { useState } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.ts';
import { getUiFields } from '@game-ui';
import type { ScreenProps } from '../types.ts';

export function BuyCargoScreen({ onNavigate, onBack }: ScreenProps) {
  const { state, executeAction } = useGameEngine();
  const uiFields = getUiFields(state);

  return (
    <div className="space-panel">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="neon-button">
          ← Back
        </button>
        <h2 className="retro-title text-lg">BUY CARGO</h2>
        <div className="text-neon-green font-bold">{state.credits.toLocaleString()} cr.</div>
      </div>

      <div className="text-center py-8">
        <div className="text-4xl mb-4">📦</div>
        <div className="text-neon-cyan text-lg mb-2">Commodity Exchange</div>
        <div className="text-palm-gray text-sm mb-6">
          Welcome to the trading post! Here you can buy cargo items.
        </div>
        
        <div className="space-panel bg-space-black mb-4">
          <div className="text-neon-amber mb-2">Coming Soon:</div>
          <div className="text-sm text-palm-gray space-y-1">
            <div>• View available trade goods</div>
            <div>• Check local prices and quantities</div>
            <div>• Purchase cargo for your ship</div>
            <div>• Real-time inventory management</div>
          </div>
        </div>
        
        <div className="text-xs text-palm-gray">
          This screen will integrate with the game's trading engine
          <br />
          to provide authentic Palm OS cargo trading experience.
        </div>
      </div>
    </div>
  );
}
