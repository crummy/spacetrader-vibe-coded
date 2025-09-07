# Palm OS Space Trader Event Handler Analysis

## Overview
This document analyzes the Palm OS Space Trader event handling system, validation rules, and state management patterns based on examination of the original C source code.

## Core Event Handler Files Analyzed

### 1. AppHandleEvent.c - Main Application Event Routing
**Primary Responsibilities:**
- Global menu command routing (`DockedFormDoCommand`)
- Hardware button mapping to actions
- Form loading and event handler assignment
- Cross-form navigation

**Key Validation Patterns:**
```c
// Menu command validation with confirmation dialogs
if (FrmAlert( NewGameAlert) == NewGameYes)
    StartNewGame();

// Save game validation with error handling
if (SaveGame( 1 ))
    FrmAlert( GameSavedAlert );

// Game switch validation with state checks
if (NameCommander[0] == '\0') {
    FrmAlert( SwitchToNewAlert );
    IdentifyStartup = true;
    StartNewGame();
}
```

**State Transition Guards:**
- Form existence validation before navigation
- Hardware button access restrictions by current form
- Game state consistency checks before save/load operations

### 2. QuestEvent.c - Quest Management and Display
**Quest Counting Logic:**
```c
int OpenQuests( void ) {
    int r = 0;
    if (MonsterStatus == 1) ++r;
    if (DragonflyStatus >= 1 && DragonflyStatus <= 4) ++r;
    if (JaporiDiseaseStatus == 1) ++r;
    // ... additional quest checks
    return r;
}
```

**Quest State Validation Rules:**
- **Monster Quest:** Active when `MonsterStatus == 1`, complete when `MonsterStatus == 2`
- **Dragonfly Quest:** Progressive states 1-4 (Baratas → Melina → Regulas → Zalkon)
- **Japori Disease:** Simple binary active/inactive state
- **Artifact Quest:** Boolean flag `ArtifactOnBoard`
- **Time-Limited Quests:** Countdown validation for Invasion (7 days) and Experiment (11 days)

**Quest Progress Display Logic:**
```c
if (InvasionStatus >= 1 && InvasionStatus < 7) {
    if (InvasionStatus == 6)
        StrCopy( SBuf, "by tomorrow" );
    else {
        StrCopy( SBuf, "within " );
        SBufMultiples( 7 - InvasionStatus, "day" );
    }
}
```

### 3. SystemInfoEvent.c - System Information and Special Events
**Special Event Availability Logic:**
```c
// Complex multi-condition validation for special events
if ((CURSYSTEM.Special < 0) || 
    (CURSYSTEM.Special == BUYTRIBBLE && Ship.Tribbles <= 0) ||
    (CURSYSTEM.Special == ERASERECORD && PoliceRecordScore >= DUBIOUSSCORE) ||
    (CURSYSTEM.Special == CARGOFORSALE && (FilledCargoBays() > TotalCargoBays() - 3)) ||
    // ... many more conditions
    )
    FrmHideObject( frmP, FrmGetObjectIndex( frmP, SystemInformationSpecialButton ) );
```

**Key Validation Categories:**
1. **Resource Requirements:** Credit balance, cargo space, crew quarters
2. **Quest Prerequisites:** Police record thresholds, reputation scores
3. **State Dependencies:** Quest status, item possession, system characteristics
4. **Temporal Constraints:** Time limits for delivery quests

**Crew Management Validation:**
```c
static char AvailableQuarters( void ) {
    return Shiptype[Ship.Type].CrewQuarters - (JarekStatus == 1 ? 1 : 0) -
         (WildStatus == 1 ? 1 : 0);
}
```

### 4. WarpFormEvent.c - Travel and Navigation
**Travel Validation:**
```c
// Range validation for system selection
if ((ABS( SolarSystem[i].X - SolarSystem[Index].X ) <= MAXRANGE) &&
    (ABS( SolarSystem[i].Y - SolarSystem[Index].Y ) <= MAXRANGE))
```

**Wormhole Access Validation:**
```c
if (i < MAXWORMHOLE) {
    if (COMMANDER.CurSystem != Wormhole[i])
        FrmCustomAlert( WormholeOutOfRangeAlert, ... );
    else {
        WarpSystem = (i < MAXWORMHOLE-1 ? Wormhole[i+1] : Wormhole[0] );
        // Navigate through wormhole
    }
}
```

**System Tracking Logic:**
- Distance calculations for travel planning
- Fuel range validation
- Special navigation modes (SuperWarp validation)

### 5. CmdrStatusEvent.c - Commander Status Management
**Skill Display Validation:**
```c
static void DisplaySkill( int Skill, int AdaptedSkill, FormPtr frmP, long Label ) {
    StrIToA( SBuf, Skill );
    StrCat( SBuf, " [" );
    StrIToA( SBuf2, AdaptedSkill );  // Shows modified skill with equipment
    StrCat( SBuf, SBuf2 );
    StrCat( SBuf, "]" );
}
```

**Police Record Categorization:**
```c
i = 0;
while (i < MAXPOLICERECORD && PoliceRecordScore >= PoliceRecord[i].MinScore)
    ++i;
--i;
if (i < 0) ++i;
```

### 6. OtherEvent.c - Special Cargo Management
**Cargo Status Validation:**
```c
if (Ship.Tribbles > 0) {
    if (Ship.Tribbles >= MAXTRIBBLES)
        StrCopy( SBuf, "An infestation of tribbles." );
    else {
        SBufMultiples( Ship.Tribbles, "cute, furry tribble" );
    }
}
```

**Special Item Tracking:**
- Quest item validation (antidote, artifact, reactor)
- Space usage calculations for special cargo
- Item interaction restrictions

## Key Validation Patterns Identified

### 1. Guard Conditions
```c
// Multi-layered validation with early exits
if (condition1_fails) return false;
if (condition2_fails) return false;
if (condition3_fails) return false;
// Execute action
```

### 2. State Machine Validation
```c
// Progressive quest states with range checks
if (QuestStatus >= MIN_ACTIVE && QuestStatus <= MAX_ACTIVE) {
    // Quest is in progress
} else if (QuestStatus == COMPLETED) {
    // Quest completed
}
```

### 3. Resource Constraint Validation
```c
// Multiple resource checks before action
if (Credits >= RequiredCredits && 
    AvailableCargo >= RequiredCargo &&
    PoliceRecord >= MinReputation) {
    // Allow action
}
```

### 4. Time-Based Validation
```c
// Countdown timers with urgency levels
if (TimeRemaining == 1)
    ShowUrgentWarning();
else if (TimeRemaining <= 3)
    ShowWarning();
```

## Quest State Machine Analysis

### Quest Status Encoding Patterns
- **Single Status Variable:** Simple 0=inactive, 1=active, 2+=completed
- **Progressive States:** Sequential advancement (Dragonfly: 1→2→3→4→5)
- **Countdown States:** Time-limited quests with decreasing counters
- **Composite States:** Multiple quest aspects in single variable (ExperimentAndWildStatus)

### State Transition Validation Rules
1. **Prerequisites:** Required police record, reputation, equipment
2. **Resource Availability:** Credits, cargo space, crew quarters
3. **Temporal Constraints:** Quest deadlines, cooldown periods
4. **Exclusivity Rules:** Maximum concurrent quests (3-4 limit)
5. **Dependency Chains:** Quests that unlock other quests

## Input Validation Patterns

### 1. Numeric Input Validation
```c
GetField( frm, FieldID, SBuf, Handle );
if (SBuf[0] == '\0')
    Value = DefaultValue;
else
    Value = StrAToI( SBuf );
```

### 2. Range Validation
```c
Value = min(MaxValue, max(MinValue, InputValue));
```

### 3. String Validation
```c
if (StrLen(Input) > MAXLEN || Input[0] == '\0') {
    // Invalid input
}
```

## Form State Management

### 1. Dynamic UI Updates
```c
if (condition)
    FrmShowObject( frmP, ObjectIndex );
else
    FrmHideObject( frmP, ObjectIndex );
```

### 2. Context-Sensitive Menus
- Hardware button mapping changes based on current form
- Menu availability depends on game state
- Form navigation restricted during certain modes

### 3. Data Synchronization
- UI updates immediately reflect state changes
- Cross-form data consistency maintained
- State validation on form transitions

## Error Handling Patterns

### 1. User Confirmation
```c
if (FrmAlert( ConfirmationAlert ) == ConfirmYes) {
    // Execute risky action
}
```

### 2. Graceful Degradation
```c
if (OptionalFeatureAvailable) {
    UseOptionalFeature();
} else {
    UseFallbackMethod();
}
```

### 3. State Recovery
```c
if (InvalidStateDetected) {
    ResetToSafeState();
    NotifyUser();
}
```

## Recommendations for TypeScript Port

### 1. Validation Framework
- Implement guard functions for all major actions
- Create validation result objects with detailed error information
- Add comprehensive input sanitization

### 2. State Management
- Use immutable state updates where possible
- Implement state transition validators
- Add rollback capabilities for failed operations

### 3. Quest System
- Create typed quest state enums
- Implement quest dependency graph
- Add quest completion validation

### 4. Error Handling
- Replace alert dialogs with structured error objects
- Implement detailed logging for debugging
- Add unit tests for all validation paths

### 5. Testing Strategy
- Cover all quest state transitions
- Test resource constraint edge cases  
- Validate input boundary conditions
- Test concurrent quest interactions
