import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BenchmarkResult {
  empresa: { id: string; razao_social: string; regime: string };
  /** `null` quando a empresa nao tem faturamento nos ultimos 12 meses. */
  carga_empresa_12m: number | null;
  benchmark: {
    regime: string;
    p25: number;
    mediana: number;
    p75: number;
    media: number;
    /** `tabela` = benchmark vigente de public.benchmarks_setoriais.
     *  `referencia_interna` = faixa de referencia do codigo, porque a tabela
     *  nao tem linha para o regime. Nao existe amostra de empresas: o campo
     *  `amostra: 1247` que havia aqui era inventado. */
    origem: 'tabela' | 'referencia_interna';
    fonte: string;
  } | null;
  posicao: 'abaixo_p25' | 'mediana' | 'acima_p75' | null;
  percentil: number | null;
  diferenca_mediana: number | null;
  motivo?: 'sem_faturamento_12m';
  insights: string[];
  atualizado_em: string;
}

export function useBenchmarkSetorial(empresaId?: string) {
  return useQuery({
    queryKey: ['benchmark-setorial', empresaId],
    queryFn: async (): Promise<BenchmarkResult> => {
      if (!empresaId) throw new Error('empresa_id obrigatório');
      const { data, error } = await supabase.functions.invoke('comparar-benchmark-setorial', {
        body: { empresa_id: empresaId },
      });
      if (error) throw error;
      return data as BenchmarkResult;
    },
    enabled: !!empresaId,
    staleTime: 30 * 60 * 1000,
  });
}
