import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STALE_TIMES } from '@/lib/queryClient';

export interface TotaisContasPagar {
  total_pagar: number;
  total_vencidas_pagar: number;
  despesas_mes: number;
}

export interface TotaisContasReceber {
  total_receber: number;
  total_vencidas_receber: number;
  receitas_mes: number;
}

const TOTAIS_PAGAR_VAZIO: TotaisContasPagar = {
  total_pagar: 0,
  total_vencidas_pagar: 0,
  despesas_mes: 0,
};

const TOTAIS_RECEBER_VAZIO: TotaisContasReceber = {
  total_receber: 0,
  total_vencidas_receber: 0,
  receitas_mes: 0,
};

// Totais agregados via SUM() no banco (RPC totais_contas_pagar/receber),
// sem o cap de 1000 linhas que afeta useContasPagar/useContasReceber —
// ver B2 em docs/VALIDACAO_EXAUSTIVA_R2_2026-09-03.md.
export function useTotaisContasPagar(empresaId?: string | null, centroCustoId?: string | null) {
  return useQuery<TotaisContasPagar>({
    queryKey: ['totais-contas-pagar', empresaId ?? null, centroCustoId ?? null],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'totais_contas_pagar' as never,
        {
          p_empresa_id: empresaId ?? null,
          p_centro_custo_id: centroCustoId ?? null,
        } as never
      );
      if (error) throw error;
      const rows = (data ?? []) as unknown as TotaisContasPagar[];
      return rows[0] ?? TOTAIS_PAGAR_VAZIO;
    },
    staleTime: STALE_TIMES.financial,
  });
}

export function useTotaisContasReceber(empresaId?: string | null, centroCustoId?: string | null) {
  return useQuery<TotaisContasReceber>({
    queryKey: ['totais-contas-receber', empresaId ?? null, centroCustoId ?? null],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'totais_contas_receber' as never,
        {
          p_empresa_id: empresaId ?? null,
          p_centro_custo_id: centroCustoId ?? null,
        } as never
      );
      if (error) throw error;
      const rows = (data ?? []) as unknown as TotaisContasReceber[];
      return rows[0] ?? TOTAIS_RECEBER_VAZIO;
    },
    staleTime: STALE_TIMES.financial,
  });
}
