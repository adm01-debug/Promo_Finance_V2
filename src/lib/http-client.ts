/**
 * HTTP Client
 * Axios-like HTTP client with interceptors, retry logic, and error handling
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  timeout?: number;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  retries?: number;
  retryDelay?: number;
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: RequestConfig;
}

export interface HttpError extends Error {
  status?: number;
  statusText?: string;
  response?: HttpResponse;
  config?: RequestConfig;
}

type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = (response: HttpResponse) => HttpResponse | Promise<HttpResponse>;
type ErrorInterceptor = (error: HttpError) => never | Promise<never>;

interface Interceptors {
  request: RequestInterceptor[];
  response: ResponseInterceptor[];
  error: ErrorInterceptor[];
}

export class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;
  private interceptors: Interceptors;

  constructor(config: {
    baseURL?: string;
    headers?: Record<string, string>;
    timeout?: number;
  } = {}) {
    this.baseURL = config.baseURL || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
    this.defaultTimeout = config.timeout || 30000;
    this.interceptors = {
      request: [],
      response: [],
      error: [],
    };
  }

  /**
   * Add a request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.interceptors.request.push(interceptor);
    return () => {
      const index = this.interceptors.request.indexOf(interceptor);
      if (index !== -1) {
        this.interceptors.request.splice(index, 1);
      }
    };
  }

  /**
   * Add a response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.interceptors.response.push(interceptor);
    return () => {
      const index = this.interceptors.response.indexOf(interceptor);
      if (index !== -1) {
        this.interceptors.response.splice(index, 1);
      }
    };
  }

  /**
   * Add an error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): () => void {
    this.interceptors.error.push(interceptor);
    return () => {
      const index = this.interceptors.error.indexOf(interceptor);
      if (index !== -1) {
        this.interceptors.error.splice(index, 1);
      }
    };
  }

  /**
   * Build URL with params
   */
  private buildURL(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(endpoint, this.baseURL || window.location.origin);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  /**
   * Create an HTTP error
   */
  private createError(
    message: string,
    status?: number,
    statusText?: string,
    response?: HttpResponse,
    config?: RequestConfig
  ): HttpError {
    const error = new Error(message) as HttpError;
    error.name = 'HttpError';
    error.status = status;
    error.statusText = statusText;
    error.response = response;
    error.config = config;
    return error;
  }

  /**
   * Execute a request with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<HttpResponse<T>>,
    retries: number,
    retryDelay: number
  ): Promise<HttpResponse<T>> {
    let lastError: HttpError | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as HttpError;
        
        // Don't retry on client errors (4xx)
        if (lastError.status && lastError.status >= 400 && lastError.status < 500) {
          throw lastError;
        }

        // Don't retry on last attempt
        if (attempt === retries) {
          throw lastError;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }

    throw lastError;
  }

  /**
   * Make an HTTP request
   */
  async request<T = unknown>(endpoint: string, config: RequestConfig = {}): Promise<HttpResponse<T>> {
    let currentConfig: RequestConfig = {
      method: 'GET',
      ...config,
      headers: {
        ...this.defaultHeaders,
        ...config.headers,
      },
    };

    // Apply request interceptors
    for (const interceptor of this.interceptors.request) {
      currentConfig = await interceptor(currentConfig);
    }

    const { method, headers, params, body, timeout, signal, credentials, retries = 0, retryDelay = 1000 } = currentConfig;

    const executeRequest = async (): Promise<HttpResponse<T>> => {
      const url = this.buildURL(endpoint, params);
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout || this.defaultTimeout);

      try {
        const response = await fetch(url, {
          method,
          headers: headers as HeadersInit,
          body: body ? JSON.stringify(body) : undefined,
          signal: signal || controller.signal,
          credentials,
        });

        clearTimeout(timeoutId);

        // Parse response
        let data: T;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else if (contentType?.includes('text/')) {
          data = await response.text() as unknown as T;
        } else {
          data = await response.blob() as unknown as T;
        }

        let httpResponse: HttpResponse<T> = {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          config: currentConfig,
        };

        // Check for HTTP errors
        if (!response.ok) {
          const error = this.createError(
            `Request failed with status ${response.status}`,
            response.status,
            response.statusText,
            httpResponse as HttpResponse,
            currentConfig
          );
          throw error;
        }

        // Apply response interceptors
        for (const interceptor of this.interceptors.response) {
          httpResponse = await interceptor(httpResponse as HttpResponse) as HttpResponse<T>;
        }

        return httpResponse;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === 'AbortError') {
          throw this.createError('Request timeout', undefined, undefined, undefined, currentConfig);
        }

        // Apply error interceptors
        let httpError = error as HttpError;
        for (const interceptor of this.interceptors.error) {
          try {
            await interceptor(httpError);
          } catch (e) {
            httpError = e as HttpError;
          }
        }

        throw httpError;
      }
    };

    return this.executeWithRetry(executeRequest, retries, retryDelay);
  }

  /**
   * GET request
   */
  get<T = unknown>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  post<T = unknown>(endpoint: string, data?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body: data });
  }

  /**
   * PUT request
   */
  put<T = unknown>(endpoint: string, data?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body: data });
  }

  /**
   * PATCH request
   */
  patch<T = unknown>(endpoint: string, data?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body: data });
  }

  /**
   * DELETE request
   */
  delete<T = unknown>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// Create default instance
export const httpClient = new HttpClient({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000,
});

// Add default interceptors

// Auth interceptor
httpClient.addRequestInterceptor((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

// Error logging interceptor
httpClient.addErrorInterceptor((error) => {
  console.error('HTTP Error:', {
    status: error.status,
    message: error.message,
    url: error.config?.params,
  });
  throw error;
});

// Response logging (development only)
if (import.meta.env.DEV) {
  httpClient.addResponseInterceptor((response) => {
    console.debug('HTTP Response:', {
      status: response.status,
      url: response.config.params,
    });
    return response;
  });
}

export default httpClient;
