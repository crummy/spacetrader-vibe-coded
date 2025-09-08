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
  const [showModal, setShowModal] = useState<boolean>(false);
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
    setShowModal(true);
    setMessage('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedShip(null);
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
        setMessage(`Successfully purchased ${ship.name}!`);
        setMessageType('success');
        setSelectedShip(null);
        setShowModal(false);
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

      {/* Current Ship Info - Compact */}
      <div className="bg-space-black border border-space-blue rounded p-1 mb-2">
        <div className="text-xs text-palm-gray">
          Current: {currentShipType.name} • Hull: {actualState.ship.hull}/{currentShipType.hullStrength} • Trade-in: <span className="text-neon-green">{tradeInValue.toLocaleString()}cr</span>
        </div>
      </div>

      {/* Available Ships - Compact List */}
      <div className="space-y-1">{/* Removed panel wrapper to save space */}
        {!buyShipAvailable ? (
          <div className="text-palm-gray text-sm p-2">Shipyard unavailable - must be docked at a planet.</div>
        ) : availableShips.length === 0 ? (
          <div className="text-palm-gray text-sm p-2">No ships available for purchase.</div>
        ) : (
          availableShips.map((ship) => (
            <button
              key={ship.shipType}
              onClick={() => handleShipSelect(ship.shipType)}
              className={`w-full p-1 text-left rounded border transition-all duration-200 border-palm-gray hover:border-neon-cyan border-opacity-30 ${!ship.canAfford ? 'opacity-60' : ''}`}
            >
              <div className="flex justify-between items-center">
                <span className="text-neon-cyan text-sm font-semibold">{ship.name}</span>
                <div className={`font-bold text-sm ${ship.canAfford ? 'text-neon-green' : 'text-red-400'}`}>
                  {ship.netPrice.toLocaleString()}cr
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Compact Message */}
      {message && (
        <div className={`text-xs p-1 rounded mb-1 ${
          messageType === 'success' ? 'text-green-300 bg-green-900' :
          messageType === 'error' ? 'text-red-300 bg-red-900' :
          'text-neon-amber bg-space-black'
        }`}>
          {message}
        </div>
      )}

      {/* Ship Details Modal */}
      {showModal && selectedShipData && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={handleCloseModal}>
          <div className="bg-space-dark border border-neon-cyan rounded p-4 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-neon-amber font-bold">{selectedShipData.name}</h3>
              <button onClick={handleCloseModal} className="text-palm-gray hover:text-neon-red text-lg">×</button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div>
                <div className="text-neon-cyan mb-1">Specs:</div>
                <div className="space-y-0.5 text-palm-gray">
                  <div>Cargo: {selectedShipData.shipData.cargoBays} bays</div>
                  <div>Hull: {selectedShipData.shipData.hullStrength}</div>
                  <div>Fuel: {selectedShipData.shipData.fuelTanks} tanks</div>
                  <div>Crew: {selectedShipData.shipData.crewQuarters}</div>
                </div>
              </div>
              <div>
                <div className="text-neon-cyan mb-1">Equipment:</div>
                <div className="space-y-0.5 text-palm-gray">
                  <div>Weapons: {selectedShipData.shipData.weaponSlots}</div>
                  <div>Shields: {selectedShipData.shipData.shieldSlots}</div>
                  <div>Gadgets: {selectedShipData.shipData.gadgetSlots}</div>
                  <div>Tech Level: {selectedShipData.shipData.minTechLevel}</div>
                </div>
              </div>
            </div>

            <div className="border-t border-palm-gray border-opacity-30 pt-3 mb-4">
              <div className="text-xs text-palm-gray space-y-1">
                <div className="flex justify-between">
                  <span>Base Price:</span>
                  <span>{selectedShipData.basePrice.toLocaleString()} cr</span>
                </div>
                <div className="flex justify-between">
                  <span>Trade-in Value:</span>
                  <span className="text-neon-green">-{tradeInValue.toLocaleString()} cr</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Net Cost:</span>
                  <span className="text-neon-green">{selectedShipData.netPrice.toLocaleString()} cr</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleCloseModal} className="compact-button flex-1">
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={!selectedShipData.canAfford || actualState.debt > 0}
                className="compact-button flex-1 disabled:opacity-50"
              >
                Buy Ship
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
