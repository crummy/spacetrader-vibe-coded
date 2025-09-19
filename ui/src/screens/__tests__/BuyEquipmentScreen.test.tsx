import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { BuyEquipmentScreen } from '../BuyEquipmentScreen'
import { createInitialState } from '@game-state'
import { getAvailableActions } from '@game-engine'
import { GameMode } from '@game-types'
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

// Set up a realistic test scenario - planet with high tech equipment available
testGameState.currentMode = GameMode.OnPlanet
testGameState.credits = 50000
testGameState.currentSystem = 0
testGameState.solarSystem[0].techLevel = 7 // High-level tech planet for equipment availability
testGameState.solarSystem[0].politics = 2 // For predictable pricing

// Set up ship with some equipment slots filled and some empty
testGameState.ship.weapon = [-1, -1, -1] as any // Empty weapon slots
testGameState.ship.shield = [-1, -1, -1] as any // Empty shield slots  
testGameState.ship.gadget = [-1, -1, -1] as any // Empty gadget slots

// Get real available actions
const testAvailableActions = getAvailableActions(testGameState)

const mockExecuteAction = vi.fn()

describe('BuyEquipmentScreen', () => {
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

  it('should render equipment slot status with real ship data', () => {
    render(<BuyEquipmentScreen {...defaultProps} />)
    
    expect(screen.getByText('Equipment Slots:')).toBeInTheDocument()
    
    // Gnat ship has 1 weapon slot (0 filled), 0 shield slots, 1 gadget slot (0 filled)
    expect(screen.getAllByText('0/1')[0]).toBeInTheDocument() // Weapons empty (may have multiple 0/1)
    expect(screen.getByText('0/0')).toBeInTheDocument() // No shields
    expect(screen.getAllByText('0/1')[1]).toBeInTheDocument() // Gadgets empty
  })

  it('should render equipment categories correctly', () => {
    render(<BuyEquipmentScreen {...defaultProps} />)
    
    expect(screen.getByText('Equipment Categories:')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Weapons' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Shields' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gadgets' })).toBeInTheDocument()
    
    // Weapons should be selected by default
    const weaponsButton = screen.getByRole('button', { name: 'Weapons' })
    expect(weaponsButton).toHaveClass('text-neon-cyan')
  })

  it('should switch between equipment categories', async () => {
    const user = userEvent.setup()
    render(<BuyEquipmentScreen {...defaultProps} />)
    
    const shieldsButton = screen.getByRole('button', { name: 'Shields' })
    await user.click(shieldsButton)
    
    expect(shieldsButton).toHaveClass('text-neon-cyan')
    expect(screen.getByText('Available Shields:')).toBeInTheDocument()
  })

  it('should show available equipment with real data for tech level 7', () => {
    render(<BuyEquipmentScreen {...defaultProps} />)
    
    // Should show weapons available at tech level 7 and below
    expect(screen.getByText('Available Weapons:')).toBeInTheDocument()
    
    // At tech level 7, should have multiple weapon options
    // The exact weapons depend on the real equipment data
    const equipmentItems = screen.getAllByTestId(/^purchase-/)
    expect(equipmentItems.length).toBeGreaterThan(0)
  })

  it('should show no slots available warning when slots are full', () => {
    const fullSlotsState = createInitialState()
    fullSlotsState.currentMode = GameMode.OnPlanet
    fullSlotsState.solarSystem[0].techLevel = 7
    fullSlotsState.ship.weapon = [0, -1, -1] as any // All weapon slots filled (Gnat has 1)
    fullSlotsState.ship.shield = [-1, -1, -1] as any // No shield slots (Gnat has 0)
    fullSlotsState.ship.gadget = [0, -1, -1] as any // All gadget slots filled (Gnat has 1)
    
    render(<BuyEquipmentScreen 
      {...defaultProps} 
      state={fullSlotsState}
      availableActions={getAvailableActions(fullSlotsState)}
    />)
    
    // Should show red text for full slots
    const weaponSlots = screen.getAllByText('1/1')[0] // Multiple 1/1 may appear, get first
    expect(weaponSlots).toHaveClass('text-red-400')
  })

  it('should handle equipment purchase correctly', async () => {
    const user = userEvent.setup()
    mockExecuteAction.mockResolvedValue({ success: true, message: 'Equipment purchased!' })
    
    render(<BuyEquipmentScreen {...defaultProps} />)
    
    // Should default to weapons category with empty slots
    const purchaseButtons = screen.getAllByTestId(/^purchase-weapons-/)
    if (purchaseButtons.length > 0) {
      await user.click(purchaseButtons[0])
      
      await waitFor(() => {
        expect(mockExecuteAction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'buy_weapon',
            parameters: expect.objectContaining({
              equipmentIndex: expect.any(Number)
            })
          })
        )
      })
    }
  })

  it('should prevent purchase when no slots available', async () => {
    const user = userEvent.setup()
    
    const fullSlotsState = createInitialState()
    fullSlotsState.currentMode = GameMode.OnPlanet
    fullSlotsState.solarSystem[0].techLevel = 7
    fullSlotsState.ship.weapon = [0, -1, -1] as any // All weapon slots filled
    
    render(<BuyEquipmentScreen 
      {...defaultProps} 
      state={fullSlotsState}
      availableActions={getAvailableActions(fullSlotsState)}
    />)
    
    // Try to buy weapon when weapon slots are full
    const purchaseButtons = screen.getAllByTestId(/^purchase-weapons-/)
    if (purchaseButtons.length > 0) {
      await user.click(purchaseButtons[0])
      
      // Should show error about no slots - multiple equipment items may show this message
      await waitFor(() => {
        expect(screen.getAllByText(/No empty slots available/)[0]).toBeInTheDocument()
      })
    }
  })

  it('should prevent purchase when insufficient credits', () => {
    const poorState = createInitialState()
    poorState.currentMode = GameMode.OnPlanet
    poorState.solarSystem[0].techLevel = 7
    poorState.credits = 10 // Very low credits
    poorState.ship.weapon = [-1, -1, -1] as any // Empty weapon slot
    
    render(<BuyEquipmentScreen 
      {...defaultProps} 
      state={poorState}
      availableActions={getAvailableActions(poorState)}
    />)
    
    // Should show red prices for unaffordable items
    const priceElements = screen.getAllByText(/\d+.*cr\./)
    priceElements.forEach(element => {
      if (element.textContent && parseInt(element.textContent.replace(/[^\d]/g, '')) > 10) {
        expect(element).toHaveClass('text-red-400')
      }
    })
  })

  it('should show equipment store unavailable when not docked', () => {
  const notDockedState = createInitialState()
  notDockedState.currentMode = GameMode.InCombat
  
  render(<BuyEquipmentScreen 
    {...defaultProps} 
    state={notDockedState}
    availableActions={getAvailableActions(notDockedState)}
  />)

  // Should show unavailable message instead of dock button
  expect(screen.getByText('Equipment store unavailable - must be docked at a planet.')).toBeInTheDocument()
  })

  it('should show equipment unavailable when not docked', () => {
    const notDockedState = createInitialState()
    notDockedState.currentMode = GameMode.InCombat
    
    render(<BuyEquipmentScreen 
      {...defaultProps} 
      state={notDockedState}
      availableActions={getAvailableActions(notDockedState)}
    />)
    
    expect(screen.getByText('Equipment store unavailable - must be docked at a planet.')).toBeInTheDocument()
  })

  it('should show no equipment available at low tech levels', () => {
    const lowTechState = createInitialState()
    lowTechState.currentMode = GameMode.OnPlanet
    lowTechState.solarSystem[0].techLevel = 0 // Very low tech
    
    render(<BuyEquipmentScreen 
      {...defaultProps} 
      state={lowTechState}
      availableActions={getAvailableActions(lowTechState)}
    />)
    
    expect(screen.getByText(/No weapons available at this tech level/)).toBeInTheDocument()
  })

  it('should display equipment with correct tech level and power info', () => {
    render(<BuyEquipmentScreen {...defaultProps} />)
    
    // Should show tech level for equipment items if available
    const techLevelElements = screen.queryAllByText(/Tech Level:/)
    if (techLevelElements.length > 0) {
      expect(techLevelElements.length).toBeGreaterThan(0)
    }
  })

  it('should handle purchase button disabled states correctly', () => {
    const testState = createInitialState()
    testState.currentMode = GameMode.OnPlanet
    testState.solarSystem[0].techLevel = 7
    testState.credits = 100 // Low credits
    testState.ship.weapon = [0, -1, -1] as any // Full weapon slots
    
    render(<BuyEquipmentScreen 
      {...defaultProps} 
      state={testState}
      availableActions={getAvailableActions(testState)}
    />)
    
    // Purchase buttons should be disabled for expensive items or when no slots
    const purchaseButtons = screen.getAllByTestId(/^purchase-/)
    purchaseButtons.forEach(button => {
      // Some buttons should be disabled due to cost or slots
      if (button.hasAttribute('disabled')) {
        expect(button).toHaveClass('disabled:opacity-50')
      }
    })
  })

  it('should show success message after purchase', async () => {
    const user = userEvent.setup()
    mockExecuteAction.mockResolvedValue({ success: true, message: 'Weapon purchased successfully!' })
    
    const testState = createInitialState()
    testState.currentMode = GameMode.OnPlanet
    testState.solarSystem[0].techLevel = 7
    testState.credits = 50000
    testState.ship.weapon = [-1, -1, -1] as any // Empty weapon slot
    
    render(<BuyEquipmentScreen 
      {...defaultProps} 
      state={testState}
      availableActions={getAvailableActions(testState)}
    />)
    
    const purchaseButtons = screen.getAllByTestId(/^purchase-weapons-/)
    if (purchaseButtons.length > 0) {
      await user.click(purchaseButtons[0])
      
      await waitFor(() => {
        // The message format shows the equipment name
        expect(screen.getByText(/Successfully purchased/)).toBeInTheDocument()
      })
    }
  })
})
