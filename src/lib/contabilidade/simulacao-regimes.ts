import { obterLinhaCronograma } from '@/lib/reforma-tributaria/cronograma-oficial';
import { simularComparativo } from '@/lib/reforma-tributaria/simulador';
import type { DadosSimulacao, ResultadoSimulacao } from '@/lib/reforma-tributaria/types';
import { ANEXOS } from '@/lib/tributario/motor/base';
import { simularSimples } from '@/lib/tributario/motor/simples';
import type { AnexoSimples } from '@/lib/tributario/calculadora/types';
import type { RegimeEspecial } from '@/types/reforma-tributaria';

const arredondar = (v: number) => Math.round((Number.isFinite(v) ? v : 0) * 100) / 100;

/** Faturamento, compras e folha reais apurados no próprio sistema (últimos 12 meses). */
export interface FontesContabeis {
  faturamento12m: number;
  comprasServicos12m: number;
  /** Folha + encargos do período — alimenta o Fator R do Simples Nacional. */
  folha12m: number;
  notasConsideradas: number;
  titulosConsiderados: number;
  fonteFaturamento: 'notas_fiscais' | 'contas_receber' | 'sem_dados';
  /** De onde veio a folha: `folha_pagamento` (Histórico Financeiro) tem precedência sobre os títulos de `contas_pagar`. */
  fonteFolha: 'folha_pagamento' | 'contas_pagar' | 'sem_dados';
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
  /** Carga efetivamente devida no ano: CBS/IBS (quando já vigentes) + resíduos do sistema antigo. Em ano-teste a CBS/IBS não soma. */
  cargaSimulada: number;
  economiaEstimada: number;
  residuais: ResiduaisTransicao;
  /** `true` quando o ano é de teste (2026): CBS/IBS experimentais não somam na carga. */
  anoTeste: boolean;
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

export interface CargaSimples {
  elegivel: boolean;
  /** DAS + parcelas recolhidas fora dele (CPP do Anexo IV, ICMS/ISS acima do sublimite). */
  total: number;
  das: number;
  cppForaDAS: number;
  icmsForaDAS: number;
  issForaDAS: number;
  avisos: string[];
}

/** Limite anual e sublimite estadual do Simples Nacional (LC 123/2006, arts. 19 e 20). */
const SUBLIMITE_ESTADUAL = 3_600_000;
const FATOR_R_CORTE = 0.28;
const RAT_PADRAO = 0.02;
const ALIQ_ICMS_FORA_DAS = 0.18;
const ALIQ_ISS_FORA_DAS = 0.05;

/** Alíquota efetiva do anexo para a RBT12 informada: [(RBT12 × nominal) − PD] / RBT12. */
function aliquotaEfetiva(anexo: AnexoSimples, rbt12: number): number {
  const faixas = ANEXOS[anexo];
  const faixa = faixas.find((f) => rbt12 <= f.ate) ?? faixas[faixas.length - 1];
  return rbt12 > 0 ? Math.max(0, (rbt12 * faixa.aliq - faixa.pd) / rbt12) : faixa.aliq;
}

const ANEXOS_SERVICO: AnexoSimples[] = ['III', 'IV', 'V'];

/**
 * Carga atual pelo Simples Nacional.
 *
 * Usa o motor (`simularSimples`) porque o DAS isolado não é a carga inteira: no
 * Anexo IV a CPP patronal é recolhida **fora** do DAS (20% + RAT sobre a folha)
 * e, acima do sublimite estadual, ICMS/ISS saem do DAS.
 *
 * Receita mista (vendas + serviços) é segregada por anexo (LC 123/2006 art. 21,
 * §4º-A): cada parcela é tributada pelo anexo da sua atividade, com a alíquota
 * efetiva calculada sobre a RBT12 total. Acima do sublimite a segregação não é
 * aplicada — o motor reproporcionaliza o DAS e recolhe ICMS/ISS por fora.
 */
export function calcularCargaSimples(
  fontes: FontesContabeis,
  premissas: PremissasCenario
): CargaSimples {
  const percentualVendas = Math.min(100, Math.max(0, premissas.percentualVendas));
  const percentualServicos = 100 - percentualVendas;
  const rbt12 = fontes.faturamento12m;
  const fatorR = rbt12 > 0 ? fontes.folha12m / rbt12 : 0;
  const misto = percentualServicos > 0 && percentualVendas > 0;

  // Serviços: anexo escolhido quando é de serviço, senão deriva do Fator R
  // (LC 123/2006 art. 18 §5º-§5º-L). Mercadorias: Anexo II se escolhido, senão I.
  const anexoServicos: AnexoSimples = ANEXOS_SERVICO.includes(premissas.anexoSimples)
    ? premissas.anexoSimples
    : fatorR >= FATOR_R_CORTE
      ? 'III'
      : 'V';
  const anexoMercadorias: AnexoSimples = premissas.anexoSimples === 'II' ? 'II' : 'I';
  const anexoEfetivo: AnexoSimples =
    percentualServicos === 100
      ? anexoServicos
      : percentualVendas === 100
        ? anexoMercadorias
        : premissas.anexoSimples;

  const motor = simularSimples(
    {
      faturamentoAnual: rbt12,
      folhaAnual: fontes.folha12m,
      margemLucro: 0,
      percentualServicos,
      sublimiteEstadual: SUBLIMITE_ESTADUAL,
      aliquotaICMS: ALIQ_ICMS_FORA_DAS,
      aliquotaISS: ALIQ_ISS_FORA_DAS,
      aliquotaRAT: RAT_PADRAO,
    },
    premissas.anoReferencia,
    12,
    anexoEfetivo
  );

  const avisos = [...motor.observacoes];
  if (misto && motor.sublimiteExcedido) {
    avisos.push(
      `Receita mista acima do sublimite estadual (R$ ${SUBLIMITE_ESTADUAL.toLocaleString('pt-BR')}): não há segregação por anexo — o DAS foi calculado com o Anexo ${anexoEfetivo} sobre a receita total e o ICMS/ISS recolhidos por fora dele.`
    );
  }

  if (!motor.elegivel) {
    return {
      elegivel: false,
      total: 0,
      das: 0,
      cppForaDAS: 0,
      icmsForaDAS: 0,
      issForaDAS: 0,
      avisos,
    };
  }

  const cppForaDAS = arredondar(motor.cppForaDAS ?? 0);
  const icmsForaDAS = arredondar(motor.icmsForaDAS ?? 0);
  const issForaDAS = arredondar(motor.issForaDAS ?? 0);

  if (!misto || motor.sublimiteExcedido) {
    return {
      elegivel: true,
      total: arredondar(motor.totalTributos),
      das: arredondar(motor.totalTributos - cppForaDAS - icmsForaDAS - issForaDAS),
      cppForaDAS,
      icmsForaDAS,
      issForaDAS,
      avisos,
    };
  }

  const receitaServicos = rbt12 * (percentualServicos / 100);
  const receitaMercadorias = rbt12 * (percentualVendas / 100);
  const aliqServicos = aliquotaEfetiva(anexoServicos, rbt12);
  const aliqMercadorias = aliquotaEfetiva(anexoMercadorias, rbt12);
  const das = arredondar(receitaServicos * aliqServicos + receitaMercadorias * aliqMercadorias);
  const cppServicos = anexoServicos === 'IV' ? arredondar(fontes.folha12m * (0.2 + RAT_PADRAO)) : 0;

  avisos.push(
    `Receita mista segregada por anexo (LC 123/2006 art. 21, §4º-A): serviços a ${(aliqServicos * 100).toFixed(2)}% (Anexo ${anexoServicos}) e mercadorias a ${(aliqMercadorias * 100).toFixed(2)}% (Anexo ${anexoMercadorias}), ambas com alíquota efetiva sobre a RBT12 total.`
  );
  if (cppServicos > 0) {
    avisos.push(
      `Anexo IV nos serviços: CPP patronal de ${formatarMoeda(cppServicos)} (20% + RAT ${(RAT_PADRAO * 100).toFixed(2)}% sobre a folha) recolhida fora do DAS.`
    );
  }

  return {
    elegivel: true,
    total: arredondar(das + cppServicos),
    das,
    cppForaDAS: cppServicos,
    icmsForaDAS: 0,
    issForaDAS: 0,
    avisos,
  };
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
    cargaAtual = arredondar(simples.total);
    avisos.push(...simples.avisos);
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
  // 2026 é ano-teste (LC 214/2025 art. 348): CBS 0,9% e IBS 0,1% são compensados/
  // dispensados com PIS/COFINS e tributos federais, então não elevam a carga.
  // O valor fica registrado em `cargaSimuladaBase` apenas como referência.
  const cargaSimulada = arredondar((linha.anoTeste ? 0 : cargaSimuladaBase) + residuais.total);
  if (linha.anoTeste) {
    avisos.push(
      `Ano-teste (${premissas.anoReferencia}): CBS ${linha.cbs}% + IBS ${(linha.ibsUf + linha.ibsMun).toFixed(1)}% (${formatarMoeda(cargaSimuladaBase)}) são compensáveis/dispensáveis com PIS/COFINS e tributos federais (LC 214/2025 art. 348) — não entram na carga simulada.`
    );
  }
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
    anoTeste: !!linha.anoTeste,
    aliquotaAtualPercentual: base > 0 ? arredondar((cargaAtual / base) * 100) : 0,
    aliquotaSimuladaPercentual: base > 0 ? arredondar((cargaSimulada / base) * 100) : 0,
    avisos,
  };
}

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
