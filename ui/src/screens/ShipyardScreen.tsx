// Shipyard Screen - Main hub for ship services (fuel, repairs, escape pods, ship buying)
import React, { useState, useMemo } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.ts';
import { getUiFields } from '@game-ui';
import { getShipType } from '@game-data/shipTypes.ts';
import { getFuelStatus } from '../../../ts/economy/fuel.ts';
import type { ScreenProps } from '../types.ts';

export function ShipyardScreen({ onNavigate, onBack, state, onAction, availableActions }: ScreenProps) {
  // Fall back to useGameEngine if props aren't provided (backwards compatibility)
  const gameEngine = useGameEngine();
  const actualState = state || gameEngine.state;
  const actualExecuteAction = onAction || gameEngine.executeAction;
  const actualAvailableActions = availableActions || gameEngine.availableActions;

  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const currentShipType = getShipType(actualState.ship.type);
  const fuelStatus = useMemo(() => getFuelStatus(actualState), [actualState]);
  
  // Check available services
  const refuelAction = actualAvailableActions.find(a => a.type === 'refuel_ship');
  const repairAction = actualAvailableActions.find(a => a.type === 'repair_ship');
  const escapePodAction = actualAvailableActions.find(a => a.type === 'buy_escape_pod');
  const buyShipAction = actualAvailableActions.find(a => a.type === 'buy_ship');

  const handleRefuel = async () => {
    if (!refuelAction?.available) {
      setMessage('Refuel service not available');
      setMessageType('error');
      return;
    }

    try {
      const result = await actualExecuteAction({
        type: 'refuel_ship',
        parameters: {}
      });

      if (result.success) {
        setMessage(result.message);
        setMessageType('success');
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    }
  };

  const handleRepair = async () => {
    if (!repairAction?.available) {
      setMessage('Repair service not available');
      setMessageType('error');
      return;
    }

    try {
      const result = await actualExecuteAction({
        type: 'repair_ship',
        parameters: {}
      });

      if (result.success) {
        setMessage(result.message);
        setMessageType('success');
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    }
  };

  const handleBuyEscapePod = async () => {
    if (!escapePodAction?.available) {
      setMessage('Escape pod not available');
      setMessageType('error');
      return;
    }

    try {
      const result = await actualExecuteAction({
        type: 'buy_escape_pod',
        parameters: {}
      });

      if (result.success) {
        setMessage(result.message);
        setMessageType('success');
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    }
  };

  const handleBuyShips = () => {
    if (onNavigate) {
      onNavigate('ship-purchase');
    }
  };

  return (
    <div className="space-panel">
      
      {/* Ship Status */}
      <div className="space-panel bg-space-black mb-4">
        <div className="text-neon-amber mb-3">Current Ship Status:</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-neon-cyan">{currentShipType.name}</div>
            <div className="text-palm-gray">Hull: {actualState.ship.hull}/{currentShipType.hullStrength}</div>
          </div>
          <div>
            <div className="text-neon-cyan">Fuel Status</div>
            <div className="text-palm-gray">
              {fuelStatus.currentFuel}/{fuelStatus.maxFuel} units
              {fuelStatus.currentFuel < fuelStatus.maxFuel && (
                <div className="text-neon-amber text-xs">
                  Refill cost: {fuelStatus.fullRefuelCost} cr.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="space-panel bg-space-black mb-4">
        <div className="text-neon-amber mb-3">Shipyard Services:</div>
        <div className="space-y-3">
          
          {/* Refuel */}
          <div className="flex items-center justify-between p-3 rounded border border-palm-gray border-opacity-30">
            <div>
              <div className="text-neon-cyan">Refuel Ship</div>
              <div className="text-xs text-palm-gray">
                {fuelStatus.currentFuel >= fuelStatus.maxFuel 
                  ? 'Fuel tanks are full'
                  : `Fill tanks for ${fuelStatus.fullRefuelCost} credits`
                }
              </div>
            </div>
            <button
              onClick={handleRefuel}
              disabled={!refuelAction?.available}
              className={`px-4 py-2 rounded text-sm border transition-all duration-200 ${
                refuelAction?.available
                  ? 'neon-button'
                  : 'border-palm-gray border-opacity-30 text-palm-gray cursor-not-allowed'
              }`}
            >
              {fuelStatus.currentFuel >= fuelStatus.maxFuel ? 'Full' : 'Refuel'}
            </button>
          </div>

          {/* Repair */}
          <div className="flex items-center justify-between p-3 rounded border border-palm-gray border-opacity-30">
            <div>
              <div className="text-neon-cyan">Repair Ship</div>
              <div className="text-xs text-palm-gray">
                {actualState.ship.hull >= currentShipType.hullStrength
                  ? 'Ship is fully repaired'
                  : `Repair hull damage`
                }
              </div>
            </div>
            <button
              onClick={handleRepair}
              disabled={!repairAction?.available}
              className={`px-4 py-2 rounded text-sm border transition-all duration-200 ${
                repairAction?.available
                  ? 'neon-button'
                  : 'border-palm-gray border-opacity-30 text-palm-gray cursor-not-allowed'
              }`}
            >
              {actualState.ship.hull >= currentShipType.hullStrength ? 'Repaired' : 'Repair'}
            </button>
          </div>

          {/* Escape Pod */}
          <div className="flex items-center justify-between p-3 rounded border border-palm-gray border-opacity-30">
            <div>
              <div className="text-neon-cyan">Escape Pod</div>
              <div className="text-xs text-palm-gray">
                {actualState.ship.escapePod 
                  ? 'Escape pod installed'
                  : 'Buy escape pod for 2,000 cr.'
                }
              </div>
            </div>
            <button
              onClick={handleBuyEscapePod}
              disabled={!escapePodAction?.available || actualState.ship.escapePod}
              className={`px-4 py-2 rounded text-sm border transition-all duration-200 ${
                escapePodAction?.available && !actualState.ship.escapePod
                  ? 'neon-button'
                  : 'border-palm-gray border-opacity-30 text-palm-gray cursor-not-allowed'
              }`}
            >
              {actualState.ship.escapePod ? 'Installed' : 'Buy'}
            </button>
          </div>

          {/* Buy Ships */}
          <div className="flex items-center justify-between p-3 rounded border border-palm-gray border-opacity-30">
            <div>
              <div className="text-neon-cyan">Ship Trading</div>
              <div className="text-xs text-palm-gray">
                Browse available ships for purchase
              </div>
            </div>
            <button
              onClick={handleBuyShips}
              disabled={!buyShipAction?.available}
              className={`px-4 py-2 rounded text-sm border transition-all duration-200 ${
                buyShipAction?.available
                  ? 'neon-button'
                  : 'border-palm-gray border-opacity-30 text-palm-gray cursor-not-allowed'
              }`}
            >
              Buy Ships
            </button>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`space-panel mb-4 ${
          messageType === 'success' ? 'bg-green-900 border-green-500' :
          messageType === 'error' ? 'bg-red-900 border-red-500' :
          'bg-space-black border-neon-amber'
        }`}>
          <div className={`text-sm ${
            messageType === 'success' ? 'text-green-300' :
            messageType === 'error' ? 'text-red-300' :
            'text-neon-amber'
          }`}>
            {message}
          </div>
        </div>
      )}
    </div>
  );
}
