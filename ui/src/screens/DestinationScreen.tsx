// Destination Screen - Shows system preview with trade estimates and navigation
import React, { useState, useCallback } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.ts';
import { getSolarSystemName } from '@game-data/systems.ts';
import { calculateDistance, getCurrentFuel } from '../../../ts/travel/warp.ts';
import { getTradeItemName } from '@game-data/tradeItems.ts';
import { MAXTRADEITEM } from '@game-types';
import { calculateStandardPrice } from '../../../ts/economy/pricing.ts';
import { getPoliticalSystem } from '../../../ts/data/politics.ts';
import type { ScreenProps } from '../types.ts';
import type { SolarSystem } from '@game-types';

interface DestinationScreenProps extends ScreenProps {
  initialSystemIndex: number;
}

export function DestinationScreen({ onNavigate, onBack, state, onAction, initialSystemIndex }: DestinationScreenProps) {
  const gameEngine = useGameEngine();
  const actualState = state || gameEngine.state;
  const actualExecuteAction = onAction || gameEngine.executeAction;
  
  const [selectedSystemIndex, setSelectedSystemIndex] = useState(initialSystemIndex);
  const [showRelativePrices, setShowRelativePrices] = useState(false);
  
  const currentSystem = actualState.solarSystem[actualState.currentSystem];
  const selectedSystem = actualState.solarSystem[selectedSystemIndex];
  const currentFuel = getCurrentFuel(actualState.ship);
  
  // Calculate systems within range (same logic as SystemChartScreen)
  const systemsWithinRange = React.useMemo(() => {
    const inRange: number[] = [];
    for (let i = 0; i < actualState.solarSystem.length; i++) {
      if (i === actualState.currentSystem) continue; // Skip current system
      
      const distance = calculateDistance(currentSystem, actualState.solarSystem[i]);
      if (distance <= currentFuel) {
        inRange.push(i);
      }
    }
    return inRange.sort(); // Sort by system index for consistent navigation
  }, [actualState.solarSystem, actualState.currentSystem, currentFuel]);
  
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
  
  const handleNavigation = useCallback((direction: 'next' | 'prev') => {
    const nextSystemIndex = getNextSystem(direction);
    setSelectedSystemIndex(nextSystemIndex);
  }, [getNextSystem]);
  
  const handleWarpToSystem = useCallback(() => {
    if (!actualExecuteAction) return;
    
    console.log('Attempting to warp to system:', selectedSystemIndex, getSolarSystemName(selectedSystemIndex));
    
    try {
      actualExecuteAction({
        type: 'warp_to_system',
        parameters: { targetSystem: selectedSystemIndex }
      });
      
      onBack?.(); // Return to previous screen after warp
    } catch (error) {
      console.error('Warp failed:', error);
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
        
        const currentBuyPrice = actualState.buyPrice?.[i] || 0;
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
  }, [selectedSystem, currentSystem, actualState.buyPrice, showRelativePrices]);
  
  return (
    <div className="flex flex-col h-full bg-space-black text-palm-green font-mono">
      {/* Header */}
      <div className="bg-space-dark border-b border-space-blue p-2">
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="compact-button"
          >
            ← Back
          </button>
          
          <div className="text-center">
            <div className="text-neon-cyan text-sm font-bold">
              {getSolarSystemName(selectedSystemIndex)} • {distance.toFixed(1)}p
            </div>
            <div className="text-palm-gray text-xs">
              {systemDescription}
            </div>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => handleNavigation('prev')}
              disabled={systemsWithinRange.length <= 1}
              className="compact-button text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <button
              onClick={() => handleNavigation('next')}
              disabled={systemsWithinRange.length <= 1}
              className="compact-button text-xs disabled:opacity-50 disabled:cursor-not-allowed"
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
          >
            {showRelativePrices ? 'Absolute' : 'Relative'}
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
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
      </div>
      
      {/* Actions */}
      <div className="bg-space-dark border-t border-space-blue p-2">
        <button
          onClick={handleWarpToSystem}
          className="compact-button w-full bg-neon-green text-space-black font-bold hover:bg-green-400"
        >
          🚀 Warp to {getSolarSystemName(selectedSystemIndex)}
        </button>
      </div>
    </div>
  );
}
