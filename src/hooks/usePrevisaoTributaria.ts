// Hook: previsão tributária com IA
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PrevisaoMes {
  mes_offset: number;
  total_tributos: number;
  cbs: number;
  ibs: number;
  imposto_seletivo: number;
  confianca_pct: number;
}

export interface AcaoRecomendada {
  titulo: string;
  descricao: string;
  impacto_estimado_brl: number;
  prioridade: 'alta' | 'media' | 'baixa';
}

export interface PrevisaoTributaria {
  empresa_id: string;
  gerado_em: string;
  historico_meses: number;
  previsao_base: PrevisaoMes[];
  cenario_conservador_total: number;
  cenario_agressivo_total: number;
  acoes_recomendadas: AcaoRecomendada[];
  resumo_executivo: string;
}

export function usePrevisaoTributaria(empresaId?: string) {
  const qc = useQueryClient();
  const queryKey = ['previsao-tributaria', empresaId];

  const query = useQuery<PrevisaoTributaria | null>({
    queryKey,
    queryFn: async () => {
      if (!empresaId) return null;
      const { data, error } = await supabase.functions.invoke('prever-carga-tributaria', {
        body: { empresa_id: empresaId, meses_historico: 12 },
      });
      if (error) {
        if (error.message?.includes('429')) toast.error('Limite de IA excedido. Tente novamente em alguns instantes.');
        else if (error.message?.includes('402')) toast.error('Créditos de IA esgotados.');
        throw error;
      }
      if (data?.error) throw new Error(data.error);
      return data as PrevisaoTributaria;
    },
    enabled: !!empresaId,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  const regenerar = useMutation({
    mutationFn: async () => {
      await qc.invalidateQueries({ queryKey });
      return query.refetch();
    },
    onSuccess: () => toast.success('Análise regenerada'),
  });

  return { ...query, regenerar };
}
