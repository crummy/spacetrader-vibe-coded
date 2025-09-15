// Palm Pilot-style compact interface for Space Trader
import React, { useState } from 'react';
import { BuyCargoScreen } from '../screens/BuyCargoScreen';
import { SellCargoScreen } from '../screens/SellCargoScreen';
import { BuyEquipmentScreen } from '../screens/BuyEquipmentScreen';
import { SellEquipmentScreen } from '../screens/SellEquipmentScreen';
import { ShipyardScreen } from '../screens/ShipyardScreen';
import { ShipPurchaseScreen } from '../screens/ShipPurchaseScreen';
import { PersonnelScreen } from '../screens/PersonnelScreen';
import { BankScreen } from '../screens/BankScreen';
import { CommanderStatusScreen } from '../screens/CommanderStatusScreen';
import { SystemInfoScreen } from '../screens/SystemInfoScreen';
import { SystemChartScreen } from '../screens/SystemChartScreen';
import { GameMenu } from './GameMenu';
import { EncounterScreen } from './EncounterScreen';
import { useEffect } from 'react';
import { getSolarSystemName } from '@game-data/systems.ts';
import { GameMode } from '../../../ts/types.ts';
type MainTab = 'system-info' | 'buy-cargo' | 'sell-cargo' | 'shipyard' | 'ship-purchase' | 'map' | 'buy-equipment' | 'sell-equipment' | 'personnel' | 'bank' | 'commander';

interface PalmInterfaceProps {
  state: any;
  onAction: (action: any) => Promise<any>;
  availableActions: any[];
  onNewGame?: () => void;
}

export function PalmInterface({ state, onAction, availableActions, onNewGame }: PalmInterfaceProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('buy-cargo');
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [arrivalMessage, setArrivalMessage] = useState('');

  // Show save indicator briefly when state changes (indicating auto-save)
  useEffect(() => {
    if (state) {
      setShowSaveIndicator(true);
      const timer = setTimeout(() => setShowSaveIndicator(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [state.days, state.credits]); // Trigger when key game state changes

  // Show arrival message when player arrives at a new system
  useEffect(() => {
    if (state && state.message && state.message.includes('Arrived safely at')) {
      setArrivalMessage(state.message);
      const timer = setTimeout(() => setArrivalMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [state?.message]);

  const screenProps = {
    state,
    onAction,
    availableActions,
    onBack: () => setActiveTab('buy-cargo'),
    onNavigate: (screen: string) => setActiveTab(screen as MainTab)
  };

  // Special props for SystemInfoScreen that needs state and onAction directly
  const systemInfoProps = {
    ...screenProps,
    state,
    onAction
  };

  const screens = {
    'system-info': <SystemInfoScreen {...systemInfoProps} />,
    'buy-cargo': <BuyCargoScreen {...screenProps} />,
    'sell-cargo': <SellCargoScreen {...screenProps} />,
    'shipyard': <ShipyardScreen {...screenProps} />,
    'ship-purchase': <ShipPurchaseScreen {...screenProps} />,
    'map': <SystemChartScreen {...screenProps} />,
    'buy-equipment': <BuyEquipmentScreen {...screenProps} />,
    'sell-equipment': <SellEquipmentScreen {...screenProps} />,
    'personnel': <PersonnelScreen {...screenProps} />,
    'bank': <BankScreen {...screenProps} />,
    'commander': <CommanderStatusScreen {...screenProps} />
  };

  // Show game menu if active
  if (showGameMenu) {
    return (
      <GameMenu
        state={state}
        onAction={onAction}
        onNewGame={onNewGame || (() => {})}
        onClose={() => setShowGameMenu(false)}
      />
    );
  }

  // Main interface with tabs
  return (
    <div className="palm-content">
      {/* Header */}
      <div className="palm-header">
        <button
          onClick={() => setActiveTab('system-info')}
          className="retro-title text-sm hover:text-neon-green cursor-pointer bg-transparent border-none"
        >
          {arrivalMessage ? (
            <span className="text-neon-cyan animate-pulse">✨ {arrivalMessage}</span>
          ) : state.currentMode === GameMode.InCombat ? (
            <span className="text-neon-red">Encounter</span>
          ) : (
            getSolarSystemName(state.currentSystem)
          )}
        </button>
        <div className="flex items-center gap-2">
          {showSaveIndicator && (
            <div className="text-neon-amber text-xs animate-pulse">💾</div>
          )}
          <div className="text-neon-green text-xs font-bold">{state.credits.toLocaleString()} cr</div>
          <button 
            onClick={() => setShowGameMenu(true)}
            className="text-neon-cyan text-xs hover:text-neon-green font-bold border border-neon-cyan px-2 py-1 rounded"
          >
            Menu
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="palm-main">
        <div className="h-full p-2">
          {state.currentMode === GameMode.InCombat ? (
            <EncounterScreen state={state} onAction={onAction} />
          ) : (
            screens[activeTab]
          )}
        </div>
      </div>

      {/* Bottom tabs */}
      <div className="palm-bottom-tabs">
        {/* Primary tabs */}
        <div className="flex border-b border-space-blue">
          {[
            { id: 'buy-cargo', name: 'Buy', icon: '📦' },
            { id: 'sell-cargo', name: 'Sell', icon: '💰' },
            { id: 'shipyard', name: 'Ships', icon: '🚀' },
            { id: 'map', name: 'Map', icon: '🗺️' }
          ].map(tab => (
            <div
              key={tab.id}
              className={`palm-tab flex-1 text-center ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as MainTab)}
            >
              <div className="text-xs">{tab.icon}</div>
              <div className="text-xs">{tab.name}</div>
            </div>
          ))}
        </div>
        
        {/* Secondary tabs */}
        <div className="flex">
          {[
            { id: 'buy-equipment', name: 'Equip', icon: '⚡' },
            { id: 'sell-equipment', name: 'Sell E', icon: '🔧' },
            { id: 'personnel', name: 'Crew', icon: '👥' },
            { id: 'bank', name: 'Bank', icon: '🏦' },
            { id: 'commander', name: 'Cmdr', icon: '👨‍🚀' }
          ].map(tab => (
            <div
              key={tab.id}
              className={`palm-tab flex-1 text-center ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as MainTab)}
            >
              <div className="text-xs">{tab.icon}</div>
              <div className="text-xs">{tab.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
