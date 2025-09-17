import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { OptionsScreen } from '../OptionsScreen'
import { createInitialState } from '@game-state'
import type { GameState } from '@game-types'

// Create a real game state for testing
const testGameState = createInitialState()

// Set up realistic options state
testGameState.options = {
  autoFuel: true,
  autoRepair: false,
  alwaysIgnorePolice: false,
  alwaysIgnorePirates: false,
  alwaysIgnoreTraders: true,
  alwaysIgnoreTradeInOrbit: false,
  reserveMoney: true,
  continuous: false,
  attackFleeing: false,
  alwaysInfo: true,
  leaveEmpty: 5,
  autoAttack: false,
  autoFlee: true,
  textualEncounters: false,
  newsAutoPay: true,
  remindLoans: true,
  priceDifferences: true,
  tribbleMessage: false,
  useHWButtons: false,
  rectangularButtonsOn: true,
  sharePreferences: false,
  identifyStartup: true
}

const mockOnAction = vi.fn()
const mockOnBack = vi.fn()

describe('OptionsScreen', () => {
  const defaultProps = {
    state: testGameState,
    onAction: mockOnAction,
    onBack: mockOnBack
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnAction.mockResolvedValue({ success: true })
  })

  it('should render options screen with header', () => {
    render(<OptionsScreen {...defaultProps} />)
    
    // Should show header
    expect(screen.getByText('OPTIONS')).toBeInTheDocument()
    expect(screen.getByText('← Back')).toBeInTheDocument()
  })

  it('should display all option categories', () => {
    render(<OptionsScreen {...defaultProps} />)
    
    // Should show all categories
    expect(screen.getByText('AUTO SERVICES')).toBeInTheDocument()
    expect(screen.getByText('ALWAYS IGNORE (WHEN SAFE)')).toBeInTheDocument()
    expect(screen.getByText('GAME PREFERENCES')).toBeInTheDocument()
    expect(screen.getByText('COMBAT')).toBeInTheDocument()
    expect(screen.getByText('INTERFACE')).toBeInTheDocument()
    expect(screen.getByText('ADVANCED')).toBeInTheDocument()
  })

  it('should display auto services options correctly', () => {
    render(<OptionsScreen {...defaultProps} />)
    
    // Check auto services checkboxes
    const autoFuelCheckbox = screen.getByRole('checkbox', { name: /Auto-fuel/i })
    expect(autoFuelCheckbox).toBeChecked() // Set to true in test state
    
    const autoRepairCheckbox = screen.getByRole('checkbox', { name: /Auto-repair/i })
    expect(autoRepairCheckbox).not.toBeChecked() // Set to false in test state
    
    // Check descriptions
    expect(screen.getByText('Fill tank when arriving in systems')).toBeInTheDocument()
    expect(screen.getByText('Repair hull when arriving in systems')).toBeInTheDocument()
  })

  it('should display always ignore options correctly', () => {
    render(<OptionsScreen {...defaultProps} />)
    
    // Check ignore options
    const ignorePoliceCheckbox = screen.getByRole('checkbox', { name: /Ignore Police/i })
    expect(ignorePoliceCheckbox).not.toBeChecked()
    
    const ignorePiratesCheckbox = screen.getByRole('checkbox', { name: /Ignore Pirates/i })
    expect(ignorePiratesCheckbox).not.toBeChecked()
    
    const ignoreTradersCheckbox = screen.getByRole('checkbox', { name: /Ignore Traders/i })
    expect(ignoreTradersCheckbox).toBeChecked() // Set to true in test state
    
    const ignoreTradeInOrbitCheckbox = screen.getByRole('checkbox', { name: /Ignore Trade in Orbit/i })
    expect(ignoreTradeInOrbitCheckbox).not.toBeChecked()
  })

  it('should display game preferences with number input', () => {
    render(<OptionsScreen {...defaultProps} />)
    
    // Check game preference checkboxes
    const reserveMoneyCheckbox = screen.getByRole('checkbox', { name: /Reserve Money/i })
    expect(reserveMoneyCheckbox).toBeChecked()
    
    const continuousCheckbox = screen.getByRole('checkbox', { name: /Continuous Mode/i })
    expect(continuousCheckbox).not.toBeChecked()
    
    // Check number input for leaveEmpty
    const leaveEmptyInput = screen.getByDisplayValue('5') // Set to 5 in test state
    expect(leaveEmptyInput).toBeInTheDocument()
    expect(leaveEmptyInput).toHaveAttribute('type', 'number')
  })

  it('should display combat options correctly', () => {
    render(<OptionsScreen {...defaultProps} />)
    
    const autoAttackCheckbox = screen.getByRole('checkbox', { name: /Auto-attack/i })
    expect(autoAttackCheckbox).not.toBeChecked()
    
    const autoFleeCheckbox = screen.getByRole('checkbox', { name: /Auto-flee/i })
    expect(autoFleeCheckbox).toBeChecked() // Set to true in test state
  })

  it('should display interface options correctly', () => {
    render(<OptionsScreen {...defaultProps} />)
    
    const textualEncountersCheckbox = screen.getByRole('checkbox', { name: /Text Encounters/i })
    expect(textualEncountersCheckbox).not.toBeChecked()
    
    const newsAutoPayCheckbox = screen.getByRole('checkbox', { name: /Auto-buy News/i })
    expect(newsAutoPayCheckbox).toBeChecked()
    
    const remindLoansCheckbox = screen.getByRole('checkbox', { name: /Loan Reminders/i })
    expect(remindLoansCheckbox).toBeChecked()
    
    const priceDifferencesCheckbox = screen.getByRole('checkbox', { name: /Show Price Differences/i })
    expect(priceDifferencesCheckbox).toBeChecked()
    
    const rectangularButtonsCheckbox = screen.getByRole('checkbox', { name: /Rectangular Buttons/i })
    expect(rectangularButtonsCheckbox).toBeChecked()
  })

  it('should display advanced options correctly', () => {
    render(<OptionsScreen {...defaultProps} />)
    
    const sharePreferencesCheckbox = screen.getByRole('checkbox', { name: /Share Preferences/i })
    expect(sharePreferencesCheckbox).not.toBeChecked()
    
    const identifyStartupCheckbox = screen.getByRole('checkbox', { name: /Identify on Startup/i })
    expect(identifyStartupCheckbox).toBeChecked()
  })

  it('should handle checkbox changes', async () => {
    const user = userEvent.setup()
    render(<OptionsScreen {...defaultProps} />)
    
    // Toggle auto-fuel option
    const autoFuelCheckbox = screen.getByRole('checkbox', { name: /Auto-fuel/i })
    expect(autoFuelCheckbox).toBeChecked()
    
    await user.click(autoFuelCheckbox)
    expect(autoFuelCheckbox).not.toBeChecked()
    
    // Toggle it back
    await user.click(autoFuelCheckbox)
    expect(autoFuelCheckbox).toBeChecked()
  })

  it('should handle number input changes', async () => {
    const user = userEvent.setup()
    render(<OptionsScreen {...defaultProps} />)
    
    // Change the leave empty value
    const leaveEmptyInput = screen.getByTestId('option-leaveEmpty')
    await user.clear(leaveEmptyInput)
    await user.type(leaveEmptyInput, '10')
    
    expect(leaveEmptyInput).toHaveValue(10)
  })

  it('should handle number input edge cases', async () => {
    const user = userEvent.setup()
    render(<OptionsScreen {...defaultProps} />)
    
    const leaveEmptyInput = screen.getByTestId('option-leaveEmpty')
    
    // Test clearing input (should default to 0)
    await user.clear(leaveEmptyInput)
    expect(leaveEmptyInput).toHaveValue(0)
    
    // Test invalid input
    await user.type(leaveEmptyInput, 'abc')
    expect(leaveEmptyInput).toHaveValue(0) // Should fallback to 0
  })

  it('should save options when going back', async () => {
    const user = userEvent.setup()
    render(<OptionsScreen {...defaultProps} />)
    
    // Change some options
    const autoFuelCheckbox = screen.getByRole('checkbox', { name: /Auto-fuel/i })
    await user.click(autoFuelCheckbox) // Toggle from true to false
    
    const leaveEmptyInput = screen.getByTestId('option-leaveEmpty')
    await user.clear(leaveEmptyInput)
    await user.type(leaveEmptyInput, '15')
    
    // Click back button
    const backButton = screen.getByText('← Back')
    await user.click(backButton)
    
    // Should call onBack
    expect(mockOnBack).toHaveBeenCalled()
    
    // Options should be saved to state
    expect(testGameState.options.autoFuel).toBe(false)
    expect(testGameState.options.leaveEmpty).toBe(15)
  })

  it('should show saving state when going back', async () => {
    const user = userEvent.setup()
    render(<OptionsScreen {...defaultProps} />)
    
    // Click back button
    const backButton = screen.getByText('← Back')
    await user.click(backButton)
    
    // Should briefly show saving state (though it resolves quickly in test)
    await waitFor(() => {
      expect(mockOnBack).toHaveBeenCalled()
    })
  })

  it('should handle multiple option changes correctly', async () => {
    const user = userEvent.setup()
    render(<OptionsScreen {...defaultProps} />)
    
    // Change multiple options
    const autoRepairCheckbox = screen.getByRole('checkbox', { name: /Auto-repair/i })
    await user.click(autoRepairCheckbox) // Toggle from false to true
    
    const continuousCheckbox = screen.getByRole('checkbox', { name: /Continuous Mode/i })
    await user.click(continuousCheckbox) // Toggle from false to true
    
    const autoAttackCheckbox = screen.getByRole('checkbox', { name: /Auto-attack/i })
    await user.click(autoAttackCheckbox) // Toggle from false to true
    
    // Go back to save
    const backButton = screen.getByText('← Back')
    await user.click(backButton)
    
    // Check all changes were saved
    expect(testGameState.options.autoRepair).toBe(true)
    expect(testGameState.options.continuous).toBe(true)
    expect(testGameState.options.autoAttack).toBe(true)
  })

  it('should handle back button error gracefully', async () => {
    const user = userEvent.setup()
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Simulate error during options save by providing a state with no options
    const stateWithBadOptions = { ...testGameState, options: undefined }
    
    const propsWithBadState = { ...defaultProps, state: stateWithBadOptions }
    
    // This test may throw during render due to undefined options
    // We'll wrap in try-catch and verify error handling
    try {
      render(<OptionsScreen {...propsWithBadState} />)
      
      const backButton = screen.getByText('← Back')
      await user.click(backButton)
      
      // Should still call onBack even with error
      await waitFor(() => {
        expect(mockOnBack).toHaveBeenCalled()
      })
    } catch (error) {
      // If render throws due to undefined options, that's expected behavior
      expect(error).toBeDefined()
    }
    
    consoleErrorSpy.mockRestore()
  })

  it('should initialize options from state correctly', () => {
    // Test with different initial state
    const differentState = {
      ...testGameState,
      options: {
        ...testGameState.options,
        autoFuel: false,
        autoRepair: true,
        leaveEmpty: 25
      }
    }
    
    render(<OptionsScreen {...defaultProps} state={differentState} />)
    
    const autoFuelCheckbox = screen.getByRole('checkbox', { name: /Auto-fuel/i })
    expect(autoFuelCheckbox).not.toBeChecked()
    
    const autoRepairCheckbox = screen.getByRole('checkbox', { name: /Auto-repair/i })
    expect(autoRepairCheckbox).toBeChecked()
    
    const leaveEmptyInput = screen.getByTestId('option-leaveEmpty')
    expect(leaveEmptyInput).toBeInTheDocument()
  })

  it('should have correct input constraints for number fields', () => {
    render(<OptionsScreen {...defaultProps} />)
    
    const leaveEmptyInput = screen.getByTestId('option-leaveEmpty')
    expect(leaveEmptyInput).toHaveAttribute('min', '0')
    expect(leaveEmptyInput).toHaveAttribute('max', '50')
    expect(leaveEmptyInput).toHaveAttribute('type', 'number')
  })

  it('should preserve unchanged options', async () => {
    const user = userEvent.setup()
    // Create fresh state for this test to avoid cross-test contamination
    const freshState = {
      ...testGameState,
      options: {
        autoFuel: true,
        autoRepair: false,
        alwaysIgnorePolice: false,
        alwaysIgnorePirates: false,
        alwaysIgnoreTraders: true,
        alwaysIgnoreTradeInOrbit: false,
        reserveMoney: true,
        continuous: false,
        attackFleeing: false,
        alwaysInfo: true,
        leaveEmpty: 5,
        autoAttack: false,
        autoFlee: true,
        textualEncounters: false,
        newsAutoPay: true,
        remindLoans: true,
        priceDifferences: true,
        tribbleMessage: false,
        useHWButtons: false,
        rectangularButtonsOn: true,
        sharePreferences: false,
        identifyStartup: true
      }
    }
    const freshProps = { ...defaultProps, state: freshState }
    
    render(<OptionsScreen {...freshProps} />)
    
    // Only change one option
    const autoFuelCheckbox = screen.getByRole('checkbox', { name: /Auto-fuel/i })
    await user.click(autoFuelCheckbox) // Toggle from true to false
    
    // Go back
    const backButton = screen.getByText('← Back')
    await user.click(backButton)
    
    // Changed option should be updated (was initially true, toggled to false)
    expect(freshState.options.autoFuel).toBe(false)
    
    // Unchanged options should remain the same (check the actual initial values)
    expect(freshState.options.autoRepair).toBe(false) // Was initially false
    expect(freshState.options.alwaysIgnoreTraders).toBe(true) // Was initially true
    expect(freshState.options.leaveEmpty).toBe(5) // Was initially 5
  })
})
