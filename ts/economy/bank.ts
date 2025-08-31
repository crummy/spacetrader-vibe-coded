// Bank System Implementation
// Ported from Palm OS Space Trader Bank.c and Money.c

import type { GameState } from '../types.ts';

// Constants from Palm OS source
const CLEANSCORE = 0; // Clean police record score
const DEBTTOOLARGE = 100000; // Maximum debt before restrictions
const COSTMOON = 500000; // Moon cost for worth calculation

// Result interfaces for bank operations
export interface LoanResult {
  success: boolean;
  amountBorrowed?: number;
  reason?: string;
}

export interface PayBackResult {
  success: boolean;
  amountPaid?: number;
  reason?: string;
}

// Calculate maximum loan available based on police record and worth
// From Palm OS Bank.c MaxLoan() function
export function calculateMaxLoan(state: GameState): number {
  if (state.policeRecordScore >= CLEANSCORE) {
    // Clean record: loan based on worth, capped at 25000, minimum 1000, rounded to 500
    const worth = calculateCurrentWorth(state);
    const loanAmount = Math.floor((worth / 10) / 500) * 500;
    return Math.min(25000, Math.max(1000, loanAmount));
  } else {
    // Criminal: only 500 credits
    return 500;
  }
}

// Get a loan with validation and smart limiting
// From Palm OS Bank.c GetLoan() function
export function getLoan(state: GameState, requestedAmount: number): LoanResult {
  // Validate input
  if (requestedAmount <= 0) {
    return { success: false, reason: 'Invalid loan amount' };
  }

  const maxLoan = calculateMaxLoan(state);
  const availableLoan = maxLoan - state.debt;

  // Check if already at maximum debt
  if (availableLoan <= 0) {
    return { success: false, reason: 'Already at maximum debt' };
  }

  // Limit loan to available amount (smart limiting)
  const actualAmount = Math.min(requestedAmount, availableLoan);

  // Execute the loan
  state.credits += actualAmount;
  state.debt += actualAmount;

  return { success: true, amountBorrowed: actualAmount };
}

// Pay back loan with validation and smart limiting
// From Palm OS Bank.c PayBack() function  
export function payBackLoan(state: GameState, requestedAmount: number): PayBackResult {
  // Validate input
  if (requestedAmount <= 0) {
    return { success: false, reason: 'Invalid payment amount' };
  }

  // Check if there's debt to pay
  if (state.debt <= 0) {
    return { success: false, reason: 'No debt to pay back' };
  }

  // Limit payment by available credits and debt amount (smart limiting)
  let actualAmount = Math.min(requestedAmount, state.credits);
  actualAmount = Math.min(actualAmount, state.debt);

  // Execute the payment
  state.credits -= actualAmount;
  state.debt -= actualAmount;

  return { success: true, amountPaid: actualAmount };
}

// Pay interest on debt (10% with minimum 1 credit)
// From Palm OS Money.c PayInterest() function
export function payInterest(state: GameState): void {
  if (state.debt <= 0) {
    return; // No debt, no interest
  }

  // Calculate interest: 10% of debt, minimum 1 credit
  const interestAmount = Math.max(1, Math.floor(state.debt / 10));

  if (state.credits >= interestAmount) {
    // Pay interest from credits
    state.credits -= interestAmount;
  } else {
    // Insufficient credits: pay what we can, add remainder to debt
    const unpaidInterest = interestAmount - state.credits;
    state.credits = 0;
    state.debt += unpaidInterest;
  }
}

// Calculate current worth including ship, moon, credits minus debt
// From Palm OS Money.c CurrentWorth() function
export function calculateCurrentWorth(state: GameState): number {
  // For now, ship price and moon cost will be basic values
  // TODO: Implement proper ship pricing when ship system is ready
  let shipPrice = 0; // Basic ship value - will be enhanced later
  
  const moonValue = state.moonBought ? COSTMOON : 0;
  
  return state.credits - state.debt + shipPrice + moonValue;
}

// Check if player can get a loan
export function canGetLoan(state: GameState): boolean {
  const maxLoan = calculateMaxLoan(state);
  return state.debt < maxLoan;
}

// Check if player can pay back debt
export function canPayBack(state: GameState): boolean {
  return state.debt > 0;
}