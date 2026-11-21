import { CONFIGURACOES_IS, REGIMES_ESPECIAIS } from '@/types/reforma-tributaria';
import {
  aplicarRegimeEspecial,
  determinarFaseTransicao,
  obterAliquotaIS,
  obterAliquotasTransicao,
  verificarIsencao,
} from './regras';
import { calcularComArredondamento } from './arredondamento';
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
    if (isencao.manutencaoCredito) {
      detalhamento.push('Manutenção de crédito CBS/IBS garantida (art. 65 LC 214/2025).');
    }
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

  // Etapa 25: arredondamento oficial ABNT NBR 5891 / NT 2025.002
  const valorCBS = calcularComArredondamento(valorBase, aliquotaCBS);
  const valorIBS = calcularComArredondamento(valorBase, aliquotaIBS);
  const { ibsUf, ibsMun } = aliquotasTransicao;
  const fracaoUf = ibsUf + ibsMun > 0 ? ibsUf / (ibsUf + ibsMun) : 0.5;
  const aliquotaIBSEstadual = aliquotaIBS * fracaoUf;
  const aliquotaIBSMunicipal = aliquotaIBS * (1 - fracaoUf);

  const aliquotaIS = obterAliquotaIS(dados.categoriaIS, dados.aliquotaISCustomizada);
  const valorIS = calcularComArredondamento(valorBase, aliquotaIS);

  if (aliquotaIS > 0) {
    const isConfig = CONFIGURACOES_IS.find((c) => c.categoria === dados.categoriaIS);
    detalhamento.push(`Imposto Seletivo aplicado: ${isConfig?.descricao} - ${aliquotaIS}%`);
  }

  // Etapa 19: 2026 — CBS e IBS compensáveis/dispensados (art. 348 LC 214/2025)
  // totalTributosNovos inclui CBS+IBS+IS, mas carga efetiva em 2026 exclui CBS/IBS
  const cbsIbsCompensavel = anoReferencia === 2026;
  const totalTributosNovos = valorCBS + valorIBS + valorIS;

  if (cbsIbsCompensavel) {
    detalhamento.push(
      'CBS e IBS: compensáveis/dispensados em 2026 (art. 348 LC 214/2025) — não compõem carga efetiva.'
    );
  }

  // Etapa 22: alíquotas dos tributos antigos vindas de DadosOperacao, com defaults históricos
  const aliquotaICMSBase = dados.aliquotaICMS ?? 18;
  const aliquotaISSBase = dados.aliquotaISS ?? 5;
  const aliquotaPISBase = dados.aliquotaPIS ?? 1.65;
  const aliquotaCOFINSBase = dados.aliquotaCOFINS ?? 7.6;

  // Alíquota efetiva residual = alíquota_antiga × fração_residual (ambos em %)
  const aliqIcmsEfetiva = (aliquotaICMSBase * aliquotasTransicao.icmsResidual) / 100;
  const aliqIssEfetiva = (aliquotaISSBase * aliquotasTransicao.issResidual) / 100;
  const aliqPisEfetiva = (aliquotaPISBase * aliquotasTransicao.pisResidual) / 100;
  const aliqCofinsEfetiva = (aliquotaCOFINSBase * aliquotasTransicao.cofinsResidual) / 100;

  const icmsResidual =
    dados.tipoOperacao === 'venda'
      ? calcularComArredondamento(valorBase, aliqIcmsEfetiva)
      : 0;

  const issResidual =
    dados.tipoOperacao === 'servico_prestado'
      ? calcularComArredondamento(valorBase, aliqIssEfetiva)
      : 0;

  const pisResidual = calcularComArredondamento(valorBase, aliqPisEfetiva);
  const cofinsResidual = calcularComArredondamento(valorBase, aliqCofinsEfetiva);

  const totalTributosAntigos = icmsResidual + issResidual + pisResidual + cofinsResidual;

  if (totalTributosAntigos > 0) {
    detalhamento.push(`Tributos residuais (transição): R$ ${totalTributosAntigos.toFixed(2)}`);
    if (aliquotasTransicao.icmsResidual > 0) {
      detalhamento.push(
        `  - ICMS residual (${aliquotasTransicao.icmsResidual}%): R$ ${icmsResidual.toFixed(2)}`
      );
    }
    if (aliquotasTransicao.pisResidual > 0) {
      detalhamento.push(`  - PIS residual: R$ ${pisResidual.toFixed(2)}`);
      detalhamento.push(`  - COFINS residual: R$ ${cofinsResidual.toFixed(2)}`);
    }
  }

  // Etapa 19: carga efetiva em 2026 = antigos + IS (CBS/IBS são compensáveis, não impactam)
  const cargaEfetiva = cbsIbsCompensavel
    ? totalTributosAntigos + valorIS
    : totalTributosNovos + totalTributosAntigos;

  const cargaTributariaPercentual = valorBase > 0 ? (cargaEfetiva / valorBase) * 100 : 0;

  // Etapa 28: split payment não vigente — aguarda ato conjunto CMN/BACEN (arts. 31-35 LC 214/2025)
  const valorSplitPaymentCBS = 0;
  const valorSplitPaymentIBS = 0;
  const valorTotalSplitPayment = 0;
  detalhamento.push(
    'Split payment: não vigente (arts. 31-35 LC 214/2025 — aguarda ato conjunto CMN/BACEN).'
  );

  const valorLiquido = valorBase - cargaEfetiva;

  detalhamento.push(`Total tributos novos (CBS+IBS+IS): R$ ${totalTributosNovos.toFixed(2)}`);
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
    cbsIbsCompensavel,
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
