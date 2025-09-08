// Buy Cargo Screen - Full trading functionality
import React, { useState, useMemo } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.ts';
import { getUiFields } from '@game-ui';
import { getTradeItem } from '@game-data/tradeItems.ts';
import { getAllSystemPrices } from '../../../ts/economy/pricing.ts';
import { getTotalCargoBays, getFilledCargoBays } from '../../../ts/economy/trading.ts';
import type { ScreenProps } from '../types.ts';

interface TradeGood {
  id: number;
  name: string;
  availableQty: number;
  price: number;
  playerOwned: number;
}

export function BuyCargoScreen({ onNavigate, onBack, state, onAction, availableActions }: ScreenProps) {
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
  console.log('Buy cargo action available:', actualAvailableActions.some(a => a.type === 'buy_cargo' && a.available));

  // Calculate cargo space info
  const totalCargoBays = useMemo(() => getTotalCargoBays(actualState), [actualState]);
  const filledCargoBays = useMemo(() => getFilledCargoBays(actualState), [actualState]);
  const availableCargoBays = totalCargoBays - filledCargoBays - (actualState.options.leaveEmpty || 0);

  // Get current system and prices
  const currentSystem = actualState.solarSystem[actualState.currentSystem];
  const allPrices = useMemo(() => 
    getAllSystemPrices(currentSystem, actualState.commanderTrader, actualState.policeRecordScore),
    [currentSystem, actualState.commanderTrader, actualState.policeRecordScore]
  );

  // Build trade goods list
  const tradeGoods: TradeGood[] = useMemo(() => {
    const goods: TradeGood[] = [];
    for (let i = 0; i < 10; i++) { // 10 trade items total
      const tradeItem = getTradeItem(i);
      const availableQty = currentSystem.qty[i];
      const price = allPrices[i].buyPrice;
      const playerOwned = actualState.ship.cargo[i];

      if (price > 0) { // Only show items available for purchase
        goods.push({
          id: i,
          name: tradeItem.name,
          availableQty,
          price,
          playerOwned
        });
      }
    }
    return goods;
  }, [currentSystem, allPrices, actualState.ship.cargo]);

  const handleItemSelect = (itemId: number) => {
    setSelectedItem(itemId);
    setQuantity(1);
    setMessage('');
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  const getMaxAffordable = (item: TradeGood): number => {
    if (!item) return 0;
    
    const maxByCredits = Math.floor(actualState.credits / item.price);
    const maxBySpace = availableCargoBays;
    const maxByAvailable = item.availableQty;
    
    return Math.min(maxByCredits, maxBySpace, maxByAvailable);
  };

  const handleMaxQuantity = () => {
    if (selectedItem === null) return;
    const item = tradeGoods.find(g => g.id === selectedItem);
    if (item) {
      const maxQty = getMaxAffordable(item);
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

  const handlePurchase = async () => {
    if (selectedItem === null) return;

    const item = tradeGoods.find(g => g.id === selectedItem);
    if (!item) return;

    // Check if buy_cargo action is available
    const buyCargoAction = actualAvailableActions.find(a => a.type === 'buy_cargo');
    if (!buyCargoAction || !buyCargoAction.available) {
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

    if (quantity > item.availableQty) {
      setMessage(`Only ${item.availableQty} units available`);
      setMessageType('error');
      return;
    }

    if (quantity > availableCargoBays) {
      setMessage(`Insufficient cargo space (${availableCargoBays} bays free)`);
      setMessageType('error');
      return;
    }

    const totalCost = quantity * item.price;
    if (totalCost > actualState.credits) {
      setMessage(`Insufficient credits (need ${totalCost.toLocaleString()}, have ${actualState.credits.toLocaleString()})`);
      setMessageType('error');
      return;
    }

    try {
      const result = await actualExecuteAction({
        type: 'buy_cargo',
        parameters: {
          tradeItem: selectedItem,
          quantity: quantity
        }
      });

      if (result.success) {
        const actualQuantity = result.economyResult?.quantityBought || quantity;
        const actualCost = result.economyResult?.totalCost || totalCost;
        setMessage(`Successfully bought ${actualQuantity} units of ${item.name} for ${actualCost.toLocaleString()} credits`);
        setMessageType('success');
        setQuantity(1);
      } else {
        setMessage(result.message || 'Purchase failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    }
  };

  const selectedTradeGood = selectedItem !== null ? tradeGoods.find(g => g.id === selectedItem) : null;
  const buyCargoAvailable = actualAvailableActions.some(a => a.type === 'buy_cargo' && a.available);
  const dockAvailable = actualAvailableActions.some(a => a.type === 'dock_at_planet' && a.available);

  return (
    <div className="space-panel">

      {/* Dock Button if not docked */}
      {!buyCargoAvailable && dockAvailable && (
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
      <div className="bg-space-black border border-space-blue rounded p-1 mb-2">
        <div className="text-xs text-palm-gray">
          Cargo: {filledCargoBays}/{totalCargoBays} • Available: {availableCargoBays}
          {actualState.options.leaveEmpty > 0 && ` • Reserved: ${actualState.options.leaveEmpty}`}
        </div>
      </div>

      {/* Trade Goods List */}
      <div className="space-y-1">{/* Removed panel wrapper to save space */}
        {!buyCargoAvailable ? (
          <div className="text-palm-gray text-sm p-2">Trading unavailable - must be docked at a planet.</div>
        ) : tradeGoods.length === 0 ? (
          <div className="text-palm-gray text-sm p-2">No trade goods available at this location.</div>
        ) : (
          tradeGoods.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemSelect(item.id)}
              className={`w-full p-1 text-left rounded border transition-all duration-200 ${
                selectedItem === item.id
                  ? 'border-neon-cyan bg-neon-cyan bg-opacity-10'
                  : 'border-palm-gray hover:border-neon-cyan border-opacity-30'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <span className="text-neon-cyan text-sm font-semibold">{item.name}</span>
                  <span className="text-xs text-palm-gray ml-2">
                    Avail: {item.availableQty} • Own: {item.playerOwned}
                  </span>
                </div>
                <div className="text-neon-green font-bold text-sm">
                  {item.price.toLocaleString()}cr
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Purchase Controls */}
      {selectedTradeGood && (
        <div className="bg-space-black border border-space-blue rounded p-2 mb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-neon-amber text-sm">{selectedTradeGood.name}</div>
            <div className="flex items-center gap-1">
              <button onClick={() => handleQuantityChange(-1)} className="compact-button px-2" disabled={quantity <= 1}>-</button>
              <span className="text-neon-cyan font-bold text-sm w-8 text-center">{quantity}</span>
              <button onClick={() => handleQuantityChange(1)} className="compact-button px-2" disabled={quantity >= getMaxAffordable(selectedTradeGood)}>+</button>
              <button onClick={handleMaxQuantity} className="compact-button text-xs">Max</button>
            </div>
          </div>
          <div className="text-xs text-palm-gray mb-2">
            Cost: <span className="text-neon-green">{(quantity * selectedTradeGood.price).toLocaleString()}cr</span> • 
            Max: {getMaxAffordable(selectedTradeGood)}
          </div>
          <button
            onClick={handlePurchase}
            disabled={quantity > getMaxAffordable(selectedTradeGood)}
            className="compact-button w-full disabled:opacity-50"
          >
            Buy {quantity} units
          </button>
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
