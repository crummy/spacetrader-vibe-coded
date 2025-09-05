// System Information Tests
import { test } from 'node:test';
import assert from 'node:assert';

import { createInitialState } from './state.ts';
import { GameMode } from './types.ts';
import { executeAction } from './engine/game.ts';
import { 
  getSystemInfo, 
  getNearbySystemsInfo, 
  getGalacticChartInfo, 
  getBestPriceSystemsForItem,
  formatSystemInfo 
} from './travel/system-info.ts';

test('getSystemInfo - detailed info for current system', () => {
  const state = createInitialState();
  const info = getSystemInfo(state, state.currentSystem);
  
  assert.equal(info.level, 'detailed');
  if (info.level === 'detailed') {
    assert.equal(info.index, state.currentSystem);
    assert.equal(info.name, 'Acamar');
    assert.equal(info.distance, 0);
    assert(typeof info.government === 'string');
    assert(Array.isArray(info.averagePrices));
    assert.equal(info.averagePrices.length, 10); // All trade items
  }
});

test('getSystemInfo - summary info for visited distant system', () => {
  const state = createInitialState();
  state.solarSystem[92].visited = true; // Mark Sol as visited
  
  const info = getSystemInfo(state, 92); // Sol is typically distant
  
  assert.equal(info.level, 'summary');
  if (info.level === 'summary') {
    assert.equal(info.index, 92);
    assert.equal(info.name, 'Sol');
    assert(info.distance > 0);
    assert(typeof info.description === 'string');
    assert(info.description.includes('Feudal State')); // Sol is a Feudal State
  }
});

test('getSystemInfo - unknown info for unvisited distant system', () => {
  const state = createInitialState();
  // Don't mark system as visited
  
  const info = getSystemInfo(state, 50); // Distant unvisited system
  
  assert.equal(info.level, 'unknown');
  if (info.level === 'unknown') {
    assert.equal(info.index, 50);
    assert(typeof info.name === 'string');
    assert(typeof info.distance === 'number');
  }
});

test('getNearbySystemsInfo - returns only detailed systems within range', () => {
  const state = createInitialState();
  state.ship.fuel = 20; // Good fuel range
  
  const nearbyInfo = getNearbySystemsInfo(state);
  
  assert(nearbyInfo.length > 0, 'Should find some nearby systems');
  nearbyInfo.forEach(info => {
    assert.equal(info.level, 'detailed');
    assert(info.distance <= 20, `System ${info.name} at ${info.distance}ly should be within fuel range`);
  });
});

test('getGalacticChartInfo - returns all systems sorted by distance', () => {
  const state = createInitialState();
  
  const galacticInfo = getGalacticChartInfo(state);
  
  assert.equal(galacticInfo.length, 120, 'Should return all 120 systems');
  
  // Check sorting - first system should be current (distance 0)
  assert.equal(galacticInfo[0].index, state.currentSystem);
  if (galacticInfo[0].distance !== undefined && galacticInfo[1].distance !== undefined) {
    assert(galacticInfo[0].distance <= galacticInfo[1].distance, 'Should be sorted by distance');
  }
});

test('getBestPriceSystemsForItem - finds systems with best prices', () => {
  const state = createInitialState();
  state.ship.fuel = 20; // Good fuel range
  
  const bestBuyWater = getBestPriceSystemsForItem(state, 0, true); // Water, buying
  const bestSellWater = getBestPriceSystemsForItem(state, 0, false); // Water, selling
  
  assert(bestBuyWater.length > 0, 'Should find systems to buy water');
  assert(bestSellWater.length > 0, 'Should find systems to sell water');
  
  // Check sorting (buying should be ascending, selling should be descending)
  if (bestBuyWater.length > 1) {
    const price1 = bestBuyWater[0].averagePrices[0].buyPrice;
    const price2 = bestBuyWater[1].averagePrices[0].buyPrice;
    assert(price1 <= price2, 'Buy prices should be sorted ascending');
  }
  
  if (bestSellWater.length > 1) {
    const price1 = bestSellWater[0].averagePrices[0].sellPrice;
    const price2 = bestSellWater[1].averagePrices[0].sellPrice;
    assert(price1 >= price2, 'Sell prices should be sorted descending');
  }
});

test('formatSystemInfo - formats different info types correctly', () => {
  const state = createInitialState();
  
  const detailedInfo = getSystemInfo(state, state.currentSystem);
  const formattedDetailed = formatSystemInfo(detailedInfo);
  assert(formattedDetailed.includes('Acamar'));
  assert(formattedDetailed.includes('Anarchy')); // Government
  assert(formattedDetailed.includes('Tech'));
  
  // Test distant system formatting
  state.solarSystem[92].visited = true;
  const summaryInfo = getSystemInfo(state, 92);
  const formattedSummary = formatSystemInfo(summaryInfo);
  assert(formattedSummary.includes('Sol'));
  assert(formattedSummary.includes('Feudal State'));
});

test('system scanner action - nearby scan', async () => {
  const state = createInitialState();
  state.currentMode = GameMode.OnPlanet;
  
  const result = await executeAction(state, {
    type: 'system_scanner',
    parameters: { scanType: 'nearby' }
  });
  
  assert(result.success, `Scanner should work: ${result.message}`);
  assert(!result.stateChanged, 'Scanner should not change state');
  assert(result.message.includes('NEARBY SYSTEMS SCAN'));
  assert(result.data?.scanType === 'nearby');
});

test('system scanner action - galactic chart', async () => {
  const state = createInitialState();
  state.currentMode = GameMode.OnPlanet;
  
  const result = await executeAction(state, {
    type: 'system_scanner',
    parameters: { scanType: 'galactic' }
  });
  
  assert(result.success, 'Galactic chart should work');
  assert(result.message.includes('GALACTIC CHART'));
  assert(result.message.includes('120 systems')); // Total system count
});

test('system scanner action - trade analysis', async () => {
  const state = createInitialState();
  state.currentMode = GameMode.OnPlanet;
  
  const result = await executeAction(state, {
    type: 'system_scanner',
    parameters: { scanType: 'trade', tradeItem: 1 } // Furs
  });
  
  assert(result.success, 'Trade analysis should work');
  assert(result.message.includes('TRADE OPPORTUNITIES'));
  assert(result.message.includes('Best places to BUY'));
  assert(result.message.includes('Best places to SELL'));
});

test('system scanner action - invalid scan type', async () => {
  const state = createInitialState();
  state.currentMode = GameMode.OnPlanet;
  
  const result = await executeAction(state, {
    type: 'system_scanner',
    parameters: { scanType: 'invalid' }
  });
  
  assert(!result.success, 'Invalid scan type should fail');
  assert(result.message.includes('Invalid scan type'));
});
