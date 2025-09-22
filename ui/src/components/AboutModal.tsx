// About Modal - Information about the Space Trader Port
import React from 'react';

interface AboutModalProps {
  onClose: () => void;
}

export function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-space-dark border border-neon-green rounded p-6 max-w-md mx-4 text-palm-green">
        <div className="text-neon-green font-bold text-lg mb-4 text-center">
          About Space Trader Port
        </div>
        
        <div className="text-sm space-y-3 text-palm-gray">
          <p>
            This is a faithful TypeScript port of the classic Palm OS game 
            <span className="text-neon-cyan"> Space Trader</span> by Pieter Spronck.
          </p>
          
          <p>
            The port recreates the complete gameplay experience with pixel-perfect 
            Palm Pilot styling, comprehensive test coverage, and modern web technologies.
          </p>
          
          <p>
            Features include all original encounters, trading mechanics, combat system, 
            quests, and special events from the Palm OS version.
          </p>
          
          <p className="text-neon-green text-center font-bold">
            ✨ 100% Vibe Coded ✨
          </p>
          
          <div className="border-t border-space-blue pt-3 mt-4">
            <p className="text-xs">
              <span className="text-neon-amber">Original Game:</span> Space Trader 1.2.2 by Pieter Spronck
            </p>
            <p className="text-xs">
              <span className="text-neon-amber">TypeScript Port:</span> Malcolm Crum
            </p>
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="compact-button bg-neon-green text-black hover:bg-green-400 px-6"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
