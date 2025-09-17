// UI Fields Generation
// Derives contextual UI information from game state without modifying it

import type { State } from '../types.ts';
import { GameMode } from '../types.ts';
import { getSolarSystemName } from '../data/systems.ts';
import { getShipType, getShipTypeName } from '../data/shipTypes.ts';
import { getTradeItems } from '../data/tradeItems.ts';

export interface UiFields {
  // Context-specific information organized by UI concern
  location?: {
    systemName: string;
    statusMessage: string;          // "The system is under no particular pressure"
    specialEvents: string[];        // War, plague, special events
    marketConditions: string[];     // Market status descriptions
  };
  
  encounter?: {
    locationMessage: string;        // "At X clicks from destination, encountered..."
    opponentDescription: string;    // Ship type and status
    combatStatus: string[];         // Hull percentages, damage state
    tacticalInfo: string[];         // Weapons, shields, tactical situation
  };
  
  ship?: {
    repairStatus: string;           // "No repairs are needed" or repair cost
    fuelStatus: string;             // Fuel level and range
    cargoStatus: string;            // Cargo space and contents
    equipmentStatus: string[];      // Installed equipment descriptions
    warnings: string[];             // Critical ship warnings
  };
  
  financial?: {
    creditStatus: string;           // Current credits
    debtStatus?: string;            // Debt warnings if applicable  
    purchaseRequirements: string[]; // "You need $X for..." messages
    affordability: string[];        // What can/cannot be afforded
  };
  
  quests?: {
    activeQuests: string[];         // Current quest descriptions
    questUpdates: string[];         // Recent quest status changes
    specialNotices: string[];       // Important quest-related info
  };
  
  // Priority-based messages for main display
  primary: string;                  // Most important current message
  secondary: string[];              // Additional context information
  warnings: string[];               // Critical warnings needing attention
  flavor: string[];                 // Atmospheric flavor text
}

/**
 * Generate UI fields from current game state
 * This function is pure - it only reads from state, never modifies it
 */
export function getUiFields(state: State): UiFields {
  const fields: UiFields = {
    primary: '',
    secondary: [],
    warnings: [],
    flavor: []
  };
  
  // Generate context-specific information based on current game mode
  switch (state.currentMode) {
    case GameMode.OnPlanet:
      generatePlanetUiFields(state, fields);
      break;
    case GameMode.InCombat:
      generateCombatUiFields(state, fields);
      break;
  }
  
  // Add cross-context information
  addShipStatusFields(state, fields);
  addFinancialFields(state, fields);
  addQuestFields(state, fields);
  
  // Set primary message if not already set
  if (!fields.primary) {
    fields.primary = generatePrimaryMessage(state);
  }
  
  return fields;
}

/**
 * Generate UI fields when docked at a planet
 */
function generatePlanetUiFields(state: State, fields: UiFields): void {
  const currentSystem = state.solarSystem[state.currentSystem];
  const systemName = getSolarSystemName(state.currentSystem);
  
  // Location information
  fields.location = {
    systemName: systemName,
    statusMessage: getSystemStatusMessage(currentSystem),
    specialEvents: getSystemSpecialEvents(state, currentSystem),
    marketConditions: getMarketConditions(state, currentSystem)
  };
  
  fields.primary = `Docked at ${systemName}`;
  
  // Add flavor text about the system
  if (currentSystem.specialResources > 0) {
    fields.flavor.push(getResourceFlavorText(currentSystem.specialResources));
  }
}


/**
 * Generate UI fields during combat encounters
 */
function generateCombatUiFields(state: State, fields: UiFields): void {
  const destinationName = getSolarSystemName(state.warpSystem);
  const opponentShipName = getShipTypeName(state.opponent.type);
  
  fields.encounter = {
    locationMessage: `At ${state.clicks} clicks from ${destinationName}, encountered a ${getEncounterTypeName(state.encounterType)}`,
    opponentDescription: `${opponentShipName} (Hull: ${state.opponent.hull})`,
    combatStatus: generateCombatStatus(state),
    tacticalInfo: generateTacticalInfo(state)
  };
  
  fields.primary = fields.encounter.locationMessage;
}

/**
 * Add ship status information
 */
function addShipStatusFields(state: State, fields: UiFields): void {
  const shipType = getShipType(state.ship.type);
  const maxHull = shipType.hullStrength;
  const maxFuel = shipType.fuelTanks;
  
  fields.ship = {
    repairStatus: state.ship.hull >= maxHull 
      ? "No repairs are needed."
      : `Full repair will cost ${(maxHull - state.ship.hull) * shipType.repairCosts} cr.`,
    fuelStatus: `You have fuel to fly ${state.ship.fuel} parsecs.`,
    cargoStatus: generateCargoStatus(state),
    equipmentStatus: generateEquipmentStatus(state),
    warnings: []
  };
  
  // Add warnings for critical ship status
  if (state.ship.hull < maxHull * 0.3) {
    fields.ship.warnings.push("Your hull strength is at " + Math.round((state.ship.hull / maxHull) * 100) + "%.");
    fields.warnings.push("Your hull strength is at " + Math.round((state.ship.hull / maxHull) * 100) + "%.");
  }
  
  if (state.ship.fuel < 3) {
    fields.ship.warnings.push("You have fuel to fly " + state.ship.fuel + " parsecs.");
    fields.warnings.push("You have fuel to fly " + state.ship.fuel + " parsecs.");
  }
}

/**
 * Add financial status information
 */
function addFinancialFields(state: State, fields: UiFields): void {
  fields.financial = {
    creditStatus: `${state.credits.toLocaleString()} cr.`,
    purchaseRequirements: [],
    affordability: []
  };
  
  // Add debt status if applicable
  if (state.debt > 0) {
    fields.financial.debtStatus = `You have a debt of ${state.debt.toLocaleString()} credits.`;
    if (state.debt > 75000) {
      fields.warnings.push("You have a debt of " + state.debt.toLocaleString() + " credits.");
    }
  }
  
  // Add purchase requirement messages
  const escapePodCost = 2000; // From Palm OS constants
  if (!state.escapePod && state.credits < escapePodCost) {
    fields.financial.purchaseRequirements.push(`You need 2000 cr. for an escape pod.`);
  }
}

/**
 * Add quest and special event information
 */
function addQuestFields(state: State, fields: UiFields): void {
  fields.quests = {
    activeQuests: [],
    questUpdates: [],
    specialNotices: []
  };
  
  // Check for active quests (simplified - real implementation would check all quest status fields)
  if (state.japoriDiseaseStatus === 1) {
    fields.quests.activeQuests.push("Deliver antidote to Japori.");
  }
  
  if (state.monsterStatus === 1) {
    fields.quests.activeQuests.push("Kill the space monster at Acamar.");
  }
  
  // Add tribble notices
  if (state.ship.tribbles > 0) {
    if (state.ship.tribbles === 1) {
      fields.quests.specialNotices.push("1 cute, furry tribble.");
    } else {
      fields.quests.specialNotices.push(`${state.ship.tribbles} cute, furry tribbles.`);
    }
    
    if (state.ship.tribbles > 100) {
      fields.warnings.push("An infestation of tribbles.");
    }
  }
}

// Helper functions for generating specific UI text

function getSystemStatusMessage(system: any): string {
  switch (system.status) {
    case 0: return "under no particular pressure";
    case 1: return "at war";
    case 2: return "ravaged by a plague";
    case 3: return "suffering from a drought";
    case 4: return "suffering from extreme boredom";
    case 5: return "suffering from a cold spell";
    case 6: return "suffering from a crop failure";
    case 7: return "lacking enough workers";
    default: return "under no particular pressure";
  }
}

function getSystemSpecialEvents(state: State, system: any): string[] {
  const events: string[] = [];
  
  // Check for system-specific special events
  if (state.currentSystem === 22 && state.japoriDiseaseStatus === 1) { // Japori system
    events.push("Disease outbreak - medical supplies urgently needed");
  }
  
  return events;
}

function getMarketConditions(state: State, system: any): string[] {
  const conditions: string[] = [];
  
  // Add market condition descriptions based on system properties
  if (system.techLevel >= 7) {
    conditions.push("High-tech market with advanced goods available");
  }
  
  if (system.size >= 4) {
    conditions.push("Large market with high demand");
  }
  
  return conditions;
}

function getResourceFlavorText(resourceType: number): string {
  const flavorTexts = [
    "", // Nothing special
    "Mineral rich",
    "Mineral poor", 
    "Desert",
    "Sweetwater oceans",
    "Rich soil",
    "Poor soil", 
    "Rich fauna",
    "Lifeless",
    "Weird mushrooms",
    "Special herbs",
    "Artistic populace",
    "Warlike populace"
  ];
  
  return flavorTexts[resourceType] || "";
}

function generateCargoStatus(state: State): string {
  const tradeItems = getTradeItems();
  const totalCargo = state.ship.cargo.reduce((sum, qty) => sum + qty, 0);
  const shipType = getShipType(state.ship.type);
  
  if (totalCargo === 0) {
    return "No cargo.";
  }
  
  const cargoList = state.ship.cargo
    .map((qty, index) => qty > 0 ? `${qty} ${tradeItems[index].name}` : null)
    .filter(item => item !== null);
  
  return `${cargoList.join(', ')}.`;
}

function generateEquipmentStatus(state: State): string[] {
  const equipment: string[] = [];
  
  // Add weapon descriptions
  const weaponNames = ["Pulse laser", "Beam laser", "Military laser", "Morgan's laser"];
  state.ship.weapon.forEach((weapon, index) => {
    if (weapon >= 0 && weapon < weaponNames.length) {
      equipment.push(weaponNames[weapon]);
    }
  });
  
  // Add shield descriptions  
  const shieldNames = ["Energy shield", "Reflective shield", "Lightning shield"];
  state.ship.shield.forEach((shield, index) => {
    if (shield >= 0 && shield < shieldNames.length) {
      equipment.push(shieldNames[shield]);
    }
  });
  
  return equipment;
}

function generateCombatStatus(state: State): string[] {
  const status: string[] = [];
  const shipType = getShipType(state.ship.type);
  const opponentShipType = getShipType(state.opponent.type);
  
  const playerHullPercent = Math.round((state.ship.hull / shipType.hullStrength) * 100);
  const opponentHullPercent = Math.round((state.opponent.hull / opponentShipType.hullStrength) * 100);
  
  status.push(`Your hull: ${playerHullPercent}%`);
  status.push(`Opponent hull: ${opponentHullPercent}%`);
  
  return status;
}

function generateTacticalInfo(state: State): string[] {
  const info: string[] = [];
  
  // Add weapon power comparison
  const playerWeaponPower = calculateWeaponPower(state.ship);
  const opponentWeaponPower = calculateWeaponPower(state.opponent);
  
  if (playerWeaponPower > opponentWeaponPower) {
    info.push("You have superior firepower");
  } else if (opponentWeaponPower > playerWeaponPower) {
    info.push("Opponent has superior firepower");
  } else {
    info.push("Firepower appears evenly matched");
  }
  
  return info;
}

function calculateWeaponPower(ship: any): number {
  const weaponPowers = [15, 25, 35, 85]; // Power values for each weapon type
  return ship.weapon.reduce((total: number, weapon: number) => {
    return total + (weapon >= 0 ? weaponPowers[weapon] || 0 : 0);
  }, 0);
}

function getEncounterTypeName(encounterType: number): string {
  if (encounterType >= 0 && encounterType <= 9) return "police ship";
  if (encounterType >= 10 && encounterType <= 19) return "pirate ship";
  if (encounterType >= 20 && encounterType <= 29) return "trader ship";
  if (encounterType >= 30 && encounterType <= 39) return "monster";
  if (encounterType >= 40 && encounterType <= 49) return "Dragonfly";
  if (encounterType >= 60 && encounterType <= 69) return "alien ship";
  return "alien ship";
}

function generatePrimaryMessage(state: State): string {
  // Fallback primary message generation
  switch (state.currentMode) {
    case GameMode.OnPlanet:
      return `Docked at ${getSolarSystemName(state.currentSystem)}`;
    case GameMode.InCombat:
      return state.clicks > 0 
        ? `Traveling to ${getSolarSystemName(state.warpSystem)}`
        : `Arrived at ${getSolarSystemName(state.currentSystem)}`;
    case GameMode.InCombat:
      return "In combat";
    default:
      return "Game status unknown";
  }
}
