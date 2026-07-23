import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DadosReaisAgregados {
  receitaBrutaAnual: number;
  folhaAnual: number;
  creditoPisCofinsInsumos: number;
  creditoIcmsCompras: number;
  irrfSofrido: number;
  csrfSofrido: number;
  rbt12: number;
  folha12m: number;
  amostragem: {
    contasReceber: number;
    folhaLinhas: number;
    nfeRecebidas: number;
  };
}

export function useCalculadoraDadosReais(empresaId: string | undefined, enabled = false) {
  return useQuery({
    queryKey: ['calculadora-dados-reais', empresaId],
    enabled: enabled && !!empresaId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<DadosReaisAgregados> => {
      const doze = new Date();
      doze.setMonth(doze.getMonth() - 12);
      const dozeIso = doze.toISOString().slice(0, 10);

      const [receber, folha, nfe] = await Promise.all([
        supabase
          .from('contas_receber')
          .select('valor, valor_recebido, data_emissao, status')
          .eq('empresa_id', empresaId!)
          .gte('data_emissao', dozeIso),
        supabase
          .from('folha_pagamento')
          .select('total_folha, valor_total, salarios, encargos, mes_referencia')
          .eq('empresa_id', empresaId!)
          .gte('mes_referencia', dozeIso),
        supabase
          .from('nfe_recebidas')
          .select('valor_total, data_emissao')
          .eq('empresa_id', empresaId!)
          .gte('data_emissao', dozeIso),
      ]);

      const receitaBrutaAnual = (receber.data ?? []).reduce(
        (s, r) => s + Number(r.valor_recebido ?? r.valor ?? 0),
        0,
      );

      const folhaAnual = (folha.data ?? []).reduce(
        (s, f) => s + Number(f.total_folha ?? f.valor_total ?? ((f.salarios ?? 0) + (f.encargos ?? 0))),
        0,
      );

      // NF-e recebidas = base para créditos PIS/COFINS (insumos) e crédito ICMS
      const baseCompras = (nfe.data ?? []).reduce((s, n) => s + Number(n.valor_total ?? 0), 0);
      const creditoPisCofinsInsumos = baseCompras;
      // Estimativa conservadora de crédito ICMS 18% sobre compras
      const creditoIcmsCompras = baseCompras * 0.18;

      return {
        receitaBrutaAnual,
        folhaAnual,
        creditoPisCofinsInsumos,
        creditoIcmsCompras,
        irrfSofrido: 0,
        csrfSofrido: 0,
        rbt12: receitaBrutaAnual,
        folha12m: folhaAnual,
        amostragem: {
          contasReceber: receber.data?.length ?? 0,
          folhaLinhas: folha.data?.length ?? 0,
          nfeRecebidas: nfe.data?.length ?? 0,
        },
      };
    },
  });
}
