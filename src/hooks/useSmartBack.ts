import { useCallback, useSyncExternalStore } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  previousNavEntry,
  resolveParentRoute,
  getRouteLabel,
  subscribeNavStack,
  getNavStackVersion,
} from '@/lib/navigation';
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
  // Re-renderiza quando o NavigationTracker registra a nova localização.
  useSyncExternalStore(subscribeNavStack, getNavStackVersion, getNavStackVersion);

  const prev = previousNavEntry();
  const canGoInApp = prev !== undefined;
  const backLabel = getRouteLabel(prev ? prev.pathname : resolveParentRoute(location.pathname));

  const goBack = useCallback(() => {
    navigateWithUnsavedGuard(() => {
      // Lê a pilha no momento do clique, não do último render.
      const target = previousNavEntry();
      const parentPath = resolveParentRoute(location.pathname);
      addBreadcrumb('nav_back', {
        from: location.pathname,
        to: target ? target.pathname : parentPath,
        method,
        inApp: target !== undefined,
      });
      if (target) {
        navigate(-1);
      } else {
        // REPLACE, não PUSH: empilhar a rota-pai sobre a origem faria o
        // próximo Voltar apontar de volta para a página inicial e oscilar
        // filho↔pai em vez de subir até o Dashboard.
        navigate(parentPath, { replace: true });
      }
    });
  }, [navigate, location.pathname, method]);

  return { goBack, backLabel, canGoInApp };
}
