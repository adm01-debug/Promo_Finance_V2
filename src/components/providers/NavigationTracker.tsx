import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { useRecentItems } from '@/hooks/useRecentItems';
import { useAuth } from '@/hooks/useAuth';
import {
  getRouteLabel,
  getRouteMeta,
  isSensitiveRoute,
  recordNavEntry,
  resetNavStack,
} from '@/lib/navigation';

// Routes to exclude from tracking
const excludedRoutes = ['/auth', '/404'];

/** Scroll salvo por location.key para restaurar em navegação POP. */
const scrollPositions = new Map<string, number>();

export function NavigationTracker() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const { addRecentItem } = useRecentItems();
  const { hasRole } = useAuth();
  const prevPathRef = useRef<string | null>(null);
  const firstRenderRef = useRef(true);

  // Persiste continuamente a posição de scroll da entrada corrente do histórico.
  useEffect(() => {
    const key = location.key;
    const onScroll = () => scrollPositions.set(key, window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      onScroll();
    };
  }, [location.key]);

  useEffect(() => {
    const { pathname, search, key } = location;

    // Pilha in-app usada pelo Voltar semântico (useSmartBack). Cruzar por
    // rota excluída (ex.: /auth) invalida a contiguidade — sem isso,
    // navigate(-1) poderia devolver a página de autenticação.
    const untracked = excludedRoutes.includes(pathname) || isSensitiveRoute(pathname);
    if (untracked) {
      resetNavStack();
    } else {
      recordNavEntry({ key, pathname, search }, navigationType);
    }

    // Título do documento reflete a rota (abas, histórico, leitores de tela).
    // Rotas com token no path não expõem o segmento no título.
    if (!untracked) {
      document.title = `${getRouteLabel(pathname)} — Promo Finance`;
    } else {
      // Rotas excluídas (/auth, /404) ou sensíveis recebem título genérico —
      // não carregar o contexto da tela anterior (ex.: logout para /auth).
      document.title = 'Promo Finance';
    }

    const isFirst = firstRenderRef.current;
    firstRenderRef.current = false;
    const pathnameChanged = prevPathRef.current !== null && prevPathRef.current !== pathname;
    prevPathRef.current = pathname;

    if (!isFirst) {
      // Scroll: restaura posição salva em POP; sobe ao topo em navegação nova.
      if (navigationType === 'POP' && scrollPositions.has(key)) {
        const saved = scrollPositions.get(key) ?? 0;
        requestAnimationFrame(() => window.scrollTo(0, saved));
      } else if (pathnameChanged) {
        window.scrollTo(0, 0);
      }

      // Foco no conteúdo principal ao mudar de página (a11y — SPAs não
      // anunciam navegação automaticamente para leitores de tela).
      if (pathnameChanged) {
        const focusMain = () => {
          const main = document.getElementById('main-content');
          if (!(main instanceof HTMLElement)) return false;
          // Sob o Suspense, o #main-content da rota ANTERIOR pode seguir
          // no DOM oculto atrás do fallback — focar nele não anuncia a
          // nova página: espera o conteúdo da nova rota montar.
          if (main.getClientRects().length === 0) return false;
          if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
          main.focus({ preventScroll: true });
          return document.activeElement === main;
        };
        // Rota lazy: sob o Suspense ainda não existe #main-content —
        // observa a montagem do conteúdo e foca quando ele aparecer.
        if (!focusMain()) {
          const observer = new MutationObserver(() => {
            if (focusMain()) observer.disconnect();
          });
          observer.observe(document.body, { childList: true, subtree: true });
          window.setTimeout(() => observer.disconnect(), 5000);
        }
      }
    }
  }, [location, navigationType]);

  useEffect(() => {
    const path = location.pathname;

    // Recentes só para rotas internas conhecidas — nunca paths com token
    // (ficam em localStorage e viram links na sidebar) e nunca rotas que
    // a autorização do ProtectedRoute vai recusar: o tracker monta acima
    // do guard, então um link recusado entraria na lista igual.
    const meta = getRouteMeta(path);
    if (excludedRoutes.includes(path) || isSensitiveRoute(path) || !meta) return;
    if (meta.requiredRoles?.length && !hasRole(meta.requiredRoles)) return;

    addRecentItem(path, getRouteLabel(path));
  }, [location.pathname, addRecentItem, hasRole]);

  // This component doesn't render anything
  return null;
}
