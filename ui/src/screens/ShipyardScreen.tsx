// Shipyard Screen - Full ship purchasing functionality
import React, { useState, useMemo } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.ts';
import { getUiFields } from '@game-ui';
import { getShipType } from '@game-data/shipTypes.ts';
import { getAvailableShipsForPurchase, calculateShipTradeInValue } from '../../../ts/economy/ship-pricing.ts';
import { getTotalCargoBays, getFilledCargoBays } from '../../../ts/economy/trading.ts';
import type { ScreenProps } from '../types.ts';

interface ShipOption {
  shipType: number;
  name: string;
  netPrice: number;
  basePrice: number;
  tradeInValue: number;
  canAfford: boolean;
  shipData: any;
}

export function ShipyardScreen({ onNavigate, onBack, state, onAction, availableActions }: ScreenProps) {
  // Fall back to useGameEngine if props aren't provided (backwards compatibility)
  const gameEngine = useGameEngine();
  const actualState = state || gameEngine.state;
  const actualExecuteAction = onAction || gameEngine.executeAction;
  const actualAvailableActions = availableActions || gameEngine.availableActions;

  const [selectedShip, setSelectedShip] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const currentShipType = getShipType(actualState.ship.type);
  const tradeInValue = useMemo(() => calculateShipTradeInValue(actualState), [actualState]);
  
  // Calculate cargo space info
  const totalCargoBays = useMemo(() => getTotalCargoBays(actualState), [actualState]);
  const filledCargoBays = useMemo(() => getFilledCargoBays(actualState), [actualState]);

  // Get available ships for purchase
  const availableShips: ShipOption[] = useMemo(() => {
    return getAvailableShipsForPurchase(actualState).map(ship => ({
      ...ship,
      shipData: getShipType(ship.shipType)
    }));
  }, [actualState]);

  const handleShipSelect = (shipTypeIndex: number) => {
    setSelectedShip(shipTypeIndex);
    setMessage('');
  };

  const handleDock = async () => {
    try {
      setMessage('Docking at planet...');
      setMessageType('info');
      
      const result = await actualExecuteAction({
        type: 'dock_at_planet',
        parameters: {}
      });

      if (result.success) {
        setMessage('Successfully docked at planet. You can now visit the shipyard.');
        setMessageType('success');
      } else {
        setMessage(`Failed to dock: ${result.message}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Docking error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    }
  };

  const handlePurchase = async () => {
    if (selectedShip === null) return;

    const ship = availableShips.find(s => s.shipType === selectedShip);
    if (!ship) return;

    // Check if buy_ship action is available
    const buyShipAction = actualAvailableActions.find(a => a.type === 'buy_ship');
    if (!buyShipAction || !buyShipAction.available) {
      setMessage(`Shipyard not available. You may need to dock at a planet first.`);
      setMessageType('error');
      return;
    }

    // Validation
    if (!ship.canAfford) {
      setMessage(`Insufficient credits (need ${ship.netPrice.toLocaleString()}, have ${actualState.credits.toLocaleString()})`);
      setMessageType('error');
      return;
    }

    if (actualState.debt > 0) {
      setMessage('Cannot purchase ship while in debt');
      setMessageType('error');
      return;
    }

    try {
      const result = await actualExecuteAction({
        type: 'buy_ship',
        parameters: {
          shipType: selectedShip
        }
      });

      if (result.success) {
        setMessage(`Successfully purchased ${ship.name}! Your old ship was traded in for ${tradeInValue.toLocaleString()} credits.`);
        setMessageType('success');
        setSelectedShip(null);
      } else {
        setMessage(result.message || 'Purchase failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    }
  };

  const selectedShipData = selectedShip !== null ? availableShips.find(s => s.shipType === selectedShip) : null;
  const buyShipAvailable = actualAvailableActions.some(a => a.type === 'buy_ship' && a.available);
  const dockAvailable = actualAvailableActions.some(a => a.type === 'dock_at_planet' && a.available);

  return (
    <div className="space-panel">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="neon-button">
          ← Back
        </button>
        <h2 className="retro-title text-lg">SHIPYARD</h2>
        <div className="text-neon-green font-bold">{actualState.credits.toLocaleString()} cr.</div>
      </div>

      {/* Dock Button if not docked */}
      {!buyShipAvailable && dockAvailable && (
        <div className="space-panel bg-space-black mb-4">
          <div className="text-neon-amber mb-2">Not Docked:</div>
          <div className="text-sm text-palm-gray mb-3">
            You need to dock at a planet to access the shipyard.
          </div>
          <button onClick={handleDock} className="neon-button w-full">
            🚀 Dock at Planet
          </button>
        </div>
      )}

      {/* Current Ship Info */}
      <div className="space-panel bg-space-black mb-4">
        <div className="text-neon-amber mb-2">Current Ship - {currentShipType.name}:</div>
        <div className="text-sm text-palm-gray space-y-1">
          <div className="flex justify-between">
            <span>Hull:</span>
            <span>{actualState.ship.hull}/{currentShipType.hullStrength}</span>
          </div>
          <div className="flex justify-between">
            <span>Cargo:</span>
            <span>{filledCargoBays}/{totalCargoBays} bays</span>
          </div>
          <div className="flex justify-between">
            <span>Fuel:</span>
            <span>{actualState.ship.fuel}/{currentShipType.fuelTanks}</span>
          </div>
          <div className="flex justify-between">
            <span>Trade-in Value:</span>
            <span className="text-neon-green">{tradeInValue.toLocaleString()} cr.</span>
          </div>
        </div>
      </div>

      {/* Available Ships */}
      <div className="space-panel bg-space-black mb-4">
        <div className="text-neon-amber mb-3">Available Ships:</div>
        <div className="space-y-2">
          {!buyShipAvailable ? (
            <div className="text-palm-gray text-sm">Shipyard unavailable - must be docked at a planet.</div>
          ) : availableShips.length === 0 ? (
            <div className="text-palm-gray text-sm">No ships available for purchase.</div>
          ) : (
            availableShips.map((ship) => (
              <button
                key={ship.shipType}
                onClick={() => handleShipSelect(ship.shipType)}
                className={`w-full p-3 text-left rounded border transition-all duration-200 ${
                  selectedShip === ship.shipType
                    ? 'border-neon-cyan bg-neon-cyan bg-opacity-10'
                    : 'border-palm-gray hover:border-neon-cyan border-opacity-30'
                } ${!ship.canAfford ? 'opacity-60' : ''}`}
                disabled={!ship.canAfford}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="text-neon-cyan font-semibold text-lg">{ship.name}</div>
                  <div className={`font-bold ${ship.canAfford ? 'text-neon-green' : 'text-red-400'}`}>
                    {ship.netPrice.toLocaleString()} cr.
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-palm-gray">
                  <div>Cargo: {ship.shipData.cargoBays} bays</div>
                  <div>Hull: {ship.shipData.hullStrength}</div>
                  <div>Weapons: {ship.shipData.weaponSlots}</div>
                  <div>Shields: {ship.shipData.shieldSlots}</div>
                  <div>Gadgets: {ship.shipData.gadgetSlots}</div>
                  <div>Crew: {ship.shipData.crewQuarters}</div>
                </div>
                {!ship.canAfford && (
                  <div className="text-red-400 text-xs mt-1">Insufficient funds</div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Ship Details */}
      {selectedShipData && (
        <div className="space-panel bg-space-black mb-4">
          <div className="text-neon-amber mb-3">{selectedShipData.name} Details:</div>
          <div className="text-sm text-palm-gray space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-neon-cyan mb-1">Specifications:</div>
                <div className="space-y-1 text-xs">
                  <div>Cargo Bays: {selectedShipData.shipData.cargoBays}</div>
                  <div>Hull Strength: {selectedShipData.shipData.hullStrength}</div>
                  <div>Fuel Tanks: {selectedShipData.shipData.fuelTanks}</div>
                  <div>Crew Quarters: {selectedShipData.shipData.crewQuarters}</div>
                </div>
              </div>
              <div>
                <div className="text-neon-cyan mb-1">Equipment Slots:</div>
                <div className="space-y-1 text-xs">
                  <div>Weapons: {selectedShipData.shipData.weaponSlots}</div>
                  <div>Shields: {selectedShipData.shipData.shieldSlots}</div>
                  <div>Gadgets: {selectedShipData.shipData.gadgetSlots}</div>
                  <div>Tech Level: {selectedShipData.shipData.minTechLevel}</div>
                </div>
              </div>
            </div>
            <div className="border-t border-palm-gray border-opacity-30 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <div>
                  <div>Base Price: {selectedShipData.basePrice.toLocaleString()} cr.</div>
                  <div>Trade-in Value: -{tradeInValue.toLocaleString()} cr.</div>
                </div>
                <div className="text-right">
                  <div className="text-neon-green font-bold text-lg">
                    Net Cost: {selectedShipData.netPrice.toLocaleString()} cr.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handlePurchase}
            disabled={!selectedShipData.canAfford || actualState.debt > 0}
            className="neon-button w-full py-2 font-semibold mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Purchase {selectedShipData.name}
          </button>
        </div>
      )}

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
