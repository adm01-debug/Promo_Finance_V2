import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Keyboard shortcuts for navigation:
 * - Alt+ArrowLeft: Go back
 * - Alt+ArrowRight: Go forward
 * - Alt+Home: Go to dashboard
 */
export function useKeyboardNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

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
          if (window.history.length > 2) {
            navigate(-1);
          } else {
            navigate('/');
          }
        }
      }

      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        navigate(1);
      }

      if (e.altKey && e.key === 'Home') {
        e.preventDefault();
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, location.pathname]);
}
