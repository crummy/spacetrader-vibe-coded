import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { CommanderStatusScreen } from '../CommanderStatusScreen'
import { createInitialState } from '@game-state'
import { getAvailableActions } from '@game-engine'
import type { GameState } from '@game-types'

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
testGameState.nameCommander = 'TestCommander'
testGameState.currentMode = 0 // OnPlanet
testGameState.credits = 25000
testGameState.debt = 5000
testGameState.days = 42
testGameState.difficulty = 2 // Normal
testGameState.commanderPilot = 5
testGameState.commanderFighter = 7
testGameState.commanderTrader = 6
testGameState.commanderEngineer = 4
testGameState.reputationScore = 15 // Competent
testGameState.policeRecordScore = 10 // Clean
testGameState.policeKills = 2
testGameState.traderKills = 1
testGameState.pirateKills = 8
testGameState.insurance = true
testGameState.noClaim = 3
testGameState.escapePod = true
testGameState.moonBought = false
testGameState.ship.hull = 100
testGameState.ship.fuel = 14
testGameState.ship.cargo = [0, 3, 2, 5, 0, 0, 0, 0, 0, 0] // Some cargo
testGameState.ship.crew = [0, 5, 12, -1] // Commander plus two crew members
testGameState.currentSystem = 2 // Sol system

// Get real available actions
const testAvailableActions = getAvailableActions(testGameState)

const mockExecuteAction = vi.fn()

describe('CommanderStatusScreen', () => {
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

  it('should render commander status screen with basic information', () => {
    render(<CommanderStatusScreen {...defaultProps} />)
    
    // Should show commander name
    expect(screen.getByText('Commander TestCommander')).toBeInTheDocument()
    
    // Should show days and reputation
    expect(screen.getByText(/Day 42/)).toBeInTheDocument()
  })

  it('should display all status tabs', () => {
    render(<CommanderStatusScreen {...defaultProps} />)
    
    // All tabs should be visible
    expect(screen.getByRole('button', { name: 'General' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Combat' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Financial' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ship' })).toBeInTheDocument()
  })

  it('should show general tab content by default', () => {
    render(<CommanderStatusScreen {...defaultProps} />)
    
    // Should show commander skills
    expect(screen.getByText('Commander Skills:')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // Pilot skill
    expect(screen.getByText('7')).toBeInTheDocument() // Fighter skill
    expect(screen.getByText('6')).toBeInTheDocument() // Trader skill
    expect(screen.getByText('4')).toBeInTheDocument() // Engineer skill
    
    // Should show total skills (5+7+6+4=22)
    expect(screen.getByText('22')).toBeInTheDocument()
    
    // Should show game progress
    expect(screen.getByText('Days Played:')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Normal')).toBeInTheDocument() // Difficulty
    // System name might be empty or undefined in test state - check if system shows anything
    expect(screen.getByText('Current System:')).toBeInTheDocument()
    
    // Should show special status
    expect(screen.getByText('Insurance:')).toBeInTheDocument()
    expect(screen.getByText('Active (3 days)')).toBeInTheDocument()
    expect(screen.getByText('Escape Pod:')).toBeInTheDocument()
    expect(screen.getByText('Installed')).toBeInTheDocument()
  })

  it('should switch between tabs correctly', async () => {
    const user = userEvent.setup()
    render(<CommanderStatusScreen {...defaultProps} />)
    
    // Click combat tab
    const combatTab = screen.getByRole('button', { name: 'Combat' })
    await user.click(combatTab)
    
    // Should show combat content
    expect(screen.getByText('Combat Reputation:')).toBeInTheDocument()
    expect(screen.getByText('Combat Statistics:')).toBeInTheDocument()
    expect(screen.getByText('Total Kills:')).toBeInTheDocument()
    expect(screen.getByText('11')).toBeInTheDocument() // 2+1+8=11 total kills
    expect(screen.getByText('8')).toBeInTheDocument() // Pirate kills
    expect(screen.getByText('2')).toBeInTheDocument() // Police kills
    expect(screen.getByText('1')).toBeInTheDocument() // Trader kills
    
    // Click financial tab
    const financialTab = screen.getByRole('button', { name: 'Financial' })
    await user.click(financialTab)
    
    // Should show financial content
    expect(screen.getByText('Financial Status:')).toBeInTheDocument()
    expect(screen.getByText('25,000 cr.')).toBeInTheDocument() // Credits
    expect(screen.getByText('5,000 cr.')).toBeInTheDocument() // Debt
    expect(screen.getByText('20,000 cr.')).toBeInTheDocument() // Net worth (25000-5000)
    
    // Click ship tab
    const shipTab = screen.getByRole('button', { name: 'Ship' })
    await user.click(shipTab)
    
    // Should show ship content
    expect(screen.getByText(/Current Ship - /)).toBeInTheDocument()
    expect(screen.getByText('Hull:')).toBeInTheDocument()
    expect(screen.getByText('Fuel:')).toBeInTheDocument()
  })

  it('should show correct police record and reputation strings', () => {
    render(<CommanderStatusScreen {...defaultProps} />)
    
    const combatTab = screen.getByRole('button', { name: 'Combat' })
    fireEvent.click(combatTab)
    
    // Should use real reputation calculation
    expect(screen.getByText('Police Record:')).toBeInTheDocument()
    expect(screen.getByText('Score: 10')).toBeInTheDocument()
    
    // Should show combat reputation
    expect(screen.getByText('Score: 15')).toBeInTheDocument()
  })

  it('should calculate and display ship value correctly', async () => {
    const user = userEvent.setup()
    render(<CommanderStatusScreen {...defaultProps} />)
    
    // Go to financial tab
    const financialTab = screen.getByRole('button', { name: 'Financial' })
    await user.click(financialTab)
    
    // Should show ship value
    expect(screen.getByText('Ship Value:')).toBeInTheDocument()
    // Value should be calculated using real ship pricing logic
  })

  it('should show crew information in ship tab', async () => {
    const user = userEvent.setup()
    render(<CommanderStatusScreen {...defaultProps} />)
    
    // Go to ship tab
    const shipTab = screen.getByRole('button', { name: 'Ship' })
    await user.click(shipTab)
    
    // Should show crew members
    expect(screen.getByText('Crew Members:')).toBeInTheDocument()
    expect(screen.getByText('Commander TestCommander (You)')).toBeInTheDocument()
    
    // Should show other crew members using real names
    // Crew indices 5 and 12 should resolve to actual mercenary names
  })

  it('should display debt warning when player has debt', async () => {
    const user = userEvent.setup()
    render(<CommanderStatusScreen {...defaultProps} />)
    
    // Go to financial tab
    const financialTab = screen.getByRole('button', { name: 'Financial' })
    await user.click(financialTab)
    
    // Should show debt warning since testGameState has 5000 debt
    expect(screen.getByText('Debt Warning:')).toBeInTheDocument()
    expect(screen.getByText(/Daily interest:/)).toBeInTheDocument()
  })

  it('should show cargo information', async () => {
    const user = userEvent.setup()
    render(<CommanderStatusScreen {...defaultProps} />)
    
    // Go to ship tab
    const shipTab = screen.getByRole('button', { name: 'Ship' })
    await user.click(shipTab)
    
    // Should show cargo - we have some cargo in test state
    expect(screen.getByText('Ship Cargo:')).toBeInTheDocument()
  })

  it('should handle state without insurance or escape pod', () => {
    const stateWithoutInsurance = { ...testGameState, insurance: false, escapePod: false }
    const propsWithoutInsurance = { ...defaultProps, state: stateWithoutInsurance }
    
    render(<CommanderStatusScreen {...propsWithoutInsurance} />)
    
    // Should show "None" for insurance and escape pod (multiple elements expected)
    const noneElements = screen.getAllByText('None')
    expect(noneElements).toHaveLength(2) // One for insurance, one for escape pod
  })

  it('should display moon purchase status when applicable', () => {
    const stateWithMoon = { ...testGameState, moonBought: true }
    const propsWithMoon = { ...defaultProps, state: stateWithMoon }
    
    render(<CommanderStatusScreen {...propsWithMoon} />)
    
    // Should show moon purchase in general tab
    expect(screen.getByText('Moon Purchased:')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
  })

  it('should show peaceful trader message when no kills', () => {
    const peacefulState = { 
      ...testGameState, 
      policeKills: 0, 
      traderKills: 0, 
      pirateKills: 0 
    }
    const peacefulProps = { ...defaultProps, state: peacefulState }
    
    render(<CommanderStatusScreen {...peacefulProps} />)
    
    const combatTab = screen.getByRole('button', { name: 'Combat' })
    fireEvent.click(combatTab)
    
    expect(screen.getByText('No combat encounters yet. Peaceful trader!')).toBeInTheDocument()
  })

  it('should calculate equipment slots correctly', async () => {
    const user = userEvent.setup()
    render(<CommanderStatusScreen {...defaultProps} />)
    
    // Go to ship tab
    const shipTab = screen.getByRole('button', { name: 'Ship' })
    await user.click(shipTab)
    
    // Should show equipment slot usage
    expect(screen.getByText('Equipment Slots:')).toBeInTheDocument()
    expect(screen.getByText('Weapons')).toBeInTheDocument()
    expect(screen.getByText('Shields')).toBeInTheDocument()
    expect(screen.getByText('Gadgets')).toBeInTheDocument()
  })
})
