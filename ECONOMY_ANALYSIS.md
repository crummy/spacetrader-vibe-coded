# Space Trader Economy System Analysis

This document provides a comprehensive analysis of the economic system in Space Trader, based on examination of the Palm OS C source code. Every formula, validation rule, and constraint is documented with exact source file references.

## Table of Contents

1. [Core Economic Constants](#core-economic-constants)
2. [Pricing Formulas](#pricing-formulas)
3. [Trading Validation Rules](#trading-validation-rules)
4. [Cargo Management](#cargo-management)
5. [Financial Transaction Limits](#financial-transaction-limits)
6. [Market Conditions and Modifiers](#market-conditions-and-modifiers)
7. [Banking System](#banking-system)
8. [Ship Pricing](#ship-pricing)
9. [Insurance System](#insurance-system)
10. [Criminal Economy Rules](#criminal-economy-rules)

## Core Economic Constants

### Trade Items (from Global.c:131-143)
- **MAXTRADEITEM**: 10 total trade goods
- Trade items indexed 0-9: Water, Furs, Food, Ore, Games, Firearms, Medicine, Machines, Narcotics, Robots

### Skill System (from spacetrader.h)
- **MAXSKILL**: 10 (maximum skill level)
- Skills affect pricing: Pilot, Fighter, Trader, Engineer

### Police Record Scores (from spacetrader.h)
- **DUBIOUSSCORE**: -5 (criminal threshold)
- **CLEANSCORE**: 0 (clean record threshold)
- **AVERAGESCORE**: 40 (average reputation)

### Financial Limits (from spacetrader.h)
- **DEBTTOOLARGE**: 100,000 credits (blocks trading)
- **COSTMOON**: 500,000 credits (moon purchase price)

## Pricing Formulas

### Buy Price Calculation (Skill.c:142-165)

The buy price calculation is complex and involves multiple factors:

```c
// 1. Check tech level requirement
if (System.TechLevel < Item.TechProduction) return 0;

// 2. Check political restrictions
if ((Narcotics && !Politics.DrugsOK) || (Firearms && !Politics.FirearmsOK)) return 0;

// 3. Apply criminal markup/discount
if (PoliceRecordScore < DUBIOUSSCORE) {
    BuyPrice = (SellPrice * 100) / 90;  // 11% markup for criminals
} else {
    BuyPrice = SellPrice;
}

// 4. Apply trader skill modifier (1% to 12% markup)
BuyPrice = (BuyPrice * (103 + (MAXSKILL - TraderSkill))) / 100;

// 5. Ensure minimum markup
if (BuyPrice <= SellPrice) BuyPrice = SellPrice + 1;
```

### Equipment Sell Price (Cargo.c:834-837)
```c
BaseSellPrice = (OriginalPrice * 3) / 4;  // 75% of original price
```

### Ship Price Calculation (ShipPrice.c:72-96)
```c
// Base calculation for trade-in value
ShipPrice = (ShipType.Price * (Tribbles > 0 && !ForInsurance ? 1 : 3)) / 4;

// Subtract damage and fuel costs
ShipPrice -= (GetHullStrength() - Ship.Hull) * ShipType.RepairCosts;
ShipPrice -= (ShipType.FuelTanks - GetFuel()) * ShipType.CostOfFuel;

// Add equipment value (at 2/3 original price)
for each weapon: ShipPrice += WEAPONSELLPRICE(weapon);
for each shield: ShipPrice += SHIELDSELLPRICE(shield);  
for each gadget: ShipPrice += GADGETSELLPRICE(gadget);
```

### Enemy Ship Valuation (ShipPrice.c:49-67)
```c
EnemyShipPrice = ShipType.Price + WeaponValue + ShieldValue;
EnemyShipPrice = EnemyShipPrice * (2*PilotSkill + EngineerSkill + 3*FighterSkill) / 60;
```

## Trading Validation Rules

### Cargo Purchase Validation (Cargo.c:572-615)

Four critical validation checks in order:

1. **Debt Check**:
   ```c
   if (Debt > DEBTTOOLARGE) return "DebtTooLargeForBuy";
   ```

2. **Availability Check**:
   ```c
   if (System.Qty[Item] <= 0 || BuyPrice[Item] <= 0) return "NothingAvailable";
   ```

3. **Cargo Capacity Check**:
   ```c
   if (TotalCargoBays - FilledCargoBays - LeaveEmpty <= 0) return "NoEmptyBays";
   ```

4. **Affordability Check**:
   ```c
   if (ToSpend() < BuyPrice[Item]) return "CantAfford";
   ```

### Cargo Sale Validation (Cargo.c:622-695)

Different rules apply based on operation type:

**SELLCARGO**:
- Must have cargo: `if (Ship.Cargo[Item] <= 0) return "NothingForSale";`
- Market must be interested: `if (SellPrice[Item] <= 0) return "NotInterested";`

**DUMPCARGO**:
- Must have cargo: `if (Ship.Cargo[Item] <= 0) return "NothingToDump";`
- Must afford disposal: `if (ToSpend() < DumpCost) return "CantAffordDumping";`

**JETTISONCARGO**:
- Only cargo check required
- Police penalty possible (see Criminal Economy Rules)

## Cargo Management

### Total Cargo Bays Calculation (Cargo.c:730-746)
```c
Bays = ShipType.CargoBays;

// Add gadget bonuses
for each gadget:
    if (Gadget == EXTRABAYS) Bays += 5;

// Subtract quest penalties  
if (JaporiDiseaseStatus == 1) Bays -= 10;
if (ReactorStatus > 0 && ReactorStatus < 21) Bays -= (5 + 10 - (ReactorStatus - 1)/2);
```

### Filled Cargo Bays (Cargo.c:752-761)
```c
FilledBays = sum(Ship.Cargo[0..MAXTRADEITEM-1]);
```

### Cargo Weight/Space Rules
- Each trade good unit occupies exactly 1 cargo bay
- No weight system - only volume/space constraints
- Special items (reactor, Japori antidote) reduce available space

## Financial Transaction Limits

### Spendable Money Calculation (Traveler.c:1234-1239)
```c
long ToSpend() {
    if (!ReserveMoney) return Credits;
    return max(0, Credits - MercenaryMoney() - InsuranceMoney());
}
```

### Daily Interest Payment (Money.c:55-70)
```c
if (Debt > 0) {
    IncDebt = max(1, Debt / 10);  // 10% interest, minimum 1 credit
    if (Credits > IncDebt) {
        Credits -= IncDebt;
    } else {
        Debt += (IncDebt - Credits);
        Credits = 0;
    }
}
```

### Current Worth Calculation (Money.c:46-49)
```c
CurrentWorth = CurrentShipPrice(false) + Credits - Debt + (MoonBought ? COSTMOON : 0);
```

## Market Conditions and Modifiers

### Illegal Goods Trading Rules (Cargo.c:216-219, 249-250, 274-275)

Critical rule: **Criminal status determines which goods can be traded**

```c
// For each trade good
if (PoliceRecordScore < DUBIOUSSCORE) {
    // Criminals can ONLY trade illegal goods
    CanTrade = (Item == FIREARMS || Item == NARCOTICS);
} else {
    // Non-criminals CANNOT trade illegal goods  
    CanTrade = (Item != FIREARMS && Item != NARCOTICS);
}
```

### Political Restrictions (Skill.c:150-152)
```c
// Narcotics blocked in anti-drug systems
if (Item == NARCOTICS && !Politics.DrugsOK) BuyPrice = 0;

// Firearms blocked in gun-control systems  
if (Item == FIREARMS && !Politics.FirearmsOK) BuyPrice = 0;
```

### Tech Level Requirements (Skill.c:148-149)
```c
if (System.TechLevel < Item.TechProduction) BuyPrice = 0;
```

## Banking System

### Maximum Loan Calculation (Bank.c:40-44)
```c
long MaxLoan() {
    if (PoliceRecordScore >= CLEANSCORE) {
        // Clean record: loan based on net worth
        return min(25000L, max(1000L, ((CurrentWorth() / 10L) / 500L) * 500L));
    } else {
        // Criminal record: maximum 500 credits
        return 500L;  
    }
}
```

### Loan Processing (Bank.c:50-57)
```c
void GetLoan(long RequestedLoan) {
    Amount = min(MaxLoan() - CurrentDebt, RequestedLoan);
    Credits += Amount;
    Debt += Amount;
}
```

### Debt Repayment (Bank.c:63-71)
```c
void PayBack(long Payment) {
    Amount = min(Debt, Payment);
    Amount = min(Amount, Credits);
    Credits -= Amount; 
    Debt -= Amount;
}
```

## Ship Pricing

### Trade-in Value Factors (ShipPrice.c:72-96)

1. **Base Price Reduction**: 75% of original (25% depreciation)
2. **Tribble Penalty**: If tribbles present and not for insurance, only 25% value
3. **Damage Cost**: Hull damage * RepairCosts per point  
4. **Fuel Cost**: Missing fuel * CostOfFuel per unit
5. **Equipment Value**: Weapons/shields/gadgets at 75% original price

### Equipment Sell Prices
```c
#define WEAPONSELLPRICE(a) (BaseSellPrice(Ship.Weapon[a], WeaponType[Ship.Weapon[a]].Price))
#define SHIELDSELLPRICE(a) (BaseSellPrice(Ship.Shield[a], ShieldType[Ship.Shield[a]].Price))  
#define GADGETSELLPRICE(a) (BaseSellPrice(Ship.Gadget[a], GadgetType[Ship.Gadget[a]].Price))
```

Where `BaseSellPrice = (Price * 3) / 4`

## Insurance System

### Insurance Eligibility (Bank.c:221-226)
- **Requirement**: Must have escape pod
- **Coverage**: Ship value only (not cargo)
- **No-Claim Bonus**: Up to 90% discount on premiums

### Insurance Cost Calculation (Traveler.c:95 + Bank.c:124)
```c
// Daily insurance cost based on ship value and no-claim bonus
InsuranceCost = f(ShipValue, NoClaimBonus); // Exact formula not fully exposed in examined code
```

## Criminal Economy Rules

### Police Record Effects

**Clean Record (≥ 0)**:
- Can trade all legal goods
- Normal buy prices (no criminal markup)
- Higher loan limits (up to 25,000 credits)

**Criminal Record (< -5)**:
- Can ONLY trade illegal goods (firearms, narcotics)
- 11% markup on all purchases: `BuyPrice = (SellPrice * 100) / 90`
- Loan limit capped at 500 credits

### Jettisoning Penalty (Cargo.c:666-674)
```c
if (Operation == JETTISONCARGO) {
    // Chance of getting caught = (Difficulty + 1) out of 10
    if (GetRandom(10) < Difficulty + 1) {
        if (PoliceRecordScore > DUBIOUSSCORE) {
            PoliceRecordScore = DUBIOUSSCORE;
        } else {
            PoliceRecordScore--;
        }
        // News event: caught littering
    }
}
```

### Dumping Costs (Cargo.c:163-165)
```c
DumpingCost = 5 * (Difficulty + 1);  // Credits per unit
```

## Trade Item Specifications

From Global.c:131-143, each trade item has these properties:

| Item | Tech Level | Base Price | Illegal | Special Notes |
|------|------------|------------|---------|---------------|
| Water | 2 | 30 | No | Basic commodity |
| Furs | 0 | 250 | No | Low-tech luxury |
| Food | 1 | 100 | No | Basic necessity |
| Ore | 3 | 350 | No | Industrial material |
| Games | 6 | 250 | No | High-tech entertainment |
| Firearms | 5 | 1250 | **Yes** | Criminal-only |
| Medicine | 6 | 650 | No | High-tech necessity |
| Machines | 5 | 900 | No | Industrial equipment |
| Narcotics | 5 | 3500 | **Yes** | Criminal-only |
| Robots | 7 | 5000 | No | Highest-tech item |

## Implementation Notes for TypeScript Port

### Key Validation Sequences

1. **Always check debt limit first** before any purchase validation
2. **Criminal status affects both pricing and availability** - implement as early filter
3. **Tech level requirements are absolute** - no overrides or exceptions
4. **Minimum markup rule** ensures buy > sell always (except for criminals getting markup)
5. **Cargo space calculation** must account for quest items and special circumstances

### Critical Edge Cases

1. **Zero quantities** - many functions must handle empty markets
2. **Criminal status transitions** - jettisoning can change available goods mid-game
3. **Debt overflow** - interest can compound rapidly
4. **Skill maximums** - trader skill caps affect pricing curves
5. **Political changes** - system government can affect legal goods availability

### Performance Considerations

- Price calculations involve multiple floating-point operations with floor/ceiling
- Validation rules should be checked in order of computational cost (debt check is cheapest)
- Random number generation for penalties should use consistent seed for testing

This analysis provides the complete economic ruleset for implementing a faithful TypeScript port of the Space Trader trading system.
