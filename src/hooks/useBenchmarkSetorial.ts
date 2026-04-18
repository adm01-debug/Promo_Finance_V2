import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BenchmarkResult {
  empresa: { id: string; razao_social: string; regime: string };
  carga_empresa_12m: number;
  benchmark: {
    regime: string;
    amostra: number;
    p25: number;
    mediana: number;
    p75: number;
    media: number;
  } | null;
  posicao: 'abaixo_p25' | 'mediana' | 'acima_p75';
  percentil: number;
  diferenca_mediana: number;
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
