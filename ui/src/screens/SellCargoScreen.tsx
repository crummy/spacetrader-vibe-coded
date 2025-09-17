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

  // Build cargo items list - show ALL goods
  const cargoItems: CargoItem[] = useMemo(() => {
    const items: CargoItem[] = [];
    for (let i = 0; i < 10; i++) { // 10 trade items total
      const ownedQty = actualState.ship.cargo[i];
      const tradeItem = getTradeItem(i);
      const price = allPrices[i].sellPrice;
      
      // Show all items, regardless of ownership
      items.push({
        id: i,
        name: tradeItem.name,
        ownedQty,
        price
      });
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

      {/* Compact header with cargo status */}
      <div className="bg-space-black border border-space-blue rounded p-1 mb-2" data-testid="cargo-status">
        <div className="text-xs text-palm-gray">
          Cargo: {filledCargoBays}/{totalCargoBays} • Free: {totalCargoBays - filledCargoBays}
        </div>
      </div>

      {/* Cargo Items List */}
      <div className="space-y-1">{/* Removed panel wrapper to save space */}
        {cargoItems.map((item) => {
          const canSell = sellCargoAvailable && item.ownedQty > 0 && item.price > 0;
          const hasCargoButCantSell = item.ownedQty > 0 && item.price <= 0;
          
          return (
            <button
                key={item.id}
                onClick={() => canSell ? handleItemSelect(item.id) : undefined}
                disabled={!canSell}
                data-testid={`trade-item-${item.name.toLowerCase()}`}
                className={`w-full p-1 text-left rounded border transition-all duration-200 ${
                  !canSell 
                    ? 'border-space-gray border-opacity-30 opacity-50 cursor-not-allowed'
                    : selectedItem === item.id
                      ? 'border-neon-cyan bg-neon-cyan bg-opacity-10'
                      : 'border-palm-gray hover:border-neon-cyan border-opacity-30'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <span className={`text-sm font-semibold ${canSell ? 'text-neon-cyan' : 'text-space-gray'}`}>
                      {item.name}
                    </span>
                    <span className="text-xs text-palm-gray ml-2">Own: {item.ownedQty}</span>
                  </div>
                  <div className={canSell ? "text-neon-green font-bold text-sm" : "text-space-gray font-bold text-sm"}>
                    {item.price > 0 ? `${item.price.toLocaleString()}cr` : 'no trade'}
                  </div>
                </div>
              </button>
            );
          })}
      </div>

      {/* Sale Controls */}
      {selectedCargoItem && selectedCargoItem.price > 0 && (
        <div className="bg-space-black border border-space-blue rounded p-2 mb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-neon-amber text-sm">{selectedCargoItem.name}</div>
            <div className="flex items-center gap-1">
              <button onClick={() => handleQuantityChange(-1)} className="compact-button px-2" disabled={quantity <= 1}>-</button>
              <span className="text-neon-cyan font-bold text-sm w-8 text-center">{quantity}</span>
              <button onClick={() => handleQuantityChange(1)} className="compact-button px-2" disabled={quantity >= selectedCargoItem.ownedQty}>+</button>
              <button onClick={handleMaxQuantity} className="compact-button text-xs">All</button>
            </div>
          </div>
          <div className="text-xs text-palm-gray mb-2">
            Revenue: <span className="text-neon-green">{(quantity * selectedCargoItem.price).toLocaleString()}cr</span> • 
            Max: {getMaxSellable(selectedCargoItem)}
          </div>
          <button
            onClick={handleSale}
            disabled={quantity > selectedCargoItem.ownedQty || quantity <= 0}
            data-testid="sell-button"
            className="compact-button w-full disabled:opacity-50"
          >
            Sell {quantity} units
          </button>
        </div>
      )}

      {/* No Sale Available */}
      {selectedCargoItem && selectedCargoItem.price <= 0 && (
        <div className="text-xs p-1 rounded mb-1 text-red-300 bg-red-900">
          {selectedCargoItem.name} cannot be sold here.
        </div>
      )}

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
    </div>
  );
}
