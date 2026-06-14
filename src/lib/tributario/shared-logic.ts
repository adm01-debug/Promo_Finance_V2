
// LOGICA TRIBUTARIA COMPARTILHADA

export type RegimeTributario = 'simples_nacional' | 'lucro_presumido' | 'lucro_real';
export type AnexoSimples = 'I' | 'II' | 'III' | 'IV' | 'V';

export interface FaturamentoMes {
  ano: number; mes: number; receita_bruta: number;
  receita_servicos?: number; receita_revenda?: number;
  receita_industria?: number; receita_exportacao?: number;
}
export interface FolhaMes {
  ano: number; mes: number; salarios: number; pro_labore: number;
  encargos: number; total_folha: number;
}
export interface ParametrosSimulacao {
  faturamentoAnual: number;
  faturamentoMensal?: FaturamentoMes[];
  folhaMensal?: FolhaMes[];
  folhaAnual?: number;
  margemLucro: number;
  percentualServicos: number;
  comprasComCredito?: number;
  despesasOperacionais?: number;
  /** Alíquota ICMS efetiva (0..1), default 0.18 (SP interna). */
  aliquotaICMS?: number;
  /** Alíquota ISS efetiva (0..1), default 0.05 (teto LC 116/2003). */
  aliquotaISS?: number;
}
export interface ResultadoCenario {
  regime: RegimeTributario; nome: string; elegivel: boolean;
  motivoInelegibilidade?: string;
  irpj: number; csll: number; pis: number; cofins: number; cpp: number;
  icms: number; iss: number; cbs: number; ibs: number;
  totalTributos: number; cargaEfetiva: number;
  rbt12?: number; fatorR?: number; anexoAplicavel?: AnexoSimples;
  faixaAplicavel?: number; aliquotaNominal?: number;
  observacoes: string[];
}

export const ANEXOS: Record<AnexoSimples, Array<{ faixa: number; ate: number; aliq: number; pd: number }>> = {
  I: [
    { faixa: 1, ate: 180000, aliq: 0.04, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.073, pd: 5940 },
    { faixa: 3, ate: 720000, aliq: 0.095, pd: 13860 },
    { faixa: 4, ate: 1800000, aliq: 0.107, pd: 22500 },
    { faixa: 5, ate: 3600000, aliq: 0.143, pd: 87300 },
    { faixa: 6, ate: 4800000, aliq: 0.19, pd: 378000 },
  ],
  II: [
    { faixa: 1, ate: 180000, aliq: 0.045, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.078, pd: 5940 },
    { faixa: 3, ate: 720000, aliq: 0.10, pd: 13860 },
    { faixa: 4, ate: 1800000, aliq: 0.112, pd: 22500 },
    { faixa: 5, ate: 3600000, aliq: 0.147, pd: 85500 },
    { faixa: 6, ate: 4800000, aliq: 0.30, pd: 720000 },
  ],
  III: [
    { faixa: 1, ate: 180000, aliq: 0.06, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.112, pd: 9360 },
    { faixa: 3, ate: 720000, aliq: 0.135, pd: 17640 },
    { faixa: 4, ate: 1800000, aliq: 0.16, pd: 35640 },
    { faixa: 5, ate: 3600000, aliq: 0.21, pd: 125640 },
    { faixa: 6, ate: 4800000, aliq: 0.33, pd: 648000 },
  ],
  IV: [
    { faixa: 1, ate: 180000, aliq: 0.045, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.09, pd: 8100 },
    { faixa: 3, ate: 720000, aliq: 0.102, pd: 12420 },
    { faixa: 4, ate: 1800000, aliq: 0.14, pd: 39780 },
    { faixa: 5, ate: 3600000, aliq: 0.22, pd: 183780 },
    { faixa: 6, ate: 4800000, aliq: 0.33, pd: 828000 },
  ],
  V: [
    { faixa: 1, ate: 180000, aliq: 0.155, pd: 0 },
    { faixa: 2, ate: 360000, aliq: 0.18, pd: 4500 },
    { faixa: 3, ate: 720000, aliq: 0.195, pd: 9900 },
    { faixa: 4, ate: 1800000, aliq: 0.205, pd: 17100 },
    { faixa: 5, ate: 3600000, aliq: 0.23, pd: 62100 },
    { faixa: 6, ate: 4800000, aliq: 0.305, pd: 540000 },
  ],
};

export const LIMITE_SIMPLES = 4800000;
export const LIMITE_PRESUMIDO = 78000000;

export function calcularRBT12(hist: FaturamentoMes[], ano: number, mes: number): number {
  if (!hist?.length) return 0;
  const ord = [...hist].sort((a, b) => (a.ano !== b.ano ? b.ano - a.ano : b.mes - a.mes));
  const ant = ord.filter((f) => f.ano < ano || (f.ano === ano && f.mes < mes));
  if (!ant.length) return 0;
  const u12 = ant.slice(0, 12);
  const soma = u12.reduce((a, f) => a + (f.receita_bruta || 0), 0);
  return u12.length < 12 ? (soma / u12.length) * 12 : soma;
}

export function calcularFolha12m(hist: FolhaMes[], ano: number, mes: number): number {
  if (!hist?.length) return 0;
  const ord = [...hist].sort((a, b) => (a.ano !== b.ano ? b.ano - a.ano : b.mes - a.mes));
  const ant = ord.filter((f) => f.ano < ano || (f.ano === ano && f.mes < mes));
  const u12 = ant.slice(0, 12);
  const soma = u12.reduce((a, f) => a + (f.total_folha || 0), 0);
  return u12.length < 12 && u12.length > 0 ? (soma / u12.length) * 12 : soma;
}

export function simularSimples(
  p: ParametrosSimulacao,
  ano: number,
  mes: number,
  forcarAnexo?: AnexoSimples,
): ResultadoCenario {
  const obs: string[] = [];
  if (p.faturamentoAnual > LIMITE_SIMPLES) {
    return {
      regime: 'simples_nacional', nome: 'Simples Nacional', elegivel: false,
      motivoInelegibilidade: `Faturamento acima de R$ 4,8 mi`,
      irpj: 0, csll: 0, pis: 0, cofins: 0, cpp: 0, icms: 0, iss: 0, cbs: 0, ibs: 0,
      totalTributos: 0, cargaEfetiva: 0, observacoes: ['Acima do limite legal.'],
    };
  }
  let rbt12 = p.faturamentoAnual;
  if (p.faturamentoMensal?.length) {
    const r = calcularRBT12(p.faturamentoMensal, ano, mes);
    if (r > 0) {
      rbt12 = r;
    } else {
      obs.push('RBT12 estimado a partir do faturamento anual informado (histórico mensal sem meses anteriores ao mês de referência).');
    }
  }
  const folha12m = p.folhaMensal?.length
    ? calcularFolha12m(p.folhaMensal, ano, mes)
    : (p.folhaAnual || 0);
  const fatorR = rbt12 > 0 ? folha12m / rbt12 : 0;
  let anexo: AnexoSimples = 'I';
  if (forcarAnexo) {
    anexo = forcarAnexo;
    obs.push(`Anexo forçado manualmente para simulação: Anexo ${anexo}.`);
  } else if (p.percentualServicos > 50) {
    anexo = fatorR >= 0.28 ? 'III' : 'V';
    obs.push(`Fator R = ${(fatorR * 100).toFixed(2)}% → Anexo ${anexo}.`);
  } else {
    obs.push('Atividade comercial → Anexo I.');
  }
  const faixa = ANEXOS[anexo].find((f) => rbt12 <= f.ate) || ANEXOS[anexo][5];
  const aliqEfet = rbt12 > 0 ? Math.max(0, ((rbt12 * faixa.aliq) - faixa.pd) / rbt12) : faixa.aliq;
  const das = p.faturamentoAnual * aliqEfet;
  obs.push(`Faixa ${faixa.faixa}, alíq nominal ${(faixa.aliq * 100).toFixed(2)}%, efetiva ${(aliqEfet * 100).toFixed(2)}%.`);
  
  // Distribuição simplificada por anexo (LC 123/2006, Anexos I-V).
  // As frações de cada anexo precisam somar 1.0 — caso contrário o cálculo
  // sobrestima/subestima o total. Renormalizamos defensivamente para evitar
  // que pequenos desvios na tabela (ex.: 0.055+0.035+0.1282+0.0278+0.415+0.34
  // do Anexo I = 1.001) afetem o DAS.
  type DistribuicaoAnexo = {
    irpj: number; csll: number; cofins: number; pis: number;
    cpp: number; icms: number; iss: number;
  };
  const dist: Record<AnexoSimples, DistribuicaoAnexo> = {
    I:   { irpj: 0.055, csll: 0.035, cofins: 0.1282, pis: 0.0278, cpp: 0.415,  icms: 0.34,  iss: 0 },
    II:  { irpj: 0.055, csll: 0.035, cofins: 0.1182, pis: 0.0278, cpp: 0.415,  icms: 0.32,  iss: 0 },
    III: { irpj: 0.04,  csll: 0.035, cofins: 0.1282, pis: 0.0278, cpp: 0.4340, icms: 0,     iss: 0.335 },
    IV:  { irpj: 0.185, csll: 0.15,  cofins: 0.1603, pis: 0.0347, cpp: 0,      icms: 0,     iss: 0.47 },
    V:   { irpj: 0.25,  csll: 0.15,  cofins: 0.1428, pis: 0.0309, cpp: 0.2885, icms: 0,     iss: 0.137 },
  };

  const raw = dist[anexo];
  const sum = raw.irpj + raw.csll + raw.cofins + raw.pis + raw.cpp + raw.icms + raw.iss;
  const d: DistribuicaoAnexo = sum > 0
    ? {
        irpj: raw.irpj / sum,
        csll: raw.csll / sum,
        cofins: raw.cofins / sum,
        pis: raw.pis / sum,
        cpp: raw.cpp / sum,
        icms: raw.icms / sum,
        iss: raw.iss / sum,
      }
    : raw;
  return {
    regime: 'simples_nacional', nome: 'Simples Nacional', elegivel: true,
    irpj: das * d.irpj, csll: das * d.csll, pis: das * d.pis, cofins: das * d.cofins,
    cpp: das * d.cpp, icms: das * d.icms, iss: das * d.iss,
    cbs: 0, ibs: 0,
    totalTributos: das, cargaEfetiva: p.faturamentoAnual > 0 ? (das / p.faturamentoAnual) * 100 : 0,
    rbt12, fatorR, anexoAplicavel: anexo, faixaAplicavel: faixa.faixa,
    aliquotaNominal: faixa.aliq * 100, observacoes: obs,
  };
}

export function simularPresumido(p: ParametrosSimulacao): ResultadoCenario {
  if (p.faturamentoAnual > LIMITE_PRESUMIDO) {
    return {
      regime: 'lucro_presumido', nome: 'Lucro Presumido', elegivel: false,
      motivoInelegibilidade: 'Faturamento > R$ 78 mi',
      irpj: 0, csll: 0, pis: 0, cofins: 0, cpp: 0, icms: 0, iss: 0, cbs: 0, ibs: 0,
      totalTributos: 0, cargaEfetiva: 0, observacoes: ['Obrigatório Lucro Real.'],
    };
  }
  const ps = p.percentualServicos / 100;
  const pc = 1 - ps;
  const rs = p.faturamentoAnual * ps;
  const rc = p.faturamentoAnual * pc;
  const aliqICMS = p.aliquotaICMS ?? 0.18;
  const aliqISS = p.aliquotaISS ?? 0.05;
  const baseIrpj = rs * 0.32 + rc * 0.08;
  const irpj = baseIrpj * 0.15 + (baseIrpj > 240000 ? (baseIrpj - 240000) * 0.10 : 0);
  const csll = (rs * 0.32 + rc * 0.12) * 0.09;
  const pis = p.faturamentoAnual * 0.0065;
  const cofins = p.faturamentoAnual * 0.03;
  const icms = rc * aliqICMS;
  const iss = rs * aliqISS;
  const cpp = (p.folhaAnual || 0) * 0.20;
  const total = irpj + csll + pis + cofins + icms + iss + cpp;
  return {
    regime: 'lucro_presumido', nome: 'Lucro Presumido', elegivel: true,
    irpj, csll, pis, cofins, cpp, icms, iss, cbs: 0, ibs: 0,
    totalTributos: total, cargaEfetiva: p.faturamentoAnual > 0 ? (total / p.faturamentoAnual) * 100 : 0,
    observacoes: [
      'Presunção 8% comércio / 32% serviços.',
      'PIS/COFINS cumulativo.',
      `ICMS ${(aliqICMS * 100).toFixed(2)}% / ISS ${(aliqISS * 100).toFixed(2)}%.`,
    ],
  };
}

export function simularReal(p: ParametrosSimulacao): ResultadoCenario {
  const lucro = p.faturamentoAnual * (p.margemLucro / 100);
  const irpj = Math.max(0, lucro * 0.15 + (lucro > 240000 ? (lucro - 240000) * 0.10 : 0));
  const csll = Math.max(0, lucro * 0.09);
  const baseCred = (p.comprasComCredito || 0) + (p.despesasOperacionais || 0);
  const pis = Math.max(0, p.faturamentoAnual * 0.0165 - baseCred * 0.0165);
  const cofins = Math.max(0, p.faturamentoAnual * 0.076 - baseCred * 0.076);
  const ps = p.percentualServicos / 100;
  const rs = p.faturamentoAnual * ps;
  const rc = p.faturamentoAnual * (1 - ps);
  const aliqICMS = p.aliquotaICMS ?? 0.18;
  const aliqISS = p.aliquotaISS ?? 0.05;
  const icms = Math.max(0, rc * aliqICMS - (p.comprasComCredito || 0) * aliqICMS);
  const iss = rs * aliqISS;
  const cpp = (p.folhaAnual || 0) * 0.20;
  const total = irpj + csll + pis + cofins + icms + iss + cpp;
  const observacoes = [`Lucro estimado: ${p.margemLucro}% do faturamento.`, 'PIS/COFINS não-cumulativo.'];
  if (lucro <= 240000) {
    observacoes.push('Sem adicional de IRPJ: lucro anual ≤ R$ 240k.');
  } else {
    observacoes.push('Adicional de IRPJ de 10% sobre o lucro excedente a R$ 240k.');
  }
  if (p.margemLucro < 8) {
    observacoes.push('Margem baixa (< 8%): Lucro Real tende a ser mais vantajoso; revise custos e créditos.');
  }
  return {
    regime: 'lucro_real', nome: 'Lucro Real', elegivel: true,
    irpj, csll, pis, cofins, cpp, icms, iss, cbs: 0, ibs: 0,
    totalTributos: total, cargaEfetiva: p.faturamentoAnual > 0 ? (total / p.faturamentoAnual) * 100 : 0,
    observacoes,
  };
}
