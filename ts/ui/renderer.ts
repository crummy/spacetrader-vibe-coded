// Functional UI Renderer - Pure state-to-UI functions
// Inspired by React's functional component approach

import type { GameState } from '../types.ts';
import { GameMode } from '../types.ts';
import { getGameStatus, getCurrentLocation, getCurrentShipStatus } from '../engine/game.ts';
import { getSolarSystemName } from '../data/systems.ts';
import { getAllSystemPrices } from '../economy/pricing.ts';
import { getFuelStatus } from '../economy/fuel.ts';

/**
 * Main UI renderer - takes state and returns complete UI string
 * Pure function: GameState → string
 */
export function renderUI(state: GameState): string {
  const sections = [
    renderHeader(state),
    renderGameInfo(state),
    renderModeSpecificContent(state)
  ];
  
  return sections.filter(Boolean).join('\n\n');
}

/**
 * Render the game header
 */
function renderHeader(state: GameState): string {
  return '═══ SPACE TRADER ═══';
}

/**
 * Render core game information (commander stats, location, ship)
 */
function renderGameInfo(state: GameState): string {
  const status = getGameStatus(state);
  const location = getCurrentLocation(state);
  const shipStatus = getCurrentShipStatus(state);
  
  const lines = [
    `Commander: ${status.commanderName} | Credits: ${status.credits} | Day: ${status.days}`,
    `Reputation: ${status.reputation} | Police Record: ${status.policeRecord}`,
    `Location: ${location.systemName} ${location.isDocked ? '(Docked)' : '(In Space)'}`,
    `Ship: Hull ${shipStatus.hullPercentage}% | Fuel ${shipStatus.fuel} | Cargo ${shipStatus.cargoUsed}/${shipStatus.cargoCapacity}`
  ];
  
  // Add cargo details if any
  if (shipStatus.cargoUsed > 0) {
    const cargoDetails = renderCargoDetails(state);
    if (cargoDetails) {
      lines.push(`Cargo: ${cargoDetails}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Render cargo contents
 */
function renderCargoDetails(state: GameState): string {
  const tradeItemNames = ['Water', 'Furs', 'Food', 'Ore', 'Games', 'Firearms', 'Medicine', 'Machinery', 'Narcotics', 'Robots'];
  const cargoItems = [];
  
  for (let i = 0; i < state.ship.cargo.length; i++) {
    const quantity = state.ship.cargo[i];
    if (quantity > 0) {
      cargoItems.push(`${tradeItemNames[i]}:${quantity}`);
    }
  }
  
  return cargoItems.join(' ');
}

/**
 * Render content based on current game mode
 */
function renderModeSpecificContent(state: GameState): string {
  switch (state.currentMode) {
    case GameMode.OnPlanet:
      return renderPlanetContent(state);
    case GameMode.InSpace:
      return renderSpaceContent(state);
    case GameMode.InCombat:
      return renderCombatContent(state);
    default:
      return 'Unknown game mode';
  }
}

/**
 * Render planet-specific content
 */
function renderPlanetContent(state: GameState): string {
  const currentSystem = state.solarSystem[state.currentSystem];
  const sections = [];
  
  // Planet info
  sections.push(renderPlanetInfo(state, currentSystem));
  
  // Fuel status
  sections.push(renderFuelInfo(state));
  
  // Market info
  sections.push(renderMarketInfo(state, currentSystem));
  
  return sections.join('\n\n');
}

/**
 * Render space-specific content
 */
function renderSpaceContent(state: GameState): string {
  return '🚀 You are traveling through space...\nChoose your next action.';
}

/**
 * Render combat-specific content
 */
function renderCombatContent(state: GameState): string {
  const sections = [];
  
  sections.push('⚔️  COMBAT ENCOUNTER ⚔️');
  sections.push(`Opponent: ${getEncounterTypeName(state.encounterType)}`);
  sections.push(`Your Hull: ${state.ship.hull} | Enemy Hull: ${state.opponent.hull}`);
  
  // Check for combat resolution
  if (state.opponent.hull <= 0) {
    sections.push('');
    sections.push('🎉 VICTORY! Enemy ship destroyed!');
  } else if (state.ship.hull <= 0) {
    sections.push('');
    sections.push('💥 DEFEAT! Your ship is destroyed!');
  }
  
  return sections.join('\n');
}

/**
 * Render planet information
 */
function renderPlanetInfo(state: GameState, system: any): string {
  const lines = [
    `Planet: ${getSolarSystemName(state.currentSystem)}`,
    `Tech Level: ${system.techLevel} | Politics: ${system.politics} | Size: ${system.size}`
  ];
  
  if (system.specialResources !== -1) {
    const resources = ['Water', 'Furs', 'Food', 'Ore', 'Games', 'Firearms', 'Medicine', 'Machinery', 'Narcotics', 'Robots'];
    lines.push(`Special Resource: ${resources[system.specialResources]}`);
  }
  
  return lines.join('\n');
}

/**
 * Render fuel information
 */
function renderFuelInfo(state: GameState): string {
  const fuelStatus = getFuelStatus(state);
  const lines = [
    `Fuel: ${fuelStatus.currentFuel}/${fuelStatus.maxFuel} (${fuelStatus.fuelPercentage}%) | Cost per unit: ${fuelStatus.costPerUnit}`
  ];
  
  if (fuelStatus.fullRefuelCost > 0) {
    lines.push(`Full refuel cost: ${fuelStatus.fullRefuelCost} credits`);
  }
  
  return lines.join('\n');
}

/**
 * Render market information
 */
function renderMarketInfo(state: GameState, system: any): string {
  const lines = ['Market (Item: Buy Price | Sell Price | You Have | Max Affordable):'];
  const tradeItemNames = ['Water', 'Furs', 'Food', 'Ore', 'Games', 'Firearms', 'Medicine', 'Machinery', 'Narcotics', 'Robots'];
  const shipStatus = getCurrentShipStatus(state);
  const availableCargoSpace = shipStatus.cargoCapacity - shipStatus.cargoUsed;
  const allPrices = getAllSystemPrices(system, state.commanderTrader, state.policeRecordScore);
  
  for (let i = 0; i < Math.min(10, allPrices.length); i++) {
    const buyPrice = allPrices[i].buyPrice;
    const sellPrice = allPrices[i].sellPrice;
    const currentCargo = state.ship.cargo[i] || 0;
    
    if (buyPrice > 0 || sellPrice > 0 || currentCargo > 0) {
      const maxAffordable = buyPrice > 0 ? Math.min(Math.floor(state.credits / buyPrice), availableCargoSpace) : 0;
      lines.push(`  ${tradeItemNames[i]}: ${buyPrice > 0 ? buyPrice : 'N/A'} | ${sellPrice > 0 ? sellPrice : 'N/A'} | ${currentCargo} | ${maxAffordable}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Get encounter type name for display
 */
function getEncounterTypeName(encounterType: number): string {
  const encounterNames: { [key: number]: string } = {
    // Police encounters (0-9)
    0: 'Police Inspector',
    1: 'Police (Ignoring)',
    2: 'Police (Attacking)',
    3: 'Police (Fleeing)',
    
    // Pirate encounters (10-19)
    10: 'Pirate (Attacking)',
    11: 'Pirate (Fleeing)',
    12: 'Pirate (Ignoring)',
    13: 'Pirate (Surrendering)',
    
    // Trader encounters (20-29)
    20: 'Trader (Passing)',
    21: 'Trader (Fleeing)',
    22: 'Trader (Attacking)',
    23: 'Trader (Surrendering)',
    24: 'Trader (Selling)',
    25: 'Trader (Buying)',
    
    // Monster encounters (30-39)
    30: 'Space Monster (Attacking)',
    31: 'Space Monster (Ignoring)',
    
    // Dragonfly encounters (40-49)
    40: 'Dragonfly (Attacking)',
    41: 'Dragonfly (Ignoring)',
    
    // Scarab encounters (60-69)
    60: 'Scarab (Attacking)',
    61: 'Scarab (Ignoring)',
    
    // Famous captain encounters (70-79)
    70: 'Famous Captain',
    71: 'Famous Captain (Attacking)',
    72: 'Captain Ahab',
    73: 'Captain Conrad',
    74: 'Captain Huie',
    
    // Special encounters (80+)
    80: 'Marie Celeste',
    81: 'Bottle (Old)',
    82: 'Bottle (Good)',
    83: 'Post-Marie Police'
  };
  
  return encounterNames[encounterType] || `Unknown (${encounterType})`;
}
