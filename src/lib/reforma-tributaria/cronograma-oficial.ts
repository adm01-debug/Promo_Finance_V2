import { REF_CBS_2027, REF_IBS } from '@/config/reforma-tributaria';

export type OrigemValor = 'lei' | 'simulado';

export interface LinhaCronograma {
  ano: number;
  /** % CBS sobre a base de cálculo. */
  cbs: number;
  /** % IBS estadual. Em 2026 é o IBS total (art. 343); de 2027 em diante, metade (50/50 UF/Mun). */
  ibsUf: number;
  /** % IBS municipal. Zero em 2026 (sem parcela municipal); a outra metade a partir de 2027. */
  ibsMun: number;
  /** % ainda devida de ICMS (fração do tributo antigo, não residual absoluto). */
  icmsResidual: number;
  /** % ainda devida de ISS. */
  issResidual: number;
  /** % ainda devida de PIS. */
  pisResidual: number;
  /** % ainda devida de COFINS. */
  cofinsResidual: number;
  /** Origem/fundamento da alíquota de CBS do ano (`cbs`). */
  origem: OrigemValor;
  fundamento: string;
  /** Origem/fundamento da alíquota de IBS do ano (`ibsUf`+`ibsMun`) — diverge de `origem`/`fundamento` em 2027-2028, quando o IBS já é fixado por lei (art. 344) mas a CBS ainda depende de estimativa. */
  origemIbs: OrigemValor;
  fundamentoIbs: string;
  /**
   * Ano-teste (LC 214/2025 arts. 343 e 348): CBS/IBS são devidos só
   * experimentalmente e o valor é compensado/dispensado com PIS/COFINS e
   * tributos federais. Não somam carga efetiva — servem apenas de referência.
   */
  anoTeste?: boolean;
}

const FUNDAMENTO_2026 =
  'LC 214/2025 art. 343 — IBS 2026 é só alíquota estadual (0,1%), sem parcela municipal; ' +
  'ano-teste sem efeito arrecadatório líquido para quem cumpre as obrigações acessórias ' +
  '(art. 348 — compensação/dispensa com PIS/COFINS e tributos federais; não envolve ICMS/ISS)';
const FUNDAMENTO_TRANSICAO_IBS =
  'ADCT (EC 132/2023) — cronograma de substituição gradual de ICMS/ISS por IBS, 2029-2032';
const FUNDAMENTO_PLENO = 'ADCT (EC 132/2023) — regime definitivo a partir de 2033';
const FUNDAMENTO_CBS_SIMULADO =
  'LC 214/2025 art. 347 — CBS 2027/2028 = REF_CBS_2027 (TCU, TC 006.529/2026-7) − 0,1 p.p.; ' +
  'redução vale só para 2027 e 2028 (não se estende a 2029+); ' +
  'alíquota legal definitiva pendente de resolução do Senado até 15/12/2026';
const FUNDAMENTO_CBS_PLENA_SIMULADA =
  'A partir de 2029 a redução de 0,1 p.p. do art. 347 não se aplica mais — CBS usa REF_CBS_2027 ' +
  '(TCU, TC 006.529/2026-7) sem desconto; alíquota legal definitiva pendente do Senado';
const FUNDAMENTO_IBS_2027_2028 =
  'LC 214/2025 art. 344 — IBS 2027/2028 fixado em lei: 0,05% estadual + 0,05% municipal';
const FUNDAMENTO_IBS_TRANSICAO_SIMULADO =
  `${FUNDAMENTO_TRANSICAO_IBS}; split UF/Mun aqui é estimativa (50/50), não garantido por lei — ` +
  'o art. 349, II fixa alíquotas de referência separadas para estados e municípios por resolução ' +
  'do Senado (arts. 360-365), sem exigir igualdade entre as duas parcelas';
const FUNDAMENTO_IBS_PLENO_SIMULADO =
  `${FUNDAMENTO_PLENO}; alíquota de referência (REF_IBS) e split UF/Mun ainda pendentes de ` +
  'resolução do Senado (arts. 349, II e 360-365 da LC 214/2025)';

/**
 * Fonte única das alíquotas de transição IBS/CBS (etapa 7 do plano de
 * conformidade RT). Nenhum outro arquivo deve declarar sua própria tabela —
 * importe `CRONOGRAMA_OFICIAL` ou `obterLinhaCronograma`.
 */
export const CRONOGRAMA_OFICIAL: LinhaCronograma[] = [
  {
    ano: 2026,
    cbs: 0.9,
    ibsUf: 0.1,
    ibsMun: 0,
    icmsResidual: 100,
    issResidual: 100,
    pisResidual: 100,
    cofinsResidual: 100,
    origem: 'lei',
    fundamento: FUNDAMENTO_2026,
    origemIbs: 'lei',
    fundamentoIbs: FUNDAMENTO_2026,
    anoTeste: true,
  },
  {
    ano: 2027,
    cbs: REF_CBS_2027 - 0.1,
    ibsUf: 0.05,
    ibsMun: 0.05,
    icmsResidual: 100,
    issResidual: 100,
    pisResidual: 0,
    cofinsResidual: 0,
    origem: 'simulado',
    fundamento: FUNDAMENTO_CBS_SIMULADO,
    origemIbs: 'lei',
    fundamentoIbs: FUNDAMENTO_IBS_2027_2028,
  },
  {
    ano: 2028,
    cbs: REF_CBS_2027 - 0.1,
    ibsUf: 0.05,
    ibsMun: 0.05,
    icmsResidual: 100,
    issResidual: 100,
    pisResidual: 0,
    cofinsResidual: 0,
    origem: 'simulado',
    fundamento: FUNDAMENTO_CBS_SIMULADO,
    origemIbs: 'lei',
    fundamentoIbs: FUNDAMENTO_IBS_2027_2028,
  },
  {
    ano: 2029,
    cbs: REF_CBS_2027,
    ibsUf: (REF_IBS * 0.1) / 2,
    ibsMun: (REF_IBS * 0.1) / 2,
    icmsResidual: 90,
    issResidual: 90,
    pisResidual: 0,
    cofinsResidual: 0,
    origem: 'simulado',
    fundamento: FUNDAMENTO_CBS_PLENA_SIMULADA,
    origemIbs: 'simulado',
    fundamentoIbs: FUNDAMENTO_IBS_TRANSICAO_SIMULADO,
  },
  {
    ano: 2030,
    cbs: REF_CBS_2027,
    ibsUf: (REF_IBS * 0.2) / 2,
    ibsMun: (REF_IBS * 0.2) / 2,
    icmsResidual: 80,
    issResidual: 80,
    pisResidual: 0,
    cofinsResidual: 0,
    origem: 'simulado',
    fundamento: FUNDAMENTO_CBS_PLENA_SIMULADA,
    origemIbs: 'simulado',
    fundamentoIbs: FUNDAMENTO_IBS_TRANSICAO_SIMULADO,
  },
  {
    ano: 2031,
    cbs: REF_CBS_2027,
    ibsUf: (REF_IBS * 0.3) / 2,
    ibsMun: (REF_IBS * 0.3) / 2,
    icmsResidual: 70,
    issResidual: 70,
    pisResidual: 0,
    cofinsResidual: 0,
    origem: 'simulado',
    fundamento: FUNDAMENTO_CBS_PLENA_SIMULADA,
    origemIbs: 'simulado',
    fundamentoIbs: FUNDAMENTO_IBS_TRANSICAO_SIMULADO,
  },
  {
    ano: 2032,
    cbs: REF_CBS_2027,
    ibsUf: (REF_IBS * 0.4) / 2,
    ibsMun: (REF_IBS * 0.4) / 2,
    icmsResidual: 60,
    issResidual: 60,
    pisResidual: 0,
    cofinsResidual: 0,
    origem: 'simulado',
    fundamento: FUNDAMENTO_CBS_PLENA_SIMULADA,
    origemIbs: 'simulado',
    fundamentoIbs: FUNDAMENTO_IBS_TRANSICAO_SIMULADO,
  },
  {
    ano: 2033,
    cbs: REF_CBS_2027,
    ibsUf: REF_IBS / 2,
    ibsMun: REF_IBS / 2,
    icmsResidual: 0,
    issResidual: 0,
    pisResidual: 0,
    cofinsResidual: 0,
    origem: 'simulado',
    fundamento: FUNDAMENTO_PLENO,
    origemIbs: 'simulado',
    fundamentoIbs: FUNDAMENTO_IBS_PLENO_SIMULADO,
  },
];

/**
 * Retorna a linha do cronograma para o ano informado. Antes de 2026, nenhum
 * tributo novo é devido (tabela pré-reforma). Após 2033, mantém o regime
 * pleno.
 */
export function obterLinhaCronograma(ano: number): LinhaCronograma {
  if (ano < 2026) {
    return {
      ano,
      cbs: 0,
      ibsUf: 0,
      ibsMun: 0,
      icmsResidual: 100,
      issResidual: 100,
      pisResidual: 100,
      cofinsResidual: 100,
      origem: 'lei',
      fundamento: 'Pré-reforma — CBS/IBS ainda não vigentes',
      origemIbs: 'lei',
      fundamentoIbs: 'Pré-reforma — CBS/IBS ainda não vigentes',
    };
  }
  if (ano > 2033) {
    return { ...CRONOGRAMA_OFICIAL[CRONOGRAMA_OFICIAL.length - 1], ano };
  }
  const linha = CRONOGRAMA_OFICIAL.find((l) => l.ano === ano);
  if (!linha) {
    throw new Error(`[reforma-tributaria] Sem linha de cronograma para o ano ${ano}`);
  }
  return linha;
}
