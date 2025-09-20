import type { 
  Ship, 
  CrewMember
} from '../types/ship.ts';
import { 
  Difficulty, 
  Gadget,
  WeaponType,
  MAXSKILL, 
  SKILLBONUS, 
  CLOAKBONUS 
} from '../types/ship.ts';

export class SkillSystem {

  /**
   * Calculate pilot skill - highest among crew plus gadget bonuses
   */
  calculatePilotSkill(ship: Ship, difficulty: Difficulty, jarekStatus = 0): number {
    let maxSkill = 0;
    
    // Find highest pilot skill among crew
    for (const crewMember of ship.crew) {
      if (crewMember.pilot > maxSkill) {
        maxSkill = crewMember.pilot;
      }
    }

    // Add navigating system bonus
    if (this.hasGadget(ship, Gadget.NAVIGATING_SYSTEM)) {
      maxSkill += SKILLBONUS; // +2
    }

    // Add cloaking device bonus
    if (this.hasGadget(ship, Gadget.CLOAKING_DEVICE)) {
      maxSkill += CLOAKBONUS; // +5
    }

    return this.adaptDifficulty(maxSkill, difficulty);
  }

  /**
   * Calculate fighter skill - highest among crew plus targeting system bonus
   */
  calculateFighterSkill(ship: Ship, difficulty: Difficulty): number {
    let maxSkill = 0;
    
    // Find highest fighter skill among crew
    for (const crewMember of ship.crew) {
      if (crewMember.fighter > maxSkill) {
        maxSkill = crewMember.fighter;
      }
    }

    // Add targeting system bonus
    if (this.hasGadget(ship, Gadget.TARGETING_SYSTEM)) {
      maxSkill += SKILLBONUS; // +2
    }

    return this.adaptDifficulty(maxSkill, difficulty);
  }

  /**
   * Calculate trader skill - highest among crew plus Jarek bonus
   */
  calculateTraderSkill(ship: Ship, difficulty: Difficulty, jarekStatus = 0): number {
    let maxSkill = 0;
    
    // Find highest trader skill among crew
    for (const crewMember of ship.crew) {
      if (crewMember.trader > maxSkill) {
        maxSkill = crewMember.trader;
      }
    }

    // Add Jarek bonus if he has been delivered (status >= 2)
    if (jarekStatus >= 2) {
      maxSkill += 1;
    }

    return this.adaptDifficulty(maxSkill, difficulty);
  }

  /**
   * Calculate engineer skill - highest among crew plus auto repair bonus
   */
  calculateEngineerSkill(ship: Ship, difficulty: Difficulty): number {
    let maxSkill = 0;
    
    // Find highest engineer skill among crew
    for (const crewMember of ship.crew) {
      if (crewMember.engineer > maxSkill) {
        maxSkill = crewMember.engineer;
      }
    }

    // Add auto repair system bonus
    if (this.hasGadget(ship, Gadget.AUTO_REPAIR_SYSTEM)) {
      maxSkill += SKILLBONUS; // +2
    }

    return this.adaptDifficulty(maxSkill, difficulty);
  }

  /**
   * Adapt skill level based on difficulty
   */
  adaptDifficulty(level: number, difficulty: Difficulty): number {
    if (difficulty === Difficulty.BEGINNER || difficulty === Difficulty.EASY) {
      return level + 1;
    } else if (difficulty === Difficulty.IMPOSSIBLE) {
      return Math.max(1, level - 1);
    } else {
      return level;
    }
  }

  /**
   * Increase a random skill that isn't at maximum
   */
  increaseRandomSkill(commander: CrewMember): void {
    if (commander.pilot >= MAXSKILL && commander.fighter >= MAXSKILL &&
        commander.trader >= MAXSKILL && commander.engineer >= MAXSKILL) {
      return; // All skills maxed
    }

    let skillIncreased = false;
    while (!skillIncreased) {
      const skillType = Math.floor(Math.random() * 4);
      
      switch (skillType) {
        case 0: // Pilot
          if (commander.pilot < MAXSKILL) {
            commander.pilot += 1;
            skillIncreased = true;
          }
          break;
        case 1: // Fighter
          if (commander.fighter < MAXSKILL) {
            commander.fighter += 1;
            skillIncreased = true;
          }
          break;
        case 2: // Trader
          if (commander.trader < MAXSKILL) {
            commander.trader += 1;
            skillIncreased = true;
          }
          break;
        case 3: // Engineer
          if (commander.engineer < MAXSKILL) {
            commander.engineer += 1;
            skillIncreased = true;
          }
          break;
      }
    }
  }

  /**
   * Decrease a random skill by specified amount
   */
  decreaseRandomSkill(commander: CrewMember, amount: number): void {
    const skillsAboveAmount = [];
    
    if (commander.pilot > amount) skillsAboveAmount.push('pilot');
    if (commander.fighter > amount) skillsAboveAmount.push('fighter');
    if (commander.trader > amount) skillsAboveAmount.push('trader');
    if (commander.engineer > amount) skillsAboveAmount.push('engineer');
    
    if (skillsAboveAmount.length === 0) return;
    
    const skillToDecrease = skillsAboveAmount[Math.floor(Math.random() * skillsAboveAmount.length)];
    
    switch (skillToDecrease) {
      case 'pilot':
        commander.pilot -= amount;
        break;
      case 'fighter':
        commander.fighter -= amount;
        break;
      case 'trader':
        commander.trader -= amount;
        break;
      case 'engineer':
        commander.engineer -= amount;
        break;
    }
  }

  /**
   * Apply skill tonic effects based on difficulty
   */
  tonicTweakRandomSkill(commander: CrewMember, difficulty: Difficulty): void {
    const originalSkills = { ...commander };
    
    if (difficulty < Difficulty.HARD) {
      // Easy/Normal: +1 to one skill, -1 to another (net 0)
      let skillsChanged = false;
      while (!skillsChanged) {
        this.increaseRandomSkill(commander);
        this.decreaseRandomSkill(commander, 1);
        
        // Check if any skills actually changed
        skillsChanged = 
          originalSkills.pilot !== commander.pilot ||
          originalSkills.fighter !== commander.fighter ||
          originalSkills.trader !== commander.trader ||
          originalSkills.engineer !== commander.engineer;
      }
    } else {
      // Hard/Impossible: +1 to two skills, -3 to one skill (net -1)
      this.increaseRandomSkill(commander);
      this.increaseRandomSkill(commander);
      this.decreaseRandomSkill(commander, 3);
    }
  }

  /**
   * Find the nth lowest skill (1 = lowest, 2 = second lowest, etc.)
   */
  nthLowestSkill(ship: { crew: CrewMember[] }, n: number): string {
    const commander = ship.crew[0];
    const skills = [
      { name: 'pilot', value: commander.pilot },
      { name: 'fighter', value: commander.fighter },
      { name: 'trader', value: commander.trader },
      { name: 'engineer', value: commander.engineer }
    ];

    // Sort by skill value, then by order (pilot, fighter, trader, engineer for ties)
    skills.sort((a, b) => {
      if (a.value !== b.value) {
        return a.value - b.value;
      }
      // Tie-breaking order
      const order = ['pilot', 'fighter', 'trader', 'engineer'];
      return order.indexOf(a.name) - order.indexOf(b.name);
    });

    return skills[n - 1]?.name || 'pilot';
  }

  /**
   * Generate random skill value (2-11 range)
   */
  randomSkill(): number {
    return 1 + Math.floor(Math.random() * 5) + Math.floor(Math.random() * 6);
  }

  /**
   * Check if ship has a specific gadget
   */
  hasGadget(ship: Ship, gadgetType: Gadget): boolean {
    return ship.gadgets.some(gadget => gadget.type === gadgetType);
  }

  /**
   * Check if ship has a specific weapon type
   * If exactCompare is false, returns true for better weapons too
   */
  hasWeapon(ship: Ship, weaponType: WeaponType, exactCompare: boolean): boolean {
    return ship.weapons.some(weapon => {
      if (exactCompare) {
        return weapon.type === weaponType;
      } else {
        return weapon.type >= weaponType;
      }
    });
  }

  /**
   * Check if ship has a specific shield type
   */
  hasShield(ship: Ship, shieldType: number): boolean {
    return ship.shields.some(shield => shield.type === shieldType);
  }
}
