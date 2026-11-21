// PROJEÇÃO REFORMA TRIBUTÁRIA 2026-2033
// Cronograma de transição CBS + IBS + redução PIS/COFINS/ICMS/ISS

import { CRONOGRAMA_OFICIAL } from '@/lib/reforma-tributaria/cronograma-oficial';

export interface AliquotaTransicao {
  ano: number;
  /** % CBS aplicada nas vendas */
  cbs: number;
  /** % IBS aplicada nas vendas */
  ibs: number;
  /** % residual PIS+COFINS (substituídos pelo CBS) */
  pisCofinsResidual: number;
  /** % residual ICMS (substituído pelo IBS) */
  icmsResidual: number;
  /** % residual ISS (substituído pelo IBS) */
  issResidual: number;
  fase: string;
}

const FASE_POR_ANO: Record<number, string> = {
  2026: 'Teste — alíquotas simbólicas',
  2027: 'CBS plena, IBS simbólica',
  2028: 'CBS plena, IBS simbólica',
  2029: 'IBS começa transição (10%)',
  2030: 'IBS 20% / ICMS-ISS 80%',
  2031: 'IBS 30% / ICMS-ISS 70%',
  2032: 'IBS 40% / ICMS-ISS 60%',
  2033: 'Sistema novo pleno',
};

/**
 * Derivado de `CRONOGRAMA_OFICIAL` (fonte única — etapa 7 do plano de
 * conformidade RT). Não adicione valores aqui: edite
 * `src/lib/reforma-tributaria/cronograma-oficial.ts`.
 * Os percentuais residuais representam a fração ainda devida do tributo antigo.
 */
export const CRONOGRAMA_REFORMA: AliquotaTransicao[] = CRONOGRAMA_OFICIAL.map((linha) => ({
  ano: linha.ano,
  cbs: linha.cbs,
  ibs: linha.ibsUf + linha.ibsMun,
  pisCofinsResidual: linha.pisResidual,
  icmsResidual: linha.icmsResidual,
  issResidual: linha.issResidual,
  fase: FASE_POR_ANO[linha.ano] ?? 'Transição',
}));

export interface ParametrosProjecao {
  faturamentoAnual: number;
  /** % do faturamento sobre serviços (sujeito a ISS na fase atual) */
  percentualServicos: number;
  /** % do faturamento sobre comércio/indústria (sujeito a ICMS) */
  percentualComercio?: number;
  /** Alíquota efetiva atual de PIS+COFINS (default 9,25% Lucro Real / 3,65% Presumido) */
  pisCofinsAtual?: number;
  /** Alíquota efetiva atual de ICMS (média ponderada UF) */
  icmsAtual?: number;
  /** Alíquota efetiva atual de ISS */
  issAtual?: number;
  /** Setor para ajuste (padrão: geral) */
  setor?: 'geral' | 'servicos' | 'comercio' | 'industria' | 'saude' | 'educacao' | 'agro';
}

export interface ProjecaoAno {
  ano: number;
  fase: string;
  faturamento: number;
  cbs: number;
  ibs: number;
  pisCofins: number;
  icms: number;
  iss: number;
  totalTributos: number;
  cargaEfetiva: number; // %
  variacaoVsAtual: number; // % (+ aumento, - economia)
}

/**
 * Aplica redutor setorial (cesta básica, saúde, educação, agro têm redução de 60% — EC 132).
 */
function redutorSetorial(setor: ParametrosProjecao['setor']): number {
  switch (setor) {
    case 'saude':
    case 'educacao':
    case 'agro':
      return 0.4; // 60% de redução
    default:
      return 1;
  }
}

/**
 * Projeta a carga tributária ano a ano durante a transição da Reforma Tributária (2026-2033).
 *
 * **Base legal:** EC 132/2023 + LC 214/2025.
 *
 * @param params - Faturamento, mix de receita, alíquotas atuais e setor.
 * @returns `cargaAtual` (% pré-reforma), `projecoes` por ano, `economiaAcumulada` e `picoTributario`.
 *
 * @example
 * ```ts
 * const r = projetarReforma({
 *   faturamentoAnual: 1_000_000,
 *   percentualServicos: 100,
 *   pisCofinsAtual: 9.25,
 *   issAtual: 5,
 * });
 * console.log(r.projecoes.find(p => p.ano === 2033));
 * ```
 */
export function projetarReforma(params: ParametrosProjecao): {
  cargaAtual: number;
  projecoes: ProjecaoAno[];
  economiaAcumulada: number;
  picoTributario: ProjecaoAno;
} {
  const faturamento = Math.max(0, Number(params.faturamentoAnual) || 0);
  const pctServ = (Number(params.percentualServicos) || 0) / 100;
  const pctCom =
    (Number(
      params.percentualComercio ?? Math.max(0, 100 - (Number(params.percentualServicos) || 0))
    ) || 0) / 100;
  const pisCofinsAtual = (Number(params.pisCofinsAtual) || 0) / 100;
  const icmsAtual = (Number(params.icmsAtual) || 0) / 100;
  const issAtual = (Number(params.issAtual) || 0) / 100;
  const redutor = redutorSetorial(params.setor);

  // Carga atual (referência ano 2025 — antes da reforma)
  const baseServicos = faturamento * pctServ;
  const baseComercio = faturamento * pctCom;
  const tributosAtuais =
    faturamento * pisCofinsAtual + baseComercio * icmsAtual + baseServicos * issAtual;
  const cargaAtual = faturamento > 0 ? (tributosAtuais / faturamento) * 100 : 0;

  const projecoes: ProjecaoAno[] = CRONOGRAMA_REFORMA.map((ano) => {
    const cbs = faturamento * (ano.cbs / 100) * redutor;
    const ibs = faturamento * (ano.ibs / 100) * redutor;
    const pisCofins = faturamento * pisCofinsAtual * (ano.pisCofinsResidual / 100);
    const icms = baseComercio * icmsAtual * (ano.icmsResidual / 100);
    const iss = baseServicos * issAtual * (ano.issResidual / 100);
    const total = cbs + ibs + pisCofins + icms + iss;
    const carga = faturamento > 0 ? (total / faturamento) * 100 : 0;
    return {
      ano: ano.ano,
      fase: ano.fase,
      faturamento,
      cbs,
      ibs,
      pisCofins,
      icms,
      iss,
      totalTributos: total,
      cargaEfetiva: carga,
      variacaoVsAtual: cargaAtual > 0 ? carga - cargaAtual : 0,
    };
  });

  const economiaAcumulada = projecoes.reduce(
    (acc, p) => acc + (tributosAtuais - p.totalTributos),
    0
  );
  const picoTributario = projecoes.reduce(
    (max, p) => (p.totalTributos > max.totalTributos ? p : max),
    projecoes[0]
  );

  return { cargaAtual, projecoes, economiaAcumulada, picoTributario };
}
