import { useState, useEffect, useCallback, useRef } from 'react';

interface UseIdleOptions {
  timeout?: number;
  events?: string[];
  onIdle?: () => void;
  onActive?: () => void;
  initialState?: 'idle' | 'active';
}

const DEFAULT_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'wheel',
  'resize',
];

/**
 * Hook to detect user idle state
 */
export function useIdle(options: UseIdleOptions = {}) {
  const {
    timeout = 60000, // 1 minute default
    events = DEFAULT_EVENTS,
    onIdle,
    onActive,
    initialState = 'active',
  } = options;

  const [isIdle, setIsIdle] = useState(initialState === 'idle');
  const [lastActive, setLastActive] = useState(Date.now());
  const [idleTime, setIdleTime] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const handleActivity = useCallback(() => {
    const now = Date.now();
    setLastActive(now);
    setIdleTime(0);

    if (isIdle) {
      setIsIdle(false);
      onActive?.();
    }

    // Reset timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      onIdle?.();
    }, timeout);
  }, [isIdle, timeout, onIdle, onActive]);

  // Set up event listeners
  useEffect(() => {
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timeout
    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      onIdle?.();
    }, timeout);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [events, handleActivity, timeout, onIdle]);

  // Track idle time
  useEffect(() => {
    if (isIdle) {
      intervalRef.current = setInterval(() => {
        setIdleTime((prev) => prev + 1000);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isIdle]);

  // Manual activate
  const activate = useCallback(() => {
    handleActivity();
  }, [handleActivity]);

  // Get time since last activity
  const getTimeSinceActive = useCallback(() => {
    return Date.now() - lastActive;
  }, [lastActive]);

  return {
    isIdle,
    lastActive,
    idleTime,
    activate,
    getTimeSinceActive,
  };
}

/**
 * Hook for session timeout warning
 */
export function useSessionTimeout(options: {
  warningTime: number; // Time before timeout to show warning (ms)
  timeoutTime: number; // Time until session expires (ms)
  onWarning?: () => void;
  onTimeout?: () => void;
  onExtend?: () => void;
}) {
  const { warningTime, timeoutTime, onWarning, onTimeout, onExtend } = options;

  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timeoutTime);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const countdownRef = useRef<ReturnType<typeof setInterval>>();
  const lastActivityRef = useRef(Date.now());

  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setTimeRemaining(timeoutTime);

    // Clear existing timers
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      onWarning?.();

      // Start countdown
      countdownRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const remaining = Math.max(0, prev - 1000);
          return remaining;
        });
      }, 1000);
    }, timeoutTime - warningTime);

    // Set session timeout
    sessionTimeoutRef.current = setTimeout(() => {
      setShowWarning(false);
      onTimeout?.();
    }, timeoutTime);
  }, [timeoutTime, warningTime, onWarning, onTimeout]);

  const extendSession = useCallback(() => {
    resetTimers();
    onExtend?.();
  }, [resetTimers, onExtend]);

  // Set up activity listeners
  useEffect(() => {
    const handleActivity = () => {
      if (!showWarning) {
        resetTimers();
      }
    };

    DEFAULT_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial setup
    resetTimers();

    return () => {
      DEFAULT_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [resetTimers, showWarning]);

  return {
    showWarning,
    timeRemaining,
    extendSession,
  };
}

/**
 * Hook for tracking user activity metrics
 */
export function useActivityMetrics() {
  const [metrics, setMetrics] = useState({
    totalActiveTime: 0,
    totalIdleTime: 0,
    activitySessions: 0,
    lastActivityType: '',
    startTime: Date.now(),
  });

  const isActiveRef = useRef(true);
  const lastUpdateRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const updateMetrics = () => {
      const now = Date.now();
      const elapsed = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      setMetrics((prev) => ({
        ...prev,
        totalActiveTime: isActiveRef.current
          ? prev.totalActiveTime + elapsed
          : prev.totalActiveTime,
        totalIdleTime: !isActiveRef.current
          ? prev.totalIdleTime + elapsed
          : prev.totalIdleTime,
      }));
    };

    const handleActivity = (event: Event) => {
      if (!isActiveRef.current) {
        isActiveRef.current = true;
        setMetrics((prev) => ({
          ...prev,
          activitySessions: prev.activitySessions + 1,
        }));
      }
      setMetrics((prev) => ({
        ...prev,
        lastActivityType: event.type,
      }));
    };

    const handleIdle = () => {
      isActiveRef.current = false;
    };

    // Set up idle detection
    let idleTimeout: ReturnType<typeof setTimeout>;
    const resetIdleTimeout = () => {
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(handleIdle, 30000); // 30 seconds
    };

    DEFAULT_EVENTS.forEach((event) => {
      window.addEventListener(event, (e) => {
        handleActivity(e);
        resetIdleTimeout();
      }, { passive: true });
    });

    // Update metrics every second
    intervalRef.current = setInterval(updateMetrics, 1000);
    resetIdleTimeout();

    return () => {
      DEFAULT_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity as EventListener);
      });
      clearInterval(intervalRef.current);
      clearTimeout(idleTimeout);
    };
  }, []);

  const getActivePercentage = () => {
    const total = metrics.totalActiveTime + metrics.totalIdleTime;
    return total > 0 ? (metrics.totalActiveTime / total) * 100 : 100;
  };

  const getSessionDuration = () => {
    return Date.now() - metrics.startTime;
  };

  return {
    ...metrics,
    getActivePercentage,
    getSessionDuration,
  };
}

export default useIdle;
