// Navigation hook for Space Trader screens
import { useState, useCallback } from 'react';
import type { ScreenType, NavigationState } from '../types.ts';

export function useNavigation(initialScreen: ScreenType = 'planet') {
  const [navigation, setNavigation] = useState<NavigationState>({
    currentScreen: initialScreen
  });

  const navigate = useCallback((screen: ScreenType) => {
    setNavigation(prev => ({
      currentScreen: screen,
      previousScreen: prev.currentScreen
    }));
  }, []);

  const goBack = useCallback(() => {
    setNavigation(prev => ({
      currentScreen: prev.previousScreen || 'planet',
      previousScreen: undefined
    }));
  }, []);

  return {
    currentScreen: navigation.currentScreen,
    navigate,
    goBack,
    canGoBack: !!navigation.previousScreen
  };
}
