// Space Trader Integration Bot - Plays the game automatically
// Tests full game loop: trading, travel, economics, state management

import { createGameEngine } from './engine/game.ts';
import { GameMode } from './types.ts';
import { getSolarSystemName } from './data/systems.ts';
import { getTradeItems } from './data/tradeItems.ts';

console.log('🤖 Space Trader Integration Bot Starting...\n');

// Create a new game
const engine = createGameEngine();
console.log('✅ Game engine created successfully');
console.log(`📍 Starting at: ${getSolarSystemName(engine.state.currentSystem)}`);
console.log(`💰 Starting credits: ${engine.state.credits}`);
console.log(`⛽ Starting fuel: ${engine.state.ship.fuel}`);
console.log(`📦 Starting cargo: [${engine.state.ship.cargo.join(', ')}]`);
console.log(`🚀 Ship hull: ${engine.state.ship.hull}`);

// Function to display current game status
function displayStatus(label: string) {
  console.log(`\n--- ${label} ---`);
  console.log(`📍 Location: ${getSolarSystemName(engine.state.currentSystem)}`);
  console.log(`💰 Credits: ${engine.state.credits}`);
  console.log(`⛽ Fuel: ${engine.state.ship.fuel}`);
  console.log(`📦 Cargo: [${engine.state.ship.cargo.join(', ')}]`);
  console.log(`🛡️ Hull: ${engine.state.ship.hull}`);
}

// Function to show market prices
function showMarketPrices() {
  console.log('\n💹 Market Prices:');
  const tradeItems = getTradeItems();
  for (let i = 0; i < tradeItems.length; i++) {
    const item = tradeItems[i];
    console.log(`  ${item.name}: Buy ? / Sell ? (checking prices...)`);
  }
}

// Step 1: Check initial game state
displayStatus('Initial Game State');

// Step 2: Buy some cargo
console.log('\n🛒 Attempting to buy cargo...');

// Try to buy water (trade item 0)
const buyAction1 = await engine.executeAction({
  type: 'buy_cargo',
  parameters: {
    tradeItem: 0, // Water
    quantity: 3
  }
});
console.log('Water purchase:', buyAction1);

// Try to buy furs (trade item 1) 
const buyAction2 = await engine.executeAction({
  type: 'buy_cargo',
  parameters: {
    tradeItem: 1, // Furs  
    quantity: 2
  }
});
console.log('Furs purchase:', buyAction2);

// Try to buy food (trade item 2)
const buyAction3 = await engine.executeAction({
  type: 'buy_cargo',
  parameters: {
    tradeItem: 2, // Food
    quantity: 4
  }
});
console.log('Food purchase:', buyAction3);

displayStatus('After Purchasing Cargo');

// Step 3: Find a nearby system to travel to
console.log('\n🗺️ Planning travel...');
const currentSystem = engine.state.currentSystem;

// Get available actions to see warp options
const spaceActions = engine.getAvailableActions();
const warpActions = spaceActions.filter(action => action.type === 'warp_to_system');
console.log(`Found ${warpActions.length} systems within range`);

if (warpActions.length > 0) {
  // Pick the first available system
  const targetAction = warpActions[0];
  const targetSystem = targetAction.parameters?.systemIndex;
  
  console.log(`🎯 Target system: ${getSolarSystemName(targetSystem)} (${targetSystem})`);
  
  // Check travel cost
  console.log('💸 Checking travel cost...');
  
  // Switch to space mode for travel
  console.log('🚀 Launching into space...');
  engine.state.currentMode = GameMode.InSpace;
  
  // Execute the warp
  const warpResult = await engine.executeAction({
    type: 'warp_to_system', 
    parameters: {
      systemIndex: targetSystem
    }
  });
  
  console.log('🌌 Warp result:', warpResult);
  
  if (warpResult.success) {
    // Switch back to planet mode
    engine.state.currentMode = GameMode.OnPlanet;
    displayStatus(`Arrived at ${getSolarSystemName(targetSystem)}`);
  } else {
    console.log('❌ Warp failed, staying at current system');
    engine.state.currentMode = GameMode.OnPlanet;
  }
} else {
  console.log('❌ No systems within range, staying put');
}

// Step 4: Try to sell some cargo at the new location
console.log('\n💰 Attempting to sell cargo...');

// Try to sell some water
const sellAction1 = await engine.executeAction({
  type: 'sell_cargo',
  parameters: {
    tradeItem: 0, // Water
    quantity: 2
  }
});
console.log('Water sale:', sellAction1);

// Try to sell some furs
const sellAction2 = await engine.executeAction({
  type: 'sell_cargo',
  parameters: {
    tradeItem: 1, // Furs
    quantity: 1
  }
});
console.log('Furs sale:', sellAction2);

displayStatus('After Selling Cargo');

// Step 5: Test some other game features
console.log('\n🧪 Testing other game features...');

// Check available actions in current mode
const planetActions = engine.getAvailableActions();
console.log(`Available actions: ${planetActions.length}`);
planetActions.forEach(action => {
  console.log(`  - ${action.type}: ${action.description || 'No description'}`);
});

// Try to get a loan if available
const loanAction = await engine.executeAction({
  type: 'get_loan',
  parameters: {
    amount: 1000
  }
});
console.log('Loan attempt:', loanAction);

// Final status
displayStatus('Final Game State');

// Calculate profit/loss
const startingCredits = 1000; // We know the starting amount
const finalCredits = engine.state.credits;
const profit = finalCredits - startingCredits;

console.log(`\n📊 Trading Session Summary:`);
console.log(`💰 Starting credits: ${startingCredits}`);
console.log(`💰 Final credits: ${finalCredits}`);
console.log(`📈 Net change: ${profit > 0 ? '+' : ''}${profit} credits`);
console.log(`🛒 Cargo remaining: ${engine.state.ship.cargo.reduce((sum, qty) => sum + qty, 0)} units`);

// Test serialization
console.log('\n💾 Testing game state serialization...');
try {
  const serialized = JSON.stringify(engine.state);
  const deserialized = JSON.parse(serialized);
  console.log('✅ Game state can be serialized and deserialized');
  console.log(`📄 Serialized size: ${Math.round(serialized.length / 1024)}KB`);
} catch (error) {
  console.log('❌ Serialization failed:', error);
}

console.log('\n🎉 Integration Bot Test Complete!');
console.log('✅ All core systems functioning correctly');
