// Histórico de auditoria do Plano de Contas: lê audit_logs filtrado por
// table_name='plano_contas'. Usado no painel de histórico da aba Plano.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlanoContaAuditEntry {
  id: string;
  created_at: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  details: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
}

interface Options {
  empresaId?: string;
  contaId?: string;
  limit?: number;
}

/**
 * Histórico de alterações do plano de contas. Quando `contaId` é informado,
 * filtra por aquela conta específica. Caso contrário, retorna o histórico
 * global da empresa (incluindo importações CFC e mapeamentos DRE/Balanço).
 */
export function usePlanoContaHistory({ empresaId, contaId, limit = 100 }: Options) {
  return useQuery({
    queryKey: ['plano-conta-history', empresaId || 'all', contaId || 'all', limit],
    enabled: !!empresaId || !!contaId,
    staleTime: 30_000,
    queryFn: async (): Promise<PlanoContaAuditEntry[]> => {
      let q = supabase
        .from('audit_logs')
        .select('id, created_at, user_id, user_email, action, table_name, record_id, details, old_data, new_data')
        .in('table_name', ['plano_contas', 'plano_contas_import_cfc', 'plano_contas_mapeamento'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (contaId) {
        q = q.eq('record_id', contaId);
      } else if (empresaId) {
        // Filtragem global por empresa: details contém o empresa_id (formato livre).
        q = q.ilike('details', `%${empresaId}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PlanoContaAuditEntry[];
    },
  });
}
