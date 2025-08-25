# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the source code for Space Trader 1.2.2, a classic Palm OS game written in C by Pieter Spronck. The game is inspired by Elite and features space trading, combat, and exploration mechanics. The codebase is distributed under the GNU General Public License.

## Build Environment

- **Platform**: Palm OS (requires Palm OS 2.0+)
- **Development Environment**: CodeWarrior for Palm 8.3 with 4.0 SDKs
- **Build Targets**: Three separate builds are supported:
  - Color version (requires Palm OS 3.5+)
  - Grayscale version (requires Palm OS 3.5+)
  - Black & white version (Palm OS 2.0+)
- **Output**: Each target produces `SpaceTrader.prc`
- **Creator ID**: `STra` (must be changed if creating derivative versions)

## Code Structure

### Core Architecture

The game follows a modular C architecture with clear separation of concerns:

- **`spacetrader.h`**: Main configuration file with all game constants, defines, and macros
- **`DataTypes.h`**: All data structure definitions (SHIP, SOLARSYSTEM, CREWMEMBER, etc.)
- **`Prototype.h`**: Function prototypes for all modules
- **`external.h`**: External includes and system dependencies

### Key Modules

- **`Merchant.c`**: Main application entry point and core game loop
- **`Global.c`**: Global game state and variables
- **`Draw.c`**: Graphics and UI rendering
- **`Encounter.c`**: Space encounters (pirates, police, traders, monsters)
- **`Cargo.c`**: Trading and cargo management
- **`Shipyard.c`**: Ship buying/selling and equipment
- **`Bank.c`**: Financial transactions and debt management
- **`Traveler.c`**: Space travel and navigation
- **Event handlers**: `*Event.c` files handle specific UI forms and user interactions

### Game Systems

- **Galaxy**: 120 solar systems with varying tech levels, politics, and resources
- **Trading**: 10 trade items with dynamic pricing based on system conditions
- **Ships**: 10+ ship types with different capabilities and equipment slots
- **Equipment**: Weapons (3 types), shields (3 types), gadgets (6 types)
- **Crew**: Mercenaries with 4 skill types (Pilot, Fighter, Trader, Engineer)
- **Special Events**: 37 special events and encounters
- **Combat**: Turn-based space combat system

## Development Guidelines

### Code Style

- **Indentation**: 4-space tabs
- **Naming**: Mixed case for functions, UPPERCASE for constants/defines
- **Comments**: Extensive header comments in each file
- **Macros**: Heavy use of macros for game calculations and common operations

### Key Constants and Limits

- `MAXSOLARSYSTEM` (120): Total number of star systems
- `MAXTRADEITEM` (10): Number of tradeable commodities
- `MAXCREWMEMBER` (31): Maximum crew size
- `MAXWEAPON/MAXSHIELD/MAXGADGET` (3 each): Equipment slots per ship
- `GALAXYWIDTH/GALAXYHEIGHT` (150/110): Galaxy dimensions

### Resource Management

Graphics resources are split across three files:
- `MerchantBW.rsrc`: Black & white graphics
- `MerchantGray.rsrc`: Grayscale graphics  
- `MerchantColor.rsrc`: Color graphics

When adding new graphics, ensure consistency across all three resource files with identical names and IDs.

### Compatibility Considerations

- Code targets Palm OS 2.0 minimum
- Avoid functions not available in OS 2.0
- Color/grayscale features require OS 3.5+
- Some control types and fonts (LargeBold) didn't exist in OS 2.0

### Special Features

- **Cheat mode**: Enabled via `_STRA_CHEAT_` define
- **Debug dialogs**: Controlled by `_INCLUDE_DEBUG_DIALOGS_`
- **Version compatibility**: Handles differences between Palm OS versions
- **Save game format**: Complex structure in `SAVEGAMETYPE` with version tracking