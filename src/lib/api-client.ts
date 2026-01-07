/**
 * API Client Centralizado
 * Cliente HTTP com interceptors, retry e cache
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// TIPOS
// ============================================

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTTL?: number;
  signal?: AbortSignal;
}

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: ApiError | null;
  status: number;
  headers: Headers;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export type RequestInterceptor = (config: RequestConfig & { url: string }) => 
  (RequestConfig & { url: string }) | Promise<RequestConfig & { url: string }>;

export type ResponseInterceptor<T = unknown> = (response: ApiResponse<T>) => 
  ApiResponse<T> | Promise<ApiResponse<T>>;

export type ErrorInterceptor = (error: ApiError) => ApiError | Promise<ApiError>;

// ============================================
// CACHE
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ResponseCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 100;

  set<T>(key: string, data: T, ttl: number): void {
    // Limpar entradas antigas se atingir limite
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

// ============================================
// API CLIENT
// ============================================

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;
  private defaultRetries: number;
  private defaultRetryDelay: number;
  private defaultCacheTTL: number;
  
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  
  private cache = new ResponseCache();

  constructor(config: {
    baseUrl?: string;
    headers?: Record<string, string>;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    cacheTTL?: number;
  } = {}) {
    this.baseUrl = config.baseUrl || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
    this.defaultTimeout = config.timeout || 30000;
    this.defaultRetries = config.retries || 3;
    this.defaultRetryDelay = config.retryDelay || 1000;
    this.defaultCacheTTL = config.cacheTTL || 5 * 60 * 1000; // 5 minutos
  }

  // ============================================
  // INTERCEPTORS
  // ============================================

  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index > -1) this.requestInterceptors.splice(index, 1);
    };
  }

  addResponseInterceptor<T>(interceptor: ResponseInterceptor<T>): () => void {
    this.responseInterceptors.push(interceptor as ResponseInterceptor);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor as ResponseInterceptor);
      if (index > -1) this.responseInterceptors.splice(index, 1);
    };
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor);
    return () => {
      const index = this.errorInterceptors.indexOf(interceptor);
      if (index > -1) this.errorInterceptors.splice(index, 1);
    };
  }

  // ============================================
  // CACHE
  // ============================================

  clearCache(): void {
    this.cache.clear();
  }

  invalidateCache(pattern: string | RegExp): void {
    this.cache.invalidatePattern(pattern);
  }

  // ============================================
  // REQUEST METHODS
  // ============================================

  async request<T>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const fullConfig = {
      url: this.buildUrl(url, config.params),
      method: config.method || 'GET',
      headers: { ...this.defaultHeaders, ...config.headers },
      body: config.body,
      timeout: config.timeout ?? this.defaultTimeout,
      retries: config.retries ?? this.defaultRetries,
      retryDelay: config.retryDelay ?? this.defaultRetryDelay,
      cache: config.cache ?? false,
      cacheTTL: config.cacheTTL ?? this.defaultCacheTTL,
      signal: config.signal,
    };

    // Aplicar request interceptors
    let processedConfig: typeof fullConfig = { ...fullConfig };
    for (const interceptor of this.requestInterceptors) {
      const result = await interceptor(processedConfig);
      processedConfig = { ...processedConfig, ...result };
    }

    // Verificar cache para GET requests
    const cacheKey = `${processedConfig.method}:${processedConfig.url}`;
    if (processedConfig.method === 'GET' && processedConfig.cache) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached !== null) {
        return {
          data: cached,
          error: null,
          status: 200,
          headers: new Headers(),
        };
      }
    }

    // Executar request com retry
    let lastError: ApiError | null = null;
    let attempt = 0;

    while (attempt <= processedConfig.retries) {
      try {
        const response = await this.executeRequest<T>(processedConfig);
        
        // Aplicar response interceptors
        let processedResponse: ApiResponse<T> = response;
        for (const interceptor of this.responseInterceptors) {
          processedResponse = await interceptor(processedResponse) as ApiResponse<T>;
        }

        // Cachear resposta de sucesso
        if (processedConfig.method === 'GET' && processedConfig.cache && processedResponse.data) {
          this.cache.set(cacheKey, processedResponse.data, processedConfig.cacheTTL);
        }

        return processedResponse;
      } catch (error) {
        lastError = this.normalizeError(error);
        
        // Aplicar error interceptors
        for (const interceptor of this.errorInterceptors) {
          lastError = await interceptor(lastError);
        }

        // Não fazer retry para erros 4xx
        if (lastError.status && lastError.status >= 400 && lastError.status < 500) {
          break;
        }

        attempt++;
        if (attempt <= processedConfig.retries) {
          await this.delay(processedConfig.retryDelay * attempt);
        }
      }
    }

    return {
      data: null,
      error: lastError,
      status: lastError?.status || 500,
      headers: new Headers(),
    };
  }

  async get<T>(url: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  async post<T>(url: string, body?: unknown, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', body });
  }

  async put<T>(url: string, body?: unknown, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', body });
  }

  async patch<T>(url: string, body?: unknown, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', body });
  }

  async delete<T>(url: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.baseUrl || window.location.origin);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  private async executeRequest<T>(config: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: unknown;
    timeout: number;
    signal?: AbortSignal;
  }): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: config.signal || controller.signal,
      });

      clearTimeout(timeoutId);

      const data = response.ok ? await response.json() : null;
      const error = response.ok ? null : {
        message: response.statusText,
        status: response.status,
      };

      return {
        data,
        error,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private normalizeError(error: unknown): ApiError {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { message: 'Request timeout', code: 'TIMEOUT' };
      }
      return { message: error.message };
    }
    return { message: 'Unknown error' };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================
// INSTÂNCIA PADRÃO
// ============================================

export const apiClient = new ApiClient({
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
});

// ============================================
// SUPABASE API CLIENT
// ============================================

export const supabaseApiClient = new ApiClient({
  baseUrl: import.meta.env.VITE_SUPABASE_URL,
  headers: {
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  },
});

// Adicionar interceptor para auth token
supabaseApiClient.addRequestInterceptor(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${session.access_token}`,
    };
  }
  
  return config;
});

// ============================================
// EXPORTS
// ============================================

export { ApiClient };
