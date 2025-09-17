import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ShipyardScreen } from '../ShipyardScreen'
import { createInitialState } from '@game-state'
import { getAvailableActions } from '@game-engine'
import { GameMode } from '@game-types'
import type { GameState, Action, GameAction } from '@game-types'

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

// Set up realistic test scenarios
testGameState.currentMode = GameMode.OnPlanet
testGameState.credits = 10000
testGameState.ship.hull = 50 // Damaged hull (Gnat has 100 hull)
testGameState.ship.fuel = 10 // Partially fueled (Gnat has 14 fuel tanks)
testGameState.ship.escapePod = false // No escape pod installed

// Get real available actions
const testAvailableActions = getAvailableActions(testGameState)

const mockExecuteAction = vi.fn()

describe('ShipyardScreen', () => {
  const defaultProps = {
    onNavigate: vi.fn(),
    onBack: vi.fn(),
    state: testGameState,
    onAction: mockExecuteAction,
    availableActions: testAvailableActions
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all shipyard services', () => {
    render(<ShipyardScreen {...defaultProps} />)
    
    expect(screen.getByText('Refuel Ship')).toBeInTheDocument()
    expect(screen.getByText('Repair Ship')).toBeInTheDocument()
    expect(screen.getByText('Escape Pod')).toBeInTheDocument()
    expect(screen.getByText('Ship Trading')).toBeInTheDocument()
  })

  it('should show fuel status correctly with real game state', () => {
    render(<ShipyardScreen {...defaultProps} />)
    
    // Should show fuel is not full and cost to refuel
    expect(screen.getByText(/Fill tanks for/)).toBeInTheDocument()
    
    // The refuel button should be enabled
    const refuelButton = screen.getByRole('button', { name: /Refuel/i })
    expect(refuelButton).not.toBeDisabled()
  })

  it('should show repair status correctly with damaged hull', () => {
    render(<ShipyardScreen {...defaultProps} />)
    
    // Should show repair is needed
    expect(screen.getByText('Repair hull damage')).toBeInTheDocument()
    
    // The repair button should be enabled
    const repairButton = screen.getByRole('button', { name: /Repair/i })
    expect(repairButton).not.toBeDisabled()
  })

  it('should show escape pod as available for purchase', () => {
    render(<ShipyardScreen {...defaultProps} />)
    
    // Should show escape pod can be bought
    expect(screen.getByText('Buy escape pod for 2,000 cr.')).toBeInTheDocument()
    
    // The buy button should be enabled if credits are sufficient
    const escapePodButton = screen.getByTestId('escape-pod-button')
    expect(escapePodButton).not.toBeDisabled()
  })

  it('should handle refuel action correctly', async () => {
    const user = userEvent.setup()
    mockExecuteAction.mockResolvedValue({ success: true, message: 'Ship refueled successfully' })
    
    render(<ShipyardScreen {...defaultProps} />)
    
    const refuelButton = screen.getByTestId('refuel-button')
    await user.click(refuelButton)
    
    await waitFor(() => {
      expect(mockExecuteAction).toHaveBeenCalledWith({
        type: 'refuel_ship',
        parameters: {}
      })
    })
  })

  it('should handle repair action correctly', async () => {
    const user = userEvent.setup()
    mockExecuteAction.mockResolvedValue({ success: true, message: 'Ship repaired successfully' })
    
    render(<ShipyardScreen {...defaultProps} />)
    
    const repairButton = screen.getByTestId('repair-button')
    await user.click(repairButton)
    
    await waitFor(() => {
      expect(mockExecuteAction).toHaveBeenCalledWith({
        type: 'repair_ship',
        parameters: {}
      })
    })
  })

  it('should handle escape pod purchase correctly', async () => {
    const user = userEvent.setup()
    mockExecuteAction.mockResolvedValue({ success: true, message: 'Escape pod installed' })
    
    render(<ShipyardScreen {...defaultProps} />)
    
    const escapePodButton = screen.getByTestId('escape-pod-button')
    await user.click(escapePodButton)
    
    await waitFor(() => {
      expect(mockExecuteAction).toHaveBeenCalledWith({
        type: 'buy_escape_pod',
        parameters: {}
      })
    })
  })

  it('should navigate to ship purchase screen', async () => {
    const user = userEvent.setup()
    const mockOnNavigate = vi.fn()
    
    render(<ShipyardScreen {...defaultProps} onNavigate={mockOnNavigate} />)
    
    const buyShipsButton = screen.getByTestId('buy-ships-button')
    await user.click(buyShipsButton)
    
    expect(mockOnNavigate).toHaveBeenCalledWith('ship-purchase')
  })

  it('should show success message after successful action', async () => {
    const user = userEvent.setup()
    mockExecuteAction.mockResolvedValue({ success: true, message: 'Operation successful' })
    
    render(<ShipyardScreen {...defaultProps} />)
    
    const refuelButton = screen.getByTestId('refuel-button')
    await user.click(refuelButton)
    
    await waitFor(() => {
      expect(screen.getByText('Operation successful')).toBeInTheDocument()
    })
  })

  it('should show error message after failed action', async () => {
    const user = userEvent.setup()
    mockExecuteAction.mockResolvedValue({ success: false, message: 'Not enough credits' })
    
    render(<ShipyardScreen {...defaultProps} />)
    
    const refuelButton = screen.getByTestId('refuel-button')
    await user.click(refuelButton)
    
    await waitFor(() => {
      expect(screen.getByText('Not enough credits')).toBeInTheDocument()
    })
  })

  it('should disable services when not available', () => {
    // Create a scenario where services are not available (e.g., not docked)
    const stateNotDocked = createInitialState()
    stateNotDocked.currentMode = GameMode.InSpace
    const actionsNotDocked = getAvailableActions(stateNotDocked)
    
    render(<ShipyardScreen 
      {...defaultProps} 
      state={stateNotDocked}
      availableActions={actionsNotDocked}
    />)
    
    // All service buttons should be disabled when not docked
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      if (button.textContent?.includes('Refuel') || 
          button.textContent?.includes('Repair') ||
          button.textContent?.includes('Buy')) {
        expect(button).toBeDisabled()
      }
    })
  })

  it('should show correct status when ship is fully fueled', () => {
    const fullyFueledState = createInitialState()
    fullyFueledState.currentMode = GameMode.OnPlanet
    fullyFueledState.ship.fuel = 14 // Gnat has 14 fuel tanks
    
    render(<ShipyardScreen 
      {...defaultProps} 
      state={fullyFueledState}
      availableActions={getAvailableActions(fullyFueledState)}
    />)
    
    expect(screen.getByText('Fuel tanks are full')).toBeInTheDocument()
    
    const refuelButton = screen.getByTestId('refuel-button')
    expect(refuelButton).toBeDisabled()
  })

  it('should show correct status when ship is fully repaired', () => {
    const fullyRepairedState = createInitialState()
    fullyRepairedState.currentMode = GameMode.OnPlanet
    fullyRepairedState.ship.hull = 100 // Gnat has 100 hull strength
    
    render(<ShipyardScreen 
      {...defaultProps} 
      state={fullyRepairedState}
      availableActions={getAvailableActions(fullyRepairedState)}
    />)
    
    expect(screen.getByText('Ship is fully repaired')).toBeInTheDocument()
    
    const repairButton = screen.getByTestId('repair-button')
    expect(repairButton).toBeDisabled()
  })

  it('should show correct status when escape pod is already installed', () => {
    const podInstalledState = createInitialState()
    podInstalledState.currentMode = GameMode.OnPlanet
    podInstalledState.ship.escapePod = true
    
    render(<ShipyardScreen 
      {...defaultProps} 
      state={podInstalledState}
      availableActions={getAvailableActions(podInstalledState)}
    />)
    
    expect(screen.getByText('Escape pod installed')).toBeInTheDocument()
    
    const escapePodButton = screen.getByTestId('escape-pod-button')
    expect(escapePodButton).toBeDisabled()
  })
})
