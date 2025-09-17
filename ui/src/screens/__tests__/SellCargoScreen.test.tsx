import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { SellCargoScreen } from '../SellCargoScreen'
import { createInitialState } from '@game-state'
import { getAvailableActions } from '@game-engine'
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

// Set up a realistic test scenario with cargo to sell
testGameState.currentMode = 0 // OnPlanet
testGameState.credits = 2000
testGameState.ship.cargo = [3, 8, 5, 2, 0, 0, 0, 4, 0, 0] // Water: 3, Furs: 8, Food: 5, Ore: 2, Machinery: 4
testGameState.currentSystem = 0

// Set up the current system with trade goods available for purchase (affects sell prices)
testGameState.solarSystem[0].qty = [5, 2, 8, 10, 0, 0, 0, 6, 0, 0] // Some availability for price calculation
testGameState.solarSystem[0].techLevel = 5
testGameState.solarSystem[0].politicalSystem = 3 // Corporate (for predictable pricing)
testGameState.solarSystem[0].size = 2
testGameState.solarSystem[0].specialResources = 0

// Get real available actions
const testAvailableActions = getAvailableActions(testGameState)

const mockExecuteAction = vi.fn()

describe('SellCargoScreen', () => {
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

  it('should render the sell cargo screen with real game state', () => {
    render(<SellCargoScreen {...defaultProps} />)
    
    expect(screen.getByTestId('cargo-status')).toBeInTheDocument()
    
    // Should show actual cargo space calculation (15 cargo bays for Gnat ship)
    const cargoStatus = screen.getByTestId('cargo-status')
    expect(cargoStatus).toHaveTextContent('Cargo: 22/15') // 3+8+5+2+4 = 22 (overpacked scenario)
  })

  it('should display cargo items with real quantities owned', () => {
    render(<SellCargoScreen {...defaultProps} />)
    
    // Check that trade items are displayed with real names
    expect(screen.getByText('Water')).toBeInTheDocument()
    expect(screen.getByText('Furs')).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Ore')).toBeInTheDocument()
    expect(screen.getByText('Machinery')).toBeInTheDocument()
    
    // Check that real owned quantities are shown
    const waterButton = screen.getByTestId('trade-item-water')
    expect(waterButton).toHaveTextContent('Own: 3')
    
    const fursButton = screen.getByTestId('trade-item-furs')
    expect(fursButton).toHaveTextContent('Own: 8')
    
    const foodButton = screen.getByTestId('trade-item-food')
    expect(foodButton).toHaveTextContent('Own: 5')
    
    const oreButton = screen.getByTestId('trade-item-ore')
    expect(oreButton).toHaveTextContent('Own: 2')
    
    const machineryButton = screen.getByTestId('trade-item-machinery')
    expect(machineryButton).toHaveTextContent('Own: 4')
  })

  it('should show items with zero quantity but disable them for selling', () => {
    render(<SellCargoScreen {...defaultProps} />)
    
    // Games has 0 quantity, should be shown but disabled
    const gamesButton = screen.getByTestId('trade-item-games')
    expect(gamesButton).toHaveTextContent('Own: 0')
    expect(gamesButton).toHaveClass('cursor-not-allowed')
    expect(gamesButton).toHaveClass('opacity-50')
    
    // But items with cargo should be clickable
    const fursButton = screen.getByTestId('trade-item-furs')
    expect(fursButton).not.toHaveClass('cursor-not-allowed')
  })

  it('should allow selecting cargo items that can be sold', async () => {
    const user = userEvent.setup()
    render(<SellCargoScreen {...defaultProps} />)
    
    // Select Furs (which has 8 owned)
    const fursButton = screen.getByTestId('trade-item-furs')
    await user.click(fursButton)
    
    // Sell controls should appear
    expect(screen.getByTestId('sell-button')).toBeInTheDocument()
    expect(screen.getByText('Sell 1 units')).toBeInTheDocument()
  })

  it('should show real sell prices for cargo items', () => {
    render(<SellCargoScreen {...defaultProps} />)
    
    // All items should show some price (real pricing calculations)
    const waterButton = screen.getByTestId('trade-item-water')
    expect(waterButton).toHaveTextContent(/\d+cr/) // Should show some credit amount
    
    const fursButton = screen.getByTestId('trade-item-furs')
    expect(fursButton).toHaveTextContent(/\d+cr/)
  })

  it('should handle quantity changes with real limits', async () => {
    const user = userEvent.setup()
    render(<SellCargoScreen {...defaultProps} />)
    
    // Select Food (which has 5 owned)
    const foodButton = screen.getByTestId('trade-item-food')
    await user.click(foodButton)
    
    // Increase quantity
    const plusButton = screen.getByRole('button', { name: '+' })
    await user.click(plusButton)
    
    expect(screen.getByText('Sell 2 units')).toBeInTheDocument()
    
    // Try "All" button - should set to maximum owned (5)
    const allButton = screen.getByRole('button', { name: 'All' })
    await user.click(allButton)
    
    expect(screen.getByText('Sell 5 units')).toBeInTheDocument()
  })

  it('should prevent selling more than owned', async () => {
    const user = userEvent.setup()
    render(<SellCargoScreen {...defaultProps} />)
    
    // Select Ore (which has 2 owned)
    const oreButton = screen.getByTestId('trade-item-ore')
    await user.click(oreButton)
    
    // Set to max (2)
    const allButton = screen.getByRole('button', { name: 'All' })
    await user.click(allButton)
    
    // Plus button should be disabled when at max
    const plusButton = screen.getByRole('button', { name: '+' })
    expect(plusButton).toBeDisabled()
    
    expect(screen.getByText('Sell 2 units')).toBeInTheDocument()
  })

  it('should show revenue calculation for selected items', async () => {
    const user = userEvent.setup()
    render(<SellCargoScreen {...defaultProps} />)
    
    // Select Water
    const waterButton = screen.getByTestId('trade-item-water')
    await user.click(waterButton)
    
    // Should show revenue calculation
    expect(screen.getByText(/Revenue:/)).toBeInTheDocument()
    expect(screen.getByText(/Max: 3/)).toBeInTheDocument() // Max 3 because we own 3
  })

  it('should call executeAction with correct sell parameters', async () => {
    const user = userEvent.setup()
    mockExecuteAction.mockResolvedValue({ 
      success: true,
      economyResult: {
        quantitySold: 2,
        totalRevenue: 500
      }
    })
    
    render(<SellCargoScreen {...defaultProps} />)
    
    // Select Machinery and sell 2 units
    const machineryButton = screen.getByTestId('trade-item-machinery')
    await user.click(machineryButton)
    
    const plusButton = screen.getByRole('button', { name: '+' })
    await user.click(plusButton)
    
    const sellButton = screen.getByTestId('sell-button')
    await user.click(sellButton)
    
    await waitFor(() => {
      expect(mockExecuteAction).toHaveBeenCalledWith({
        type: 'sell_cargo',
        parameters: {
          tradeItem: 7, // Machinery is index 7
          quantity: 2
        }
      })
    })
  })

  it('should handle successful sale with real results', async () => {
    const user = userEvent.setup()
    mockExecuteAction.mockResolvedValue({ 
      success: true,
      economyResult: {
        quantitySold: 3,
        totalRevenue: 850
      }
    })
    
    render(<SellCargoScreen {...defaultProps} />)
    
    // Select and sell 3 Water
    const waterButton = screen.getByTestId('trade-item-water')
    await user.click(waterButton)
    
    const allButton = screen.getByRole('button', { name: 'All' })
    await user.click(allButton)
    
    const sellButton = screen.getByTestId('sell-button')
    await user.click(sellButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Successfully sold 3 units of Water for 850 credits/)).toBeInTheDocument()
    })
  })

  it('should handle sale failure', async () => {
    const user = userEvent.setup()
    mockExecuteAction.mockResolvedValue({ 
      success: false,
      message: 'Insufficient cargo space'
    })
    
    render(<SellCargoScreen {...defaultProps} />)
    
    // Select and try to sell Food
    const foodButton = screen.getByTestId('trade-item-food')
    await user.click(foodButton)
    
    const sellButton = screen.getByTestId('sell-button')
    await user.click(sellButton)
    
    await waitFor(() => {
      expect(screen.getByText('Insufficient cargo space')).toBeInTheDocument()
    })
  })

  it('should display proper message when undocked', () => {
    // Create a state where we're in orbit (no trading available)
    const undockedState = { 
      ...testGameState, 
      currentMode: 2 // InOrbit 
    }
    const undockedAvailableActions = getAvailableActions(undockedState)
    
    const undockedProps = {
      ...defaultProps,
      state: undockedState,
      availableActions: undockedAvailableActions
    }
    
    render(<SellCargoScreen {...undockedProps} />)
    
    // Should show no buyers message when not docked
    expect(screen.getByText('No buyers interested in your cargo at this system.')).toBeInTheDocument()
  })

  it('should show no buyers message when trading not available', async () => {
    // Create a state where sell_cargo is not available
    const noTradingState = { 
      ...testGameState, 
      currentMode: 1 // InSpace - no trading available
    }
    const noTradingActions = getAvailableActions(noTradingState)
    
    const noTradingProps = {
      ...defaultProps,
      state: noTradingState,
      availableActions: noTradingActions
    }
    
    render(<SellCargoScreen {...noTradingProps} />)
    
    // Should show "no buyers" message when trading not available
    expect(screen.getByText('No buyers interested in your cargo at this system.')).toBeInTheDocument()
    
    // Items should not be rendered as buttons since trading is not available
    expect(screen.queryByTestId('trade-item-furs')).not.toBeInTheDocument()
  })

  it('should clear selection when all units are sold', async () => {
    const user = userEvent.setup()
    mockExecuteAction.mockResolvedValue({ 
      success: true,
      economyResult: {
        quantitySold: 2,  // Selling all 2 units of Ore
        totalRevenue: 400
      }
    })
    
    render(<SellCargoScreen {...defaultProps} />)
    
    // Select Ore (which has 2 owned) and sell all
    const oreButton = screen.getByTestId('trade-item-ore')
    await user.click(oreButton)
    
    const allButton = screen.getByRole('button', { name: 'All' })
    await user.click(allButton)
    
    const sellButton = screen.getByTestId('sell-button')
    await user.click(sellButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Successfully sold 2 units of Ore for 400 credits/)).toBeInTheDocument()
    })
    
    // Selection should be cleared since all units were sold
    await waitFor(() => {
      expect(screen.queryByTestId('sell-button')).not.toBeInTheDocument()
    })
  })
})
