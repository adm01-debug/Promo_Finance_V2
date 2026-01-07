/**
 * Sistema de Retry Automático
 * Utilitários para operações com retry
 */

// ============================================
// TIPOS
// ============================================

export interface RetryConfig {
  /** Número máximo de tentativas */
  maxRetries?: number;
  /** Delay inicial entre tentativas (ms) */
  initialDelay?: number;
  /** Fator de multiplicação do delay (backoff exponencial) */
  backoffFactor?: number;
  /** Delay máximo entre tentativas (ms) */
  maxDelay?: number;
  /** Jitter aleatório para evitar thundering herd (0-1) */
  jitter?: number;
  /** Função para determinar se deve fazer retry */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Callback chamado antes de cada retry */
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
  /** Timeout para cada tentativa (ms) */
  timeout?: number;
  /** Signal para abortar */
  signal?: AbortSignal;
}

export interface RetryState {
  attempt: number;
  totalAttempts: number;
  lastError: unknown;
  isRetrying: boolean;
}

// ============================================
// DEFAULTS
// ============================================

const DEFAULT_CONFIG: Required<Omit<RetryConfig, 'onRetry' | 'signal'>> = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffFactor: 2,
  maxDelay: 30000,
  jitter: 0.1,
  shouldRetry: () => true,
  timeout: 30000,
};

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

/**
 * Executa uma operação com retry automático
 */
export async function retry<T>(
  operation: (attempt: number) => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_CONFIG.maxRetries,
    initialDelay = DEFAULT_CONFIG.initialDelay,
    backoffFactor = DEFAULT_CONFIG.backoffFactor,
    maxDelay = DEFAULT_CONFIG.maxDelay,
    jitter = DEFAULT_CONFIG.jitter,
    shouldRetry = DEFAULT_CONFIG.shouldRetry,
    timeout = DEFAULT_CONFIG.timeout,
    onRetry,
    signal,
  } = config;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= maxRetries) {
    // Verificar se foi abortado
    if (signal?.aborted) {
      throw new Error('Operation aborted');
    }

    try {
      // Executar com timeout
      const result = await withTimeout(operation(attempt), timeout, signal);
      return result;
    } catch (error) {
      lastError = error;
      attempt++;

      // Verificar se deve fazer retry
      if (attempt > maxRetries || !shouldRetry(error, attempt)) {
        throw error;
      }

      // Calcular delay com backoff exponencial e jitter
      const baseDelay = Math.min(initialDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
      const jitterAmount = baseDelay * jitter * Math.random();
      const delay = baseDelay + jitterAmount;

      // Callback de retry
      onRetry?.(error, attempt, delay);

      // Aguardar antes do retry
      await sleep(delay, signal);
    }
  }

  throw lastError;
}

/**
 * Wrapper para operações com timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeout: number,
  signal?: AbortSignal
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeout}ms`));
    }, timeout);

    // Listener para abort signal
    const abortHandler = () => {
      clearTimeout(timeoutId);
      reject(new Error('Operation aborted'));
    };

    signal?.addEventListener('abort', abortHandler);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        signal?.removeEventListener('abort', abortHandler);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        signal?.removeEventListener('abort', abortHandler);
        reject(error);
      });
  });
}

/**
 * Sleep com suporte a abort signal
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new Error('Sleep aborted'));
    });
  });
}

// ============================================
// ESTRATÉGIAS DE RETRY
// ============================================

/**
 * Retry apenas para erros de rede
 */
export function networkErrorOnly(error: unknown): boolean {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return true;
  }
  if (error instanceof Error && error.name === 'NetworkError') {
    return true;
  }
  return false;
}

/**
 * Retry para erros 5xx
 */
export function serverErrorOnly(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    return status >= 500 && status < 600;
  }
  return false;
}

/**
 * Retry para erros recuperáveis (rede + 5xx)
 */
export function recoverableErrors(error: unknown): boolean {
  return networkErrorOnly(error) || serverErrorOnly(error);
}

/**
 * Retry com lista de códigos de status específicos
 */
export function specificStatusCodes(...codes: number[]) {
  return (error: unknown): boolean => {
    if (error && typeof error === 'object' && 'status' in error) {
      return codes.includes((error as { status: number }).status);
    }
    return false;
  };
}

// ============================================
// CIRCUIT BREAKER
// ============================================

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

export class CircuitBreaker {
  private state: CircuitBreakerState = {
    failures: 0,
    lastFailure: 0,
    state: 'closed',
  };

  constructor(
    private readonly config: {
      failureThreshold?: number;
      resetTimeout?: number;
      halfOpenMaxAttempts?: number;
    } = {}
  ) {}

  private get failureThreshold(): number {
    return this.config.failureThreshold || 5;
  }

  private get resetTimeout(): number {
    return this.config.resetTimeout || 30000;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.updateState();

    if (this.state.state === 'open') {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private updateState(): void {
    if (this.state.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.state.lastFailure;
      if (timeSinceLastFailure >= this.resetTimeout) {
        this.state.state = 'half-open';
      }
    }
  }

  private onSuccess(): void {
    this.state = {
      failures: 0,
      lastFailure: 0,
      state: 'closed',
    };
  }

  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailure = Date.now();

    if (this.state.failures >= this.failureThreshold) {
      this.state.state = 'open';
    }
  }

  getState(): CircuitBreakerState['state'] {
    this.updateState();
    return this.state.state;
  }

  reset(): void {
    this.state = {
      failures: 0,
      lastFailure: 0,
      state: 'closed',
    };
  }
}

// ============================================
// RATE LIMITER
// ============================================

export class RateLimiter {
  private queue: Array<{
    resolve: () => void;
    timestamp: number;
  }> = [];
  private processing = false;

  constructor(
    private readonly config: {
      maxRequests: number;
      interval: number;
    }
  ) {}

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push({ resolve, timestamp: Date.now() });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const windowStart = now - this.config.interval;

      // Remover requests antigos
      this.queue = this.queue.filter((item) => item.timestamp > windowStart);

      // Verificar se pode processar
      const recentRequests = this.queue.filter((item) => item.timestamp > windowStart).length;

      if (recentRequests < this.config.maxRequests) {
        const item = this.queue.shift();
        if (item) {
          item.resolve();
        }
      } else {
        // Aguardar até o próximo slot disponível
        const oldestRequest = this.queue[0];
        if (oldestRequest) {
          const waitTime = oldestRequest.timestamp + this.config.interval - now;
          await sleep(Math.max(0, waitTime));
        }
      }
    }

    this.processing = false;
  }
}

// ============================================
// HOOKS
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook para operações com retry
 */
export function useRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): {
  execute: () => Promise<T>;
  state: RetryState;
  cancel: () => void;
  reset: () => void;
} {
  const [state, setState] = useState<RetryState>({
    attempt: 0,
    totalAttempts: 0,
    lastError: null,
    isRetrying: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    abortControllerRef.current = new AbortController();

    setState((prev) => ({
      ...prev,
      isRetrying: true,
      lastError: null,
    }));

    try {
      const result = await retry(
        async (attempt) => {
          setState((prev) => ({
            ...prev,
            attempt,
            totalAttempts: prev.totalAttempts + 1,
          }));
          return operation();
        },
        {
          ...config,
          signal: abortControllerRef.current.signal,
          onRetry: (error, attempt) => {
            setState((prev) => ({
              ...prev,
              lastError: error,
              attempt,
            }));
            config.onRetry?.(error, attempt, 0);
          },
        }
      );

      setState((prev) => ({
        ...prev,
        isRetrying: false,
        lastError: null,
      }));

      return result;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isRetrying: false,
        lastError: error,
      }));
      throw error;
    }
  }, [operation, config]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setState((prev) => ({
      ...prev,
      isRetrying: false,
    }));
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({
      attempt: 0,
      totalAttempts: 0,
      lastError: null,
      isRetrying: false,
    });
  }, [cancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { execute, state, cancel, reset };
}

/**
 * Hook para circuit breaker
 */
export function useCircuitBreaker<T>(
  operation: () => Promise<T>,
  config?: Parameters<typeof CircuitBreaker.prototype.execute>[0] extends () => Promise<infer U> ? never : ConstructorParameters<typeof CircuitBreaker>[0]
): {
  execute: () => Promise<T>;
  state: CircuitBreakerState['state'];
  reset: () => void;
} {
  const circuitBreakerRef = useRef(new CircuitBreaker(config));
  const [state, setState] = useState<CircuitBreakerState['state']>('closed');

  const execute = useCallback(async () => {
    const result = await circuitBreakerRef.current.execute(operation);
    setState(circuitBreakerRef.current.getState());
    return result;
  }, [operation]);

  const reset = useCallback(() => {
    circuitBreakerRef.current.reset();
    setState('closed');
  }, []);

  return { execute, state, reset };
}
