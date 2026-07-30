import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SsoSyncFieldKey = 'full_name' | 'avatar_url' | 'telefone';

export interface SsoSyncChanges {
  [field: string]: { from: unknown; to: unknown };
}

export interface SsoSyncChangeDetail {
  field: SsoSyncFieldKey;
  old: unknown;
  new: unknown;
}

export interface LastSsoProfileSync {
  id: string;
  created_at: string;
  provider_nome: string | null;
  provider_tipo: string | null;
  fields_changed: SsoSyncFieldKey[];
  changes: SsoSyncChanges;
  /** Lista ordenada com old/new por atributo, pronta para depuração. */
  changes_detail: SsoSyncChangeDetail[];
  /** Espelho dos campos alterados gravado em audit_logs.old_data. */
  old_data: Record<string, unknown>;
  details: string | null;
}

const FIELD_WHITELIST: SsoSyncFieldKey[] = ['full_name', 'avatar_url', 'telefone'];

/**
 * Retorna o evento mais recente de sincronização de perfil via SSO para o
 * usuário autenticado. Usado pelo painel "Meu Perfil" para avisar quando
 * full_name, avatar_url ou telefone foram alterados pelo último login SSO.
 *
 * Filtros:
 *  - table_name = 'sso_profile_sync' (gravado pela edge sso-callback)
 *  - user_id = auth user
 *  - limit 1, mais recente
 */
export function useLastSsoProfileSync(userId?: string | null) {
  return useQuery({
    queryKey: ['sso-profile-sync', 'last', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<LastSsoProfileSync | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, created_at, new_data, old_data, details')
        .eq('user_id', userId)
        .eq('table_name', 'sso_profile_sync')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const nd = (data.new_data ?? {}) as Record<string, unknown>;
      const od = (data.old_data ?? {}) as Record<string, unknown>;
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
        id: data.id,
        created_at: data.created_at,
        provider_nome: (nd.provider_nome as string) ?? null,
        provider_tipo: (nd.provider_tipo as string) ?? null,
        fields_changed,
        changes: ((nd.changes as SsoSyncChanges) ?? {}) as SsoSyncChanges,
        changes_detail,
        old_data: od,
        details: data.details ?? null,
      };
    },
  });
}

export const SSO_SYNC_FIELD_LABEL: Record<SsoSyncFieldKey, string> = {
  full_name: 'Nome completo',
  avatar_url: 'Foto de perfil',
  telefone: 'Telefone',
};
