import type { 
  Ship, 
  CombatResult, 
  DamageResult
} from '../types/ship.js';
import { getShipTypes } from '../../data/shipTypes.ts';
import { 
  Difficulty, 
  WeaponType,
  ShipType,
  WEAPON_DATA,
  SHIP_DATA
} from '../types/ship.js';
import { SkillSystem } from './skill-system.js';

/**
 * Combat system implementing the original Space Trader combat mechanics
 */
export class CombatSystem {
  private skillSystem = new SkillSystem();

  /**
   * Calculate hit probability based on fighter vs pilot skill
   * Formula: Random(FighterSkill + DefenderShipSize) vs (FleeMultiplier × Random(5 + PilotSkill/2))
   */
  calculateHitProbability(
    fighterSkill: number, 
    pilotSkill: number, 
    defenderShipSize: number, 
    isDefenderFleeing: boolean
  ): number {
    const attackerRoll = Math.random() * (fighterSkill + defenderShipSize);
    const fleeMultiplier = isDefenderFleeing ? 2 : 1;
    const defenderRoll = fleeMultiplier * Math.random() * (5 + Math.floor(pilotSkill / 2));
    
    return attackerRoll >= defenderRoll ? 1 : 0;
  }

  /**
   * Calculate base damage from weapons modified by engineer skill
   * Formula: Random(WeaponPower × (100 + 2×EngineerSkill) / 100)
   */
  calculateBaseDamage(weaponPower: number, engineerSkill: number): number {
    if (weaponPower <= 0) return 0;
    
    const damageMultiplier = (100 + 2 * engineerSkill) / 100;
    const maxDamage = weaponPower * damageMultiplier;
    
    return Math.floor(Math.random() * maxDamage) + 1;
  }

  /**
   * Apply reactor damage boost for commanders under attack
   */
  applyReactorDamage(baseDamage: number, difficulty: Difficulty, isCommanderUnderAttack: boolean): number {
    if (!isCommanderUnderAttack) return baseDamage;
    
    let multiplier: number;
    if (difficulty < Difficulty.NORMAL) {
      multiplier = 1 + (difficulty + 1) * 0.25;
    } else {
      multiplier = 1 + (difficulty + 1) * 0.33;
    }
    
    return Math.floor(baseDamage * multiplier);
  }

  /**
   * Calculate damage for Scarab - only pulse laser and Morgan laser work
   */
  calculateScarabDamage(weapons: Array<{type: WeaponType, power: number}>, engineerSkill: number): number {
    const effectiveWeapons = weapons.filter(w => 
      w.type === WeaponType.PULSE_LASER || w.type === WeaponType.MORGAN_LASER
    );
    
    if (effectiveWeapons.length === 0) return 0;
    
    const totalPower = effectiveWeapons.reduce((sum, weapon) => sum + weapon.power, 0);
    return this.calculateBaseDamage(totalPower, engineerSkill);
  }

  /**
   * Apply damage to a ship, handling shields first then hull
   */
  applyDamage(defender: Ship, damage: number, defenderEngineerSkill: number): DamageResult {
    let remainingDamage = damage;
    let shieldDamage = 0;
    let hullDamage = 0;

    // First, deplete shields in order
    for (const shield of defender.shields) {
      if (shield.strength <= 0) continue;
      
      if (remainingDamage <= shield.strength) {
        shield.strength -= remainingDamage;
        shieldDamage += remainingDamage;
        remainingDamage = 0;
        break;
      } else {
        shieldDamage += shield.strength;
        remainingDamage -= shield.strength;
        shield.strength = 0;
      }
    }

    // Apply remaining damage to hull
    if (remainingDamage > 0) {
      // Engineer skill reduces hull damage
      const engineerReduction = Math.floor(Math.random() * defenderEngineerSkill);
      const actualHullDamage = Math.max(1, remainingDamage - engineerReduction);
      
      defender.hull = Math.max(0, defender.hull - actualHullDamage);
      hullDamage = actualHullDamage;
    }

    return {
      shieldDamage,
      hullDamage,
      totalDamage: shieldDamage + hullDamage
    };
  }

  /**
   * Calculate maximum hull damage per hit based on difficulty
   */
  calculateMaxHullDamage(maxHull: number, difficulty: Difficulty, isCommanderUnderAttack: boolean): number {
    if (isCommanderUnderAttack) {
      // Commander: maxHull / (5 - difficulty), so easier = more damage allowed
      const divisor = Math.max(1, (Difficulty.IMPOSSIBLE - difficulty));
      return Math.floor(maxHull / divisor);
    } else {
      // Opponents: always maxHull / 2
      return Math.floor(maxHull / 2);
    }
  }

  /**
   * Execute a complete combat round
   */
  executeCombatRound(
    playerShip: Ship, 
    opponentShip: Ship, 
    playerFlees: boolean, 
    opponentFlees: boolean,
    difficulty: Difficulty
  ): CombatResult {
    const result: CombatResult = {
      playerHit: false,
      opponentHit: false,
      playerDamage: 0,
      opponentDamage: 0,
      playerShieldDamage: 0,
      opponentShieldDamage: 0,
      playerHullDamage: 0,
      opponentHullDamage: 0,
      playerDestroyed: false,
      opponentDestroyed: false
    };

    // Beginner level - no damage when fleeing
    if (difficulty === Difficulty.BEGINNER && playerFlees) {
      return result;
    }

    // Calculate skills
    const playerPilotSkill = this.skillSystem.calculatePilotSkill(playerShip, difficulty);
    const playerFighterSkill = this.skillSystem.calculateFighterSkill(playerShip, difficulty);
    const playerEngineerSkill = this.skillSystem.calculateEngineerSkill(playerShip, difficulty);
    
    const opponentPilotSkill = this.skillSystem.calculatePilotSkill(opponentShip, difficulty);
    const opponentFighterSkill = this.skillSystem.calculateFighterSkill(opponentShip, difficulty);
    const opponentEngineerSkill = this.skillSystem.calculateEngineerSkill(opponentShip, difficulty);

    // Opponent attacks player (if opponent is in attack mode)
    if (!opponentFlees) {
      const shipTypes = getShipTypes();
      const shipSize = shipTypes[playerShip.type]?.size ?? 0;
      result.playerHit = this.calculateHitProbability(
        opponentFighterSkill, 
        playerPilotSkill, 
        shipSize, 
        playerFlees
      ) > 0;

      if (result.playerHit) {
        const weaponPower = opponentShip.weapons.reduce((sum, w) => sum + w.power, 0);
        let damage = this.calculateBaseDamage(weaponPower, opponentEngineerSkill);
        
        // Apply reactor damage boost if applicable
        damage = this.applyReactorDamage(damage, difficulty, true);
        
        // Limit damage based on difficulty
        const maxDamage = this.calculateMaxHullDamage(playerShip.maxHull, difficulty, true);
        damage = Math.min(damage, maxDamage);
        
        const damageResult = this.applyDamage(playerShip, damage, playerEngineerSkill);
        result.playerDamage = damageResult.totalDamage;
        result.playerShieldDamage = damageResult.shieldDamage;
        result.playerHullDamage = damageResult.hullDamage;
      }
    }

    // Player attacks opponent (if player is not fleeing)
    if (!playerFlees) {
      const shipTypes = getShipTypes();
      const shipSize = shipTypes[opponentShip.type]?.size ?? 0;
      result.opponentHit = this.calculateHitProbability(
        playerFighterSkill,
        opponentPilotSkill,
        shipSize,
        opponentFlees
      ) > 0;

      if (result.opponentHit) {
        const weaponPower = playerShip.weapons.reduce((sum, w) => sum + w.power, 0);
        let damage: number;
        
        // Special case for Scarab
        if (opponentShip.type === ShipType.SCARAB) {
          damage = this.calculateScarabDamage(playerShip.weapons, playerEngineerSkill);
        } else {
          damage = this.calculateBaseDamage(weaponPower, playerEngineerSkill);
        }
        
        // Limit damage for opponents
        const maxDamage = this.calculateMaxHullDamage(opponentShip.maxHull, difficulty, false);
        damage = Math.min(damage, maxDamage);
        
        const damageResult = this.applyDamage(opponentShip, damage, opponentEngineerSkill);
        result.opponentDamage = damageResult.totalDamage;
        result.opponentShieldDamage = damageResult.shieldDamage;
        result.opponentHullDamage = damageResult.hullDamage;
      }
    }

    // Check for destruction
    result.playerDestroyed = playerShip.hull <= 0;
    result.opponentDestroyed = opponentShip.hull <= 0;

    return result;
  }

  /**
   * Calculate escape probability
   * Formula: (Random(7) + PilotSkill/3) × 2 vs Random(OpponentPilotSkill) × (2 + Difficulty)
   */
  calculateEscapeProbability(playerPilotSkill: number, opponentPilotSkill: number, difficulty: Difficulty): boolean {
    const playerRoll = (Math.floor(Math.random() * 7) + Math.floor(playerPilotSkill / 3)) * 2;
    const opponentRoll = Math.floor(Math.random() * opponentPilotSkill) * (2 + difficulty);
    
    return playerRoll >= opponentRoll;
  }

  /**
   * Attempt to escape from combat
   */
  attemptEscape(playerShip: Ship, opponentShip: Ship, difficulty: Difficulty, isCommander: boolean): boolean {
    // Guaranteed escape on beginner difficulty for commander
    if (difficulty === Difficulty.BEGINNER && isCommander) {
      return true;
    }
    
    const playerPilotSkill = this.skillSystem.calculatePilotSkill(playerShip, difficulty);
    const opponentPilotSkill = this.skillSystem.calculatePilotSkill(opponentShip, difficulty);
    
    return this.calculateEscapeProbability(playerPilotSkill, opponentPilotSkill, difficulty);
  }

  /**
   * Calculate bounty for destroying a ship
   * Formula: floor(ShipPrice / 200 / 25) × 25, min 25, max 2500
   */
  calculateBounty(shipPrice: number): number {
    let bounty = Math.floor(shipPrice / 200 / 25) * 25;
    return Math.max(25, Math.min(bounty, 2500));
  }

  /**
   * Determine if opponent should change strategy based on damage taken
   */
  shouldOpponentChangeStrategy(
    encounterType: string,
    originalHull: number,
    currentHull: number,
    playerOriginalHull: number,
    playerCurrentHull: number
  ): boolean {
    const hullPercentage = currentHull / originalHull;
    const playerHullPercentage = playerCurrentHull / playerOriginalHull;
    
    // Police flee when below 50% hull (or 50% chance if both damaged)
    if (encounterType.includes('POLICE')) {
      if (hullPercentage < 0.5) {
        if (playerHullPercentage < 0.5) {
          return Math.random() < 0.5; // 50% chance
        }
        return true;
      }
    }
    
    // Pirates flee when below 66% hull (or chance-based if player also damaged)  
    if (encounterType.includes('PIRATE')) {
      if (hullPercentage < 0.66) {
        if (playerHullPercentage < 0.66) {
          return Math.random() < 0.7; // 70% chance to flee
        }
        return true;
      }
    }
    
    return false;
  }

  /**
   * Determine if trader should surrender
   */
  shouldTraderSurrender(
    currentHull: number,
    originalHull: number,
    playerCurrentHull: number,
    playerOriginalHull: number
  ): boolean {
    const hullPercentage = currentHull / originalHull;
    const playerHullPercentage = playerCurrentHull / playerOriginalHull;
    
    // Surrender if below 66% hull
    if (hullPercentage < 0.66) {
      return Math.random() < 0.7; // 70% chance to surrender
    }
    
    // Flee if below 90% hull and player not too damaged
    if (hullPercentage < 0.9) {
      if (playerHullPercentage < 0.66) {
        return Math.random() < 0.3; // 30% chance if player badly hurt
      } else if (playerHullPercentage < 0.9) {
        return Math.random() < 0.7; // 70% chance if player moderately hurt  
      } else {
        return true; // Always flee if player undamaged
      }
    }
    
    return false;
  }
}
