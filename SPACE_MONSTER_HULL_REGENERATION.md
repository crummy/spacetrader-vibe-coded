# Space Monster Hull Regeneration Implementation

## Overview

This document describes the implementation of the Space Monster's hull regeneration feature, which was missing from the TypeScript port but present in the original Palm OS game.

## Palm OS Reference

From the original Palm OS source code (`palm/Src/Traveler.c`, lines 577-579):

```c
MonsterHull = (MonsterHull * 105) / 100;
if (MonsterHull > Shiptype[SpaceMonster.Type].HullStrength)
    MonsterHull = Shiptype[SpaceMonster.Type].HullStrength;
```

## Implementation Details

### Daily Regeneration Logic

The Space Monster's hull regenerates **5% per day** (multiplied by 1.05) and is capped at the maximum hull strength of the Space Monster ship type.

### Key Features

1. **5% Daily Growth**: Hull increases by 5% each day
2. **Maximum Cap**: Hull cannot exceed the Space Monster's maximum hull strength (500 HP)
3. **Conditional**: Only regenerates when `monsterHull > 0` (monster is spawned)
4. **Flooring**: Fractional regeneration is floored to integers

### Code Location

- **Implementation**: [`ts/engine/game.ts`](ts/engine/game.ts) - `regenerateSpaceMonsterHull()` function
- **Integration**: Called daily in `advanceTime()` function
- **Tests**: [`ts/creatures/space-monster-hull-regeneration.test.ts`](ts/creatures/space-monster-hull-regeneration.test.ts)

### Test Coverage

The implementation includes comprehensive tests covering:

- Basic 5% daily regeneration
- Maximum hull cap enforcement
- Zero hull handling (monster not spawned)
- Multiple day compounding
- Fractional value flooring
- Edge cases and boundary conditions

### Game Impact

This feature makes the Space Monster progressively more challenging over time, as its hull slowly regenerates when not engaged in combat. Players who encounter a damaged Space Monster may find it stronger if they encounter it again later.

### Technical Notes

- Space Monster is ship type index 10 in the ship types array
- Maximum hull strength is 500 HP
- Regeneration occurs during daily time advancement
- Uses `Math.floor()` for integer hull values
- Integrates with existing time progression system
