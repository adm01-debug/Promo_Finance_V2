// ============================================
// SIMULADOR — Lucro Presumido
// IRPJ/CSLL por presunção + PIS/COFINS cumulativo + ICMS/ISS
// ============================================

import type { ParametrosSimulacao, ResultadoCenario } from './types';

const LIMITE_LUCRO_PRESUMIDO = 78_000_000;

// Percentuais de presunção (Lei 9.249/95)
const PRESUNCAO_IRPJ = {
  comercio: 0.08,
  industria: 0.08,
  servicos_geral: 0.32,
  servicos_hospital: 0.08,
  transporte_carga: 0.08,
  transporte_passageiros: 0.16,
  revenda_combustiveis: 0.0128,
};

const PRESUNCAO_CSLL = {
  comercio: 0.12,
  industria: 0.12,
  servicos_geral: 0.32,
  servicos_hospital: 0.12,
};

// Alíquotas
const ALIQUOTA_IRPJ = 0.15;
const ADICIONAL_IRPJ = 0.10;
const LIMITE_ADICIONAL_TRIMESTRAL = 60_000;
const ALIQUOTA_CSLL = 0.09;
const ALIQUOTA_PIS_CUMULATIVO = 0.0065;
const ALIQUOTA_COFINS_CUMULATIVO = 0.03;
const ALIQUOTA_ICMS_PADRAO = 0.18;
const ALIQUOTA_ISS_PADRAO = 0.05;

export function simularPresumido(params: ParametrosSimulacao): ResultadoCenario {
  const observacoes: string[] = [];
  const { faturamentoAnual, percentualServicos = 0 } = params;

  if (faturamentoAnual > LIMITE_LUCRO_PRESUMIDO) {
    return {
      regime: 'lucro_presumido',
      nome: 'Lucro Presumido',
      elegivel: false,
      motivoInelegibilidade: `Faturamento acima de R$ 78 mi. Obrigatório Lucro Real.`,
      irpj: 0, csll: 0, pis: 0, cofins: 0, cpp: 0,
      icms: 0, iss: 0, cbs: 0, ibs: 0,
      totalTributos: 0, cargaEfetiva: 0,
      observacoes: ['Empresa não pode optar pelo Lucro Presumido.'],
    };
  }

  const percServicos = percentualServicos / 100;
  const percComercio = 1 - percServicos;

  // Receita por atividade
  const receitaServicos = faturamentoAnual * percServicos;
  const receitaComercio = faturamentoAnual * percComercio;

  // Base de cálculo IRPJ (presunção)
  const baseIrpjServicos = receitaServicos * PRESUNCAO_IRPJ.servicos_geral;
  const baseIrpjComercio = receitaComercio * PRESUNCAO_IRPJ.comercio;
  const baseIrpjTotal = baseIrpjServicos + baseIrpjComercio;

  // IRPJ
  const irpjBase = baseIrpjTotal * ALIQUOTA_IRPJ;
  // Adicional de 10% sobre o que exceder 240k/ano (60k/trimestre × 4)
  const limiteAnualAdicional = LIMITE_ADICIONAL_TRIMESTRAL * 4;
  const irpjAdicional = baseIrpjTotal > limiteAnualAdicional
    ? (baseIrpjTotal - limiteAnualAdicional) * ADICIONAL_IRPJ
    : 0;
  const irpj = irpjBase + irpjAdicional;

  // Base CSLL
  const baseCsllServicos = receitaServicos * PRESUNCAO_CSLL.servicos_geral;
  const baseCsllComercio = receitaComercio * PRESUNCAO_CSLL.comercio;
  const csll = (baseCsllServicos + baseCsllComercio) * ALIQUOTA_CSLL;

  // PIS/COFINS cumulativo (sem créditos)
  const pis = faturamentoAnual * ALIQUOTA_PIS_CUMULATIVO;
  const cofins = faturamentoAnual * ALIQUOTA_COFINS_CUMULATIVO;

  // ICMS / ISS (estimativas — podem ser refinados por UF/município)
  const icms = receitaComercio * ALIQUOTA_ICMS_PADRAO;
  const iss = receitaServicos * ALIQUOTA_ISS_PADRAO;

  // CPP (INSS patronal sobre folha) — 20% se houver folha
  const cpp = (params.folhaAnual || 0) * 0.20;

  const totalTributos = irpj + csll + pis + cofins + icms + iss + cpp;

  observacoes.push(
    `Presunção IRPJ: 8% comércio / 32% serviços.`,
    `PIS/COFINS cumulativo (sem créditos): ${(ALIQUOTA_PIS_CUMULATIVO * 100).toFixed(2)}% + ${(ALIQUOTA_COFINS_CUMULATIVO * 100).toFixed(2)}%.`,
    irpjAdicional > 0
      ? `Adicional de IRPJ aplicado sobre base que excede R$ 240 mil/ano.`
      : 'Sem adicional de IRPJ (base anual ≤ R$ 240 mil).',
  );

  return {
    regime: 'lucro_presumido',
    nome: 'Lucro Presumido',
    elegivel: true,
    irpj, csll, pis, cofins, cpp,
    icms, iss,
    cbs: 0, ibs: 0,
    totalTributos,
    cargaEfetiva: (totalTributos / faturamentoAnual) * 100,
    observacoes,
  };
}
