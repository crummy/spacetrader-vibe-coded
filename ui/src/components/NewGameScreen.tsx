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
    <div className="min-h-screen bg-space-black flex items-center justify-center p-4">
      <div className="space-panel max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🚀</div>
          <h1 className="retro-title text-2xl text-neon-cyan mb-2">SPACE TRADER</h1>
          <div className="text-sm text-palm-gray">New Commander Setup</div>
        </div>

        {/* Commander Name */}
        <div className="space-panel bg-space-black mb-4">
          <label className="text-neon-amber font-bold mb-2 block">Commander Name:</label>
          <input
            type="text"
            value={commanderName}
            onChange={(e) => setCommanderName(e.target.value)}
            maxLength={19} // NAMELEN - 1 from Palm OS
            className="w-full p-2 bg-black border border-neon-cyan rounded text-neon-cyan font-mono focus:border-neon-amber focus:outline-none"
            placeholder="Enter your name..."
          />
        </div>

        {/* Difficulty Selection */}
        <div className="space-panel bg-space-black mb-4">
          <div className="text-neon-amber font-bold mb-3">Difficulty Level:</div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setDifficulty(Math.max(0, difficulty - 1))}
              disabled={difficulty <= 0}
              className="neon-button px-3 py-1 text-sm disabled:opacity-50"
            >
              ←
            </button>
            
            <div className="text-center">
              <div className="text-neon-cyan font-bold text-lg">{DIFFICULTY_NAMES[difficulty]}</div>
              <div className="text-xs text-palm-gray">Level {difficulty + 1}</div>
            </div>
            
            <button
              onClick={() => setDifficulty(Math.min(4, difficulty + 1))}
              disabled={difficulty >= 4}
              className="neon-button px-3 py-1 text-sm disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>

        {/* Skill Point Distribution */}
        <div className="space-panel bg-space-black mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-neon-amber font-bold">Skill Points:</div>
            <div className={`font-bold ${remainingPoints === 0 ? 'text-neon-green' : 'text-neon-red'}`}>
              {remainingPoints} remaining
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Pilot Skill */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <div className="text-neon-cyan">Pilot</div>
                <div className="text-xs text-palm-gray">Ship handling & evasion</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustSkill(setPilotSkill, pilotSkill, -1)}
                  disabled={!canDecrease(pilotSkill)}
                  className="neon-button px-2 py-1 text-sm disabled:opacity-50"
                >
                  −
                </button>
                <div className="w-8 text-center font-bold text-neon-cyan">{pilotSkill}</div>
                <button
                  onClick={() => adjustSkill(setPilotSkill, pilotSkill, 1)}
                  disabled={!canIncrease(pilotSkill)}
                  className="neon-button px-2 py-1 text-sm disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Fighter Skill */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <div className="text-neon-cyan">Fighter</div>
                <div className="text-xs text-palm-gray">Combat effectiveness</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustSkill(setFighterSkill, fighterSkill, -1)}
                  disabled={!canDecrease(fighterSkill)}
                  className="neon-button px-2 py-1 text-sm disabled:opacity-50"
                >
                  −
                </button>
                <div className="w-8 text-center font-bold text-neon-cyan">{fighterSkill}</div>
                <button
                  onClick={() => adjustSkill(setFighterSkill, fighterSkill, 1)}
                  disabled={!canIncrease(fighterSkill)}
                  className="neon-button px-2 py-1 text-sm disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Trader Skill */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <div className="text-neon-cyan">Trader</div>
                <div className="text-xs text-palm-gray">Better prices & deals</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustSkill(setTraderSkill, traderSkill, -1)}
                  disabled={!canDecrease(traderSkill)}
                  className="neon-button px-2 py-1 text-sm disabled:opacity-50"
                >
                  −
                </button>
                <div className="w-8 text-center font-bold text-neon-cyan">{traderSkill}</div>
                <button
                  onClick={() => adjustSkill(setTraderSkill, traderSkill, 1)}
                  disabled={!canIncrease(traderSkill)}
                  className="neon-button px-2 py-1 text-sm disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Engineer Skill */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <div className="text-neon-cyan">Engineer</div>
                <div className="text-xs text-palm-gray">Ship maintenance & repair</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustSkill(setEngineerSkill, engineerSkill, -1)}
                  disabled={!canDecrease(engineerSkill)}
                  className="neon-button px-2 py-1 text-sm disabled:opacity-50"
                >
                  −
                </button>
                <div className="w-8 text-center font-bold text-neon-cyan">{engineerSkill}</div>
                <button
                  onClick={() => adjustSkill(setEngineerSkill, engineerSkill, 1)}
                  disabled={!canIncrease(engineerSkill)}
                  className="neon-button px-2 py-1 text-sm disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {remainingPoints > 0 && (
            <div className="text-neon-red text-xs mt-2 text-center">
              ⚠ You must allocate all {remainingPoints} remaining skill points
            </div>
          )}
        </div>

        {/* Start Game Button */}
        <button
          onClick={handleStartGame}
          disabled={remainingPoints !== 0 || commanderName.trim().length === 0}
          className="neon-button w-full h-12 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {remainingPoints === 0 && commanderName.trim().length > 0 ? 
            '🚀 Begin Your Adventure' : 
            'Complete Setup First'
          }
        </button>

        {/* Footer */}
        <div className="text-xs text-palm-gray text-center mt-4 space-y-1">
          <div>Distribute {totalSkillPoints} skill points among four specializations</div>
          <div>Each skill affects different aspects of gameplay</div>
        </div>
      </div>
    </div>
  );
}
