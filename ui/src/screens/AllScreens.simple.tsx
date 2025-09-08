// Simplified screen implementations that compile successfully
import React from 'react';
import { useGameEngine } from '../hooks/useGameEngine.ts';
import { getUiFields } from '@game-ui';
import type { ScreenProps } from '../types.ts';

export function SellCargoScreen({ onNavigate, onBack }: ScreenProps) {
  const { state } = useGameEngine();
  return (
    <div className="space-panel">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="neon-button">← Back</button>
        <h2 className="retro-title text-lg">SELL CARGO</h2>
        <div className="text-neon-green font-bold">{state.credits.toLocaleString()} cr.</div>
      </div>
      <div className="text-center py-8">
        <div className="text-4xl mb-4">💰</div>
        <div className="text-neon-cyan text-lg mb-2">Commodity Market</div>
        <div className="text-palm-gray">Sell your cargo items here for the best prices.</div>
      </div>
    </div>
  );
}

export function ShipyardScreen({ onNavigate, onBack }: ScreenProps) {
  const { state } = useGameEngine();
  return (
    <div className="space-panel">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="neon-button">← Back</button>
        <h2 className="retro-title text-lg">SHIPYARD</h2>
        <div className="text-neon-green font-bold">{state.credits.toLocaleString()} cr.</div>
      </div>
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🚀</div>
        <div className="text-neon-cyan text-lg mb-2">Ship Services</div>
        <div className="text-palm-gray">Buy ships, repair hull, and refuel here.</div>
      </div>
    </div>
  );
}

export function BuyEquipmentScreen({ onNavigate, onBack }: ScreenProps) {
  const { state } = useGameEngine();
  return (
    <div className="space-panel">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="neon-button">← Back</button>
        <h2 className="retro-title text-lg">BUY EQUIPMENT</h2>
        <div className="text-neon-green font-bold">{state.credits.toLocaleString()} cr.</div>
      </div>
      <div className="text-center py-8">
        <div className="text-4xl mb-4">⚔️</div>
        <div className="text-neon-cyan text-lg mb-2">Equipment Store</div>
        <div className="text-palm-gray">Purchase weapons, shields, and gadgets.</div>
      </div>
    </div>
  );
}

export function SellEquipmentScreen({ onNavigate, onBack }: ScreenProps) {
  const { state } = useGameEngine();
  return (
    <div className="space-panel">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="neon-button">← Back</button>
        <h2 className="retro-title text-lg">SELL EQUIPMENT</h2>
        <div className="text-neon-green font-bold">{state.credits.toLocaleString()} cr.</div>
      </div>
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🔧</div>
        <div className="text-neon-cyan text-lg mb-2">Equipment Exchange</div>
        <div className="text-palm-gray">Sell your weapons, shields, and gadgets.</div>
      </div>
    </div>
  );
}

export function PersonnelScreen({ onNavigate, onBack }: ScreenProps) {
  const { state } = useGameEngine();
  return (
    <div className="space-panel">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="neon-button">← Back</button>
        <h2 className="retro-title text-lg">PERSONNEL</h2>
        <div className="text-neon-green font-bold">{state.credits.toLocaleString()} cr.</div>
      </div>
      <div className="text-center py-8">
        <div className="text-4xl mb-4">👥</div>
        <div className="text-neon-cyan text-lg mb-2">Crew Quarters</div>
        <div className="text-palm-gray">Manage your crew and hire new members.</div>
      </div>
    </div>
  );
}

export function BankScreen({ onNavigate, onBack }: ScreenProps) {
  const { state } = useGameEngine();
  return (
    <div className="space-panel">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="neon-button">← Back</button>
        <h2 className="retro-title text-lg">BANK</h2>
        <div className="text-neon-green font-bold">{state.credits.toLocaleString()} cr.</div>
      </div>
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🏦</div>
        <div className="text-neon-cyan text-lg mb-2">Financial Services</div>
        <div className="text-palm-gray">Get loans and manage your debt.</div>
        <div className="space-panel bg-space-black mt-4">
          <div className="text-sm">
            <div className="text-neon-green">Cash: {state.credits.toLocaleString()} cr.</div>
            <div className="text-neon-red">Debt: {state.debt.toLocaleString()} cr.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SystemInfoScreen({ onNavigate, onBack }: ScreenProps) {
  const { state } = useGameEngine();
  return (
    <div className="space-panel">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="neon-button">← Back</button>
        <h2 className="retro-title text-lg">SYSTEM INFO</h2>
        <div className="text-neon-green font-bold">{state.credits.toLocaleString()} cr.</div>
      </div>
      <div className="text-center py-8">
        <div className="text-4xl mb-4">ℹ️</div>
        <div className="text-neon-cyan text-lg mb-2">System Information</div>
        <div className="text-palm-gray mb-4">Current system: #{state.currentSystem}</div>
        <div className="space-panel bg-space-black">
          <div className="text-sm space-y-1">
            <div>Days: {state.days}</div>
            <div>Mode: {state.currentMode === 1 ? 'Docked' : 'In Space'}</div>
            <div>Police Record: {state.policeRecordScore}</div>
            <div>Reputation: {state.reputationScore}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommanderStatusScreen({ onNavigate, onBack }: ScreenProps) {
  const { state } = useGameEngine();
  return (
    <div className="space-panel">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="neon-button">← Back</button>
        <h2 className="retro-title text-lg">COMMANDER</h2>
        <div className="text-neon-green font-bold">{state.credits.toLocaleString()} cr.</div>
      </div>
      <div className="text-center py-8">
        <div className="text-4xl mb-4">👤</div>
        <div className="text-neon-cyan text-lg mb-2">Commander Status</div>
        <div className="text-palm-gray mb-4">Your personal information and stats</div>
        <div className="space-panel bg-space-black">
          <div className="text-sm space-y-1">
            <div>Difficulty: {state.difficulty}</div>
            <div>Days in space: {state.days}</div>
            <div>Net worth: {state.credits - state.debt} cr.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SystemChartScreen({ onNavigate, onBack }: ScreenProps) {
  const { state } = useGameEngine();
  return (
    <div className="space-panel">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="neon-button">← Back</button>
        <h2 className="retro-title text-lg">SYSTEM CHART</h2>
        <div className="text-neon-green font-bold">{state.credits.toLocaleString()} cr.</div>
      </div>
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🗺️</div>
        <div className="text-neon-cyan text-lg mb-2">Galaxy Map</div>
        <div className="text-palm-gray mb-4">Navigate through the galaxy</div>
        <div className="space-panel bg-space-black">
          <div className="text-sm space-y-1">
            <div>Current system: #{state.currentSystem}</div>
            <div>Warp target: #{state.warpSystem}</div>
            <div>Travel mode: {state.currentMode === 0 ? 'Traveling' : 'Docked'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
