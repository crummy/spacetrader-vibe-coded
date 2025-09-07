# Palm OS Space Trader Ship & Equipment System Analysis

## Overview

This document provides a comprehensive analysis of the ship and equipment systems from the original Palm OS Space Trader game, extracted from the C source code analysis.

## Ship Types

The game includes 10 basic ship types plus 5 special ships. Each ship has the following characteristics:

### Ship Properties (from `SHIPTYPE` structure)
- **CargoBays**: Base cargo storage capacity
- **WeaponSlots**: Number of weapon hardpoints
- **ShieldSlots**: Number of shield generators  
- **GadgetSlots**: Number of gadget/utility slots
- **CrewQuarters**: Maximum crew members
- **FuelTanks**: Base fuel capacity (parsecs)
- **MinTechLevel**: Required tech level to purchase
- **CostOfFuel**: Cost per parsec of fuel
- **Price**: Base purchase price
- **Bounty**: Base bounty value
- **Occurrence**: Encounter frequency percentage
- **HullStrength**: Maximum hull points
- **Police/Pirates/Traders**: Encounter strength ratings
- **RepairCosts**: Cost per hull point repair
- **Size**: Hit probability modifier

### Ship Type Data
```c
// From Global.c - Ship definitions
{ "Flea",          10, 0, 0, 0, 1, MAXRANGE, 4,  1,   2000,   5,  2,  25, -1, -1,  0, 1, 0 },
{ "Gnat",          15, 1, 0, 1, 1, 14,       5,  2,  10000,  50, 28, 100,  0,  0,  0, 1, 1 },
{ "Firefly",       20, 1, 1, 1, 1, 17,       5,  3,  25000,  75, 20, 100,  0,  0,  0, 1, 1 },
{ "Mosquito",      15, 2, 1, 1, 1, 13,       5,  5,  30000, 100, 20, 100,  0,  1,  0, 1, 1 },
{ "Bumblebee",     25, 1, 2, 2, 2, 15,       5,  7,  60000, 125, 15, 100,  1,  1,  0, 1, 2 },
{ "Beetle",        50, 0, 1, 1, 3, 14,       5, 10,  80000,  50,  3,  50, -1, -1,  0, 1, 2 },
{ "Hornet",        20, 3, 2, 1, 2, 16,       6, 15, 100000, 200,  6, 150,  2,  3,  1, 2, 3 },
{ "Grasshopper",   30, 2, 2, 3, 3, 15,       6, 15, 150000, 300,  2, 150,  3,  4,  2, 3, 3 },
{ "Termite",       60, 1, 3, 2, 3, 13,       7, 20, 225000, 300,  2, 200,  4,  5,  3, 4, 4 },
{ "Wasp",          35, 3, 2, 2, 3, 14,       7, 20, 300000, 500,  2, 200,  5,  6,  4, 5, 4 },
```

## Equipment Types

### Weapons
```c
{ "Pulse laser",    15,  2000, 5, 50 },  // Power: 15, Price: 2000, TechLevel: 5, Chance: 50
{ "Beam laser",     25, 12500, 6, 35 },  // Power: 25, Price: 12500, TechLevel: 6, Chance: 35
{ "Military laser", 35, 35000, 7, 15 },  // Power: 35, Price: 35000, TechLevel: 7, Chance: 15
{ "Morgan's laser", 85, 50000, 8,  0 },  // Special weapon - cannot be purchased
```

### Shields  
```c
{ "Energy shield",      100,  5000, 5, 70 },  // Power: 100, Price: 5000, TechLevel: 5, Chance: 70
{ "Reflective shield",  200, 20000, 6, 30 },  // Power: 200, Price: 20000, TechLevel: 6, Chance: 30
{ "Lightning shield",   350, 45000, 8,  0 },  // Special shield - cannot be purchased
```

### Gadgets
```c
{ "5 extra cargo bays",  2500, 4, 35 },  // +5 cargo bays, Price: 2500, TechLevel: 4, Chance: 35
{ "Auto-repair system",  7500, 5, 20 },  // Enhances engineer skill, Price: 7500, TechLevel: 5, Chance: 20
{ "Navigating system",  15000, 6, 20 },  // Enhances pilot skill, Price: 15000, TechLevel: 6, Chance: 20
{ "Targeting system",   25000, 6, 20 },  // Enhances fighter skill, Price: 25000, TechLevel: 6, Chance: 20
{ "Cloaking device",   100000, 7,  5 },  // Avoids detection, Price: 100000, TechLevel: 7, Chance: 5
{ "Fuel compactor",     30000, 8,  0 },  // +4 fuel capacity - special gadget
```

## Equipment Rules & Constraints

### Purchase Validation (`BuyItem` function)
1. **Tech Level Check**: Equipment tech level ≤ current system tech level
2. **Credit Check**: Player has sufficient credits (and no debt)
3. **Slot Check**: Ship has empty slots of correct type
4. **Duplicate Check**: Some gadgets (except extra cargo bays) can only be owned once

### Pricing Formulas

#### Purchase Prices
```c
#define BASEWEAPONPRICE(a) (BasePrice(Weapontype[a].TechLevel, Weapontype[a].Price))
#define BASESHIELDPRICE(a) (BasePrice(Shieldtype[a].TechLevel, Shieldtype[a].Price))
#define BASEGADGETPRICE(a) (BasePrice(Gadgettype[a].TechLevel, Gadgettype[a].Price))
#define BASESHIPPRICE(a) (((Shiptype[a].Price * (100 - TraderSkill(&Ship))) / 100))

long BasePrice(char ItemTechLevel, long Price) {
    return ((ItemTechLevel > CURSYSTEM.TechLevel) ? 0 : 
        ((Price * (100 - TraderSkill(&Ship))) / 100));
}
```

#### Sell Prices
```c
#define WEAPONSELLPRICE(a) (BaseSellPrice(Ship.Weapon[a], Weapontype[Ship.Weapon[a]].Price))
#define SHIELDSELLPRICE(a) (BaseSellPrice(Ship.Shield[a], Shieldtype[Ship.Shield[a]].Price))
#define GADGETSELLPRICE(a) (BaseSellPrice(Ship.Gadget[a], Gadgettype[Ship.Gadget[a]].Price))

long BaseSellPrice(int Index, long Price) {
    return (Index >= 0 ? ((Price * 3) / 4) : 0);  // 75% of base price
}
```

### Ship Purchase Validation
1. **Tech Level**: System tech level ≥ ship's minimum tech level
2. **Credits**: Sufficient funds (including transfer costs for special equipment)
3. **Debt**: Cannot buy ships while in debt
4. **Crew Capacity**: New ship must have enough quarters for current crew
5. **Special Equipment Transfer**: 
   - Lightning Shield: Costs extra 30,000 credits to transfer
   - Fuel Compactor: Costs extra 20,000 credits to transfer  
   - Morgan's Laser: Costs extra 33,333 credits to transfer
6. **Quest Restrictions**: Cannot sell ship while carrying reactor (ReactorStatus > 0 && < 21)

## Fuel System

### Fuel Capacity Calculation
```c
char GetFuelTanks(void) {
    return (HasGadget(&Ship, FUELCOMPACTOR) ? 18 : Shiptype[Ship.Type].FuelTanks);
}
```
- Base capacity from ship type
- Fuel Compactor adds +4 parsecs (18 total instead of 14 for most ships)

### Fuel Purchase
```c
void BuyFuel(int Amount) {
    int MaxFuel = (GetFuelTanks() - GetFuel()) * Shiptype[Ship.Type].CostOfFuel;
    if (Amount > MaxFuel) Amount = MaxFuel;
    if (Amount > Credits) Amount = Credits;
    
    int Parsecs = Amount / Shiptype[Ship.Type].CostOfFuel;
    Ship.Fuel += Parsecs;
    Credits -= Parsecs * Shiptype[Ship.Type].CostOfFuel;
}
```

## Hull & Repair System

### Hull Strength Calculation
```c
long GetHullStrength(void) {
    if (ScarabStatus == 3)  // Hardened hull upgrade
        return Shiptype[Ship.Type].HullStrength + UPGRADEDHULL;  // +50
    else
        return Shiptype[Ship.Type].HullStrength;
}
```

### Repair Mechanics
```c
void BuyRepairs(int Amount) {
    int MaxRepairs = (GetHullStrength() - Ship.Hull) * Shiptype[Ship.Type].RepairCosts;
    if (Amount > MaxRepairs) Amount = MaxRepairs;
    if (Amount > Credits) Amount = Credits;
    
    int Percentage = Amount / Shiptype[Ship.Type].RepairCosts;
    Ship.Hull += Percentage;
    Credits -= Percentage * Shiptype[Ship.Type].RepairCosts;
}
```

## Cargo System

### Cargo Bay Calculation
```c
int TotalCargoBays(void) {
    int Bays = Shiptype[Ship.Type].CargoBays;
    
    // Add extra cargo bays from gadgets
    for (int i = 0; i < MAXGADGET; ++i)
        if (Ship.Gadget[i] == EXTRABAYS)
            Bays += 5;
    
    // Quest penalties
    if (JaporiDiseaseStatus == 1)
        Bays -= 10;
    if (ReactorStatus > 0 && ReactorStatus < 21)
        Bays -= (5 + 10 - (ReactorStatus - 1)/2);
    
    return Bays;
}
```

### Special Equipment Constraints

#### Extra Cargo Bay Selling
- When selling extra cargo bays gadget, must have at least 5 empty cargo spaces
- Formula: `FilledCargoBays() <= TotalCargoBays() - 5`

## Utility Functions

### Equipment Detection
```c
Boolean HasGadget(SHIP* Sh, char Gg);     // Check if ship has specific gadget
Boolean HasShield(SHIP* Sh, char Gg);     // Check if ship has specific shield  
Boolean HasWeapon(SHIP* Sh, char Gg, Boolean exactMatch);  // Check if ship has weapon (exact or better)
```

### Slot Management
```c
int GetFirstEmptySlot(char Slots, int* Item);  // Find first empty equipment slot
Boolean AnyEmptySlots(SHIP *ship);             // Check if any slots are empty
```

## Combat Modifiers

Equipment affects combat effectiveness:
- **Weapons**: Raw damage power values (15, 25, 35, 85)
- **Shields**: Raw protection power values (100, 200, 350) 
- **Targeting System**: Enhances fighter skill for weapon accuracy
- **Auto-repair**: Enhances engineer skill for hull maintenance
- **Navigating System**: Enhances pilot skill for evasion
- **Cloaking Device**: Allows avoiding encounters entirely

## Key Constants

```c
#define MAXWEAPON 3        // Maximum weapons per ship
#define MAXSHIELD 3        // Maximum shields per ship  
#define MAXGADGET 3        // Maximum gadgets per ship
#define MAXWEAPONTYPE 3    // Number of purchasable weapon types
#define MAXSHIELDTYPE 2    // Number of purchasable shield types
#define MAXGADGETTYPE 5    // Number of purchasable gadget types
#define UPGRADEDHULL 50    // Hull strength bonus from hardening
```
