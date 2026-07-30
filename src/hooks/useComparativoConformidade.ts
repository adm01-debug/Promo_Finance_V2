/**
 * Etapa O — Leitura dos snapshots de conformidade de várias empresas.
 *
 * Uma única consulta (`in`) traz o histórico do grupo inteiro; o agrupamento e
 * o ranking são feitos pelo motor puro `compararConformidade`, mantendo a regra
 * de negócio fora da camada de dados.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  compararConformidade,
  type ResultadoComparativo,
  type SerieEmpresa,
} from '@/lib/tributario/obrigacoes';
import type { PontoHistorico } from '@/lib/tributario/obrigacoes';

interface LinhaSnapshot {
  empresa_id: string;
  competencia: string;
  score: number;
  nivel: PontoHistorico['nivel'];
  total_obrigacoes: number;
  entregues: number;
  vencidas_pendentes: number;
  entregues_com_atraso: number;
  pontualidade: number;
  multa_registrada: number;
}

const COLUNAS =
  'empresa_id,competencia,score,nivel,total_obrigacoes,entregues,vencidas_pendentes,entregues_com_atraso,pontualidade,multa_registrada';

/** Identificação mínima de uma empresa para o comparativo. */
export interface EmpresaComparavel {
  readonly id: string;
  readonly nome: string;
}

/**
 * Carrega os snapshots das empresas informadas e devolve o comparativo pronto.
 *
 * @param empresas empresas que o usuário pode ver (a RLS ainda filtra no banco)
 * @param competenciaReferencia corte opcional `AAAA-MM`
 * @param limitePorEmpresa nº máximo de competências consideradas por empresa
 */
export function useComparativoConformidade(
  empresas: readonly EmpresaComparavel[],
  competenciaReferencia?: string,
  limitePorEmpresa = 12
) {
  const ids = useMemo(
    () => [...new Set(empresas.map((e) => e.id))].sort(),
    [empresas]
  );

  const query = useQuery({
    queryKey: ['conformidade-comparativo', ids, limitePorEmpresa],
    enabled: ids.length > 0,
    staleTime: 30_000,
    queryFn: async (): Promise<readonly LinhaSnapshot[]> => {
      const { data, error } = await supabase
        .from('conformidade_snapshots')
        .select(COLUNAS)
        .in('empresa_id', ids)
        .order('competencia', { ascending: false })
        .limit(ids.length * limitePorEmpresa);

      if (error) throw error;
      return (data ?? []) as unknown as LinhaSnapshot[];
    },
  });

  /** Séries alinhadas por empresa — reutilizadas pelo gráfico temporal. */
  const series: SerieEmpresa[] = useMemo(() => {
    const porEmpresa = new Map<string, PontoHistorico[]>();
    for (const empresa of empresas) porEmpresa.set(empresa.id, []);

    for (const linha of query.data ?? []) {
      const lista = porEmpresa.get(linha.empresa_id);
      if (!lista) continue;
      // Respeita o limite por empresa mesmo com volumes desiguais entre elas.
      if (lista.length >= limitePorEmpresa) continue;
      lista.push({
        competencia: linha.competencia,
        score: Number(linha.score),
        nivel: linha.nivel,
        total: linha.total_obrigacoes,
        entregues: linha.entregues,
        vencidasPendentes: linha.vencidas_pendentes,
        entreguesComAtraso: linha.entregues_com_atraso,
        pontualidade: Number(linha.pontualidade),
        multaRegistrada: Number(linha.multa_registrada),
      });
    }

    return empresas.map((empresa) => ({
      empresaId: empresa.id,
      nome: empresa.nome,
      pontos: porEmpresa.get(empresa.id) ?? [],
    }));
  }, [empresas, query.data, limitePorEmpresa]);

  const comparativo: ResultadoComparativo = useMemo(
    () => compararConformidade(series, competenciaReferencia),
    [series, competenciaReferencia],
  );

  return {
    comparativo,
    series,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
