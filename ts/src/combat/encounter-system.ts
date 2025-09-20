import type { 
  Ship, 
  EncounterContext
} from '../types/ship.js';
import { 
  ShipType,
  EncounterType, 
  Difficulty,
  SHIP_DATA
} from '../types/ship.js';
import { SkillSystem } from './skill-system.js';
import { random, randomFloor, randomBool, randomChoice } from '../../math/random.ts';

export class EncounterSystem {
  private skillSystem = new SkillSystem();

  /**
   * Calculate base encounter probability based on difficulty and ship type
   * Formula: Random(44 - 2×Difficulty), doubled for Flea ships
   */
  calculateEncounterProbability(difficulty: Difficulty, shipType: ShipType): number {
    const baseProbability = 44 - (2 * difficulty);
    const multiplier = shipType === ShipType.FLEA ? 2 : 1;
    return randomFloor(baseProbability) * multiplier;
  }

  /**
   * Determine encounter type based on system strengths and conditions
   */
  determineEncounterType(
    encounterTest: number,
    systemStrengths: { pirates: number; police: number; traders: number },
    policeStrength: number,
    hasArtifact: boolean,
    isRaided: boolean
  ): EncounterType | null {
    // Pirates get first priority
    if (encounterTest < systemStrengths.pirates && !isRaided) {
      return EncounterType.PIRATE_ATTACK;
    }
    
    // Police second priority
    if (encounterTest < systemStrengths.pirates + policeStrength) {
      return EncounterType.POLICE_ATTACK;
    }
    
    // Traders third priority
    if (encounterTest < systemStrengths.pirates + policeStrength + systemStrengths.traders) {
      return EncounterType.TRADER_IGNORE;
    }
    
    // Special case: Artifact triggers Mantis encounters (15% chance)
    if (hasArtifact && randomBool(0.15)) {
      return EncounterType.MANTIS;
    }
    
    return null; // No encounter
  }

  /**
   * Determine police behavior based on various factors
   */
  determinePoliceEncounterBehavior(
    isCloaked: boolean,
    policeRecord: number,
    reputation: number,
    isInspected: boolean,
    difficulty: Difficulty
  ): EncounterType {
    if (isCloaked) {
      return EncounterType.POLICE_IGNORE;
    }

    // Criminal behavior (< -10)
    if (policeRecord < -10) {
      if (reputation < 400) { // AVERAGESCORE
        return EncounterType.POLICE_ATTACK;
      } else if (random() * 12800 > reputation / 2) { // ELITESCORE check
        return EncounterType.POLICE_ATTACK;
      } else {
        return EncounterType.POLICE_FLEE;
      }
    }
    
    // Dubious record (-10 to 9)
    if (policeRecord >= -10 && policeRecord < 10 && !isInspected) {
      return EncounterType.POLICEINSPECTION;
    }
    
    // Clean record (10-29) - random inspection chance
    if (policeRecord >= 10 && policeRecord < 30) {
      if (randomBool(1 / (12 - difficulty)) && !isInspected) {
        return EncounterType.POLICEINSPECTION;
      }
    }
    
    // Lawful record (30+) - very low inspection chance (2.5%)
    if (policeRecord >= 30 && randomBool(0.025) && !isInspected) {
      return EncounterType.POLICEINSPECTION;
    }
    
    return EncounterType.POLICE_IGNORE;
  }

  /**
   * Determine pirate behavior
   */
  determinePirateEncounterBehavior(
    isCloaked: boolean,
    reputation: number,
    pirateShipType: ShipType,
    playerShipType: ShipType,
    isMantis: boolean
  ): EncounterType {
    if (isCloaked) {
      return EncounterType.PIRATE_IGNORE;
    }

    // Mantis always attacks
    if (isMantis) {
      return EncounterType.PIRATE_ATTACK;
    }

    // Large ships (≥7) or low reputation = attack
    const shipTypeValue = Object.values(ShipType).indexOf(pirateShipType);
    if (shipTypeValue >= 7 || random() * 12800 > (reputation * 4) / (1 + shipTypeValue)) {
      return EncounterType.PIRATE_ATTACK;
    }

    // Pirates with better ships won't flee
    const pirateShipValue = Object.values(ShipType).indexOf(pirateShipType);
    const playerShipValue = Object.values(ShipType).indexOf(playerShipType);
    if (pirateShipValue > playerShipValue) {
      return EncounterType.PIRATE_ATTACK;
    }

    return EncounterType.PIRATE_FLEE;
  }

  /**
   * Determine trader behavior  
   */
  determineTraderEncounterBehavior(
    isCloaked: boolean,
    policeRecord: number,
    reputation: number,
    traderShipType: ShipType,
    playerShipType: ShipType
  ): EncounterType {
    if (isCloaked) {
      return EncounterType.TRADER_IGNORE;
    }

    // Criminals make traders flee if player has reputation
    if (policeRecord <= -30) { // CRIMINALSCORE
      const shipTypeValue = Object.values(ShipType).indexOf(traderShipType);
      if (random() * 12800 <= (reputation * 10) / (1 + shipTypeValue)) {
        return EncounterType.TRADER_FLEE;
      }
    }

    return EncounterType.TRADER_IGNORE;
  }

  /**
   * Check for trade opportunity in orbit
   */
  hasTradeOpportunity(chanceOfTradeInOrbit: number): boolean {
    return random() * 1000 < chanceOfTradeInOrbit;
  }

  /**
   * Calculate Wild police encounter chance at Kravat
   */
  calculateWildPoliceChance(difficulty: Difficulty): number {
    if (difficulty <= Difficulty.EASY) return 25;
    if (difficulty === Difficulty.NORMAL) return 33;
    return 50; // Hard/Impossible
  }

  /**
   * Check for special encounters (monsters, quest ships)
   */
  checkSpecialEncounter(
    systemName: string,
    clicksRemaining: number,
    gameState: any
  ): { type: EncounterType; opponent?: any } | null {
    // Space Monster at Acamar
    if (systemName === 'ACAMAR' && clicksRemaining === 1 && gameState.monsterStatus === 1) {
      return {
        type: EncounterType.SPACE_MONSTER,
        opponent: {
          type: ShipType.SPACEMONSTER,
          hull: gameState.monsterHull || 500
        }
      };
    }

    // Scarab encounter
    if (clicksRemaining === 20 && gameState.scarabStatus === 1 && gameState.arrivedViaWormhole) {
      return {
        type: EncounterType.SCARAB,
        opponent: {
          type: ShipType.SCARAB,
          hull: 1000
        }
      };
    }

    // Dragonfly at Zalkon  
    if (systemName === 'ZALKON' && clicksRemaining === 1 && gameState.dragonflyStatus === 4) {
      return {
        type: EncounterType.DRAGONFLY,
        opponent: {
          type: ShipType.DRAGONFLY,
          hull: 800
        }
      };
    }

    return null;
  }

  /**
   * Check for very rare encounters
   */
  checkVeryRareEncounter(
    days: number,
    chanceOfVeryRareEncounter: number,
    gameState: any
  ): { type: EncounterType; data?: any } | null {
    if (days <= 10) return null;
    
    if (random() * 1000 >= chanceOfVeryRareEncounter) return null;

    const rareEncounterType = randomFloor(6); // 6 types of rare encounters

    switch (rareEncounterType) {
      case 0: // Marie Celeste
        if (!gameState.alreadyMet.marie) {
          return { type: EncounterType.MARIE_CELESTE };
        }
        break;
        
      case 1: // Captain Ahab
        if (gameState.hasReflectiveShield && gameState.commanderPilot < 10 && 
            gameState.policeRecord > -30 && !gameState.alreadyMet.ahab) {
          return { type: EncounterType.FAMOUS_CAPTAIN, data: { captain: 'AHAB' } };
        }
        break;
        
      case 2: // Captain Conrad
        if (gameState.hasMilitaryLaser && gameState.commanderEngineer < 10 &&
            gameState.policeRecord > -30 && !gameState.alreadyMet.conrad) {
          return { type: EncounterType.FAMOUS_CAPTAIN, data: { captain: 'CONRAD' } };
        }
        break;
        
      case 3: // Captain Huie
        if (gameState.hasMilitaryLaser && gameState.commanderTrader < 10 &&
            gameState.policeRecord > -30 && !gameState.alreadyMet.huie) {
          return { type: EncounterType.FAMOUS_CAPTAIN, data: { captain: 'HUIE' } };
        }
        break;
        
      case 4: // Good Skill Tonic
        if (!gameState.alreadyMet.bottleGood) {
          return { type: EncounterType.BOTTLE_GOOD };
        }
        break;
        
      case 5: // Old Skill Tonic
        if (!gameState.alreadyMet.bottleOld) {
          return { type: EncounterType.BOTTLE_OLD };
        }
        break;
    }

    return null;
  }

  /**
   * Determine if encounter should be skipped based on cloaking and preferences
   */
  shouldSkipEncounter(
    encounterType: EncounterType,
    playerCloaked: boolean,
    opponentCloaked: boolean,
    preferences: {
      alwaysIgnorePolice?: boolean;
      alwaysIgnorePirates?: boolean; 
      alwaysIgnoreTraders?: boolean;
      alwaysIgnoreTradeInOrbit?: boolean;
    }
  ): boolean {
    // Skip if both ships cloaked and it's an ignore/flee encounter
    if (playerCloaked && opponentCloaked && 
        (encounterType.includes('IGNORE') || encounterType.includes('FLEE'))) {
      return true;
    }

    // Skip based on player preferences (but not for attacks)
    if (encounterType.includes('POLICE') && 
        (encounterType.includes('IGNORE') || encounterType.includes('FLEE')) &&
        preferences.alwaysIgnorePolice) {
      return true;
    }

    if (encounterType.includes('PIRATE') && 
        (encounterType.includes('IGNORE') || encounterType.includes('FLEE')) &&
        preferences.alwaysIgnorePirates) {
      return true;
    }

    if (encounterType.includes('TRADER') && 
        (encounterType.includes('IGNORE') || encounterType.includes('FLEE')) &&
        preferences.alwaysIgnoreTraders) {
      return true;
    }

    if ((encounterType === EncounterType.TRADER_BUY || encounterType === EncounterType.TRADER_SELL) &&
        preferences.alwaysIgnoreTradeInOrbit) {
      return true;
    }

    return false;
  }
}
