import { CONFIGURACOES_IS, REGIMES_ESPECIAIS } from '@/types/reforma-tributaria';
import { calcularComArredondamento } from './arredondamento';
import {
  aplicarRegimeEspecial,
  determinarFaseTransicao,
  obterAliquotaIS,
  obterAliquotasTransicao,
  verificarIsencao,
} from './regras';
import type { DadosOperacao, ResultadoCalculo } from './types';

/** Calcula todos os tributos da Reforma Tributária */
export function calcularTributosReforma(
  dados: DadosOperacao,
  anoReferencia: number = new Date().getFullYear()
): ResultadoCalculo {
  const detalhamento: string[] = [];
  const aliquotasTransicao = obterAliquotasTransicao(anoReferencia);
  const faseTransicao = determinarFaseTransicao(anoReferencia);

  const isencao = verificarIsencao(dados);
  if (isencao.isento) {
    detalhamento.push(`Operação isenta: ${isencao.motivo}`);
    return {
      valorBase: dados.valorOperacao,
      aliquotaCBS: 0,
      valorCBS: 0,
      aliquotaIBS: 0,
      valorIBS: 0,
      aliquotaIBSEstadual: 0,
      aliquotaIBSMunicipal: 0,
      aliquotaIS: 0,
      valorIS: 0,
      totalTributosNovos: 0,
      cargaTributariaPercentual: 0,
      icmsResidual: 0,
      issResidual: 0,
      pisResidual: 0,
      cofinsResidual: 0,
      totalTributosAntigos: 0,
      valorLiquido: dados.valorOperacao,
      valorSplitPaymentCBS: 0,
      valorSplitPaymentIBS: 0,
      valorTotalSplitPayment: 0,
      faseTransicao,
      anoCalculo: anoReferencia,
      detalhamento,
    };
  }

  const valorBase = dados.valorOperacao;
  detalhamento.push(`Base de cálculo: R$ ${valorBase.toFixed(2)}`);

  let aliquotaCBS = aliquotasTransicao.cbs;
  let aliquotaIBS = aliquotasTransicao.ibs;

  detalhamento.push(`Fase de transição: ${faseTransicao}`);
  detalhamento.push(`Alíquota CBS base: ${aliquotaCBS}%`);
  detalhamento.push(`Alíquota IBS base: ${aliquotaIBS}%`);

  if (dados.regimeEspecial && dados.regimeEspecial !== 'nenhum') {
    const reducoes = aplicarRegimeEspecial(aliquotaCBS, aliquotaIBS, dados.regimeEspecial);
    aliquotaCBS = reducoes.cbs;
    aliquotaIBS = reducoes.ibs;
    const regimeConfig = REGIMES_ESPECIAIS.find((r) => r.regime === dados.regimeEspecial);
    detalhamento.push(`Regime especial aplicado: ${regimeConfig?.descricao}`);
    detalhamento.push(`Alíquota CBS após redução: ${aliquotaCBS.toFixed(2)}%`);
    detalhamento.push(`Alíquota IBS após redução: ${aliquotaIBS.toFixed(2)}%`);
  }

  const valorCBS = calcularComArredondamento(valorBase, aliquotaCBS);
  const valorIBS = calcularComArredondamento(valorBase, aliquotaIBS);
  const { ibsUf, ibsMun } = aliquotasTransicao;
  const fracaoUf = ibsUf + ibsMun > 0 ? ibsUf / (ibsUf + ibsMun) : 0.5;
  const aliquotaIBSEstadual = aliquotaIBS * fracaoUf;
  const aliquotaIBSMunicipal = aliquotaIBS * (1 - fracaoUf);

  const aliquotaIS = obterAliquotaIS(dados.categoriaIS, dados.aliquotaISCustomizada);
  const valorIS = calcularComArredondamento(valorBase, aliquotaIS);

  // Tributos antigos (regime transitório — percentuais residuais)
  const icmsResidual = valorBase * (aliquotasTransicao.icmsResidual / 100);
  const issResidual = valorBase * (aliquotasTransicao.issResidual / 100);
  const pisResidual = valorBase * (aliquotasTransicao.pisResidual / 100);
  const cofinsResidual = valorBase * (aliquotasTransicao.cofinsResidual / 100);
  const totalTributosAntigos = icmsResidual + issResidual + pisResidual + cofinsResidual;

  const totalTributosNovos = valorCBS + valorIBS + valorIS;
  const totalTributos = totalTributosNovos + totalTributosAntigos;
  const cargaTributariaPercentual = valorBase > 0 ? (totalTributos / valorBase) * 100 : 0;

  // Split payment desligado até ato conjunto CMN/BACEN (arts. 31-35 LC 214/2025)
  const valorSplitPaymentCBS = 0;
  const valorSplitPaymentIBS = 0;
  const valorTotalSplitPayment = 0;

  const valorLiquido = valorBase - totalTributos;

  detalhamento.push(`CBS calculado: R$ ${valorCBS.toFixed(2)} (${aliquotaCBS.toFixed(4)}%)`);
  detalhamento.push(`IBS calculado: R$ ${valorIBS.toFixed(2)} (${aliquotaIBS.toFixed(4)}%)`);
  if (valorIS > 0) detalhamento.push(`IS calculado: R$ ${valorIS.toFixed(2)} (${aliquotaIS}%)`);
  detalhamento.push(`Split payment: desligado (arts. 31-35 LC 214/2025)`);

  return {
    valorBase,
    aliquotaCBS,
    valorCBS,
    aliquotaIBS,
    valorIBS,
    aliquotaIBSEstadual,
    aliquotaIBSMunicipal,
    aliquotaIS,
    valorIS,
    totalTributosNovos,
    cargaTributariaPercentual,
    icmsResidual,
    issResidual,
    pisResidual,
    cofinsResidual,
    totalTributosAntigos,
    valorLiquido,
    valorSplitPaymentCBS,
    valorSplitPaymentIBS,
    valorTotalSplitPayment,
    faseTransicao,
    anoCalculo: anoReferencia,
    detalhamento,
  };
}
