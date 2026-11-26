import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { BackHandler, Platform } from 'react-native';

import type { Route } from '@/types';

interface NavigationContextValue {
  route: Route;
  canGoBack: boolean;
  isEditingPlan: boolean;
  navigate: (route: Route) => void;
  goBack: () => void;
  resetTo: (route: Route) => void;
  startPlanEditing: () => void;
  finishPlanEditing: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  const [isEditingPlan, setIsEditingPlan] = useState(false);

  const navigate = useCallback(
    (route: Route) => setStack((current) => [...current, route]),
    [],
  );

  const goBack = useCallback(() => {
    setStack((current) =>
      current.length > 1 ? current.slice(0, -1) : current,
    );
  }, []);

  const canGoBack = stack.length > 1;

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (!canGoBack) return false;

        goBack();
        return true;
      },
    );

    return () => subscription.remove();
  }, [canGoBack, goBack]);

  const resetTo = useCallback((route: Route) => setStack([route]), []);

  const startPlanEditing = useCallback(() => setIsEditingPlan(true), []);
  const finishPlanEditing = useCallback(() => setIsEditingPlan(false), []);

  const value = useMemo<NavigationContextValue>(
    () => ({
      route: stack[stack.length - 1],
      canGoBack,
      isEditingPlan,
      navigate,
      goBack,
      resetTo,
      startPlanEditing,
      finishPlanEditing,
    }),
    [
      stack,
      canGoBack,
      isEditingPlan,
      navigate,
      goBack,
      resetTo,
      startPlanEditing,
      finishPlanEditing,
    ],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);

  if (!context) {
    throw new Error(
      'useNavigation musi być użyty wewnątrz NavigationProvider.',
    );
  }

  return context;
}
