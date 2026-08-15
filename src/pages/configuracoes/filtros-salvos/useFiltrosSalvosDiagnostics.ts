import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import {
  SAVED_FILTERS_CATALOG,
  discoverLocalStorageEntities,
  mergeWithDiscovered,
  type FilterCatalogEntry,
} from '../savedFiltersCatalog';
import {
  subscribeHydrationEvents,
  type HydrationEvent,
} from '@/lib/filterHydrationTelemetry';
import type { DiagnosticState } from './types';
import { readLocalState } from './helpers';

export function useFiltrosSalvosDiagnostics(userId?: string | null) {
  const [diagnostics, setDiagnostics] = useState<Record<string, DiagnosticState>>({});
  const [globalSyncing, setGlobalSyncing] = useState(false);
  const [catalog, setCatalog] = useState<FilterCatalogEntry[]>(SAVED_FILTERS_CATALOG);
  const [hydrationEvents, setHydrationEvents] = useState<HydrationEvent[]>([]);

  useEffect(() => {
    const unsub = subscribeHydrationEvents((events) => {
      setHydrationEvents(events);
      const last = events[events.length - 1];
      if (last && last.status === 'error') {
        const previously = events.slice(0, -1).some(
          (e) => e.entityType === last.entityType && e.at === last.at,
        );
        if (!previously) {
          logger.error('[FiltrosSalvos] hidratação falhou', {
            entityType: last.entityType,
            stage: last.stage,
            errorMessage: last.errorMessage,
          });
        }
      }
    });
    return unsub;
  }, []);

  const refreshOne = useCallback(
    async (entry: FilterCatalogEntry) => {
      setDiagnostics((prev) => ({
        ...prev,
        [entry.entityType]: {
          ...(prev[entry.entityType] ?? {
            entityType: entry.entityType,
            remote: 'loading',
            remoteUpdatedAt: null,
            remoteUpdatedAtIso: null,
            remoteKeys: [],
            local: 'empty',
            localKeys: [],
            localUpdatedAt: null,
            localUpdatedAtIso: null,
            syncing: false,
          }),
          syncing: true,
          remote: 'loading',
        },
      }));

      const local = readLocalState(entry.localStorageKey);

      let remoteStatus: DiagnosticState['remote'] = 'empty';
      let remoteKeys: string[] = [];
      let remoteUpdatedAt: string | null = null;
      let remoteUpdatedAtIso: string | null = null;

      if (userId) {
        try {
          const { data, error } = await supabase
            .from('user_active_filters')
            .select('payload, updated_at')
            .eq('user_id', userId)
            .eq('entity_type', entry.entityType)
            .maybeSingle();

          if (error) {
            remoteStatus = 'error';
          } else if (data?.payload) {
            const payload = data.payload as { filters?: Record<string, unknown> };
            remoteKeys = Object.keys(payload?.filters ?? {});
            remoteStatus = remoteKeys.length > 0 ? 'ok' : 'empty';
            remoteUpdatedAtIso = data.updated_at ? new Date(data.updated_at).toISOString() : null;
            remoteUpdatedAt = data.updated_at ? new Date(data.updated_at).toLocaleString('pt-BR') : null;
          } else {
            remoteStatus = 'empty';
          }
        } catch (e) {
          logger.warn('[FiltrosSalvos] remote fetch failed', { entityType: entry.entityType, e });
          remoteStatus = 'error';
        }
      } else {
        remoteStatus = 'empty';
      }

      setDiagnostics((prev) => ({
        ...prev,
        [entry.entityType]: {
          entityType: entry.entityType,
          remote: remoteStatus,
          remoteUpdatedAt,
          remoteUpdatedAtIso,
          remoteKeys,
          local: local.status,
          localKeys: local.keys,
          localUpdatedAt: local.ts,
          localUpdatedAtIso: local.tsIso,
          syncing: false,
        },
      }));
    },
    [userId],
  );

  const refreshAll = useCallback(async () => {
    setGlobalSyncing(true);
    try {
      const localKeysByEntity = discoverLocalStorageEntities();

      let remoteEntityTypes: string[] = [];
      if (userId) {
        try {
          const { data, error } = await supabase
            .from('user_active_filters')
            .select('entity_type')
            .eq('user_id', userId);
          if (error) throw error;
          remoteEntityTypes = Array.from(
            new Set((data ?? []).map((r) => r.entity_type as string)),
          );
        } catch (e) {
          logger.warn('[FiltrosSalvos] discovery remoto falhou', { e });
        }
      }

      const merged = mergeWithDiscovered(remoteEntityTypes, localKeysByEntity);
      setCatalog(merged);

      await Promise.all(merged.map((entry) => refreshOne(entry)));
      const autoCount = merged.filter((m) => m.auto).length;
      toast.success('Diagnóstico atualizado', {
        description: autoCount
          ? `${merged.length} telas (incluindo ${autoCount} descoberta(s) automaticamente).`
          : `${merged.length} telas verificadas.`,
      });
    } finally {
      setGlobalSyncing(false);
    }
  }, [refreshOne, userId]);

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    diagnostics,
    catalog,
    globalSyncing,
    hydrationEvents,
    refreshOne,
    refreshAll,
  };
}
