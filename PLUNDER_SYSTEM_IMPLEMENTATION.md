# Plunder System Implementation

## Overview

The plunder system has been fully implemented based on the Palm OS Space Trader implementation in `Cargo.c` lines 786-850 and `Encounter.c` lines 2144-2147. This system allows players to loot cargo from defeated opponents in combat encounters.

## Files Created/Modified

### New Files
- **`ts/combat/plunder.ts`** - Complete plunder system implementation
- **`ts/combat/plunder.test.ts`** - Comprehensive test suite (35 tests)

### Modified Files
- **`ts/combat/engine.ts`** - Integration with combat system
- **`ts/types.ts`** - Added plunder state to GameState interface
- **`ts/reputation/police.ts`** - Added plunder penalty constants

## Core Features

### 1. Plunder Validation System
- **`canPlunder()`** - Validates if plundering is possible
- **`validatePlunderAmount()`** - Validates specific amounts to plunder
- **`getMaxPlunderAmount()`** - Calculates maximum plunderable quantity

### 2. Cargo Transfer Mechanics
- **`plunderCargo()`** - Port of Palm OS `PlunderCargo()` function
- **`plunderAllCargo()`** - Convenience function to plunder all of an item type
- Respects cargo space limitations
- Limits plunder to available opponent cargo

### 3. Police Record Penalties
- **`PLUNDER_TRADER_PENALTY = -2`** - Penalty for plundering traders
- **`PLUNDER_PIRATE_PENALTY = -1`** - Lesser penalty for plundering pirates
- **`applyPlunderPenalty()`** - Applies appropriate penalties based on encounter type

### 4. User Interface Support
- **`getPlunderableItems()`** - Lists all items available for plundering
- **`createPlunderActions()`** - Creates UI actions for item selection
- **`getPlunderSummary()`** - Provides comprehensive status information
- **`processPlunderAction()`** - Handles user action processing

### 5. Combat Integration
- Plunder action available when opponent surrenders (`PIRATESURRENDER`)
- Integrated into combat action system
- Proper encounter state management
- Police record penalty application

## Technical Implementation

### Plunder State Management
```typescript
interface PlunderState {
  isActive: boolean;
  opponentCargo: MutableTradeItemArray;
  selectedItem: number;
  availableSpace: number;
  totalPlundered: number;
}
```

### Action Types
```typescript
type PlunderAction = 'select_item' | 'plunder_amount' | 'plunder_all' | 'finish_plunder';
```

### Result Interface
```typescript
interface PlunderResult {
  success: boolean;
  message: string;
  itemsPlundered?: Array<{
    itemIndex: number;
    itemName: string;
    quantity: number;
  }>;
  policeRecordPenalty?: number;
}
```

## Palm OS Compatibility

The implementation maintains full compatibility with the original Palm OS game:

1. **Exact Logic Port** - `plunderCargo()` mirrors Palm OS `PlunderCargo()` exactly
2. **Police Penalties** - Uses exact penalty values from `spacetrader.h`
3. **Cargo Limits** - Respects both player cargo space and opponent availability
4. **Encounter Integration** - Follows Palm OS encounter flow patterns

## Usage Examples

### Basic Plundering
```typescript
// Check if plundering is possible
const plunderCheck = canPlunder(state);
if (plunderCheck.canPlunder) {
  // Get available items
  const items = getPlunderableItems(state.opponent);
  
  // Plunder specific amount
  const result = plunderCargo(state, itemIndex, amount);
  
  // Or plunder all of an item
  const allResult = plunderAllCargo(state, itemIndex);
}
```

### Action Processing
```typescript
// Process plunder actions
const result = processPlunderAction(state, 'plunder_all', itemIndex);
const finishResult = processPlunderAction(state, 'finish_plunder');
```

### UI Integration
```typescript
// Get plunder summary for display
const summary = getPlunderSummary(state);

// Create actions for UI
const actions = createPlunderActions(state);
```

## Test Coverage

The implementation includes comprehensive test coverage:
- **35 test cases** covering all functionality
- **Unit tests** for each function
- **Integration tests** for complete plunder sessions
- **Edge cases** and error conditions
- **Police record penalty testing**
- **Cargo space limit validation**

### Test Categories
1. **Validation Tests** - `canPlunder()`, `validatePlunderAmount()`
2. **Transfer Tests** - `plunderCargo()`, `plunderAllCargo()`
3. **Penalty Tests** - Police record penalties by encounter type
4. **UI Support Tests** - Action creation and processing
5. **Integration Tests** - Complete plunder scenarios

## Combat System Integration

The plunder system integrates seamlessly with the existing combat system:

1. **Combat Actions** - `plunder` action added to available combat actions
2. **Encounter Types** - Activated for `PIRATESURRENDER` encounters
3. **State Management** - Plunder state added to `GameState`
4. **Flow Control** - Proper encounter ending and state cleanup

## Future Enhancements

The system is designed to support future enhancements:
- Advanced UI for specific cargo selection
- Bulk plunder operations
- Plunder history tracking
- Enhanced penalty calculations based on cargo type

This implementation provides a complete, tested, and Palm OS-compatible plunder system that enhances the combat experience while maintaining game balance through appropriate police record penalties.
