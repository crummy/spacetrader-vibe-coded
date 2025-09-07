import type { 
  Ship, 
  EscapePodResult, 
  ArrestResult, 
  TravelCosts
} from '../types/ship.js';
import { getShipTypes } from '../../data/shipTypes.ts';
import { 
  ShipType, 
  Difficulty, 
  WeaponType,
  SHIP_DATA 
} from '../types/ship.js';
import { SkillSystem } from './skill-system.js';

export class TravelSystem {
  private skillSystem = new SkillSystem();

  /**
   * Calculate hull repair during travel based on engineer skill
   */
  calculateHullRepair(engineerSkill: number): number {
    return Math.floor(Math.random() * engineerSkill) >> 1;
  }

  /**
   * Apply hull repair, returning excess repair for shields
   */
  applyHullRepair(ship: Ship, repairAmount: number): number {
    const oldHull = ship.hull;
    ship.hull = Math.min(ship.maxHull, ship.hull + repairAmount);
    const actualRepair = ship.hull - oldHull;
    return repairAmount - actualRepair; // Excess repair
  }

  /**
   * Apply shield repair (easier than hull - 2x rate)
   */
  applyShieldRepair(ship: Ship, repairAmount: number): void {
    let remainingRepair = repairAmount * 2;

    for (const shield of ship.shields) {
      if (remainingRepair <= 0) break;

      const maxRepair = shield.maxStrength - shield.strength;
      const actualRepair = Math.min(remainingRepair, maxRepair);
      
      shield.strength += actualRepair;
      remainingRepair -= actualRepair;
    }
  }

  /**
   * Grow tribbles during travel
   */
  growTribbles(currentTribbles: number, clicks: number): number {
    let tribbles = currentTribbles;
    
    for (let i = 0; i < clicks; i++) {
      // Tribbles roughly double every few days
      if (tribbles > 0 && Math.random() < 0.1) { // 10% chance per click
        tribbles = Math.floor(tribbles * 1.1);
      }
    }
    
    return tribbles;
  }

  /**
   * Calculate tribble food consumption
   */
  calculateTribbleFoodConsumption(tribbles: number): number {
    return Math.floor(tribbles / 100); // Rough estimate
  }

  /**
   * Apply tribble food consumption
   */
  applyTribbleFoodConsumption(ship: Ship, foodConsumed: number): void {
    const foodIndex = 1; // Assuming food is index 1
    ship.cargo[foodIndex] = Math.max(0, ship.cargo[foodIndex] - foodConsumed);
  }

  /**
   * Handle tribble starvation when no food available
   */
  handleTribbleStarvation(ship: Ship): void {
    const foodIndex = 1;
    if (ship.cargo[foodIndex] <= 0 && ship.tribbles > 0) {
      // Kill some tribbles due to starvation
      ship.tribbles = Math.floor(ship.tribbles * 0.8);
    }
  }

  /**
   * Check for special location encounters
   */
  checkSpecialLocationEncounter(
    systemName: string,
    clicksRemaining: number,
    gameState: any
  ): { type: string; opponent?: any } | null {
    // Space Monster at Acamar
    if (systemName === 'ACAMAR' && clicksRemaining === 1 && gameState.monsterStatus === 1) {
      return {
        type: 'SPACE_MONSTER',
        opponent: {
          type: ShipType.SPACEMONSTER,
          hull: gameState.monsterHull || 400
        }
      };
    }

    // Scarab encounter
    if (systemName === 'TARGETWORLD' && clicksRemaining === 20 && 
        gameState.scarabStatus === 1 && gameState.arrivedViaWormhole &&
        gameState.specialEvent === 'SCARAB_DESTROYED') {
      return {
        type: 'SCARAB',
        opponent: {
          type: ShipType.SCARAB,
          hull: 1000
        }
      };
    }

    // Dragonfly at Zalkon
    if (systemName === 'ZALKON' && clicksRemaining === 1 && gameState.dragonflyStatus === 4) {
      return {
        type: 'DRAGONFLY',
        opponent: {
          type: ShipType.DRAGONFLY,
          hull: 800
        }
      };
    }

    return null;
  }

  /**
   * Handle fabric rip encounter during travel
   */
  handleFabricRip(
    originalSystem: string,
    fabricRipState: {
      canGoThroughRip: boolean;
      experimentStatus: number;
      fabricRipProbability: number;
    }
  ): string {
    if (!fabricRipState.canGoThroughRip || fabricRipState.experimentStatus !== 12) {
      return originalSystem;
    }

    // 25% means guaranteed, otherwise use probability
    if (fabricRipState.fabricRipProbability === 25 || 
        Math.random() * 100 < fabricRipState.fabricRipProbability) {
      // Transport to random system
      const systems = ['ACAMAR', 'ADAHN', 'ALDEA', 'ANDEVIAN', 'ANTEDI']; // Sample systems
      return systems[Math.floor(Math.random() * systems.length)];
    }

    return originalSystem;
  }

  /**
   * Calculate Wild police encounter chance at Kravat
   */
  calculateWildPoliceEncounterChance(
    systemName: string,
    hasWild: boolean,
    difficulty: Difficulty
  ): number {
    if (systemName !== 'KRAVAT' || !hasWild) {
      return 0;
    }

    switch (difficulty) {
      case Difficulty.BEGINNER:
      case Difficulty.EASY:
        return 25;
      case Difficulty.NORMAL:
        return 33;
      case Difficulty.HARD:
      case Difficulty.IMPOSSIBLE:
        return 50;
      default:
        return 0;
    }
  }

  /**
   * Handle escape pod activation
   */
  handleEscapePod(
    ship: Ship,
    gameState: {
      hasEscapePod: boolean;
      insurance: boolean;
      currentWorth: number;
      credits: number;
      debt: number;
      reactorStatus?: number;
      japoriDiseaseStatus?: number;
      artifactOnBoard?: boolean;
      jarekStatus?: number;
      wildStatus?: number;
      tribbles?: number;
    }
  ): EscapePodResult {
    if (!gameState.hasEscapePod) {
      return {
        survived: false,
        effectsApplied: [],
        creditsLost: gameState.credits,
        daysAdvanced: 0
      };
    }

    const effectsApplied: string[] = [];
    let creditsGained = 0;
    let creditsLost = 500; // Cost to build new Flea

    // Insurance payout
    if (gameState.insurance) {
      creditsGained += gameState.currentWorth;
      effectsApplied.push('insurance_payout');
    }

    // Reactor destroyed
    if (gameState.reactorStatus && gameState.reactorStatus > 0 && gameState.reactorStatus < 21) {
      effectsApplied.push('reactor_destroyed');
    }

    // Antidote destroyed
    if (gameState.japoriDiseaseStatus === 1) {
      effectsApplied.push('antidote_destroyed');
    }

    // Artifact lost
    if (gameState.artifactOnBoard) {
      effectsApplied.push('artifact_lost');
    }

    // Jarek taken home
    if (gameState.jarekStatus === 1) {
      effectsApplied.push('jarek_taken_home');
    }

    // Wild arrested
    if (gameState.wildStatus === 1) {
      effectsApplied.push('wild_arrested');
    }

    // Tribbles survive
    if (gameState.tribbles && gameState.tribbles > 0) {
      effectsApplied.push('tribbles_survive');
    }

    return {
      survived: true,
      effectsApplied,
      creditsLost,
      newShipType: ShipType.FLEA,
      daysAdvanced: 3
    };
  }

  /**
   * Calculate arrest penalty
   */
  calculateArrestPenalty(
    currentWorth: number,
    policeRecordScore: number,
    hasWild: boolean,
    difficulty: Difficulty
  ): { fine: number; imprisonment: number } {
    let fine = Math.floor((1 + (((currentWorth * Math.min(80, -policeRecordScore)) / 100) / 500)) * 500);
    
    if (hasWild) {
      fine = Math.floor(fine * 1.05);
    }

    const imprisonment = Math.max(30, -policeRecordScore);

    return { fine, imprisonment };
  }

  /**
   * Handle arrest consequences
   */
  handleArrest(
    ship: Ship,
    arrestState: {
      fine: number;
      imprisonment: number;
      credits: number;
      debt: number;
      hasInsurance: boolean;
      hasCargo: boolean;
      hasMercenaries: boolean;
      japoriDiseaseStatus?: number;
      jarekStatus?: number;
      wildStatus?: number;
      reactorStatus?: number;
    }
  ): ArrestResult {
    const effectsApplied: string[] = [];
    let finalCredits = arrestState.credits;

    // Pay fine
    if (finalCredits >= arrestState.fine) {
      finalCredits -= arrestState.fine;
    } else {
      // Add to debt if can't pay
      const remainingDebt = arrestState.fine - finalCredits;
      finalCredits = 0;
      effectsApplied.push('fine_added_to_debt');
    }

    // Confiscate illegal goods
    if (arrestState.hasCargo) {
      effectsApplied.push('contraband_confiscated');
    }

    // Lose insurance
    if (arrestState.hasInsurance) {
      effectsApplied.push('insurance_lost');
    }

    // Mercenaries leave
    if (arrestState.hasMercenaries) {
      effectsApplied.push('mercenaries_leave');
    }

    // Special items handled
    if (arrestState.japoriDiseaseStatus === 1) {
      effectsApplied.push('antidote_confiscated');
    }

    if (arrestState.jarekStatus === 1) {
      effectsApplied.push('jarek_taken_home');
    }

    if (arrestState.wildStatus === 1) {
      effectsApplied.push('wild_arrested');
    }

    if (arrestState.reactorStatus && arrestState.reactorStatus > 0 && arrestState.reactorStatus < 21) {
      effectsApplied.push('reactor_confiscated');
    }

    return {
      fine: arrestState.fine,
      imprisonment: arrestState.imprisonment,
      finalCredits,
      effectsApplied
    };
  }

  /**
   * Calculate fuel cost for travel
   */
  calculateFuelCost(distance: number, shipType: ShipType): number {
    return distance; // 1 fuel per unit distance
  }

  /**
   * Calculate mercenary payment
   */
  calculateMercenaryPayment(mercenaries: Array<{ pilot: number; fighter: number; trader: number; engineer: number }>): number {
    return mercenaries.length * 10; // Simple calculation
  }

  /**
   * Calculate wormhole tax
   */
  calculateWormholeTax(hasWormhole: boolean, shipType: ShipType): number {
    if (!hasWormhole) return 0;
    
    const shipTypes = getShipTypes();
    const shipData = shipTypes[shipType as number];
    return (shipData?.hullStrength || 25) * 25; // Rough approximation
  }

  /**
   * Calculate insurance cost
   */
  calculateInsuranceCost(hasInsurance: boolean, shipValue: number, noClaim: number): number {
    if (!hasInsurance) return 0;
    
    return Math.max(1, Math.floor((shipValue * 5) / 2000) * (100 - Math.min(noClaim, 90)) / 100);
  }

  /**
   * Check if ship can make the journey
   */
  canMakeJourney(ship: Ship, distance: number): { possible: boolean; requiredFuel: number; availableFuel?: number } {
    const requiredFuel = this.calculateFuelCost(distance, ship.type);
    
    if (ship.fuel >= requiredFuel) {
      return { possible: true, requiredFuel };
    } else {
      return { possible: false, requiredFuel, availableFuel: ship.fuel };
    }
  }

  /**
   * Check if Wild will stay aboard
   */
  willWildStayAboard(ship: Ship, hasWild: boolean, reactorStatus = 0): boolean {
    if (!hasWild) return true;
    
    // Wild requires beam laser or better
    if (!this.skillSystem.hasWeapon(ship, WeaponType.BEAM_LASER, false)) {
      return false;
    }
    
    // Wild is afraid of reactors
    if (reactorStatus > 0 && reactorStatus < 21) {
      return false;
    }
    
    return true;
  }
}
