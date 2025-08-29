# Space Trader TypeScript Port - TODO

## Core Architecture

1. **Create the State object** - Define the main game state structure based on Palm source
2. Review Palm source code to understand game state structure
3. Create TypeScript interfaces for all game data types
4. Implement static game data (ships, equipment, planets, etc.)
5. Create action functions that take State and return updated State
6. Implement available actions method
7. Add comprehensive tests for all actions

## Game Systems (In Order of Priority)

1. **Player & Ship Management**
   - Player stats (name, credits, reputation, etc.)
   - Ship configuration and equipment
   - Crew management

2. **Galaxy & Navigation** 
   - Solar system definitions
   - Planet properties and markets
   - Travel mechanics

3. **Trading System**
   - Market prices and availability
   - Buy/sell actions
   - Price calculations

4. **Encounters**
   - Space encounters (pirates, police, traders)
   - Combat system
   - Special events

5. **Advanced Features**
   - Special quests and events
   - News system
   - High scores

## Implementation Notes

- Every feature must match the Palm Pilot original exactly
- Consult `palm/` source code for any behavioral questions
- Test each action thoroughly before moving to the next
- Run tests regularly to prevent regressions