// Encounter Screen - Handle combat and encounters
import React, { useState, useEffect } from 'react';
import { getCurrentEncounter } from '../../../ts/combat/engine.ts';
import type { State } from '@game-types';

interface EncounterScreenProps {
  state: State;
  onAction: (action: any) => Promise<any>;
}

export function EncounterScreen({ state, onAction }: EncounterScreenProps) {
  const [actionResult, setActionResult] = useState<string>('');
  
  const encounter = getCurrentEncounter(state);
  const opponentShip = state.opponent;
  const playerShip = state.ship;
  
  const handleCombatAction = async (action: string) => {
    try {
      const result = await onAction({
        type: `combat_${action}`,
        parameters: {}
      });
      
      if (result.success) {
        setActionResult(result.message || `${action} successful`);
      } else {
        setActionResult(result.message || `${action} failed`);
      }
    } catch (error) {
      console.error(`Combat action ${action} failed:`, error);
      setActionResult(`Error: ${action} failed`);
    }
  };

  const handleIgnore = () => handleCombatAction('ignore');
  const handleAttack = () => handleCombatAction('attack');
  const handleFlee = () => handleCombatAction('flee');
  const handleSurrender = () => handleCombatAction('surrender');
  const handleSubmit = () => handleCombatAction('submit');
  const handleBribe = () => handleCombatAction('bribe');

  return (
    <div className="space-panel">
      {/* Encounter Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">⚔️</div>
        <h1 className="retro-title text-xl text-neon-red mb-2">ENCOUNTER!</h1>
        <div className="text-neon-cyan text-lg">{encounter.name}</div>
      </div>

      {/* Ship Status Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Player Ship */}
        <div className="space-panel bg-space-black">
          <div className="text-neon-green font-bold mb-2">Your Ship</div>
          <div className="text-sm space-y-1">
            <div>Hull: {playerShip.hull} / {/* Need to get max hull */}</div>
            <div>Shields: {playerShip.shieldStrength.reduce((a, b) => Math.max(a, b), 0)}</div>
            <div>Weapons: {playerShip.weapon.filter(w => w >= 0).length}</div>
            <div>Fuel: {playerShip.fuel}</div>
          </div>
        </div>

        {/* Opponent Ship */}
        <div className="space-panel bg-space-black">
          <div className="text-neon-red font-bold mb-2">Opponent</div>
          <div className="text-sm space-y-1">
            <div>Hull: {opponentShip.hull}</div>
            <div>Shields: {opponentShip.shieldStrength.reduce((a, b) => Math.max(a, b), 0)}</div>
            <div>Weapons: {opponentShip.weapon.filter(w => w >= 0).length}</div>
            <div>Type: Unknown</div>
          </div>
        </div>
      </div>

      {/* Action Result */}
      {actionResult && (
        <div className="space-panel bg-space-black mb-4">
          <div className="text-neon-amber font-bold mb-2">Combat Log:</div>
          <div className="text-sm text-palm-gray">{actionResult}</div>
        </div>
      )}

      {/* Combat Actions */}
      <div className="space-panel bg-space-black">
        <div className="text-neon-amber font-bold mb-4 text-center">Choose Your Action</div>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Primary Actions */}
          <button 
            onClick={handleAttack}
            className="neon-button h-16 flex flex-col items-center justify-center bg-red-900 border-red-500 hover:bg-red-800"
          >
            <div className="text-lg">⚔️</div>
            <div className="text-sm">Attack</div>
          </button>
          
          <button 
            onClick={handleFlee}
            className="neon-button h-16 flex flex-col items-center justify-center bg-yellow-900 border-yellow-500 hover:bg-yellow-800"
          >
            <div className="text-lg">🏃</div>
            <div className="text-sm">Flee</div>
          </button>
          
          <button 
            onClick={handleSurrender}
            className="neon-button h-16 flex flex-col items-center justify-center bg-gray-900 border-gray-500 hover:bg-gray-800"
          >
            <div className="text-lg">🏳️</div>
            <div className="text-sm">Surrender</div>
          </button>
          
          <button 
            onClick={handleIgnore}
            className="neon-button h-16 flex flex-col items-center justify-center bg-blue-900 border-blue-500 hover:bg-blue-800"
          >
            <div className="text-lg">👁️</div>
            <div className="text-sm">Ignore</div>
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <button 
            onClick={handleSubmit}
            className="neon-button h-12 flex items-center justify-center text-sm bg-green-900 border-green-500 hover:bg-green-800"
          >
            📋 Submit to Inspection
          </button>
          
          <button 
            onClick={handleBribe}
            className="neon-button h-12 flex items-center justify-center text-sm bg-purple-900 border-purple-500 hover:bg-purple-800"
          >
            💰 Attempt Bribe
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div className="text-xs text-palm-gray text-center mt-4">
        Choose your action carefully. Different encounter types respond to different approaches.
      </div>
    </div>
  );
}
