import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SpedEcfHistoricoRow {
  id: string;
  ano_calendario: number;
  created_at: string;
  total_lancamentos: number | null;
  total_linhas: number | null;
  status: string;
  hash_sha256: string | null;
  storage_path: string;
  recibo_transmissao: string | null;
  validacoes: { erros: string[]; avisos: string[] };
  cnpj: string;
  razao_social: string;
}

/**
 * Histórico dedicado de gerações do SPED ECF, com CNPJ/razão social da empresa.
 */
export function useSpedEcfHistorico(empresaId?: string) {
  return useQuery({
    queryKey: ['sped-ecf-historico', empresaId],
    queryFn: async (): Promise<SpedEcfHistoricoRow[]> => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('sped_contabil_arquivos')
        .select('id, ano_calendario, created_at, total_lancamentos, total_linhas, status, hash_sha256, storage_path, recibo_transmissao, validacoes, empresas:empresa_id(cnpj, razao_social)')
        .eq('empresa_id', empresaId)
        .eq('tipo', 'ECF')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      type Row = {
        id: string; ano_calendario: number; created_at: string;
        total_lancamentos: number | null; total_linhas: number | null;
        status: string; hash_sha256: string | null; storage_path: string;
        recibo_transmissao: string | null; validacoes: unknown;
        empresas: { cnpj: string | null; razao_social: string | null } | null;
      };
      return ((data || []) as Row[]).map((r) => {
        const v = (r.validacoes ?? {}) as { erros?: string[]; avisos?: string[] };
        return {
          id: r.id,
          ano_calendario: r.ano_calendario,
          created_at: r.created_at,
          total_lancamentos: r.total_lancamentos,
          total_linhas: r.total_linhas,
          status: r.status,
          hash_sha256: r.hash_sha256,
          storage_path: r.storage_path,
          recibo_transmissao: r.recibo_transmissao,
          validacoes: { erros: v.erros ?? [], avisos: v.avisos ?? [] },
          cnpj: r.empresas?.cnpj ?? '—',
          razao_social: r.empresas?.razao_social ?? '—',
        };
      });
    },
    enabled: !!empresaId,
  });
}
