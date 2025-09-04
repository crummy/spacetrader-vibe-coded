// Test encounter probability math

import { createGameEngine } from './engine/game.ts';
import { getPoliticalSystem } from './data/politics.ts';

console.log('🔍 Testing Encounter Probability Math\n');

const engine = createGameEngine();
const state = engine.state;

// Check the actual math for different systems
console.log('=== Encounter Probability Analysis ===');

for (let systemIndex = 0; systemIndex < 10; systemIndex++) {
  const system = state.solarSystem[systemIndex];
  const politics = getPoliticalSystem(system.politics);
  
  // Calculate encounter thresholds like the code does
  const difficulty = state.difficulty; // Easy = 1
  const randomRange = 44 - (2 * difficulty); // 44 - 2 = 42 for Easy
  
  // Get police strength (includes criminal record bonus)
  const basePolitics = politics;
  let policeStrength = basePolitics.strengthPolice;
  
  // Add criminal record bonus (from getPoliceStrength function)
  if (state.policeRecordScore < 0) {
    const criminalLevel = Math.abs(state.policeRecordScore) / 100;
    policeStrength += Math.min(criminalLevel * 2, 5);
  }
  policeStrength = Math.floor(policeStrength);
  
  // Calculate thresholds
  const pirateThreshold = politics.strengthPirates;
  const policeThreshold = politics.strengthPirates + policeStrength;
  const traderThreshold = politics.strengthPirates + policeStrength + politics.strengthTraders;
  
  // Calculate encounter probability
  const encounterProbability = Math.min(100, (traderThreshold / randomRange) * 100);
  
  console.log(`System ${systemIndex} (Politics ${system.politics}):`);
  console.log(`  Random range: 0-${randomRange}`);
  console.log(`  Pirate threshold: ${pirateThreshold}`);
  console.log(`  Police threshold: ${policeThreshold}`);
  console.log(`  Trader threshold: ${traderThreshold}`);
  console.log(`  Encounter probability: ${encounterProbability.toFixed(1)}%`);
  console.log('');
}

// Test the original Palm OS formula interpretation
console.log('=== Palm OS Formula Analysis ===');

// The original formula is: if (EncounterTest < threshold) then encounter
// Where EncounterTest = GetRandom(44 - (2 * Difficulty))

// For Easy difficulty: GetRandom(42) returns 0-41
// So if total strength >= 42, you'll always have an encounter

const politics = getPoliticalSystem(0); // Anarchy
const totalStrength = politics.strengthPirates + politics.strengthPolice + politics.strengthTraders;

console.log(`Example - Anarchy (${politics.name}):`);
console.log(`Pirate strength: ${politics.strengthPirates}`);
console.log(`Police strength: ${politics.strengthPolice}`);
console.log(`Trader strength: ${politics.strengthTraders}`);
console.log(`Total strength: ${totalStrength}`);
console.log(`Random range: 0-41 (Easy difficulty)`);
console.log(`Problem: ${totalStrength >= 42 ? 'Total >= range (100% encounters)' : 'Math seems correct'}`);

console.log(`\n🔍 Diagnosis:`);
if (totalStrength >= 40) {
  console.log(`❌ Politics strength values are too high relative to random range`);
  console.log(`   This causes near-100% encounter rates`);
  console.log(`   Solution: Reduce politics strength values or increase random range`);
} else {
  console.log(`✅ Math should allow for safe travel, but implementation may have other issues`);
}
