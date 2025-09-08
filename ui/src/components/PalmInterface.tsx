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

type MainTab = 'system-info' | 'buy-cargo' | 'sell-cargo' | 'shipyard' | 'map' | 'buy-equipment' | 'sell-equipment' | 'personnel' | 'bank' | 'commander';

interface PalmInterfaceProps {
  state: any;
  onAction: (action: any) => Promise<any>;
  availableActions: any[];
}

export function PalmInterface({ state, onAction, availableActions }: PalmInterfaceProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('system-info');

  const screenProps = {
    state,
    onAction,
    availableActions,
    onBack: () => setActiveTab('system-info'),
    onNavigate: (screen: string) => setActiveTab(screen as MainTab)
  };

  const screens = {
    'system-info': <SystemInfoScreen {...screenProps} />,
    'buy-cargo': <BuyCargoScreen {...screenProps} />,
    'sell-cargo': <SellCargoScreen {...screenProps} />,
    'shipyard': <ShipyardScreen {...screenProps} />,
    'map': <SystemChartScreen {...screenProps} />,
    'buy-equipment': <BuyEquipmentScreen {...screenProps} />,
    'sell-equipment': <SellEquipmentScreen {...screenProps} />,
    'personnel': <PersonnelScreen {...screenProps} />,
    'bank': <BankScreen {...screenProps} />,
    'commander': <CommanderStatusScreen {...screenProps} />
  };

  // Main interface with tabs
  return (
    <div className="palm-content">
      {/* Header */}
      <div className="palm-header">
        <div className="retro-title text-sm">SPACE TRADER</div>
        <div className="text-neon-green text-xs font-bold">{state.credits.toLocaleString()} cr</div>
      </div>

      {/* Main content area */}
      <div className="palm-main">
        <div className="h-full p-2" style={{ paddingBottom: '80px' }}>
          {screens[activeTab]}
        </div>
      </div>

      {/* Bottom tabs */}
      <div className="palm-bottom-tabs">
        {/* Primary tabs */}
        <div className="flex border-b border-space-blue">
          {[
            { id: 'system-info', name: 'System', icon: 'ℹ️' },
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
