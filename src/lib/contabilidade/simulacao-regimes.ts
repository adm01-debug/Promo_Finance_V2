import { obterLinhaCronograma } from '@/lib/reforma-tributaria/cronograma-oficial';
import { simularComparativo } from '@/lib/reforma-tributaria/simulador';
import type { DadosSimulacao, ResultadoSimulacao } from '@/lib/reforma-tributaria/types';
import { ANEXOS } from '@/lib/tributario/motor/base';
import { simularSimples } from '@/lib/tributario/motor/simples';
import type { AnexoSimples } from '@/lib/tributario/calculadora/types';
import { REGIMES_ESPECIAIS, type RegimeEspecial } from '@/types/reforma-tributaria';

const arredondar = (v: number) => Math.round((Number.isFinite(v) ? v : 0) * 100) / 100;

/** Faturamento, compras e folha reais apurados no próprio sistema (últimos 12 meses). */
export interface FontesContabeis {
  faturamento12m: number;
  comprasServicos12m: number;
  /** Folha + encargos do período — alimenta o Fator R do Simples Nacional. */
  folha12m: number;
  /** Salários + pró-labore do período — base da CPP patronal recolhida fora do DAS no Anexo IV. */
  remuneracao12m: number;
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
  /**
   * A atividade está sujeita ao Fator R (LC 123/2006 art. 18 §5º-A)? Quando
   * `false` (atividades do §5º-I, como contabilidade), o anexo informado é
   * respeitado mesmo com folha abaixo de 28%, sem migrar para o Anexo V.
   */
  sujeitoFatorR: boolean;
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
  sujeitoFatorR: true,
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

/**
 * Parcela de ICMS/ISS que a 6ª faixa do Simples ainda reserva ao DAS: 0% nos Anexos
 * I, II, III e V e 42,10% de ISS no Anexo IV (LC 123/2006, Anexos I a V). Nas faixas
 * anteriores essa parcela existe e é deduzida pelo motor.
 */
const PARCELA_ESTADUAL_MUNICIPAL_6A_FAIXA: Record<AnexoSimples, number> = {
  I: 0,
  II: 0,
  III: 0,
  IV: 0.421,
  V: 0,
};

/** Alíquota efetiva do anexo para a RBT12 informada: [(RBT12 × nominal) − PD] / RBT12. */
function aliquotaEfetiva(anexo: AnexoSimples, rbt12: number): number {
  const faixas = ANEXOS[anexo];
  const faixa = faixas.find((f) => rbt12 <= f.ate) ?? faixas[faixas.length - 1];
  return rbt12 > 0 ? Math.max(0, (rbt12 * faixa.aliq - faixa.pd) / rbt12) : faixa.aliq;
}

/**
 * Carga atual pelo Simples Nacional.
 *
 * Usa o motor (`simularSimples`) porque o DAS isolado não é a carga inteira: no
 * Anexo IV a CPP patronal é recolhida **fora** do DAS (20% + RAT sobre a folha)
 * e, acima do sublimite estadual, ICMS/ISS saem do DAS.
 *
 * Receita mista (vendas + serviços) é segregada por anexo (LC 123/2006 art. 21,
 * §4º-A): cada parcela é tributada pelo anexo da sua atividade, com a alíquota
 * efetiva calculada sobre a RBT12 total. Acima do sublimite estadual a segregação
 * deixa de valer para o DAS — ele passa a ser um único anexo (o do regime da
 * receita mista) aplicado sobre a receita total, na 6ª faixa federal, e apenas
 * ICMS e ISS são apurados por fora, cada um sobre a sua parcela de receita.
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
  // CPP patronal incide sobre a remuneração paga (salários + pró-labore), não sobre
  // os encargos lançados na folha; sem detalhamento cai na folha total.
  const remuneracao = fontes.remuneracao12m > 0 ? fontes.remuneracao12m : fontes.folha12m;
  const avisosFatorR: string[] = [];

  // LC 123/2006 art. 18 §5º-J: as atividades de serviços do rol do §5º-I vão para o
  // Anexo III com Fator R de 28% ou mais e para o Anexo V abaixo disso — a escolha
  // manual não sobrepõe o corte (mesma regra da Calculadora do Simples). Atividade
  // fora daquele rol não passa pelo teste e fica no Anexo III, e o Anexo IV nunca é
  // alcançado por esse corte.
  const anexoServicos: AnexoSimples =
    premissas.anexoSimples === 'IV'
      ? 'IV'
      : premissas.sujeitoFatorR && fatorR < FATOR_R_CORTE
        ? 'V'
        : 'III';
  const anexoMercadorias: AnexoSimples = premissas.anexoSimples === 'II' ? 'II' : 'I';
  if (
    premissas.sujeitoFatorR &&
    (premissas.anexoSimples === 'III' || premissas.anexoSimples === 'V') &&
    premissas.anexoSimples !== anexoServicos
  ) {
    avisosFatorR.push(
      `Anexo ${premissas.anexoSimples} substituído pelo Anexo ${anexoServicos}: Fator R de ${(fatorR * 100).toFixed(2)}% contra o corte de 28% (LC 123/2006 art. 18 §5º-J).`
    );
  }
  if (
    !premissas.sujeitoFatorR &&
    percentualServicos > 0 &&
    anexoServicos !== premissas.anexoSimples
  ) {
    avisosFatorR.push(
      `Atividade fora do rol do art. 18 §5º-I: serviços tributados pelo Anexo ${anexoServicos}, sem o teste de 28% do Fator R (LC 123/2006 art. 18 §5º-J).`
    );
  }
  const anexoEfetivo: AnexoSimples =
    percentualServicos === 100
      ? anexoServicos
      : percentualVendas === 100
        ? anexoMercadorias
        : premissas.anexoSimples;

  const motor = simularSimples(
    {
      faturamentoAnual: rbt12,
      folhaAnual: remuneracao,
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

  const avisos = [...avisosFatorR, ...motor.observacoes];

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
  const receitaServicos = rbt12 * (percentualServicos / 100);
  const receitaMercadorias = rbt12 * (percentualVendas / 100);

  // Acima do sublimite o DAS fica com a 6ª faixa (parcela federal) e ICMS/ISS são
  // apurados no regime normal. Deduzir do DAS a fração de ICMS/ISS das faixas
  // anteriores tiraria um tributo que a tabela da 6ª faixa não contém.
  if (motor.sublimiteExcedido) {
    const na6aFaixa = (motor.faixaAplicavel ?? 0) >= 6;
    const icmsForaDAS = na6aFaixa
      ? arredondar(receitaMercadorias * ALIQ_ICMS_FORA_DAS)
      : arredondar(motor.icmsForaDAS ?? 0);
    const issForaDAS = na6aFaixa
      ? arredondar(receitaServicos * ALIQ_ISS_FORA_DAS)
      : arredondar(motor.issForaDAS ?? 0);
    const das = na6aFaixa
      ? arredondar(
          rbt12 *
            aliquotaEfetiva(anexoEfetivo, rbt12) *
            (1 - PARCELA_ESTADUAL_MUNICIPAL_6A_FAIXA[anexoEfetivo])
        )
      : arredondar(motor.totalTributos - cppForaDAS - icmsForaDAS - issForaDAS);

    if (misto) {
      avisos.push(
        `Receita mista acima do sublimite estadual (${formatarMoeda(SUBLIMITE_ESTADUAL)}): sem segregação por anexo, o DAS é o do Anexo ${anexoEfetivo} sobre a receita total e ICMS + ISS são recolhidos por fora dele.`
      );
    }
    avisos.push(
      `RBT12 acima do sublimite estadual (${formatarMoeda(SUBLIMITE_ESTADUAL)}): ICMS de ${formatarMoeda(icmsForaDAS)} (${(ALIQ_ICMS_FORA_DAS * 100).toFixed(0)}% sobre mercadorias) e ISS de ${formatarMoeda(issForaDAS)} (${(ALIQ_ISS_FORA_DAS * 100).toFixed(0)}% sobre serviços) apurados fora do DAS pelo regime normal (LC 123/2006 arts. 19 e 20).`
    );

    return {
      elegivel: true,
      total: arredondar(das + icmsForaDAS + issForaDAS + cppForaDAS),
      das,
      cppForaDAS,
      icmsForaDAS,
      issForaDAS,
      avisos,
    };
  }

  if (!misto) {
    return {
      elegivel: true,
      total: arredondar(motor.totalTributos),
      das: arredondar(motor.totalTributos - cppForaDAS),
      cppForaDAS,
      icmsForaDAS: 0,
      issForaDAS: 0,
      avisos,
    };
  }

  const aliqServicos = aliquotaEfetiva(anexoServicos, rbt12);
  const aliqMercadorias = aliquotaEfetiva(anexoMercadorias, rbt12);
  const das = arredondar(receitaServicos * aliqServicos + receitaMercadorias * aliqMercadorias);
  const cppServicos =
    anexoServicos === 'IV'
      ? arredondar(remuneracao * (percentualServicos / 100) * (0.2 + RAT_PADRAO))
      : 0;

  avisos.push(
    `Receita mista segregada por anexo (LC 123/2006 art. 21, §4º-A): serviços a ${(aliqServicos * 100).toFixed(2)}% (Anexo ${anexoServicos}) e mercadorias a ${(aliqMercadorias * 100).toFixed(2)}% (Anexo ${anexoMercadorias}), ambas com alíquota efetiva sobre a RBT12 total.`
  );
  if (cppServicos > 0) {
    avisos.push(
      `Anexo IV nos serviços: CPP patronal de ${formatarMoeda(cppServicos)} (20% + RAT ${(RAT_PADRAO * 100).toFixed(2)}% sobre a remuneração dos serviços) recolhida fora do DAS.`
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
      premissas.sujeitoFatorR &&
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

  if (premissas.regimeAtual !== 'Simples Nacional') {
    avisos.push(
      `Carga atual de ${premissas.regimeAtual} estimada pelo modelo não-cumulativo do motor: soma apenas ICMS, ISS, PIS e COFINS do regime — IRPJ/CSLL não entram nesta estimativa, e Lucro Presumido e Lucro Real usam a mesma base, sem apuração por LALUR.`
    );
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
    // Reduções de CBS/IBS por regime especial mudam a alíquota efetiva do cenário.
    // Combustíveis e serviços financeiros não reduzem nada (o regime muda a base),
    // então seguem com 0,9% + 0,1% como no cronograma puro.
    const regimeComReducao =
      premissas.regimeEspecial !== 'nenhum' &&
      (() => {
        const config = REGIMES_ESPECIAIS.find((r) => r.regime === premissas.regimeEspecial);
        return !!config && (config.reducaoAliquotaCBS > 0 || config.reducaoAliquotaIBS > 0);
      })();
    const cenarioPadrao = premissas.cenarioCbs === 'cronograma' && !regimeComReducao;
    avisos.push(
      cenarioPadrao
        ? `Ano-teste (${premissas.anoReferencia}): o valor de ${formatarMoeda(cargaSimuladaBase)} usa as alíquotas legais do ano-teste — CBS 0,9% + IBS 0,1% (LC 214/2025 art. 348) — e é apenas referência, porque a CBS/IBS experimental é compensável/dispensável com PIS/COFINS e tributos federais e não entra na carga simulada.`
        : `Ano-teste (${premissas.anoReferencia}): o valor de ${formatarMoeda(cargaSimuladaBase)} usa a alíquota do cenário CBS aplicado, não as alíquotas legais do ano-teste (CBS 0,9% + IBS 0,1%, LC 214/2025 art. 348). Ele é apenas referência — a CBS/IBS experimental é compensável/dispensável com PIS/COFINS e tributos federais e não entra na carga simulada.`
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
