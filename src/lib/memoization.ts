// ============================================
// MEMOIZATION: Cache e otimização de funções
// Evita recálculos desnecessários
// ============================================

import { useRef, useMemo, useCallback, useEffect, useState } from 'react';

// ============================================
// TIPOS
// ============================================

interface MemoOptions<K = string> {
  maxSize?: number;
  ttl?: number;
  keyResolver?: (...args: unknown[]) => K;
  onEvict?: (key: K, value: unknown) => void;
}

interface CacheEntry<V> {
  value: V;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
}

type AnyFunction = (...args: unknown[]) => unknown;

// ============================================
// IMPLEMENTAÇÕES DE CACHE
// ============================================

/**
 * Cache LRU (Least Recently Used)
 */
export class LRUCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private maxSize: number;
  private ttl: number;
  private onEvict?: (key: K, value: V) => void;

  constructor(options: MemoOptions<K> = {}) {
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl || 0;
    this.onEvict = options.onEvict as ((key: K, value: V) => void) | undefined;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Verificar TTL
    if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
      this.delete(key);
      return undefined;
    }

    // Atualizar acesso
    entry.accessCount++;
    entry.lastAccess = Date.now();

    // Mover para o final (mais recente)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: K, value: V): void {
    // Remover se já existe
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evictar se necessário
    while (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        const entry = this.cache.get(firstKey);
        this.cache.delete(firstKey);
        if (entry && this.onEvict) {
          this.onEvict(firstKey, entry.value);
        }
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccess: Date.now(),
    });
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  delete(key: K): boolean {
    const entry = this.cache.get(key);
    if (entry && this.onEvict) {
      this.onEvict(key, entry.value);
    }
    return this.cache.delete(key);
  }

  clear(): void {
    if (this.onEvict) {
      this.cache.forEach((entry, key) => {
        this.onEvict!(key, entry.value);
      });
    }
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  values(): V[] {
    return Array.from(this.cache.values()).map((e) => e.value);
  }

  entries(): [K, V][] {
    return Array.from(this.cache.entries()).map(([k, e]) => [k, e.value]);
  }

  getStats(): { hits: number; size: number; avgAccessCount: number } {
    let totalAccess = 0;
    this.cache.forEach((entry) => {
      totalAccess += entry.accessCount;
    });

    return {
      hits: totalAccess,
      size: this.cache.size,
      avgAccessCount: this.cache.size > 0 ? totalAccess / this.cache.size : 0,
    };
  }
}

/**
 * Cache LFU (Least Frequently Used)
 */
export class LFUCache<K, V> extends LRUCache<K, V> {
  protected evict(): void {
    if (this.size === 0) return;

    let minKey: K | undefined;
    let minCount = Infinity;

    // Encontrar item menos acessado
    // @ts-ignore - accessing private cache
    this['cache'].forEach((entry: CacheEntry<V>, key: K) => {
      if (entry.accessCount < minCount) {
        minCount = entry.accessCount;
        minKey = key;
      }
    });

    if (minKey !== undefined) {
      this.delete(minKey);
    }
  }
}

// ============================================
// FUNÇÕES DE MEMOIZAÇÃO
// ============================================

/**
 * Memoização simples de função
 */
export function memoize<T extends AnyFunction>(
  fn: T,
  options: MemoOptions = {}
): T & { cache: LRUCache<string, ReturnType<T>>; clear: () => void } {
  const cache = new LRUCache<string, ReturnType<T>>(options);
  const keyResolver = options.keyResolver || ((...args) => JSON.stringify(args));

  const memoized = function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const key = keyResolver(...args) as string;

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn.apply(this, args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  } as T & { cache: LRUCache<string, ReturnType<T>>; clear: () => void };

  memoized.cache = cache;
  memoized.clear = () => cache.clear();

  return memoized;
}

/**
 * Memoização assíncrona
 */
export function memoizeAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: MemoOptions = {}
): T & { cache: LRUCache<string, unknown>; clear: () => void; pending: Map<string, Promise<unknown>> } {
  const cache = new LRUCache<string, unknown>(options);
  const pending = new Map<string, Promise<unknown>>();
  const keyResolver = options.keyResolver || ((...args) => JSON.stringify(args));

  const memoized = async function (this: unknown, ...args: Parameters<T>): Promise<unknown> {
    const key = keyResolver(...args) as string;

    // Verificar cache
    if (cache.has(key)) {
      return cache.get(key);
    }

    // Verificar se já está em andamento
    if (pending.has(key)) {
      return pending.get(key);
    }

    // Executar
    const promise = fn.apply(this, args);
    pending.set(key, promise);

    try {
      const result = await promise;
      cache.set(key, result);
      return result;
    } finally {
      pending.delete(key);
    }
  } as T & { cache: LRUCache<string, unknown>; clear: () => void; pending: Map<string, Promise<unknown>> };

  memoized.cache = cache;
  memoized.clear = () => cache.clear();
  memoized.pending = pending;

  return memoized;
}

/**
 * Memoização com TTL
 */
export function memoizeWithTTL<T extends AnyFunction>(
  fn: T,
  ttlMs: number,
  options: Omit<MemoOptions, 'ttl'> = {}
): T & { cache: LRUCache<string, ReturnType<T>>; clear: () => void } {
  return memoize(fn, { ...options, ttl: ttlMs });
}

/**
 * Memoização por argumento específico
 */
export function memoizeByArg<T extends AnyFunction>(
  fn: T,
  argIndex: number = 0,
  options: MemoOptions = {}
): T & { cache: LRUCache<string, ReturnType<T>>; clear: () => void } {
  return memoize(fn, {
    ...options,
    keyResolver: (...args) => String(args[argIndex]),
  });
}

/**
 * Memoização com limite de argumentos
 */
export function memoizeOne<T extends AnyFunction>(fn: T): T {
  let lastArgs: Parameters<T> | null = null;
  let lastResult: ReturnType<T>;
  let hasResult = false;

  const areArgsEqual = (
    newArgs: Parameters<T>,
    prevArgs: Parameters<T>
  ): boolean => {
    if (newArgs.length !== prevArgs.length) return false;
    return newArgs.every((arg, index) => Object.is(arg, prevArgs[index]));
  };

  return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    if (hasResult && lastArgs && areArgsEqual(args, lastArgs)) {
      return lastResult;
    }

    lastArgs = args;
    lastResult = fn.apply(this, args) as ReturnType<T>;
    hasResult = true;
    return lastResult;
  } as T;
}

// ============================================
// HOOKS DE MEMOIZAÇÃO
// ============================================

/**
 * Hook para memoização de função
 */
export function useMemoizedFn<T extends AnyFunction>(fn: T): T {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useCallback(
    ((...args: Parameters<T>) => fnRef.current(...args)) as T,
    []
  );
}

/**
 * Hook para memoização com cache
 */
export function useMemoizedCallback<T extends AnyFunction>(
  fn: T,
  deps: unknown[],
  options: MemoOptions = {}
): T & { clear: () => void } {
  const cacheRef = useRef(new LRUCache<string, ReturnType<T>>(options));
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const keyResolver = options.keyResolver || ((...args) => JSON.stringify(args));

  const memoizedFn = useCallback(
    ((...args: Parameters<T>): ReturnType<T> => {
      const key = keyResolver(...args) as string;

      if (cacheRef.current.has(key)) {
        return cacheRef.current.get(key)!;
      }

      const result = fnRef.current(...args) as ReturnType<T>;
      cacheRef.current.set(key, result);
      return result;
    }) as T & { clear: () => void },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  (memoizedFn as T & { clear: () => void }).clear = () => cacheRef.current.clear();

  return memoizedFn as T & { clear: () => void };
}

/**
 * Hook para comparação profunda em deps
 */
export function useDeepMemo<T>(factory: () => T, deps: unknown[]): T {
  const ref = useRef<{ deps: unknown[]; value: T }>();

  const isEqual = (a: unknown[], b: unknown[]): boolean => {
    if (a.length !== b.length) return false;
    return a.every((item, index) => {
      const other = b[index];
      if (typeof item === 'object' && item !== null) {
        return JSON.stringify(item) === JSON.stringify(other);
      }
      return Object.is(item, other);
    });
  };

  if (!ref.current || !isEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }

  return ref.current.value;
}

/**
 * Hook para memoização de valores computados
 */
export function useComputedValue<T>(
  compute: () => T,
  deps: unknown[],
  options: { debounceMs?: number } = {}
): T {
  const [value, setValue] = useState<T>(() => compute());
  const computeRef = useRef(compute);
  computeRef.current = compute;

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const update = () => {
      setValue(computeRef.current());
    };

    if (options.debounceMs) {
      timeoutId = setTimeout(update, options.debounceMs);
    } else {
      update();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}

/**
 * Hook para cache de resultados de fetch
 */
export function useCachedFetch<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  options: { ttl?: number; staleWhileRevalidate?: boolean } = {}
): {
  data: T | null;
  isLoading: boolean;
  isStale: boolean;
  error: Error | null;
  refresh: () => void;
} {
  const cacheRef = useRef(new Map<string, { data: T; timestamp: number }>());
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const fetch = useCallback(async (forceRefresh = false) => {
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();
    const isExpired = cached && options.ttl 
      ? now - cached.timestamp > options.ttl 
      : false;

    // Usar cache se válido
    if (cached && !isExpired && !forceRefresh) {
      setData(cached.data);
      setIsLoading(false);
      return;
    }

    // Stale while revalidate
    if (cached && options.staleWhileRevalidate && !forceRefresh) {
      setData(cached.data);
      setIsStale(true);
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFnRef.current();
      cacheRef.current.set(cacheKey, { data: result, timestamp: now });
      setData(result);
      setIsStale(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar'));
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, options.ttl, options.staleWhileRevalidate]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const refresh = useCallback(() => {
    fetch(true);
  }, [fetch]);

  return { data, isLoading, isStale, error, refresh };
}

/**
 * Hook para memoização de props de componente
 */
export function usePropsMemo<T extends Record<string, unknown>>(props: T): T {
  const ref = useRef<T>(props);

  const isEqual = useMemo(() => {
    const prev = ref.current;
    const keys = Object.keys(props);
    const prevKeys = Object.keys(prev);

    if (keys.length !== prevKeys.length) return false;

    return keys.every((key) => Object.is(props[key], prev[key]));
  }, [props]);

  if (!isEqual) {
    ref.current = props;
  }

  return ref.current;
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Cria uma chave de cache baseada em argumentos
 */
export function createCacheKey(...args: unknown[]): string {
  return args
    .map((arg) => {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'function') return arg.name || 'fn';
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(':');
}

/**
 * Compara dois objetos profundamente
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) =>
    deepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key]
    )
  );
}

// ============================================
// EXPORTS
// ============================================

export default {
  LRUCache,
  LFUCache,
  memoize,
  memoizeAsync,
  memoizeWithTTL,
  memoizeByArg,
  memoizeOne,
  useMemoizedFn,
  useMemoizedCallback,
  useDeepMemo,
  useComputedValue,
  useCachedFetch,
  usePropsMemo,
  createCacheKey,
  deepEqual,
};
