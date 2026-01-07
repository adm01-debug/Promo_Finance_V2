/**
 * Sistema de Cache de Responses
 * Cache inteligente para responses HTTP
 */

import { useEffect, useState, useCallback, useRef } from 'react';

// ============================================
// TIPOS
// ============================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  etag?: string;
  lastModified?: string;
  stale: boolean;
}

export interface CacheConfig {
  /** TTL padrão em ms */
  defaultTTL?: number;
  /** Tamanho máximo do cache */
  maxSize?: number;
  /** Habilitar stale-while-revalidate */
  staleWhileRevalidate?: boolean;
  /** Tempo extra para servir stale */
  staleTime?: number;
  /** Usar localStorage para persistência */
  persist?: boolean;
  /** Prefixo para chaves no localStorage */
  persistPrefix?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  staleHits: number;
  size: number;
  hitRate: number;
}

// ============================================
// DEFAULTS
// ============================================

const DEFAULT_CONFIG: Required<CacheConfig> = {
  defaultTTL: 5 * 60 * 1000, // 5 minutos
  maxSize: 100,
  staleWhileRevalidate: true,
  staleTime: 60 * 1000, // 1 minuto
  persist: false,
  persistPrefix: 'response_cache_',
};

// ============================================
// RESPONSE CACHE
// ============================================

export class ResponseCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: Required<CacheConfig>;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    staleHits: 0,
    size: 0,
    hitRate: 0,
  };

  constructor(config: CacheConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.persist) {
      this.loadFromStorage();
    }
  }

  /**
   * Obtém um item do cache
   */
  get(key: string): { data: T; stale: boolean } | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    const now = Date.now();
    
    // Verificar se expirou completamente
    if (now > entry.expiresAt + this.config.staleTime) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Verificar se está stale
    const isStale = now > entry.expiresAt;
    
    if (isStale) {
      this.stats.staleHits++;
    } else {
      this.stats.hits++;
    }
    
    this.updateHitRate();
    
    return {
      data: entry.data,
      stale: isStale,
    };
  }

  /**
   * Armazena um item no cache
   */
  set(
    key: string,
    data: T,
    options: {
      ttl?: number;
      etag?: string;
      lastModified?: string;
    } = {}
  ): void {
    // Verificar limite de tamanho
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const ttl = options.ttl ?? this.config.defaultTTL;
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      etag: options.etag,
      lastModified: options.lastModified,
      stale: false,
    };

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;

    if (this.config.persist) {
      this.saveToStorage();
    }
  }

  /**
   * Invalida um item ou padrão
   */
  invalidate(keyOrPattern: string | RegExp): void {
    if (typeof keyOrPattern === 'string') {
      this.cache.delete(keyOrPattern);
    } else {
      for (const key of this.cache.keys()) {
        if (keyOrPattern.test(key)) {
          this.cache.delete(key);
        }
      }
    }

    this.stats.size = this.cache.size;

    if (this.config.persist) {
      this.saveToStorage();
    }
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;

    if (this.config.persist) {
      this.clearStorage();
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Verifica se item existe e é válido
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Verifica se pode revalidar (stale-while-revalidate)
   */
  shouldRevalidate(key: string): boolean {
    const result = this.get(key);
    return result?.stale ?? true;
  }

  /**
   * Obtém headers para conditional request
   */
  getConditionalHeaders(key: string): Record<string, string> {
    const entry = this.cache.get(key);
    
    if (!entry) return {};

    const headers: Record<string, string> = {};
    
    if (entry.etag) {
      headers['If-None-Match'] = entry.etag;
    }
    
    if (entry.lastModified) {
      headers['If-Modified-Since'] = entry.lastModified;
    }

    return headers;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses + this.stats.staleHits;
    this.stats.hitRate = total > 0 ? (this.stats.hits + this.stats.staleHits) / total : 0;
  }

  private loadFromStorage(): void {
    try {
      const keys = Object.keys(localStorage).filter(k => 
        k.startsWith(this.config.persistPrefix)
      );

      for (const key of keys) {
        const cacheKey = key.replace(this.config.persistPrefix, '');
        const stored = localStorage.getItem(key);
        
        if (stored) {
          const entry = JSON.parse(stored) as CacheEntry<T>;
          
          // Verificar se ainda é válido
          if (Date.now() <= entry.expiresAt + this.config.staleTime) {
            this.cache.set(cacheKey, entry);
          } else {
            localStorage.removeItem(key);
          }
        }
      }

      this.stats.size = this.cache.size;
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      // Limpar entradas antigas
      const keys = Object.keys(localStorage).filter(k => 
        k.startsWith(this.config.persistPrefix)
      );

      for (const key of keys) {
        const cacheKey = key.replace(this.config.persistPrefix, '');
        if (!this.cache.has(cacheKey)) {
          localStorage.removeItem(key);
        }
      }

      // Salvar entradas atuais
      for (const [key, entry] of this.cache.entries()) {
        localStorage.setItem(
          `${this.config.persistPrefix}${key}`,
          JSON.stringify(entry)
        );
      }
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  private clearStorage(): void {
    try {
      const keys = Object.keys(localStorage).filter(k => 
        k.startsWith(this.config.persistPrefix)
      );

      for (const key of keys) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('Failed to clear cache from storage:', error);
    }
  }
}

// ============================================
// CACHE SINGLETON
// ============================================

export const responseCache = new ResponseCache({
  defaultTTL: 5 * 60 * 1000,
  maxSize: 100,
  staleWhileRevalidate: true,
  staleTime: 60 * 1000,
});

// ============================================
// HOOKS
// ============================================

/**
 * Hook para usar cache com fetch
 */
export function useCachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    refetchOnMount?: boolean;
    refetchInterval?: number;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
): {
  data: T | undefined;
  isLoading: boolean;
  isStale: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const {
    ttl,
    enabled = true,
    refetchOnMount = false,
    refetchInterval,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | undefined>(() => {
    const cached = responseCache.get(key);
    return cached?.data as T | undefined;
  });
  const [isLoading, setIsLoading] = useState(!data);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchData = useCallback(async (background = false) => {
    if (!background) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await fetcherRef.current();
      
      responseCache.set(key, result, { ttl });
      setData(result);
      setIsStale(false);
      onSuccess?.(result);
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Fetch failed');
      setError(fetchError);
      onError?.(fetchError);
    } finally {
      setIsLoading(false);
    }
  }, [key, ttl, onSuccess, onError]);

  const refetch = useCallback(() => fetchData(false), [fetchData]);

  // Fetch inicial ou revalidação
  useEffect(() => {
    if (!enabled) return;

    const cached = responseCache.get(key);
    
    if (cached) {
      setData(cached.data as T);
      setIsStale(cached.stale);
      
      if (cached.stale || refetchOnMount) {
        fetchData(true);
      }
    } else {
      fetchData();
    }
  }, [key, enabled, refetchOnMount, fetchData]);

  // Refetch interval
  useEffect(() => {
    if (!enabled || !refetchInterval) return;

    const intervalId = setInterval(() => {
      fetchData(true);
    }, refetchInterval);

    return () => clearInterval(intervalId);
  }, [enabled, refetchInterval, fetchData]);

  return { data, isLoading, isStale, error, refetch };
}

/**
 * Hook para gerenciar cache manualmente
 */
export function useCache<T>() {
  const set = useCallback((key: string, data: T, ttl?: number) => {
    responseCache.set(key, data, { ttl });
  }, []);

  const get = useCallback((key: string) => {
    return responseCache.get(key)?.data as T | undefined;
  }, []);

  const invalidate = useCallback((keyOrPattern: string | RegExp) => {
    responseCache.invalidate(keyOrPattern);
  }, []);

  const clear = useCallback(() => {
    responseCache.clear();
  }, []);

  const getStats = useCallback(() => {
    return responseCache.getStats();
  }, []);

  return { set, get, invalidate, clear, getStats };
}

/**
 * Hook para prefetch de dados
 */
export function usePrefetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number } = {}
): () => void {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  return useCallback(() => {
    // Só prefetch se não estiver em cache
    if (!responseCache.has(key)) {
      fetcherRef.current().then(data => {
        responseCache.set(key, data, { ttl: options.ttl });
      }).catch(() => {
        // Ignorar erros de prefetch
      });
    }
  }, [key, options.ttl]);
}

// ============================================
// CACHE UTILITIES
// ============================================

/**
 * Gera chave de cache baseada em URL e params
 */
export function generateCacheKey(
  url: string,
  params?: Record<string, unknown>
): string {
  if (!params) return url;
  
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join('&');
  
  return `${url}?${sortedParams}`;
}

/**
 * Wrapper para fetch com cache
 */
export async function cachedFetch<T>(
  url: string,
  options: RequestInit & {
    cacheKey?: string;
    cacheTTL?: number;
    forceRefresh?: boolean;
  } = {}
): Promise<T> {
  const {
    cacheKey = url,
    cacheTTL,
    forceRefresh = false,
    ...fetchOptions
  } = options;

  // Verificar cache
  if (!forceRefresh && fetchOptions.method === undefined || fetchOptions.method === 'GET') {
    const cached = responseCache.get(cacheKey);
    if (cached && !cached.stale) {
      return cached.data as T;
    }
  }

  // Fazer request
  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // Cachear resposta
  if (fetchOptions.method === undefined || fetchOptions.method === 'GET') {
    responseCache.set(cacheKey, data, {
      ttl: cacheTTL,
      etag: response.headers.get('ETag') ?? undefined,
      lastModified: response.headers.get('Last-Modified') ?? undefined,
    });
  }

  return data;
}
