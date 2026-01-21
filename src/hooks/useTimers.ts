import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook para executar callback em intervalos
 * @param callback - Função a ser executada
 * @param delay - Intervalo em ms (null para pausar)
 */
export function useInterval(
  callback: () => void,
  delay: number | null
): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/**
 * Hook para executar callback após delay
 * @param callback - Função a ser executada
 * @param delay - Delay em ms (null para não executar)
 */
export function useTimeout(
  callback: () => void,
  delay: number | null
): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}

/**
 * Hook para interval controlável
 */
export function useControllableInterval(
  callback: () => void,
  delay: number = 1000
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    if (intervalRef.current === null) {
      intervalRef.current = setInterval(() => savedCallback.current(), delay);
    }
  }, [delay]);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    start();
  }, [start, stop]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { start, stop, reset, isRunning: intervalRef.current !== null };
}

/**
 * Hook para timeout controlável
 */
export function useControllableTimeout(
  callback: () => void,
  delay: number = 1000
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    if (timeoutRef.current === null) {
      timeoutRef.current = setTimeout(() => {
        savedCallback.current();
        timeoutRef.current = null;
      }, delay);
    }
  }, [delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cancel();
    start();
  }, [cancel, start]);

  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return { start, cancel, reset, isPending: timeoutRef.current !== null };
}

/**
 * Hook para countdown timer
 */
export function useCountdown(
  initialSeconds: number,
  options: {
    autoStart?: boolean;
    onComplete?: () => void;
    interval?: number;
  } = {}
) {
  const { autoStart = false, onComplete, interval = 1000 } = options;
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);

  useInterval(
    () => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    },
    isRunning ? interval : null
  );

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback((newSeconds?: number) => {
    setIsRunning(false);
    setSeconds(newSeconds ?? initialSeconds);
  }, [initialSeconds]);

  return {
    seconds,
    isRunning,
    start,
    pause,
    reset,
    formatted: formatTime(seconds),
  };
}

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Need to import useState for useCountdown
import { useState } from 'react';

export default useInterval;
