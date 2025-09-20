// Debug the encounter logic to find the real issue

import { createGameEngine } from './engine/game.ts';
import { getPoliticalSystem } from './data/politics.ts';
import { randomFloor } from './math/random.ts';

console.log('🔍 Debugging Encounter Logic vs Palm OS Original\n');

// Test the exact encounter calculation step by step
const engine = createGameEngine();
const state = engine.state;

state.warpSystem = 1; // Set target
const targetSystem = state.solarSystem[state.warpSystem];
const politics = getPoliticalSystem(targetSystem.politics);

console.log('=== Step-by-Step Encounter Calculation ===');
console.log(`Target system politics: ${targetSystem.politics} (${politics.name})`);
console.log(`Player police record: ${state.policeRecordScore}`);
console.log(`Player difficulty: ${state.difficulty}`);
console.log(`Ship type: ${state.ship.type}`);
console.log(`Raided flag: ${state.raided}`);

// Calculate like the Palm OS original
console.log('\n--- Palm OS Formula Steps ---');

// Step 1: Base encounter test
const difficulty = state.difficulty;
const baseRange = 44 - (2 * difficulty);
console.log(`1. Base random range: 0-${baseRange - 1} (44 - 2*${difficulty} - 1)`);

// Step 2: Ship type modifier
const shipTypeMultiplier = state.ship.type === 0 ? 2 : 1;
console.log(`2. Ship type multiplier: ${shipTypeMultiplier} (${state.ship.type === 0 ? 'Flea gets 2x' : 'Other ships get 1x'})`);

// Step 3: Calculate thresholds
console.log(`3. Politics base strengths:`);
console.log(`   Pirates: ${politics.strengthPirates}`);
console.log(`   Police: ${politics.strengthPolice}`);
console.log(`   Traders: ${politics.strengthTraders}`);

// Step 4: Police strength calculation (with criminal bonus)
let policeStrength = politics.strengthPolice;
if (state.policeRecordScore < 0) {
  const criminalLevel = Math.abs(state.policeRecordScore) / 100;
  const bonus = Math.min(criminalLevel * 2, 5);
  policeStrength += bonus;
  console.log(`   Police bonus for criminal record: +${bonus} → ${policeStrength}`);
}

// Step 5: Calculate final thresholds
const pirateThreshold = politics.strengthPirates;
const policeThreshold = pirateThreshold + policeStrength;
const traderThreshold = policeThreshold + politics.strengthTraders;

console.log(`4. Final encounter thresholds:`);
console.log(`   Pirates: 0-${pirateThreshold - 1}`);
console.log(`   Police: ${pirateThreshold}-${policeThreshold - 1}`);
console.log(`   Traders: ${policeThreshold}-${traderThreshold - 1}`);
console.log(`   Safe: ${traderThreshold}-${baseRange - 1}`);

// Step 6: Calculate actual probabilities
const pirateProb = (pirateThreshold / baseRange * 100).toFixed(1);
const policeProb = ((policeThreshold - pirateThreshold) / baseRange * 100).toFixed(1);
const traderProb = ((traderThreshold - policeThreshold) / baseRange * 100).toFixed(1);
const safeProb = ((baseRange - traderThreshold) / baseRange * 100).toFixed(1);

console.log(`5. Single-tick probabilities:`);
console.log(`   Pirate: ${pirateProb}%`);
console.log(`   Police: ${policeProb}%`);
console.log(`   Trader: ${traderProb}%`);
console.log(`   Safe: ${safeProb}%`);

// Step 7: Simulate actual random rolls
console.log('\n--- Simulation Test ---');
let testEncounters = 0;
const testRuns = 1000;

for (let i = 0; i < testRuns; i++) {
  let encounterTest = randomFloor(baseRange);
  
  if (state.ship.type === 0) {
    encounterTest *= 2; // Ship type modifier
  }
  
  if ((encounterTest < pirateThreshold && !state.raided) ||
      (encounterTest >= pirateThreshold && encounterTest < policeThreshold) ||
      (encounterTest >= policeThreshold && encounterTest < traderThreshold)) {
    testEncounters++;
  }
}

const actualRate = (testEncounters / testRuns * 100).toFixed(1);
console.log(`Single-tick simulation: ${testEncounters}/${testRuns} (${actualRate}%)`);

// Step 8: Check if there's a missing condition
console.log('\n--- Possible Issues ---');

if (traderThreshold >= baseRange) {
  console.log(`❌ FOUND ISSUE: Total threshold (${traderThreshold}) >= random range (${baseRange})`);
  console.log(`   This guarantees encounters on every tick check`);
  console.log(`   Politics values may be scaled incorrectly`);
} else {
  console.log(`✅ Thresholds look reasonable for single-tick checks`);
}

console.log(`\nThe real issue might be:`);
console.log(`1. Politics data ported incorrectly from Palm OS`);
console.log(`2. Missing conditions in encounter logic (quest flags, special states, etc.)`);
console.log(`3. Random number generation differences`);
