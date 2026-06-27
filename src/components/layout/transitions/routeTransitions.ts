import type { TransitionName } from './types';

/**
 * Mapeamento opcional rota → efeito. Matching por `startsWith`.
 * Rotas mais específicas devem vir antes das genéricas.
 */
export const ROUTE_TRANSITIONS: Array<{ path: string; effect: TransitionName }> = [
  { path: '/auth', effect: 'fade' },
  { path: '/dashboard', effect: 'fade' },
  { path: '/tributario', effect: 'slide-left' },
  { path: '/admin', effect: 'zoom-in' },
];

export function resolveRouteEffect(pathname: string): TransitionName | undefined {
  const match = ROUTE_TRANSITIONS.find((r) => pathname.startsWith(r.path));
  return match?.effect;
}
