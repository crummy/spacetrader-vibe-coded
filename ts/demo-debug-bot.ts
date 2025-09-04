#!/usr/bin/env node --experimental-strip-types

/**
 * Demonstration of Debug Logging in the Intelligent Trader Bot
 */

import { IntelligentTraderBot } from './intelligent-trader-bot.ts';
import { enableActionLogging } from './debug.ts';

console.log('🔍 Debug Logging Demonstration');
console.log('===============================\n');

console.log('This demo shows the debug logging feature that logs every action taken by the bot.');
console.log('The debug system can be enabled in several ways:\n');

console.log('1. 📝 Constructor parameter: new IntelligentTraderBot(verbose, maxActions, debugActions)');
console.log('2. 🌍 Environment variables: ST_DEBUG_ACTIONS=true or ST_DEBUG=true');
console.log('3. 🎛️  Command line flags: --debug-actions or --debug');
console.log('4. 💻 Programmatically: enableActionLogging(state)\n');

async function demoDebugLogging() {
  console.log('▶️  Starting bot with action debug logging enabled...\n');
  
  // Method 4: Programmatic control
  const bot = new IntelligentTraderBot(true, 8, true); // debugActions = true
  
  console.log('🎬 Each action will show detailed debug info:');
  console.log('   - Action type and parameters');
  console.log('   - Current game mode and system');
  console.log('   - Credits and fuel status\n');
  
  const result = await bot.run();
  
  console.log('\n✨ Debug logging helps with:');
  console.log('   🐛 Debugging bot behavior');
  console.log('   📊 Understanding action patterns');
  console.log('   🔧 Troubleshooting failed actions');
  console.log('   📈 Performance analysis');
  console.log('   🎯 Game state verification');
  
  return result;
}

// Different ways to enable debug logging

console.log('🧪 Demo Methods:\n');

console.log('Method 1 - Constructor:');
console.log('  const bot = new IntelligentTraderBot(true, 100, true);');
console.log('');

console.log('Method 2 - Environment Variable:');
console.log('  ST_DEBUG_ACTIONS=true node bot.js');
console.log('  ST_DEBUG=true node bot.js  # Enables all debug categories');
console.log('');

console.log('Method 3 - Command Line:');
console.log('  node bot.js --debug-actions');
console.log('  node bot.js --debug  # Enables all debug categories');
console.log('');

console.log('Method 4 - Programmatic:');
console.log('  import { enableActionLogging } from "./debug.ts";');
console.log('  enableActionLogging(engine.state);');
console.log('');

console.log('🔍 Running live demonstration...\n');

// Run the demonstration
demoDebugLogging()
  .then(() => {
    console.log('\n🏁 Debug logging demonstration complete!');
    console.log('\n💡 Pro Tips:');
    console.log('   • Use ST_DEBUG_ACTIONS=true for action-only logging');
    console.log('   • Use ST_DEBUG=true for comprehensive debugging');
    console.log('   • Debug info includes game state context');
    console.log('   • Perfect for bot development and troubleshooting');
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  });
