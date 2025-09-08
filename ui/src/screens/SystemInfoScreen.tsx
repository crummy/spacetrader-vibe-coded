// System Information Screen - Display current system details
import React, { useState } from 'react';
import { useGameEngine } from '../hooks/useGameEngine.ts';
import { getUiFields } from '@game-ui';
import { getSolarSystemName } from '@game-data/systems.ts';
import type { ScreenProps } from '../types.ts';

export function SystemInfoScreen({ onNavigate, onBack }: ScreenProps) {
  const { state, executeAction } = useGameEngine();
  const uiFields = getUiFields(state);
  const currentSystem = state.solarSystem[state.currentSystem];

  return (
    <div className="space-panel">

      <div className="text-center py-8">
        <div className="text-4xl mb-4">🌟</div>
        <div className="text-neon-cyan text-lg mb-2">{getSolarSystemName(state.currentSystem)} System</div>
        <div className="text-palm-gray text-sm mb-6">
          Detailed information about the current star system.
        </div>
        
        <div className="space-panel bg-space-black mb-4">
          <div className="text-neon-amber mb-2">System Details:</div>
          <div className="text-sm text-palm-gray space-y-1">
            <div>• Name: {getSolarSystemName(state.currentSystem)}</div>
            <div>• Tech Level: {currentSystem.techLevel}</div>
            <div>• Government: {currentSystem.politics}</div>
            <div>• Size: {currentSystem.size}</div>
          </div>
        </div>

        <div className="space-panel bg-space-black mb-4">
          <div className="text-neon-amber mb-2">Coming Soon:</div>
          <div className="text-sm text-palm-gray space-y-1">
            <div>• Detailed system statistics</div>
            <div>• Local news and events</div>
            <div>• Trade route information</div>
            <div>• Special system features</div>
          </div>
        </div>
        
        <div className="text-xs text-palm-gray">
          This screen will provide comprehensive system information
          <br />
          including local events and trade opportunities.
        </div>
      </div>
    </div>
  );
}
