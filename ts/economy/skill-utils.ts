// Skill calculation utilities for economy and pricing
// Integrates SkillSystem with game state for economic calculations

import type { State } from '../types.ts';
import { SkillSystem } from '../src/combat/skill-system.ts';
import { Gadget } from '../src/types/ship.ts';

/**
 * Get player's effective trader skill including all bonuses
 * This is the main function the pricing system should use
 */
export function calculateEffectiveTraderSkill(state: State): number {
  const skillSystem = new SkillSystem();
  
  // Convert state format to ship format for skill calculation
  const ship = {
    crew: [
      {
        pilot: state.commanderPilot,
        fighter: state.commanderFighter,
        trader: state.commanderTrader,
        engineer: state.commanderEngineer
      }
    ],
    gadgets: state.ship.gadget
      .filter((gadgetType) => gadgetType >= 0)
      .map((gadgetType) => ({ type: gadgetType }))
  };
  
  return skillSystem.calculateTraderSkill(ship, state.difficulty, state.jarekStatus);
}

/**
 * Get player's effective pilot skill including all bonuses
 */
export function calculateEffectivePilotSkill(state: State): number {
  const skillSystem = new SkillSystem();
  
  const ship = {
    crew: [
      {
        pilot: state.commanderPilot,
        fighter: state.commanderFighter,
        trader: state.commanderTrader,
        engineer: state.commanderEngineer
      }
    ],
    gadgets: state.ship.gadget
      .filter((gadgetType) => gadgetType >= 0)
      .map((gadgetType) => ({ type: gadgetType }))
  };
  
  return skillSystem.calculatePilotSkill(ship, state.difficulty, state.jarekStatus);
}

/**
 * Get player's effective fighter skill including all bonuses
 */
export function calculateEffectiveFighterSkill(state: State): number {
  const skillSystem = new SkillSystem();
  
  const ship = {
    crew: [
      {
        pilot: state.commanderPilot,
        fighter: state.commanderFighter,
        trader: state.commanderTrader,
        engineer: state.commanderEngineer
      }
    ],
    gadgets: state.ship.gadget
      .filter((gadgetType) => gadgetType >= 0)
      .map((gadgetType) => ({ type: gadgetType }))
  };
  
  return skillSystem.calculateFighterSkill(ship, state.difficulty);
}

/**
 * Get player's effective engineer skill including all bonuses
 */
export function calculateEffectiveEngineerSkill(state: State): number {
  const skillSystem = new SkillSystem();
  
  const ship = {
    crew: [
      {
        pilot: state.commanderPilot,
        fighter: state.commanderFighter,
        trader: state.commanderTrader,
        engineer: state.commanderEngineer
      }
    ],
    gadgets: state.ship.gadget
      .filter((gadgetType) => gadgetType >= 0)
      .map((gadgetType) => ({ type: gadgetType }))
  };
  
  return skillSystem.calculateEngineerSkill(ship, state.difficulty);
}
