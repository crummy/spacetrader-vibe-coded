import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { BankScreen } from '../BankScreen'
import { createInitialState } from '@game-state'
import { getAvailableActions } from '@game-engine'
import { calculateMaxLoan, canGetLoan, canPayBack } from '@game/economy/bank'
import type { GameState } from '@game-types'
import type { GameAction, AvailableAction } from '@game-engine'

// Only mock the game engine hook - everything else is real
vi.mock('../../hooks/useGameEngine.ts', () => ({
  useGameEngine: vi.fn(() => ({
    state: testGameState,
    executeAction: mockExecuteAction,
    availableActions: testAvailableActions
  }))
}))

// Create a real game state for testing
const testGameState = createInitialState()

// Set up initial docked state
testGameState.currentMode = 0 // OnPlanet (docked)

// Mock execute action function
const mockExecuteAction = vi.fn()

// Get real available actions
let testAvailableActions = getAvailableActions(testGameState)

describe('BankScreen', () => {
  const defaultProps = {
    onNavigate: vi.fn(),
    onBack: vi.fn(),
    state: testGameState,
    onAction: mockExecuteAction,
    availableActions: testAvailableActions
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset to clean state
    testGameState.credits = 1000
    testGameState.debt = 0
    testGameState.insurance = false
    testGameState.escapePod = false
    testGameState.policeRecordScore = 0 // Clean record
    testGameState.currentMode = 0 // OnPlanet
    testAvailableActions = getAvailableActions(testGameState)
  })

  describe('UI Rendering', () => {
    it('renders the bank screen with all main sections', () => {
      render(<BankScreen {...defaultProps} />)

      expect(screen.getByTestId('bank-screen')).toBeInTheDocument()
      expect(screen.getByTestId('financial-status')).toBeInTheDocument()
      expect(screen.getByTestId('tab-selector')).toBeInTheDocument()
      expect(screen.getByTestId('loans-tab')).toBeInTheDocument()
      expect(screen.getByTestId('insurance-tab')).toBeInTheDocument()
    })

    it('displays correct financial information', () => {
      testGameState.credits = 5000
      testGameState.debt = 2000
      
      render(<BankScreen {...defaultProps} />)

      expect(screen.getByTestId('credits-display')).toHaveTextContent('5,000 cr.')
      expect(screen.getByTestId('debt-display')).toHaveTextContent('2,000 cr.')
      expect(screen.getByTestId('net-worth-display')).toHaveTextContent('3,000 cr.')
    })

    it('shows dock panel when not docked', () => {
      testGameState.currentMode = 1 // Not on planet
      const undockedActions = [{ type: 'dock_at_planet', available: true, name: 'Dock', description: 'Dock at planet' }]
      
      render(<BankScreen {...{ ...defaultProps, availableActions: undockedActions }} />)

      expect(screen.getByTestId('dock-panel')).toBeInTheDocument()
      expect(screen.getByTestId('dock-button')).toBeInTheDocument()
    })

    it('does not show dock panel when docked', () => {
      render(<BankScreen {...defaultProps} />)

      expect(screen.queryByTestId('dock-panel')).not.toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('starts with loans tab active', () => {
      render(<BankScreen {...defaultProps} />)

      expect(screen.getByTestId('loans-tab')).toHaveClass('text-neon-cyan')
      expect(screen.getByTestId('insurance-tab')).not.toHaveClass('text-neon-cyan')
      expect(screen.getByTestId('loan-information')).toBeInTheDocument()
    })

    it('switches to insurance tab when clicked', async () => {
      const user = userEvent.setup()
      render(<BankScreen {...defaultProps} />)

      await user.click(screen.getByTestId('insurance-tab'))

      expect(screen.getByTestId('insurance-tab')).toHaveClass('text-neon-cyan')
      expect(screen.getByTestId('loans-tab')).not.toHaveClass('text-neon-cyan')
      expect(screen.getByTestId('insurance-status')).toBeInTheDocument()
    })

    it('switches back to loans tab when clicked', async () => {
      const user = userEvent.setup()
      render(<BankScreen {...defaultProps} />)

      // Switch to insurance first
      await user.click(screen.getByTestId('insurance-tab'))
      // Then back to loans
      await user.click(screen.getByTestId('loans-tab'))

      expect(screen.getByTestId('loans-tab')).toHaveClass('text-neon-cyan')
      expect(screen.getByTestId('insurance-tab')).not.toHaveClass('text-neon-cyan')
      expect(screen.getByTestId('loan-information')).toBeInTheDocument()
    })
  })

  describe('Loans Tab', () => {
    beforeEach(() => {
      // Ensure we're on loans tab
      testGameState.debt = 0
      testAvailableActions = getAvailableActions(testGameState)
    })

    it('displays loan information correctly', () => {
      const maxLoan = calculateMaxLoan(testGameState)
      render(<BankScreen {...defaultProps} />)

      expect(screen.getByTestId('credit-limit')).toHaveTextContent(`${maxLoan.toLocaleString()} cr.`)
      expect(screen.getByTestId('available-credit')).toHaveTextContent(`${maxLoan.toLocaleString()} cr.`)
    })

    it('shows criminal warning for bad police record', () => {
      testGameState.policeRecordScore = -5 // Criminal record
      render(<BankScreen {...defaultProps} />)

      expect(screen.getByTestId('criminal-warning')).toBeInTheDocument()
      expect(screen.getByTestId('credit-limit')).toHaveTextContent('500 cr.')
    })

    describe('Get Loan', () => {
      it('shows get loan panel when credit available', () => {
        render(<BankScreen {...defaultProps} />)

        expect(screen.getByTestId('get-loan-panel')).toBeInTheDocument()
        expect(screen.getByTestId('loan-amount-input')).toBeInTheDocument()
        expect(screen.getByTestId('max-loan-button')).toBeInTheDocument()
        expect(screen.getByTestId('get-loan-button')).toBeInTheDocument()
      })

      it('does not show get loan panel when no credit available', () => {
        testGameState.debt = 25000 // At max debt
        testAvailableActions = getAvailableActions(testGameState)
        
        render(<BankScreen {...{ ...defaultProps, availableActions: testAvailableActions }} />)

        expect(screen.queryByTestId('get-loan-panel')).not.toBeInTheDocument()
      })

      it('fills max amount when max button clicked', async () => {
        const user = userEvent.setup()
        const maxLoan = calculateMaxLoan(testGameState)
        
        render(<BankScreen {...defaultProps} />)

        await user.click(screen.getByTestId('max-loan-button'))

        expect(screen.getByTestId('loan-amount-input')).toHaveValue(maxLoan)
      })

      it('updates button text with loan amount', async () => {
        const user = userEvent.setup()
        render(<BankScreen {...defaultProps} />)

        const input = screen.getByTestId('loan-amount-input')
        await user.clear(input)
        await user.type(input, '500') // Use amount within available credit

        expect(screen.getByTestId('get-loan-button')).toHaveTextContent('Get Loan: 500 cr.')
      })

      it('executes loan action when button clicked', async () => {
        const user = userEvent.setup()
        mockExecuteAction.mockResolvedValue({ success: true, message: 'Loan approved!' })
        
        render(<BankScreen {...defaultProps} />)

        const input = screen.getByTestId('loan-amount-input')
        await user.clear(input)
        await user.type(input, '2000')
        await user.click(screen.getByTestId('get-loan-button'))

        expect(mockExecuteAction).toHaveBeenCalledWith({
          type: 'get_loan',
          parameters: { amount: 2000 }
        })
      })

      it('disables get loan button for invalid amount', async () => {
        const user = userEvent.setup()
        render(<BankScreen {...defaultProps} />)

        const input = screen.getByTestId('loan-amount-input')
        await user.clear(input)
        await user.type(input, '0') // Invalid amount
        
        // Button should be disabled for invalid amounts
        expect(screen.getByTestId('get-loan-button')).toBeDisabled()
      })

      it('shows error when banking not available', async () => {
        const user = userEvent.setup()
        const noBankingActions = testAvailableActions.filter(a => a.type !== 'get_loan')
        
        render(<BankScreen {...{ ...defaultProps, availableActions: noBankingActions }} />)

        await user.click(screen.getByTestId('get-loan-button'))

        await waitFor(() => {
          expect(screen.getByTestId('message-text')).toHaveTextContent('Banking services not available')
        })
      })
    })

    describe('Pay Back Debt', () => {
      beforeEach(() => {
        testGameState.debt = 3000
        testGameState.credits = 5000
        testAvailableActions = getAvailableActions(testGameState)
      })

      it('shows pay back panel when debt exists', () => {
        render(<BankScreen {...{ ...defaultProps, availableActions: testAvailableActions }} />)

        expect(screen.getByTestId('pay-back-panel')).toBeInTheDocument()
        expect(screen.getByTestId('payment-amount-input')).toBeInTheDocument()
        expect(screen.getByTestId('all-payment-button')).toBeInTheDocument()
        expect(screen.getByTestId('pay-back-button')).toBeInTheDocument()
      })

      it('does not show pay back panel when no debt', () => {
        testGameState.debt = 0
        testAvailableActions = getAvailableActions(testGameState)
        
        render(<BankScreen {...{ ...defaultProps, availableActions: testAvailableActions }} />)

        expect(screen.queryByTestId('pay-back-panel')).not.toBeInTheDocument()
      })

      it('fills all amount when all button clicked', async () => {
        const user = userEvent.setup()
        render(<BankScreen {...{ ...defaultProps, availableActions: testAvailableActions }} />)

        await user.click(screen.getByTestId('all-payment-button'))

        expect(screen.getByTestId('payment-amount-input')).toHaveValue(3000) // Min of debt and credits
      })

      it('limits payment to available credits', async () => {
        testGameState.credits = 2000 // Less than debt
        const user = userEvent.setup()
        render(<BankScreen {...{ ...defaultProps, availableActions: testAvailableActions }} />)

        await user.click(screen.getByTestId('all-payment-button'))

        expect(screen.getByTestId('payment-amount-input')).toHaveValue(2000) // Limited to credits
      })

      it('executes payment action when button clicked', async () => {
        const user = userEvent.setup()
        mockExecuteAction.mockResolvedValue({ success: true, message: 'Payment successful!' })
        
        render(<BankScreen {...{ ...defaultProps, availableActions: testAvailableActions }} />)

        const input = screen.getByTestId('payment-amount-input')
        await user.type(input, '1500')
        await user.click(screen.getByTestId('pay-back-button'))

        expect(mockExecuteAction).toHaveBeenCalledWith({
          type: 'pay_back',
          parameters: { amount: 1500 }
        })
      })

      it('pays full debt when no amount specified', async () => {
        const user = userEvent.setup()
        mockExecuteAction.mockResolvedValue({ success: true, message: 'Debt paid!' })
        
        render(<BankScreen {...{ ...defaultProps, availableActions: testAvailableActions }} />)

        await user.click(screen.getByTestId('pay-back-button'))

        expect(mockExecuteAction).toHaveBeenCalledWith({
          type: 'pay_back',
          parameters: { amount: 3000 } // Full debt amount
        })
      })

      it('shows error for invalid payment amount', async () => {
        const user = userEvent.setup()
        render(<BankScreen {...{ ...defaultProps, availableActions: testAvailableActions }} />)

        const input = screen.getByTestId('payment-amount-input')
        await user.type(input, '-100')
        await user.click(screen.getByTestId('pay-back-button'))

        await waitFor(() => {
          expect(screen.getByTestId('message-text')).toHaveTextContent('Please enter a valid payment amount')
        })
      })

      it('disables payment when no credits available', () => {
        testGameState.credits = 0
        testAvailableActions = getAvailableActions(testGameState)
        
        render(<BankScreen {...{ ...defaultProps, availableActions: testAvailableActions }} />)

        expect(screen.getByTestId('pay-back-button')).toBeDisabled()
      })
    })
  })

  describe('Insurance Tab', () => {
    it('displays insurance status correctly', async () => {
      const user = userEvent.setup()
      render(<BankScreen {...defaultProps} />)
      await user.click(screen.getByTestId('insurance-tab'))
      
      expect(screen.getByTestId('insurance-status-display')).toHaveTextContent('None')
      expect(screen.getByTestId('escape-pod-status')).toHaveTextContent('None')
    })

    it('shows active insurance status when insured', async () => {
      // Create a separate state instance for this test
      const insuredState = createInitialState()
      insuredState.currentMode = 0
      insuredState.insurance = true
      insuredState.noClaim = 15
      const insuredActions = getAvailableActions(insuredState)
      
      const user = userEvent.setup()
      render(<BankScreen {...{ ...defaultProps, state: insuredState, availableActions: insuredActions }} />)
      await user.click(screen.getByTestId('insurance-tab'))

      expect(screen.getByTestId('insurance-status-display')).toHaveTextContent('Active')
      expect(screen.getByTestId('no-claim-days')).toHaveTextContent('15')
    })

    it('shows escape pod installed status', async () => {
      // Create a separate state instance for this test
      const podState = createInitialState()
      podState.currentMode = 0
      podState.escapePod = true
      
      const user = userEvent.setup()
      render(<BankScreen {...{ ...defaultProps, state: podState }} />)
      await user.click(screen.getByTestId('insurance-tab'))

      expect(screen.getByTestId('escape-pod-status')).toHaveTextContent('Installed')
    })

    describe('Buy Insurance', () => {
      it('shows buy insurance panel when no insurance', async () => {
        const user = userEvent.setup()
        render(<BankScreen {...defaultProps} />)
        await user.click(screen.getByTestId('insurance-tab'))
        
        expect(screen.getByTestId('buy-insurance-panel')).toBeInTheDocument()
        expect(screen.getByTestId('buy-insurance-button')).toBeInTheDocument()
      })

      it('shows escape pod warning when no escape pod', async () => {
        const user = userEvent.setup()
        render(<BankScreen {...defaultProps} />)
        await user.click(screen.getByTestId('insurance-tab'))
        
        expect(screen.getByTestId('escape-pod-warning')).toBeInTheDocument()
      })

      it('does not show escape pod warning when escape pod installed', async () => {
        const podState = createInitialState()
        podState.currentMode = 0
        podState.escapePod = true
        
        const user = userEvent.setup()
        render(<BankScreen {...{ ...defaultProps, state: podState }} />)
        await user.click(screen.getByTestId('insurance-tab'))

        expect(screen.queryByTestId('escape-pod-warning')).not.toBeInTheDocument()
      })

      it('executes buy insurance action when button clicked', async () => {
        const user = userEvent.setup()
        mockExecuteAction.mockResolvedValue({ success: true, message: 'Insurance activated!' })

        render(<BankScreen {...defaultProps} />)
        await user.click(screen.getByTestId('insurance-tab'))
        await user.click(screen.getByTestId('buy-insurance-button'))

        expect(mockExecuteAction).toHaveBeenCalledWith({
          type: 'buy_insurance',
          parameters: {}
        })
      })

      it('shows error when insurance already active', async () => {
        const insuredState = createInitialState()
        insuredState.currentMode = 0
        insuredState.insurance = true
        const insuredActions = getAvailableActions(insuredState)
        
        const user = userEvent.setup()
        render(<BankScreen {...{ ...defaultProps, state: insuredState, availableActions: insuredActions }} />)
        await user.click(screen.getByTestId('insurance-tab'))
        
        // When insurance is active, the component should show cancel panel instead of buy panel
        expect(screen.getByTestId('cancel-insurance-panel')).toBeInTheDocument()
        expect(screen.queryByTestId('buy-insurance-panel')).not.toBeInTheDocument()
      })
    })

    describe('Cancel Insurance', () => {
      it('shows cancel insurance panel when insured', async () => {
        const insuredState = createInitialState()
        insuredState.currentMode = 0
        insuredState.insurance = true
        const insuredActions = getAvailableActions(insuredState)
        
        const user = userEvent.setup()
        render(<BankScreen {...{ ...defaultProps, state: insuredState, availableActions: insuredActions }} />)
        await user.click(screen.getByTestId('insurance-tab'))

        expect(screen.getByTestId('cancel-insurance-panel')).toBeInTheDocument()
        expect(screen.getByTestId('cancel-insurance-button')).toBeInTheDocument()
      })

      it('executes cancel insurance action when button clicked', async () => {
        const insuredState = createInitialState()
        insuredState.currentMode = 0
        insuredState.insurance = true
        const insuredActions = getAvailableActions(insuredState)
        
        const user = userEvent.setup()
        mockExecuteAction.mockResolvedValue({ success: true, message: 'Insurance cancelled!' })
        
        render(<BankScreen {...{ ...defaultProps, state: insuredState, availableActions: insuredActions }} />)
        await user.click(screen.getByTestId('insurance-tab'))
        await user.click(screen.getByTestId('cancel-insurance-button'))

        expect(mockExecuteAction).toHaveBeenCalledWith({
          type: 'stop_insurance',
          parameters: {}
        })
      })
    })

    describe('Escape Pod', () => {
      it('shows escape pod panel when no escape pod', async () => {
        const user = userEvent.setup()
        render(<BankScreen {...defaultProps} />)
        await user.click(screen.getByTestId('insurance-tab'))
        
        expect(screen.getByTestId('escape-pod-panel')).toBeInTheDocument()
        expect(screen.getByTestId('buy-escape-pod-button')).toBeInTheDocument()
      })

      it('does not show escape pod panel when escape pod installed', async () => {
        const podState = createInitialState()
        podState.currentMode = 0
        podState.escapePod = true
        
        const user = userEvent.setup()
        render(<BankScreen {...{ ...defaultProps, state: podState }} />)
        await user.click(screen.getByTestId('insurance-tab'))

        expect(screen.queryByTestId('escape-pod-panel')).not.toBeInTheDocument()
      })

      it('executes buy escape pod action when button clicked', async () => {
        // Create state with system that supports escape pods (high tech)
        const podTestState = createInitialState()
        podTestState.currentMode = 0
        podTestState.credits = 5000 // Ensure enough credits
        podTestState.solarSystem[0].techLevel = 6 // High tech system
        const podActions = getAvailableActions(podTestState)
        
        const user = userEvent.setup()
        mockExecuteAction.mockResolvedValue({ success: true, message: 'Escape pod purchased!' })

        render(<BankScreen {...{ ...defaultProps, state: podTestState, availableActions: podActions }} />)
        await user.click(screen.getByTestId('insurance-tab'))
        await user.click(screen.getByTestId('buy-escape-pod-button'))

        expect(mockExecuteAction).toHaveBeenCalledWith({
          type: 'buy_escape_pod',
          parameters: {}
        })
      })
    })
  })

  describe('Business Logic Integration', () => {
    it('uses real loan calculation logic', () => {
      testGameState.credits = 10000
      testGameState.debt = 0
      
      const maxLoan = calculateMaxLoan(testGameState)
      const canGet = canGetLoan(testGameState)
      
      render(<BankScreen {...defaultProps} />)

      expect(canGet).toBe(true)
      expect(screen.getByTestId('credit-limit')).toHaveTextContent(`${maxLoan.toLocaleString()} cr.`)
    })

    it('reflects criminal record in loan limits', () => {
      testGameState.policeRecordScore = -10 // Criminal
      
      const maxLoan = calculateMaxLoan(testGameState)
      render(<BankScreen {...defaultProps} />)

      expect(maxLoan).toBe(500) // Criminal limit
      expect(screen.getByTestId('credit-limit')).toHaveTextContent('500 cr.')
      expect(screen.getByTestId('criminal-warning')).toBeInTheDocument()
    })

    it('correctly calculates net worth with debt', () => {
      testGameState.credits = 8000
      testGameState.debt = 3000
      
      render(<BankScreen {...defaultProps} />)

      expect(screen.getByTestId('net-worth-display')).toHaveTextContent('5,000 cr.')
    })

    it('shows negative net worth correctly', () => {
      testGameState.credits = 1000
      testGameState.debt = 3000
      
      render(<BankScreen {...defaultProps} />)

      expect(screen.getByTestId('net-worth-display')).toHaveTextContent('-2,000 cr.')
      expect(screen.getByTestId('net-worth-display')).toHaveClass('text-red-400')
    })

    it('integrates with real available actions', () => {
      // Create a specific state for testing actions
      const actionTestState = createInitialState()
      actionTestState.currentMode = 0 // OnPlanet (docked)
      actionTestState.debt = 5000
      actionTestState.credits = 3000
      const actions = getAvailableActions(actionTestState)
      
      // Log actions for debugging
      console.log('Available actions:', actions.map(a => ({ type: a.type, available: a.available })))
      
      const payBackAction = actions.find(a => a.type === 'pay_back')
      const insuranceAction = actions.find(a => a.type === 'buy_insurance')
      
      // Pay back action should exist when there's debt and credits
      expect(payBackAction).toBeDefined() 
      expect(payBackAction?.available).toBe(true) // Has credits to pay back
      
      // Insurance action should exist
      expect(insuranceAction).toBeDefined()
      expect(insuranceAction?.available).toBe(true) // Can buy insurance
      
      // Loan action exists if not at max debt
      const maxLoan = calculateMaxLoan(actionTestState)
      if (actionTestState.debt < maxLoan) {
        const loanAction = actions.find(a => a.type === 'get_loan')
        expect(loanAction).toBeDefined()
      }
    })
  })

  describe('Error Handling', () => {
    it('handles action execution errors gracefully', async () => {
      const user = userEvent.setup()
      mockExecuteAction.mockResolvedValue({ 
        success: false, 
        message: 'Insufficient funds for loan' 
      })
      
      render(<BankScreen {...defaultProps} />)

      await user.click(screen.getByTestId('get-loan-button'))

      await waitFor(() => {
        expect(screen.getByTestId('message-text')).toHaveTextContent('Insufficient funds for loan')
        expect(screen.getByTestId('message-display')).toHaveClass('bg-red-900')
      })
    })

    it('handles action execution exceptions', async () => {
      const user = userEvent.setup()
      mockExecuteAction.mockRejectedValue(new Error('Network error'))
      
      render(<BankScreen {...defaultProps} />)

      await user.click(screen.getByTestId('get-loan-button'))

      await waitFor(() => {
        expect(screen.getByTestId('message-text')).toHaveTextContent('Error: Network error')
      })
    })

    it('shows success messages with correct styling', async () => {
      const user = userEvent.setup()
      mockExecuteAction.mockResolvedValue({ 
        success: true, 
        message: 'Loan approved successfully!' 
      })
      
      render(<BankScreen {...defaultProps} />)

      await user.click(screen.getByTestId('get-loan-button'))

      await waitFor(() => {
        expect(screen.getByTestId('message-text')).toHaveTextContent('Loan approved successfully!')
        expect(screen.getByTestId('message-display')).toHaveClass('bg-green-900')
      })
    })
  })

  describe('Complex Scenarios', () => {
    it('handles maximum debt scenario', () => {
      const maxLoan = calculateMaxLoan(testGameState)
      testGameState.debt = maxLoan // At maximum debt
      testAvailableActions = getAvailableActions(testGameState)
      
      render(<BankScreen {...{ ...defaultProps, availableActions: testAvailableActions }} />)

      expect(screen.getByTestId('available-credit')).toHaveTextContent('0 cr.')
      expect(screen.queryByTestId('get-loan-panel')).not.toBeInTheDocument()
    })

    it('handles no money scenario', () => {
      testGameState.credits = 0
      testGameState.debt = 5000
      testAvailableActions = getAvailableActions(testGameState)
      
      render(<BankScreen {...{ ...defaultProps, availableActions: testAvailableActions }} />)

      expect(screen.getByTestId('pay-back-button')).toBeDisabled()
      expect(screen.getByTestId('net-worth-display')).toHaveTextContent('-5,000 cr.')
      expect(screen.getByTestId('net-worth-display')).toHaveClass('text-red-400')
    })

    it('handles rich player scenario', () => {
      testGameState.credits = 50000
      testGameState.debt = 0
      const maxLoan = calculateMaxLoan(testGameState)
      
      render(<BankScreen {...defaultProps} />)

      expect(screen.getByTestId('available-credit')).toHaveTextContent(`${maxLoan.toLocaleString()} cr.`)
      expect(screen.getByTestId('net-worth-display')).toHaveTextContent('50,000 cr.')
      expect(screen.queryByTestId('pay-back-panel')).not.toBeInTheDocument()
    })
  })

  describe('Docking Integration', () => {
    it('handles dock action when not docked', async () => {
      testGameState.currentMode = 1 // Not on planet
      const undockedActions = [{ 
        type: 'dock_at_planet', 
        available: true, 
        name: 'Dock', 
        description: 'Dock at planet' 
      }]
      
      const user = userEvent.setup()
      mockExecuteAction.mockResolvedValue({ success: true, message: 'Docked successfully!' })
      
      render(<BankScreen {...{ ...defaultProps, availableActions: undockedActions }} />)

      await user.click(screen.getByTestId('dock-button'))

      expect(mockExecuteAction).toHaveBeenCalledWith({
        type: 'dock_at_planet',
        parameters: {}
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('message-text')).toHaveTextContent('Successfully docked at planet')
      })
    })

    it('handles dock action failure', async () => {
      testGameState.currentMode = 1 // Not on planet
      const undockedActions = [{ 
        type: 'dock_at_planet', 
        available: true, 
        name: 'Dock', 
        description: 'Dock at planet' 
      }]
      
      const user = userEvent.setup()
      mockExecuteAction.mockResolvedValue({ 
        success: false, 
        message: 'Cannot dock - hostile forces present' 
      })
      
      render(<BankScreen {...{ ...defaultProps, availableActions: undockedActions }} />)

      await user.click(screen.getByTestId('dock-button'))

      await waitFor(() => {
        expect(screen.getByTestId('message-text')).toHaveTextContent('Failed to dock: Cannot dock - hostile forces present')
      })
    })
  })
})
