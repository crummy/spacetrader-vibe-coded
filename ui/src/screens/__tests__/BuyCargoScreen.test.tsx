import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { BuyCargoScreen } from '../BuyCargoScreen'
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

// Set up a realistic test scenario
testGameState.currentMode = 0 // OnPlanet
testGameState.credits = 5000
testGameState.ship.cargo = [0, 5, 2, 0, 0, 0, 0, 0, 0, 0] // 5 Furs, 2 Food
testGameState.currentSystem = 0

// Set up the current system with some trade goods available
testGameState.solarSystem[0].qty = [0, 8, 0, 15, 4, 0, 0, 12, 0, 0] // Furs: 8, Ore: 15, Games: 4, Machinery: 12
testGameState.solarSystem[0].techLevel = 4
testGameState.solarSystem[0].politicalSystem = 2 // Communist (for predictable pricing)
testGameState.solarSystem[0].size = 2
testGameState.solarSystem[0].specialResources = 0

// Get real available actions
const testAvailableActions = getAvailableActions(testGameState)

const mockExecuteAction = vi.fn()

describe('BuyCargoScreen', () => {
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

  it('should render the buy cargo screen with real game state', () => {
    render(<BuyCargoScreen {...defaultProps} />)
    
    expect(screen.getByTestId('cargo-status')).toBeInTheDocument()
    
    // Should show actual cargo space calculation (15 cargo bays for Gnat ship)
    const cargoStatus = screen.getByTestId('cargo-status')
    expect(cargoStatus).toHaveTextContent('Cargo: 7/15') // 5 Furs + 2 Food = 7
    expect(cargoStatus).toHaveTextContent('Available: 8') // 15 - 7 = 8
  })

  it('should display trade goods with real prices', () => {
    render(<BuyCargoScreen {...defaultProps} />)
    
    // Check that trade items are displayed with real names
    expect(screen.getByText('Water')).toBeInTheDocument()
    expect(screen.getByText('Furs')).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Ore')).toBeInTheDocument()
    expect(screen.getByText('Games')).toBeInTheDocument()
    
    // Check that real quantities are shown - use more flexible text matching
    const fursButton = screen.getByTestId('trade-item-furs')
    expect(fursButton).toHaveTextContent('Avail: 8')
    
    const oreButton = screen.getByTestId('trade-item-ore')
    expect(oreButton).toHaveTextContent('Avail: 15')
    
    const gamesButton = screen.getByTestId('trade-item-games')
    expect(gamesButton).toHaveTextContent('Avail: 4')
    
    const machineryButton = screen.getByTestId('trade-item-machinery')
    expect(machineryButton).toHaveTextContent('Avail: 12')
  })

  it('should show current cargo holdings', () => {
    render(<BuyCargoScreen {...defaultProps} />)
    
    // Check that it shows player already owns 5 Furs and 2 Food
    const fursButton = screen.getByTestId('trade-item-furs')
    expect(fursButton).toHaveTextContent('Own: 5')
    
    const foodButton = screen.getByTestId('trade-item-food')
    expect(foodButton).toHaveTextContent('Own: 2')
  })

  it('should allow selecting available trade goods', async () => {
    const user = userEvent.setup()
    render(<BuyCargoScreen {...defaultProps} />)
    
    // Select Furs (which has 8 available)
    const fursButton = screen.getByTestId('trade-item-furs')
    await user.click(fursButton)
    
    // Purchase controls should appear
    expect(screen.getByTestId('buy-button')).toBeInTheDocument()
    expect(screen.getByText('Buy 1 units')).toBeInTheDocument()
  })

  it('should disable unavailable items', () => {
    render(<BuyCargoScreen {...defaultProps} />)
    
    // Water has 0 quantity, should be disabled
    const waterButton = screen.getByTestId('trade-item-water')
    expect(waterButton).toHaveClass('cursor-not-allowed')
    expect(waterButton).toHaveClass('opacity-50')
    
    // But Furs has 8 quantity, should be clickable
    const fursButton = screen.getByTestId('trade-item-furs')
    expect(fursButton).not.toHaveClass('cursor-not-allowed')
  })

  it('should calculate max affordable quantity correctly', async () => {
    const user = userEvent.setup()
    render(<BuyCargoScreen {...defaultProps} />)
    
    // Select an expensive item to test credit limits
    const oreButton = screen.getByTestId('trade-item-ore')
    await user.click(oreButton)
    
    // Should show max quantity based on credits, cargo space, and availability
    expect(screen.getByText(/Max:/)).toBeInTheDocument()
  })

  it('should handle quantity changes with real limits', async () => {
    const user = userEvent.setup()
    render(<BuyCargoScreen {...defaultProps} />)
    
    // Select Furs
    const fursButton = screen.getByTestId('trade-item-furs')
    await user.click(fursButton)
    
    // Increase quantity
    const plusButton = screen.getByRole('button', { name: '+' })
    await user.click(plusButton)
    
    expect(screen.getByText('Buy 2 units')).toBeInTheDocument()
    
    // Try max button - should be limited by cargo space (8 available) vs available quantity (8) vs credits
    const maxButton = screen.getByRole('button', { name: 'Max' })
    await user.click(maxButton)
    
    // The max is limited by the lower of: cargo space (8), available quantity (8), or affordable by credits
    // At 5000 credits and ~311cr per Furs, we can afford about 16, so limited by cargo space (8)
    expect(screen.getByText('Buy 8 units')).toBeInTheDocument()
  })

  it('should call executeAction with correct parameters', async () => {
    const user = userEvent.setup()
    mockExecuteAction.mockResolvedValue({ success: true })
    
    render(<BuyCargoScreen {...defaultProps} />)
    
    // Select Ore and buy 2 units
    const oreButton = screen.getByTestId('trade-item-ore')
    await user.click(oreButton)
    
    const plusButton = screen.getByRole('button', { name: '+' })
    await user.click(plusButton)
    
    const buyButton = screen.getByTestId('buy-button')
    await user.click(buyButton)
    
    await waitFor(() => {
      expect(mockExecuteAction).toHaveBeenCalledWith({
        type: 'buy_cargo',
        parameters: {
          tradeItem: 3, // Ore is index 3
          quantity: 2
        }
      })
    })
  })
})
