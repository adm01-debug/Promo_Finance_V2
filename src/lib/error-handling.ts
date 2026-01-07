/**
 * Error Handling Utilities
 * Sistema avançado de tratamento de erros
 */

// ============= Error Classes =============

interface AppErrorOptions {
  code?: string;
  statusCode?: number;
  isOperational?: boolean;
  context?: Record<string, unknown>;
  cause?: Error;
}

/**
 * Erro base para a aplicação
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly originalCause?: Error;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';
    this.code = options.code || 'APP_ERROR';
    this.statusCode = options.statusCode || 500;
    this.isOperational = options.isOperational ?? true;
    this.context = options.context;
    this.timestamp = new Date();
    this.originalCause = options.cause;

    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

/**
 * Erro de validação
 */
export class ValidationError extends AppError {
  public readonly fields: Record<string, string[]>;

  constructor(
    message: string,
    fields: Record<string, string[]> = {},
    context?: Record<string, unknown>
  ) {
    super(message, {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      context,
    });
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

/**
 * Erro de autenticação
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Não autenticado', context?: Record<string, unknown>) {
    super(message, {
      code: 'AUTHENTICATION_ERROR',
      statusCode: 401,
      context,
    });
    this.name = 'AuthenticationError';
  }
}

/**
 * Erro de autorização
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Sem permissão', context?: Record<string, unknown>) {
    super(message, {
      code: 'AUTHORIZATION_ERROR',
      statusCode: 403,
      context,
    });
    this.name = 'AuthorizationError';
  }
}

/**
 * Erro de recurso não encontrado
 */
export class NotFoundError extends AppError {
  constructor(
    resource: string = 'Recurso',
    identifier?: string,
    context?: Record<string, unknown>
  ) {
    const message = identifier
      ? `${resource} com ID '${identifier}' não encontrado`
      : `${resource} não encontrado`;
    super(message, {
      code: 'NOT_FOUND',
      statusCode: 404,
      context: { resource, identifier, ...context },
    });
    this.name = 'NotFoundError';
  }
}

/**
 * Erro de conflito
 */
export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, {
      code: 'CONFLICT_ERROR',
      statusCode: 409,
      context,
    });
    this.name = 'ConflictError';
  }
}

/**
 * Erro de rate limit
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Limite de requisições excedido', retryAfter?: number) {
    super(message, {
      code: 'RATE_LIMIT_ERROR',
      statusCode: 429,
      context: { retryAfter },
    });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Erro de rede
 */
export class NetworkError extends AppError {
  constructor(message: string = 'Erro de conexão', cause?: Error) {
    super(message, {
      code: 'NETWORK_ERROR',
      statusCode: 0,
      isOperational: true,
      cause,
    });
    this.name = 'NetworkError';
  }
}

/**
 * Erro de timeout
 */
export class TimeoutError extends AppError {
  constructor(operation: string, timeoutMs: number) {
    super(`Operação '${operation}' excedeu o tempo limite de ${timeoutMs}ms`, {
      code: 'TIMEOUT_ERROR',
      statusCode: 408,
      context: { operation, timeoutMs },
    });
    this.name = 'TimeoutError';
  }
}

// ============= Error Handlers =============

type ErrorHandler<T = void> = (error: Error) => T;

/**
 * Handler global de erros
 */
export class ErrorBoundaryHandler {
  private static handlers: Map<string, ErrorHandler[]> = new Map();
  private static fallbackHandler: ErrorHandler = (error) => {
    console.error('Unhandled error:', error);
  };

  static register(errorType: string, handler: ErrorHandler): () => void {
    const handlers = this.handlers.get(errorType) || [];
    handlers.push(handler);
    this.handlers.set(errorType, handlers);

    return () => {
      const idx = handlers.indexOf(handler);
      if (idx > -1) handlers.splice(idx, 1);
    };
  }

  static setFallback(handler: ErrorHandler): void {
    this.fallbackHandler = handler;
  }

  static handle(error: Error): void {
    const handlers = this.handlers.get(error.name) || [];
    
    if (handlers.length > 0) {
      handlers.forEach((handler) => {
        try {
          handler(error);
        } catch (e) {
          console.error('Error in error handler:', e);
        }
      });
    } else {
      this.fallbackHandler(error);
    }
  }
}

// ============= Result Type =============

interface ResultOk<T> {
  success: true;
  data: T;
}

interface ResultErr<E> {
  success: false;
  error: E;
}

export type Result<T, E = Error> = ResultOk<T> | ResultErr<E>;

export const Result = {
  ok: <T>(data: T): ResultOk<T> => ({ success: true, data }),
  err: <E>(error: E): ResultErr<E> => ({ success: false, error }),
  
  isOk: <T, E>(result: Result<T, E>): result is ResultOk<T> =>
    result.success,
  
  isErr: <T, E>(result: Result<T, E>): result is ResultErr<E> =>
    !result.success,
  
  map: <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
    if (result.success) {
      return Result.ok(fn(result.data));
    }
    return Result.err((result as ResultErr<E>).error);
  },
  
  mapErr: <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
    if (!result.success) {
      return Result.err(fn((result as ResultErr<E>).error));
    }
    return Result.ok((result as ResultOk<T>).data);
  },
  
  unwrap: <T, E>(result: Result<T, E>): T => {
    if (result.success) return result.data;
    throw (result as ResultErr<E>).error;
  },
  
  unwrapOr: <T, E>(result: Result<T, E>, defaultValue: T): T =>
    result.success ? result.data : defaultValue,
  
  unwrapOrElse: <T, E>(result: Result<T, E>, fn: (error: E) => T): T =>
    result.success ? result.data : fn((result as ResultErr<E>).error),
};

// ============= Try-Catch Helpers =============

/**
 * Wrapper para funções que podem lançar erros
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<Result<T, Error>> {
  try {
    const data = await fn();
    return Result.ok(data);
  } catch (error) {
    return Result.err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Versão síncrona do tryCatch
 */
export function tryCatchSync<T>(fn: () => T): Result<T, Error> {
  try {
    const data = fn();
    return Result.ok(data);
  } catch (error) {
    return Result.err(error instanceof Error ? error : new Error(String(error)));
  }
}

// ============= Retry Logic =============

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoff?: 'linear' | 'exponential';
  maxDelayMs?: number;
  retryIf?: (error: Error) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Executa uma função com retry automático
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoff = 'exponential',
    maxDelayMs = 30000,
    retryIf = () => true,
    onRetry,
  } = options;

  let lastError: Error = new Error('No attempts made');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts || !retryIf(lastError)) {
        throw lastError;
      }

      onRetry?.(lastError, attempt);

      let delay = delayMs;
      if (backoff === 'exponential') {
        delay = Math.min(delayMs * Math.pow(2, attempt - 1), maxDelayMs);
      } else if (backoff === 'linear') {
        delay = Math.min(delayMs * attempt, maxDelayMs);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ============= Circuit Breaker =============

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerOptions {
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
  resetTimeout?: number;
}

export class CircuitBreaker<T> {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private readonly options: Required<CircuitBreakerOptions>;

  constructor(
    private readonly fn: () => Promise<T>,
    options: CircuitBreakerOptions = {}
  ) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      successThreshold: options.successThreshold ?? 2,
      timeout: options.timeout ?? 30000,
      resetTimeout: options.resetTimeout ?? 60000,
    };
  }

  async execute(): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldReset()) {
        this.state = 'half-open';
      } else {
        throw new AppError('Circuit breaker is open', {
          code: 'CIRCUIT_OPEN',
          statusCode: 503,
        });
      }
    }

    try {
      const result = await Promise.race([
        this.fn(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new TimeoutError('Circuit breaker', this.options.timeout)),
            this.options.timeout
          )
        ),
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = 'closed';
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = 'open';
    }
  }

  private shouldReset(): boolean {
    if (!this.lastFailureTime) return true;
    return Date.now() - this.lastFailureTime >= this.options.resetTimeout;
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
  }
}

// ============= Error Formatting =============

/**
 * Formata erro para exibição ao usuário
 */
export function formatErrorForUser(error: unknown): string {
  if (error instanceof ValidationError) {
    const fieldErrors = Object.entries(error.fields)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ');
    return fieldErrors || error.message;
  }

  if (error instanceof AuthenticationError) {
    return 'Por favor, faça login para continuar.';
  }

  if (error instanceof AuthorizationError) {
    return 'Você não tem permissão para realizar esta ação.';
  }

  if (error instanceof NotFoundError) {
    return error.message;
  }

  if (error instanceof NetworkError) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  if (error instanceof RateLimitError) {
    const retryMsg = error.retryAfter
      ? ` Tente novamente em ${error.retryAfter} segundos.`
      : '';
    return `Muitas requisições.${retryMsg}`;
  }

  if (error instanceof TimeoutError) {
    return 'A operação demorou muito. Tente novamente.';
  }

  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }

  return 'Erro desconhecido. Tente novamente.';
}

/**
 * Formata erro para logs
 */
export function formatErrorForLog(error: unknown): Record<string, unknown> {
  if (error instanceof AppError) {
    return {
      ...error.toJSON(),
      stack: error.stack,
      cause: error.originalCause ? formatErrorForLog(error.originalCause) : undefined,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { error: String(error) };
}

// ============= Error Recovery =============

type RecoveryStrategy<T> = () => T | Promise<T>;

/**
 * Tenta recuperar de um erro
 */
export async function withRecovery<T>(
  fn: () => Promise<T>,
  strategies: RecoveryStrategy<T>[]
): Promise<T> {
  try {
    return await fn();
  } catch (originalError) {
    for (const strategy of strategies) {
      try {
        return await strategy();
      } catch {
        continue;
      }
    }
    throw originalError;
  }
}

// ============= Exports =============

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  NetworkError,
  TimeoutError,
  ErrorBoundaryHandler,
  Result,
  tryCatch,
  tryCatchSync,
  withRetry,
  CircuitBreaker,
  formatErrorForUser,
  formatErrorForLog,
  withRecovery,
};
