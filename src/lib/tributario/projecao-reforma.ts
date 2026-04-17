// ============================================
// PROJEÇÃO REFORMA TRIBUTÁRIA 2026-2033
// Cronograma de transição CBS + IBS + redução PIS/COFINS/ICMS/ISS
// ============================================

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

/**
 * Cronograma oficial — EC 132/2023 + LC 214/2025.
 * Os percentuais residuais representam a fração ainda devida do tributo antigo.
 */
export const CRONOGRAMA_REFORMA: AliquotaTransicao[] = [
  { ano: 2026, cbs: 0.9, ibs: 0.1, pisCofinsResidual: 100, icmsResidual: 100, issResidual: 100, fase: 'Teste — alíquotas simbólicas' },
  { ano: 2027, cbs: 8.8, ibs: 0.1, pisCofinsResidual: 0, icmsResidual: 100, issResidual: 100, fase: 'CBS plena, IBS simbólica' },
  { ano: 2028, cbs: 8.8, ibs: 0.1, pisCofinsResidual: 0, icmsResidual: 100, issResidual: 100, fase: 'CBS plena, IBS simbólica' },
  { ano: 2029, cbs: 8.8, ibs: 1.77, pisCofinsResidual: 0, icmsResidual: 90, issResidual: 90, fase: 'IBS começa transição (10%)' },
  { ano: 2030, cbs: 8.8, ibs: 3.54, pisCofinsResidual: 0, icmsResidual: 80, issResidual: 80, fase: 'IBS 20% / ICMS-ISS 80%' },
  { ano: 2031, cbs: 8.8, ibs: 5.31, pisCofinsResidual: 0, icmsResidual: 70, issResidual: 70, fase: 'IBS 30% / ICMS-ISS 70%' },
  { ano: 2032, cbs: 8.8, ibs: 7.08, pisCofinsResidual: 0, icmsResidual: 60, issResidual: 60, fase: 'IBS 40% / ICMS-ISS 60%' },
  { ano: 2033, cbs: 8.8, ibs: 17.7, pisCofinsResidual: 0, icmsResidual: 0, issResidual: 0, fase: 'Sistema novo pleno' },
];

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

export function projetarReforma(params: ParametrosProjecao): {
  cargaAtual: number;
  projecoes: ProjecaoAno[];
  economiaAcumulada: number;
  picoTributario: ProjecaoAno;
} {
  const faturamento = Math.max(0, Number(params.faturamentoAnual) || 0);
  const pctServ = (Number(params.percentualServicos) || 0) / 100;
  const pctCom = (Number(params.percentualComercio ?? Math.max(0, 100 - (Number(params.percentualServicos) || 0))) || 0) / 100;
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
    const cbs = (faturamento * (ano.cbs / 100)) * redutor;
    const ibs = (faturamento * (ano.ibs / 100)) * redutor;
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
    0,
  );
  const picoTributario = projecoes.reduce((max, p) => (p.totalTributos > max.totalTributos ? p : max), projecoes[0]);

  return { cargaAtual, projecoes, economiaAcumulada, picoTributario };
}
