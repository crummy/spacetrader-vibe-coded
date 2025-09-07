// Event Validation Framework
// Based on Palm OS Space Trader validation patterns

import type { GameState } from '../types.ts';
import { SpecialEventType, type SpecialEventId } from '../events/special.ts';

// Validation Result Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface EventValidationResult extends ValidationResult {
  canExecute: boolean;
  requirements: ValidationRequirement[];
}

export interface ValidationRequirement {
  type: 'credits' | 'cargo' | 'equipment' | 'quest' | 'reputation' | 'time';
  required: boolean;
  current: any;
  needed: any;
  description: string;
}

// Core Validation Functions

export function validateEventExecution(
  state: GameState, 
  eventType: SpecialEventId
): EventValidationResult {
  const requirements: ValidationRequirement[] = [];
  const errors: string[] = [];
  
  // Basic state validation
  if (!state || typeof state !== 'object') {
    errors.push('Invalid game state');
    return {
      isValid: false,
      canExecute: false,
      errors,
      requirements
    };
  }
  
  if (!state.ship) {
    errors.push('Invalid ship state');
    return {
      isValid: false,
      canExecute: false,
      errors,
      requirements
    };
  }
  
  // Event-specific validation
  switch (eventType) {
    case SpecialEventType.MOONFORSALE:
      return validateMoonPurchase(state, requirements, errors);
      
    case SpecialEventType.SKILLINCREASE:
      return validateSkillIncrease(state, requirements, errors);
      
    case SpecialEventType.ERASERECORD:
      return validateRecordErasure(state, requirements, errors);
      
    case SpecialEventType.TRANSPORTWILD:
      return validateWildTransport(state, requirements, errors);
      
    case SpecialEventType.MEDICINEDELIVERY:
      return validateMedicineDelivery(state, requirements, errors);
      
    case SpecialEventType.GETREACTOR:
      return validateReactorPickup(state, requirements, errors);
      
    case SpecialEventType.REACTORDELIVERED:
      return validateReactorDelivery(state, requirements, errors);
      
    case SpecialEventType.GETHULLUPGRADED:
      return validateHullUpgrade(state, requirements, errors);
      
    case SpecialEventType.JAREKGETSOUT:
      return validateJarekDisembark(state, requirements, errors);
      
    case SpecialEventType.ARTIFACTDELIVERY:
      return validateArtifactDelivery(state, requirements, errors);
      
    case SpecialEventType.WILDGETSOUT:
      return validateWildEscape(state, requirements, errors);
      
    case SpecialEventType.EXPERIMENTSTOPPED:
      return validateExperimentStopped(state, requirements, errors);
      
    default:
      return validateGenericEvent(state, eventType, requirements, errors);
  }
}

// Specific Event Validators

function validateMoonPurchase(
  state: GameState, 
  requirements: ValidationRequirement[], 
  errors: string[]
): EventValidationResult {
  const moonCost = 500000;
  
  // Credit requirement
  requirements.push({
    type: 'credits',
    required: true,
    current: state.credits,
    needed: moonCost,
    description: `Need ${moonCost} credits to purchase moon`
  });
  
  if (state.credits < moonCost) {
    errors.push(`Insufficient credits. Need ${moonCost}, have ${state.credits}`);
  }
  
  // Check if already owns moon
  if (state.moonBought) {
    errors.push('You already own a moon');
  }
  
  return {
    isValid: errors.length === 0,
    canExecute: errors.length === 0,
    errors,
    requirements
  };
}

function validateSkillIncrease(
  state: GameState, 
  requirements: ValidationRequirement[], 
  errors: string[]
): EventValidationResult {
  const cost = 1000;
  
  // Credit requirement
  requirements.push({
    type: 'credits',
    required: true,
    current: state.credits,
    needed: cost,
    description: `Need ${cost} credits for skill increase`
  });
  
  if (state.credits < cost) {
    errors.push(`Insufficient credits. Need ${cost}, have ${state.credits}`);
  }
  
  // Check if any skills can be improved
  const skills = [
    { name: 'pilot', value: state.commanderPilot },
    { name: 'fighter', value: state.commanderFighter },
    { name: 'trader', value: state.commanderTrader },
    { name: 'engineer', value: state.commanderEngineer }
  ];
  
  const improvableSkills = skills.filter(skill => skill.value < 10);
  
  requirements.push({
    type: 'quest',
    required: true,
    current: improvableSkills.length,
    needed: 1,
    description: 'Need at least one skill below maximum (10)'
  });
  
  if (improvableSkills.length === 0) {
    errors.push('All skills are already at maximum level');
  }
  
  return {
    isValid: errors.length === 0,
    canExecute: errors.length === 0,
    errors,
    requirements
  };
}

function validateRecordErasure(
  state: GameState, 
  requirements: ValidationRequirement[], 
  errors: string[]
): EventValidationResult {
  const cost = 5000;
  
  // Credit requirement
  requirements.push({
    type: 'credits',
    required: true,
    current: state.credits,
    needed: cost,
    description: `Need ${cost} credits to erase criminal record`
  });
  
  if (state.credits < cost) {
    errors.push(`Insufficient credits. Need ${cost}, have ${state.credits}`);
  }
  
  // Check if has criminal record to erase
  requirements.push({
    type: 'reputation',
    required: true,
    current: state.policeRecordScore,
    needed: 'negative',
    description: 'Must have criminal record to erase'
  });
  
  if (state.policeRecordScore >= 0) {
    errors.push('You do not have a criminal record to erase');
  }
  
  return {
    isValid: errors.length === 0,
    canExecute: errors.length === 0,
    errors,
    requirements
  };
}

function validateWildTransport(
  state: GameState, 
  requirements: ValidationRequirement[], 
  errors: string[]
): EventValidationResult {
  // Equipment requirement - need beam laser
  const hasBeamLaser = state.ship.weapon.some(weapon => weapon === 1);
  
  requirements.push({
    type: 'equipment',
    required: true,
    current: hasBeamLaser,
    needed: true,
    description: 'Need beam laser weapon to transport Wild'
  });
  
  if (!hasBeamLaser) {
    errors.push('Requires beam laser weapon to transport the dangerous criminal Wild');
  }
  
  // Check police record - Wild is a criminal job
  requirements.push({
    type: 'reputation',
    required: false,
    current: state.policeRecordScore,
    needed: 'dubious_or_worse',
    description: 'Criminal reputation makes this easier but not required'
  });
  
  return {
    isValid: errors.length === 0,
    canExecute: errors.length === 0,
    errors,
    requirements
  };
}

function validateMedicineDelivery(
  state: GameState, 
  requirements: ValidationRequirement[], 
  errors: string[]
): EventValidationResult {
  // Quest requirement - Japori disease must be active
  requirements.push({
    type: 'quest',
    required: true,
    current: state.japoriDiseaseStatus,
    needed: 1,
    description: 'Japori disease outbreak must be active'
  });
  
  if (state.japoriDiseaseStatus !== 1) {
    errors.push('Japori disease quest is not active - no medicine to deliver');
  }
  
  return {
    isValid: errors.length === 0,
    canExecute: errors.length === 0,
    errors,
    requirements
  };
}

function validateReactorPickup(
  state: GameState, 
  requirements: ValidationRequirement[], 
  errors: string[]
): EventValidationResult {
  const reactorCargoNeeded = 15;
  
  // Calculate current cargo usage
  const filledBays = state.ship.cargo.reduce((sum, quantity) => sum + quantity, 0);
  const totalBays = 20; // Should get from ship type
  const availableBays = totalBays - filledBays;
  
  requirements.push({
    type: 'cargo',
    required: true,
    current: availableBays,
    needed: reactorCargoNeeded,
    description: `Need ${reactorCargoNeeded} empty cargo bays for unstable reactor`
  });
  
  if (availableBays < reactorCargoNeeded) {
    errors.push(`Insufficient cargo space. Need ${reactorCargoNeeded} empty bays, have ${availableBays}`);
  }
  
  // Check if already has reactor
  if (state.reactorStatus > 0) {
    errors.push('You already have a reactor aboard');
  }
  
  return {
    isValid: errors.length === 0,
    canExecute: errors.length === 0,
    errors,
    requirements
  };
}

function validateReactorDelivery(
  state: GameState, 
  requirements: ValidationRequirement[], 
  errors: string[]
): EventValidationResult {
  // Must have reactor aboard
  requirements.push({
    type: 'quest',
    required: true,
    current: state.reactorStatus,
    needed: 'positive',
    description: 'Must be carrying unstable reactor'
  });
  
  if (state.reactorStatus === 0) {
    errors.push('You are not carrying an unstable reactor');
  }
  
  // Add time pressure warning if reactor is critical
  if (state.reactorStatus <= 2) {
    requirements.push({
      type: 'time',
      required: false,
      current: state.reactorStatus,
      needed: 'urgent',
      description: 'Reactor is critically unstable - deliver immediately!'
    });
  }
  
  return {
    isValid: errors.length === 0,
    canExecute: errors.length === 0,
    errors,
    requirements
  };
}

function validateHullUpgrade(
  state: GameState, 
  requirements: ValidationRequirement[], 
  errors: string[]
): EventValidationResult {
  // Must have destroyed Scarab
  requirements.push({
    type: 'quest',
    required: true,
    current: state.scarabStatus,
    needed: 2,
    description: 'Must defeat the Scarab first'
  });
  
  if (state.scarabStatus < 2) {
    errors.push('You must defeat the Scarab before getting a hull upgrade');
  }
  
  // Check if already upgraded
  if (state.scarabStatus >= 3) {
    errors.push('You have already received the hull upgrade');
  }
  
  return {
    isValid: errors.length === 0,
    canExecute: errors.length === 0,
    errors,
    requirements
  };
}

function validateJarekDisembark(
  state: GameState, 
  requirements: ValidationRequirement[], 
  errors: string[]
): EventValidationResult {
  // Must have Jarek aboard
  requirements.push({
    type: 'quest',
    required: true,
    current: state.jarekStatus,
    needed: 1,
    description: 'Ambassador Jarek must be aboard'
  });
  
  if (state.jarekStatus !== 1) {
    errors.push('Ambassador Jarek is not aboard your ship');
  }
  
  return {
    isValid: errors.length === 0,
    canExecute: errors.length === 0,
    errors,
    requirements
  };
}

function validateArtifactDelivery(
  state: GameState, 
  requirements: ValidationRequirement[], 
  errors: string[]
): EventValidationResult {
  // Must have artifact aboard
  requirements.push({
    type: 'quest',
    required: true,
    current: state.artifactOnBoard,
    needed: true,
    description: 'Must be carrying alien artifact'
  });
  
  if (!state.artifactOnBoard) {
    errors.push('You are not carrying an alien artifact');
  }
  
  return {
    isValid: errors.length === 0,
    canExecute: errors.length === 0,
    errors,
    requirements
  };
}

function validateWildEscape(
  state: GameState, 
  requirements: ValidationRequirement[], 
  errors: string[]
): EventValidationResult {
  // Check Wild status from composite variable
  const wildStatus = state.experimentAndWildStatus & 0xFF;
  
  requirements.push({
    type: 'quest',
    required: true,
    current: wildStatus,
    needed: 1,
    description: 'Jonathan Wild must be aboard'
  });
  
  if (wildStatus !== 1) {
    errors.push('Jonathan Wild is not aboard your ship');
  }
  
  return {
    isValid: errors.length === 0,
    canExecute: errors.length === 0,
    errors,
    requirements
  };
}

function validateExperimentStopped(
  state: GameState, 
  requirements: ValidationRequirement[], 
  errors: string[]
): EventValidationResult {
  // Check experiment status from composite variable
  const experimentStatus = (state.experimentAndWildStatus >> 8) & 0xFF;
  
  requirements.push({
    type: 'quest',
    required: true,
    current: experimentStatus,
    needed: 'positive',
    description: 'Dr. Fehler experiment must be active'
  });
  
  if (experimentStatus === 0) {
    errors.push('Dr. Fehler is not conducting dangerous experiments');
  }
  
  return {
    isValid: errors.length === 0,
    canExecute: errors.length === 0,
    errors,
    requirements
  };
}

function validateGenericEvent(
  state: GameState, 
  eventType: SpecialEventId,
  requirements: ValidationRequirement[], 
  errors: string[]
): EventValidationResult {
  // Default validation for events without specific rules
  return {
    isValid: true,
    canExecute: true,
    errors,
    requirements
  };
}

// System-Level Validation

export function validateSystemSpecialEventAccess(
  state: GameState, 
  systemIndex: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (systemIndex < 0 || systemIndex >= state.solarSystem.length) {
    errors.push('Invalid system index');
    return { isValid: false, errors, warnings };
  }
  
  const system = state.solarSystem[systemIndex];
  const specialEvent = system.special;
  
  if (specialEvent === undefined || specialEvent < 0) {
    return { isValid: true, errors, warnings }; // No special event
  }
  
  // Check complex availability conditions from Palm OS
  const openQuests = countOpenQuests(state);
  
  // Quest limit check (Palm OS limited to ~3-4 concurrent quests)
  if (openQuests > 3) {
    const questStartingEvents = [
      SpecialEventType.TRIBBLE,
      SpecialEventType.SPACEMONSTER,
      SpecialEventType.DRAGONFLY,
      SpecialEventType.JAPORI,
      SpecialEventType.ALIENARTIFACT,
      SpecialEventType.AMBASSADORJAREK,
      SpecialEventType.ALIENINVASION,
      SpecialEventType.EXPERIMENT,
      SpecialEventType.TRANSPORTWILD,
      SpecialEventType.GETREACTOR,
      SpecialEventType.SCARAB
    ];
    
    if (questStartingEvents.includes(specialEvent as any)) {
      warnings.push('Too many active quests - this event may not be available');
    }
  }
  
  // Specific event availability checks
  switch (specialEvent) {
    case SpecialEventType.BUYTRIBBLE:
      if (state.ship.tribbles <= 0) {
        errors.push('Tribble buyer not interested - no tribbles to sell');
      }
      break;
      
    case SpecialEventType.ERASERECORD:
      if (state.policeRecordScore >= 0) { // DUBIOUSSCORE equivalent
        errors.push('Record eraser not available - no criminal record');
      }
      break;
      
    case SpecialEventType.CARGOFORSALE:
      const filledBays = state.ship.cargo.reduce((sum, q) => sum + q, 0);
      const totalBays = 20; // Should get from ship type
      if (filledBays > totalBays - 3) {
        errors.push('Cargo seller not available - insufficient cargo space');
      }
      break;
      
    case SpecialEventType.MOONFORSALE:
      const netWorth = calculateNetWorth(state);
      const moonCost = 500000;
      if (state.moonBought) {
        errors.push('Moon already purchased');
      } else if (netWorth < moonCost * 0.8) { // 80% of cost threshold
        errors.push('Moon seller not interested - insufficient net worth');
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Helper Functions

function countOpenQuests(state: GameState): number {
  let count = 0;
  
  if (state.monsterStatus === 1) count++;
  if (state.dragonflyStatus >= 1 && state.dragonflyStatus <= 4) count++;
  if (state.japoriDiseaseStatus === 1) count++;
  if (state.artifactOnBoard) count++;
  if (state.wildStatus === 1) count++;
  if (state.jarekStatus === 1) count++;
  if (state.invasionStatus >= 1 && state.invasionStatus < 7) count++;
  // Use experimentAndWildStatus to extract experiment status (upper 8 bits)
  const experimentStatus = (state.experimentAndWildStatus >> 8) & 0xFF;
  if (experimentStatus >= 1 && experimentStatus < 11) count++;
  if (state.reactorStatus >= 1 && state.reactorStatus < 21) count++;
  if (state.scarabStatus === 1) count++;
  if (state.ship.tribbles > 0) count++;
  if (state.moonBought) count++;
  
  return count;
}

function calculateNetWorth(state: GameState): number {
  // Simplified net worth calculation
  let worth = state.credits - state.debt;
  
  // Add ship value (simplified)
  worth += 10000; // Base ship value
  
  // Add cargo value (simplified)
  const cargoValue = state.ship.cargo.reduce((sum, quantity, index) => {
    return sum + (quantity * 100); // Assume 100 cr per unit
  }, 0);
  worth += cargoValue;
  
  return worth;
}

// Validation utilities for testing and debugging

export function getValidationSummary(result: EventValidationResult): string {
  const parts: string[] = [];
  
  if (!result.canExecute) {
    parts.push(`❌ Cannot execute: ${result.errors.join(', ')}`);
  } else {
    parts.push('✅ Can execute');
  }
  
  if (result.requirements.length > 0) {
    parts.push('\nRequirements:');
    for (const req of result.requirements) {
      const status = validateRequirement(req) ? '✅' : '❌';
      parts.push(`  ${status} ${req.description}`);
    }
  }
  
  return parts.join('\n');
}

function validateRequirement(req: ValidationRequirement): boolean {
  switch (req.type) {
    case 'credits':
      return req.current >= req.needed;
    case 'cargo':
      return req.current >= req.needed;
    case 'equipment':
      return req.current === req.needed;
    case 'quest':
      if (req.needed === 'positive') return req.current > 0;
      if (req.needed === 'negative') return req.current < 0;
      return req.current === req.needed;
    case 'reputation':
      if (req.needed === 'negative') return req.current < 0;
      return true; // Other reputation checks are advisory
    case 'time':
      return true; // Time checks are usually warnings
    default:
      return true;
  }
}
