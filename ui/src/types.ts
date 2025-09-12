// UI-specific types for Space Trader screens
export type ScreenType = 
  | 'galaxy-chart'
  | 'system-info'  
  | 'destination'
  | 'buy-cargo'
  | 'sell-cargo'
  | 'shipyard'
  | 'ship-purchase'
  | 'buy-equipment'
  | 'sell-equipment'
  | 'personnel'
  | 'bank'
  | 'commander'
  | 'planet';

export interface NavigationState {
  currentScreen: ScreenType;
  previousScreen?: ScreenType;
}

export interface ScreenProps {
  onNavigate: (screen: ScreenType) => void;
  onBack: () => void;
  // Game engine props (optional for backwards compatibility)
  state?: any;
  onAction?: (action: any) => Promise<any>;
  availableActions?: any[];
  isLoading?: boolean;
}
