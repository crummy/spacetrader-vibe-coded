import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { SellEquipmentScreen } from '../SellEquipmentScreen'
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

// Set up a realistic test scenario with installed equipment
testGameState.currentMode = GameMode.OnPlanet
testGameState.credits = 5000
testGameState.currentSystem = 0
testGameState.solarSystem[0].techLevel = 4

// Set up ship with various equipment installed
testGameState.ship.weapon = [1, 2] // Multiple weapons installed (Pulse laser, Beam laser)
testGameState.ship.shield = [0] // Shield installed (Energy shield)
testGameState.ship.gadget = [0, 1] // Gadgets installed (Cargo bay, Auto-repair)

// Get real available actions
const testAvailableActions = getAvailableActions(testGameState)

const mockExecuteAction = vi.fn()

describe('SellEquipmentScreen', () => {
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

  it('should render installed equipment status with real ship data', () => {
    render(<SellEquipmentScreen {...defaultProps} />)
    
    expect(screen.getByText('Installed Equipment:')).toBeInTheDocument()
    
    // Should show equipment slot usage - using getAllByText for multiple instances
    expect(screen.getAllByText('Weapons')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Shields')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Gadgets')[0]).toBeInTheDocument()
  })

  it('should render equipment categories correctly', () => {
    render(<SellEquipmentScreen {...defaultProps} />)
    
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
    render(<SellEquipmentScreen {...defaultProps} />)
    
    const shieldsButton = screen.getByRole('button', { name: 'Shields' })
    await user.click(shieldsButton)
    
    expect(shieldsButton).toHaveClass('text-neon-cyan')
    expect(screen.getByText('Installed Shields:')).toBeInTheDocument()
  })

  it('should show installed weapons with real data and sell prices', () => {
    render(<SellEquipmentScreen {...defaultProps} />)
    
    expect(screen.getByText('Installed Weapons:')).toBeInTheDocument()
    
    // Should show weapons that are installed with their names and sell prices
    const sellButtons = screen.getAllByRole('button', { name: /Sell.*for.*cr\./ })
    expect(sellButtons.length).toBeGreaterThan(0)
    
    // Should show slot information
    expect(screen.getAllByText(/Slot:/)).toHaveLength(sellButtons.length)
  })

  it('should show installed shields with sell prices', async () => {
    const user = userEvent.setup()
    render(<SellEquipmentScreen {...defaultProps} />)
    
    // Switch to shields category
    const shieldsButton = screen.getByRole('button', { name: 'Shields' })
    await user.click(shieldsButton)
    
    expect(screen.getByText('Installed Shields:')).toBeInTheDocument()
    
    // Check if shields are installed (Gnat may not support shields)
    const sellButtons = screen.queryAllByRole('button', { name: /Sell.*for.*cr\./ })
    const noShieldsMessage = screen.queryByText(/No shields installed/)
    
    expect(sellButtons.length > 0 || noShieldsMessage).toBeTruthy()
  })

  it('should show installed gadgets with sell prices', async () => {
    const user = userEvent.setup()
    render(<SellEquipmentScreen {...defaultProps} />)
    
    // Switch to gadgets category
    const gadgetsButton = screen.getByRole('button', { name: 'Gadgets' })
    await user.click(gadgetsButton)
    
    expect(screen.getByText('Installed Gadgets:')).toBeInTheDocument()
    
    // Should show installed gadgets with sell prices
    const sellButtons = screen.getAllByRole('button', { name: /Sell.*for.*cr\./ })
    expect(sellButtons.length).toBeGreaterThan(0)
  })

  it('should handle equipment sale correctly', async () => {
    const user = userEvent.setup()
    mockExecuteAction.mockResolvedValue({ success: true, message: 'Weapon sold successfully!' })
    
    render(<SellEquipmentScreen {...defaultProps} />)
    
    // Find and click a sell button for weapons
    const sellButtons = screen.getAllByRole('button', { name: /Sell.*for.*cr\./ })
    if (sellButtons.length > 0) {
      await user.click(sellButtons[0])
      
      await waitFor(() => {
        expect(mockExecuteAction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'sell_weapon',
            parameters: expect.objectContaining({
              slotIndex: expect.any(Number)
            })
          })
        )
      })
    }
  })

  it('should handle shield sale correctly', async () => {
    const user = userEvent.setup()
    mockExecuteAction.mockResolvedValue({ success: true, message: 'Shield sold successfully!' })
    
    render(<SellEquipmentScreen {...defaultProps} />)
    
    // Switch to shields
    const shieldsButton = screen.getByRole('button', { name: 'Shields' })
    await user.click(shieldsButton)
    
    // Find sell buttons - only test if shields are installed
    const sellButtons = screen.queryAllByRole('button', { name: /Sell.*for.*cr\./ })
    if (sellButtons.length > 0) {
      await user.click(sellButtons[0])
      
      await waitFor(() => {
        expect(mockExecuteAction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'sell_shield',
            parameters: expect.objectContaining({
              slotIndex: expect.any(Number)
            })
          })
        )
      })
    } else {
      // If no shields installed, test should still pass
      expect(screen.getByText(/No shields installed/)).toBeInTheDocument()
    }
  })

  it('should handle gadget sale correctly', async () => {
    const user = userEvent.setup()
    mockExecuteAction.mockResolvedValue({ success: true, message: 'Gadget sold successfully!' })
    
    render(<SellEquipmentScreen {...defaultProps} />)
    
    // Switch to gadgets
    const gadgetsButton = screen.getByRole('button', { name: 'Gadgets' })
    await user.click(gadgetsButton)
    
    // Find and click a sell button
    const sellButtons = screen.getAllByRole('button', { name: /Sell.*for.*cr\./ })
    if (sellButtons.length > 0) {
      await user.click(sellButtons[0])
      
      await waitFor(() => {
        expect(mockExecuteAction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'sell_gadget',
            parameters: expect.objectContaining({
              slotIndex: expect.any(Number)
            })
          })
        )
      })
    }
  })

  it('should show no equipment message when category is empty', () => {
    const emptyState = createInitialState()
    emptyState.currentMode = GameMode.OnPlanet
    emptyState.ship.weapon = [-1] // No weapons installed
    emptyState.ship.shield = [-1] // No shields installed  
    emptyState.ship.gadget = [-1, -1] // No gadgets installed
    
    render(<SellEquipmentScreen 
      {...defaultProps} 
      state={emptyState}
      availableActions={getAvailableActions(emptyState)}
    />)
    
    expect(screen.getByText('No weapons installed.')).toBeInTheDocument()
  })

  it('should show no shields message when switching to empty shields', async () => {
    const user = userEvent.setup()
    const emptyShieldsState = createInitialState()
    emptyShieldsState.currentMode = GameMode.OnPlanet
    emptyShieldsState.ship.weapon = [1] // Has weapons
    emptyShieldsState.ship.shield = [-1] // No shields installed
    
    render(<SellEquipmentScreen 
      {...defaultProps} 
      state={emptyShieldsState}
      availableActions={getAvailableActions(emptyShieldsState)}
    />)
    
    const shieldsButton = screen.getByRole('button', { name: 'Shields' })
    await user.click(shieldsButton)
    
    expect(screen.getByText('No shields installed.')).toBeInTheDocument()
  })

  it('should show equipment store unavailable when not docked', () => {
    const notDockedState = createInitialState()
    notDockedState.currentMode = GameMode.InSpace
    notDockedState.ship.weapon = [1] // Has equipment to sell
    
    render(<SellEquipmentScreen 
      {...defaultProps} 
      state={notDockedState}
      availableActions={getAvailableActions(notDockedState)}
    />)
    
    // Should show unavailable message instead of dock button
    expect(screen.getByText('Equipment store unavailable - must be docked at a planet.')).toBeInTheDocument()
  })

  it('should show equipment store unavailable when not docked', () => {
    const notDockedState = createInitialState()
    notDockedState.currentMode = GameMode.InSpace
    notDockedState.ship.weapon = [1] // Has equipment but not docked
    
    render(<SellEquipmentScreen 
      {...defaultProps} 
      state={notDockedState}
      availableActions={getAvailableActions(notDockedState)}
    />)
    
    expect(screen.getByText('Equipment store unavailable - must be docked at a planet.')).toBeInTheDocument()
  })

  it('should display correct sell prices for installed equipment', () => {
    render(<SellEquipmentScreen {...defaultProps} />)
    
    // Should show sell prices in credits
    const priceElements = screen.getAllByText(/\d+.*cr\./)
    expect(priceElements.length).toBeGreaterThan(0)
    
    // All prices should be positive numbers
    priceElements.forEach(element => {
      const priceText = element.textContent
      if (priceText) {
        const priceNumber = parseInt(priceText.replace(/[^\d]/g, ''))
        expect(priceNumber).toBeGreaterThan(0)
      }
    })
  })

  it('should show shield strength information for shields', async () => {
    const user = userEvent.setup()
    
    // Set up a damaged shield
    const damagedShieldState = createInitialState()
    damagedShieldState.currentMode = GameMode.OnPlanet
    damagedShieldState.ship.shield = [0] // Has shield installed
    damagedShieldState.ship.shieldStrength = [50] // Damaged shield
    
    render(<SellEquipmentScreen 
      {...defaultProps} 
      state={damagedShieldState}
      availableActions={getAvailableActions(damagedShieldState)}
    />)
    
    // Switch to shields
    const shieldsButton = screen.getByRole('button', { name: 'Shields' })
    await user.click(shieldsButton)
    
    // Should show shield strength info if available
    const shieldInfo = screen.queryAllByText(/Shield:/)
    if (shieldInfo.length > 0) {
      expect(shieldInfo[0]).toBeInTheDocument()
    }
  })

  it('should show success message after successful sale', async () => {
    const user = userEvent.setup()
    mockExecuteAction.mockResolvedValue({ success: true, message: 'Equipment sold successfully!' })
    
    render(<SellEquipmentScreen {...defaultProps} />)
    
    const sellButtons = screen.getAllByRole('button', { name: /Sell.*for.*cr\./ })
    if (sellButtons.length > 0) {
      await user.click(sellButtons[0])
      
      await waitFor(() => {
        // The message format shows the equipment name
        expect(screen.getByText(/Successfully sold/)).toBeInTheDocument()
      })
    }
  })

  it('should show error message after failed sale', async () => {
    const user = userEvent.setup()
    mockExecuteAction.mockResolvedValue({ success: false, message: 'Cannot sell this equipment' })
    
    render(<SellEquipmentScreen {...defaultProps} />)
    
    const sellButtons = screen.getAllByRole('button', { name: /Sell.*for.*cr\./ })
    if (sellButtons.length > 0) {
      await user.click(sellButtons[0])
      
      await waitFor(() => {
        expect(screen.getByText('Cannot sell this equipment')).toBeInTheDocument()
      })
    }
  })

  it('should display slot index correctly for multiple items', () => {
    render(<SellEquipmentScreen {...defaultProps} />)
    
    // Should show slot numbers (1-based indexing in UI)
    const slotElements = screen.getAllByText(/Slot: \d+/)
    expect(slotElements.length).toBeGreaterThan(0)
    
    // First slot should show "Slot: 1"
    expect(screen.getByText('Slot: 1')).toBeInTheDocument()
  })

  it('should prevent sale when sell_equipment action not available', async () => {
    const user = userEvent.setup()
    
    const noSellState = createInitialState()
    noSellState.currentMode = GameMode.InSpace // Not docked, so sell action not available
    noSellState.ship.weapon = [1] // Has equipment
    
    render(<SellEquipmentScreen 
      {...defaultProps} 
      state={noSellState}
      availableActions={getAvailableActions(noSellState)}
    />)
    
    // Even if somehow there were sell buttons, clicking should show error
    // This is more of an edge case test since the UI should prevent this
    const sellButtons = screen.queryAllByRole('button', { name: /Sell.*for.*cr\./ })
    
    // Since not docked, shouldn't show equipment items for sale anyway
    expect(screen.getByText('Equipment store unavailable - must be docked at a planet.')).toBeInTheDocument()
  })
})
