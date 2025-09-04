# Intelligent Trader Bot

An automated trading bot for the Space Trader game that follows a strategic trading pattern and handles combat encounters.

## Strategy

The bot implements the exact strategy requested:

1. **Buy a random good** - Purchases affordable trade items with available cargo space
2. **Travel to a nearby system** - Attempts to warp to systems within fuel range  
3. **Sell the random good** - Sells carried cargo for profit/loss
4. **Refuel** - Refuels ship when fuel drops below 50% capacity
5. **Repeat** - Continues the cycle until stopped or max actions reached

## Combat Behavior

When the bot enters combat during travel (step 2), it follows the specified combat rule:
- **Attack until opponent is destroyed** - Uses `combat_attack` action repeatedly
- **Fallback to flee** - If attack fails, attempts to escape with `combat_flee`
- **Graceful handling** - Continues trading after combat resolves

## Features

### Core Trading Logic
- **Smart purchasing** - Tries multiple items until finding one it can afford
- **Cargo management** - Respects ship cargo capacity limits
- **Resource awareness** - Monitors credits and fuel levels
- **Error recovery** - Handles failed transactions gracefully

### Travel System
- **Dynamic route selection** - Picks random destinations from available warp actions
- **Fuel management** - Refuels when needed for continued travel
- **Local trading fallback** - Continues trading locally if travel fails
- **State management** - Properly handles space/planet mode transitions

### Combat System
- **Aggressive strategy** - Attacks until enemy is destroyed as requested
- **Combat loop handling** - Continues attacking while in combat mode
- **Encounter tracking** - Counts and reports combat statistics

## Usage

### Basic Usage
```typescript
import { IntelligentTraderBot } from './intelligent-trader-bot.ts';

// Create and run bot
const bot = new IntelligentTraderBot(true, 100); // verbose=true, maxActions=100
const result = await bot.run();

console.log(`Completed ${result.totalActions} actions`);
console.log(`Profit: ${result.profit} credits`);
```

### Command Line
```bash
# Run bot directly
node --experimental-strip-types intelligent-trader-bot.ts

# Run with options
node --experimental-strip-types intelligent-trader-bot.ts --max=200 --quiet

# Run demonstration
node --experimental-strip-types demo-intelligent-bot.ts
```

### Options
- `--max=N` - Set maximum actions (default: 500)
- `--quiet` - Disable verbose output
- `verbose` - Enable detailed logging (constructor parameter)

## Results Tracking

The bot tracks comprehensive statistics:

```typescript
interface TradingSession {
  totalActions: number;      // Total actions executed
  totalTrades: number;       // Buy/sell transactions completed  
  totalCombats: number;      // Combat encounters fought
  startingCredits: number;   // Initial credits
  currentCredits: number;    // Final credits
  profit: number;           // Net profit/loss
  isActive: boolean;        // Bot status
}
```

## Example Output

```
🤖 Intelligent Trader Bot initialized
📍 Starting location: Acamar
💰 Starting credits: 1000

🛒 Bought 3 units of Food
🚀 Traveling to Korma
💰 Sold 3 units of Food
⛽ Refueled ship (8 → 14)
🛒 Bought 2 units of Medicine
⚔️ Entered combat - attacking opponent
✅ Combat resolved
💰 Sold 2 units of Medicine

🏁 Trading Session Complete!
🎯 Total Actions: 24
🛒 Total Trades: 8
⚔️ Total Combats: 1
💰 Final Credits: 1050
📈 Net Profit: +50 credits
```

## Technical Implementation

### Architecture
- **Modular design** - Separate methods for each strategy step
- **State management** - Proper game mode handling (planet/space/combat)
- **Error handling** - Graceful recovery from failed actions
- **Resource tracking** - Monitors fuel, credits, and cargo

### Game Integration
- **Action system** - Uses the game engine's action execution framework
- **State validation** - Checks game state before executing actions
- **Mode transitions** - Handles launching, docking, and combat modes
- **Legal actions only** - Only executes valid actions per game rules

### Performance
- **Efficient execution** - Minimizes unnecessary actions
- **Smart purchasing** - Tries affordable items first
- **Resource conservation** - Careful fuel and credit management
- **Configurable limits** - Prevents infinite loops with action limits

## Files

- `intelligent-trader-bot.ts` - Main bot implementation
- `demo-intelligent-bot.ts` - Live demonstration script  
- `test-intelligent-bot.ts` - Test suite
- `INTELLIGENT-TRADER-BOT.md` - This documentation

## Success Criteria ✅

The bot successfully implements all requested features:

✅ **Buys random goods** - Purchases available trade items  
✅ **Travels to nearby systems** - Attempts warp to reachable destinations  
✅ **Sells goods** - Completes trading transactions  
✅ **Refuels when needed** - Maintains adequate fuel levels  
✅ **Repeats cycle** - Continues until stopped or limit reached  
✅ **Attacks in combat** - Fights until opponent destroyed  
✅ **Uses legal actions only** - Follows game engine action system  

The bot is fully functional and ready for deployment! 🚀
