import { useState, useCallback, useRef, useEffect } from 'react';

type AsyncStatus = 'idle' | 'pending' | 'success' | 'error';

interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: Error | null;
  isIdle: boolean;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
}

interface UseAsyncReturn<T, Args extends unknown[]> extends AsyncState<T> {
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
}

/**
 * Hook para gerenciar operações assíncronas
 * @param asyncFn - Função assíncrona
 * @param options - Opções de configuração
 */
export function useAsync<T, Args extends unknown[] = []>(
  asyncFn: (...args: Args) => Promise<T>,
  options: {
    immediate?: boolean;
    args?: Args;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    onSettled?: () => void;
  } = {}
): UseAsyncReturn<T, Args> {
  const { immediate = false, args, onSuccess, onError, onSettled } = options;

  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);
  const asyncFnRef = useRef(asyncFn);

  useEffect(() => {
    asyncFnRef.current = asyncFn;
  }, [asyncFn]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...executeArgs: Args): Promise<T | null> => {
      setStatus('pending');
      setError(null);

      try {
        const result = await asyncFnRef.current(...executeArgs);
        
        if (mountedRef.current) {
          setData(result);
          setStatus('success');
          onSuccess?.(result);
        }
        
        return result;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        
        if (mountedRef.current) {
          setError(err);
          setStatus('error');
          onError?.(err);
        }
        
        return null;
      } finally {
        if (mountedRef.current) {
          onSettled?.();
        }
      }
    },
    [onSuccess, onError, onSettled]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setData(null);
    setError(null);
  }, []);

  // Executar imediatamente se configurado
  useEffect(() => {
    if (immediate && args) {
      execute(...args);
    }
  }, [immediate]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    status,
    data,
    error,
    isIdle: status === 'idle',
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
    execute,
    reset,
    setData,
  };
}

/**
 * Hook simplificado para fetch
 */
export function useFetch<T>(
  url: string,
  options: RequestInit & {
    immediate?: boolean;
    transform?: (data: unknown) => T;
  } = {}
) {
  const { immediate = true, transform, ...fetchOptions } = options;

  const fetchFn = useCallback(async (): Promise<T> => {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const json = await response.json();
    return transform ? transform(json) : json;
  }, [url, fetchOptions, transform]);

  return useAsync<T, []>(fetchFn, { immediate });
}

/**
 * Hook para polling
 */
export function usePolling<T>(
  asyncFn: () => Promise<T>,
  interval: number,
  options: {
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const { enabled = true, onSuccess, onError } = options;
  const { execute, ...asyncState } = useAsync(asyncFn, { onSuccess, onError });

  useEffect(() => {
    if (!enabled) return;

    execute();

    const id = setInterval(() => {
      execute();
    }, interval);

    return () => clearInterval(id);
  }, [enabled, interval, execute]);

  return { ...asyncState, refetch: execute };
}

/**
 * Hook para retry automático
 */
export function useAsyncRetry<T, Args extends unknown[] = []>(
  asyncFn: (...args: Args) => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
) {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options;
  const [retryCount, setRetryCount] = useState(0);

  const wrappedFn = useCallback(
    async (...args: Args): Promise<T> => {
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await asyncFn(...args);
          setRetryCount(0);
          return result;
        } catch (e) {
          lastError = e instanceof Error ? e : new Error(String(e));
          
          if (attempt < maxRetries) {
            setRetryCount(attempt + 1);
            onRetry?.(attempt + 1, lastError);
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }
      }
      
      throw lastError;
    },
    [asyncFn, maxRetries, retryDelay, onRetry]
  );

  const asyncState = useAsync<T, Args>(wrappedFn);

  return {
    ...asyncState,
    retryCount,
    isRetrying: retryCount > 0 && asyncState.isPending,
  };
}
