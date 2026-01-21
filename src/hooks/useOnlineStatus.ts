import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para verificar status online/offline
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook com callbacks para mudança de status online
 */
export function useOnlineStatusWithCallbacks(options: {
  onOnline?: () => void;
  onOffline?: () => void;
} = {}): boolean {
  const isOnline = useOnlineStatus();
  const { onOnline, onOffline } = options;

  useEffect(() => {
    if (isOnline) {
      onOnline?.();
    } else {
      onOffline?.();
    }
  }, [isOnline, onOnline, onOffline]);

  return isOnline;
}

type VisibilityState = 'visible' | 'hidden' | 'prerender';

/**
 * Hook para verificar visibilidade do documento
 */
export function useDocumentVisibility(): VisibilityState {
  const [visibility, setVisibility] = useState<VisibilityState>(() => {
    if (typeof document === 'undefined') return 'visible';
    return document.visibilityState;
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setVisibility(document.visibilityState);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return visibility;
}

/**
 * Hook para verificar se documento está visível (boolean)
 */
export function useIsDocumentVisible(): boolean {
  const visibility = useDocumentVisibility();
  return visibility === 'visible';
}

/**
 * Hook com callbacks para mudança de visibilidade
 */
export function useVisibilityChange(options: {
  onVisible?: () => void;
  onHidden?: () => void;
} = {}): VisibilityState {
  const visibility = useDocumentVisibility();
  const { onVisible, onHidden } = options;

  useEffect(() => {
    if (visibility === 'visible') {
      onVisible?.();
    } else if (visibility === 'hidden') {
      onHidden?.();
    }
  }, [visibility, onVisible, onHidden]);

  return visibility;
}

/**
 * Hook para pausar/retomar atividade baseado em visibilidade
 */
export function usePageActivity(
  onActive: () => void,
  onInactive: () => void,
  options: { delay?: number } = {}
): { isActive: boolean } {
  const isVisible = useIsDocumentVisible();
  const isOnline = useOnlineStatus();
  const isActive = isVisible && isOnline;
  const { delay = 0 } = options;

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isActive) {
      if (delay > 0) {
        timeoutId = setTimeout(onActive, delay);
      } else {
        onActive();
      }
    } else {
      onInactive();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isActive, onActive, onInactive, delay]);

  return { isActive };
}

/**
 * Hook para detectar idle/inatividade do usuário
 */
export function useIdle(timeoutMs: number = 60000): boolean {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const resetTimer = useCallback(() => {
    setIsIdle(false);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsIdle(true), timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      clearTimeout(timeoutRef.current);
    };
  }, [resetTimer]);

  return isIdle;
}

// Need to import useRef
import { useRef } from 'react';

export default useOnlineStatus;
