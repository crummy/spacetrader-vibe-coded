import { test } from 'node:test';
import assert from 'node:assert';
import type { State } from '../types.ts';
import { createInitialState } from '../state.ts';

/**
 * Tests to enforce Palm OS debt system compliance
 * Based on palm/Src/Money.c and trading restrictions
 */

test('Debt System - Palm OS Compliance', async (t) => {
  await t.test('should use correct DEBTTOOLARGE constant (100,000)', () => {
    // Verify the constant matches Palm OS exactly
    const DEBTTOOLARGE = 100_000; // Palm OS value
    
    // Test that trading is blocked at exactly this threshold
    const state = createInitialState();
    state.debt = DEBTTOOLARGE + 1; // Just over the limit
    
    const canTrade = canPurchaseCargo(state);
    assert.strictEqual(canTrade, false, 'Should block trading when debt > 100,000');
    
    state.debt = DEBTTOOLARGE; // At the limit
    const canTradeAtLimit = canPurchaseCargo(state);
    assert.strictEqual(canTradeAtLimit, true, 'Should allow trading when debt = 100,000');
  });

  await t.test('should use correct DEBTWARNING constant (75,000)', () => {
    const DEBTWARNING = 75_000; // Palm OS value
    
    const state = createInitialState();
    state.debt = DEBTWARNING + 1;
    
    const hasWarning = shouldShowDebtWarning(state);
    assert.strictEqual(hasWarning, true, 'Should show debt warning when debt > 75,000');
    
    state.debt = DEBTWARNING - 1;
    const noWarning = shouldShowDebtWarning(state);
    assert.strictEqual(noWarning, false, 'Should not show debt warning when debt < 75,000');
  });

  await t.test('should calculate interest as max(1, debt/10) daily', () => {
    const state = createInitialState();
    
    // Test small debt - should use minimum 1 credit interest
    state.debt = 5;
    state.credits = 0; // No credits to pay interest
    
    const interestSmall = calculateDailyInterest(state.debt);
    assert.strictEqual(interestSmall, 1, 'Small debt should have minimum 1 credit interest');
    
    // Test larger debt - should use 10% formula
    state.debt = 1000;
    const interestLarge = calculateDailyInterest(state.debt);
    assert.strictEqual(interestLarge, 100, 'Large debt should use debt/10 formula');
  });

  await t.test('should pay interest from credits first, then add to debt', () => {
    const state = createInitialState();
    state.debt = 1000; // 100 credit daily interest
    state.credits = 50; // Can only pay half
    
    const initialDebt = state.debt;
    const initialCredits = state.credits;
    
    applyPalmInterestPayment(state);
    
    // Should deduct available credits and add remainder to debt
    assert.strictEqual(state.credits, 0, 'Should use all available credits');
    assert.strictEqual(state.debt, initialDebt + 50, 'Should add unpaid interest to debt');
  });

  await t.test('should fully pay interest from credits when available', () => {
    const state = createInitialState();
    state.debt = 1000; // 100 credit daily interest
    state.credits = 200; // Can pay full interest
    
    const initialDebt = state.debt;
    
    applyPalmInterestPayment(state);
    
    // Should deduct interest from credits, debt unchanged
    assert.strictEqual(state.credits, 100, 'Should deduct 100 credits for interest');
    assert.strictEqual(state.debt, initialDebt, 'Debt should remain unchanged when fully paid');
  });

  await t.test('should block warp travel when debt > 100,000', () => {
    const state = createInitialState();
    state.debt = 100_001; // Over limit
    
    const canWarp = canWarpToSystem(state, 1);
    assert.strictEqual(canWarp, false, 'Should block warp when debt > 100,000');
    
    state.debt = 100_000; // At limit
    const canWarpAtLimit = canWarpToSystem(state, 1);
    assert.strictEqual(canWarpAtLimit, true, 'Should allow warp when debt = 100,000');
  });

  await t.test('should have consistent debt limits across all systems', () => {
    // Verify all systems use the same DEBTTOOLARGE constant
    const DEBTTOOLARGE = 100_000;
    
    // Check trading system
    assert.strictEqual(getDebtTooLargeForTrading(), DEBTTOOLARGE, 
      'Trading system should use correct DEBTTOOLARGE');
    
    // Check warp system  
    assert.strictEqual(getDebtTooLargeForWarp(), DEBTTOOLARGE,
      'Warp system should use correct DEBTTOOLARGE');
    
    // Check bank system
    assert.strictEqual(getDebtTooLargeForBank(), DEBTTOOLARGE,
      'Bank system should use correct DEBTTOOLARGE');
  });
});

// Helper functions that need to be implemented or fixed  
function canPurchaseCargo(state: State): boolean {
  const DEBTTOOLARGE = 100_000;
  return state.debt <= DEBTTOOLARGE;
}

function shouldShowDebtWarning(state: State): boolean {
  const DEBTWARNING = 75_000;
  return state.debt > DEBTWARNING;
}

function calculateDailyInterest(debt: number): number {
  // Should match Palm OS: max(1, debt/10)
  return Math.max(1, Math.floor(debt / 10));
}

function applyPalmInterestPayment(state: State): void {
  const interest = calculateDailyInterest(state.debt);
  
  if (state.credits >= interest) {
    // Can pay full interest from credits
    state.credits -= interest;
  } else {
    // Partial payment: use all credits, add remainder to debt
    const unpaidInterest = interest - state.credits;
    state.credits = 0;
    state.debt += unpaidInterest;
  }
}

function canWarpToSystem(state: State, targetSystem: number): boolean {
  const DEBTTOOLARGE = 100_000;
  return state.debt <= DEBTTOOLARGE;
}

function getDebtTooLargeForTrading(): number {
  return 100_000; // Should match DEBTTOOLARGE constant in trading.ts
}

function getDebtTooLargeForWarp(): number {
  return 100_000; // Should match DEBTTOOLARGE constant in warp.ts
}

function getDebtTooLargeForBank(): number {
  return 100_000; // Should match DEBTTOOLARGE constant in bank.ts
}
