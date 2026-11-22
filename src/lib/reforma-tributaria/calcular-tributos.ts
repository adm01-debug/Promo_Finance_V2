import { arredondar } from './arredondamento';
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

  // Etapa 25: arredondar conforme ABNT NBR 5891 (banker's rounding) — NT 2025.002
  const valorCBS = arredondar(valorBase * (aliquotaCBS / 100));
  const valorIBS = arredondar(valorBase * (aliquotaIBS / 100));
  const { ibsUf, ibsMun } = aliquotasTransicao;
  const fracaoUf = ibsUf + ibsMun > 0 ? ibsUf / (ibsUf + ibsMun) : 0.5;
  const aliquotaIBSEstadual = aliquotaIBS * fracaoUf;
  const aliquotaIBSMunicipal = aliquotaIBS * (1 - fracaoUf);

  const aliquotaIS = obterAliquotaIS(dados.categoriaIS, dados.aliquotaISCustomizada);
  const valorIS = valorBase * (aliquotaIS / 100);

  if (aliquotaIS > 0) {
    const isConfig = CONFIGURACOES_IS.find((c) => c.categoria === dados.categoriaIS);
    detalhamento.push(`Imposto Seletivo aplicado: ${isConfig?.descricao} - ${aliquotaIS}%`);
  }

  const totalTributosNovos = valorCBS + valorIBS + valorIS;

  // Etapa 22: alíquotas dos tributos antigos parametrizáveis por operação (DadosOperacao)
  const aliquotaICMSBase = dados.aliquotaICMS ?? 18;
  const aliquotaISSBase = dados.aliquotaISS ?? 5;
  const aliquotaPISBase = dados.aliquotaPIS ?? 1.65;
  const aliquotaCOFINSBase = dados.aliquotaCOFINS ?? 7.6;

  const icmsResidual =
    dados.tipoOperacao === 'venda'
      ? valorBase * (aliquotaICMSBase / 100) * (aliquotasTransicao.icmsResidual / 100)
      : 0;

  const issResidual =
    dados.tipoOperacao === 'servico_prestado'
      ? valorBase * (aliquotaISSBase / 100) * (aliquotasTransicao.issResidual / 100)
      : 0;

  const pisResidual = valorBase * (aliquotaPISBase / 100) * (aliquotasTransicao.pisResidual / 100);
  const cofinsResidual =
    valorBase * (aliquotaCOFINSBase / 100) * (aliquotasTransicao.cofinsResidual / 100);

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

  const totalTributos = totalTributosNovos + totalTributosAntigos;
  const cargaTributariaPercentual = (totalTributos / valorBase) * 100;

  // arts. 31-35 LC 214/2025: split payment desligado até ato conjunto CMN/BACEN
  const valorSplitPaymentCBS = 0;
  const valorSplitPaymentIBS = 0;
  const valorTotalSplitPayment = 0;

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
