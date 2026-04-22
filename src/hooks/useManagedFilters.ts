import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

type AnyFilters = Record<string, unknown>;

export interface ManagedFiltersOptions<T extends AnyFilters> {
  /** Identificador único da entidade/tela (ex: 'clientes', 'fornecedores'). */
  entityType: string;
  /** Estado inicial / fallback quando não há nada salvo. */
  defaults: T;
  /** Chave (opcional) usada como espelho local em localStorage. */
  localStorageKey?: string;
  /** Chaves auxiliares de localStorage também removidas no clear (ex: ordenação). */
  extraLocalStorageKeys?: string[];
  /** Persistir mudanças automaticamente (default: true). */
  autoPersist?: boolean;
}

export interface ClearSnapshot<T> {
  values: T;
  localEntries: Array<{ key: string; value: string | null }>;
  remoteRow: { user_id: string; entity_type: string; payload: unknown } | null;
}

export interface ManagedFiltersController<T extends AnyFilters> {
  values: T;
  setValues: (next: T | ((prev: T) => T)) => void;
  setField: <K extends keyof T>(key: K, value: T[K]) => void;
  resetToDefaults: () => void;
  hasActive: boolean;
  activeCount: number;
  isHydrated: boolean;
  /** Executa a limpeza completa (Supabase + localStorage + state) e devolve o snapshot. */
  performClear: () => Promise<ClearSnapshot<T>>;
  /** Restaura um snapshot retornado por performClear. */
  restoreSnapshot: (snap: ClearSnapshot<T>) => Promise<void>;
  /** Helpers expostos para o ClearFiltersButton. */
  entityType: string;
  defaults: T;
  localStorageKey?: string;
  extraLocalStorageKeys: string[];
}

const PAYLOAD_VERSION = 1;
const DEBOUNCE_MS = 500;

function readLocal<T>(key: string | undefined, fallback: T): T | null {
  if (!key || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed?.filters ?? parsed) as T;
  } catch (e) {
    logger.warn('[useManagedFilters] failed to read localStorage', { key, e });
    return null;
  }
}

function writeLocal<T>(key: string | undefined, values: T) {
  if (!key || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ v: PAYLOAD_VERSION, filters: values, ts: Date.now() })
    );
  } catch (e) {
    logger.warn('[useManagedFilters] failed to write localStorage', { key, e });
  }
}

/**
 * Compara recursivamente — para detectar filtros "ativos" (≠ defaults) e
 * para contar o número de chaves que diferem do default.
 */
function diffKeys<T extends AnyFilters>(values: T, defaults: T): string[] {
  const keys = new Set([...Object.keys(values || {}), ...Object.keys(defaults || {})]);
  const diffs: string[] = [];
  for (const k of keys) {
    const a = JSON.stringify(values?.[k] ?? null);
    const b = JSON.stringify(defaults?.[k] ?? null);
    if (a !== b) diffs.push(k);
  }
  return diffs;
}

/**
 * Hook central para filtros gerenciados — persistência por conta + localStorage,
 * com suporte a snapshot/undo orquestrado pelo ClearFiltersButton.
 */
export function useManagedFilters<T extends AnyFilters>(
  options: ManagedFiltersOptions<T>
): ManagedFiltersController<T> {
  const {
    entityType,
    defaults,
    localStorageKey,
    extraLocalStorageKeys = [],
    autoPersist = true,
  } = options;

  const { user } = useAuth();
  const [values, setValuesState] = useState<T>(defaults);
  const [isHydrated, setIsHydrated] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHydratedRef = useRef(false);

  // ---- Hidratação inicial ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: T | null = null;

      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('user_active_filters')
            .select('payload')
            .eq('user_id', user.id)
            .eq('entity_type', entityType)
            .maybeSingle();
          if (!error && data?.payload && typeof data.payload === 'object') {
            const payload = data.payload as { filters?: T };
            if (payload?.filters) next = payload.filters;
          }
        } catch (e) {
          logger.warn('[useManagedFilters] supabase read failed', { entityType, e });
        }
      }

      if (!next) next = readLocal<T>(localStorageKey, defaults);

      if (!cancelled) {
        if (next) setValuesState({ ...defaults, ...next });
        hasHydratedRef.current = true;
        setIsHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, entityType]);

  // ---- Persistência debounced ----
  const persist = useCallback(
    (next: T) => {
      writeLocal(localStorageKey, next);
      if (!user?.id) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          await supabase
            .from('user_active_filters')
            .upsert(
              [{
                user_id: user.id,
                entity_type: entityType,
                payload: { v: PAYLOAD_VERSION, filters: next } as never,
              }],
              { onConflict: 'user_id,entity_type' }
            );
        } catch (e) {
          logger.warn('[useManagedFilters] supabase upsert failed', { entityType, e });
        }
      }, DEBOUNCE_MS);
    },
    [user?.id, entityType, localStorageKey]
  );

  const setValues = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValuesState((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        if (autoPersist && hasHydratedRef.current) persist(resolved);
        return resolved;
      });
    },
    [autoPersist, persist]
  );

  const setField = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [setValues]
  );

  const resetToDefaults = useCallback(() => {
    setValues(defaults);
  }, [setValues, defaults]);

  // ---- Snapshot / clear / restore ----
  const performClear = useCallback(async (): Promise<ClearSnapshot<T>> => {
    const localEntries: ClearSnapshot<T>['localEntries'] = [];
    const allLocalKeys = [
      ...(localStorageKey ? [localStorageKey] : []),
      ...extraLocalStorageKeys,
    ];
    for (const k of allLocalKeys) {
      try {
        localEntries.push({ key: k, value: window.localStorage.getItem(k) });
      } catch {
        localEntries.push({ key: k, value: null });
      }
    }

    let remoteRow: ClearSnapshot<T>['remoteRow'] = null;
    if (user?.id) {
      try {
        const { data } = await supabase
          .from('user_active_filters')
          .select('user_id, entity_type, payload')
          .eq('user_id', user.id)
          .eq('entity_type', entityType)
          .maybeSingle();
        if (data) remoteRow = data;
      } catch (e) {
        logger.warn('[useManagedFilters] snapshot read failed', { entityType, e });
      }
    }

    const snapshot: ClearSnapshot<T> = { values, localEntries, remoteRow };

    // Apply clear
    for (const k of allLocalKeys) {
      try {
        window.localStorage.removeItem(k);
      } catch {
        /* noop */
      }
    }
    if (user?.id) {
      try {
        await supabase
          .from('user_active_filters')
          .delete()
          .eq('user_id', user.id)
          .eq('entity_type', entityType);
      } catch (e) {
        logger.warn('[useManagedFilters] clear delete failed', { entityType, e });
      }
    }
    setValuesState(defaults);

    return snapshot;
  }, [values, defaults, entityType, localStorageKey, extraLocalStorageKeys, user?.id]);

  const restoreSnapshot = useCallback(
    async (snap: ClearSnapshot<T>) => {
      // localStorage
      for (const entry of snap.localEntries) {
        try {
          if (entry.value === null) window.localStorage.removeItem(entry.key);
          else window.localStorage.setItem(entry.key, entry.value);
        } catch {
          /* noop */
        }
      }
      // Supabase
      if (user?.id && snap.remoteRow) {
        try {
          await supabase.from('user_active_filters').upsert(
            [{
              user_id: user.id,
              entity_type: entityType,
              payload: snap.remoteRow.payload as never,
            }],
            { onConflict: 'user_id,entity_type' }
          );
        } catch (e) {
          logger.warn('[useManagedFilters] restore upsert failed', { entityType, e });
        }
      }
      setValuesState(snap.values);
    },
    [user?.id, entityType]
  );

  // ---- Derived ----
  const diffs = useMemo(() => diffKeys(values, defaults), [values, defaults]);
  const hasActive = diffs.length > 0;
  const activeCount = diffs.length;

  return {
    values,
    setValues,
    setField,
    resetToDefaults,
    hasActive,
    activeCount,
    isHydrated,
    performClear,
    restoreSnapshot,
    entityType,
    defaults,
    localStorageKey,
    extraLocalStorageKeys,
  };
}
