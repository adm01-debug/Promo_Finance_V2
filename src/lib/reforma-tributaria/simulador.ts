import { REGIMES_ESPECIAIS } from '@/types/reforma-tributaria';
import { aplicarRegimeEspecial, obterAliquotaIS, obterAliquotasTransicao } from './regras';
import type { DadosSimulacao, ResultadoSimulacao } from './types';

/** Simula comparação entre sistema antigo e novo */
export function simularComparativo(
  dados: DadosSimulacao,
  anoSimulacao: number = 2033,
): ResultadoSimulacao {
  const observacoes: string[] = [];

  // === SISTEMA ANTIGO ===
  const faturamentoVendas = dados.faturamentoAnual * (dados.percentualVendas / 100);
  const faturamentoServicos = dados.faturamentoAnual * (dados.percentualServicos / 100);

  const icmsAntigo = faturamentoVendas * 0.18;
  const issAntigo = faturamentoServicos * 0.05;

  const pisAntigoDebito = dados.faturamentoAnual * 0.0165;
  const cofinsAntigoDebito = dados.faturamentoAnual * 0.076;

  const baseCreditos = dados.comprasAnual + dados.servicosTomadosAnual;
  const pisCreditoAntigo = baseCreditos * 0.0165;
  const cofinsCreditoAntigo = baseCreditos * 0.076;

  const pisAntigo = Math.max(0, pisAntigoDebito - pisCreditoAntigo);
  const cofinsAntigo = Math.max(0, cofinsAntigoDebito - cofinsCreditoAntigo);

  const totalAntigo = icmsAntigo + issAntigo + pisAntigo + cofinsAntigo;
  const cargaAntigaPercentual = (totalAntigo / dados.faturamentoAnual) * 100;

  // === SISTEMA NOVO ===
  const aliquotas = obterAliquotasTransicao(anoSimulacao);

  let aliquotaCBS = aliquotas.cbs;
  let aliquotaIBS = aliquotas.ibs;

  if (dados.regimeEspecial && dados.regimeEspecial !== 'nenhum') {
    const reducoes = aplicarRegimeEspecial(aliquotaCBS, aliquotaIBS, dados.regimeEspecial);
    aliquotaCBS = reducoes.cbs;
    aliquotaIBS = reducoes.ibs;

    const regime = REGIMES_ESPECIAIS.find((r) => r.regime === dados.regimeEspecial);
    observacoes.push(`Regime especial aplicado: ${regime?.descricao}`);
  }

  const cbsDebito = dados.faturamentoAnual * (aliquotaCBS / 100);
  const ibsDebito = dados.faturamentoAnual * (aliquotaIBS / 100);

  const creditosCBS = (dados.comprasAnual + dados.servicosTomadosAnual) * (aliquotaCBS / 100);
  const creditosIBS = (dados.comprasAnual + dados.servicosTomadosAnual) * (aliquotaIBS / 100);

  const cbsNovo = Math.max(0, cbsDebito - creditosCBS);
  const ibsNovo = Math.max(0, ibsDebito - creditosIBS);

  let isNovo = 0;
  if (dados.temProdutosIS && dados.categoriaIS) {
    const aliquotaIS = obterAliquotaIS(dados.categoriaIS);
    isNovo = faturamentoVendas * (aliquotaIS / 100) * 0.2;
    observacoes.push(`Imposto Seletivo aplicado: ${aliquotaIS}%`);
  }

  const totalNovo = cbsNovo + ibsNovo + isNovo;
  const cargaNovaPercentual = (totalNovo / dados.faturamentoAnual) * 100;

  const diferencaAbsoluta = totalNovo - totalAntigo;
  const diferencaPercentual = ((totalNovo - totalAntigo) / totalAntigo) * 100;

  let impacto: 'economia' | 'aumento' | 'neutro';
  if (diferencaAbsoluta < -100) {
    impacto = 'economia';
    observacoes.push(`Economia estimada de R$ ${Math.abs(diferencaAbsoluta).toFixed(2)}`);
  } else if (diferencaAbsoluta > 100) {
    impacto = 'aumento';
    observacoes.push(`Aumento estimado de R$ ${diferencaAbsoluta.toFixed(2)}`);
  } else {
    impacto = 'neutro';
    observacoes.push('Impacto neutro na carga tributária');
  }

  const creditosTotalRecuperaveis = creditosCBS + creditosIBS;
  const creditosAntigoTotal = pisCreditoAntigo + cofinsCreditoAntigo;

  if (creditosTotalRecuperaveis > creditosAntigoTotal) {
    observacoes.push(
      `Créditos recuperáveis aumentam em R$ ${(creditosTotalRecuperaveis - creditosAntigoTotal).toFixed(2)}`,
    );
  }

  observacoes.push('Não-cumulatividade plena: crédito de 100% das aquisições tributadas');
  observacoes.push('Split Payment: recolhimento automático reduz inadimplência tributária');

  return {
    icmsAntigo,
    issAntigo,
    pisAntigo,
    cofinsAntigo,
    totalAntigo,
    cargaAntigaPercentual,
    cbsNovo,
    ibsNovo,
    isNovo,
    totalNovo,
    cargaNovaPercentual,
    creditosCBSRecuperaveis: creditosCBS,
    creditosIBSRecuperaveis: creditosIBS,
    creditosTotalRecuperaveis,
    diferencaAbsoluta,
    diferencaPercentual,
    impacto,
    observacoes,
  };
}
