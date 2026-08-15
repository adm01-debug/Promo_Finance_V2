import { createContext, useContext } from 'react';
import type { TransitionConfig } from './types';

export interface TransitionContextValue {
  defaults: TransitionConfig;
}

export const TransitionContext = createContext<TransitionContextValue>({
  defaults: { effect: 'blur-rise', duration: 350 },
});

export function useTransitionDefaults(): TransitionConfig {
  return useContext(TransitionContext).defaults;
}
