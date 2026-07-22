import { CONFIGURACOES_IS, REGIMES_ESPECIAIS } from '@/types/reforma-tributaria';
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
  anoReferencia: number = new Date().getFullYear(),
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

  const valorCBS = valorBase * (aliquotaCBS / 100);
  const valorIBS = valorBase * (aliquotaIBS / 100);
  const aliquotaIBSEstadual = aliquotaIBS * 0.75;
  const aliquotaIBSMunicipal = aliquotaIBS * 0.25;

  const aliquotaIS = obterAliquotaIS(dados.categoriaIS, dados.aliquotaISCustomizada);
  const valorIS = valorBase * (aliquotaIS / 100);

  if (aliquotaIS > 0) {
    const isConfig = CONFIGURACOES_IS.find((c) => c.categoria === dados.categoriaIS);
    detalhamento.push(`Imposto Seletivo aplicado: ${isConfig?.descricao} - ${aliquotaIS}%`);
  }

  const totalTributosNovos = valorCBS + valorIBS + valorIS;

  const aliquotaICMSBase = 18;
  const aliquotaISSBase = 5;
  const aliquotaPISBase = 1.65;
  const aliquotaCOFINSBase = 7.6;

  const icmsResidual =
    dados.tipoOperacao === 'venda'
      ? valorBase * (aliquotaICMSBase / 100) * (aliquotasTransicao.icmsResidual / 100)
      : 0;

  const issResidual =
    dados.tipoOperacao === 'servico_prestado'
      ? valorBase * (aliquotaISSBase / 100) * (aliquotasTransicao.issResidual / 100)
      : 0;

  const pisResidual =
    valorBase * (aliquotaPISBase / 100) * (aliquotasTransicao.pisResidual / 100);
  const cofinsResidual =
    valorBase * (aliquotaCOFINSBase / 100) * (aliquotasTransicao.cofinsResidual / 100);

  const totalTributosAntigos = icmsResidual + issResidual + pisResidual + cofinsResidual;

  if (totalTributosAntigos > 0) {
    detalhamento.push(`Tributos residuais (transição): R$ ${totalTributosAntigos.toFixed(2)}`);
    if (aliquotasTransicao.icmsResidual > 0) {
      detalhamento.push(
        `  - ICMS residual (${aliquotasTransicao.icmsResidual}%): R$ ${icmsResidual.toFixed(2)}`,
      );
    }
    if (aliquotasTransicao.pisResidual > 0) {
      detalhamento.push(`  - PIS residual: R$ ${pisResidual.toFixed(2)}`);
      detalhamento.push(`  - COFINS residual: R$ ${cofinsResidual.toFixed(2)}`);
    }
  }

  const totalTributos = totalTributosNovos + totalTributosAntigos;
  const cargaTributariaPercentual = (totalTributos / valorBase) * 100;

  const valorSplitPaymentCBS = anoReferencia >= 2026 ? valorCBS : 0;
  const valorSplitPaymentIBS = anoReferencia >= 2029 ? valorIBS : 0;
  const valorTotalSplitPayment = valorSplitPaymentCBS + valorSplitPaymentIBS;

  const valorLiquido = valorBase - totalTributos;

  detalhamento.push(`Total tributos novos: R$ ${totalTributosNovos.toFixed(2)}`);
  detalhamento.push(`Carga tributária efetiva: ${cargaTributariaPercentual.toFixed(2)}%`);

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
