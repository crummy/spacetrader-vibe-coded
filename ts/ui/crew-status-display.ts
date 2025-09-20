// Crew status display functions for UI
// Shows crew information including skill bonuses

import type { State } from '../types.ts';
import { calculateEffectiveTraderSkill } from '../economy/skill-utils.ts';

/**
 * Get crew status display including skill bonuses (Palm OS compliance)
 * @param state Game state
 * @returns String describing crew status with bonuses
 */
export function getCrewStatusDisplay(state: State): string {
  const parts = [];
  
  // Commander base skills
  parts.push(`Commander: Pilot ${state.commanderPilot}, Fighter ${state.commanderFighter}, Trader ${state.commanderTrader}, Engineer ${state.commanderEngineer}`);
  
  // Difficulty modifiers
  if (state.difficulty === 0 || state.difficulty === 1) { // Beginner/Easy
    parts.push('Difficulty bonus: +1 to all skills');
  } else if (state.difficulty === 4) { // Impossible
    parts.push('Difficulty penalty: -1 to all skills');
  }
  
  // Jarek trader bonus
  if (state.jarekStatus >= 2) {
    const effectiveTrader = calculateEffectiveTraderSkill(state);
    const baseTrader = state.commanderTrader;
    const difficultyBonus = (state.difficulty === 0 || state.difficulty === 1) ? 1 : 
                            (state.difficulty === 4) ? -1 : 0;
    const jarekBonus = effectiveTrader - baseTrader - difficultyBonus;
    
    if (jarekBonus > 0) {
      parts.push(`Jarek skill bonus: +${jarekBonus} to Trader skill`);
    }
  }
  
  // Gadget bonuses
  const gadgets = state.ship.gadget.filter(g => g >= 0);
  if (gadgets.length > 0) {
    const gadgetBonuses = [];
    // These would need to be implemented based on actual gadget types
    // For now, just show that gadgets provide bonuses
    if (gadgets.some(g => g === 2)) gadgetBonuses.push('Navigating System: +2 Pilot');
    if (gadgets.some(g => g === 3)) gadgetBonuses.push('Targeting System: +2 Fighter');
    if (gadgets.some(g => g === 1)) gadgetBonuses.push('Auto-Repair: +2 Engineer');
    if (gadgets.some(g => g === 4)) gadgetBonuses.push('Cloaking Device: +5 Pilot');
    
    if (gadgetBonuses.length > 0) {
      parts.push(`Equipment bonuses: ${gadgetBonuses.join(', ')}`);
    }
  }
  
  return parts.join('\n');
}
