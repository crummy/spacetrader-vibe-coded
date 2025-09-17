// Tests for Space Trader Types
import { test } from 'node:test';
import assert from 'node:assert';
import { 
  GameMode, 
  Difficulty, 
  SystemStatus, 
  SkillType,
  TradeItem,
  MAXTRADEITEM,
  MAXSHIPTYPE,
  MAXTECHLEVEL 
} from './types.ts';

test('GameMode constants are correct', () => {
  assert.strictEqual(GameMode.OnPlanet, 0);
  assert.strictEqual(GameMode.InCombat, 1);
  assert.strictEqual(GameMode.GameOver, 2);
});

test('Difficulty levels match Palm source', () => {
  assert.strictEqual(Difficulty.Beginner, 0);
  assert.strictEqual(Difficulty.Easy, 1);
  assert.strictEqual(Difficulty.Normal, 2);
  assert.strictEqual(Difficulty.Hard, 3);
  assert.strictEqual(Difficulty.Impossible, 4);
});

test('SystemStatus matches Palm source', () => {
  assert.strictEqual(SystemStatus.Uneventful, 0);
  assert.strictEqual(SystemStatus.War, 1);
  assert.strictEqual(SystemStatus.Plague, 2);
  assert.strictEqual(SystemStatus.Drought, 3);
  assert.strictEqual(SystemStatus.Boredom, 4);
  assert.strictEqual(SystemStatus.Cold, 5);
  assert.strictEqual(SystemStatus.CropFailure, 6);
  assert.strictEqual(SystemStatus.LackOfWorkers, 7);
});

test('SkillType matches Palm source', () => {
  assert.strictEqual(SkillType.Pilot, 1);
  assert.strictEqual(SkillType.Fighter, 2);
  assert.strictEqual(SkillType.Trader, 3);
  assert.strictEqual(SkillType.Engineer, 4);
});

test('TradeItem constants match Palm source', () => {
  assert.strictEqual(TradeItem.Water, 0);
  assert.strictEqual(TradeItem.Furs, 1);
  assert.strictEqual(TradeItem.Food, 2);
  assert.strictEqual(TradeItem.Ore, 3);
  assert.strictEqual(TradeItem.Games, 4);
  assert.strictEqual(TradeItem.Firearms, 5);
  assert.strictEqual(TradeItem.Medicine, 6);
  assert.strictEqual(TradeItem.Machinery, 7);
  assert.strictEqual(TradeItem.Narcotics, 8);
  assert.strictEqual(TradeItem.Robots, 9);
});

test('Constants match Palm source values', () => {
  assert.strictEqual(MAXTRADEITEM, 10);
  assert.strictEqual(MAXSHIPTYPE, 10);
  assert.strictEqual(MAXTECHLEVEL, 8);
});