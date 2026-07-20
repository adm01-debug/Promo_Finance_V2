import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditoriaLancamentoRow {
  id: string;
  tabela: string;
  operacao: 'INSERT' | 'UPDATE' | 'DELETE';
  registro_id: string | null;
  user_id: string | null;
  usuario: string | null;
  created_at: string;
  dados_antigos: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
  // Campos derivados
  numero_lancamento?: number | null;
  historico?: string | null;
  data_lancamento?: string | null;
  empresa_id?: string | null;
}

export interface UseAuditoriaLancamentosParams {
  empresaId?: string;
  ano?: number;
  operacao?: 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  tabela?: 'lancamentos_contabeis' | 'partidas_contabeis' | 'ALL';
  search?: string;
  limit?: number;
}

export function useAuditoriaLancamentos(params: UseAuditoriaLancamentosParams) {
  const { empresaId, ano, operacao = 'ALL', tabela = 'ALL', search = '', limit = 500 } = params;

  return useQuery({
    queryKey: ['auditoria-lancamentos', empresaId, ano, operacao, tabela, search, limit],
    queryFn: async (): Promise<AuditoriaLancamentoRow[]> => {
      let query = supabase
        .from('auditoria_financeira')
        .select('*, usuario:profiles!user_id(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (tabela === 'ALL') {
        query = query.in('tabela', ['lancamentos_contabeis', 'partidas_contabeis']);
      } else {
        query = query.eq('tabela', tabela);
      }

      if (operacao !== 'ALL') {
        query = query.eq('operacao', operacao);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as unknown as AuditoriaLancamentoRow[];

      // Enriquecer com numero_lancamento/historico/data
      const enriched = rows.map((r: any) => {
        const novos = (r.dados_novos || {}) as Record<string, unknown>;
        const antigos = (r.dados_antigos || {}) as Record<string, unknown>;
        const src = Object.keys(novos).length ? novos : antigos;
        
        // Resolve o nome do usuário a partir da join
        const userProfile = r.usuario as { full_name: string | null; email: string | null } | null;
        const usuarioNome = userProfile ? (userProfile.full_name || userProfile.email || 'Sistema') : 'Sistema';

        return {
          ...r,
          usuario: usuarioNome,
          numero_lancamento: (src.numero_lancamento as number) ?? null,
          historico: (src.historico as string) ?? null,
          data_lancamento: (src.data_lancamento as string) ?? null,
          empresa_id: (src.empresa_id as string) ?? null,
        };
      });

      // Filtros derivados
      let filtered = enriched;
      if (empresaId) {
        filtered = filtered.filter((r) => r.empresa_id === empresaId);
      }
      if (ano) {
        filtered = filtered.filter((r) => {
          if (!r.data_lancamento) return true;
          return r.data_lancamento.startsWith(String(ano));
        });
      }
      if (search.trim()) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.historico?.toLowerCase().includes(s) ||
            String(r.numero_lancamento ?? '').includes(s) ||
            r.registro_id?.toLowerCase().includes(s),
        );
      }

      return filtered;
    },
    enabled: true,
  });
}
