# Palm OS Space Trader Core System Architecture Analysis

## System Constants & Configuration

### Difficulty Levels
- **BEGINNER (0)**: Easy game mode
- **EASY (1)**: Low difficulty
- **NORMAL (2)**: Standard difficulty  
- **HARD (3)**: High difficulty
- **IMPOSSIBLE (4)**: Maximum difficulty

**Logic Rules:**
- `MAXDIFFICULTY = 5` (total difficulty levels)
- Difficulty affects pricing, encounters, and game mechanics
- Used in price calculations: `BASESHIPPRICE` macro considers difficulty

### Trade Items & Economy
- **MAXTRADEITEM = 10**: Water, Furs, Food, Ore, Games, Firearms, Medicine, Machinery, Narcotics, Robots
- **MAXDIGITS = 8**: Maximum credits 99,999,999
- **MAXPRICEDIGITS = 5**: Maximum price 99,999
- **MAXQTYDIGITS = 3**: Maximum quantity 999

**Validation Rules:**
- Credits must be ≤ 99,999,999
- Individual prices must be ≤ 99,999
- Quantities must be ≤ 999

### Ship Configuration
- **MAXSHIPTYPE = 10**: Base ship types
- **EXTRASHIPS = 5**: Additional special ships
- **MAXWEAPON = 3**: Maximum weapons per ship
- **MAXSHIELD = 3**: Maximum shields per ship  
- **MAXGADGET = 3**: Maximum gadgets per ship
- **MAXCREW = 3**: Maximum crew per ship
- **MAXTRIBBLES = 100,000**: Maximum tribbles

**Constraints:**
- Ship arrays must not exceed defined maximums
- Special ships (MANTISTYPE, SCARABTYPE, BOTTLETYPE) have indices > MAXSHIPTYPE

### Galaxy & Systems
- **MAXSOLARSYSTEM = 120**: Total solar systems
- **GALAXYWIDTH = 150**: Galaxy width coordinate
- **GALAXYHEIGHT = 110**: Galaxy height coordinate
- **MINDISTANCE = 6**: Minimum distance between systems
- **CLOSEDISTANCE = 13**: Close distance threshold
- **MAXWORMHOLE = 6**: Maximum wormholes

**Spatial Validation:**
- System coordinates must be within galaxy bounds
- Minimum distance enforced between systems
- Wormhole connections validated

## Data Structure Relationships

### Core Ship Structure (SHIP)
```c
typedef struct {
    Byte Type;                    // Ship type index
    int Cargo[MAXTRADEITEM];      // Cargo hold contents
    int Weapon[MAXWEAPON];        // Weapon slots (-1 = empty)
    int Shield[MAXSHIELD];        // Shield slots (-1 = empty)
    long ShieldStrength[MAXSHIELD]; // Current shield strength
    int Gadget[MAXGADGET];        // Gadget slots (-1 = empty)
    int Crew[MAXCREW];            // Crew member indices (-1 = empty)
    Byte Fuel;                    // Current fuel level
    long Hull;                    // Current hull strength
    long Tribbles;                // Tribble count
    long ForFutureUse[4];         // Reserved space
} SHIP;
```

**Validation Rules:**
- Type must be valid ship type index
- Cargo quantities ≥ 0 and ≤ ship cargo capacity
- Weapon/Shield/Gadget indices must be valid or -1
- Crew indices must be valid mercenary indices or -1
- Fuel ≤ ship's fuel tank capacity
- Hull ≤ ship's maximum hull strength
- Tribbles ≥ 0 and ≤ MAXTRIBBLES

### Solar System Structure (SOLARSYSTEM)
```c
typedef struct {
    Byte NameIndex;              // System name index
    Byte TechLevel;              // Technology level (0-7)
    Byte Politics;               // Government type
    Byte Status;                 // Special events (war, plague, etc.)
    Byte X, Y;                   // Galaxy coordinates
    Byte SpecialResources;       // Resource type
    Byte Size;                   // System size (0-4)
    int Qty[MAXTRADEITEM];       // Available quantities
    Byte CountDown;              // Price reset countdown
    Boolean Visited;             // Has been visited
    int Special;                 // Special quest event
} SOLARSYSTEM;
```

**Validation Rules:**
- TechLevel must be 0-7 (MAXTECHLEVEL)
- Politics must be valid government index (0-16)
- Status must be valid event type (0-7)
- Coordinates within galaxy bounds
- SpecialResources must be valid resource type
- Size must be 0-4 (MAXSIZE)
- Quantities ≥ 0

### Trade Item Configuration (TRADEITEM)
```c
typedef struct {
    char* Name;
    Byte TechProduction;         // Tech needed to produce
    Byte TechUsage;              // Tech needed to use  
    Byte TechTopProduction;      // Optimal production tech
    int PriceLowTech;            // Base price low tech
    int PriceInc;                // Price increase per tech
    int Variance;                // Price variance %
    int DoublePriceStatus;       // Event causing price spike
    int CheapResource;           // Resource making it cheap
    int ExpensiveResource;       // Resource making it expensive
    int MinTradePrice;           // Min orbital trade price
    int MaxTradePrice;           // Max orbital trade price
    int RoundOff;                // Price rounding factor
} TRADEITEM;
```

## Business Logic & Conditions

### Police Record System
```c
#define PSYCHOPATHSCORE -70    // Psychopath threshold
#define VILLAINSCORE    -30    // Villain threshold  
#define CRIMINALSCORE   -10    // Criminal threshold
#define DUBIOUSSCORE    -5     // Dubious threshold
#define CLEANSCORE       0     // Clean record
#define LAWFULSCORE      5     // Lawful citizen
#define TRUSTEDSCORE     10    // Trusted citizen
#define HELPERSCORE      25    // Helper status
#define HEROSCORE        75    // Hero status
```

**Logic Conditions:**
- Police strength scales with record: `STRENGTHPOLICE` macro
- Psychopaths face 3x police strength
- Villains face 2x police strength
- Clean+ records face normal strength

### Encounter System Logic
**Police Encounters (0-9):**
- POLICEINSPECTION (0): Submit for inspection
- POLICEIGNORE (1): Police ignore you
- POLICEATTACK (2): Police attack on sight
- POLICEFLEE (3): Police flee

**Pirate Encounters (10-19):**
- PIRATEATTACK (10): Pirates attack
- PIRATEFLEE (11): Pirates flee
- PIRATEIGNORE (12): Pirates ignore (cloaked)
- PIRATESURRENDER (13): Pirates surrender

**Trader Encounters (20-29):**
- TRADERIGNORE (20): Trader passes by
- TRADERFLEE (21): Trader flees
- TRADERATTACK (22): Trader attacks (provoked)
- TRADERSURRENDER (23): Trader surrenders
- TRADERSELL (24): Trader sells cargo
- TRADERBUY (25): Trader buys cargo

**Validation Guards:**
```c
#define ENCOUNTERPOLICE(a)   ((a) >= POLICE && (a) <= MAXPOLICE)
#define ENCOUNTERPIRATE(a)   ((a) >= PIRATE && (a) <= MAXPIRATE)  
#define ENCOUNTERTRADER(a)   ((a) >= TRADER && (a) <= MAXTRADER)
#define ENCOUNTERMONSTER(a)  ((a) >= SPACEMONSTERATTACK && (a) <= MAXSPACEMONSTER)
```

### Status Effects & Events
**System Status Events:**
- WAR (1): Ore and weapons in high demand
- PLAGUE (2): Medicine in high demand
- DROUGHT (3): Water in high demand
- BOREDOM (4): Games and narcotics in high demand
- COLD (5): Furs in high demand
- CROPFAILURE (6): Food in high demand
- LACKOFWORKERS (7): Machinery and robots in high demand

### Equipment & Pricing Logic
**Weapon Types:**
- PULSELASERWEAPON (0): Power 15, Price 2000, Tech 5
- BEAMLASERWEAPON (1): Power 25, Price 12500, Tech 6
- MILITARYLASERWEAPON (2): Power 35, Price 35000, Tech 7
- MORGANLASERWEAPON (3): Power 85, Price 50000, Tech 8

**Shield Types:**
- ENERGYSHIELD (0): Power 100, Price 5000, Tech 5
- REFLECTIVESHIELD (1): Power 200, Price 20000, Tech 6
- LIGHTNINGSHIELD (2): Power 350, Price 45000, Tech 8

### Debt & Credit System
```c
#define DEBTWARNING   75000    // Debt warning threshold
#define DEBTTOOLARGE  100000   // Maximum debt before consequences
```

**Validation Rules:**
- Debt warnings at 75,000 credits
- Game over conditions at 100,000+ debt
- Interest calculations apply daily

### Quest & Special Event System
**Fixed Location Events (0-6):**
- DRAGONFLYDESTROYED (0): Dragonfly ship destroyed
- FLYBARATAS (1): Fly to Baratas system
- FLYMELINA (2): Fly to Melina system
- FLYREGULAS (3): Fly to Regulas system
- MONSTERKILLED (4): Space monster killed
- MEDICINEDELIVERY (5): Medicine delivery quest
- MOONBOUGHT (6): Moon purchase available

**Variable Events (7+):**
- MOONFORSALE (7): Moon available for purchase
- SKILLINCREASE (8): Skill point increase
- TRIBBLE (9): Tribble infestation
- SPACEMONSTER (12): Space monster encounter
- DRAGONFLY (13): Dragonfly encounter

## Global State Management

### Save Game Structure (SAVEGAMETYPE)
**Critical State Variables:**
- Credits, Debt, Days: Economic state
- Ship, Opponent: Ship configurations
- Mercenary[MAXCREWMEMBER+1]: Crew roster
- SolarSystem[MAXSOLARSYSTEM]: Galaxy state
- Various quest status flags

**State Validation:**
- Version compatibility checks
- Data integrity verification
- Range validation for all numeric fields

### Initialization Logic (from Global.c)
**Default Ship Configuration:**
```c
SHIP Ship = {
    1,                                     // Gnat ship type
    { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 },      // Empty cargo
    {  0, -1, -1 },                        // One pulse laser
    { -1, -1, -1 },{ 0,0,0 },              // No shields
    { -1, -1, -1 },                        // No gadgets
    {  0, -1, -1 },                        // Commander only
    14,                                    // Full fuel tank
    100,                                   // Full hull
    0,                                     // No tribbles
    { 0, 0, 0, 0 }                         // Future use
};
```

**Default Game State:**
- Credits = 1000
- Debt = 0
- Days = 0
- Difficulty = NORMAL (2)
- All status flags = 0/false

## Utility Macros & Functions

### Mathematical Operations
```c
#define min(a, b) ((a) <= (b) ? (a) : (b))
#define max(a, b) ((a) >= (b) ? (a) : (b))
#define ABS(a) ((a) < 0 ? (-(a)) : (a))
#define SQR(a) ((a) * (a))
```

### Game State Macros
```c
#define COMMANDER Mercenary[0]              // Commander is first mercenary
#define CURSYSTEM SolarSystem[COMMANDER.CurSystem] // Current system
#define GetRandom(a) (SysRandom(0)%(a))    // Random number generator
```

### Pricing Calculations
```c
#define BASEWEAPONPRICE(a) (BasePrice(Weapontype[a].TechLevel, Weapontype[a].Price))
#define BASESHIELDPRICE(a) (BasePrice(Shieldtype[a].TechLevel, Shieldtype[a].Price))
#define BASEGADGETPRICE(a) (BasePrice(Gadgettype[a].TechLevel, Gadgettype[a].Price))
#define BASESHIPPRICE(a) (((Shiptype[a].Price * (100 - TraderSkill(&Ship))) / 100))
```

### Equipment Validation
```c
#define WEAPONSELLPRICE(a) (BaseSellPrice(Ship.Weapon[a], Weapontype[Ship.Weapon[a]].Price))
#define SHIELDSELLPRICE(a) (BaseSellPrice(Ship.Shield[a], Shieldtype[Ship.Shield[a]].Price))
#define GADGETSELLPRICE(a) (BaseSellPrice(Ship.Gadget[a], Gadgettype[Ship.Gadget[a]].Price))
```

## Key Validation Points for TypeScript Implementation

1. **Range Validation**: All numeric values must respect their defined maximums
2. **Array Bounds**: All array accesses must be bounds-checked
3. **State Consistency**: Ship equipment must match ship capabilities
4. **Economic Logic**: Credit/debt calculations must prevent overflow
5. **Quest Dependencies**: Special events must follow proper sequences
6. **Equipment Compatibility**: Tech level requirements must be enforced
7. **Spatial Constraints**: Galaxy coordinates and distances must be valid
8. **Resource Management**: Cargo/fuel/hull limits must be respected
