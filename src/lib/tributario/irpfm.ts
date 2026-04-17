// ============================================
// MOTOR IRPFM PF — Lei 15.270/2025
// Imposto Mínimo PF sobre dividendos > R$ 50k/mês
// Vigência: 2026
// ============================================

export interface ParametrosIRPFM {
  /** Valor de dividendos recebidos no mês (R$) */
  dividendosMensais: number;
  /** Outros rendimentos isentos do mês (opcional) */
  outrosRendimentosIsentos?: number;
  /** IRPF já retido na fonte sobre lucros (opcional, abatido) */
  irrfRetido?: number;
}

export interface ResultadoIRPFM {
  baseCalculo: number;
  aliquotaEfetiva: number; // % (0 a 10)
  impostoMinimo: number;
  impostoLiquido: number; // após abater IRRF
  faixa: string;
  observacoes: string[];
}

/**
 * Limite de isenção: R$ 50.000,00 por mês
 * (Lei 15.270/2025 — IRPFM aplicado sobre o excedente)
 */
export const IRPFM_LIMITE_ISENCAO_MENSAL = 50_000;
export const IRPFM_LIMITE_ANUAL_BASE = 600_000;

/**
 * Tabela progressiva IRPFM mensal (base no excedente sobre R$ 50k)
 * - 0,00 a 0,00 → isento
 * - excede até R$ 50k (total mensal R$ 100k) → 5%
 * - excede até R$ 200k → 7,5%
 * - acima → 10% (teto Lei 15.270/2025)
 */
const TABELA_IRPFM = [
  { ate: 0, aliquota: 0, descricao: 'Isento (≤ R$ 50k/mês)' },
  { ate: 50_000, aliquota: 0.05, descricao: '5% sobre excedente' },
  { ate: 200_000, aliquota: 0.075, descricao: '7,5% sobre excedente' },
  { ate: Infinity, aliquota: 0.1, descricao: '10% sobre excedente (teto Lei 15.270/2025)' },
] as const;

/**
 * Calcula o IRPFM mensal de uma PF a partir de dividendos recebidos.
 * Aplica alíquota progressiva sobre o excedente do limite de R$ 50k/mês.
 */
export function calcularIRPFMMensal(params: ParametrosIRPFM): ResultadoIRPFM {
  const dividendos = Math.max(0, Number(params.dividendosMensais) || 0);
  const outros = Math.max(0, Number(params.outrosRendimentosIsentos) || 0);
  const irrf = Math.max(0, Number(params.irrfRetido) || 0);

  const baseTotal = dividendos + outros;
  const observacoes: string[] = [
    'Cálculo conforme Lei 15.270/2025 (IRPFM — Imposto Mínimo PF).',
    'Vigência: 2026.',
  ];

  if (baseTotal <= IRPFM_LIMITE_ISENCAO_MENSAL) {
    observacoes.push(`Recebimento dentro do limite de isenção (R$ ${IRPFM_LIMITE_ISENCAO_MENSAL.toLocaleString('pt-BR')}/mês).`);
    return {
      baseCalculo: 0,
      aliquotaEfetiva: 0,
      impostoMinimo: 0,
      impostoLiquido: 0,
      faixa: TABELA_IRPFM[0].descricao,
      observacoes,
    };
  }

  const excedente = baseTotal - IRPFM_LIMITE_ISENCAO_MENSAL;

  // Encontra a faixa aplicável sobre o excedente
  const faixa = TABELA_IRPFM.slice(1).find((f) => excedente <= f.ate) ?? TABELA_IRPFM[TABELA_IRPFM.length - 1];
  const imposto = excedente * faixa.aliquota;
  const liquido = Math.max(0, imposto - irrf);

  observacoes.push(`Excedente sobre o limite: R$ ${excedente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
  if (irrf > 0) {
    observacoes.push(`IRRF abatido: R$ ${irrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
  }

  return {
    baseCalculo: excedente,
    aliquotaEfetiva: faixa.aliquota * 100,
    impostoMinimo: imposto,
    impostoLiquido: liquido,
    faixa: faixa.descricao,
    observacoes,
  };
}

/**
 * Calcula IRPFM anual a partir de 12 meses (ou parciais) de dividendos.
 */
export function calcularIRPFMAnual(meses: ParametrosIRPFM[]): {
  totalDividendos: number;
  totalImposto: number;
  totalLiquido: number;
  detalhePorMes: ResultadoIRPFM[];
  alertas: string[];
} {
  const detalhe = (meses ?? []).map((m) => calcularIRPFMMensal(m));
  const totalDividendos = (meses ?? []).reduce((acc, m) => acc + (Number(m.dividendosMensais) || 0), 0);
  const totalImposto = detalhe.reduce((acc, r) => acc + r.impostoMinimo, 0);
  const totalLiquido = detalhe.reduce((acc, r) => acc + r.impostoLiquido, 0);

  const alertas: string[] = [];
  if (totalDividendos > IRPFM_LIMITE_ANUAL_BASE) {
    alertas.push(
      `Volume anual de dividendos (R$ ${totalDividendos.toLocaleString('pt-BR')}) ultrapassa R$ ${IRPFM_LIMITE_ANUAL_BASE.toLocaleString('pt-BR')} — avaliar Holding Patrimonial para mitigar IRPFM.`,
    );
  }
  if (totalImposto > 0) {
    alertas.push(`Imposto mínimo estimado em R$ ${totalImposto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano (Lei 15.270/2025).`);
  }

  return { totalDividendos, totalImposto, totalLiquido, detalhePorMes: detalhe, alertas };
}
