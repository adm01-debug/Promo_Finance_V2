import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { TransitionConfig } from './types';

interface TransitionContextValue {
  defaults: TransitionConfig;
}

const TransitionContext = createContext<TransitionContextValue>({
  defaults: { effect: 'blur-rise', duration: 350 },
});

export interface TransitionProviderProps {
  children: ReactNode;
  defaults?: TransitionConfig;
}

export function TransitionProvider({ children, defaults }: TransitionProviderProps) {
  const value = useMemo<TransitionContextValue>(
    () => ({ defaults: { effect: 'blur-rise', duration: 350, ...defaults } }),
    [defaults],
  );
  return <TransitionContext.Provider value={value}>{children}</TransitionContext.Provider>;
}

export function useTransitionDefaults(): TransitionConfig {
  return useContext(TransitionContext).defaults;
}
