import { toast } from '@/lib/toast';

// Types
interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
  retry?: number;
  cache?: RequestCache;
  credentials?: RequestCredentials;
}

interface ApiResponse<T = unknown> {
  data: T | null;
  error: ApiError | null;
  status: number;
  headers: Headers;
}

interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;
type ErrorInterceptor = (error: ApiError) => ApiError | Promise<ApiError>;

// Interceptor manager
class InterceptorManager<T> {
  private handlers: Array<{ fulfilled: T; rejected?: ErrorInterceptor }> = [];

  use(fulfilled: T, rejected?: ErrorInterceptor): number {
    this.handlers.push({ fulfilled, rejected });
    return this.handlers.length - 1;
  }

  eject(id: number): void {
    if (this.handlers[id]) {
      this.handlers.splice(id, 1);
    }
  }

  forEach(fn: (handler: { fulfilled: T; rejected?: ErrorInterceptor }) => void): void {
    this.handlers.forEach(fn);
  }
}

// API Client class
class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;
  
  public interceptors: {
    request: InterceptorManager<RequestInterceptor>;
    response: InterceptorManager<ResponseInterceptor>;
  };

  constructor(config?: { baseURL?: string; headers?: Record<string, string>; timeout?: number }) {
    this.baseURL = config?.baseURL || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config?.headers,
    };
    this.defaultTimeout = config?.timeout || 30000;
    
    this.interceptors = {
      request: new InterceptorManager<RequestInterceptor>(),
      response: new InterceptorManager<ResponseInterceptor>(),
    };
  }

  private buildURL(url: string, params?: Record<string, string | number | boolean | undefined>): string {
    const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    if (!params) return fullURL;
    
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `${fullURL}?${queryString}` : fullURL;
  }

  private async runRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let currentConfig = config;
    
    const handlers: RequestInterceptor[] = [];
    this.interceptors.request.forEach((handler) => {
      handlers.push(handler.fulfilled);
    });
    
    for (const handler of handlers) {
      currentConfig = await handler(currentConfig);
    }
    
    return currentConfig;
  }

  private async runResponseInterceptors<T>(response: ApiResponse<T>): Promise<ApiResponse<T>> {
    let currentResponse = response;
    
    const handlers: ResponseInterceptor[] = [];
    this.interceptors.response.forEach((handler) => {
      handlers.push(handler.fulfilled);
    });
    
    for (const handler of handlers) {
      currentResponse = await handler(currentResponse);
    }
    
    return currentResponse;
  }

  async request<T = unknown>(config: RequestConfig): Promise<ApiResponse<T>> {
    // Run request interceptors
    const finalConfig = await this.runRequestInterceptors(config);
    
    const { url, method, headers, body, params, timeout, retry = 0, cache, credentials } = finalConfig;
    
    const fullURL = this.buildURL(url, params);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout || this.defaultTimeout);
    
    let lastError: ApiError | null = null;
    
    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        const response = await fetch(fullURL, {
          method,
          headers: { ...this.defaultHeaders, ...headers },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
          cache,
          credentials,
        });
        
        clearTimeout(timeoutId);
        
        let data: T | null = null;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else if (contentType?.includes('text/')) {
          data = (await response.text()) as unknown as T;
        }
        
        const apiResponse: ApiResponse<T> = {
          data: response.ok ? data : null,
          error: response.ok ? null : {
            message: (data as { message?: string })?.message || `HTTP ${response.status}`,
            code: (data as { code?: string })?.code,
            status: response.status,
            details: data,
          },
          status: response.status,
          headers: response.headers,
        };
        
        // Run response interceptors
        return await this.runResponseInterceptors(apiResponse);
        
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error) {
          lastError = {
            message: error.name === 'AbortError' ? 'Request timeout' : error.message,
            code: error.name,
          };
        } else {
          lastError = { message: 'Unknown error occurred' };
        }
        
        // If not last attempt, continue retrying
        if (attempt < retry) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
      }
    }
    
    return {
      data: null,
      error: lastError,
      status: 0,
      headers: new Headers(),
    };
  }

  async get<T = unknown>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  async post<T = unknown>(url: string, body?: unknown, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'POST', body });
  }

  async put<T = unknown>(url: string, body?: unknown, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PUT', body });
  }

  async patch<T = unknown>(url: string, body?: unknown, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PATCH', body });
  }

  async delete<T = unknown>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }
}

// Create default instance
export const api = new ApiClient({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

// Add response error interceptor
api.interceptors.response.use((response) => {
  if (response.error) {
    // Handle specific error codes
    switch (response.status) {
      case 401:
        // Unauthorized - clear auth and redirect
        localStorage.removeItem('auth_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        break;
      case 403:
        toast.error('Você não tem permissão para esta ação');
        break;
      case 404:
        // Not found - handle silently or show message
        break;
      case 500:
        toast.error('Erro no servidor. Tente novamente mais tarde.');
        break;
      default:
        if (response.status >= 500) {
          toast.error('Erro no servidor');
        }
    }
  }
  return response;
});

// Helper to handle API responses
export async function handleApiResponse<T>(
  promise: Promise<ApiResponse<T>>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    showError?: boolean;
  }
): Promise<T | null> {
  const { successMessage, errorMessage, showError = true } = options || {};
  
  const response = await promise;
  
  if (response.error) {
    if (showError) {
      toast.error(errorMessage || response.error.message);
    }
    return null;
  }
  
  if (successMessage) {
    toast.success(successMessage);
  }
  
  return response.data;
}

// Export types
export type { RequestConfig, ApiResponse, ApiError };
export { ApiClient };
