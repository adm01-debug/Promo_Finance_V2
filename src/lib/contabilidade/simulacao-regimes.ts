import { simularComparativo } from '@/lib/reforma-tributaria/simulador';
import type { DadosSimulacao, ResultadoSimulacao } from '@/lib/reforma-tributaria/types';
import type { RegimeEspecial } from '@/types/reforma-tributaria';

/** Faturamento e compras reais apurados no próprio sistema (últimos 12 meses). */
export interface FontesContabeis {
  faturamento12m: number;
  comprasServicos12m: number;
  notasConsideradas: number;
  titulosConsiderados: number;
  fonteFaturamento: 'notas_fiscais' | 'contas_receber' | 'sem_dados';
  janelaInicio: string;
}

export type CenarioCbs = 'cronograma' | 'tcu' | 'livre';

/** Premissas que o usuário controla no diálogo e que ficam gravadas em `premissas`. */
export interface PremissasCenario {
  nome: string;
  anoReferencia: number;
  regimeAtual: string;
  percentualVendas: number;
  cenarioCbs: CenarioCbs;
  aliquotaCbsOverride: number | null;
  regimeEspecial: RegimeEspecial | 'nenhum';
}

export interface CenarioCalculado {
  resultado: ResultadoSimulacao;
  dados: DadosSimulacao;
  cargaAtual: number;
  cargaSimulada: number;
  economiaEstimada: number;
  aliquotaAtualPercentual: number;
  aliquotaSimuladaPercentual: number;
}

export const PREMISSAS_PADRAO: PremissasCenario = {
  nome: '',
  anoReferencia: new Date().getFullYear(),
  regimeAtual: 'Simples Nacional',
  percentualVendas: 100,
  cenarioCbs: 'cronograma',
  aliquotaCbsOverride: null,
  regimeEspecial: 'nenhum',
};

export function montarDadosSimulacao(
  fontes: FontesContabeis,
  premissas: PremissasCenario
): DadosSimulacao {
  const percentualVendas = Math.min(100, Math.max(0, premissas.percentualVendas));
  return {
    faturamentoAnual: fontes.faturamento12m,
    comprasAnual: fontes.comprasServicos12m,
    servicosTomadosAnual: 0,
    percentualVendas,
    percentualServicos: 100 - percentualVendas,
    regimeEspecial:
      premissas.regimeEspecial && premissas.regimeEspecial !== 'nenhum'
        ? premissas.regimeEspecial
        : undefined,
    cenarioCBS:
      premissas.cenarioCbs === 'cronograma' ? undefined : (premissas.cenarioCbs as 'tcu' | 'livre'),
    aliquotaCBSOverride:
      premissas.cenarioCbs === 'livre' && premissas.aliquotaCbsOverride != null
        ? premissas.aliquotaCbsOverride
        : undefined,
  };
}

/**
 * Roda o motor oficial de comparação (sistema antigo x CBS/IBS) sobre os dados
 * reais apurados. `economia_estimada` é positiva quando o cenário novo custa
 * menos que o regime atual.
 */
export function calcularCenario(
  fontes: FontesContabeis,
  premissas: PremissasCenario
): CenarioCalculado {
  const dados = montarDadosSimulacao(fontes, premissas);
  const resultado = simularComparativo(dados, premissas.anoReferencia);
  const cargaAtual = arredondar(resultado.totalAntigo);
  const cargaSimulada = arredondar(resultado.totalNovo);
  return {
    resultado,
    dados,
    cargaAtual,
    cargaSimulada,
    economiaEstimada: arredondar(cargaAtual - cargaSimulada),
    aliquotaAtualPercentual: arredondar(resultado.cargaAntigaPercentual),
    aliquotaSimuladaPercentual: arredondar(resultado.cargaNovaPercentual),
  };
}

const arredondar = (v: number) => Math.round((Number.isFinite(v) ? v : 0) * 100) / 100;

export function podeCalcular(fontes: FontesContabeis | undefined | null): boolean {
  return !!fontes && fontes.faturamento12m > 0;
}

export interface ResumoCenario {
  nome: string;
  economia: number;
  impacto: 'economia' | 'aumento' | 'neutro';
}

/** Lê `premissas.nome` gravado pelo diálogo; devolve rótulo de fallback quando ausente. */
export function nomeDoCenario(premissas: unknown): string {
  if (premissas && typeof premissas === 'object' && 'nome' in premissas) {
    const nome = (premissas as { nome?: unknown }).nome;
    if (typeof nome === 'string' && nome.trim()) return nome.trim();
  }
  return 'Cenário sem nome';
}

export function formatarMoeda(valor: number | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(valor ?? 0)
  );
}
