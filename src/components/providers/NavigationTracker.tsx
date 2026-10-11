import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { useRecentItems } from '@/hooks/useRecentItems';
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
    } else if (isSensitiveRoute(pathname)) {
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
        const main = document.getElementById('main-content');
        if (main instanceof HTMLElement) {
          if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
          main.focus({ preventScroll: true });
        }
      }
    }
  }, [location, navigationType]);

  useEffect(() => {
    const path = location.pathname;

    // Recentes só para rotas internas conhecidas — nunca paths com token
    // (ficam em localStorage e viram links na sidebar).
    if (excludedRoutes.includes(path) || isSensitiveRoute(path) || !getRouteMeta(path)) return;

    addRecentItem(path, getRouteLabel(path));
  }, [location.pathname, addRecentItem]);

  // This component doesn't render anything
  return null;
}
