import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import {
  calcularIndices,
  type AgregadosContabeis,
  type Indicador,
} from '@/lib/contabil/indices';

const numero = z.coerce.number().finite().catch(0);

const agregadosSchema = z.object({
  ativo_total: numero,
  ativo_circulante: numero,
  ativo_nao_circulante: numero,
  realizavel_lp: numero,
  imobilizado: numero,
  disponibilidades: numero,
  clientes: numero,
  estoques: numero,
  passivo_circulante: numero,
  passivo_nao_circulante: numero,
  fornecedores: numero,
  patrimonio_liquido: numero,
  receita_bruta: numero,
  deducoes_receita: numero,
  receita_liquida: numero,
  cmv: numero,
  lucro_liquido: numero,
  dias_periodo: z.coerce.number().int().positive().catch(1),
});

export function normalizarAgregados(raw: unknown): AgregadosContabeis {
  const linha = Array.isArray(raw) ? raw[0] : raw;
  const parsed = agregadosSchema.safeParse(linha ?? {});
  const d = parsed.success ? parsed.data : agregadosSchema.parse({});
  return {
    ativoTotal: d.ativo_total,
    ativoCirculante: d.ativo_circulante,
    ativoNaoCirculante: d.ativo_nao_circulante,
    realizavelLp: d.realizavel_lp,
    imobilizado: d.imobilizado,
    disponibilidades: d.disponibilidades,
    clientes: d.clientes,
    estoques: d.estoques,
    passivoCirculante: d.passivo_circulante,
    passivoNaoCirculante: d.passivo_nao_circulante,
    fornecedores: d.fornecedores,
    patrimonioLiquido: d.patrimonio_liquido,
    receitaBruta: d.receita_bruta,
    deducoesReceita: d.deducoes_receita,
    receitaLiquida: d.receita_liquida,
    cmv: d.cmv,
    lucroLiquido: d.lucro_liquido,
    diasPeriodo: d.dias_periodo,
  };
}

export interface UseIndicesParams {
  empresaId?: string;
  dataInicio: string;
  dataFim: string;
  /** Quando true, busca também o período imediatamente anterior de mesma duração. */
  compararAnterior?: boolean;
}

export interface IndicesResultado {
  agregados: AgregadosContabeis;
  indices: Indicador[];
  anteriores: Indicador[] | null;
}

/** Período anterior de mesma duração, imediatamente antes de `dataInicio`. */
export function periodoAnterior(dataInicio: string, dataFim: string) {
  const ini = new Date(`${dataInicio}T00:00:00Z`);
  const fim = new Date(`${dataFim}T00:00:00Z`);
  if (Number.isNaN(ini.getTime()) || Number.isNaN(fim.getTime())) return null;
  const dias = Math.max(Math.round((fim.getTime() - ini.getTime()) / 86_400_000) + 1, 1);
  const novoFim = new Date(ini.getTime() - 86_400_000);
  const novoIni = new Date(novoFim.getTime() - (dias - 1) * 86_400_000);
  return {
    dataInicio: novoIni.toISOString().slice(0, 10),
    dataFim: novoFim.toISOString().slice(0, 10),
  };
}

async function buscarAgregados(empresaId: string, dataInicio: string, dataFim: string) {
  const { data, error } = await supabase.rpc('fn_indices_contabeis', {
    p_empresa_id: empresaId,
    p_data_inicio: dataInicio,
    p_data_fim: dataFim,
  });
  if (error) throw new Error(error.message);
  return normalizarAgregados(data);
}

/**
 * Índices econômico-financeiros do período. A agregação por grupo é feita no
 * Postgres; o cliente apenas divide os agregados (`calcularIndices`).
 */
export function useIndicesContabeis({
  empresaId,
  dataInicio,
  dataFim,
  compararAnterior = true,
}: UseIndicesParams) {
  return useQuery<IndicesResultado>({
    queryKey: ['indices-contabeis', empresaId, dataInicio, dataFim, compararAnterior],
    enabled: Boolean(empresaId && dataInicio && dataFim),
    staleTime: 60_000,
    queryFn: async () => {
      const agregados = await buscarAgregados(empresaId as string, dataInicio, dataFim);
      let anteriores: Indicador[] | null = null;

      if (compararAnterior) {
        const anterior = periodoAnterior(dataInicio, dataFim);
        if (anterior) {
          try {
            const aggAnt = await buscarAgregados(
              empresaId as string,
              anterior.dataInicio,
              anterior.dataFim,
            );
            anteriores = calcularIndices(aggAnt);
          } catch {
            // Comparativo é opcional: falha aqui não invalida o período corrente.
            anteriores = null;
          }
        }
      }

      return { agregados, indices: calcularIndices(agregados), anteriores };
    },
  });
}

export interface PontoSerie {
  competencia: string;
  label: string;
  indices: Indicador[];
}

/** Divide o intervalo em meses (máx. 24) para a série histórica. */
export function mesesDoIntervalo(dataInicio: string, dataFim: string) {
  const ini = new Date(`${dataInicio}T00:00:00Z`);
  const fim = new Date(`${dataFim}T00:00:00Z`);
  if (Number.isNaN(ini.getTime()) || Number.isNaN(fim.getTime()) || ini > fim) return [];
  const out: { inicio: string; fim: string; competencia: string }[] = [];
  const cursor = new Date(Date.UTC(ini.getUTCFullYear(), ini.getUTCMonth(), 1));
  while (cursor <= fim && out.length < 24) {
    const primeiro = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1));
    const ultimo = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0));
    out.push({
      inicio: primeiro.toISOString().slice(0, 10),
      fim: ultimo.toISOString().slice(0, 10),
      competencia: primeiro.toISOString().slice(0, 7),
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return out;
}

/** Série mensal dos índices dentro do intervalo selecionado. */
export function useSerieIndices({ empresaId, dataInicio, dataFim }: UseIndicesParams) {
  return useQuery<PontoSerie[]>({
    queryKey: ['indices-contabeis-serie', empresaId, dataInicio, dataFim],
    enabled: Boolean(empresaId && dataInicio && dataFim),
    staleTime: 60_000,
    queryFn: async () => {
      const meses = mesesDoIntervalo(dataInicio, dataFim);
      const pontos = await Promise.all(
        meses.map(async (m) => {
          const agg = await buscarAgregados(empresaId as string, m.inicio, m.fim);
          const [ano, mes] = m.competencia.split('-');
          return {
            competencia: m.competencia,
            label: `${mes}/${ano.slice(2)}`,
            indices: calcularIndices(agg),
          };
        }),
      );
      return pontos;
    },
  });
}
