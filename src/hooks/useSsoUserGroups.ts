import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from './useSSO';

export interface SsoUserGroupsRow {
  id: string;
  user_id: string;
  provider_id: string;
  groups: string[];
  matched_group: string | null;
  matched_role: AppRole | null;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
  provider_nome?: string | null;
}

/**
 * Lê os grupos do IdP sincronizados a cada login SSO para o usuário informado.
 * A tabela `sso_user_groups` é populada/atualizada pela edge `sso-callback`
 * em todo login (não só no JIT), refletindo alterações de grupo no IdP.
 */
export function useSsoUserGroups(userId?: string | null) {
  return useQuery({
    queryKey: ['sso-user-groups', userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<SsoUserGroupsRow[]> => {
      if (!userId) return [];
      // Tabela `sso_user_groups` existe no banco mas não está nos tipos gerados.
      // Cast único e localizado via `unknown` para preservar type-safety adiante.
      const client = supabase as unknown as {
        from: (t: string) => {
          select: (s: string) => {
            eq: (c: string, v: string) => {
              order: (c: string, o: { ascending: boolean }) => Promise<{
                data: Array<SsoUserGroupsRow & { sso_providers?: { nome: string } }> | null;
                error: { message: string } | null;
              }>;
            };
          };
        };
      };
      const { data, error } = await client
        .from('sso_user_groups')
        .select('*, sso_providers:provider_id(nome)')
        .eq('user_id', userId)
        .order('last_synced_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(

        (row) => ({
          ...row,
          provider_nome: row.sso_providers?.nome ?? null,
        }),
      );
    },
  });
}
