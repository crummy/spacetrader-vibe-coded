# UI Development Guide

This document provides guidance for AI agents when working on the React UI for Space Trader.

## Project Structure

```
ui/
├── package.json           # UI project dependencies
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript config for UI
├── tailwind.config.js    # Tailwind CSS config
├── index.html            # Entry point
├── src/
│   ├── main.tsx          # React entry point
│   ├── App.tsx           # Main app component
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── styles/           # CSS and styling
│   └── types/            # UI-specific types
└── public/               # Static assets
```

## Technology Stack

### Core Framework
- **React 18+** - Modern React with hooks and concurrent features
- **TypeScript** - Full type safety matching backend
- **Vite** - Fast development and build tool

### Styling
- **Tailwind CSS** - Utility-first CSS framework for rapid development
- **Space theme** - Modern interpretation of retro space trading aesthetic
- **Responsive design** - Mobile-friendly adaptation of Palm OS interface

### Build & Development
- **Vite** - Dev server and build system
- **TypeScript strict mode** - Matching backend TypeScript configuration
- **ESLint + Prettier** - Code quality and formatting

## Game Engine Integration

### Client-Side Integration
```typescript
// Import game engine directly from TypeScript backend
import { createGameEngine } from '../ts/engine/game.ts';
import { getUiFields } from '../ts/ui/ui-fields.ts';
import type { State } from '../ts/types.ts';
```

### State Management Strategy
- **React Context** - For game state management
- **useGameEngine** hook - Custom hook wrapping game engine
- **UI state separation** - Keep UI-only state (modals, loading) separate from game state

### Future Server Preparation
- Design components to work with async actions (ready for server migration)
- Separate game logic calls into service functions for easy API conversion
- Use optimistic updates pattern where appropriate

## Design Philosophy

### Visual Design
- **Retro-futuristic aesthetic** inspired by original Palm OS game
- **Dark space theme** with cyan/green accent colors
- **Monospace fonts** for authentic computer terminal feel
- **Card-based layout** for different game screens/modes

### User Experience
- **Familiar Palm OS flow** but adapted for modern screen sizes
- **Touch/click friendly** interface elements
- **Keyboard shortcuts** for power users (matching Palm OS where possible)
- **Responsive breakpoints** for mobile, tablet, desktop

### Screen Organization
- **Single-page application** with route-based navigation
- **Modal overlays** for detailed actions (buying, selling, ship info)
- **Context-sensitive toolbars** showing available actions
- **Status panels** always visible (ship status, credits, location)

## Component Architecture

### Core Layout Components
```
App
├── GameProvider (Context)
├── Layout
│   ├── Header (credits, system, ship status)
│   ├── MainView (game mode specific)
│   └── ActionBar (available actions)
└── Modals (context-sensitive dialogs)
```

### Game Mode Components
- **PlanetView** - Trading, shipyard, bank, equipment
- **SpaceView** - Galaxy map, travel, warp destinations  
- **CombatView** - Encounter details, combat actions
- **SystemInfoView** - System details, news, special events

### Utility Components
- **ShipStatus** - Hull, fuel, cargo, equipment display
- **TradeInterface** - Buy/sell with price comparisons
- **EncounterDialog** - Combat and encounter interactions
- **QuestTracker** - Active quests and objectives

## Implementation Guidelines

### Game State Integration
```typescript
// Example of proper game engine integration
const { state, executeAction } = useGameEngine();
const uiFields = getUiFields(state);

// Display authentic Palm OS strings
<div>{uiFields.ship?.repairStatus}</div>  // "No repairs are needed."
<div>{uiFields.financial?.creditStatus}</div>  // "1,000 cr."
```

### Action Handling
```typescript
// Consistent action execution pattern
const handleBuyCargo = async (itemIndex: number, quantity: number) => {
  setLoading(true);
  const result = await executeAction({
    type: 'buy_cargo',
    parameters: { tradeItem: itemIndex, quantity }
  });
  
  if (!result.success) {
    showErrorMessage(result.message);
  }
  setLoading(false);
};
```

### PlayerOptions Integration
- **Settings panel** for configuring PlayerOptions
- **Auto-behavior indicators** showing when automation is active
- **Manual override** capability for automated actions

## Development Workflow

### Getting Started
```bash
# Navigate to ui directory
cd ui/

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Testing Strategy
- **Component testing** with React Testing Library
- **Integration testing** with game engine actions
- **E2E testing** for complete user workflows
- **Visual regression testing** for UI consistency

### Code Quality
- **TypeScript strict mode** matching backend configuration
- **ESLint rules** for React best practices
- **Prettier formatting** consistent with backend
- **Import organization** - group imports logically

## Performance Considerations

### Game Engine Performance
- **Debounced actions** for rapid user input
- **Optimistic updates** for immediate UI feedback
- **Action queuing** for complex multi-step operations
- **State memoization** to prevent unnecessary re-renders

### Asset Optimization
- **Image optimization** for space/planet graphics
- **Font loading strategy** for monospace display fonts
- **Code splitting** for different game modes
- **Bundle analysis** to monitor build size

## Accessibility

### Keyboard Navigation
- **Full keyboard support** for all game actions
- **Focus management** for modal dialogs
- **Hotkeys** matching original Palm OS shortcuts where possible
- **Screen reader support** for game status and actions

### Visual Accessibility
- **High contrast mode** option
- **Font size scaling** for readability
- **Color blind friendly** palette choices
- **Clear visual hierarchy** for important information

## Future Considerations

### Server Migration Preparation
- **Service layer** abstraction for game actions
- **WebSocket support** for real-time updates
- **Optimistic UI patterns** for server round-trips
- **Error handling** for network failures

### Progressive Web App
- **Service worker** for offline capability
- **App manifest** for installation
- **Push notifications** for important game events
- **Local storage** for UI preferences

### Enhanced Features
- **Animation system** for combat and travel
- **Sound effects** matching retro game aesthetic
- **Multiple save slots** with game state persistence
- **Statistics tracking** and achievement system

## Current Implementation Status

### ✅ **Completed Features**
- **React + TypeScript + Vite** setup in `ui/` folder
- **Tailwind CSS** with space-themed design system
- **Authentic Palm OS styling** with retro-futuristic colors
- **Responsive layout** components and structure
- **Component architecture** ready for game integration

### 🔧 **Development Commands**
```bash
cd ui/
npm install          # Install dependencies
npm run dev          # Start development server (localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
```

### 🎨 **Design System Implemented**
- **Space theme colors**: `space-black`, `space-dark`, `neon-cyan`, `neon-green`
- **Retro typography**: Orbitron for titles, JetBrains Mono for content
- **Component classes**: `space-panel`, `neon-button`, `retro-title`
- **Status indicators**: `status-good`, `status-warning`, `status-danger`

### 📦 **Current Components**
- **Layout.tsx** - Main layout with header and action bar
- **PlanetView.tsx** - Planet-based interface (demo with authentic strings)
- **SimpleDemo.tsx** - Full trading interface demonstration

### 🔗 **Integration Plan**
**Phase 1** (COMPLETED): Working React UI with authentic Palm OS theming
**Phase 2** (NEXT): Integrate `../ts/engine/game.ts` and `../ts/ui/ui-fields.ts` 
**Phase 3** (FUTURE): Add remaining game modes (space, combat)
**Phase 4** (FUTURE): Server-side migration preparation

### ✅ **Game Integration Complete**
1. **TypeScript path aliases** - ✅ WORKING via `@game-*` aliases
2. **Game engine connection** - ✅ CONNECTED via `useGameEngine()` hook
3. **UI fields integration** - ✅ ACTIVE via `getUiFields()` function
4. **Action handling** - ✅ FUNCTIONAL via `executeAction()` calls

### 🔧 **TypeScript Path Aliases Configured**
```typescript
// In ui/tsconfig.json and vite.config.ts:
"@game-types": "../ts/types.ts"        // Game state and type definitions
"@game-engine": "../ts/engine/game.ts" // Core game engine
"@game-ui": "../ts/ui/ui-fields.ts"    // UI field generation 
"@game-state": "../ts/state.ts"        // Initial state creation

// Usage in components:
import { getUiFields } from '@game-ui';
import type { State } from '@game-types';
import { createGameEngine } from '@game-engine';
```

### 📋 **UI Features Demonstrated**
- ✅ **System Status** - "Acamar is under no particular pressure" 
- ✅ **Ship Status** - "No repairs are needed." / "You have fuel to fly X parsecs."
- ✅ **Financial Status** - "1,000 cr." / "You need 2000 cr. for an escape pod."
- ✅ **Trading Interface** - Commodity exchange table with buy/sell prices
- ✅ **Equipment Display** - "Pulse laser" / "Energy shield"
- ✅ **Quick Actions** - Shipyard, Bank, Equipment, Charter buttons

The UI provides an excellent foundation that captures the retro Space Trader aesthetic while being ready for full game engine integration.
