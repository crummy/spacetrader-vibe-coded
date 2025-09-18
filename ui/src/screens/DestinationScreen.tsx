// Destination Screen - Shows system preview with trade estimates and navigation
import React, { useState, useCallback } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.ts';
import { getSolarSystemName } from '@game-data/systems.ts';
import { calculateDistance, getCurrentFuel, getWormholeDestinations } from '../../../ts/travel/warp.ts';
import { getTradeItemName } from '@game-data/tradeItems.ts';
import { MAXTRADEITEM } from '@game-types';
import { calculateStandardPrice, getStablePricesForDisplay } from '../../../ts/economy/pricing.ts';
import { getPoliticalSystem } from '../../../ts/data/politics.ts';
import { getFilledCargoBays, getTotalCargoBays } from '../../../ts/economy/trading.ts';
import type { ScreenProps } from '../types.ts';
import type { SolarSystem } from '@game-types';

interface DestinationScreenProps extends ScreenProps {
  initialSystemIndex: number;
  onBack?: (finalSystemIndex?: number) => void;
}

export function DestinationScreen({ onNavigate, onBack, state, onAction, initialSystemIndex }: DestinationScreenProps) {
  const gameEngine = useGameEngine();
  const actualState = state || gameEngine.state;
  const actualExecuteAction = onAction || gameEngine.executeAction;
  
  const [selectedSystemIndex, setSelectedSystemIndex] = useState(initialSystemIndex);
  const [showRelativePrices, setShowRelativePrices] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Update galactic chart system when destination screen opens
  React.useEffect(() => {
    if (actualExecuteAction) {
      const promise = actualExecuteAction({
        type: 'set_galactic_chart_system',
        parameters: { systemIndex: initialSystemIndex }
      });
      
      // Only call .catch() if the promise exists and has .catch method
      if (promise && typeof promise.catch === 'function') {
        promise.catch(error => {
          console.warn('Failed to set initial galactic chart system:', error);
        });
      }
    }
  }, []); // Empty dependency array - run only once on mount
  
  const currentSystem = actualState.solarSystem[actualState.currentSystem];
  const selectedSystem = actualState.solarSystem[selectedSystemIndex];
  const currentFuel = getCurrentFuel(actualState.ship);
  
  // Calculate systems within range (includes both fuel range and wormhole destinations)
  const systemsWithinRange = React.useMemo(() => {
    const inRange: number[] = [];
    
    // Add systems within fuel range
    for (let i = 0; i < actualState.solarSystem.length; i++) {
      if (i === actualState.currentSystem) continue; // Skip current system
      
      const distance = calculateDistance(currentSystem, actualState.solarSystem[i]);
      if (distance <= currentFuel) {
        inRange.push(i);
      }
    }
    
    // Add systems accessible via wormhole from current system
    const wormholeDestinations = getWormholeDestinations(actualState, actualState.currentSystem);
    for (const destination of wormholeDestinations) {
      if (!inRange.includes(destination)) {
        inRange.push(destination);
      }
    }
    
    return inRange.sort(); // Sort by system index for consistent navigation
  }, [actualState.solarSystem, actualState.currentSystem, currentFuel, actualState]);
  
  // Find next/previous system within range
  const getNextSystem = useCallback((direction: 'next' | 'prev') => {
    const currentIndex = systemsWithinRange.indexOf(selectedSystemIndex);
    if (currentIndex === -1) return selectedSystemIndex; // Should not happen
    
    let newIndex;
    if (direction === 'next') {
      newIndex = currentIndex + 1;
      if (newIndex >= systemsWithinRange.length) newIndex = 0; // Wrap to start
    } else {
      newIndex = currentIndex - 1;
      if (newIndex < 0) newIndex = systemsWithinRange.length - 1; // Wrap to end
    }
    
    return systemsWithinRange[newIndex];
  }, [systemsWithinRange, selectedSystemIndex]);
  
  const handleNavigation = useCallback(async (direction: 'next' | 'prev') => {
    const nextSystemIndex = getNextSystem(direction);
    setSelectedSystemIndex(nextSystemIndex);
    
    // Update the galactic chart system so the dotted line points to the new selection
    if (actualExecuteAction) {
      try {
        const promise = actualExecuteAction({
          type: 'set_galactic_chart_system',
          parameters: { systemIndex: nextSystemIndex }
        });
        
        // Only await if it's a proper promise
        if (promise && typeof promise.then === 'function') {
          await promise;
        }
      } catch (error) {
        console.warn('Failed to update galactic chart system:', error);
      }
    }
  }, [getNextSystem, actualExecuteAction]);
  
  const handleWarpToSystem = useCallback(async () => {
    if (!actualExecuteAction) return;
    
    console.log('Attempting to warp to system:', selectedSystemIndex, getSolarSystemName(selectedSystemIndex));
    
    try {
      const result = await actualExecuteAction({
        type: 'warp_to_system',
        parameters: { targetSystem: selectedSystemIndex }
      });
      
      if (result.success) {
        onBack?.(selectedSystemIndex); // Return to previous screen after warp
      } else {
        setErrorMessage(result.message || 'Warp failed');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Warp failed');
    }
  }, [selectedSystemIndex, actualExecuteAction, onBack]);
  
  const distance = calculateDistance(currentSystem, selectedSystem);
  
  // Special resources names from Palm OS (same as in SystemInfoScreen)
  const SPECIAL_RESOURCES = [
    'Nothing special', 'Mineral rich', 'Mineral poor', 'Desert', 
    'Sweetwater oceans', 'Rich soil', 'Poor soil', 'Rich fauna', 
    'Lifeless', 'Weird mushrooms', 'Special herbs', 'Artistic populace', 'Warlike populace'
  ];
  
  const specialResources = selectedSystem.visited 
    ? (selectedSystem.specialResources >= 0 && selectedSystem.specialResources < SPECIAL_RESOURCES.length 
       ? SPECIAL_RESOURCES[selectedSystem.specialResources] 
       : 'No special resources')
    : 'Special resources unknown';

  // Create description combining size, tech level, and government
  const sizeNames = ['Tiny', 'Small', 'Medium', 'Large', 'Huge'];
  const techNames = ['Pre-Agricultural', 'Agricultural', 'Medieval', 'Renaissance', 'Early Industrial', 'Industrial', 'Post-Industrial', 'Hi-Tech'];
  const politics = getPoliticalSystem(selectedSystem.politics);
  
  const sizeName = sizeNames[selectedSystem.size] || 'Unknown';
  const techName = techNames[selectedSystem.techLevel] || 'Unknown';
  const systemDescription = `${sizeName} ${techName} ${politics.name}`;
  
  // Activity levels for police and pirates (same as SystemInfoScreen)
  const ACTIVITY_LEVELS = ['Absent', 'Minimal', 'Few', 'Some', 'Moderate', 'Many', 'Abundant', 'Swarms'];
  const policeActivity = ACTIVITY_LEVELS[politics.strengthPolice] || 'Unknown';
  const pirateActivity = ACTIVITY_LEVELS[politics.strengthPirates] || 'Unknown';
    
  // Calculate trade prices for this system
  const tradePrices = React.useMemo(() => {
    const prices: Array<{name: string, displayPrice: number | null, profitable: boolean, actualPrice: number}> = [];
    
    for (let i = 0; i < MAXTRADEITEM; i++) {
      try {
        const destinationPrice = calculateStandardPrice(
          i,
          selectedSystem.size,
          selectedSystem.techLevel,
          selectedSystem.politics,
          selectedSystem.visited ? selectedSystem.specialResources : -1
        );
        
        const currentPrices = getStablePricesForDisplay(actualState);
        const currentBuyPrice = currentPrices.buyPrice[i] || 0;
        const currentStock = currentSystem.qty[i] || 0;
        
        // Check if profitable - destination price > current system buy price and we have stock
        const profitable = destinationPrice > currentBuyPrice && currentBuyPrice > 0 && currentStock > 0;
        
        // Calculate display price (absolute or relative)
        let displayPrice: number | null = destinationPrice;
        
        // Check if we should show "---" instead (same logic as Palm version)
        const shouldShowDashes = destinationPrice <= 0 || (showRelativePrices && currentBuyPrice <= 0);
        
        if (shouldShowDashes) {
          displayPrice = null;
        } else if (showRelativePrices) {
          displayPrice = destinationPrice - currentBuyPrice;
        }
        
        prices.push({
          name: getTradeItemName(i),
          displayPrice,
          profitable,
          actualPrice: destinationPrice
        });
      } catch (error) {
        // Add with null price if calculation fails
        prices.push({
          name: getTradeItemName(i),
          displayPrice: null,
          profitable: false,
          actualPrice: 0
        });
      }
    }
    
    return prices;
  }, [selectedSystem, currentSystem, showRelativePrices]); // Removed buyPrice dependency - now computed on-demand
  
  return (
    <div className="flex flex-col h-full bg-space-black text-palm-green font-mono">
      {/* Header */}
      <div className="bg-space-dark border-b border-space-blue p-2">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => onBack?.(selectedSystemIndex)}
            className="compact-button"
            data-testid="back-button"
          >
            ← Back
          </button>
          
          <div className="text-center" data-testid="system-info">
            <div className="text-neon-cyan text-sm font-bold" data-testid="system-name">
              {getSolarSystemName(selectedSystemIndex)} • {Math.round(distance)}p
            </div>
            <div className="text-palm-gray text-xs" data-testid="system-description">
              {systemDescription}
            </div>
            <div className="text-palm-gray text-xs mt-1" data-testid="system-activity">
              Police: {policeActivity} • Pirates: {pirateActivity}
            </div>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => handleNavigation('prev')}
              disabled={systemsWithinRange.length <= 1}
              className="compact-button text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="prev-system-button"
            >
              ←
            </button>
            <button
              onClick={() => handleNavigation('next')}
              disabled={systemsWithinRange.length <= 1}
              className="compact-button text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="next-system-button"
            >
              →
            </button>
          </div>
        </div>
      </div>
      
      {/* Special Resources */}
      {selectedSystem.visited && selectedSystem.specialResources > 0 && (
        <div className="p-2 border-b border-space-blue">
          <div className="text-xs text-neon-amber">
            {specialResources}
          </div>
        </div>
      )}
      
      {/* Trade Prices */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-neon-amber font-bold">Trade Prices</div>
          <button
            onClick={() => setShowRelativePrices(!showRelativePrices)}
            className="compact-button text-xs"
            data-testid="toggle-prices-button"
          >
            {showRelativePrices ? 'Absolute' : 'Relative'}
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs" data-testid="trade-prices">
          {tradePrices.map((item, index) => {
            let priceText = '';
            if (item.displayPrice === null) {
              priceText = '---';
            } else if (showRelativePrices) {
              priceText = item.displayPrice > 0 ? `+${item.displayPrice}` : `${item.displayPrice}`;
            } else {
              priceText = `${item.displayPrice}`;
            }
            
            return (
              <div 
                key={index}
                className={`flex justify-between ${item.profitable ? 'text-neon-green font-bold' : 'text-palm-gray'}`}
                data-testid={`trade-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span>{item.name}</span>
                <span>{priceText}</span>
              </div>
            );
          })}
        </div>
        
        {tradePrices.length === 0 && (
          <div className="text-palm-gray text-xs">No trade data available</div>
        )}
        
        {/* Cargo Bays */}
        <div className="mt-2 pt-2 border-t border-space-blue">
          <div className="flex justify-end text-xs text-palm-gray">
            Bays: {getFilledCargoBays(actualState)}/{getTotalCargoBays(actualState)}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="bg-space-dark border-t border-space-blue p-2">
        <button
          onClick={handleWarpToSystem}
          className="compact-button w-full bg-neon-green text-space-black font-bold hover:bg-green-400"
          data-testid="warp-button"
        >
          🚀 Warp to {getSolarSystemName(selectedSystemIndex)}
        </button>
      </div>

      {/* Error Modal */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="error-modal">
          <div className="bg-space-dark border border-neon-red rounded p-4 max-w-sm mx-4">
            <div className="text-neon-red font-bold mb-2">Warp Failed</div>
            <div className="text-palm-gray text-sm mb-4" data-testid="error-message">{errorMessage}</div>
            <button
              onClick={() => setErrorMessage(null)}
              className="compact-button w-full bg-neon-red text-white hover:bg-red-700"
              data-testid="error-ok-button"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
