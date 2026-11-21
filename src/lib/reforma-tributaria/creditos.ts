import { obterAliquotasTransicao } from './regras';
import type { DadosCredito, ResultadoCredito } from './types';

/**
 * Calcula créditos tributários de IBS/CBS.
 *
 * Etapa 27 — art. 28 LC 214/2025 (não-cumulatividade plena):
 * - Crédito calculado pelas alíquotas do ano de referência da AQUISIÇÃO,
 *   não do fornecedor nem do ano corrente.
 * - Regimes especiais reduzem alíquota na saída do fornecedor, mas NÃO
 *   reduzem o crédito do tomador (lei não prevê proporcionalidade no tomador).
 * - naoCumulatividadePlena sempre true: a lei garante crédito de todas as
 *   aquisições, sem restrição por natureza do bem ou serviço.
 */
export function calcularCreditos(dados: DadosCredito): ResultadoCredito {
  const anoReferencia = dados.anoReferencia ?? new Date().getFullYear();
  const aliquotas = obterAliquotasTransicao(anoReferencia);
  const restricoes: string[] = [];

  // Alíquotas do ano da aquisição — base do crédito (art. 28 LC 214/2025)
  const aliquotaCBSCredito = aliquotas.cbs;
  const aliquotaIBSCredito = aliquotas.ibs;

  const creditoCBS = dados.valorAquisicao * (aliquotaCBSCredito / 100);
  const creditoIBS = dados.valorAquisicao * (aliquotaIBSCredito / 100);

  return {
    creditoCBS,
    creditoIBS,
    creditoTotal: creditoCBS + creditoIBS,
    aliquotaCBSCredito,
    aliquotaIBSCredito,
    naoCumulatividadePlena: true,
    restricoes,
  };
}
