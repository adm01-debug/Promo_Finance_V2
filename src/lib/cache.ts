/**
 * Sistema de Cache Inteligente
 * Cache em memória com TTL, invalidação e persistência opcional
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class InMemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private subscribers = new Map<string, Set<() => void>>();

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
    this.notifySubscribers(key);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    this.notifySubscribers(key);
  }

  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.invalidate(key));
  }

  clear(): void {
    this.cache.clear();
  }

  subscribe(key: string, callback: () => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }

  private notifySubscribers(key: string): void {
    this.subscribers.get(key)?.forEach(callback => callback());
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const cache = new InMemoryCache();

// Cache com persistência no localStorage
class PersistentCache {
  private prefix = 'app_cache_';

  set<T>(key: string, data: T, ttlMs: number = 24 * 60 * 60 * 1000): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs,
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (e) {
      console.warn('Failed to persist cache:', e);
    }
  }

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      const isExpired = Date.now() - entry.timestamp > entry.ttl;
      
      if (isExpired) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }

      return entry.data;
    } catch (e) {
      return null;
    }
  }

  invalidate(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

export const persistentCache = new PersistentCache();

// Hook para usar cache com React Query
import { useCallback } from 'react';

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000
): {
  getData: () => Promise<T>;
  invalidate: () => void;
} {
  const getData = useCallback(async () => {
    const cached = cache.get<T>(key);
    if (cached) return cached;

    const data = await fetcher();
    cache.set(key, data, ttlMs);
    return data;
  }, [key, fetcher, ttlMs]);

  const invalidate = useCallback(() => {
    cache.invalidate(key);
  }, [key]);

  return { getData, invalidate };
}

// Cache keys constants
export const CACHE_KEYS = {
  EMPRESAS: 'empresas',
  CONTAS_BANCARIAS: 'contas_bancarias',
  CENTROS_CUSTO: 'centros_custo',
  FORNECEDORES: 'fornecedores',
  CLIENTES: 'clientes',
  USER_PREFERENCES: 'user_preferences',
  DASHBOARD_METRICS: 'dashboard_metrics',
} as const;

// TTL constants
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 30 * 60 * 1000,      // 30 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
} as const;
