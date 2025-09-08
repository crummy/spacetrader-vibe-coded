// Bank Screen - Full banking and insurance functionality
import React, { useState, useMemo } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.ts';
import { getUiFields } from '@game-ui';
import { calculateMaxLoan, canGetLoan, canPayBack } from '../../../ts/economy/bank.ts';
import type { ScreenProps } from '../types.ts';

type BankTab = 'loans' | 'insurance';

export function BankScreen({ onNavigate, onBack, state, onAction, availableActions }: ScreenProps) {
  // Fall back to useGameEngine if props aren't provided (backwards compatibility)
  const gameEngine = useGameEngine();
  const actualState = state || gameEngine.state;
  const actualExecuteAction = onAction || gameEngine.executeAction;
  const actualAvailableActions = availableActions || gameEngine.availableActions;

  const [activeTab, setActiveTab] = useState<BankTab>('loans');
  const [loanAmount, setLoanAmount] = useState<string>('1000');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  // Calculate financial info
  const maxLoan = useMemo(() => calculateMaxLoan(actualState), [actualState]);
  const availableCredit = useMemo(() => maxLoan - actualState.debt, [maxLoan, actualState.debt]);
  const netWorth = useMemo(() => actualState.credits - actualState.debt, [actualState.credits, actualState.debt]);

  const handleDock = async () => {
    try {
      setMessage('Docking at planet...');
      setMessageType('info');
      
      const result = await actualExecuteAction({
        type: 'dock_at_planet',
        parameters: {}
      });

      if (result.success) {
        setMessage('Successfully docked at planet. You can now access banking services.');
        setMessageType('success');
      } else {
        setMessage(`Failed to dock: ${result.message}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Docking error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    }
  };

  const handleGetLoan = async () => {
    const amount = parseInt(loanAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage('Please enter a valid loan amount');
      setMessageType('error');
      return;
    }

    const getLoanAction = actualAvailableActions.find(a => a.type === 'get_loan');
    if (!getLoanAction || !getLoanAction.available) {
      setMessage('Banking services not available. You may need to dock at a planet first.');
      setMessageType('error');
      return;
    }

    if (availableCredit <= 0) {
      setMessage('You are already at your maximum debt limit.');
      setMessageType('error');
      return;
    }

    try {
      const result = await actualExecuteAction({
        type: 'get_loan',
        parameters: {
          amount: amount
        }
      });

      if (result.success) {
        setMessage(result.message || `Loan approved for ${Math.min(amount, availableCredit).toLocaleString()} credits!`);
        setMessageType('success');
        setLoanAmount('1000');
      } else {
        setMessage(result.message || 'Loan request denied');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    }
  };

  const handlePayBack = async () => {
    const amount = paymentAmount === '' ? actualState.debt : parseInt(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage('Please enter a valid payment amount');
      setMessageType('error');
      return;
    }

    const payBackAction = actualAvailableActions.find(a => a.type === 'pay_back');
    if (!payBackAction || !payBackAction.available) {
      setMessage('Banking services not available. You may need to dock at a planet first.');
      setMessageType('error');
      return;
    }

    if (actualState.debt <= 0) {
      setMessage('You have no debt to pay back.');
      setMessageType('error');
      return;
    }

    if (actualState.credits <= 0) {
      setMessage('You have no credits to make a payment.');
      setMessageType('error');
      return;
    }

    try {
      const result = await actualExecuteAction({
        type: 'pay_back',
        parameters: {
          amount: amount
        }
      });

      if (result.success) {
        const actualPayment = Math.min(amount, actualState.credits, actualState.debt);
        setMessage(result.message || `Successfully paid back ${actualPayment.toLocaleString()} credits!`);
        setMessageType('success');
        setPaymentAmount('');
      } else {
        setMessage(result.message || 'Payment failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    }
  };

  const handleBuyInsurance = async () => {
    const buyInsuranceAction = actualAvailableActions.find(a => a.type === 'buy_insurance');
    if (!buyInsuranceAction || !buyInsuranceAction.available) {
      setMessage('Insurance services not available. You may need to dock at a planet first.');
      setMessageType('error');
      return;
    }

    if (actualState.insurance) {
      setMessage('You already have an active insurance policy.');
      setMessageType('error');
      return;
    }

    try {
      const result = await actualExecuteAction({
        type: 'buy_insurance',
        parameters: {}
      });

      if (result.success) {
        setMessage('Insurance policy activated! Daily premiums will be deducted during travel.');
        setMessageType('success');
      } else {
        setMessage(result.message || 'Insurance purchase failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    }
  };

  const handleStopInsurance = async () => {
    const stopInsuranceAction = actualAvailableActions.find(a => a.type === 'stop_insurance');
    if (!stopInsuranceAction || !stopInsuranceAction.available) {
      setMessage('Insurance services not available.');
      setMessageType('error');
      return;
    }

    try {
      const result = await actualExecuteAction({
        type: 'stop_insurance',
        parameters: {}
      });

      if (result.success) {
        setMessage('Insurance policy cancelled.');
        setMessageType('success');
      } else {
        setMessage(result.message || 'Insurance cancellation failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    }
  };

  const handleBuyEscapePod = async () => {
    const buyEscapePodAction = actualAvailableActions.find(a => a.type === 'buy_escape_pod');
    if (!buyEscapePodAction || !buyEscapePodAction.available) {
      setMessage('Escape pod services not available. You may need to dock at a planet first.');
      setMessageType('error');
      return;
    }

    try {
      const result = await actualExecuteAction({
        type: 'buy_escape_pod',
        parameters: {}
      });

      if (result.success) {
        setMessage('Escape pod purchased and installed!');
        setMessageType('success');
      } else {
        setMessage(result.message || 'Escape pod purchase failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    }
  };

  const bankingAvailable = actualAvailableActions.some(a => 
    (a.type === 'get_loan' || a.type === 'pay_back' || a.type === 'buy_insurance') && a.available
  );
  const dockAvailable = actualAvailableActions.some(a => a.type === 'dock_at_planet' && a.available);

  // Check if we're docked (has other planet actions)
  const isDocked = actualAvailableActions.some(a => 
    (a.type === 'buy_cargo' || a.type === 'sell_cargo' || a.type === 'buy_equipment' || a.type === 'sell_equipment') && a.available
  );

  return (
    <div className="space-panel">

      {/* Dock Button if not docked */}
      {!isDocked && dockAvailable && (
        <div className="space-panel bg-space-black mb-4">
          <div className="text-neon-amber mb-2">Not Docked:</div>
          <div className="text-sm text-palm-gray mb-3">
            You need to dock at a planet to access banking services.
          </div>
          <button onClick={handleDock} className="neon-button w-full">
            🚀 Dock at Planet
          </button>
        </div>
      )}

      {/* Financial Status */}
      <div className="space-panel bg-space-black mb-4">
        <div className="text-neon-amber mb-2">Financial Status:</div>
        <div className="text-sm text-palm-gray space-y-1">
          <div className="flex justify-between">
            <span>Credits:</span>
            <span className="text-neon-green">{actualState.credits.toLocaleString()} cr.</span>
          </div>
          <div className="flex justify-between">
            <span>Debt:</span>
            <span className={actualState.debt > 0 ? "text-red-400" : "text-palm-gray"}>{actualState.debt.toLocaleString()} cr.</span>
          </div>
          <div className="flex justify-between border-t border-palm-gray border-opacity-30 pt-1">
            <span>Net Worth:</span>
            <span className={netWorth >= 0 ? "text-neon-green" : "text-red-400"}>{netWorth.toLocaleString()} cr.</span>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="space-panel bg-space-black mb-4">
        <div className="text-neon-amber mb-3">Banking Services:</div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-4 py-2 rounded border transition-all duration-200 ${
              activeTab === 'loans'
                ? 'border-neon-cyan bg-neon-cyan bg-opacity-20 text-neon-cyan'
                : 'border-palm-gray border-opacity-30 text-palm-gray hover:border-neon-cyan'
            }`}
          >
            Loans
          </button>
          <button
            onClick={() => setActiveTab('insurance')}
            className={`px-4 py-2 rounded border transition-all duration-200 ${
              activeTab === 'insurance'
                ? 'border-neon-cyan bg-neon-cyan bg-opacity-20 text-neon-cyan'
                : 'border-palm-gray border-opacity-30 text-palm-gray hover:border-neon-cyan'
            }`}
          >
            Insurance
          </button>
        </div>
      </div>

      {/* Loans Tab */}
      {activeTab === 'loans' && (
        <>
          {/* Loan Information */}
          <div className="space-panel bg-space-black mb-4">
            <div className="text-neon-amber mb-2">Credit Information:</div>
            <div className="text-sm text-palm-gray space-y-1">
              <div className="flex justify-between">
                <span>Credit Limit:</span>
                <span>{maxLoan.toLocaleString()} cr.</span>
              </div>
              <div className="flex justify-between">
                <span>Available Credit:</span>
                <span className={availableCredit > 0 ? 'text-neon-green' : 'text-red-400'}>
                  {Math.max(0, availableCredit).toLocaleString()} cr.
                </span>
              </div>
              <div className="text-xs text-palm-gray mt-2">
                Interest: 10% daily (minimum 1 credit)
              </div>
              {actualState.policeRecordScore < 0 && (
                <div className="text-xs text-red-400 mt-1">
                  Criminal record limits credit to 500 credits
                </div>
              )}
            </div>
          </div>

          {/* Get Loan */}
          {availableCredit > 0 && (
            <div className="space-panel bg-space-black mb-4">
              <div className="text-neon-amber mb-3">Get Loan:</div>
              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  min="1"
                  max={availableCredit}
                  className="flex-1 px-3 py-2 bg-space-black border border-palm-gray border-opacity-30 rounded text-palm-gray focus:border-neon-cyan focus:outline-none"
                  placeholder="Loan amount"
                />
                <button
                  onClick={() => setLoanAmount(availableCredit.toString())}
                  className="neon-button px-3 py-2 text-sm"
                >
                  Max
                </button>
              </div>
              <button
                onClick={handleGetLoan}
                disabled={!bankingAvailable || parseInt(loanAmount) <= 0}
                className="neon-button w-full py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Get Loan: {isNaN(parseInt(loanAmount)) ? 0 : Math.min(parseInt(loanAmount), availableCredit).toLocaleString()} cr.
              </button>
            </div>
          )}

          {/* Pay Back Debt */}
          {actualState.debt > 0 && (
            <div className="space-panel bg-space-black mb-4">
              <div className="text-neon-amber mb-3">Pay Back Debt:</div>
              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min="1"
                  max={Math.min(actualState.credits, actualState.debt)}
                  className="flex-1 px-3 py-2 bg-space-black border border-palm-gray border-opacity-30 rounded text-palm-gray focus:border-neon-cyan focus:outline-none"
                  placeholder={`Pay amount (debt: ${actualState.debt.toLocaleString()})`}
                />
                <button
                  onClick={() => setPaymentAmount(Math.min(actualState.credits, actualState.debt).toString())}
                  className="neon-button px-3 py-2 text-sm"
                >
                  All
                </button>
              </div>
              <button
                onClick={handlePayBack}
                disabled={!bankingAvailable || actualState.credits <= 0}
                className="neon-button w-full py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pay Back: {paymentAmount === '' ? Math.min(actualState.credits, actualState.debt).toLocaleString() : 
                          Math.min(parseInt(paymentAmount) || 0, actualState.credits, actualState.debt).toLocaleString()} cr.
              </button>
            </div>
          )}
        </>
      )}

      {/* Insurance Tab */}
      {activeTab === 'insurance' && (
        <>
          {/* Insurance Status */}
          <div className="space-panel bg-space-black mb-4">
            <div className="text-neon-amber mb-2">Insurance Status:</div>
            <div className="text-sm text-palm-gray space-y-1">
              <div className="flex justify-between">
                <span>Policy:</span>
                <span className={actualState.insurance ? 'text-neon-green' : 'text-red-400'}>
                  {actualState.insurance ? 'Active' : 'None'}
                </span>
              </div>
              {actualState.insurance && (
                <>
                  <div className="flex justify-between">
                    <span>No-Claim Days:</span>
                    <span>{actualState.noClaim}</span>
                  </div>
                  <div className="text-xs text-palm-gray mt-2">
                    Daily premium based on ship value and risk
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span>Escape Pod:</span>
                <span className={actualState.escapePod ? 'text-neon-green' : 'text-red-400'}>
                  {actualState.escapePod ? 'Installed' : 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Insurance Actions */}
          {!actualState.insurance ? (
            <div className="space-panel bg-space-black mb-4">
              <div className="text-neon-amber mb-3">Purchase Insurance:</div>
              <div className="text-sm text-palm-gray mb-3">
                Insurance covers ship and cargo losses. Daily premiums are automatically deducted during travel.
                {!actualState.escapePod && (
                  <div className="text-neon-amber mt-2">Note: Escape pod required for insurance claims.</div>
                )}
              </div>
              <button
                onClick={handleBuyInsurance}
                disabled={!bankingAvailable}
                className="neon-button w-full py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Activate Insurance Policy
              </button>
            </div>
          ) : (
            <div className="space-panel bg-space-black mb-4">
              <div className="text-neon-amber mb-3">Cancel Insurance:</div>
              <div className="text-sm text-palm-gray mb-3">
                Cancel your current insurance policy. You will lose coverage immediately.
              </div>
              <button
                onClick={handleStopInsurance}
                disabled={!bankingAvailable}
                className="neon-button w-full py-2 bg-red-900 hover:bg-red-800 border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel Insurance Policy
              </button>
            </div>
          )}

          {/* Escape Pod */}
          {!actualState.escapePod && (
            <div className="space-panel bg-space-black mb-4">
              <div className="text-neon-amber mb-3">Escape Pod:</div>
              <div className="text-sm text-palm-gray mb-3">
                An escape pod is required to make insurance claims. It allows you to survive ship destruction.
              </div>
              <button
                onClick={handleBuyEscapePod}
                disabled={!bankingAvailable}
                className="neon-button w-full py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Escape Pod
              </button>
            </div>
          )}
        </>
      )}

      {/* Message Display */}
      {message && (
        <div className={`space-panel mb-4 ${
          messageType === 'success' ? 'bg-green-900 border-green-500' :
          messageType === 'error' ? 'bg-red-900 border-red-500' :
          'bg-space-black border-neon-amber'
        }`}>
          <div className={`text-sm ${
            messageType === 'success' ? 'text-green-300' :
            messageType === 'error' ? 'text-red-300' :
            'text-neon-amber'
          }`}>
            {message}
          </div>
        </div>
      )}
    </div>
  );
}
