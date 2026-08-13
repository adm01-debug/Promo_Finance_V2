/**
 * RESILIENCE UTILITY
 * 
 * Provides patterns for building robust Edge Functions:
 * - Exponential Backoff Retries
 * - Circuit Breaker (Memory-based for Edge, or DB-synced if needed)
 * - Timeouts
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  retryOnStatuses?: number[];
}

/**
 * Executes a function with exponential backoff retries.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 500,
    maxDelay = 5000,
    factor = 2,
    retryOnStatuses = [429, 500, 502, 503, 504],
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if it's a fetch response error with a status code
      if (error instanceof Response) {
        if (!retryOnStatuses.includes(error.status)) {
          throw error;
        }
      }

      if (attempt === maxRetries) break;

      console.warn(`[Resilience] Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`, lastError.message);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * factor, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Simple Circuit Breaker Implementation
 * Since Edge Functions are short-lived, we use a hybrid approach:
 * 1. Fast in-memory check for the current execution context.
 * 2. (Optional) Could be expanded to use a shared state in KV/DB.
 */
class CircuitBreaker {
  private static states: Map<string, { failures: number; lastFailure: number; status: 'CLOSED' | 'OPEN' | 'HALF_OPEN' }> = new Map();
  
  private readonly threshold = 5;
  private readonly resetTimeout = 30000; // 30s

  constructor(private readonly serviceName: string) {
    if (!CircuitBreaker.states.has(serviceName)) {
      CircuitBreaker.states.set(serviceName, { failures: 0, lastFailure: 0, status: 'CLOSED' });
    }
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    const state = CircuitBreaker.states.get(this.serviceName)!;

    if (state.status === 'OPEN') {
      if (Date.now() - state.lastFailure > this.resetTimeout) {
        state.status = 'HALF_OPEN';
      } else {
        throw new Error(`Circuit Breaker is OPEN for ${this.serviceName}`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    const state = CircuitBreaker.states.get(this.serviceName)!;
    state.failures = 0;
    state.status = 'CLOSED';
  }

  private onFailure() {
    const state = CircuitBreaker.states.get(this.serviceName)!;
    state.failures++;
    state.lastFailure = Date.now();
    if (state.failures >= this.threshold) {
      state.status = 'OPEN';
    }
  }
}

export const createCircuitBreaker = (serviceName: string) => new CircuitBreaker(serviceName);

/**
 * Executes a function with a timeout.
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await fn();
    clearTimeout(id);
    return result;
  } catch (err) {
    clearTimeout(id);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Operation timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}
