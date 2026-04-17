// ============================================
// RBT12 — Receita Bruta dos últimos 12 meses
// Conforme CGSN 140/2018, art. 21
// ============================================

import type { FaturamentoMes } from './types';

/**
 * Calcula a Receita Bruta dos últimos 12 meses (RBT12).
 * 
 * Regras:
 * - Empresa com 12+ meses: soma dos 12 meses anteriores ao período de apuração
 * - Empresa com <13 meses (em início de atividade): proporcionalização
 *   RBT12 = (receita_acumulada / nº_meses_atividade) × 12
 */
export function calcularRBT12(
  faturamentoHistorico: FaturamentoMes[],
  anoReferencia: number,
  mesReferencia: number,
): number {
  if (!faturamentoHistorico || faturamentoHistorico.length === 0) return 0;

  // Ordena do mais recente para o mais antigo
  const ordenado = [...faturamentoHistorico].sort((a, b) => {
    if (a.ano !== b.ano) return b.ano - a.ano;
    return b.mes - a.mes;
  });

  // Filtra apenas meses anteriores ao mês de referência
  const anteriores = ordenado.filter((f) => {
    if (f.ano < anoReferencia) return true;
    if (f.ano === anoReferencia && f.mes < mesReferencia) return true;
    return false;
  });

  if (anteriores.length === 0) return 0;

  // Pega últimos 12 meses
  const ultimos12 = anteriores.slice(0, 12);
  const soma = ultimos12.reduce((acc, f) => acc + (f.receita_bruta || 0), 0);

  // Início de atividade: proporcionaliza
  if (ultimos12.length < 12) {
    const media = soma / ultimos12.length;
    return media * 12;
  }

  return soma;
}

/**
 * Calcula receita bruta acumulada no ano-calendário (RBA).
 */
export function calcularRBA(
  faturamentoHistorico: FaturamentoMes[],
  ano: number,
): number {
  return faturamentoHistorico
    .filter((f) => f.ano === ano)
    .reduce((acc, f) => acc + (f.receita_bruta || 0), 0);
}
