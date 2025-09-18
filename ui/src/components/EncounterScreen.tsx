// Encounter Screen - Handle combat and encounters
import React, { useState, useEffect } from 'react';
import { getCurrentEncounter, getAvailableActions } from '../../../ts/combat/engine.ts';
import { getSolarSystemName } from '@game-data/systems.ts';
import { getShipType } from '@game-data/shipTypes.ts';
import type { State } from '@game-types';

interface EncounterScreenProps {
  state: State;
  onAction: (action: any) => Promise<any>;
}

export function EncounterScreen({ state, onAction }: EncounterScreenProps) {
  const [actionResult, setActionResult] = useState<string>('');
  const [showResolutionModal, setShowResolutionModal] = useState<boolean>(false);
  const [resolutionMessage, setResolutionMessage] = useState<string>('');
  
  const encounter = getCurrentEncounter(state);
  const opponentShip = state.opponent;
  const playerShip = state.ship;
  const availableActions = getAvailableActions(state);
  
  // Debug logging to understand the issue
  console.log('🔍 Encounter Debug Info:', {
    encounterType: state.encounterType,
    currentMode: state.currentMode,
    availableActions,
    encounter,
    opponentType: state.opponent?.type
  });
  
  // Get ship type information
  const playerShipType = getShipType(playerShip.type);
  const opponentShipType = getShipType(opponentShip.type);
  
  // Calculate hull percentages
  const playerHullPercent = Math.round((playerShip.hull / playerShipType.hullStrength) * 100);
  const opponentHullPercent = Math.round((opponentShip.hull / opponentShipType.hullStrength) * 100);
  
  // Calculate shield status
  const playerMaxShields = playerShip.shieldStrength.reduce((a, b) => a + b, 0);
  const playerCurrentShields = playerShip.shieldStrength.reduce((a, b) => Math.max(a, b), 0);
  const opponentMaxShields = opponentShip.shieldStrength.reduce((a, b) => a + b, 0);
  const opponentCurrentShields = opponentShip.shieldStrength.reduce((a, b) => Math.max(a, b), 0);
  
  const playerShieldPercent = playerMaxShields > 0 ? Math.round((playerCurrentShields / playerMaxShields) * 100) : 0;
  const opponentShieldPercent = opponentMaxShields > 0 ? Math.round((opponentCurrentShields / opponentMaxShields) * 100) : 0;
  
  // Generate encounter description like Palm OS: "a police gnat" or "a pirate firefly"
  const getEncounterDescription = () => {
    const shipName = opponentShipType.name.toLowerCase();
    
    // Police encounters (0-9)
    if (encounter.type >= 0 && encounter.type <= 9) {
      return `a police ${shipName}`;
    }
    // Pirate encounters (10-19)  
    else if (encounter.type >= 10 && encounter.type <= 19) {
      if (opponentShipType.name === 'Mantis') {
        return `an alien ${shipName}`;
      }
      return `a pirate ${shipName}`;
    }
    // Trader encounters (20-29)
    else if (encounter.type >= 20 && encounter.type <= 29) {
      return `a trader ${shipName}`;
    }
    // Special encounters
    else if (encounter.type === 80) { // MARIECELESTEENCOUNTER
      return 'the Marie Celeste';
    }
    else if (encounter.type >= 70 && encounter.type <= 74) { // Famous captains
      return 'a famous captain';
    }
    else if (encounter.type >= 90 && encounter.type <= 91) { // Bottle encounters
      return 'a rare bottle';
    }
    else {
      return `a ${shipName}`;
    }
  };
  
  // Generate encounter location text: "At X clicks from Y, you encounter Z"
  const destinationName = getSolarSystemName(state.warpSystem);
  const locationText = `At ${state.clicks} clicks from ${destinationName}, you encounter ${getEncounterDescription()}.`;
  
  // Generate flavor text based on encounter type
  const getFlavorText = () => {
    switch (encounter.type) {
      case 0: // POLICEINSPECTION
        return "The police summon you to submit to an inspection.";
      case 1: // POLICEIGNORE
      case 12: // PIRATEIGNORE  
      case 20: // TRADERIGNORE
      case 31: // SPACEMONSTERIGNORE
      case 41: // DRAGONFLYIGNORE
      case 61: // SCARABIGNORE
        // TODO: Check if player is cloaked, show "It doesn't notice you." if cloaked
        return "It ignores you.";
      case 2: // POLICEATTACK  
        return "The police hail they want you to surrender.";
      case 10: // PIRATEATTACK
        return "Your opponent attacks.";
      case 11: // PIRATEFLEE
        return "Your opponent is fleeing.";
      case 13: // PIRATESURRENDER
        return "Your opponent hails that he surrenders to you.";
      case 24: // TRADERSELL
      case 25: // TRADERBUY
        return "You are hailed with an offer to trade goods.";
      default:
        return "Your opponent awaits your decision.";
    }
  };
  
  const handleCombatAction = async (action: string) => {
    try {
      const result = await onAction({
        type: `combat_${action}`,
        parameters: {}
      });
      
      if (result.success) {
        const message = result.message || `${action} successful`;
        
        // Check if this action ended the encounter (encounterType became -1)
        if (state.encounterType === -1 && message && 
            (message.includes('continued on your way') || 
             message.includes('managed to escape') ||
             message.includes('Trade completed') ||
             message.includes('successful'))) {
          // Show modal for successful encounter resolution
          setResolutionMessage(message);
          setShowResolutionModal(true);
        } else {
          setActionResult(message);
        }
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
    <div className="flex flex-col h-full bg-space-black text-palm-green font-mono">
      {/* Two-column ship status */}
      <div className="grid grid-cols-2 gap-4 p-2 border-b border-space-blue">
        {/* Your Ship */}
        <div>
          <div className="text-neon-cyan text-xs font-bold text-center mb-2">You</div>
          <div className="text-xs space-y-1">
            <div className="text-center font-bold">{playerShipType.name}</div>
            <div>Hull at {playerHullPercent}%</div>
            <div>
              {playerMaxShields > 0 ? `Shields at ${playerShieldPercent}%` : 'No shields'}
            </div>
          </div>
        </div>
        
        {/* Opponent Ship */}
        <div>
          <div className="text-neon-red text-xs font-bold text-center mb-2">Opponent</div>
          <div className="text-xs space-y-1">
            <div className="text-center font-bold">{opponentShipType.name}</div>
            <div>Hull at {opponentHullPercent}%</div>
            <div>
              {opponentMaxShields > 0 ? `Shields at ${opponentShieldPercent}%` : 'No shields'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Location text */}
      <div className="p-2 border-b border-space-blue">
        <div className="text-xs text-palm-gray text-center">
          {locationText}
        </div>
      </div>
      
      {/* Flavor text */}
      <div className="p-2 border-b border-space-blue">
        <div className="text-xs text-neon-amber text-center">
          {getFlavorText()}
        </div>
      </div>
      
      {/* Action Result */}
      {actionResult && (
        <div className="p-2 border-b border-space-blue">
          <div className="text-xs text-palm-gray text-center">{actionResult}</div>
        </div>
      )}
      
      {/* Available Actions */}
      <div className="flex-1 p-2">
        {availableActions.length === 0 ? (
          <div className="text-center text-neon-red p-4">
            <div className="text-sm">No actions available</div>
            <div className="text-xs text-palm-gray mt-2">
              Debug: encounterType={state.encounterType}, mode={state.currentMode}
            </div>
            <button 
              onClick={() => onAction({ type: 'combat_continue', parameters: {} })}
              className="compact-button bg-green-900 border-green-500 hover:bg-green-800 mt-3"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {availableActions.map((action) => {
            const getActionInfo = (action: string) => {
            switch (action) {
            case 'attack': return { label: 'Attack', color: 'bg-red-900 border-red-500 hover:bg-red-800' };
            case 'flee': return { label: 'Flee', color: 'bg-yellow-900 border-yellow-500 hover:bg-yellow-800' };
            case 'surrender': return { label: 'Surrender', color: 'bg-gray-900 border-gray-500 hover:bg-gray-800' };
            case 'ignore': return { label: 'Ignore', color: 'bg-blue-900 border-blue-500 hover:bg-blue-800' };
            case 'submit': return { label: 'Submit to Inspection', color: 'bg-green-900 border-green-500 hover:bg-green-800' };
            case 'bribe': return { label: 'Attempt Bribe', color: 'bg-purple-900 border-purple-500 hover:bg-purple-800' };
            case 'trade': return { label: 'Trade', color: 'bg-cyan-900 border-cyan-500 hover:bg-cyan-800' };
            case 'board': return { label: 'Board Ship', color: 'bg-green-900 border-green-500 hover:bg-green-800' };
            case 'drink': return { label: 'Drink', color: 'bg-blue-900 border-blue-500 hover:bg-blue-800' };
            case 'plunder': return { label: 'Plunder', color: 'bg-orange-900 border-orange-500 hover:bg-orange-800' };
            case 'yield': return { label: 'Yield', color: 'bg-gray-900 border-gray-500 hover:bg-gray-800' };
            case 'meet': return { label: 'Meet', color: 'bg-teal-900 border-teal-500 hover:bg-teal-800' };
            case 'continue': return { label: 'Continue', color: 'bg-green-900 border-green-500 hover:bg-green-800' };
              default: return { label: action, color: 'bg-space-dark border-space-blue hover:bg-space-blue' };
              }
              };
            
            const actionInfo = getActionInfo(action);
            
            return (
              <button 
                key={action}
                onClick={() => handleCombatAction(action)}
                className={`compact-button ${actionInfo.color}`}
              >
                {actionInfo.label}
              </button>
            );
          })}
          </div>
        )}
      </div>
      
      {/* Encounter Resolution Modal */}
      {showResolutionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-space-dark border border-neon-green rounded p-4 max-w-sm mx-4">
            <div className="text-neon-green font-bold mb-2">Encounter Resolved</div>
            <div className="text-palm-gray text-sm mb-4">{resolutionMessage}</div>
            <button
              onClick={async () => {
                setShowResolutionModal(false);
                setResolutionMessage('');
                // Execute the continue action to properly end the encounter
                await onAction({ type: 'combat_continue', parameters: {} });
              }}
              className="compact-button w-full bg-neon-green text-black hover:bg-green-400"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
