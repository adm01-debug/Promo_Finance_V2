import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { previousNavEntry, resolveParentRoute, getRouteLabel } from '@/lib/navigation';
import { navigateWithUnsavedGuard } from '@/lib/unsaved-guard';
import { addBreadcrumb } from '@/lib/telemetry';

export type BackMethod = 'button' | 'swipe' | 'keyboard' | 'programmatic';

export interface SmartBack {
  /** Volta: navega para a entrada in-app anterior ou sobe para a rota-pai. */
  goBack: () => void;
  /** Label do destino de volta ("Contas a Pagar", "Dashboard"...). */
  backLabel: string;
  /** True quando há uma entrada in-app anterior na pilha. */
  canGoInApp: boolean;
}

/**
 * "Voltar" semântico: usa navigate(-1) apenas quando a entrada anterior
 * do histórico é conhecida e interna (pilha mantida pelo NavigationTracker);
 * entrada direta por link/bookmark sobe para a rota-pai — nunca sai do app.
 * Respeita a guarda de alterações não salvas.
 */
export function useSmartBack(method: BackMethod = 'programmatic'): SmartBack {
  const navigate = useNavigate();
  const location = useLocation();

  const prev = previousNavEntry();
  const canGoInApp = prev !== undefined;
  const parentPath = canGoInApp ? prev.pathname : resolveParentRoute(location.pathname);
  const backLabel = getRouteLabel(parentPath);

  const goBack = useCallback(() => {
    navigateWithUnsavedGuard(() => {
      addBreadcrumb('nav_back', {
        from: location.pathname,
        to: canGoInApp ? prev.pathname : parentPath,
        method,
        inApp: canGoInApp,
      });
      if (canGoInApp) {
        navigate(-1);
      } else {
        navigate(parentPath);
      }
    });
  }, [navigate, location.pathname, canGoInApp, prev, parentPath, method]);

  return { goBack, backLabel, canGoInApp };
}
