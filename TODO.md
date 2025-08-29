# Space Trader TypeScript Port - TODO

This document outlines the comprehensive plan for porting the Space Trader Palm OS game to TypeScript. The project is based on the original C source code by Pieter Spronck (GPL v2 licensed).

## Project Status

### ✅ Completed
- **Types Definition** (`ts/types.ts`): Complete TypeScript interface definitions for all game structures
- **Basic State Management** (`ts/state.ts`): Initial game state creation and utility functions  
- **Test Framework Setup**: Basic Node.js testing infrastructure

### 🚧 In Progress
- **Core Game Logic**: Basic structure started, needs full implementation

### ⏳ Not Started
- Everything else (see detailed breakdown below)

---

## Phase 1: Core Game Data & Systems

### 1.1 Static Game Data
- [ ] **Trade Items System** (`ts/data/tradeItems.ts`)
  - Port trade item definitions from `Global.c`
  - Implement price calculation algorithms from original C code
  - Add trade item demand/supply logic based on system properties

- [ ] **Ship Types** (`ts/data/shipTypes.ts`) 
  - Port all ship type definitions (Gnat, Firefly, Mosquito, etc.)
  - Include weapon/shield/gadget slots, hull strength, fuel capacity
  - Port ship occurrence rates and AI behavior parameters

- [ ] **Equipment Data** (`ts/data/equipment.ts`)
  - Port weapon types (Pulse Laser, Beam Laser, Military Laser)
  - Port shield types (Energy Shield, Reflective Shield, Lightning Shield) 
  - Port gadget types (Extra Cargo Bays, Auto-Repair, Navigation System, etc.)

- [ ] **Crew System** (`ts/data/crew.ts`)
  - Port mercenary names and skill distributions
  - Implement crew hiring/firing logic
  - Port special crew members (Zeethibal, etc.)

- [ ] **Solar Systems** (`ts/data/systems.ts`)
  - Port all 120 solar system definitions from original
  - Include coordinates, tech levels, government types
  - Port special resources and system events

- [ ] **Political Systems** (`ts/data/politics.ts`)
  - Port government types (Anarchy to Corporate State)
  - Include police/pirate/trader strength levels
  - Port bribery and legal system mechanics

### 1.2 Game State Management
- [ ] **Save/Load System** (`ts/state/saveLoad.ts`)
  - **TDD**: Test round-trip serialization preserves all state exactly
  - Implement game state serialization/deserialization
  - Port high score system
  - Add save game validation and migration

- [ ] **Random Number Generation** (`ts/utils/random.ts`)
  - Implement deterministic RNG for consistent gameplay
  - Port specific random event probabilities from original

---

## Phase 2: Core Game Mechanics

### 2.1 Economy & Trading
- [ ] **Price Calculation** (`ts/economy/pricing.ts`)
  - **TDD**: Write tests first using known price examples from original game
  - Port complex price calculation algorithms  
  - Implement supply/demand based on system tech level and government
  - Add special event price modifications (war, plague, drought, etc.)

- [ ] **Trading Functions** (`ts/economy/trading.ts`)
  - **TDD**: Test buy/sell transactions with boundary conditions
  - Buy/sell cargo mechanics (pure state transformation functions)
  - Implement trade-in-orbit encounters
  - Port cargo dumping and jettison logic

- [ ] **Bank System** (`ts/economy/bank.ts`)
  - Implement loan system with interest
  - Add insurance mechanics
  - Port debt collection and consequences

### 2.2 Space Travel & Navigation
- [ ] **Warp System** (`ts/travel/warp.ts`)
  - Implement fuel consumption calculations
  - Port range calculations and wormhole mechanics
  - Add singularity and fabric rip events

- [ ] **Galaxy Map** (`ts/travel/galaxy.ts`)
  - Implement coordinate system and distance calculations  
  - Port system visibility and tracking features
  - Add shortest path calculations

### 2.3 Combat System
- [ ] **Combat Engine** (`ts/combat/engine.ts`)
  - **TDD**: Test damage calculations against known combat scenarios
  - Port turn-based combat mechanics from original
  - Implement weapon/shield interactions
  - Add escape, surrender, and plunder mechanics

- [ ] **AI Opponents** (`ts/combat/ai.ts`)
  - Port police, pirate, and trader AI behavior
  - Implement space monsters (Dragonfly, Space Monster, Scarab)
  - Add famous captains (Ahab, Conrad, Huie)

- [ ] **Combat Resolution** (`ts/combat/resolution.ts`)
  - Damage calculations and hull/shield mechanics
  - Auto-repair system implementation
  - Death, insurance, and escape pod logic

---

## Phase 3: Encounters & Events

### 3.1 Random Encounters
- [ ] **Encounter System** (`ts/encounters/encounters.ts`)
  - Port encounter probability calculations
  - Implement encounter type determination (police, pirates, traders)
  - Add cloaking device and reputation effects

- [ ] **Special Encounters** (`ts/encounters/special.ts`)
  - Marie Celeste encounter
  - Famous captain encounters
  - Bottle (old/good) encounters
  - Alien artifact and invasion storyline

### 3.2 Quest System  
- [ ] **Main Quests** (`ts/quests/main.ts`)
  - Japori disease quest
  - Alien invasion quest chain
  - Wild and Jarek prisoner quests
  - Experiment and reactor storyline

- [ ] **Special Events** (`ts/quests/events.ts`)
  - Tribble infestation
  - Lightning shield installation
  - Skill increase opportunities
  - Moon purchase and retirement

### 3.3 News System
- [ ] **Newspaper** (`ts/news/newspaper.ts`)
  - Port dynamic news generation based on events
  - Implement system-specific news mastheads
  - Add news event tracking and probability

---

## Phase 4: Game Rules & Progression

### 4.1 Reputation System
- [ ] **Police Record** (`ts/reputation/police.ts`)
  - Port police record scoring (Psychopath to Hero)
  - Implement police encounter behavior based on record
  - Add bribery and inspection mechanics

- [ ] **Combat Reputation** (`ts/reputation/combat.ts`)
  - Port kill-based reputation system (Harmless to Elite)
  - Implement reputation effects on encounters
  - Add bounty and reward calculations

### 4.2 Difficulty & Balance
- [ ] **Difficulty Scaling** (`ts/difficulty/scaling.ts`)
  - Port difficulty level effects on prices and encounters
  - Implement beginner, easy, normal, hard, impossible modes

### 4.3 Cheat System
- [ ] **Cheat Functions** (`ts/cheats/cheats.ts`)
  - Port cheat code system from `#define _STRA_CHEAT_`
  - Implement debug commands (money, skip encounters, etc.)
  - Add development/testing shortcuts

### 4.4 End Game Conditions
- [ ] **Game Endings** (`ts/game/endings.ts`)
  - Death and insurance claim system
  - Retirement scoring and conditions
  - Moon purchase victory condition

---

## Phase 5: Testing & Quality Assurance

### 5.1 Test-Driven Development
- [ ] **Write Tests First** - For every function, write comprehensive tests before implementation
- [ ] **Core Systems Tests** (`ts/tests/core/`)
  - Price calculation accuracy vs original (exact numeric matching)
  - Combat mechanics verification (damage, hit/miss, AI decisions)  
  - Save/load integrity testing (round-trip state preservation)

- [ ] **Data Integrity Tests** (`ts/tests/data/`)
  - Verify all systems, ships, and equipment match original exactly
  - Test random encounter probability distributions
  - Validate quest progression logic

- [ ] **Game Balance Validation** (`ts/tests/balance/`)
  - Compare outputs against original Palm version for identical inputs
  - Verify economic formulas produce identical results
  - Test edge cases and boundary conditions

### 5.2 Integration Testing
- [ ] **Full Game Scenarios** (`ts/tests/scenarios/`)
  - Complete game playthrough simulation
  - Quest completion verification  
  - Edge case and error condition testing

### 5.3 Cross-Platform Verification 
- [ ] **Random Number Generation** (`ts/tests/rng/`)
  - Ensure identical random sequences as original for reproducible gameplay
  - Verify encounter probabilities match original exactly
  - Test deterministic behavior across Node.js versions

### 5.4 Performance & Compatibility
- [ ] **Performance Testing** (`ts/tests/performance/`)
  - Large game state handling
  - Memory usage optimization
  - Node.js compatibility across versions

---

## Phase 6: Documentation & Polish

### 6.1 Function Documentation
- [ ] **Code Documentation** 
  - JSDoc comments for all pure functions
  - Usage examples for core game state transformations
  - Architecture decision records

### 6.2 Game Documentation
- [ ] **Game Mechanics Guide**
  - Porting differences from original
  - Hidden mechanics and easter eggs
  - Cheat codes and debug features

### 6.3 Developer Documentation
- [ ] **Development Guide**
  - Build and test instructions  
  - Contribution guidelines
  - Future enhancement roadmap

---

## Implementation Notes

### Priority Order
1. **Phase 1**: Essential game data and foundation
2. **Phase 2**: Core gameplay mechanics  
3. **Phase 3**: Rich gameplay experience (encounters and quests)
4. **Phase 4**: Complete game balance and rules
5. **Phase 5**: Comprehensive testing and validation
6. **Phase 6**: Documentation and polish

### Key Architecture Decisions
- **Test-Driven Development**: Write tests FIRST for every function before implementation
- **Functional Programming**: Pure functions only, immutable state transformations
- **TypeScript First**: Strong typing throughout, no `any` types
- **Node.js Native**: Minimal dependencies, use built-in Node.js capabilities
- **Game State Functions**: All game logic as pure functions that transform state
- **Performance**: Optimize for quick game state calculations

### Files to Reference During Implementation
- `palm/Src/spacetrader.h` - All constants and enums
- `palm/Src/DataTypes.h` - Data structure definitions  
- `palm/Src/Global.c` - Static game data arrays
- `palm/Src/Merchant.c` - Main game loop and UI handling
- `palm/ReadMe.txt` - Original development notes and requirements

### Estimated Timeline
- **Phase 1**: 2-3 weeks (foundation and data)
- **Phase 2**: 4-5 weeks (core mechanics)  
- **Phase 3**: 3-4 weeks (events and quests)
- **Phase 4**: 2-3 weeks (balance, rules, and cheats)
- **Phase 5**: 3-4 weeks (comprehensive TDD testing)
- **Phase 6**: 1-2 weeks (documentation)

**Total Estimated Time**: 15-21 weeks for complete port

**Note**: With TDD emphasis, testing time is distributed throughout development, but comprehensive integration testing still requires dedicated phase.

---

*This TODO represents a faithful port of the complete Space Trader 1.2.2 game to TypeScript, maintaining all original gameplay mechanics while modernizing the codebase architecture.*