import { REGIMES_ESPECIAIS } from '@/types/reforma-tributaria';
import { obterAliquotasTransicao } from './regras';
import type { DadosCredito, ResultadoCredito } from './types';

/**
 * Calcula créditos tributários de IBS/CBS.
 * Na reforma, há não-cumulatividade plena (crédito de todas as aquisições).
 */
export function calcularCreditos(dados: DadosCredito): ResultadoCredito {
  const anoReferencia = dados.anoReferencia || new Date().getFullYear();
  const aliquotas = obterAliquotasTransicao(anoReferencia);
  const restricoes: string[] = [];

  let aliquotaCBSCredito = aliquotas.cbs;
  let aliquotaIBSCredito = aliquotas.ibs;

  if (dados.regimeEspecial && dados.regimeEspecial !== 'nenhum') {
    const config = REGIMES_ESPECIAIS.find((r) => r.regime === dados.regimeEspecial);

    if (config && !config.creditoIntegralMantido) {
      aliquotaCBSCredito *= (100 - config.reducaoAliquotaCBS) / 100;
      aliquotaIBSCredito *= (100 - config.reducaoAliquotaIBS) / 100;
      restricoes.push(`Crédito proporcional ao regime especial: ${config.descricao}`);
    }
  }

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
