import { useLocation } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import { REDUCED_MOTION_PRESET, resolvePreset } from './presets';
import { resolveRouteEffect } from './routeTransitions';
import { useTransitionDefaults } from './TransitionProvider';
import type { ResolvedPreset, TransitionConfig } from './types';

/**
 * Resolve o preset de transição a aplicar na rota atual.
 * Ordem de prioridade: override prop > rota mapeada > default do provider.
 * Respeita `prefers-reduced-motion`.
 */
export function useTransition(override?: TransitionConfig): ResolvedPreset {
  const location = useLocation();
  const defaults = useTransitionDefaults();
  const prefersReduced = useReducedMotion();

  return useMemo<ResolvedPreset>(() => {
    if (prefersReduced) return REDUCED_MOTION_PRESET;

    const routeEffect = resolveRouteEffect(location.pathname);
    const merged: TransitionConfig = {
      ...defaults,
      ...(routeEffect ? { effect: routeEffect } : {}),
      ...override,
    };
    return resolvePreset(merged);
  }, [defaults, location.pathname, override, prefersReduced]);
}
