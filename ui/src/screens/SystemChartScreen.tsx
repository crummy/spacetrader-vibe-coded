// System Chart Screen - Interactive 2D galaxy map
import React, { useState, useMemo } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.ts';
import { getShipType } from '@game-data/shipTypes.ts';
import { getSolarSystemName } from '@game-data/systems.ts';
import { calculateDistance, getCurrentFuel } from '../../../ts/travel/warp.ts';
import type { ScreenProps } from '../types.ts';
import type { SolarSystem } from '@game-types';

// Galaxy constants from the backend
const GALAXY_WIDTH = 150;
const GALAXY_HEIGHT = 110;

// SVG display constants
const SVG_WIDTH = 600;
const SVG_HEIGHT = 440; // Maintains 150:110 aspect ratio (600:440 = 15:11)

interface SystemChartScreenProps extends ScreenProps {}

export function SystemChartScreen({ onNavigate, onBack, state, onAction }: SystemChartScreenProps) {
  // Fall back to useGameEngine if props aren't provided (backwards compatibility)
  const gameEngine = useGameEngine();
  const actualState = state || gameEngine.state;
  const actualExecuteAction = onAction || gameEngine.executeAction;

  const [selectedSystem, setSelectedSystem] = useState<number | null>(null);
  const [hoveredSystem, setHoveredSystem] = useState<number | null>(null);

  const shipType = getShipType(actualState.ship.type);
  const currentSystem = actualState.solarSystem[actualState.currentSystem];
  const currentFuel = getCurrentFuel(actualState.ship);
  
  // Calculate systems within range
  const systemsInRange = useMemo(() => {
    const inRange = new Set<number>();
    for (let i = 0; i < actualState.solarSystem.length; i++) {
      if (i === actualState.currentSystem) {
        inRange.add(i);
        continue;
      }
      
      const distance = calculateDistance(currentSystem, actualState.solarSystem[i]);
      if (distance <= currentFuel) {
        inRange.add(i);
      }
    }
    return inRange;
  }, [actualState.solarSystem, actualState.currentSystem, currentSystem, currentFuel]);

  // Scale coordinates from galaxy space to SVG space
  const scaleX = (x: number) => (x / GALAXY_WIDTH) * SVG_WIDTH;
  const scaleY = (y: number) => (y / GALAXY_HEIGHT) * SVG_HEIGHT;
  
  // Current system position in SVG coordinates
  const currentX = scaleX(currentSystem.x);
  const currentY = scaleY(currentSystem.y);
  
  // Range circle radius in SVG coordinates
  const rangeRadius = (currentFuel / GALAXY_WIDTH) * SVG_WIDTH;

  const handleSystemClick = (systemIndex: number) => {
    if (systemIndex === actualState.currentSystem) {
      return; // Already at this system
    }
    
    if (!systemsInRange.has(systemIndex)) {
      return; // Out of range
    }
    
    setSelectedSystem(systemIndex);
  };

  const handleWarpToSystem = async () => {
    if (selectedSystem === null || !actualExecuteAction) return;
    
    console.log('Attempting to warp to system:', selectedSystem, getSolarSystemName(selectedSystem));
    console.log('Current system:', actualState.currentSystem);
    console.log('Systems in range:', Array.from(systemsInRange));
    
    try {
      const result = await actualExecuteAction({
        type: 'warp_to_system',
        parameters: { targetSystem: selectedSystem }
      });
      
      if (result.success) {
        setSelectedSystem(null);
        // Navigation will update automatically via state changes
      } else {
        alert(result.message || 'Warp failed');
      }
    } catch (error) {
      console.error('Warp failed:', error);
      alert('Error during warp');
    }
  };

  const selectedSystemData = selectedSystem !== null ? actualState.solarSystem[selectedSystem] : null;

  return (
    <div className="space-panel">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="neon-button">
          ← Back
        </button>
        <h2 className="retro-title text-lg">GALAXY CHART</h2>
        <div className="text-neon-green font-bold">{actualState.credits.toLocaleString()} cr.</div>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-panel bg-space-black">
          <div className="text-neon-amber mb-2">Current Location:</div>
          <div className="text-sm text-palm-gray space-y-1">
            <div>• System: {getSolarSystemName(actualState.currentSystem)}</div>
            <div>• Coordinates: ({currentSystem.x}, {currentSystem.y})</div>
          </div>
        </div>
        
        <div className="space-panel bg-space-black">
          <div className="text-neon-amber mb-2">Ship Status:</div>
          <div className="text-sm text-palm-gray space-y-1">
            <div>• Fuel: {actualState.ship.fuel}/{shipType.fuelTanks}</div>
            <div>• Range: {currentFuel} parsecs</div>
            <div>• Systems in Range: {systemsInRange.size - 1}</div>
          </div>
        </div>
      </div>

      {/* Galaxy Map */}
      <div className="space-panel bg-space-black mb-4">
        <div className="text-neon-amber mb-3 text-center">GALAXY MAP</div>
        <div className="flex justify-center">
          <div className="relative bg-black border border-neon-cyan rounded" style={{ width: SVG_WIDTH, height: SVG_HEIGHT }}>
            <svg 
              width={SVG_WIDTH} 
              height={SVG_HEIGHT}
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at center, #001122 0%, #000000 100%)' }}
            >
              {/* Background grid */}
              <defs>
                <pattern id="grid" width="30" height="22" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 22" fill="none" stroke="#0a3a5a" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Range circle */}
              <circle
                cx={currentX}
                cy={currentY}
                r={rangeRadius}
                fill="none"
                stroke="#00ffff"
                strokeWidth="1"
                opacity="0.3"
                strokeDasharray="5,5"
              />
              
              {/* All systems */}
              {actualState.solarSystem.map((system: SolarSystem, index: number) => {
                const x = scaleX(system.x);
                const y = scaleY(system.y);
                const isCurrent = index === actualState.currentSystem;
                const isInRange = systemsInRange.has(index);
                const isSelected = index === selectedSystem;
                const isHovered = index === hoveredSystem;
                const isVisited = system.visited;
                
                let color = '#666666'; // Default: unvisited, out of range
                if (isCurrent) color = '#00ff00'; // Green for current
                else if (isSelected) color = '#ffff00'; // Yellow for selected
                else if (isHovered && isInRange) color = '#ff8800'; // Orange for hovered in-range
                else if (isInRange && isVisited) color = '#00ffff'; // Cyan for visited in-range
                else if (isInRange) color = '#8888ff'; // Blue for unvisited in-range
                else if (isVisited) color = '#888888'; // Gray for visited out-of-range
                
                const radius = isCurrent ? 4 : (isInRange ? 3 : 2);
                
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r={radius}
                    fill={color}
                    stroke={isCurrent ? '#ffffff' : (isSelected ? '#ffffff' : 'none')}
                    strokeWidth={isCurrent || isSelected ? 2 : 0}
                    className="cursor-pointer"
                    onClick={() => handleSystemClick(index)}
                    onMouseEnter={() => setHoveredSystem(index)}
                    onMouseLeave={() => setHoveredSystem(null)}
                    style={{ filter: isHovered ? 'brightness(150%)' : 'none' }}
                  >
                    <title>
                      {getSolarSystemName(index)}
                      {isCurrent && ' (Current)'}
                      {isInRange && !isCurrent && ' (In Range)'}
                      {!isInRange && ' (Out of Range)'}
                    </title>
                  </circle>
                );
              })}
              
              {/* Connection line to selected system */}
              {selectedSystem !== null && systemsInRange.has(selectedSystem) && (
                <line
                  x1={currentX}
                  y1={currentY}
                  x2={scaleX(actualState.solarSystem[selectedSystem].x)}
                  y2={scaleY(actualState.solarSystem[selectedSystem].y)}
                  stroke="#ffff00"
                  strokeWidth="1"
                  opacity="0.5"
                  strokeDasharray="3,3"
                />
              )}
            </svg>
          </div>
        </div>
        
        {/* Map legend */}
        <div className="text-xs text-palm-gray mt-3 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Current System</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
            <span>Visited (In Range)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Unvisited (In Range)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span>Out of Range</span>
          </div>
        </div>
      </div>

      {/* System Information */}
      {(hoveredSystem !== null || selectedSystem !== null) && (
        <div className="space-panel bg-space-black">
          <div className="text-neon-amber mb-2">
            {selectedSystem !== null ? 'Selected System:' : 'System Information:'}
          </div>
          {(() => {
            const systemIndex = selectedSystem !== null ? selectedSystem : hoveredSystem!;
            const system = actualState.solarSystem[systemIndex];
            const distance = systemIndex === actualState.currentSystem ? 0 : 
              calculateDistance(currentSystem, system);
            const inRange = systemsInRange.has(systemIndex);
            
            return (
              <div className="text-sm space-y-2">
                <div className="text-neon-cyan font-bold">
                  {getSolarSystemName(systemIndex)}
                </div>
                <div className="text-palm-gray space-y-1">
                  <div>• Coordinates: ({system.x}, {system.y})</div>
                  <div>• Distance: {distance.toFixed(1)} parsecs</div>
                  <div>• Tech Level: {system.techLevel}</div>
                  <div>• Status: {inRange ? 'In Range' : 'Out of Range'}</div>
                  {system.visited && <div className="text-neon-green">• Previously Visited</div>}
                </div>
                
                {selectedSystem !== null && inRange && selectedSystem !== actualState.currentSystem && (
                  <div className="pt-2">
                    <button
                      onClick={handleWarpToSystem}
                      className="neon-button w-full"
                    >
                      🚀 Warp to {getSolarSystemName(selectedSystem)}
                    </button>
                  </div>
                )}
                
                {selectedSystem !== null && selectedSystem !== actualState.currentSystem && (
                  <div className="pt-2">
                    <button
                      onClick={() => setSelectedSystem(null)}
                      className="neon-button w-full bg-transparent border-gray-500 text-gray-400"
                    >
                      Cancel Selection
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
