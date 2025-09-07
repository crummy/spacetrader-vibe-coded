# Ship & Equipment System Test Coverage Summary

## Overview

I've created comprehensive TypeScript test coverage for the Palm OS Space Trader ship and equipment systems based on analysis of the original C source code. The tests validate all the critical mechanics, rules, and calculations discovered in the Palm OS codebase.

## Test Files Created

### 1. Ship Validation Tests (`ship/ship-validation.test.ts`)
- **18 test cases** covering ship purchase, upgrade, and transfer validation
- **Features tested:**
  - Tech level requirements for ship purchases
  - Credit and debt validation
  - Crew quarters capacity constraints
  - Special equipment transfer costs (Lightning Shield: 30,000cr, Fuel Compactor: 20,000cr, Morgan's Laser: 33,333cr)
  - Quest restrictions (reactor quest prevents ship sale)
  - Hull strength calculations (including hardened hull upgrade +50)
  - Repair cost formulas and credit limits
  - Trade-in value calculations with tribble penalties
  - Minimum ship price enforcement

### 2. Equipment Validation Tests (`equipment/equipment-validation.test.ts`) 
- **22 test cases** covering equipment purchase, installation, and effectiveness
- **Features tested:**
  - Tech level requirements for all equipment types
  - Credit and debt validation for purchases
  - Equipment slot availability and compatibility checks
  - Special item restrictions (Morgan's Laser, Lightning Shield, Fuel Compactor cannot be purchased)
  - Duplicate gadget prevention (except Extra Cargo Bays)
  - 75% sell price formula validation
  - Equipment removal and array shifting mechanics
  - Cargo space validation when selling Extra Cargo Bays
  - Weapon power calculations (15, 25, 35, 85 power values)
  - Shield power calculations (100, 200, 350 power values)
  - Skill enhancement bonuses (+3 for targeting/navigating/auto-repair systems, +2 for cloaking device)
  - Fuel capacity with Fuel Compactor (14→18 parsecs)
  - Cargo bay calculations with quest penalties

### 3. Fuel System Tests (`fuel/fuel-system.test.ts`)
- **25 test cases** covering fuel capacity, purchase, and cost mechanics
- **Features tested:**
  - Base fuel tank capacity by ship type (ranges from 13-20 parsecs)
  - Fuel Compactor enhancement (18 parsecs total capacity)
  - Current fuel limiting by tank capacity
  - Fuel purchase cost calculations by ship type (1-20 credits per parsec)
  - Credit limit enforcement for fuel purchases
  - Tank capacity limits on fuel purchases
  - Fractional credit handling
  - Edge cases and invariant maintenance

### 4. Ship Performance Tests (`ship/ship-performance.test.ts`)
- **28 test cases** covering combat effectiveness and equipment synergy
- **Features tested:**
  - Individual weapon power calculations
  - Multiple weapon power summation
  - Shield power calculations and current strength tracking
  - Skill enhancement from equipment:
    - Targeting System: +3 fighter skill
    - Navigating System: +3 pilot skill  
    - Auto-repair System: +3 engineer skill
    - Cloaking Device: +2 pilot skill
  - Skill bonus stacking (navigating + cloaking = +5 pilot skill)
  - Cloaking effectiveness based on engineer skill comparison
  - Combat hit probability modifiers by ship size
  - Damage reduction from shields
  - Hull strength-based damage limits
  - Equipment synergy effects for maximum combat effectiveness

## Key Rules & Formulas Documented

### Purchase Price Formulas
```typescript
// Equipment base price with trader skill discount
basePrice = (itemPrice * (100 - traderSkill)) / 100

// Ship base price with trader skill discount  
basePrice = (shipPrice * (100 - traderSkill)) / 100
```

### Sell Price Formulas
```typescript
// All equipment sells at 75% of base price
sellPrice = (basePrice * 3) / 4
```

### Hull & Repair System
```typescript
// Hull strength with optional hardening
hullStrength = baseHullStrength + (scarabStatus === 3 ? 50 : 0)

// Repair cost calculation
repairCost = hullPointsToRepair * shipType.repairCosts
```

### Fuel System
```typescript
// Fuel capacity with optional compactor
fuelCapacity = hasFuelCompactor ? 18 : shipType.fuelTanks

// Fuel purchase cost
fuelCost = parsecsNeeded * shipType.costOfFuel
```

### Cargo Bay Calculation
```typescript
// Total cargo bays with modifiers
totalBays = baseBays + (extraBayGadgets * 5) - questPenalties

// Quest penalties:
// - Japori Disease: -10 bays
// - Reactor Quest: -(5 + 10 - floor((status-1)/2)) bays
```

## Test Coverage Statistics

- **Total test cases**: 93
- **Total test files**: 4  
- **All tests passing**: ✅
- **Code coverage areas**:
  - Ship purchase validation
  - Equipment trading mechanics
  - Fuel management systems
  - Combat performance calculations
  - Quest system constraints
  - Special equipment handling
  - Price calculation formulas
  - Skill enhancement systems

## Usage

Run all ship and equipment tests:

```bash
mise exec -- node --test --experimental-strip-types ship/ship-validation.test.ts equipment/equipment-validation.test.ts fuel/fuel-system.test.ts ship/ship-performance.test.ts
```

Run individual test suites:
```bash
# Ship validation tests
mise exec -- node --test --experimental-strip-types ship/ship-validation.test.ts

# Equipment validation tests  
mise exec -- node --test --experimental-strip-types equipment/equipment-validation.test.ts

# Fuel system tests
mise exec -- node --test --experimental-strip-types fuel/fuel-system.test.ts

# Ship performance tests
mise exec -- node --test --experimental-strip-types ship/ship-performance.test.ts
```

## Documentation References

- **SHIP-EQUIPMENT-ANALYSIS.md**: Comprehensive analysis of Palm OS ship and equipment systems
- **AGENTS.palm.md**: Palm OS codebase documentation
- Original Palm OS source files analyzed:
  - `Shipyard.c` - Ship purchasing and upgrading
  - `BuyEquipEvent.c` - Equipment purchasing logic
  - `SellEquipEvent.c` - Equipment selling logic  
  - `BuyShipEvent.c` - Ship purchase logic
  - `ShipEvent.c` - Ship management and validation
  - `Fuel.c` - Fuel management and calculations

All tests are designed to validate that the TypeScript port maintains exact compatibility with the original Palm OS Space Trader game mechanics.
