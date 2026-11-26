import { obterLinhaCronograma } from '@/lib/reforma-tributaria/cronograma-oficial';
import { simularComparativo } from '@/lib/reforma-tributaria/simulador';
import type { DadosSimulacao, ResultadoSimulacao } from '@/lib/reforma-tributaria/types';
import { calcularSimplesNacional } from '@/lib/tributario/calculadora/simples-nacional';
import type { AnexoSimples, ResultadoRegime } from '@/lib/tributario/calculadora/types';
import type { RegimeEspecial } from '@/types/reforma-tributaria';

/** Faturamento, compras e folha reais apurados no próprio sistema (últimos 12 meses). */
export interface FontesContabeis {
  faturamento12m: number;
  comprasServicos12m: number;
  /** Folha + encargos do período — alimenta o Fator R do Simples Nacional. */
  folha12m: number;
  notasConsideradas: number;
  titulosConsiderados: number;
  fonteFaturamento: 'notas_fiscais' | 'contas_receber' | 'sem_dados';
  janelaInicio: string;
  /** `true` quando a leitura parou na trava de segurança e os totais estão parciais. */
  truncado: boolean;
}

export type CenarioCbs = 'cronograma' | 'tcu' | 'livre';

/** Premissas que o usuário controla no diálogo e que ficam gravadas em `premissas`. */
export interface PremissasCenario {
  nome: string;
  anoReferencia: number;
  regimeAtual: string;
  /** Anexo do Simples Nacional usado para a carga atual quando o regime é o Simples. */
  anexoSimples: AnexoSimples;
  percentualVendas: number;
  cenarioCbs: CenarioCbs;
  aliquotaCbsOverride: number | null;
  regimeEspecial: RegimeEspecial | 'nenhum';
}

/** Parcela de ICMS/ISS/PIS/COFINS ainda devida no ano de transição. */
export interface ResiduaisTransicao {
  icms: number;
  iss: number;
  pis: number;
  cofins: number;
  total: number;
}

export interface CenarioCalculado {
  resultado: ResultadoSimulacao;
  dados: DadosSimulacao;
  cargaAtual: number;
  /** CBS/IBS/IS do ano, sem os resíduos do sistema antigo. */
  cargaSimuladaBase: number;
  cargaSimulada: number;
  economiaEstimada: number;
  residuais: ResiduaisTransicao;
  aliquotaAtualPercentual: number;
  aliquotaSimuladaPercentual: number;
  /** Ressalvas do cálculo mostradas na UI (Fator R, resíduos, limite do Simples). */
  avisos: string[];
}

export const REGIMES_ATUAIS = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real'] as const;

export const PREMISSAS_PADRAO: PremissasCenario = {
  nome: '',
  anoReferencia: new Date().getFullYear(),
  regimeAtual: 'Simples Nacional',
  anexoSimples: 'I',
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
 * Carga atual pelo Simples Nacional (DAS). O motor antigo de `simularComparativo`
 * só modela ICMS/ISS/PIS/COFINS do regime não-cumulativo — usá-lo para quem é
 * Simples dava a mesma carga para os três regimes do seletor.
 */
export function calcularCargaSimples(
  fontes: FontesContabeis,
  premissas: PremissasCenario
): ResultadoRegime {
  const percentualVendas = Math.min(100, Math.max(0, premissas.percentualVendas));
  return calcularSimplesNacional({
    receitas: {
      receitaBrutaAnual: fontes.faturamento12m,
      percentualServicos: 100 - percentualVendas,
    },
    anexo: premissas.anexoSimples,
    rbt12: fontes.faturamento12m,
    folha12m: fontes.folha12m,
    anoReferencia: premissas.anoReferencia,
  });
}

/**
 * Roda o motor oficial de comparação (sistema antigo x CBS/IBS) sobre os dados
 * reais apurados.
 *
 * - `cargaAtual` respeita o regime escolhido: Simples Nacional usa o DAS do
 *   ano (Fator R sobre a folha apurada); Presumido/Real usam o modelo
 *   não-cumulativo do motor.
 * - `cargaSimulada` soma à CBS/IBS/IS a parcela de ICMS/ISS/PIS/COFINS que
 *   continua devida no ano (`obterLinhaCronograma`) — sem isso 2027/2028
 *   apareciam com economia que não existe.
 * - `economia_estimada` é positiva quando o cenário novo custa menos.
 */
export function calcularCenario(
  fontes: FontesContabeis,
  premissas: PremissasCenario
): CenarioCalculado {
  const dados = montarDadosSimulacao(fontes, premissas);
  const resultado = simularComparativo(dados, premissas.anoReferencia);
  const avisos: string[] = [];

  const simples =
    premissas.regimeAtual === 'Simples Nacional' ? calcularCargaSimples(fontes, premissas) : null;
  let cargaAtual: number;
  if (simples && simples.elegivel) {
    cargaAtual = arredondar(simples.totalAPagar);
    avisos.push(...simples.alertas);
    if (
      fontes.folha12m <= 0 &&
      (premissas.anexoSimples === 'III' || premissas.anexoSimples === 'V')
    ) {
      avisos.push(
        'Folha não apurada no período: Fator R tratado como abaixo de 28% (Anexo V) pelo motor do Simples.'
      );
    }
  } else {
    if (simples) {
      avisos.push(
        'Receita acima do limite do Simples Nacional — carga atual estimada pelo modelo não-cumulativo (Presumido/Real).'
      );
    }
    cargaAtual = arredondar(resultado.totalAntigo);
  }

  const linha = obterLinhaCronograma(premissas.anoReferencia);
  const residuais: ResiduaisTransicao = {
    icms: arredondar(resultado.icmsAntigo * (linha.icmsResidual / 100)),
    iss: arredondar(resultado.issAntigo * (linha.issResidual / 100)),
    pis: arredondar(resultado.pisAntigo * (linha.pisResidual / 100)),
    cofins: arredondar(resultado.cofinsAntigo * (linha.cofinsResidual / 100)),
    total: 0,
  };
  residuais.total = arredondar(residuais.icms + residuais.iss + residuais.pis + residuais.cofins);

  const cargaSimuladaBase = arredondar(resultado.totalNovo);
  const cargaSimulada = arredondar(cargaSimuladaBase + residuais.total);
  if (residuais.total > 0) {
    avisos.push(
      `Ano de transição (${premissas.anoReferencia}): somados ICMS/ISS a ${linha.icmsResidual}% e PIS/COFINS a ${linha.pisResidual}% do sistema antigo, que continuam devidos em paralelo.`
    );
  }
  if (fontes.truncado) {
    avisos.push(
      'Leitura limitada a 100 mil lançamentos — os totais do período podem estar parciais.'
    );
  }

  const base = fontes.faturamento12m > 0 ? fontes.faturamento12m : 0;
  return {
    resultado,
    dados,
    cargaAtual,
    cargaSimuladaBase,
    cargaSimulada,
    economiaEstimada: arredondar(cargaAtual - cargaSimulada),
    residuais,
    aliquotaAtualPercentual: base > 0 ? arredondar((cargaAtual / base) * 100) : 0,
    aliquotaSimuladaPercentual: base > 0 ? arredondar((cargaSimulada / base) * 100) : 0,
    avisos,
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

/** Lê o ano gravado em `premissas.ano_referencia` (usado quando a coluna não vem do banco). */
export function anoDoCenario(premissas: unknown): number | null {
  if (premissas && typeof premissas === 'object' && 'ano_referencia' in premissas) {
    const ano = Number((premissas as { ano_referencia?: unknown }).ano_referencia);
    if (Number.isFinite(ano) && ano > 0) return ano;
  }
  return null;
}

export function formatarMoeda(valor: number | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(valor ?? 0)
  );
}
