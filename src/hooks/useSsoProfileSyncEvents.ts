import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  SsoSyncFieldKey,
  SsoSyncChanges,
  SsoSyncChangeDetail,
} from './useLastSsoProfileSync';

export interface SsoProfileSyncEvent {
  id: string;
  created_at: string;
  user_id: string | null;
  user_email: string | null;
  provider_nome: string | null;
  provider_tipo: string | null;
  fields_changed: SsoSyncFieldKey[];
  changes: SsoSyncChanges;
  /** Lista ordenada [{ field, old, new }] para depuração rápida. */
  changes_detail: SsoSyncChangeDetail[];
  /** Espelho dos campos alterados gravado em audit_logs.old_data. */
  old_data: Record<string, unknown>;
  details: string | null;
}

const FIELD_WHITELIST: SsoSyncFieldKey[] = ['full_name', 'avatar_url', 'telefone'];

export interface UseSsoProfileSyncEventsParams {
  fromIso?: string;
  toIso?: string;
  limit?: number;
}

/**
 * Lista eventos de sincronização de perfil via SSO (table_name = 'sso_profile_sync')
 * registrados em audit_logs pela edge sso-callback.
 */
export function useSsoProfileSyncEvents(params: UseSsoProfileSyncEventsParams = {}) {
  const { fromIso, toIso, limit = 500 } = params;
  return useQuery({
    queryKey: ['sso-profile-sync', 'events', fromIso, toIso, limit],
    staleTime: 30_000,
    queryFn: async (): Promise<SsoProfileSyncEvent[]> => {
      let q = supabase
        .from('audit_logs')
        .select('id, created_at, user_id, user_email, new_data, old_data, details')
        .eq('table_name', 'sso_profile_sync')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (fromIso) q = q.gte('created_at', fromIso);
      if (toIso) q = q.lte('created_at', toIso);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((row) => {
        const nd = (row.new_data ?? {}) as Record<string, unknown>;
        const od = (row.old_data ?? {}) as Record<string, unknown>;
        const rawFields = Array.isArray(nd.fields_changed) ? (nd.fields_changed as unknown[]) : [];
        const fields_changed = rawFields
          .map(String)
          .filter((f): f is SsoSyncFieldKey => (FIELD_WHITELIST as string[]).includes(f));

        const rawDetail = Array.isArray(nd.changes_detail) ? (nd.changes_detail as unknown[]) : [];
        const changes_detail: SsoSyncChangeDetail[] = rawDetail
          .map((item) => item as Record<string, unknown>)
          .filter((it) => (FIELD_WHITELIST as string[]).includes(String(it.field)))
          .map((it) => ({
            field: it.field as SsoSyncFieldKey,
            old: it.old,
            new: it.new,
          }));

        return {
          id: row.id,
          created_at: row.created_at,
          user_id: row.user_id,
          user_email: row.user_email,
          provider_nome: (nd.provider_nome as string) ?? null,
          provider_tipo: (nd.provider_tipo as string) ?? null,
          fields_changed,
          changes: ((nd.changes as SsoSyncChanges) ?? {}) as SsoSyncChanges,
          changes_detail,
          old_data: od,
          details: row.details ?? null,
        };
      });
    },
  });
}
