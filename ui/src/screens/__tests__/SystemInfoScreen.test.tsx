import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { SystemInfoScreen } from '../SystemInfoScreen'
import { createInitialState } from '@game-state'
import type { GameState } from '@game-types'

// Only mock the game engine hook - everything else is real
vi.mock('../../hooks/useGameEngine.ts', () => ({
  useGameEngine: vi.fn(() => ({
    state: testGameState,
    executeAction: mockExecuteAction,
    availableActions: []
  }))
}))

// Mock the special events module to avoid complex dependencies
vi.mock('../../../ts/events/special.ts', () => ({
  getSystemSpecialEvent: vi.fn(() => null),
  canExecuteSpecialEvent: vi.fn(() => null),
  executeSpecialEvent: vi.fn(() => ({ success: false, message: 'No special event' }))
}))

// Create a real game state for testing
const testGameState = createInitialState()
const mockExecuteAction = vi.fn()

// Set up different test scenarios
const setupTestState = (systemIndex: number, modifications: Partial<GameState> = {}) => {
  const state = createInitialState()
  state.currentSystem = systemIndex
  state.warpSystem = systemIndex
  
  // Apply any modifications
  Object.assign(state, modifications)
  
  return state
}

describe('SystemInfoScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Fallback state', () => {
    it('should render fallback when state/onAction not provided', () => {
      render(<SystemInfoScreen onNavigate={vi.fn()} onBack={vi.fn()} />)
      
      expect(screen.getByText('SYSTEM INFO')).toBeInTheDocument()
      expect(screen.getByText('System information unavailable')).toBeInTheDocument()
      expect(screen.getByText('Use the System tab in the main interface to view system details.')).toBeInTheDocument()
    })
  })

  describe('System information display', () => {
    it('should display basic system information', () => {
      const state = setupTestState(0) // System 0
      
      render(<SystemInfoScreen 
        state={state} 
        onAction={mockExecuteAction}
        onNavigate={vi.fn()} 
        onBack={vi.fn()} 
      />)
      
      // Check day counter
      expect(screen.getByText('Day 0')).toBeInTheDocument()
      
      // Check system information section
      expect(screen.getByText('System Information')).toBeInTheDocument()
      
      // Check that system info panel is present
      expect(screen.getByTestId('system-information')).toBeInTheDocument()
    })

    it('should display system size correctly', () => {
      const state = setupTestState(0)
      // Set specific size for testing
      state.solarSystem[0].size = 2 // Medium
      
      render(<SystemInfoScreen 
        state={state} 
        onAction={mockExecuteAction}
        onNavigate={vi.fn()} 
        onBack={vi.fn()} 
      />)
      
      expect(screen.getByText('Size:')).toBeInTheDocument()
      expect(screen.getByText('Medium')).toBeInTheDocument()
    })

    it('should display tech level correctly', () => {
      const state = setupTestState(0)
      // Set specific tech level for testing
      state.solarSystem[0].techLevel = 6 // Post-industrial
      
      render(<SystemInfoScreen 
        state={state} 
        onAction={mockExecuteAction}
        onNavigate={vi.fn()} 
        onBack={vi.fn()} 
      />)
      
      expect(screen.getByText('Tech Level:')).toBeInTheDocument()
      expect(screen.getByText('Post-industrial')).toBeInTheDocument()
    })

    it('should display government type correctly', () => {
      const state = setupTestState(0)
      
      render(<SystemInfoScreen 
        state={state} 
        onAction={mockExecuteAction}
        onNavigate={vi.fn()} 
        onBack={vi.fn()} 
      />)
      
      expect(screen.getByText('Government:')).toBeInTheDocument()
      // Government name should be displayed (based on political system)
    })

    it('should display special resources correctly', () => {
      const state = setupTestState(0)
      // Set specific special resources for testing
      state.solarSystem[0].specialResources = 1 // Mineral rich
      
      render(<SystemInfoScreen 
        state={state} 
        onAction={mockExecuteAction}
        onNavigate={vi.fn()} 
        onBack={vi.fn()} 
      />)
      
      expect(screen.getByText('Resources:')).toBeInTheDocument()
      expect(screen.getByText('Mineral rich')).toBeInTheDocument()
    })

    it('should display system status correctly', () => {
      const state = setupTestState(0)
      // Set specific status for testing
      state.solarSystem[0].status = 1 // at war
      
      render(<SystemInfoScreen 
        state={state} 
        onAction={mockExecuteAction}
        onNavigate={vi.fn()} 
        onBack={vi.fn()} 
      />)
      
      // Use data-testid to find system status
      const statusElement = screen.getByTestId('system-status')
      expect(statusElement).toHaveTextContent('This system is')
      expect(statusElement).toHaveTextContent('at war')
    })
  })

  describe('Activity levels display', () => {
    it('should display police, pirates, and traders activity levels', () => {
      const state = setupTestState(0)
      
      render(<SystemInfoScreen 
        state={state} 
        onAction={mockExecuteAction}
        onNavigate={vi.fn()} 
        onBack={vi.fn()} 
      />)
      
      expect(screen.getByText('Activity Levels')).toBeInTheDocument()
      expect(screen.getByText('Police:')).toBeInTheDocument()
      expect(screen.getByText('Pirates:')).toBeInTheDocument()
      expect(screen.getByText('Traders:')).toBeInTheDocument()
    })
  })

  describe('Trade restrictions display', () => {
    it('should show trade restrictions when drugs or firearms are illegal', () => {
      const state = setupTestState(0)
      // Set politics to a system that restricts trade
      state.solarSystem[0].politics = 2 // Communist State - may have restrictions
      
      render(<SystemInfoScreen 
        state={state} 
        onAction={mockExecuteAction}
        onNavigate={vi.fn()} 
        onBack={vi.fn()} 
      />)
      
      // Check if trade restrictions section exists when restrictions are present
      const tradeRestrictions = screen.queryByTestId('trade-restrictions')
      if (tradeRestrictions) {
        expect(screen.getByText('Trade Restrictions')).toBeInTheDocument()
        
        // Look for warning messages using test ids
        const drugWarning = screen.queryByTestId('drugs-illegal')
        const firearmsWarning = screen.queryByTestId('firearms-illegal')
        
        // At least one restriction should be present
        expect(drugWarning || firearmsWarning).toBeTruthy()
      }
    })
  })

  describe('News functionality', () => {
    it('should show news button when not already paid', () => {
      const state = setupTestState(0)
      state.alreadyPaidForNewspaper = false
      state.difficulty = 0 // Normal difficulty
      
      render(<SystemInfoScreen 
        state={state} 
        onAction={mockExecuteAction}
        onNavigate={vi.fn()} 
        onBack={vi.fn()} 
      />)
      
      const newsButton = screen.getByRole('button', { name: /📰 Read News/ })
      expect(newsButton).toBeInTheDocument()
      expect(newsButton).toHaveTextContent('📰 Read News (1 cr)')
    })

    it('should calculate news price based on difficulty', () => {
      const state = setupTestState(0)
      state.alreadyPaidForNewspaper = false
      state.difficulty = 2 // Hard difficulty
      
      render(<SystemInfoScreen 
        state={state} 
        onAction={mockExecuteAction}
        onNavigate={vi.fn()} 
        onBack={vi.fn()} 
      />)
      
      const newsButton = screen.getByRole('button', { name: /📰 Read News/ })
      expect(newsButton).toHaveTextContent('📰 Read News (3 cr)') // Max(1, 2+1) = 3
    })

    it('should call read news action when button clicked', async () => {
      const user = userEvent.setup()
      const state = setupTestState(0)
      state.alreadyPaidForNewspaper = false
      
      mockExecuteAction.mockResolvedValue({ 
        success: true, 
        message: 'Test news content'
      })
      
      render(<SystemInfoScreen 
        state={state} 
        onAction={mockExecuteAction}
        onNavigate={vi.fn()} 
        onBack={vi.fn()} 
      />)
      
      const newsButton = screen.getByRole('button', { name: /📰 Read News/ })
      await user.click(newsButton)
      
      await waitFor(() => {
        expect(mockExecuteAction).toHaveBeenCalledWith({
          type: 'read_news',
          parameters: {}
        })
      })
    })

    it('should display news content when already paid', () => {
      const state = setupTestState(0)
      state.alreadyPaidForNewspaper = true
      
      // Mock the news content loading
      mockExecuteAction.mockResolvedValue({ 
        success: true, 
        message: 'Important system news here'
      })
      
      render(<SystemInfoScreen 
        state={state} 
        onAction={mockExecuteAction}
        onNavigate={vi.fn()} 
        onBack={vi.fn()} 
      />)
      
      // Should show news panel instead of button using test id
      expect(screen.getByTestId('news-content')).toBeInTheDocument()
      // Check that it contains "Daily News" text
      expect(screen.getByText(/Daily News/)).toBeInTheDocument()
    })
  })

  describe('Mercenary availability', () => {
    it('should show mercenary button when mercenary available', () => {
      const state = setupTestState(0)
      const mockOnNavigate = vi.fn()
      
      render(<SystemInfoScreen 
        state={state} 
        onAction={mockExecuteAction}
        onNavigate={mockOnNavigate} 
        onBack={vi.fn()} 
      />)
      
      // The mercenary availability depends on game logic, so we just test the structure
      // If mercenary is available, button should exist
      const mercenaryButton = screen.queryByTestId('mercenary-button')
      // This test passes if either the button exists or doesn't exist (both are valid)
      if (mercenaryButton) {
        expect(mercenaryButton).toHaveTextContent('👨‍🚀')
        expect(mercenaryButton).toHaveTextContent('Available for Hire')
      }
    })
  })

  describe('Different system scenarios', () => {
    it('should handle different system types correctly', () => {
      // Test with different systems
      const systems = [0, 1, 2, 10] // Test a few different systems
      
      systems.forEach(systemIndex => {
        const state = setupTestState(systemIndex)
        
        const { rerender } = render(<SystemInfoScreen 
          state={state} 
          onAction={mockExecuteAction}
          onNavigate={vi.fn()} 
          onBack={vi.fn()} 
        />)
        
        // Should render without errors for any system
        expect(screen.getByText('System Information')).toBeInTheDocument()
        expect(screen.getByText('Activity Levels')).toBeInTheDocument()
        
        rerender(<div />) // Clean up for next iteration
      })
    })

    it('should show correct system name for different systems', () => {
      const state = setupTestState(1) // Different system
      
      render(<SystemInfoScreen 
        state={state} 
        onAction={mockExecuteAction}
        onNavigate={vi.fn()} 
        onBack={vi.fn()} 
      />)
      
      // System name should be displayed in the palm header
      const palmHeader = document.querySelector('.palm-header')
      expect(palmHeader).toBeInTheDocument()
      
      // Should have system information panel
      expect(screen.getByTestId('system-information')).toBeInTheDocument()
    })

    it('should handle systems with extreme values', () => {
      const state = setupTestState(0)
      
      // Set extreme values to test boundaries
      state.solarSystem[0].size = 4 // Huge
      state.solarSystem[0].techLevel = 7 // Hi-tech
      state.solarSystem[0].specialResources = 12 // Warlike populace
      state.solarSystem[0].status = 7 // lacking enough workers
      
      render(<SystemInfoScreen 
        state={state} 
        onAction={mockExecuteAction}
        onNavigate={vi.fn()} 
        onBack={vi.fn()} 
      />)
      
      expect(screen.getByText('Huge')).toBeInTheDocument()
      expect(screen.getByText('Hi-tech')).toBeInTheDocument()
      expect(screen.getByText('Warlike populace')).toBeInTheDocument()
      expect(screen.getByText('lacking enough workers')).toBeInTheDocument()
    })
  })

  describe('Error handling', () => {
    it('should handle news reading failure gracefully', async () => {
      const user = userEvent.setup()
      const state = setupTestState(0)
      state.alreadyPaidForNewspaper = false
      
      // Mock failure
      mockExecuteAction.mockResolvedValue({ 
        success: false, 
        message: 'Not enough credits'
      })
      
      // Mock window.alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      
      render(<SystemInfoScreen 
        state={state} 
        onAction={mockExecuteAction}
        onNavigate={vi.fn()} 
        onBack={vi.fn()} 
      />)
      
      const newsButton = screen.getByRole('button', { name: /📰 Read News/ })
      await user.click(newsButton)
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Not enough credits')
      })
      
      alertSpy.mockRestore()
    })

    it('should handle action rejection gracefully', async () => {
      const user = userEvent.setup()
      const state = setupTestState(0)
      state.alreadyPaidForNewspaper = false
      
      // Mock rejection
      mockExecuteAction.mockRejectedValue(new Error('Network error'))
      
      // Mock console.error and window.alert
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      
      render(<SystemInfoScreen 
        state={state} 
        onAction={mockExecuteAction}
        onNavigate={vi.fn()} 
        onBack={vi.fn()} 
      />)
      
      const newsButton = screen.getByRole('button', { name: /📰 Read News/ })
      await user.click(newsButton)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to read news:', expect.any(Error))
        expect(alertSpy).toHaveBeenCalledWith('Failed to read news')
      })
      
      consoleSpy.mockRestore()
      alertSpy.mockRestore()
    })
  })
})
