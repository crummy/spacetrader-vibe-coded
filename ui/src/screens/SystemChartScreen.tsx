// System Chart Screen - Interactive 2D galaxy map
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.ts';
import { getShipType } from '@game-data/shipTypes.ts';
import { getSolarSystemName } from '@game-data/systems.ts';
import { calculateDistance, getCurrentFuel } from '../../../ts/travel/warp.ts';
import type { ScreenProps } from '../types.ts';
import type { SolarSystem } from '@game-types';

// Galaxy constants from the backend
const GALAXY_WIDTH = 150;
const GALAXY_HEIGHT = 110;

// SVG display constants - larger to fill more space
const SVG_WIDTH = 280;
const SVG_HEIGHT = 300;

interface SystemChartScreenProps extends ScreenProps {}

export function SystemChartScreen({ onNavigate, onBack, state, onAction }: SystemChartScreenProps) {
  // Fall back to useGameEngine if props aren't provided (backwards compatibility)
  const gameEngine = useGameEngine();
  const actualState = state || gameEngine.state;
  const actualExecuteAction = onAction || gameEngine.executeAction;

  const [selectedSystem, setSelectedSystem] = useState<number | null>(null);
  const [hoveredSystem, setHoveredSystem] = useState<number | null>(null);
  
  // Pan and zoom state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

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

  // Pan and zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(10, zoom * delta));
    
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Zoom toward mouse position
      const zoomRatio = newZoom / zoom;
      const newPanX = mouseX - (mouseX - panX) * zoomRatio;
      const newPanY = mouseY - (mouseY - panY) * zoomRatio;
      
      setZoom(newZoom);
      setPanX(newPanX);
      setPanY(newPanY);
    }
  }, [zoom, panX, panY]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  }, [panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSystemClick = useCallback((systemIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (systemIndex === actualState.currentSystem) {
      return; // Already at this system
    }
    
    if (!systemsInRange.has(systemIndex)) {
      return; // Out of range
    }
    
    setSelectedSystem(systemIndex);
  }, [actualState.currentSystem, systemsInRange]);

  const centerOnCurrentSystem = useCallback(() => {
    const currentX = scaleX(currentSystem.x);
    const currentY = scaleY(currentSystem.y);
    setPanX(SVG_WIDTH / 2 - currentX);
    setPanY(SVG_HEIGHT / 2 - currentY);
    setZoom(1);
  }, [currentSystem]);

  const resetView = useCallback(() => {
    setPanX(0);
    setPanY(0);
    setZoom(1);
  }, []);

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
    <div className="h-full flex flex-col">
      {/* Galaxy Map */}
      <div className="flex-1 flex flex-col px-2">
        <div className="flex justify-center flex-1">
          <div 
            className="relative bg-black border border-neon-cyan rounded overflow-hidden w-full" 
            style={{ maxWidth: SVG_WIDTH, height: SVG_HEIGHT, cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <svg 
              ref={svgRef}
              width={SVG_WIDTH} 
              height={SVG_HEIGHT}
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at center, #001122 0%, #000000 100%)' }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
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
                const hoverRadius = radius * 4; // 4x bigger hover target
                
                return (
                  <g key={index}>
                    {/* Invisible larger circle for easier clicking/hovering */}
                    <circle
                      cx={x}
                      cy={y}
                      r={hoverRadius}
                      fill="transparent"
                      className="cursor-pointer"
                      onClick={(e) => handleSystemClick(index, e)}
                      onMouseEnter={() => setHoveredSystem(index)}
                      onMouseLeave={() => setHoveredSystem(null)}
                    >
                      <title>
                        {getSolarSystemName(index)}
                        {isCurrent && ' (Current)'}
                        {isInRange && !isCurrent && ' (In Range)'}
                        {!isInRange && ' (Out of Range)'}
                      </title>
                    </circle>
                    {/* Visible system dot */}
                    <circle
                      cx={x}
                      cy={y}
                      r={radius}
                      fill={color}
                      stroke={isCurrent ? '#ffffff' : (isSelected ? '#ffffff' : 'none')}
                      strokeWidth={isCurrent || isSelected ? 2 : 0}
                      style={{ filter: isHovered ? 'brightness(150%)' : 'none', pointerEvents: 'none' }}
                    />
                  </g>
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
              </g>
            </svg>
            
            {/* Zoom indicator */}
            <div className="absolute top-2 right-2 bg-space-dark border border-space-blue rounded px-2 py-1 text-xs">
              {(zoom * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      {(hoveredSystem !== null || selectedSystem !== null) && (
        <div className="bg-space-black border border-space-blue rounded p-2 mx-2 mb-2">
          <div className="text-neon-amber mb-1 text-xs">
            {selectedSystem !== null ? 'Selected:' : 'System:'}
          </div>
          {(() => {
            const systemIndex = selectedSystem !== null ? selectedSystem : hoveredSystem!;
            const system = actualState.solarSystem[systemIndex];
            const distance = systemIndex === actualState.currentSystem ? 0 : 
              calculateDistance(currentSystem, system);
            const inRange = systemsInRange.has(systemIndex);
            
            return (
              <div className="text-xs space-y-1">
                <div className="text-neon-cyan font-bold">
                  {getSolarSystemName(systemIndex)}
                </div>
                <div className="text-palm-gray space-y-0.5">
                  <div>({system.x}, {system.y}) • {distance.toFixed(1)}p • TL{system.techLevel}</div>
                  <div className={inRange ? 'text-neon-green' : 'text-neon-red'}>
                    {inRange ? 'In Range' : 'Out of Range'}
                  </div>
                </div>
                
                {selectedSystem !== null && inRange && selectedSystem !== actualState.currentSystem && (
                  <button
                    onClick={handleWarpToSystem}
                    className="compact-button w-full mt-1"
                  >
                    🚀 Warp
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
