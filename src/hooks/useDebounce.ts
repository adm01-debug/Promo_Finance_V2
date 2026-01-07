/**
 * Debounce e Throttle Hooks
 * Otimização de inputs e eventos frequentes
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Debounce um valor - atualiza apenas após o delay
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
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
 * Debounce uma função callback
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Atualiza a ref sempre que o callback mudar
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Throttle uma função - executa no máximo uma vez por intervalo
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        lastRunRef.current = now;
        callbackRef.current(...args);
      } else {
        // Schedule para executar no final do período
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          callbackRef.current(...args);
        }, delay - timeSinceLastRun);
      }
    },
    [delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

/**
 * Hook para input de busca com debounce
 */
export function useSearchInput(
  initialValue: string = '',
  delay: number = 300
): {
  value: string;
  debouncedValue: string;
  setValue: (value: string) => void;
  clear: () => void;
  isSearching: boolean;
} {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, delay);
  const isSearching = value !== debouncedValue;

  const clear = useCallback(() => {
    setValue('');
  }, []);

  return {
    value,
    debouncedValue,
    setValue,
    clear,
    isSearching,
  };
}

/**
 * Hook para detectar quando o usuário parou de digitar
 */
export function useTypingDetection(
  delay: number = 1000
): {
  isTyping: boolean;
  onKeyPress: () => void;
} {
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onKeyPress = useCallback(() => {
    setIsTyping(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { isTyping, onKeyPress };
}

/**
 * Hook para resize com throttle
 */
export function useWindowSize(throttleMs: number = 100): {
  width: number;
  height: number;
} {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const handleResize = useThrottledCallback(() => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, throttleMs);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return size;
}

/**
 * Hook para scroll position com throttle
 */
export function useScrollPosition(throttleMs: number = 100): {
  x: number;
  y: number;
  direction: 'up' | 'down' | null;
} {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  const prevYRef = useRef(0);

  const handleScroll = useThrottledCallback(() => {
    const y = window.scrollY;
    setDirection(y > prevYRef.current ? 'down' : y < prevYRef.current ? 'up' : null);
    prevYRef.current = y;
    setPosition({ x: window.scrollX, y });
  }, throttleMs);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return { ...position, direction };
}

/**
 * Hook para input numérico com validação debounced
 */
export function useNumericInput(
  initialValue: number = 0,
  options: {
    min?: number;
    max?: number;
    decimals?: number;
    delay?: number;
  } = {}
): {
  value: string;
  numericValue: number;
  debouncedValue: number;
  setValue: (value: string) => void;
  isValid: boolean;
} {
  const { min, max, decimals = 2, delay = 300 } = options;
  const [value, setValue] = useState(initialValue.toString());
  
  const numericValue = useMemo(() => {
    const parsed = parseFloat(value.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }, [value]);

  const debouncedValue = useDebounce(numericValue, delay);

  const isValid = useMemo(() => {
    if (min !== undefined && numericValue < min) return false;
    if (max !== undefined && numericValue > max) return false;
    return true;
  }, [numericValue, min, max]);

  const handleSetValue = useCallback((newValue: string) => {
    // Permite apenas números, vírgula e ponto
    const sanitized = newValue.replace(/[^\d.,\-]/g, '');
    setValue(sanitized);
  }, []);

  return {
    value,
    numericValue,
    debouncedValue,
    setValue: handleSetValue,
    isValid,
  };
}
