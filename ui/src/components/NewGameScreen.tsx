// New Game Screen - Character creation and game setup
import React, { useState } from 'react';
import type { State } from '@game-types';

interface NewGameScreenProps {
  onStartGame: (config: NewGameConfig) => void;
}

export interface NewGameConfig {
  commanderName: string;
  difficulty: number;
  pilotSkill: number;
  fighterSkill: number;
  traderSkill: number;
  engineerSkill: number;
}

// Difficulty names from Palm OS
const DIFFICULTY_NAMES = ['Beginner', 'Easy', 'Normal', 'Hard', 'Impossible'];

export function NewGameScreen({ onStartGame }: NewGameScreenProps) {
  // Starting values: each skill starts at 1, with 16 points to distribute (20 total)
  const [commanderName, setCommanderName] = useState('Jameson'); // Default commander name
  const [difficulty, setDifficulty] = useState(2); // Normal difficulty
  const [pilotSkill, setPilotSkill] = useState(1);
  const [fighterSkill, setFighterSkill] = useState(1);
  const [traderSkill, setTraderSkill] = useState(1);
  const [engineerSkill, setEngineerSkill] = useState(1);

  const totalSkillPoints = 20; // 2 * MAXSKILL from Palm OS
  const usedPoints = pilotSkill + fighterSkill + traderSkill + engineerSkill;
  const remainingPoints = totalSkillPoints - usedPoints;

  const canIncrease = (currentValue: number) => currentValue < 10 && remainingPoints > 0;
  const canDecrease = (currentValue: number) => currentValue > 1;

  const adjustSkill = (skillSetter: (value: number) => void, currentValue: number, delta: number) => {
    const newValue = currentValue + delta;
    if (newValue >= 1 && newValue <= 10) {
      if (delta > 0 && remainingPoints >= delta) {
        skillSetter(newValue);
      } else if (delta < 0) {
        skillSetter(newValue);
      }
    }
  };

  const handleStartGame = () => {
    if (remainingPoints !== 0) {
      alert('You must allocate all skill points before starting!');
      return;
    }

    if (commanderName.trim().length === 0) {
      alert('Please enter a commander name!');
      return;
    }

    onStartGame({
      commanderName: commanderName.trim(),
      difficulty,
      pilotSkill,
      fighterSkill,
      traderSkill,
      engineerSkill
    });
  };

  return (
    <div className="palm-content">
      {/* Header */}
      <div className="palm-header">
        <div></div>
        <div className="retro-title text-xs">NEW GAME</div>
        <div className="text-xs">🚀</div>
      </div>

      <div className="palm-main">
        {/* Commander Name */}
        <div className="compact-panel">
          <div className="compact-title">Commander Name</div>
          <input
            type="text"
            value={commanderName}
            onChange={(e) => setCommanderName(e.target.value)}
            maxLength={19}
            className="w-full p-1.5 text-xs bg-black border border-neon-cyan rounded text-neon-cyan font-mono focus:border-neon-amber focus:outline-none"
            placeholder="Enter your name..."
          />
        </div>

        {/* Difficulty Selection */}
        <div className="compact-panel">
          <div className="compact-title">Difficulty Level</div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setDifficulty(Math.max(0, difficulty - 1))}
              disabled={difficulty <= 0}
              className="compact-button disabled:opacity-50"
            >
              ←
            </button>
            <div className="text-center">
              <div className="text-neon-cyan font-bold text-sm">{DIFFICULTY_NAMES[difficulty]}</div>
            </div>
            <button
              onClick={() => setDifficulty(Math.min(4, difficulty + 1))}
              disabled={difficulty >= 4}
              className="compact-button disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>

        {/* Skill Point Distribution */}
        <div className="compact-panel">
          <div className="flex items-center justify-between mb-2">
            <div className="compact-title">Skill Points</div>
            <div className={`text-xs font-bold ${remainingPoints === 0 ? 'text-neon-green' : 'text-neon-red'}`}>
              {remainingPoints} left
            </div>
          </div>
          
          <div className="space-y-2">
            {/* Skills in compact rows */}
            {[
              { name: 'Pilot', value: pilotSkill, setter: setPilotSkill, desc: 'Ship handling' },
              { name: 'Fighter', value: fighterSkill, setter: setFighterSkill, desc: 'Combat power' },
              { name: 'Trader', value: traderSkill, setter: setTraderSkill, desc: 'Better prices' },
              { name: 'Engineer', value: engineerSkill, setter: setEngineerSkill, desc: 'Ship repair' }
            ].map((skill) => (
              <div key={skill.name} className="flex items-center justify-between">
                <div className="text-xs">
                  <div className="text-neon-cyan font-semibold">{skill.name}</div>
                  <div className="text-palm-gray text-xs">{skill.desc}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => adjustSkill(skill.setter, skill.value, -1)}
                    disabled={!canDecrease(skill.value)}
                    className="compact-button w-6 h-6 p-0 disabled:opacity-50"
                  >
                    −
                  </button>
                  <div className="w-6 text-center font-bold text-neon-cyan text-sm">{skill.value}</div>
                  <button
                    onClick={() => adjustSkill(skill.setter, skill.value, 1)}
                    disabled={!canIncrease(skill.value)}
                    className="compact-button w-6 h-6 p-0 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {remainingPoints > 0 && (
            <div className="text-neon-red text-xs mt-2 text-center">
              Allocate all {remainingPoints} points to start
            </div>
          )}
        </div>

        {/* Start Game Button */}
        <div className="compact-panel">
          <button
            onClick={handleStartGame}
            disabled={remainingPoints !== 0 || commanderName.trim().length === 0}
            className="compact-button w-full py-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {remainingPoints === 0 && commanderName.trim().length > 0 ? 
              '🚀 Begin Adventure' : 
              'Complete Setup'
            }
          </button>
          <div className="text-xs text-palm-gray text-center mt-1">
            Total: {totalSkillPoints} points to distribute
          </div>
        </div>
      </div>
    </div>
  );
}
