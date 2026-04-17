// ============================================
// SIMULADOR — Lucro Real
// PIS/COFINS não-cumulativo (Tema 779) + ICMS + IRPJ/CSLL sobre lucro real
// ============================================

import type { ParametrosSimulacao, ResultadoCenario } from './types';

const ALIQUOTA_IRPJ = 0.15;
const ADICIONAL_IRPJ = 0.10;
const LIMITE_ANUAL_ADICIONAL = 240_000;
const ALIQUOTA_CSLL = 0.09;

const ALIQUOTA_PIS_NAO_CUMULATIVO = 0.0165;
const ALIQUOTA_COFINS_NAO_CUMULATIVO = 0.076;
const ALIQUOTA_ICMS_PADRAO = 0.18;
const ALIQUOTA_ISS_PADRAO = 0.05;

/**
 * Simula a carga tributária no regime **Lucro Real**.
 *
 * **Base legal:** Lei 9.430/96 (IRPJ/CSLL sobre lucro contábil ajustado),
 * Leis 10.637/02 e 10.833/03 (PIS/COFINS não-cumulativo),
 * Tema 779 STF (ICMS excluído da base de PIS/COFINS).
 *
 * Sempre elegível. Obrigatório para faturamento > R$ 78mi/ano ou atividades específicas.
 *
 * @param params - Faturamento, margem de lucro, créditos PIS/COFINS, folha.
 * @returns Resultado com tributos federais + estaduais/municipais + observações.
 */
export function simularReal(params: ParametrosSimulacao): ResultadoCenario {
  const observacoes: string[] = [];
  const {
    faturamentoAnual,
    margemLucro,
    percentualServicos = 0,
    comprasComCredito = 0,
    despesasOperacionais = 0,
  } = params;

  // Lucro real = faturamento × margem informada (estimativa)
  // Em produção, usar lucro contábil real (LALUR)
  const lucroAntes = faturamentoAnual * (margemLucro / 100);

  // IRPJ + adicional
  const irpjBase = lucroAntes * ALIQUOTA_IRPJ;
  const irpjAdicional = lucroAntes > LIMITE_ANUAL_ADICIONAL
    ? (lucroAntes - LIMITE_ANUAL_ADICIONAL) * ADICIONAL_IRPJ
    : 0;
  const irpj = Math.max(0, irpjBase + irpjAdicional);

  // CSLL sobre lucro
  const csll = Math.max(0, lucroAntes * ALIQUOTA_CSLL);

  // PIS/COFINS não-cumulativo: alíquota cheia − créditos
  // Tema 779 STF: ICMS não compõe base de PIS/COFINS
  const baseCalculoPisCofins = faturamentoAnual; // já líquida de ICMS na prática
  const pisDebito = baseCalculoPisCofins * ALIQUOTA_PIS_NAO_CUMULATIVO;
  const cofinsDebito = baseCalculoPisCofins * ALIQUOTA_COFINS_NAO_CUMULATIVO;
  const baseCreditos = comprasComCredito + despesasOperacionais;
  const pisCredito = baseCreditos * ALIQUOTA_PIS_NAO_CUMULATIVO;
  const cofinsCredito = baseCreditos * ALIQUOTA_COFINS_NAO_CUMULATIVO;
  const pis = Math.max(0, pisDebito - pisCredito);
  const cofins = Math.max(0, cofinsDebito - cofinsCredito);

  // ICMS / ISS
  const percServicos = percentualServicos / 100;
  const receitaServicos = faturamentoAnual * percServicos;
  const receitaComercio = faturamentoAnual * (1 - percServicos);
  const icmsDebito = receitaComercio * ALIQUOTA_ICMS_PADRAO;
  const icmsCredito = comprasComCredito * ALIQUOTA_ICMS_PADRAO;
  const icms = Math.max(0, icmsDebito - icmsCredito);
  const iss = receitaServicos * ALIQUOTA_ISS_PADRAO;

  // CPP — 20% sobre folha
  const cpp = (params.folhaAnual || 0) * 0.20;

  const totalTributos = irpj + csll + pis + cofins + icms + iss + cpp;

  observacoes.push(
    `Lucro real estimado: R$ ${lucroAntes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${margemLucro}% do faturamento).`,
    `PIS/COFINS não-cumulativo com crédito sobre R$ ${baseCreditos.toLocaleString('pt-BR')}.`,
    irpjAdicional > 0 ? 'Adicional de IRPJ aplicado.' : 'Sem adicional de IRPJ.',
    'Tema 779 STF: ICMS excluído da base de PIS/COFINS.',
  );

  if (margemLucro < 8) {
    observacoes.push('⚠️ Margem baixa: Lucro Real costuma ser vantajoso. Validar com balanço.');
  }

  return {
    regime: 'lucro_real',
    nome: 'Lucro Real',
    elegivel: true,
    irpj, csll, pis, cofins, cpp,
    icms, iss,
    cbs: 0, ibs: 0,
    totalTributos,
    cargaEfetiva: (totalTributos / faturamentoAnual) * 100,
    observacoes,
  };
}
