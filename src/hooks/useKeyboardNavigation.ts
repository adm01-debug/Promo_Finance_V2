import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSmartBack } from './useSmartBack';
import { navigateWithUnsavedGuard } from '@/lib/unsaved-guard';

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
        if (location.pathname !== '/' && location.pathname !== '/dashboard') {
          goBack();
        }
      }

      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        navigateWithUnsavedGuard(() => navigate(1));
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
