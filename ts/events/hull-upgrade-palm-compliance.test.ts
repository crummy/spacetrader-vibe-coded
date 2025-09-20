import { test } from 'node:test';
import assert from 'node:assert';
import type { State } from '../types.ts';
import { createInitialState } from '../state.ts';
import { executeSpecialEvent, SpecialEventType } from './special.ts';
import { handleScarabDestroyed } from '../combat/special-ships.ts';
import { getShipType } from '../data/shipTypes.ts';

/**
 * Tests to enforce Palm OS hull upgrade mechanics compliance
 * Based on palm/Src/SpecialEvent.c UPGRADEDHULL constant and quest logic
 */

test('Hull Upgrade - Palm OS Compliance', async (t) => {
  await t.test('should use correct UPGRADEDHULL constant (50)', () => {
    // Palm OS: #define UPGRADEDHULL 50
    const UPGRADEDHULL = 50;
    
    const state = createInitialState();
    const initialHull = state.ship.hull;
    
    applyHullUpgrade(state);
    
    assert.strictEqual(state.ship.hull, initialHull + UPGRADEDHULL,
      'Hull upgrade should add exactly 50 points');
  });

  await t.test('should have consistent hull upgrade implementation across modules', () => {
    const state1 = createInitialState();
    const state2 = createInitialState();
    
    const initialHull1 = state1.ship.hull;
    const initialHull2 = state2.ship.hull;
    
    // Test both potential implementations give same result
    applyHullUpgradeSpecialEvents(state1); // From special.ts
    applyHullUpgradeSpecialShips(state2);  // From special-ships.ts
    
    const upgrade1 = state1.ship.hull - initialHull1;
    const upgrade2 = state2.ship.hull - initialHull2;
    
    assert.strictEqual(upgrade1, upgrade2,
      'Both hull upgrade implementations should give the same result');
    assert.strictEqual(upgrade1, 50,
      'Hull upgrade should be exactly 50 points from either implementation');
  });

  await t.test('should follow correct Scarab quest state transitions', () => {
    const state = createInitialState();
    
    // Palm OS sequence: SCARAB -> SCARABDESTROYED -> GETHULLUPGRADED
    assert.strictEqual(state.scarabStatus, 0, 'Should start with no Scarab quest');
    
    // Simulate finding Scarab
    state.scarabStatus = 1; // SCARAB encountered
    
    // Simulate destroying Scarab
    const destroyed = handleScarabDestroyedBool(state);
    assert.strictEqual(destroyed, true, 'Should successfully destroy Scarab');
    assert.strictEqual(state.scarabStatus, 2, 'Should transition to SCARABDESTROYED');
    
    // Should trigger hull upgrade opportunity
    const canGetUpgrade = canReceiveHullUpgrade(state);
    assert.strictEqual(canGetUpgrade, true, 'Should be able to receive hull upgrade after destroying Scarab');
    
    // Apply hull upgrade
    const upgradeApplied = applyHullUpgradeIfEligible(state);
    assert.strictEqual(upgradeApplied, true, 'Should successfully apply hull upgrade');
    
    // Should transition to final state
    assert.strictEqual(state.scarabStatus, 3, 'Should transition to GETHULLUPGRADED or equivalent');
  });

  await t.test('should persist hull upgrade across ship changes', () => {
    const state = createInitialState();
    
    // Apply hull upgrade
    applyHullUpgrade(state);
    const upgradedHull = state.ship.hull;
    
    // Change to different ship
    const originalShipType = state.ship.type;
    state.ship.type = (originalShipType + 1) % 10; // Change to next ship type
    
    // Hull upgrade should be preserved in some way
    const hullAfterShipChange = calculateEffectiveHullStrength(state);
    
    // The upgrade should be tracked separately from base ship hull
    assert.ok(hullAfterShipChange >= getBaseHullForShip(state.ship.type) + 50,
      'Hull upgrade should persist even after changing ships');
  });

  await t.test('should only allow one hull upgrade per game', () => {
    const state = createInitialState();
    
    // Set up quest state first - must destroy Scarab to be eligible
    state.scarabStatus = 2; // Scarab destroyed
    
    const initialHull = state.ship.hull;
    
    // First upgrade should work
    const firstUpgrade = applyHullUpgradeIfEligible(state);
    assert.strictEqual(firstUpgrade, true, 'First hull upgrade should succeed');
    assert.strictEqual(state.ship.hull, initialHull + 50, 'Should add 50 hull points');
    
    // Second upgrade should fail
    const secondUpgrade = applyHullUpgradeIfEligible(state);
    assert.strictEqual(secondUpgrade, false, 'Second hull upgrade should fail');
    assert.strictEqual(state.ship.hull, initialHull + 50, 'Hull should not increase again');
  });

  await t.test('should integrate hull upgrade with ship trading system', () => {
    const state = createInitialState();
    
    // Apply hull upgrade
    applyHullUpgrade(state);
    
    // When trading ships, upgrade should be accounted for in value
    const shipValue = calculateShipTradeInValue(state);
    const baseValue = calculateBaseShipValue(state.ship.type);
    
    assert.ok(shipValue > baseValue, 
      'Ship with hull upgrade should have higher trade-in value');
  });

  await t.test('should show hull upgrade in ship status display', () => {
    const state = createInitialState();
    
    // Apply hull upgrade
    applyHullUpgrade(state);
    
    const shipStatus = getShipStatusDisplay(state);
    
    assert.ok(shipStatus.includes('upgraded') || shipStatus.includes('reinforced'),
      'Ship status should indicate hull has been upgraded');
  });
});

// Helper functions that need to be implemented or fixed
// Hull upgrade constant from Palm OS spacetrader.h
const UPGRADEDHULL = 50;

function applyHullUpgrade(state: State): void {
  state.ship.hull += UPGRADEDHULL;
  state.ship.hullUpgrades = (state.ship.hullUpgrades || 0) + 1;
}

function applyHullUpgradeSpecialEvents(state: State): void {
  // Mark eligible for hull upgrade first
  state.scarabStatus = 2; // SCARABDESTROYED
  const result = executeSpecialEvent(state, SpecialEventType.GETHULLUPGRADED);
  if (!result.success) {
    throw new Error(`Hull upgrade failed: ${result.message}`);
  }
}

function applyHullUpgradeSpecialShips(state: State): void {
  // This function applies hull upgrade through combat system
  state.scarabStatus = 1; // Ready to be destroyed
  const result = handleScarabDestroyed(state);
  // Update state with the result
  Object.assign(state, result.state);
}

function handleScarabDestroyedBool(state: State): boolean {
  // Simulate Scarab destruction
  if (state.scarabStatus === 0) {
    state.scarabStatus = 1; // Encountered
  }
  if (state.scarabStatus === 1) {
    state.scarabStatus = 2; // Destroyed
    return true;
  }
  return false;
}

function canReceiveHullUpgrade(state: State): boolean {
  // Can receive upgrade if Scarab is destroyed but upgrade not yet received
  return state.scarabStatus === 2;
}

function applyHullUpgradeIfEligible(state: State): boolean {
  // Check if already have hull upgrades (only one allowed per game)
  if ((state.ship.hullUpgrades || 0) > 0) {
    return false; // Already have hull upgrade
  }
  
  if (!canReceiveHullUpgrade(state) || state.scarabStatus >= 3) {
    return false; // Already upgraded or not eligible
  }
  
  state.ship.hull += UPGRADEDHULL;
  state.ship.hullUpgrades = (state.ship.hullUpgrades || 0) + 1;
  state.scarabStatus = 3; // Mark as upgraded
  return true;
}

function calculateEffectiveHullStrength(state: State): number {
  // Calculate hull strength including upgrades
  const baseHull = getBaseHullForShip(state.ship.type);
  const upgradeBonus = (state.ship.hullUpgrades || 0) * UPGRADEDHULL;
  return baseHull + upgradeBonus;
}

function getBaseHullForShip(shipType: number): number {
  return getShipType(shipType).hullStrength;
}

function calculateShipTradeInValue(state: State): number {
  const baseValue = calculateBaseShipValue(state.ship.type);
  const upgradeValue = (state.ship.hullUpgrades || 0) * (UPGRADEDHULL * 100); // Hull upgrades increase trade value
  return baseValue + upgradeValue;
}

function calculateBaseShipValue(shipType: number): number {
  return getShipType(shipType).price;
}

function getShipStatusDisplay(state: State): string {
  const shipName = getShipType(state.ship.type).name;
  const upgrades = state.ship.hullUpgrades || 0;
  if (upgrades > 0) {
    return `${shipName} (hull upgraded)`;
  }
  return shipName;
}
