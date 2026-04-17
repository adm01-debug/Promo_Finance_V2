// ============================================
// ALÍQUOTAS DO SIMPLES NACIONAL
// 5 Anexos × 6 Faixas (LC 123/2006 com redação da LC 155/2016)
// ============================================

import type { AnexoSimples } from './types';

export interface FaixaSimples {
  faixa: number;
  rbt12_de: number;
  rbt12_ate: number;
  aliquota: number; // decimal (ex: 0.04 = 4%)
  pd: number; // Parcela a Deduzir
}

// Anexo I — Comércio
export const ANEXO_I: FaixaSimples[] = [
  { faixa: 1, rbt12_de: 0, rbt12_ate: 180000, aliquota: 0.04, pd: 0 },
  { faixa: 2, rbt12_de: 180000.01, rbt12_ate: 360000, aliquota: 0.073, pd: 5940 },
  { faixa: 3, rbt12_de: 360000.01, rbt12_ate: 720000, aliquota: 0.095, pd: 13860 },
  { faixa: 4, rbt12_de: 720000.01, rbt12_ate: 1800000, aliquota: 0.107, pd: 22500 },
  { faixa: 5, rbt12_de: 1800000.01, rbt12_ate: 3600000, aliquota: 0.143, pd: 87300 },
  { faixa: 6, rbt12_de: 3600000.01, rbt12_ate: 4800000, aliquota: 0.19, pd: 378000 },
];

// Anexo II — Indústria
export const ANEXO_II: FaixaSimples[] = [
  { faixa: 1, rbt12_de: 0, rbt12_ate: 180000, aliquota: 0.045, pd: 0 },
  { faixa: 2, rbt12_de: 180000.01, rbt12_ate: 360000, aliquota: 0.078, pd: 5940 },
  { faixa: 3, rbt12_de: 360000.01, rbt12_ate: 720000, aliquota: 0.10, pd: 13860 },
  { faixa: 4, rbt12_de: 720000.01, rbt12_ate: 1800000, aliquota: 0.112, pd: 22500 },
  { faixa: 5, rbt12_de: 1800000.01, rbt12_ate: 3600000, aliquota: 0.147, pd: 85500 },
  { faixa: 6, rbt12_de: 3600000.01, rbt12_ate: 4800000, aliquota: 0.30, pd: 720000 },
];

// Anexo III — Serviços (com Fator R ≥ 0,28)
export const ANEXO_III: FaixaSimples[] = [
  { faixa: 1, rbt12_de: 0, rbt12_ate: 180000, aliquota: 0.06, pd: 0 },
  { faixa: 2, rbt12_de: 180000.01, rbt12_ate: 360000, aliquota: 0.112, pd: 9360 },
  { faixa: 3, rbt12_de: 360000.01, rbt12_ate: 720000, aliquota: 0.135, pd: 17640 },
  { faixa: 4, rbt12_de: 720000.01, rbt12_ate: 1800000, aliquota: 0.16, pd: 35640 },
  { faixa: 5, rbt12_de: 1800000.01, rbt12_ate: 3600000, aliquota: 0.21, pd: 125640 },
  { faixa: 6, rbt12_de: 3600000.01, rbt12_ate: 4800000, aliquota: 0.33, pd: 648000 },
];

// Anexo IV — Serviços específicos (construção, vigilância, limpeza)
export const ANEXO_IV: FaixaSimples[] = [
  { faixa: 1, rbt12_de: 0, rbt12_ate: 180000, aliquota: 0.045, pd: 0 },
  { faixa: 2, rbt12_de: 180000.01, rbt12_ate: 360000, aliquota: 0.09, pd: 8100 },
  { faixa: 3, rbt12_de: 360000.01, rbt12_ate: 720000, aliquota: 0.102, pd: 12420 },
  { faixa: 4, rbt12_de: 720000.01, rbt12_ate: 1800000, aliquota: 0.14, pd: 39780 },
  { faixa: 5, rbt12_de: 1800000.01, rbt12_ate: 3600000, aliquota: 0.22, pd: 183780 },
  { faixa: 6, rbt12_de: 3600000.01, rbt12_ate: 4800000, aliquota: 0.33, pd: 828000 },
];

// Anexo V — Serviços (Fator R < 0,28)
export const ANEXO_V: FaixaSimples[] = [
  { faixa: 1, rbt12_de: 0, rbt12_ate: 180000, aliquota: 0.155, pd: 0 },
  { faixa: 2, rbt12_de: 180000.01, rbt12_ate: 360000, aliquota: 0.18, pd: 4500 },
  { faixa: 3, rbt12_de: 360000.01, rbt12_ate: 720000, aliquota: 0.195, pd: 9900 },
  { faixa: 4, rbt12_de: 720000.01, rbt12_ate: 1800000, aliquota: 0.205, pd: 17100 },
  { faixa: 5, rbt12_de: 1800000.01, rbt12_ate: 3600000, aliquota: 0.23, pd: 62100 },
  { faixa: 6, rbt12_de: 3600000.01, rbt12_ate: 4800000, aliquota: 0.305, pd: 540000 },
];

const ANEXOS: Record<AnexoSimples, FaixaSimples[]> = {
  I: ANEXO_I,
  II: ANEXO_II,
  III: ANEXO_III,
  IV: ANEXO_IV,
  V: ANEXO_V,
};

export function obterAnexo(anexo: AnexoSimples): FaixaSimples[] {
  return ANEXOS[anexo];
}

/**
 * Identifica a faixa do Simples Nacional dado o RBT12.
 */
export function identificarFaixa(rbt12: number, anexo: AnexoSimples): FaixaSimples | null {
  const faixas = ANEXOS[anexo];
  return faixas.find((f) => rbt12 >= f.rbt12_de && rbt12 <= f.rbt12_ate) || null;
}

/**
 * Limite máximo de receita bruta para o Simples Nacional.
 */
export const LIMITE_SIMPLES_NACIONAL = 4_800_000;
