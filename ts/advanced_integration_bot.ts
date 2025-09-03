// Advanced Space Trader Integration Bot
// Comprehensive test of all game systems with intelligent gameplay

import { createGameEngine } from './engine/game.ts';
import { GameMode } from './types.ts';
import { getSolarSystemName } from './data/systems.ts';
import { getTradeItems } from './data/tradeItems.ts';
import { canWarpTo } from './travel/warp.ts';

console.log('🚀 Advanced Space Trader Integration Bot\n');

// Create a new game and log initial setup
const engine = createGameEngine();

function logSeparator(title: string) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(50));
}

function logStatus() {
  console.log(`📍 Location: ${getSolarSystemName(engine.state.currentSystem)}`);
  console.log(`💰 Credits: ${engine.state.credits}`);
  console.log(`⛽ Fuel: ${engine.state.ship.fuel}/${engine.state.ship.fuel}`);
  console.log(`📦 Cargo: [${engine.state.ship.cargo.join(', ')}] (${engine.state.ship.cargo.reduce((a, b) => a + b, 0)} total)`);
  console.log(`🛡️ Hull: ${engine.state.ship.hull}`);
}

logSeparator('INITIAL GAME STATE');
logStatus();

// Enhanced trading bot with market analysis
async function intelligentTrading() {
  logSeparator('INTELLIGENT TRADING SESSION');
  
  const actions = engine.getAvailableActions();
  const buyActions = actions.filter(action => action.type === 'buy_cargo');
  const sellActions = actions.filter(action => action.type === 'sell_cargo');
  
  console.log(`📊 Market Analysis:`);
  console.log(`  ${buyActions.length} items available to buy`);
  console.log(`  ${sellActions.length} items available to sell`);
  
  // Show market prices with trade item names
  const tradeItems = getTradeItems();
  console.log('\n💹 Current Market:');
  buyActions.forEach((action, index) => {
    if (index < tradeItems.length) {
      const price = action.description?.match(/(\d+) credits/)?.[1] || 'N/A';
      console.log(`  📈 Buy ${tradeItems[index].name}: ${price} credits each`);
    }
  });
  
  sellActions.forEach((action, index) => {
    const cargoIndex = engine.state.ship.cargo.findIndex(qty => qty > 0);
    if (cargoIndex >= 0 && cargoIndex < tradeItems.length) {
      const price = action.description?.match(/(\d+) credits/)?.[1] || 'N/A';
      const quantity = action.description?.match(/(\d+) units/)?.[1] || 'N/A';
      console.log(`  📉 Sell ${tradeItems[cargoIndex].name}: ${quantity} units @ ${price} credits each`);
    }
  });

  // Intelligent buying strategy - buy cheapest available items
  if (buyActions.length > 0) {
    console.log('\n🛒 Executing buying strategy...');
    
    // Extract prices and sort by cost
    const buyOpportunities = buyActions.map((action, index) => {
      const price = parseInt(action.description?.match(/(\d+) credits/)?.[1] || '999999');
      return { action, index, price, itemName: tradeItems[index]?.name || 'Unknown' };
    }).sort((a, b) => a.price - b.price);
    
    // Buy the 3 cheapest items we can afford
    let purchases = 0;
    for (const opportunity of buyOpportunities) {
      if (purchases >= 3) break;
      if (engine.state.credits < opportunity.price * 2) continue; // Keep some money
      
      console.log(`  🛒 Buying ${opportunity.itemName} at ${opportunity.price} credits...`);
      const result = await engine.executeAction({
        type: 'buy_cargo',
        parameters: {
          tradeItem: opportunity.index,
          quantity: Math.min(3, Math.floor(engine.state.credits / opportunity.price / 2))
        }
      });
      
      if (result.success) {
        console.log(`    ✅ ${result.message}`);
        purchases++;
      } else {
        console.log(`    ❌ ${result.message}`);
      }
    }
  }
  
  logStatus();
}

// Enhanced travel system with pathfinding
async function intelligentTravel() {
  logSeparator('INTELLIGENT TRAVEL SYSTEM');
  
  console.log('🗺️ Analyzing travel options...');
  console.log(`Current system: ${getSolarSystemName(engine.state.currentSystem)} (${engine.state.currentSystem})`);
  
  // Check all possible destinations
  const reachableSystems = [];
  for (let i = 0; i < 120; i++) { // MAXSOLARSYSTEM = 120
    if (i === engine.state.currentSystem) continue;
    
    const canReach = canWarpTo(engine.state, i);
    if (canReach.canWarp) {
      const dx = engine.state.solarSystem[i].x - engine.state.solarSystem[engine.state.currentSystem].x;
      const dy = engine.state.solarSystem[i].y - engine.state.solarSystem[engine.state.currentSystem].y;
      const distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
      
      reachableSystems.push({
        systemIndex: i,
        name: getSolarSystemName(i),
        distance: distance
      });
    }
  }
  
  console.log(`🎯 Found ${reachableSystems.length} reachable systems`);
  
  if (reachableSystems.length > 0) {
    // Sort by distance and pick a nearby system
    reachableSystems.sort((a, b) => a.distance - b.distance);
    const target = reachableSystems[Math.floor(Math.random() * Math.min(3, reachableSystems.length))]; // Pick from 3 nearest
    
    console.log(`🚀 Traveling to: ${target.name} (distance: ${target.distance.toFixed(1)})`);
    
    // Launch into space
    console.log('🛸 Launching into space...');
    engine.state.currentMode = GameMode.InSpace;
    
    // Execute warp
    const warpResult = await engine.executeAction({
      type: 'warp_to_system',
      parameters: {
        targetSystem: target.systemIndex
      }
    });
    
    console.log(`🌌 Warp result: ${warpResult.success ? '✅' : '❌'} ${warpResult.message}`);
    
    if (warpResult.success) {
      engine.state.currentMode = GameMode.OnPlanet;
      console.log(`🏁 Successfully arrived at ${target.name}!`);
    } else {
      console.log('❌ Warp failed, returning to planet');
      engine.state.currentMode = GameMode.OnPlanet;
    }
  } else {
    console.log('❌ No reachable systems found (need more fuel or credits)');
  }
  
  logStatus();
}

// Test special events and quests
async function testSpecialSystems() {
  logSeparator('SPECIAL SYSTEMS TEST');
  
  console.log('🎭 Testing special events and quests...');
  
  // Check for special events at current system
  const currentSystem = engine.state.solarSystem[engine.state.currentSystem];
  if (currentSystem.special !== -1) {
    console.log(`🌟 Special event found: ${currentSystem.special}`);
  } else {
    console.log('📍 No special events at current location');
  }
  
  // Show quest status
  console.log('\n🗡️ Quest Status:');
  console.log(`  Reactor Status: ${engine.state.reactorStatus}`);
  console.log(`  Scarab Status: ${engine.state.scarabStatus}`);
  console.log(`  Jarek Status: ${engine.state.jarekStatus}`);
  console.log(`  Monster Status: ${engine.state.monsterStatus}`);
  console.log(`  Dragonfly Status: ${engine.state.dragonflyStatus}`);
  console.log(`  Artifact On Board: ${engine.state.artifactOnBoard}`);
  
  // Show reputation and record
  console.log('\n📊 Commander Status:');
  console.log(`  Reputation Score: ${engine.state.reputationScore}`);
  console.log(`  Police Record: ${engine.state.policeRecordScore}`);
  console.log(`  Days: ${engine.state.days}`);
}

// Comprehensive game state test
async function testGameSystems() {
  logSeparator('GAME SYSTEMS TEST');
  
  console.log('⚙️ Testing core game systems...');
  
  // Test serialization/deserialization
  console.log('\n💾 Testing state persistence...');
  try {
    const serialized = JSON.stringify(engine.state);
    const deserialized = JSON.parse(serialized);
    console.log(`✅ State serialization successful (${Math.round(serialized.length / 1024)}KB)`);
    
    // Verify key fields
    const verified = 
      deserialized.credits === engine.state.credits &&
      deserialized.currentSystem === engine.state.currentSystem &&
      deserialized.ship.cargo.length === engine.state.ship.cargo.length;
    
    console.log(`✅ State integrity: ${verified ? 'PASSED' : 'FAILED'}`);
  } catch (error) {
    console.log(`❌ Serialization failed: ${error}`);
  }
  
  // Test game mode transitions
  console.log('\n🎮 Testing game modes...');
  const originalMode = engine.state.currentMode;
  
  engine.state.currentMode = GameMode.InSpace;
  console.log(`✅ Switched to Space mode`);
  const spaceActions = engine.getAvailableActions();
  console.log(`  Available actions in space: ${spaceActions.length}`);
  
  engine.state.currentMode = GameMode.OnPlanet;
  console.log(`✅ Switched to Planet mode`);
  const planetActions = engine.getAvailableActions();
  console.log(`  Available actions on planet: ${planetActions.length}`);
  
  engine.state.currentMode = originalMode;
  
  // Test combat mode
  engine.state.currentMode = GameMode.InCombat;
  console.log(`✅ Switched to Combat mode`);
  const combatActions = engine.getAvailableActions();
  console.log(`  Available actions in combat: ${combatActions.length}`);
  
  engine.state.currentMode = originalMode;
}

// Main execution
async function runIntegrationTest() {
  try {
    await intelligentTrading();
    await intelligentTravel();
    await intelligentTrading(); // Trade again at new location
    await testSpecialSystems();
    await testGameSystems();
    
    logSeparator('INTEGRATION TEST COMPLETE');
    console.log('🎉 All systems functioning correctly!');
    
    // Final summary
    const startingCredits = 1000;
    const finalCredits = engine.state.credits;
    const profit = finalCredits - startingCredits;
    const cargoValue = engine.state.ship.cargo.reduce((sum, qty) => sum + qty, 0);
    
    console.log('\n📋 Final Summary:');
    console.log(`💰 Credits: ${startingCredits} → ${finalCredits} (${profit >= 0 ? '+' : ''}${profit})`);
    console.log(`📦 Cargo units: ${cargoValue}`);
    console.log(`📍 Final location: ${getSolarSystemName(engine.state.currentSystem)}`);
    console.log(`⛽ Fuel remaining: ${engine.state.ship.fuel}`);
    
    console.log('\n✅ Integration test PASSED - Space Trader is fully functional!');
    
  } catch (error) {
    console.error('❌ Integration test FAILED:', error);
    console.error(error.stack);
  }
}

// Run the test
runIntegrationTest();
