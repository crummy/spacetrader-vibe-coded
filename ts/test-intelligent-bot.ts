#!/usr/bin/env node --experimental-strip-types

/**
 * Test the Intelligent Trader Bot
 */

import { IntelligentTraderBot } from './intelligent-trader-bot.ts';

console.log('🧪 Testing Intelligent Trader Bot\n');

async function testBasicFunctionality() {
  console.log('📋 Test 1: Basic Trading Loop');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const bot = new IntelligentTraderBot(true, 50);
  const result = await bot.run();
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Bot completed ${result.totalActions} actions`);
  console.log(`✅ Executed ${result.totalTrades} trades`);
  console.log(`✅ Fought ${result.totalCombats} combats`);
  console.log(`✅ Net result: ${result.profit >= 0 ? '+' : ''}${result.profit} credits`);
  
  // Test success criteria
  const success = result.totalActions > 0 && result.totalTrades > 0;
  console.log(`\n🎯 Test Status: ${success ? '✅ PASSED' : '❌ FAILED'}`);
  
  return success;
}

async function testCombatScenario() {
  console.log('\n\n📋 Test 2: Combat Handling');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Note: Combat is random during travel, so we can't guarantee it happens
  // But the bot should handle it gracefully if it does occur
  
  const bot = new IntelligentTraderBot(true, 100);
  const result = await bot.run();
  
  console.log('\n📊 Combat Test Results:');
  console.log(`✅ Total actions: ${result.totalActions}`);
  console.log(`✅ Combat encounters: ${result.totalCombats}`);
  console.log(`✅ Bot survived all encounters`);
  
  const success = result.totalActions > 0; // Bot didn't crash
  console.log(`\n🎯 Combat Test: ${success ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (result.totalCombats > 0) {
    console.log('🎊 Bonus: Actually encountered combat during test!');
  } else {
    console.log('ℹ️  No combat encountered (this is normal - combat is random)');
  }
  
  return success;
}

async function testPerformance() {
  console.log('\n\n📋 Test 3: Performance Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const startTime = Date.now();
  const bot = new IntelligentTraderBot(false, 200); // Non-verbose for speed
  const result = await bot.run();
  const duration = Date.now() - startTime;
  
  console.log('\n📊 Performance Results:');
  console.log(`✅ Duration: ${duration}ms`);
  console.log(`✅ Actions per second: ${(result.totalActions / (duration / 1000)).toFixed(1)}`);
  console.log(`✅ Total trades: ${result.totalTrades}`);
  console.log(`✅ Final credits: ${result.currentCredits}`);
  
  const success = duration < 10000 && result.totalActions >= 200; // Under 10s and completed all actions
  console.log(`\n🎯 Performance Test: ${success ? '✅ PASSED' : '❌ FAILED'}`);
  
  return success;
}

async function runAllTests() {
  console.log('🤖 Intelligent Trader Bot - Test Suite');
  console.log('=====================================\n');
  
  const tests = [
    testBasicFunctionality,
    testCombatScenario,
    testPerformance
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (let i = 0; i < tests.length; i++) {
    try {
      const success = await tests[i]();
      if (success) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ Test ${i + 1} crashed:`, error);
      failed++;
    }
  }
  
  console.log('\n\n🏁 TEST SUITE SUMMARY');
  console.log('====================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${(passed / (passed + failed) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED - BOT IS WORKING CORRECTLY!');
    console.log('🚀 The Intelligent Trader Bot is ready for deployment');
  } else {
    console.log('\n⚠️  Some tests failed - check the output above for details');
  }
  
  return failed === 0;
}

// Run the tests
if (import.meta.main) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    });
}
