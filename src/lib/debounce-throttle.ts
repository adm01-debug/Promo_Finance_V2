// ============================================
// DEBOUNCE & THROTTLE: Controle de execução de funções
// Otimização para eventos de alta frequência
// ============================================

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';

// ============================================
// TIPOS
// ============================================

interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

type AnyFunction = (...args: unknown[]) => unknown;

interface DebouncedFunction<T extends AnyFunction> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
  pending: () => boolean;
}

interface ThrottledFunction<T extends AnyFunction> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

/**
 * Debounce - Atrasa a execução até que pare de ser chamada
 */
export function debounce<T extends AnyFunction>(
  func: T,
  wait: number,
  options: DebounceOptions = {}
): DebouncedFunction<T> {
  const { leading = false, trailing = true, maxWait } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let maxTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;
  let result: ReturnType<T>;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;

  const invokeFunc = (time: number): ReturnType<T> => {
    const args = lastArgs!;
    const thisArg = lastThis;

    lastArgs = null;
    lastThis = null;
    lastInvokeTime = time;
    result = func.apply(thisArg, args) as ReturnType<T>;
    return result;
  };

  const startTimer = (pendingFunc: () => void, wait: number) => {
    return setTimeout(pendingFunc, wait);
  };

  const cancelTimer = (id: ReturnType<typeof setTimeout> | null) => {
    if (id !== null) {
      clearTimeout(id);
    }
  };

  const leadingEdge = (time: number) => {
    lastInvokeTime = time;

    if (maxWait !== undefined) {
      maxTimeoutId = startTimer(timerExpired, maxWait);
    }

    return leading ? invokeFunc(time) : result;
  };

  const remainingWait = (time: number) => {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  };

  const shouldInvoke = (time: number) => {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };

  const timerExpired = () => {
    const time = Date.now();

    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }

    timeoutId = startTimer(timerExpired, remainingWait(time));
  };

  const trailingEdge = (time: number) => {
    timeoutId = null;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }

    lastArgs = null;
    lastThis = null;
    return result;
  };

  const cancel = () => {
    cancelTimer(timeoutId);
    cancelTimer(maxTimeoutId);
    lastInvokeTime = 0;
    lastArgs = null;
    lastCallTime = undefined;
    lastThis = null;
    timeoutId = null;
    maxTimeoutId = null;
  };

  const flush = () => {
    if (timeoutId === null) {
      return result;
    }

    return trailingEdge(Date.now());
  };

  const pending = () => {
    return timeoutId !== null;
  };

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(lastCallTime);
      }

      if (maxWait !== undefined) {
        timeoutId = startTimer(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }

    if (timeoutId === null) {
      timeoutId = startTimer(timerExpired, wait);
    }

    return result;
  } as DebouncedFunction<T>;

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced;
}

/**
 * Throttle - Limita a execução a uma vez por período
 */
export function throttle<T extends AnyFunction>(
  func: T,
  wait: number,
  options: ThrottleOptions = {}
): ThrottledFunction<T> {
  const { leading = true, trailing = true } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;
  let lastCallTime = 0;

  const invokeFunc = () => {
    const args = lastArgs!;
    const thisArg = lastThis;

    lastArgs = null;
    lastThis = null;
    lastCallTime = Date.now();
    func.apply(thisArg, args);
  };

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
    lastCallTime = 0;
  };

  const flush = () => {
    if (timeoutId !== null && lastArgs !== null) {
      invokeFunc();
      cancel();
    }
  };

  const throttled = function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastCallTime);

    lastArgs = args;
    lastThis = this;

    if (remaining <= 0 || remaining > wait) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (leading) {
        invokeFunc();
      } else {
        lastCallTime = now;
      }
    } else if (timeoutId === null && trailing) {
      timeoutId = setTimeout(() => {
        invokeFunc();
        timeoutId = null;
      }, remaining);
    }
  } as ThrottledFunction<T>;

  throttled.cancel = cancel;
  throttled.flush = flush;

  return throttled;
}

/**
 * RAF Throttle - Throttle usando requestAnimationFrame
 */
export function rafThrottle<T extends AnyFunction>(func: T): ThrottledFunction<T> {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;

  const throttled = function (this: unknown, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func.apply(lastThis, lastArgs!);
        rafId = null;
      });
    }
  } as ThrottledFunction<T>;

  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  throttled.flush = () => {
    if (rafId !== null && lastArgs !== null) {
      cancelAnimationFrame(rafId);
      func.apply(lastThis, lastArgs);
      rafId = null;
    }
  };

  return throttled;
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook de debounce para valores
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook de debounce para funções
 */
export function useDebouncedCallback<T extends AnyFunction>(
  callback: T,
  delay: number,
  options?: DebounceOptions
): DebouncedFunction<T> {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const debouncedFn = useMemo(
    () => {
      const fn = ((...args: Parameters<T>) => callbackRef.current(...args)) as T;
      return debounce(fn, delay, options);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay]
  );

  useEffect(() => {
    return () => {
      debouncedFn.cancel();
    };
  }, [debouncedFn]);

  return debouncedFn;
}

/**
 * Hook de throttle para valores
 */
export function useThrottledValue<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdate = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdate.current;

    if (timeSinceLastUpdate >= delay) {
      setThrottledValue(value);
      lastUpdate.current = now;
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value);
        lastUpdate.current = Date.now();
      }, delay - timeSinceLastUpdate);

      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return throttledValue;
}

/**
 * Hook de throttle para funções
 */
export function useThrottledCallback<T extends AnyFunction>(
  callback: T,
  delay: number,
  options?: ThrottleOptions
): ThrottledFunction<T> {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const throttledFn = useMemo(
    () =>
      throttle(
        ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
        delay,
        options
      ),
    [delay, options]
  );

  useEffect(() => {
    return () => {
      throttledFn.cancel();
    };
  }, [throttledFn]);

  return throttledFn;
}

/**
 * Hook para input com debounce
 */
export function useDebouncedInput(
  initialValue: string,
  delay: number = 300
): {
  value: string;
  debouncedValue: string;
  onChange: (value: string) => void;
  reset: () => void;
} {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebouncedValue(value, delay);

  const onChange = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return {
    value,
    debouncedValue,
    onChange,
    reset,
  };
}

/**
 * Hook para busca com debounce
 */
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T>,
  delay: number = 300
): {
  query: string;
  setQuery: (query: string) => void;
  results: T | null;
  isSearching: boolean;
  error: Error | null;
  clear: () => void;
} {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debouncedQuery = useDebouncedValue(query, delay);
  const searchFnRef = useRef(searchFn);
  searchFnRef.current = searchFn;

  useEffect(() => {
    if (!debouncedQuery) {
      setResults(null);
      return;
    }

    let cancelled = false;

    const search = async () => {
      setIsSearching(true);
      setError(null);

      try {
        const result = await searchFnRef.current(debouncedQuery);
        if (!cancelled) {
          setResults(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Erro na busca'));
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    };

    search();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const clear = useCallback(() => {
    setQuery('');
    setResults(null);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    clear,
  };
}

/**
 * Hook para resize com throttle
 */
export function useWindowResize(
  callback: (size: { width: number; height: number }) => void,
  throttleMs: number = 100
): void {
  const throttledCallback = useThrottledCallback(callback, throttleMs);

  useEffect(() => {
    const handleResize = () => {
      throttledCallback({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      throttledCallback.cancel();
    };
  }, [throttledCallback]);
}

/**
 * Hook para scroll com throttle
 */
export function useScrollPosition(
  throttleMs: number = 100
): { x: number; y: number } {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleScroll = useThrottledCallback(() => {
    setPosition({
      x: window.scrollX,
      y: window.scrollY,
    });
  }, throttleMs);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      handleScroll.cancel();
    };
  }, [handleScroll]);

  return position;
}

/**
 * Hook para mouse position com RAF throttle
 */
export function useMousePosition(): { x: number; y: number } {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = rafThrottle((e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    });

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      handleMouseMove.cancel();
    };
  }, []);

  return position;
}

// ============================================
// EXPORTS
// ============================================

export default {
  debounce,
  throttle,
  rafThrottle,
  useDebouncedValue,
  useDebouncedCallback,
  useThrottledValue,
  useThrottledCallback,
  useDebouncedInput,
  useDebouncedSearch,
  useWindowResize,
  useScrollPosition,
  useMousePosition,
};
