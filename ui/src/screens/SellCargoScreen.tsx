// Sell Cargo Screen - Full trading functionality
import React, { useState, useMemo } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.ts';
import { getUiFields } from '@game-ui';
import { getTradeItem } from '@game-data/tradeItems.ts';
import { getAllSystemPrices } from '../../../ts/economy/pricing.ts';
import { getTotalCargoBays, getFilledCargoBays } from '../../../ts/economy/trading.ts';
import type { ScreenProps } from '../types.ts';

interface CargoItem {
  id: number;
  name: string;
  ownedQty: number;
  price: number;
}

export function SellCargoScreen({ onNavigate, onBack, state, onAction, availableActions }: ScreenProps) {
  // Fall back to useGameEngine if props aren't provided (backwards compatibility)
  const gameEngine = useGameEngine();
  const actualState = state || gameEngine.state;
  const actualExecuteAction = onAction || gameEngine.executeAction;
  const actualAvailableActions = availableActions || gameEngine.availableActions;

  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  // Debug: log current game mode and available actions
  console.log('Current game mode:', actualState.currentMode);
  console.log('Available actions:', actualAvailableActions);
  console.log('Sell cargo action available:', actualAvailableActions.some(a => a.type === 'sell_cargo' && a.available));

  // Calculate cargo space info
  const totalCargoBays = useMemo(() => getTotalCargoBays(actualState), [actualState]);
  const filledCargoBays = useMemo(() => getFilledCargoBays(actualState), [actualState]);

  // Get current system and prices
  const currentSystem = actualState.solarSystem[actualState.currentSystem];
  const allPrices = useMemo(() => 
    getAllSystemPrices(currentSystem, actualState.commanderTrader, actualState.policeRecordScore),
    [currentSystem, actualState.commanderTrader, actualState.policeRecordScore]
  );

  // Build cargo items list (only items the player owns)
  const cargoItems: CargoItem[] = useMemo(() => {
    const items: CargoItem[] = [];
    for (let i = 0; i < 10; i++) { // 10 trade items total
      const ownedQty = actualState.ship.cargo[i];
      if (ownedQty > 0) { // Only show items player owns
        const tradeItem = getTradeItem(i);
        const price = allPrices[i].sellPrice;
        
        items.push({
          id: i,
          name: tradeItem.name,
          ownedQty,
          price
        });
      }
    }
    return items;
  }, [actualState.ship.cargo, allPrices]);

  const handleItemSelect = (itemId: number) => {
    setSelectedItem(itemId);
    setQuantity(1);
    setMessage('');
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  const getMaxSellable = (item: CargoItem): number => {
    if (!item) return 0;
    // Can sell all owned items
    return item.ownedQty;
  };

  const handleMaxQuantity = () => {
    if (selectedItem === null) return;
    const item = cargoItems.find(g => g.id === selectedItem);
    if (item) {
      const maxQty = getMaxSellable(item);
      setQuantity(maxQty);
    }
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
        setMessage('Successfully docked at planet. You can now trade.');
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

  const handleSale = async () => {
    if (selectedItem === null) return;

    const item = cargoItems.find(g => g.id === selectedItem);
    if (!item) return;

    // Check if sell_cargo action is available
    const sellCargoAction = actualAvailableActions.find(a => a.type === 'sell_cargo');
    if (!sellCargoAction || !sellCargoAction.available) {
      setMessage(`Trading not available (Current mode: ${actualState.currentMode}). You may need to dock at a planet first.`);
      setMessageType('error');
      return;
    }

    // Validation
    if (quantity <= 0) {
      setMessage('Invalid quantity');
      setMessageType('error');
      return;
    }

    if (quantity > item.ownedQty) {
      setMessage(`You only own ${item.ownedQty} units`);
      setMessageType('error');
      return;
    }

    if (item.price <= 0) {
      setMessage(`${item.name} cannot be sold at this location`);
      setMessageType('error');
      return;
    }

    const totalRevenue = quantity * item.price;

    try {
      const result = await actualExecuteAction({
        type: 'sell_cargo',
        parameters: {
          tradeItem: selectedItem,
          quantity: quantity
        }
      });

      if (result.success) {
        const actualQuantity = result.economyResult?.quantitySold || quantity;
        const actualRevenue = result.economyResult?.totalRevenue || totalRevenue;
        setMessage(`Successfully sold ${actualQuantity} units of ${item.name} for ${actualRevenue.toLocaleString()} credits`);
        setMessageType('success');
        setQuantity(1);
        
        // Clear selection if all units were sold
        if (actualQuantity >= item.ownedQty) {
          setSelectedItem(null);
        }
      } else {
        setMessage(result.message || 'Sale failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    }
  };

  const selectedCargoItem = selectedItem !== null ? cargoItems.find(g => g.id === selectedItem) : null;
  const sellCargoAvailable = actualAvailableActions.some(a => a.type === 'sell_cargo' && a.available);
  const dockAvailable = actualAvailableActions.some(a => a.type === 'dock_at_planet' && a.available);

  return (
    <div className="space-panel">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="neon-button">
          ← Back
        </button>
        <h2 className="retro-title text-lg">SELL CARGO</h2>
        <div className="text-neon-green font-bold">{actualState.credits.toLocaleString()} cr.</div>
      </div>

      {/* Dock Button if not docked */}
      {!sellCargoAvailable && dockAvailable && (
        <div className="space-panel bg-space-black mb-4">
          <div className="text-neon-amber mb-2">Not Docked:</div>
          <div className="text-sm text-palm-gray mb-3">
            You need to dock at a planet to access the trading post.
          </div>
          <button onClick={handleDock} className="neon-button w-full">
            🚀 Dock at Planet
          </button>
        </div>
      )}

      {/* Cargo Space Info */}
      <div className="space-panel bg-space-black mb-4">
        <div className="text-neon-amber mb-2">Cargo Bay Status:</div>
        <div className="text-sm text-palm-gray">
          <div>Used: {filledCargoBays}/{totalCargoBays} bays</div>
          <div>Free: {totalCargoBays - filledCargoBays} bays</div>
        </div>
      </div>

      {/* Cargo Items List */}
      <div className="space-panel bg-space-black mb-4">
        <div className="text-neon-amber mb-3">Your Cargo Hold:</div>
        <div className="space-y-2">
          {!sellCargoAvailable ? (
            <div className="text-palm-gray text-sm">Trading unavailable - must be docked at a planet.</div>
          ) : cargoItems.length === 0 ? (
            <div className="text-palm-gray text-sm">Your cargo hold is empty.</div>
          ) : (
            cargoItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemSelect(item.id)}
                className={`w-full p-2 text-left rounded border transition-all duration-200 ${
                  selectedItem === item.id
                    ? 'border-neon-cyan bg-neon-cyan bg-opacity-10'
                    : 'border-palm-gray hover:border-neon-cyan border-opacity-30'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-neon-cyan font-semibold">{item.name}</div>
                    <div className="text-xs text-palm-gray">
                      Owned: {item.ownedQty} units
                    </div>
                  </div>
                  <div className={item.price > 0 ? "text-neon-green font-bold" : "text-red-400 font-bold"}>
                    {item.price > 0 ? `${item.price.toLocaleString()} cr.` : 'N/A'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Sale Controls */}
      {selectedCargoItem && selectedCargoItem.price > 0 && (
        <div className="space-panel bg-space-black mb-4">
          <div className="text-neon-amber mb-3">Sell {selectedCargoItem.name}:</div>
          
          <div className="flex items-center gap-4 mb-3">
            <button 
              onClick={() => handleQuantityChange(-1)}
              className="neon-button px-3 py-1 text-sm"
              disabled={quantity <= 1}
            >
              -
            </button>
            
            <div className="text-center">
              <div className="text-neon-cyan font-bold text-lg">{quantity}</div>
              <div className="text-xs text-palm-gray">units</div>
            </div>
            
            <button 
              onClick={() => handleQuantityChange(1)}
              className="neon-button px-3 py-1 text-sm"
              disabled={quantity >= selectedCargoItem.ownedQty}
            >
              +
            </button>
            
            <button 
              onClick={handleMaxQuantity}
              className="neon-button px-3 py-1 text-sm"
            >
              All
            </button>
          </div>

          <div className="flex justify-between items-center mb-3">
            <div className="text-sm text-palm-gray">
              Total Revenue: <span className="text-neon-green font-bold">
                {(quantity * selectedCargoItem.price).toLocaleString()} cr.
              </span>
            </div>
            <div className="text-sm text-palm-gray">
              Max: {getMaxSellable(selectedCargoItem)} units
            </div>
          </div>

          <button
            onClick={handleSale}
            disabled={quantity > selectedCargoItem.ownedQty || quantity <= 0}
            className="neon-button w-full py-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sell {quantity} {selectedCargoItem.name}
          </button>
        </div>
      )}

      {/* No Sale Available */}
      {selectedCargoItem && selectedCargoItem.price <= 0 && (
        <div className="space-panel bg-red-900 border-red-500 mb-4">
          <div className="text-red-300 text-sm">
            {selectedCargoItem.name} cannot be sold at this location.
          </div>
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
