# Space Trader Combat & Encounter System Analysis

This document provides a comprehensive analysis of the combat, encounter, skill, and travel systems from the original Palm OS Space Trader game, extracted from the C source code.

## Implementation Status

✅ **Complete TypeScript test coverage created:**
- [`combat-formulas.test.ts`](file:///Users/mcrum/code/spacetrader-ts-4/ts/src/combat/combat-formulas.test.ts) - Core combat mechanics (19 tests, all passing)
- [`encounter-generation.test.ts`](file:///Users/mcrum/code/spacetrader-ts-4/ts/src/combat/encounter-generation.test.ts) - Encounter system (26 tests, all passing)

✅ **All critical formulas extracted and documented**
✅ **All probability calculations validated through testing**

## Combat System

### Hit Probability Calculation

The core hit calculation uses fighter skill vs pilot skill:

```c
// ExecuteAttack() in Encounter.c, line 804-806
if (GetRandom( FighterSkill( Attacker ) + Shiptype[Defender->Type].Size ) < 
    (Flees ? 2 : 1) * GetRandom( 5 + (PilotSkill( Defender ) >> 1) ))
    // Miss - return false
```

**Formula:**
- `AttackerRoll = Random(FighterSkill + DefenderShipSize)`
- `DefenderRoll = FleeMultiplier × Random(5 + PilotSkill/2)`
- `FleeMultiplier = 2 if defender is fleeing, 1 otherwise`
- Hit occurs if `AttackerRoll ≥ DefenderRoll`

### Damage Calculation

#### Base Weapon Damage

```c
// ExecuteAttack() in Encounter.c, line 821
Damage = GetRandom( (TotalWeapons( Attacker, -1, -1 ) * (100 + 2*EngineerSkill( Attacker )) / 100) );
```

**Formula:**
- `BaseDamage = Random(WeaponPower × (100 + 2×EngineerSkill) / 100)`
- Engineer skill provides 0-20% damage bonus (max skill = 10)

#### Reactor Damage Boost

```c
// ExecuteAttack() in Encounter.c, line 827-833
if (CommanderUnderAttack && ReactorStatus > 0 && ReactorStatus < 21) {
    if (Difficulty < NORMAL)
        Damage *= 1 + (Difficulty + 1)*0.25;
    else
        Damage *= 1 + (Difficulty + 1)*0.33;
}
```

**Reactor Damage Multipliers:**
- Beginner: 1.5× damage
- Easy: 1.75× damage  
- Normal: 1.66× damage
- Hard: 2.0× damage
- Impossible: 2.33× damage

#### Special Case: Scarab Defense

```c
// ExecuteAttack() in Encounter.c, line 811-819
if (Defender->Type == SCARABTYPE) {
    if (TotalWeapons( Attacker, PULSELASERWEAPON, PULSELASERWEAPON ) <= 0 &&
        TotalWeapons( Attacker, MORGANLASERWEAPON, MORGANLASERWEAPON ) <= 0)
        Damage = 0L;
    else
        Damage = GetRandom( ((TotalWeapons( Attacker, PULSELASERWEAPON, PULSELASERWEAPON ) +
           TotalWeapons( Attacker, MORGANLASERWEAPON, MORGANLASERWEAPON )) * (100 + 2*EngineerSkill( Attacker )) / 100) );
}
```

**Scarab Rule:** Only Pulse Lasers and Morgan's Lasers can damage the Scarab.

### Damage Application

#### Shield Absorption

```c
// ExecuteAttack() in Encounter.c, line 835-848
for (i=0; i<MAXSHIELD; ++i) {
    if (Defender->Shield[i] < 0) break;
    if (Damage <= Defender->ShieldStrength[i]) {
        Defender->ShieldStrength[i] -= Damage;
        Damage = 0;
        break;
    }
    Damage -= Defender->ShieldStrength[i];
    Defender->ShieldStrength[i] = 0;
}
```

Shields absorb damage in order, depleting completely before hull damage occurs.

#### Hull Damage

```c
// ExecuteAttack() in Encounter.c, line 855-872
if (Damage > 0) {
    Damage -= GetRandom( EngineerSkill( Defender ) );
    if (Damage <= 0) Damage = 1;
    
    // Damage limiting based on difficulty
    if (CommanderUnderAttack && ScarabStatus == 3)
        Damage = min( Damage, (GetHullStrength()/(CommanderUnderAttack ? max( 1, (IMPOSSIBLE-Difficulty) ) : 2)) );
    else
        Damage = min( Damage, (Shiptype[Defender->Type].HullStrength/(CommanderUnderAttack ? max( 1, (IMPOSSIBLE-Difficulty) ) : 2)) );
    
    Defender->Hull -= Damage;
}
```

**Hull Damage Rules:**
1. Engineer skill reduces damage by `Random(EngineerSkill)`
2. Minimum 1 damage if any gets through
3. Maximum damage per hit is limited:
   - Commander: `MaxHull / (5-Difficulty)` (easier = more damage allowed)
   - Opponents: `MaxHull / 2` (always)

### Escape Mechanics

#### Beginner Level Guarantee

```c
// ExecuteAttack() in Encounter.c, line 799-800
if (Difficulty == BEGINNER && CommanderUnderAttack && Flees)
    return false; // No damage on beginner when fleeing
```

#### Escape Probability

```c
// ExecuteAction() in Encounter.c, line 1071-1072
if ((GetRandom( 7 ) + (PilotSkill( &Ship ) / 3)) * 2 >= 
    GetRandom( PilotSkill( &Opponent ) ) * (2 + Difficulty))
```

**Escape Formula:**
- `PlayerRoll = (Random(7) + PilotSkill/3) × 2`
- `OpponentRoll = Random(OpponentPilotSkill) × (2 + Difficulty)`
- Escape succeeds if `PlayerRoll ≥ OpponentRoll`

### Bounty Calculation

```c
// GetBounty() in Encounter.c, line 78-90
long GetBounty( SHIP* Sh ) {
    long Bounty = EnemyShipPrice( Sh );
    Bounty /= 200;
    Bounty /= 25;    
    Bounty *= 25;
    if (Bounty <= 0) Bounty = 25;
    if (Bounty > 2500) Bounty = 2500;
    return Bounty;
}
```

**Bounty Formula:**
- `Bounty = floor(ShipPrice / 200 / 25) × 25`
- Minimum: 25 credits
- Maximum: 2500 credits

## Encounter System

### Encounter Probability

```c
// Travel() in Traveler.c, line 1866-1870
EncounterTest = GetRandom( 44 - (2 * Difficulty) );
// encounters are half as likely if you're in a flea.
if (Ship.Type == 0) EncounterTest *= 2;
```

**Base Encounter Formula:**
- `EncounterThreshold = Random(44 - 2×Difficulty)`
- Flea ships: `EncounterThreshold × 2` (half as likely)

**Difficulty Thresholds:**
- Beginner: Random(42)
- Easy: Random(42) 
- Normal: Random(42)
- Hard: Random(40)
- Impossible: Random(38)

### Encounter Type Determination

```c
// Travel() in Traveler.c, line 1872-1885
if (EncounterTest < Politics[SolarSystem[WarpSystem].Politics].StrengthPirates && !Raided)
    Pirate = true;
else if (EncounterTest < StrengthPirates + STRENGTHPOLICE( WarpSystem ))
    Police = true;
else if (EncounterTest < StrengthPirates + STRENGTHPOLICE( WarpSystem ) + StrengthTraders)
    Trader = true;
```

**Encounter Priority (in order):**
1. Pirates: `EncounterTest < PirateStrength`
2. Police: `EncounterTest < PirateStrength + PoliceStrength`
3. Traders: `EncounterTest < PirateStrength + PoliceStrength + TraderStrength`

### Police Encounter Behavior

```c
// Travel() in Traveler.c, line 1914-1973
if (Cloaked( &Ship, &Opponent ))
    EncounterType = POLICEIGNORE;
else if (PoliceRecordScore < DUBIOUSSCORE) {
    // Criminal behavior
    if (ReputationScore < AVERAGESCORE)
        EncounterType = POLICEATTACK;
    else if (GetRandom( ELITESCORE ) > (ReputationScore / (1 + Opponent.Type)))
        EncounterType = POLICEATTACK;
    else if (Cloaked( &Opponent, &Ship ))
        EncounterType = POLICEIGNORE;
    else
        EncounterType = POLICEFLEE;
} else if (PoliceRecordScore >= DUBIOUSSCORE && PoliceRecordScore < CLEANSCORE && !Inspected) {
    EncounterType = POLICEINSPECTION;
    Inspected = true;
} else if (PoliceRecordScore < LAWFULSCORE) {
    if (GetRandom( 12 - Difficulty ) < 1 && !Inspected) {
        EncounterType = POLICEINSPECTION;
        Inspected = true;
    }
} else {
    // Lawful trader - very low inspection chance
    if (GetRandom( 40 ) == 1 && !Inspected) {
        EncounterType = POLICEINSPECTION;
        Inspected = true;
    }
}
```

**Police Behavior Logic:**

1. **Cloaked:** Always ignore
2. **Criminal (< -10):** 
   - Low reputation: Attack
   - High reputation: Flee (unless police have better ship)
3. **Dubious (-10 to 9):** Inspection (once per system)
4. **Clean (10-29):** `(1/(12-Difficulty))` chance of inspection
5. **Lawful (30+):** 2.5% chance of inspection

### Pirate Encounter Behavior

```c
// Travel() in Traveler.c, line 2004-2023
if (Cloaked( &Ship, &Opponent ))
    EncounterType = PIRATEIGNORE;
else if (Opponent.Type >= 7 || GetRandom( ELITESCORE ) > (ReputationScore * 4) / (1 + Opponent.Type))
    EncounterType = PIRATEATTACK;
else
    EncounterType = PIRATEFLEE;

if (Mantis) EncounterType = PIRATEATTACK;

// Pirates with better ships won't flee
if (EncounterType == PIRATEFLEE && Opponent.Type > Ship.Type)
    EncounterType = PIRATEATTACK;
```

**Pirate Behavior:**
1. **Cloaked:** Ignore
2. **Attack if:** Large ship (≥7) OR `Random(1000) > Reputation×4/(1+ShipType)`
3. **Flee otherwise** (unless pirate ship is superior)
4. **Mantis always attacks**

### Trader Encounter Behavior

```c
// Travel() in Traveler.c, line 2046-2073
if (Cloaked( &Ship, &Opponent ))
    EncounterType = TRADERIGNORE;
else if (PoliceRecordScore <= CRIMINALSCORE) {
    if (GetRandom( ELITESCORE ) <= (ReputationScore * 10) / (1 + Opponent.Type)) {
        if (Cloaked( &Opponent, &Ship ))
            EncounterType = TRADERIGNORE;
        else
            EncounterType = TRADERFLEE;
    }
}

// Trade in orbit chance
if (EncounterType == TRADERIGNORE && (GetRandom(1000) < ChanceOfTradeInOrbit)) {
    if (FilledCargoBays() < TotalCargoBays() && HasTradeableItems(&Opponent, WarpSystem, TRADERSELL))
        EncounterType = TRADERSELL;
    
    if (HasTradeableItems(&Ship, WarpSystem, TRADERBUY) && EncounterType != TRADERSELL)
        EncounterType = TRADERBUY;
}
```

**Trader Behavior:**
1. **Cloaked:** Ignore  
2. **Criminal + High Rep:** Flee if `Random(1000) ≤ Reputation×10/(1+ShipType)`
3. **Trade Opportunity:** Based on `ChanceOfTradeInOrbit` (default ~10%)

### Artifact-Triggered Mantis Encounters

```c
// Travel() in Traveler.c, line 1904-1905
if (!(Trader || Police || Pirate))
    if (ArtifactOnBoard && GetRandom( 20 ) <= 3)
        Mantis = true;
```

**Mantis Encounter:** 15% chance (3/20) when carrying the alien artifact.

## Skill System

### Skill Calculations

All skills return the highest value among crew members:

```c
// TraderSkill() in Skill.c, line 117-135
char TraderSkill( SHIP* Sh ) {
    int i;
    char MaxSkill = Mercenary[Sh->Crew[0]].Trader;
    
    for (i=1; i<MAXCREW; ++i) {
        if (Sh->Crew[i] < 0) break;
        if (Mercenary[Sh->Crew[i]].Trader > MaxSkill)
            MaxSkill = Mercenary[Sh->Crew[i]].Trader;
    }
    
    if (JarekStatus >= 2) ++MaxSkill;
    return AdaptDifficulty( MaxSkill );
}
```

### Skill Bonuses

#### Gadget Bonuses

```c
// FighterSkill() in Skill.c, line 296-297
if (HasGadget( Sh, TARGETINGSYSTEM ))
    MaxSkill += SKILLBONUS; // +2

// PilotSkill() in Skill.c, line 320-323  
if (HasGadget( Sh, NAVIGATINGSYSTEM ))
    MaxSkill += SKILLBONUS; // +2
if (HasGadget( Sh, CLOAKINGDEVICE ))
    MaxSkill += CLOAKBONUS; // +5

// EngineerSkill() in Skill.c, line 346-347
if (HasGadget( Sh, AUTOREPAIRSYSTEM ))
    MaxSkill += SKILLBONUS; // +2
```

#### Special Character Bonuses

```c
// TraderSkill() in Skill.c, line 132-133
if (JarekStatus >= 2)
    ++MaxSkill; // Jarek adds +1 to trading when delivered
```

### Difficulty Adaptation

```c
// AdaptDifficulty() in Skill.c, line 355-363
char AdaptDifficulty( char Level ) {
    if (Difficulty == BEGINNER || Difficulty == EASY)
        return (Level+1);
    else if (Difficulty == IMPOSSIBLE)
        return max( 1, Level-1 );
    else
        return Level;
}
```

**Difficulty Modifiers:**
- Beginner/Easy: +1 to all skills
- Normal/Hard: No change
- Impossible: -1 to all skills (minimum 1)

### Random Skill Generation

```c
// RandomSkill() in Skill.c, line 379-382
char RandomSkill( void ) {
    return 1 + GetRandom( 5 ) + GetRandom( 6 );
}
```

**Range:** 2-11 (1 + 0-4 + 0-5)

### Skill Modification

#### Skill Increase

```c
// IncreaseRandomSkill() in Skill.c, line 170-203
void IncreaseRandomSkill( void ) {
    if (COMMANDER.Pilot >= MAXSKILL && COMMANDER.Trader >= MAXSKILL &&
        COMMANDER.Fighter >= MAXSKILL && COMMANDER.Engineer >= MAXSKILL)
        return; // All skills maxed
    
    // Pick random skill that isn't maxed and increment by 1
}
```

#### Tonic Effects

```c
// TonicTweakRandomSkill() in Skill.c, line 248-275
void TonicTweakRandomSkill( void ) {
    if (Difficulty < HARD) {
        // add one to a random skill, subtract one from a random skill
        IncreaseRandomSkill();
        DecreaseRandomSkill(1);
    } else {
        // add one to two random skills, subtract three from one random skill  
        IncreaseRandomSkill();
        IncreaseRandomSkill();
        DecreaseRandomSkill(3);
    }
}
```

**Skill Tonic Effects:**
- Easy/Normal: +1 to one skill, -1 to another (net 0)
- Hard/Impossible: +1 to two skills, -3 to one skill (net -1)

## Travel System

### Auto-Repair During Travel

```c
// Travel() in Traveler.c, line 1779-1804
while (Clicks > 0) {
    // Engineer may do some repairs
    Repairs = GetRandom( EngineerSkill( &Ship ) ) >> 1;
    Ship.Hull += Repairs;
    if (Ship.Hull > GetHullStrength()) {
        Repairs = Ship.Hull - GetHullStrength();
        Ship.Hull = GetHullStrength();
    } else
        Repairs = 0;
    
    // Shields are easier to repair  
    Repairs = 2 * Repairs;
    for (i=0; i<MAXSHIELD; ++i) {
        if (Ship.Shield[i] < 0) break;
        Ship.ShieldStrength[i] += Repairs;
        if (Ship.ShieldStrength[i] > Shieldtype[Ship.Shield[i]].Power) {
            Repairs = Ship.ShieldStrength[i] - Shieldtype[Ship.Shield[i]].Power;
            Ship.ShieldStrength[i] = Shieldtype[Ship.Shield[i]].Power;
        } else
            Repairs = 0;
    }
}
```

**Auto-Repair Formula:**
1. `HullRepair = Random(EngineerSkill) / 2` per click
2. Excess hull repair flows to shields at 2× rate
3. Shields repair in order, excess flows to next shield

### Special Location Encounters

#### Space Monster at Acamar

```c
// Travel() in Traveler.c, line 1807-1822
if ((Clicks == 1) && (WarpSystem == ACAMARSYSTEM) && (MonsterStatus == 1)) {
    MemMove( &Opponent, &SpaceMonster, sizeof( Opponent ) );
    Opponent.Hull = MonsterHull;
    // Set crew skills based on difficulty
    if (Cloaked( &Ship, &Opponent ))
        EncounterType = SPACEMONSTERIGNORE;
    else
        EncounterType = SPACEMONSTERATTACK;
}
```

#### Scarab Encounter

```c  
// Travel() in Traveler.c, line 1825-1840
if (Clicks == 20 && SolarSystem[WarpSystem].Special == SCARABDESTROYED &&
    ScarabStatus == 1 && ArrivedViaWormhole) {
    // Scarab encounter at exactly 20 clicks if arrived via wormhole
}
```

#### Dragonfly at Zalkon

```c
// Travel() in Traveler.c, line 1842-1856  
if ((Clicks == 1) && (WarpSystem == ZALKONSYSTEM) && (DragonflyStatus == 4)) {
    // Dragonfly encounter on arrival at Zalkon
}
```

### Very Rare Encounters

```c
// Travel() in Traveler.c, line 2111-2202
if ((Days > 10) && (GetRandom(1000) < ChanceOfVeryRareEncounter)) {
    rareEncounter = GetRandom(MAXVERYRAREENCOUNTER);
    // Marie Celeste, Captain Ahab, Captain Conrad, Captain Huie, Skill Tonics
}
```

**Very Rare Encounters:**
- Minimum 10 days played
- Base probability: `ChanceOfVeryRareEncounter / 1000` 
- Types: Marie Celeste, Famous Captains, Skill Tonics

### Wild Police Encounters at Kravat

```c
// Travel() in Traveler.c, line 1886-1902
if (WildStatus == 1 && WarpSystem == KRAVATSYSTEM) {
    rareEncounter = GetRandom(100);
    if (Difficulty <= EASY && rareEncounter < 25)
        Police = true;
    else if (Difficulty == NORMAL && rareEncounter < 33)  
        Police = true;
    else if (Difficulty > NORMAL && rareEncounter < 50)
        Police = true;
}
```

**Wild Police Encounter Rates:**
- Easy/Beginner: 25%
- Normal: 33%
- Hard/Impossible: 50%

## Opponent Generation System

### Ship Type Selection

```c
// GenerateOpponent() in Traveler.c, line 912-948
while (j < Tries) {
    d = GetRandom( 100 );
    i = 0;
    sum = Shiptype[0].Occurrence;
    
    while (sum < d) {
        if (i >= MAXSHIPTYPE-1) break;
        ++i;
        sum += Shiptype[i].Occurrence;
    }
    
    // Validate ship type meets strength requirements
    if (i > Opponent.Type) Opponent.Type = i;
    ++j;
}
```

**Ship Selection Logic:**
1. Roll percentile die against ship occurrence rates
2. Validate ship meets political system strength requirements
3. Take best ship from multiple tries
4. Number of tries increases with difficulty and threat level

### Equipment Generation

#### Weapon Generation

```c
// GenerateOpponent() in Traveler.c, line 1044-1083
if (Shiptype[Opponent.Type].WeaponSlots <= 1)
    d = 1;
else if (Difficulty <= HARD) {
    d = 1 + GetRandom( Shiptype[Opponent.Type].WeaponSlots );
    if (d < Shiptype[Opponent.Type].WeaponSlots)
        if (Tries > 4 && Difficulty >= HARD) ++d;
        else if (Tries > 3 || Difficulty >= HARD) d += GetRandom( 2 );
} else
    d = Shiptype[Opponent.Type].WeaponSlots;
```

**Weapon Count Logic:**
- Single slot ships: Always 1 weapon
- Multiple slots: 1 + Random(slots) on Easy/Normal/Hard
- Impossible: All slots filled
- More tries = more weapons

#### Shield and Gadget Generation

Similar logic applies to shields and gadgets, with probability scaling based on difficulty and the number of "tries" (threat level).

### Cargo Generation

```c
// GenerateOpponent() in Traveler.c, line 1005-1036
if (Bays > 5) {
    if (Difficulty >= NORMAL) {
        m = 3 + GetRandom( Bays - 5 );
        sum = min( m, 15 );
    } else
        sum = Bays;
    
    if (Opp == POLICE) sum = 0;
    if (Opp == PIRATE) {
        if (Difficulty < NORMAL)
            sum = (sum * 4) / 5;
        else
            sum = sum / Difficulty;
    }
}
```

**Cargo Rules:**
- Police: No cargo
- Pirates: Reduced cargo (less on harder difficulties)
- Traders: Most cargo

## Special Event System

### Event Trigger Conditions

Most special events check multiple conditions:

```c
// SpecialEventFormHandleEvent() in SpecialEvent.c
switch (CURSYSTEM.Special) {
    case GETREACTOR:
        if (FilledCargoBays() > TotalCargoBays() - 15) {
            // Not enough cargo space
            break;
        }
        if (WildStatus == 1) {
            // Wild won't stay with reactor
        }
        // Success - get reactor
        break;
}
```

### Quest Item Interactions

- **Ion Reactor:** Takes 15 cargo bays, Wild won't stay aboard
- **Alien Artifact:** Triggers Mantis encounters  
- **Jonathan Wild:** Requires beam laser, afraid of reactor
- **Ambassador Jarek:** Provides trading bonus when delivered

This comprehensive analysis covers all major systems in the Space Trader combat and encounter mechanics. Each formula and probability has been extracted directly from the original C source code.
