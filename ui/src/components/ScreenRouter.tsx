// Screen Router Component - Handles navigation between screens
import React from 'react';
import type { ScreenType, ScreenProps } from '../types.ts';
import { PlanetView } from './PlanetView.tsx';
import {
  BuyCargoScreen,
  SellCargoScreen,
  ShipyardScreen,
  BuyEquipmentScreen,
  SellEquipmentScreen,
  PersonnelScreen,
  BankScreen,
  SystemInfoScreen,
  CommanderStatusScreen,
  SystemChartScreen
} from '../screens/index.ts';

interface ScreenRouterProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  onBack: () => void;
  state: any;
  onAction: (action: any) => Promise<any>;
  availableActions?: any[];
  isLoading?: boolean;
}

export function ScreenRouter({ 
  currentScreen, 
  onNavigate, 
  onBack, 
  state, 
  onAction,
  availableActions,
  isLoading
}: ScreenRouterProps) {
  const screenProps: ScreenProps = {
    onNavigate,
    onBack,
    state,
    onAction,
    availableActions,
    isLoading
  };

  switch (currentScreen) {
    case 'planet':
      return (
        <PlanetView 
          state={state}
          onAction={onAction}
          onNavigate={onNavigate}
        />
      );
    
    case 'buy-cargo':
      return <BuyCargoScreen {...screenProps} />;
    
    case 'sell-cargo':
      return <SellCargoScreen {...screenProps} />;
    
    case 'shipyard':
      return <ShipyardScreen {...screenProps} />;
    
    case 'buy-equipment':
      return <BuyEquipmentScreen {...screenProps} />;
    
    case 'sell-equipment':
      return <SellEquipmentScreen {...screenProps} />;
    
    case 'personnel':
      return <PersonnelScreen {...screenProps} />;
    
    case 'bank':
      return <BankScreen {...screenProps} />;
    
    case 'system-info':
      return <SystemInfoScreen {...screenProps} />;
    
    case 'commander':
      return <CommanderStatusScreen {...screenProps} />;
    
    case 'galaxy-chart':
      return <SystemChartScreen {...screenProps} />;
    
    default:
      return (
        <div className="space-panel text-center">
          <h2 className="retro-title text-neon-red">Screen Not Found</h2>
          <p className="text-palm-gray mb-4">Unknown screen: {currentScreen}</p>
          <button onClick={() => onNavigate('planet')} className="neon-button">
            Return to Planet
          </button>
        </div>
      );
  }
}
