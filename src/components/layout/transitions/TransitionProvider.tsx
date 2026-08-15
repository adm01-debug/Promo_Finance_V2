import { useMemo, type ReactNode } from 'react';
import type { TransitionConfig } from './types';
import { TransitionContext, type TransitionContextValue } from './TransitionContext';

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
