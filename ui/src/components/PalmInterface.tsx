// Palm Pilot-style compact interface for Space Trader
import React, { useState } from 'react';
import { BuyCargoScreen } from '../screens/BuyCargoScreen';
import { SellCargoScreen } from '../screens/SellCargoScreen';
import { BuyEquipmentScreen } from '../screens/BuyEquipmentScreen';
import { SellEquipmentScreen } from '../screens/SellEquipmentScreen';
import { ShipyardScreen } from '../screens/ShipyardScreen';
import { PersonnelScreen } from '../screens/PersonnelScreen';
import { BankScreen } from '../screens/BankScreen';
import { CommanderStatusScreen } from '../screens/CommanderStatusScreen';
import { SystemInfoScreen } from '../screens/SystemInfoScreen';
import { SystemChartScreen } from '../screens/SystemChartScreen';
import { getSolarSystemName } from '@game-data/systems.ts';

type MainTab = 'planet' | 'trade' | 'ship' | 'info';
type SubScreen = 
  | 'buy-cargo' | 'sell-cargo' 
  | 'buy-equipment' | 'sell-equipment'
  | 'shipyard' | 'personnel' | 'bank'
  | 'commander' | 'system-info' | 'system-chart';

interface PalmInterfaceProps {
  state: any;
  onAction: (action: any) => Promise<any>;
  availableActions: any[];
}

export function PalmInterface({ state, onAction, availableActions }: PalmInterfaceProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('planet');
  const [activeScreen, setActiveScreen] = useState<SubScreen | null>(null);

  // If a screen is active, render it
  if (activeScreen) {
    const screenProps = {
      state,
      onAction,
      availableActions,
      onBack: () => setActiveScreen(null),
      onNavigate: (screen: string) => setActiveScreen(screen as SubScreen)
    };

    const screens = {
      'buy-cargo': <BuyCargoScreen {...screenProps} />,
      'sell-cargo': <SellCargoScreen {...screenProps} />,
      'buy-equipment': <BuyEquipmentScreen {...screenProps} />,
      'sell-equipment': <SellEquipmentScreen {...screenProps} />,
      'shipyard': <ShipyardScreen {...screenProps} />,
      'personnel': <PersonnelScreen {...screenProps} />,
      'bank': <BankScreen {...screenProps} />,
      'commander': <CommanderStatusScreen {...screenProps} />,
      'system-info': <SystemInfoScreen {...screenProps} />,
      'system-chart': <SystemChartScreen {...screenProps} />
    };

    return (
      <div className="palm-content text-xs">
        <div className="scale-90 origin-top h-full overflow-auto">
          {screens[activeScreen]}
        </div>
      </div>
    );
  }

  // Main interface with tabs
  return (
    <div className="palm-content">
      {/* Header */}
      <div className="palm-header">
        <div className="retro-title text-sm">SPACE TRADER</div>
        <div className="text-neon-green text-xs font-bold">{state.credits.toLocaleString()} cr</div>
      </div>

      {/* Tabs */}
      <div className="palm-tabs">
        {[
          { id: 'planet', name: 'Planet' },
          { id: 'trade', name: 'Trade' },
          { id: 'ship', name: 'Ship' },
          { id: 'info', name: 'Info' }
        ].map(tab => (
          <div
            key={tab.id}
            className={`palm-tab flex-1 text-center ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as MainTab)}
          >
            {tab.name}
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div className="palm-main">
        {activeTab === 'planet' && <PlanetTab state={state} onNavigate={setActiveScreen} />}
        {activeTab === 'trade' && <TradeTab state={state} onNavigate={setActiveScreen} />}
        {activeTab === 'ship' && <ShipTab state={state} onNavigate={setActiveScreen} />}
        {activeTab === 'info' && <InfoTab state={state} onNavigate={setActiveScreen} />}
      </div>
    </div>
  );
}

function PlanetTab({ state, onNavigate }: { state: any; onNavigate: (screen: SubScreen) => void }) {
  const systemName = getSolarSystemName(state.currentSystem);
  const shipType = state.ship.type;
  const currentSystem = state.solarSystem[state.currentSystem];
  const hullPercent = Math.round((state.ship.hull / 100) * 100);
  const fuelPercent = Math.round((state.ship.fuel / 20) * 100);
  
  return (
    <div className="space-y-1.5">
      <div className="compact-panel">
        <div className="compact-title">{systemName} System</div>
        <div className="stat-row">
          <span>Tech Level:</span>
          <span className="text-neon-cyan">{currentSystem.techLevel}</span>
        </div>
        <div className="stat-row">
          <span>Day:</span>
          <span>{state.days}</span>
        </div>
        <button className="compact-button w-full mt-1" onClick={() => onNavigate('system-chart')}>
          🗺️ Galaxy Map
        </button>
      </div>

      <div className="compact-panel">
        <div className="compact-title">Trading Post</div>
        <div className="grid grid-cols-2 gap-1">
          <button className="compact-button" onClick={() => onNavigate('buy-cargo')}>
            📦 Buy
          </button>
          <button className="compact-button" onClick={() => onNavigate('sell-cargo')}>
            💰 Sell
          </button>
        </div>
      </div>

      <div className="compact-panel">
        <div className="compact-title">Services</div>
        <div className="grid grid-cols-2 gap-1">
          <button className="compact-button" onClick={() => onNavigate('shipyard')}>
            🚀 Ships
          </button>
          <button className="compact-button" onClick={() => onNavigate('bank')}>
            🏦 Bank
          </button>
          <button className="compact-button" onClick={() => onNavigate('buy-equipment')}>
            ⚡ Equipment
          </button>
          <button className="compact-button" onClick={() => onNavigate('personnel')}>
            👥 Crew
          </button>
        </div>
      </div>

      <div className="compact-panel">
        <div className="compact-title">Ship Status</div>
        <div className="stat-row">
          <span>Hull:</span>
          <span className={hullPercent > 75 ? 'text-neon-green' : hullPercent > 25 ? 'text-neon-amber' : 'text-neon-red'}>
            {hullPercent}%
          </span>
        </div>
        <div className="stat-row">
          <span>Fuel:</span>
          <span className={fuelPercent > 50 ? 'text-neon-green' : fuelPercent > 25 ? 'text-neon-amber' : 'text-neon-red'}>
            {fuelPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}

function TradeTab({ state, onNavigate }: { state: any; onNavigate: (screen: SubScreen) => void }) {
  const cargoUsed = state.ship.cargo.reduce((sum: number, qty: number) => sum + qty, 0);
  const cargoTotal = 20; // This should come from ship type
  const cargoPercent = Math.round((cargoUsed / cargoTotal) * 100);
  
  return (
    <div className="space-y-1.5">
      <div className="compact-panel">
        <div className="compact-title">Cargo Status</div>
        <div className="stat-row">
          <span>Used:</span>
          <span className={cargoPercent >= 90 ? 'text-neon-red' : cargoPercent >= 75 ? 'text-neon-amber' : 'text-neon-green'}>
            {cargoUsed}/{cargoTotal} ({cargoPercent}%)
          </span>
        </div>
      </div>

      <div className="compact-panel">
        <div className="compact-title">Trade Cargo</div>
        <div className="grid grid-cols-2 gap-1">
          <button className="compact-button" onClick={() => onNavigate('buy-cargo')}>
            📦 Buy
          </button>
          <button className="compact-button" onClick={() => onNavigate('sell-cargo')}>
            💰 Sell
          </button>
        </div>
      </div>

      <div className="compact-panel">
        <div className="compact-title">Equipment</div>
        <div className="grid grid-cols-2 gap-1">
          <button className="compact-button" onClick={() => onNavigate('buy-equipment')}>
            ⚡ Buy
          </button>
          <button className="compact-button" onClick={() => onNavigate('sell-equipment')}>
            🔧 Sell
          </button>
        </div>
      </div>

      {cargoUsed > 0 && (
        <div className="compact-panel">
          <div className="compact-title">Current Cargo</div>
          <div className="text-xs space-y-0.5 max-h-20 overflow-y-auto">
            {state.ship.cargo.map((qty: number, index: number) => 
              qty > 0 ? (
                <div key={index} className="stat-row">
                  <span>Type {index}:</span>
                  <span>{qty}</span>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ShipTab({ state, onNavigate }: { state: any; onNavigate: (screen: SubScreen) => void }) {
  const weaponsCount = state.ship.weapon.filter((w: number) => w !== -1).length;
  const shieldsCount = state.ship.shield.filter((s: number) => s !== -1).length;
  const gadgetsCount = state.ship.gadget.filter((g: number) => g !== -1).length;
  
  return (
    <div className="space-y-1.5">
      <div className="compact-panel">
        <div className="compact-title">Ship Services</div>
        <div className="grid grid-cols-2 gap-1">
          <button className="compact-button" onClick={() => onNavigate('shipyard')}>
            🚀 Ships
          </button>
          <button className="compact-button" onClick={() => onNavigate('personnel')}>
            👥 Crew
          </button>
        </div>
      </div>

      <div className="compact-panel">
        <div className="compact-title">Equipment Status</div>
        <div className="stat-row">
          <span>Weapons:</span>
          <span className="text-neon-cyan">{weaponsCount}/3</span>
        </div>
        <div className="stat-row">
          <span>Shields:</span>
          <span className="text-neon-cyan">{shieldsCount}/2</span>
        </div>
        <div className="stat-row">
          <span>Gadgets:</span>
          <span className="text-neon-cyan">{gadgetsCount}/2</span>
        </div>
        <div className="grid grid-cols-2 gap-1 mt-2">
          <button className="compact-button" onClick={() => onNavigate('buy-equipment')}>
            ⚡ Buy
          </button>
          <button className="compact-button" onClick={() => onNavigate('sell-equipment')}>
            🔧 Sell
          </button>
        </div>
      </div>

      <div className="compact-panel">
        <div className="compact-title">Financial</div>
        <div className="stat-row">
          <span>Credits:</span>
          <span className="text-neon-green">{state.credits.toLocaleString()}</span>
        </div>
        {state.debt > 0 && (
          <div className="stat-row">
            <span>Debt:</span>
            <span className="text-neon-red">{state.debt.toLocaleString()}</span>
          </div>
        )}
        <button className="compact-button w-full mt-2" onClick={() => onNavigate('bank')}>
          🏦 Banking
        </button>
      </div>
    </div>
  );
}

function InfoTab({ state, onNavigate }: { state: any; onNavigate: (screen: SubScreen) => void }) {
  const totalKills = state.policeKills + state.traderKills + state.pirateKills;
  const totalSkills = state.commanderPilot + state.commanderFighter + state.commanderTrader + state.commanderEngineer;
  
  return (
    <div className="space-y-1.5">
      <div className="compact-panel">
        <div className="compact-title">Information</div>
        <div className="grid grid-cols-2 gap-1">
          <button className="compact-button" onClick={() => onNavigate('commander')}>
            👨‍🚀 Commander
          </button>
          <button className="compact-button" onClick={() => onNavigate('system-info')}>
            ℹ️ System
          </button>
        </div>
        <button className="compact-button w-full mt-1" onClick={() => onNavigate('system-chart')}>
          🗺️ Galaxy Map
        </button>
      </div>

      <div className="compact-panel">
        <div className="compact-title">Commander {state.nameCommander}</div>
        <div className="stat-row">
          <span>Days:</span>
          <span>{state.days}</span>
        </div>
        <div className="stat-row">
          <span>Total Skills:</span>
          <span className="text-neon-cyan">{totalSkills}</span>
        </div>
        <div className="stat-row">
          <span>Reputation:</span>
          <span className={totalKills > 10 ? 'text-neon-amber' : 'text-palm-gray'}>
            {totalKills} kills
          </span>
        </div>
      </div>

      <div className="compact-panel">
        <div className="compact-title">Skills Breakdown</div>
        <div className="stat-row">
          <span>Pilot:</span>
          <span className="text-xs">{state.commanderPilot}/10</span>
        </div>
        <div className="stat-row">
          <span>Fighter:</span>
          <span className="text-xs">{state.commanderFighter}/10</span>
        </div>
        <div className="stat-row">
          <span>Trader:</span>
          <span className="text-xs">{state.commanderTrader}/10</span>
        </div>
        <div className="stat-row">
          <span>Engineer:</span>
          <span className="text-xs">{state.commanderEngineer}/10</span>
        </div>
      </div>
    </div>
  );
}
