import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSmartBack } from './useSmartBack';
import {
  hasUnsavedChanges,
  MODAL_HISTORY_MARKER,
  navigateWithUnsavedGuard,
} from '@/lib/unsaved-guard';

/**
 * Keyboard shortcuts for navigation:
 * - Alt+ArrowLeft: Go back
 * - Alt+ArrowRight: Go forward
 * - Alt+Home: Go to dashboard
 */
export function useKeyboardNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { goBack } = useSmartBack('keyboard');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        // Modal aberto é um marcador no topo: o Voltar consome-o (fecha
        // o dialog) mesmo em rotas sem "anterior" como / e /dashboard —
        // sem o marcador, continua valendo a exceção das rotas-raiz.
        const onModalMarker =
          (window.history.state as Record<string, unknown> | null)?.[MODAL_HISTORY_MARKER] !==
          undefined;
        if (onModalMarker || (location.pathname !== '/' && location.pathname !== '/dashboard')) {
          goBack();
        }
      }

      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        // Com form sujo a sentinela é o topo e já apagou o histórico à
        // frente: não existe destino +1 real. Ignorar mantém a guarda armada.
        if (hasUnsavedChanges()) return;
        navigate(1);
      }

      if (e.altKey && e.key === 'Home') {
        e.preventDefault();
        navigateWithUnsavedGuard(() => navigate('/'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, goBack, location.pathname]);
}
