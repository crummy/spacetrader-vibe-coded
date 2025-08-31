// Bank System Tests  
// Test-Driven Development: Write tests FIRST before implementation

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import type { GameState } from '../types.ts';
import { Difficulty } from '../types.ts';
import { createInitialState } from '../state.ts';
import { 
  calculateMaxLoan, getLoan, payBackLoan, payInterest, 
  calculateCurrentWorth, canGetLoan, canPayBack
} from './bank.ts';
import type { LoanResult, PayBackResult } from './bank.ts';

describe('Bank System', () => {

  describe('Current Worth Calculation', () => {
    test('should calculate current worth correctly', () => {
      const state = createInitialState();
      state.credits = 5000;
      state.debt = 1000;
      
      // For now, ship price and moon cost will be 0 in basic test
      const worth = calculateCurrentWorth(state);
      assert.equal(worth, 4000); // 5000 - 1000 + 0 + 0
    });

    test('should include moon value when moon is bought', () => {
      const state = createInitialState();
      state.credits = 5000;
      state.debt = 1000;
      state.moonBought = true;
      
      const worth = calculateCurrentWorth(state);
      assert.equal(worth, 504000); // 5000 - 1000 + 500000 (moon) + 0 (ship)
    });

    test('should handle negative worth correctly', () => {
      const state = createInitialState();
      state.credits = 100;
      state.debt = 5000;
      
      const worth = calculateCurrentWorth(state);
      assert.equal(worth, -4900); // 100 - 5000 + 0 + 0
    });
  });

  describe('Maximum Loan Calculation', () => {
    test('should return 500 for criminals (bad police record)', () => {
      const state = createInitialState();
      state.policeRecordScore = -50; // Criminal
      state.credits = 100000;
      
      const maxLoan = calculateMaxLoan(state);
      assert.equal(maxLoan, 500);
    });

    test('should calculate loan based on worth for clean record', () => {
      const state = createInitialState();
      state.policeRecordScore = 0; // Clean record (CLEANSCORE)
      state.credits = 10000;
      
      const maxLoan = calculateMaxLoan(state);
      // Worth = 10000, so (10000 / 10) / 500 * 500 = 1000 / 500 * 500 = 1000
      assert.equal(maxLoan, 1000);
    });

    test('should cap maximum loan at 25000', () => {
      const state = createInitialState();
      state.policeRecordScore = 10; // Clean record
      state.credits = 1000000; // Very wealthy
      
      const maxLoan = calculateMaxLoan(state);
      assert.equal(maxLoan, 25000); // Capped at maximum
    });

    test('should have minimum loan of 1000 for clean record', () => {
      const state = createInitialState();
      state.policeRecordScore = 0; // Clean record
      state.credits = 100; // Very little money
      
      const maxLoan = calculateMaxLoan(state);
      assert.equal(maxLoan, 1000); // Minimum for clean record
    });

    test('should round loan to nearest 500', () => {
      const state = createInitialState();
      state.policeRecordScore = 0; // Clean record
      state.credits = 15750; // Worth should result in non-500 multiple
      
      const maxLoan = calculateMaxLoan(state);
      // Worth = 15750, (15750 / 10) / 500 * 500 = 1575 / 500 * 500 = 1500
      assert.equal(maxLoan, 1500);
    });
  });

  describe('Loan Operations', () => {
    test('should successfully get loan when conditions are met', () => {
      const state = createInitialState();
      state.policeRecordScore = 0; // Clean record
      state.credits = 10000;
      state.debt = 0;
      
      const result = getLoan(state, 1000);
      
      assert.equal(result.success, true);
      assert.equal(result.amountBorrowed, 1000);
      assert.equal(state.credits, 11000); // 10000 + 1000
      assert.equal(state.debt, 1000);
    });

    test('should limit loan to maximum available', () => {
      const state = createInitialState();
      state.policeRecordScore = 0; // Clean record
      state.credits = 10000; // Max loan should be 1000
      state.debt = 0;
      
      const result = getLoan(state, 5000); // Request more than max
      
      assert.equal(result.success, true);
      assert.equal(result.amountBorrowed, 1000); // Limited to max
      assert.equal(state.credits, 11000);
      assert.equal(state.debt, 1000);
    });

    test('should limit loan by existing debt', () => {
      const state = createInitialState();
      state.policeRecordScore = 0; // Clean record
      state.credits = 25000; // Higher credits to allow for debt
      state.debt = 1000; // Some existing debt
      
      const result = getLoan(state, 1000);
      
      // Worth = 25000 - 1000 = 24000, maxLoan = min(25000, max(1000, 2400)) = 2400
      // Available = 2400 - 1000 = 1400, so can get 1000
      assert.equal(result.success, true);
      assert.equal(result.amountBorrowed, 1000);
      assert.equal(state.credits, 26000);
      assert.equal(state.debt, 2000);
    });

    test('should fail when already at maximum debt', () => {
      const state = createInitialState();
      state.policeRecordScore = 0; // Clean record
      state.credits = 10000; // Max loan = 1000
      state.debt = 1000; // Already at max
      
      const result = getLoan(state, 500);
      
      assert.equal(result.success, false);
      assert.equal(result.reason, 'Already at maximum debt');
    });

    test('should fail when requesting zero or negative amount', () => {
      const state = createInitialState();
      state.policeRecordScore = 0;
      state.credits = 10000;
      
      const result = getLoan(state, 0);
      
      assert.equal(result.success, false);
      assert.equal(result.reason, 'Invalid loan amount');
    });
  });

  describe('Pay Back Operations', () => {
    test('should successfully pay back loan', () => {
      const state = createInitialState();
      state.credits = 5000;
      state.debt = 3000;
      
      const result = payBackLoan(state, 1000);
      
      assert.equal(result.success, true);
      assert.equal(result.amountPaid, 1000);
      assert.equal(state.credits, 4000); // 5000 - 1000
      assert.equal(state.debt, 2000); // 3000 - 1000
    });

    test('should limit payment to available credits', () => {
      const state = createInitialState();
      state.credits = 500;
      state.debt = 3000;
      
      const result = payBackLoan(state, 1000); // More than available credits
      
      assert.equal(result.success, true);
      assert.equal(result.amountPaid, 500); // Limited by credits
      assert.equal(state.credits, 0);
      assert.equal(state.debt, 2500); // 3000 - 500
    });

    test('should limit payment to debt amount', () => {
      const state = createInitialState();
      state.credits = 5000;
      state.debt = 800;
      
      const result = payBackLoan(state, 1000); // More than debt
      
      assert.equal(result.success, true);
      assert.equal(result.amountPaid, 800); // Limited by debt
      assert.equal(state.credits, 4200); // 5000 - 800
      assert.equal(state.debt, 0);
    });

    test('should fail when no debt exists', () => {
      const state = createInitialState();
      state.credits = 5000;
      state.debt = 0;
      
      const result = payBackLoan(state, 1000);
      
      assert.equal(result.success, false);
      assert.equal(result.reason, 'No debt to pay back');
    });

    test('should fail when requesting zero or negative payment', () => {
      const state = createInitialState();
      state.credits = 5000;
      state.debt = 1000;
      
      const result = payBackLoan(state, 0);
      
      assert.equal(result.success, false);
      assert.equal(result.reason, 'Invalid payment amount');
    });

    test('should handle pay back everything', () => {
      const state = createInitialState();
      state.credits = 5000;
      state.debt = 3000;
      
      const result = payBackLoan(state, 99999); // Pay everything
      
      assert.equal(result.success, true);
      assert.equal(result.amountPaid, 3000); // All debt
      assert.equal(state.credits, 2000); // 5000 - 3000
      assert.equal(state.debt, 0);
    });
  });

  describe('Interest Payment', () => {
    test('should charge 10% interest when credits available', () => {
      const state = createInitialState();
      state.credits = 5000;
      state.debt = 2000;
      
      payInterest(state);
      
      // Interest = max(1, 2000 / 10) = 200
      assert.equal(state.credits, 4800); // 5000 - 200
      assert.equal(state.debt, 2000); // Unchanged
    });

    test('should add unpaid interest to debt when insufficient credits', () => {
      const state = createInitialState();
      state.credits = 50;
      state.debt = 2000;
      
      payInterest(state);
      
      // Interest = 200, but only 50 credits available
      // Unpaid interest = 200 - 50 = 150 added to debt
      assert.equal(state.credits, 0);
      assert.equal(state.debt, 2150); // 2000 + 150
    });

    test('should do nothing when no debt exists', () => {
      const state = createInitialState();
      state.credits = 5000;
      state.debt = 0;
      
      payInterest(state);
      
      assert.equal(state.credits, 5000); // Unchanged
      assert.equal(state.debt, 0); // Unchanged
    });

    test('should charge minimum 1 credit interest', () => {
      const state = createInitialState();
      state.credits = 100;
      state.debt = 5; // Very small debt
      
      payInterest(state);
      
      // Interest = max(1, 5 / 10) = max(1, 0) = 1
      assert.equal(state.credits, 99); // 100 - 1
      assert.equal(state.debt, 5); // Unchanged
    });
  });

  describe('Loan Availability Checks', () => {
    test('canGetLoan should return true when loan is available', () => {
      const state = createInitialState();
      state.policeRecordScore = 0;
      state.credits = 10000;
      state.debt = 0;
      
      assert.equal(canGetLoan(state), true);
    });

    test('canGetLoan should return false when at maximum debt', () => {
      const state = createInitialState();
      state.policeRecordScore = 0;
      state.credits = 10000; // Max loan = 1000
      state.debt = 1000; // At max
      
      assert.equal(canGetLoan(state), false);
    });

    test('canPayBack should return true when debt exists', () => {
      const state = createInitialState();
      state.debt = 1000;
      
      assert.equal(canPayBack(state), true);
    });

    test('canPayBack should return false when no debt', () => {
      const state = createInitialState();
      state.debt = 0;
      
      assert.equal(canPayBack(state), false);
    });
  });

  describe('Edge Cases and Integration', () => {
    test('should handle multiple loan and payback operations', () => {
      const state = createInitialState();
      state.policeRecordScore = 0;
      state.credits = 10000;
      
      // Get first loan
      const loan1 = getLoan(state, 500);
      assert.equal(loan1.success, true);
      assert.equal(state.credits, 10500);
      assert.equal(state.debt, 500);
      
      // Get second loan
      const loan2 = getLoan(state, 500);
      assert.equal(loan2.success, true);
      assert.equal(state.credits, 11000);
      assert.equal(state.debt, 1000);
      
      // Pay back partial
      const payback = payBackLoan(state, 300);
      assert.equal(payback.success, true);
      assert.equal(state.credits, 10700);
      assert.equal(state.debt, 700);
      
      // Interest payment
      payInterest(state);
      assert.equal(state.credits, 10630); // 10700 - 70 (max(1, 700/10))
      assert.equal(state.debt, 700);
    });

    test('should handle criminal with very high worth', () => {
      const state = createInitialState();
      state.policeRecordScore = -100; // Criminal
      state.credits = 1000000; // Rich criminal
      
      const maxLoan = calculateMaxLoan(state);
      assert.equal(maxLoan, 500); // Still only 500 for criminals
      
      const loan = getLoan(state, 1000);
      assert.equal(loan.amountBorrowed, 500); // Limited to criminal max
    });
  });
});