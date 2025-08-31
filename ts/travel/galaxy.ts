// Galaxy Map System Implementation  
// Ported from Palm OS Space Trader WarpFormEvent.c, Global.c, and tracking logic

import type { GameState, SolarSystem } from '../types.ts';
import { MAXSOLARSYSTEM } from '../types.ts';

// Constants from Palm OS source
const NO_SYSTEM_TRACKED = -1; // TrackedSystem = -1 means no tracking

// Galaxy Map State interface for clean separation
export interface GalaxyMapState {
  currentSystem: number;
  trackedSystem: number;
  galacticChartSystem: number;
  showTrackedRange: boolean;
  trackAutoOff: boolean;
  solarSystems: readonly SolarSystem[];
}

// Tracking information for UI display
export interface TrackingInfo {
  isTracking: boolean;
  trackedSystemIndex: number;
  distance: number;
  systemName: string;
  shouldDisplay: boolean;
}

// System Tracking Functions
// From Palm OS Global.c TrackedSystem variable and tracking logic

export function getTrackedSystem(state: GameState): number {
  return state.trackedSystem ?? NO_SYSTEM_TRACKED;
}

export function setTrackedSystem(state: GameState, systemIndex: number): void {
  // Validate system index
  if (systemIndex < 0 || systemIndex >= MAXSOLARSYSTEM) {
    state.trackedSystem = NO_SYSTEM_TRACKED;
    return;
  }
  
  state.trackedSystem = systemIndex;
}

export function clearTrackedSystem(state: GameState): void {
  state.trackedSystem = NO_SYSTEM_TRACKED;
}

export function isSystemTracked(state: GameState, systemIndex: number): boolean {
  return getTrackedSystem(state) === systemIndex;
}

// Auto-stop tracking when arriving at tracked system
// From Palm OS TrackAutoOff behavior
export function autoStopTrackingOnArrival(state: GameState, arrivedSystem: number): void {
  if (!state.trackAutoOff) {
    return;
  }
  
  if (getTrackedSystem(state) === arrivedSystem) {
    clearTrackedSystem(state);
  }
}

// Galactic Chart Navigation Functions
// From Palm OS Global.c GalacticChartSystem variable

export function getGalacticChartSystem(state: GameState): number {
  // Return current system if galacticChartSystem is not properly set
  if (typeof state.galacticChartSystem !== 'number') {
    return state.currentSystem;
  }
  return state.galacticChartSystem;
}

export function setGalacticChartSystem(state: GameState, systemIndex: number): void {
  // Validate system index
  if (systemIndex < 0 || systemIndex >= MAXSOLARSYSTEM) {
    return; // Keep current selection if invalid
  }
  
  state.galacticChartSystem = systemIndex;
}

// Distance and Range Calculations
// Reusing distance calculation from warp system for consistency

function calculateDistance(systemA: SolarSystem, systemB: SolarSystem): number {
  const dx = systemA.x - systemB.x;
  const dy = systemA.y - systemB.y;
  return Math.floor(Math.sqrt(dx * dx + dy * dy));
}

export function getDistanceToTracked(state: GameState): number {
  const trackedSystem = getTrackedSystem(state);
  if (trackedSystem === NO_SYSTEM_TRACKED) {
    return 0;
  }
  
  const currentSys = state.solarSystem[state.currentSystem];
  const trackedSys = state.solarSystem[trackedSystem];
  return calculateDistance(currentSys, trackedSys);
}

export function getSystemsWithinRange(state: GameState, fuelRange: number): number[] {
  const currentSys = state.solarSystem[state.currentSystem];
  const systemsInRange: number[] = [];
  
  for (let i = 0; i < Math.min(MAXSOLARSYSTEM, state.solarSystem.length); i++) {
    // Skip current system or missing systems
    if (i === state.currentSystem || !state.solarSystem[i]) {
      continue;
    }
    
    const distance = calculateDistance(currentSys, state.solarSystem[i]);
    if (distance <= fuelRange) {
      systemsInRange.push(i);
    }
  }
  
  return systemsInRange;
}

// System Visibility Functions
// From Palm OS system.visited tracking

export function getVisibleSystems(state: GameState): number[] {
  const visibleSystems: number[] = [];
  
  // Current system is always visible
  visibleSystems.push(state.currentSystem);
  
  // Add all visited systems
  for (let i = 0; i < Math.min(MAXSOLARSYSTEM, state.solarSystem.length); i++) {
    if (i !== state.currentSystem && state.solarSystem[i] && state.solarSystem[i].visited) {
      visibleSystems.push(i);
    }
  }
  
  return visibleSystems;
}

// Tracking Display Functions  
// From Palm OS ShowTrackedRange variable and display logic

export function shouldShowTrackingArrow(state: GameState): boolean {
  return getTrackedSystem(state) !== NO_SYSTEM_TRACKED && state.showTrackedRange;
}

export function toggleTrackingDisplay(state: GameState): void {
  state.showTrackedRange = !state.showTrackedRange;
}

// Pathfinding Functions
// Simple shortest path algorithm for space travel

interface PathNode {
  systemIndex: number;
  distance: number;
  path: number[];
}

export function findShortestPath(state: GameState, targetSystem: number, fuelRange: number): number[] {
  const currentSystem = state.currentSystem;
  
  // No path needed to same system
  if (currentSystem === targetSystem) {
    return [];
  }
  
  // Check if target is directly reachable
  if (!state.solarSystem[targetSystem]) {
    return []; // Target system doesn't exist
  }
  
  const directDistance = calculateDistance(
    state.solarSystem[currentSystem],
    state.solarSystem[targetSystem]
  );
  
  if (directDistance <= fuelRange) {
    return [targetSystem];
  }
  
  // Use Dijkstra's algorithm for multi-hop paths
  const visited = new Set<number>();
  const queue: PathNode[] = [{
    systemIndex: currentSystem,
    distance: 0,
    path: []
  }];
  
  while (queue.length > 0) {
    // Sort queue by distance (simple implementation of priority queue)
    queue.sort((a, b) => a.distance - b.distance);
    const current = queue.shift()!;
    
    if (visited.has(current.systemIndex)) {
      continue;
    }
    
    visited.add(current.systemIndex);
    
    // Check if we reached the target
    if (current.systemIndex === targetSystem) {
      return current.path;
    }
    
    // Add neighbors within fuel range
    const currentSys = state.solarSystem[current.systemIndex];
    for (let i = 0; i < Math.min(MAXSOLARSYSTEM, state.solarSystem.length); i++) {
      if (visited.has(i) || !state.solarSystem[i]) {
        continue;
      }
      
      const distance = calculateDistance(currentSys, state.solarSystem[i]);
      if (distance <= fuelRange) {
        const newPath = [...current.path, i];
        const totalDistance = current.distance + distance;
        
        // Limit path length to prevent infinite loops
        if (newPath.length <= 10) {
          queue.push({
            systemIndex: i,
            distance: totalDistance,
            path: newPath
          });
        }
      }
    }
  }
  
  // No path found
  return [];
}

// Utility Functions for Integration

export function createTrackingInfo(state: GameState, systemName: string): TrackingInfo {
  const trackedSystem = getTrackedSystem(state);
  
  return {
    isTracking: trackedSystem !== NO_SYSTEM_TRACKED,
    trackedSystemIndex: trackedSystem,
    distance: getDistanceToTracked(state),
    systemName: systemName,
    shouldDisplay: shouldShowTrackingArrow(state)
  };
}

export function extractGalaxyMapState(state: GameState): GalaxyMapState {
  return {
    currentSystem: state.currentSystem,
    trackedSystem: getTrackedSystem(state),
    galacticChartSystem: getGalacticChartSystem(state),
    showTrackedRange: state.showTrackedRange,
    trackAutoOff: state.trackAutoOff,
    solarSystems: state.solarSystem
  };
}

// Navigation Helper Functions

export function getNextSystemInPath(state: GameState, targetSystem: number, fuelRange: number): number {
  const path = findShortestPath(state, targetSystem, fuelRange);
  return path.length > 0 ? path[0] : -1;
}

export function isSystemReachable(state: GameState, targetSystem: number, fuelRange: number): boolean {
  // Direct check first (most common case)
  const directDistance = calculateDistance(
    state.solarSystem[state.currentSystem],
    state.solarSystem[targetSystem]
  );
  
  if (directDistance <= fuelRange) {
    return true;
  }
  
  // Check if path exists
  const path = findShortestPath(state, targetSystem, fuelRange);
  return path.length > 0;
}

// System Information Functions

export function getSystemInfo(state: GameState, systemIndex: number) {
  if (systemIndex < 0 || systemIndex >= MAXSOLARSYSTEM) {
    return null;
  }
  
  const system = state.solarSystem[systemIndex];
  const distance = calculateDistance(
    state.solarSystem[state.currentSystem],
    system
  );
  
  return {
    index: systemIndex,
    name: `System ${systemIndex}`, // TODO: Replace with actual system names when available
    coordinates: { x: system.x, y: system.y },
    distance: distance,
    visited: system.visited,
    isTracked: isSystemTracked(state, systemIndex),
    isCurrent: systemIndex === state.currentSystem
  };
}