import React, { useState, useEffect } from 'react';
import { OptionsScreen } from '../screens/OptionsScreen';
import { getSaveInfo, deleteSavedGame } from '../utils/gameStorage';

interface GameMenuProps {
  state: any;
  onAction: (action: any) => Promise<any>;
  onNewGame: () => void;
  onClose: () => void;
}

export function GameMenu({ state, onAction, onNewGame, onClose }: GameMenuProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [saveInfo, setSaveInfo] = useState<{ commander: string; day: number; timestamp: number } | null>(null);

  useEffect(() => {
    setSaveInfo(getSaveInfo());
  }, []);

  const handleNewGame = () => {
    if (confirm('Start a new game? Current progress will be lost.')) {
      onNewGame();
      onClose();
    }
  };

  const handleOptions = () => {
    setShowOptions(true);
  };

  const handleOptionsBack = () => {
    setShowOptions(false);
  };

  const handleDeleteSave = () => {
    if (confirm('Delete saved game? This cannot be undone.')) {
      if (deleteSavedGame()) {
        setSaveInfo(null);
        alert('Saved game deleted successfully');
      } else {
        alert('Failed to delete saved game');
      }
    }
  };

  if (showOptions) {
    return (
      <OptionsScreen 
        state={state}
        onAction={onAction}
        onBack={handleOptionsBack}
      />
    );
  }

  return (
    <div className="palm-content">
      {/* Header */}
      <div className="palm-header">
        <div className="retro-title text-sm">GAME MENU</div>
        <button 
          onClick={onClose}
          className="text-neon-cyan text-xs hover:text-neon-green"
        >
          ← Back
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Game Menu Items */}
        <div className="space-y-2">
          <div className="text-neon-green text-xs font-bold border-b border-neon-green pb-1">
            GAME
          </div>
          
          <button
            onClick={handleNewGame}
            className="w-full palm-button bg-space-dark border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-space-black"
          >
            New Game
          </button>

          <button
            onClick={handleOptions}
            className="w-full palm-button bg-space-dark border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-space-black"
          >
            Options
          </button>

          {/* Future menu items can be added here */}
          <button
            disabled
            className="w-full palm-button bg-space-dark border border-space-gray text-space-gray opacity-50 cursor-not-allowed"
          >
            High Scores (Coming Soon)
          </button>
          
          <button
            disabled
            className="w-full palm-button bg-space-dark border border-space-gray text-space-gray opacity-50 cursor-not-allowed"
          >
            Retire (Coming Soon)
          </button>
        </div>

        {/* Save Info */}
        {saveInfo && (
          <div className="pt-2 border-t border-space-blue">
            <div className="text-neon-green text-xs font-bold border-b border-neon-green pb-1 mb-2">
              SAVED GAME
            </div>
            <div className="text-space-gray text-xs">
              Commander: {saveInfo.commander}
            </div>
            <div className="text-space-gray text-xs">
              Day: {saveInfo.day}
            </div>
            <div className="text-space-gray text-xs mb-2">
              Saved: {new Date(saveInfo.timestamp).toLocaleDateString()}
            </div>
            <button
              onClick={handleDeleteSave}
              className="w-full palm-button bg-space-dark border border-red-500 text-red-500 hover:bg-red-500 hover:text-space-black text-xs"
            >
              Delete Saved Game
            </button>
          </div>
        )}

        {/* Info */}
        <div className="pt-4 border-t border-space-blue">
          <div className="text-space-gray text-xs text-center">
            Space Trader 1.2.2
          </div>
          <div className="text-space-gray text-xs text-center mt-1">
            Credits: {state.credits.toLocaleString()} cr
          </div>
          <div className="text-space-gray text-xs text-center">
            Day: {state.days}
          </div>
        </div>
      </div>
    </div>
  );
}
