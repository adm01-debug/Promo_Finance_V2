/**
 * Sistema de Interceptors para Requests
 * Middleware para processamento de requests/responses
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// TIPOS
// ============================================

export interface RequestContext {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  startTime: number;
  metadata: Record<string, unknown>;
}

export interface ResponseContext<T = unknown> {
  data: T | null;
  error: Error | null;
  status: number;
  headers: Headers;
  duration: number;
  request: RequestContext;
}

export type BeforeRequestHook = (context: RequestContext) => RequestContext | Promise<RequestContext>;
export type AfterResponseHook<T = unknown> = (context: ResponseContext<T>) => ResponseContext<T> | Promise<ResponseContext<T>>;
export type ErrorHook = (error: Error, context: RequestContext) => Error | Promise<Error>;

// ============================================
// INTERCEPTOR MANAGER
// ============================================

class InterceptorManager {
  private beforeRequestHooks: BeforeRequestHook[] = [];
  private afterResponseHooks: AfterResponseHook[] = [];
  private errorHooks: ErrorHook[] = [];

  /**
   * Adiciona hook antes do request
   */
  onBeforeRequest(hook: BeforeRequestHook): () => void {
    this.beforeRequestHooks.push(hook);
    return () => {
      const index = this.beforeRequestHooks.indexOf(hook);
      if (index > -1) this.beforeRequestHooks.splice(index, 1);
    };
  }

  /**
   * Adiciona hook após response
   */
  onAfterResponse<T>(hook: AfterResponseHook<T>): () => void {
    this.afterResponseHooks.push(hook as AfterResponseHook);
    return () => {
      const index = this.afterResponseHooks.indexOf(hook as AfterResponseHook);
      if (index > -1) this.afterResponseHooks.splice(index, 1);
    };
  }

  /**
   * Adiciona hook de erro
   */
  onError(hook: ErrorHook): () => void {
    this.errorHooks.push(hook);
    return () => {
      const index = this.errorHooks.indexOf(hook);
      if (index > -1) this.errorHooks.splice(index, 1);
    };
  }

  /**
   * Processa hooks antes do request
   */
  async processBeforeRequest(context: RequestContext): Promise<RequestContext> {
    let processedContext = context;
    
    for (const hook of this.beforeRequestHooks) {
      processedContext = await hook(processedContext);
    }
    
    return processedContext;
  }

  /**
   * Processa hooks após response
   */
  async processAfterResponse<T>(context: ResponseContext<T>): Promise<ResponseContext<T>> {
    let processedContext = context;
    
    for (const hook of this.afterResponseHooks) {
      processedContext = await hook(processedContext) as ResponseContext<T>;
    }
    
    return processedContext;
  }

  /**
   * Processa hooks de erro
   */
  async processError(error: Error, context: RequestContext): Promise<Error> {
    let processedError = error;
    
    for (const hook of this.errorHooks) {
      processedError = await hook(processedError, context);
    }
    
    return processedError;
  }

  /**
   * Remove todos os hooks
   */
  clear(): void {
    this.beforeRequestHooks = [];
    this.afterResponseHooks = [];
    this.errorHooks = [];
  }
}

export const interceptorManager = new InterceptorManager();

// ============================================
// INTERCEPTORS PADRÃO
// ============================================

/**
 * Interceptor de autenticação - adiciona token JWT
 */
export const authInterceptor: BeforeRequestHook = async (context) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    context.headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  return context;
};

/**
 * Interceptor de logging - loga requests/responses
 */
export const loggingInterceptor = {
  before: ((context: RequestContext) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${context.method} ${context.url}`, {
        headers: context.headers,
        body: context.body,
      });
    }
    return context;
  }) as BeforeRequestHook,
  
  after: ((context: ResponseContext) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${context.request.method} ${context.request.url} - ${context.status} (${context.duration}ms)`, {
        data: context.data,
        error: context.error,
      });
    }
    return context;
  }) as AfterResponseHook,
};

/**
 * Interceptor de métricas - coleta tempos de resposta
 */
interface RequestMetrics {
  url: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
}

class MetricsCollector {
  private metrics: RequestMetrics[] = [];
  private maxSize = 1000;

  add(metric: RequestMetrics): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxSize) {
      this.metrics.shift();
    }
  }

  getAll(): RequestMetrics[] {
    return [...this.metrics];
  }

  getByUrl(url: string): RequestMetrics[] {
    return this.metrics.filter(m => m.url.includes(url));
  }

  getAverageDuration(): number {
    if (this.metrics.length === 0) return 0;
    return this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length;
  }

  getErrorRate(): number {
    if (this.metrics.length === 0) return 0;
    const errors = this.metrics.filter(m => m.status >= 400).length;
    return errors / this.metrics.length;
  }

  clear(): void {
    this.metrics = [];
  }
}

export const metricsCollector = new MetricsCollector();

export const metricsInterceptor: AfterResponseHook = (context) => {
  metricsCollector.add({
    url: context.request.url,
    method: context.request.method,
    duration: context.duration,
    status: context.status,
    timestamp: Date.now(),
  });
  
  return context;
};

/**
 * Interceptor de retry para erros específicos
 */
export const retryableErrorInterceptor: ErrorHook = async (error, context) => {
  // Marcar erros de rede como retryable
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    (error as any).retryable = true;
  }
  
  return error;
};

/**
 * Interceptor de normalização de erros
 */
export const errorNormalizerInterceptor: ErrorHook = async (error) => {
  // Normalizar mensagens de erro para português
  const errorMessages: Record<string, string> = {
    'Failed to fetch': 'Erro de conexão. Verifique sua internet.',
    'Network request failed': 'Erro de rede. Tente novamente.',
    'Request timeout': 'Tempo limite excedido. Tente novamente.',
    'Unauthorized': 'Sessão expirada. Faça login novamente.',
    'Forbidden': 'Você não tem permissão para esta ação.',
    'Not Found': 'Recurso não encontrado.',
    'Internal Server Error': 'Erro interno. Tente novamente mais tarde.',
  };

  const normalizedMessage = errorMessages[error.message];
  if (normalizedMessage) {
    error.message = normalizedMessage;
  }

  return error;
};

/**
 * Interceptor de headers padrão
 */
export const defaultHeadersInterceptor: BeforeRequestHook = (context) => {
  // Adicionar headers padrão
  context.headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...context.headers,
  };
  
  return context;
};

/**
 * Interceptor de CORS
 */
export const corsInterceptor: BeforeRequestHook = (context) => {
  context.headers['Access-Control-Allow-Origin'] = '*';
  return context;
};

/**
 * Interceptor de timeout
 */
export const createTimeoutInterceptor = (timeout: number): BeforeRequestHook => {
  return (context) => {
    context.metadata.timeout = timeout;
    return context;
  };
};

/**
 * Interceptor de cache busting
 */
export const cacheBustingInterceptor: BeforeRequestHook = (context) => {
  if (context.method === 'GET') {
    const url = new URL(context.url);
    url.searchParams.set('_t', Date.now().toString());
    context.url = url.toString();
  }
  return context;
};

// ============================================
// SETUP PADRÃO
// ============================================

export function setupDefaultInterceptors(): () => void {
  const unsubscribers = [
    interceptorManager.onBeforeRequest(defaultHeadersInterceptor),
    interceptorManager.onBeforeRequest(authInterceptor),
    interceptorManager.onBeforeRequest(loggingInterceptor.before),
    interceptorManager.onAfterResponse(loggingInterceptor.after),
    interceptorManager.onAfterResponse(metricsInterceptor),
    interceptorManager.onError(retryableErrorInterceptor),
    interceptorManager.onError(errorNormalizerInterceptor),
  ];

  return () => unsubscribers.forEach(unsub => unsub());
}
