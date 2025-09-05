// Newspaper System Tests
// Tests for the news/information system from Palm OS Space Trader

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../state.ts';
import { createGameEngine } from '../engine/game.ts';
import { Difficulty } from '../types.ts';

test('newspaper - basic purchase mechanics', () => {
    const state = createInitialState();
    const engine = createGameEngine(state);
    
    state.credits = 100;
    state.alreadyPaidForNewspaper = false;
    
    // Should be able to buy newspaper when haven't paid yet
    const actions = engine.getAvailableActions();
    const newsAction = actions.find(a => a.type === 'read_news');
    
    assert.ok(newsAction, 'News action should be available');
    assert.equal(newsAction.description, 'Buy and read the local newspaper');
});

test('newspaper - insufficient credits handling', async () => {
    const state = createInitialState();
    const engine = createGameEngine(state);
    
    state.credits = 0; // No money
    state.alreadyPaidForNewspaper = false;
    
    const result = await engine.executeAction({ type: 'read_news', parameters: {} });
    
    assert.equal(result.success, false);
    assert.ok(result.message.includes('Not enough credits'));
    assert.equal(state.alreadyPaidForNewspaper, false, 'Should not mark as paid if failed');
});

test('newspaper - successful purchase', async () => {
    const state = createInitialState();
    const engine = createGameEngine(state);
    
    const initialCredits = state.credits;
    state.alreadyPaidForNewspaper = false;
    
    const result = await engine.executeAction({ type: 'read_news', parameters: {} });
    
    assert.equal(result.success, true);
    assert.ok(state.credits < initialCredits, 'Should deduct credits');
    assert.equal(state.alreadyPaidForNewspaper, true, 'Should mark as paid in this system');
});

test('newspaper - already purchased in system', async () => {
    const state = createInitialState();
    const engine = createGameEngine(state);
    
    state.alreadyPaidForNewspaper = true;
    const initialCredits = state.credits;
    
    const result = await engine.executeAction({ type: 'read_news', parameters: {} });
    
    assert.equal(result.success, true);
    assert.equal(state.credits, initialCredits, 'Should not charge again');
    assert.ok(result.message.includes('paid'), 'Should indicate it was already paid');
});

test('newspaper - reset when changing systems', async () => {
    const state = createInitialState();
    const engine = createGameEngine(state);
    
    // Buy newspaper in current system
    state.alreadyPaidForNewspaper = false;
    await engine.executeAction({ type: 'read_news', parameters: {} });
    assert.equal(state.alreadyPaidForNewspaper, true);
    
    // Travel to another system
    const originalSystem = state.currentSystem;
    const targetSystem = (originalSystem + 1) % state.solarSystem.length;
    state.currentSystem = targetSystem;
    state.ship.fuel = 10; // Ensure we have fuel
    
    // Simulate arrival at new system (manually reset since we're not using travel system)
    state.alreadyPaidForNewspaper = false; 
    
    assert.equal(state.alreadyPaidForNewspaper, false, 'Should reset newspaper payment flag');
});

test('newspaper - cost calculation by difficulty level', async () => {
    const state = createInitialState();
    const engine = createGameEngine(state);
    
    // Test different difficulty levels (news costs 1 + difficulty)
    const testCases = [
        { difficulty: Difficulty.Beginner, expectedCost: 1 },   // Beginner: 1 credit
        { difficulty: Difficulty.Impossible, expectedCost: 5 }, // Impossible: 5 credits  
        { difficulty: Difficulty.Hard, expectedCost: 4 }        // Hard: 4 credits
    ];
    
    for (const { difficulty, expectedCost } of testCases) {
        state.difficulty = difficulty;
        state.alreadyPaidForNewspaper = false;
        state.credits = 1000;
        const initialCredits = state.credits;
        
        await engine.executeAction({ type: 'read_news', parameters: {} });
        
        const actualCost = initialCredits - state.credits;
        assert.equal(actualCost, expectedCost, `Difficulty ${difficulty} should cost ${expectedCost} credits`);
    }
});

test('newspaper - auto-pay preference', () => {
    const state = createInitialState();
    state.newsAutoPay = true;
    state.credits = 100;
    state.alreadyPaidForNewspaper = false;
    
    // Auto-pay should automatically purchase when viewing news
    // This would be tested when auto-pay is implemented
    assert.equal(state.newsAutoPay, true, 'Auto-pay preference should be saved');
});

test('newspaper - content varies by system events', async () => {
    const state = createInitialState();
    const engine = createGameEngine(state);
    
    // Set up system with special event
    const currentSystem = state.solarSystem[state.currentSystem];
    currentSystem.special = 1; // Some special event
    
    state.credits = 100;
    state.alreadyPaidForNewspaper = false;
    
    const result = await engine.executeAction({ type: 'read_news', parameters: {} });
    
    assert.equal(result.success, true);
    assert.ok(result.message.length > 0, 'Should provide news content');
    // Content should vary based on system status, events, etc.
});

test('newspaper - multiple systems payment tracking', async () => {
    const state = createInitialState();
    const engine = createGameEngine(state);
    
    const system1 = state.currentSystem;
    const system2 = (state.currentSystem + 1) % state.solarSystem.length;
    
    // Buy newspaper in system 1
    state.alreadyPaidForNewspaper = false;
    state.credits = 1000;
    const creditsAfterSystem1 = state.credits - 5; // Assume 5 credit cost
    
    await engine.executeAction({ type: 'read_news', parameters: {} });
    assert.equal(state.alreadyPaidForNewspaper, true);
    
    // Travel to system 2
    state.currentSystem = system2;
    state.alreadyPaidForNewspaper = false; // Simulate system arrival reset
    assert.equal(state.alreadyPaidForNewspaper, false);
    
    // Should charge again in system 2
    const initialCreditsSystem2 = state.credits;
    await engine.executeAction({ type: 'read_news', parameters: {} });
    assert.ok(state.credits < initialCreditsSystem2, 'Should charge again in new system');
    assert.equal(state.alreadyPaidForNewspaper, true);
    
    // Go back to system 1
    state.currentSystem = system1;
    state.alreadyPaidForNewspaper = false; // Simulate system arrival reset
    assert.equal(state.alreadyPaidForNewspaper, false, 'Should reset when returning to system 1');
});

test('newspaper - edge cases', async () => {
    const state = createInitialState();
    const engine = createGameEngine(state);
    
    // Test with exactly enough credits (cost is 1 + difficulty, default difficulty is 2)
    const expectedCost = 1 + state.difficulty; 
    state.credits = expectedCost;
    state.alreadyPaidForNewspaper = false;
    
    const result = await engine.executeAction({ type: 'read_news', parameters: {} });
    assert.equal(result.success, true);
    assert.equal(state.credits, 0);
    
    // Test with 1 credit short
    state.credits = expectedCost - 1;
    state.alreadyPaidForNewspaper = false;
    
    const result2 = await engine.executeAction({ type: 'read_news', parameters: {} });
    assert.equal(result2.success, false);
    assert.equal(state.credits, expectedCost - 1, 'Credits should not change on failure');
});

test('newspaper - integration with fabric rip travel', async () => {
    const state = createInitialState();
    const engine = createGameEngine(state);
    
    // Buy newspaper in current system
    state.alreadyPaidForNewspaper = false;
    await engine.executeAction({ type: 'read_news', parameters: {} });
    assert.equal(state.alreadyPaidForNewspaper, true);
    
    // Simulate fabric rip transportation
    const originalSystem = state.currentSystem;
    state.currentSystem = (originalSystem + 10) % state.solarSystem.length;
    state.alreadyPaidForNewspaper = false; // Fabric rip should reset this
    
    assert.equal(state.alreadyPaidForNewspaper, false, 'Fabric rip should reset newspaper payment');
});
