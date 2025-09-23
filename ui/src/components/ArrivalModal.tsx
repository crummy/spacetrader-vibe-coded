// Arrival Modal - Shows arrival message when arriving at a new system
import React from 'react';
import { getSolarSystemName } from '@game-data/systems.ts';

interface ArrivalModalProps {
  systemIndex: number;
  isLongTrip: boolean; // Based on StartClicks > 20 from Palm OS
  onContinue: () => void;
}

export function ArrivalModal({ systemIndex, isLongTrip, onContinue }: ArrivalModalProps) {
  const systemName = getSolarSystemName(systemIndex);
  
  // Palm OS messages from MerchantRsc.h:
  // ArrivalString (6300): "Another trip you have survived."
  // UneventfulTripString (6200): "Be glad you didn't encounter any pirates."
  const arrivalMessage = isLongTrip 
    ? "Be glad you didn't encounter any pirates."
    : "Another trip you have survived.";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-space-dark border border-neon-green rounded p-6 max-w-sm mx-4 text-palm-green">
        <div className="text-neon-green font-bold text-lg mb-4 text-center">
          Arrived at {systemName}
        </div>
        
        <div className="text-sm text-palm-gray mb-6 text-center">
          {arrivalMessage}
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={onContinue}
            className="bg-neon-green text-space-dark py-2 px-6 rounded hover:bg-neon-cyan font-bold transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
