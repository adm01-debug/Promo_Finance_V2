import { toast } from 'sonner';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  code: string;
  status?: number;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    options?: { status?: number; details?: Record<string, unknown> }
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = options?.status;
    this.details = options?.details;
  }
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  // Authentication
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',

  // Authorization
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  REQUIRED_FIELD: 'REQUIRED_FIELD',

  // Network
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Business
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',

  // Generic
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Error messages in Portuguese
 */
const errorMessages: Record<string, string> = {
  [ErrorCodes.AUTH_REQUIRED]: 'Autenticação necessária',
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 'Credenciais inválidas',
  [ErrorCodes.AUTH_SESSION_EXPIRED]: 'Sessão expirada. Faça login novamente',
  [ErrorCodes.AUTH_EMAIL_NOT_VERIFIED]: 'Email não verificado',
  [ErrorCodes.FORBIDDEN]: 'Acesso negado',
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 'Permissões insuficientes',
  [ErrorCodes.VALIDATION_ERROR]: 'Erro de validação',
  [ErrorCodes.INVALID_INPUT]: 'Dados inválidos',
  [ErrorCodes.REQUIRED_FIELD]: 'Campo obrigatório',
  [ErrorCodes.NETWORK_ERROR]: 'Erro de conexão. Verifique sua internet',
  [ErrorCodes.TIMEOUT]: 'Tempo limite excedido. Tente novamente',
  [ErrorCodes.SERVER_ERROR]: 'Erro no servidor. Tente novamente mais tarde',
  [ErrorCodes.NOT_FOUND]: 'Recurso não encontrado',
  [ErrorCodes.CONFLICT]: 'Conflito com dados existentes',
  [ErrorCodes.ALREADY_EXISTS]: 'Este item já existe',
  [ErrorCodes.INSUFFICIENT_BALANCE]: 'Saldo insuficiente',
  [ErrorCodes.LIMIT_EXCEEDED]: 'Limite excedido',
  [ErrorCodes.OPERATION_NOT_ALLOWED]: 'Operação não permitida',
  [ErrorCodes.UNKNOWN_ERROR]: 'Erro desconhecido. Tente novamente',
};

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return errorMessages[error.code] || error.message;
  }

  if (error instanceof Error) {
    // Handle Supabase errors
    if (error.message.includes('Invalid login credentials')) {
      return errorMessages[ErrorCodes.AUTH_INVALID_CREDENTIALS];
    }
    if (error.message.includes('JWT expired')) {
      return errorMessages[ErrorCodes.AUTH_SESSION_EXPIRED];
    }
    if (error.message.includes('Email not confirmed')) {
      return errorMessages[ErrorCodes.AUTH_EMAIL_NOT_VERIFIED];
    }
    if (error.message.includes('duplicate key')) {
      return errorMessages[ErrorCodes.ALREADY_EXISTS];
    }
    if (error.message.includes('network')) {
      return errorMessages[ErrorCodes.NETWORK_ERROR];
    }

    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return errorMessages[ErrorCodes.UNKNOWN_ERROR];
}

/**
 * Get error code from error
 */
export function getErrorCode(error: unknown): ErrorCode {
  if (error instanceof AppError) {
    return error.code as ErrorCode;
  }

  if (error instanceof Error) {
    if (error.message.includes('Invalid login credentials')) {
      return ErrorCodes.AUTH_INVALID_CREDENTIALS;
    }
    if (error.message.includes('JWT expired')) {
      return ErrorCodes.AUTH_SESSION_EXPIRED;
    }
    if (error.message.includes('not found') || error.message.includes('404')) {
      return ErrorCodes.NOT_FOUND;
    }
    if (error.message.includes('duplicate') || error.message.includes('409')) {
      return ErrorCodes.CONFLICT;
    }
    if (error.message.includes('network')) {
      return ErrorCodes.NETWORK_ERROR;
    }
    if (error.message.includes('timeout')) {
      return ErrorCodes.TIMEOUT;
    }
  }

  return ErrorCodes.UNKNOWN_ERROR;
}

/**
 * Handle error with toast notification
 */
export function handleError(error: unknown, customMessage?: string): void {
  console.error('Error:', error);
  
  const message = customMessage || getErrorMessage(error);
  toast.error(message);
}

/**
 * Handle async operation with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options?: {
    onError?: (error: unknown) => void;
    errorMessage?: string;
    showToast?: boolean;
  }
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    if (options?.showToast !== false) {
      handleError(error, options?.errorMessage);
    }
    options?.onError?.(error);
    return null;
  }
}

/**
 * Retry operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: unknown, attempt: number) => boolean;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const initialDelay = options?.initialDelay ?? 1000;
  const maxDelay = options?.maxDelay ?? 10000;
  const shouldRetry = options?.shouldRetry ?? (() => true);

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error, attempt)) {
        throw error;
      }

      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Create error from HTTP status
 */
export function createHttpError(status: number, message?: string): AppError {
  const errorMap: Record<number, { code: ErrorCode; message: string }> = {
    400: { code: ErrorCodes.VALIDATION_ERROR, message: 'Dados inválidos' },
    401: { code: ErrorCodes.AUTH_REQUIRED, message: 'Não autorizado' },
    403: { code: ErrorCodes.FORBIDDEN, message: 'Acesso negado' },
    404: { code: ErrorCodes.NOT_FOUND, message: 'Não encontrado' },
    409: { code: ErrorCodes.CONFLICT, message: 'Conflito' },
    500: { code: ErrorCodes.SERVER_ERROR, message: 'Erro interno do servidor' },
  };

  const error = errorMap[status] || { code: ErrorCodes.UNKNOWN_ERROR, message: 'Erro desconhecido' };

  return new AppError(message || error.message, error.code, { status });
}

export default handleError;
