// ============================================
// CALCULADORA DE TRIBUTOS - REFORMA TRIBUTÁRIA
// Engine de cálculo para IBS, CBS e IS
// ============================================

import {
  TipoTributoNovo,
  FaseTransicao,
  CategoriaIS,
  RegimeEspecial,
  TipoOperacao,
  AliquotasTransicao,
  ALIQUOTAS_TRANSICAO,
  ALIQUOTA_CBS_REFERENCIA,
  ALIQUOTA_IBS_REFERENCIA,
  CONFIGURACOES_IS,
  REGIMES_ESPECIAIS,
} from '@/types/reforma-tributaria';

// ========================
// TIPOS DE ENTRADA
// ========================

export interface DadosOperacao {
  valorOperacao: number;
  tipoOperacao: TipoOperacao;
  ufOrigem: string;
  ufDestino: string;
  municipioDestino?: string;
  ncm?: string;
  cfop: string;
  regimeEspecial?: RegimeEspecial;
  categoriaIS?: CategoriaIS;
  aliquotaISCustomizada?: number;
  isExportacao?: boolean;
  isImportacao?: boolean;
}

export interface ResultadoCalculo {
  valorBase: number;
  
  // CBS
  aliquotaCBS: number;
  valorCBS: number;
  
  // IBS
  aliquotaIBS: number;
  valorIBS: number;
  aliquotaIBSEstadual: number;
  aliquotaIBSMunicipal: number;
  
  // IS
  aliquotaIS: number;
  valorIS: number;
  
  // Totais
  totalTributosNovos: number;
  cargaTributariaPercentual: number;
  
  // Transição
  icmsResidual: number;
  issResidual: number;
  pisResidual: number;
  cofinsResidual: number;
  totalTributosAntigos: number;
  
  // Valores finais
  valorLiquido: number;
  valorSplitPaymentCBS: number;
  valorSplitPaymentIBS: number;
  valorTotalSplitPayment: number;
  
  // Metadados
  faseTransicao: FaseTransicao;
  anoCalculo: number;
  detalhamento: string[];
}

// ========================
// FUNÇÕES AUXILIARES
// ========================

/**
 * Determina a fase de transição baseada no ano
 */
export function determinarFaseTransicao(ano: number): FaseTransicao {
  if (ano <= 2025) return '2026_teste';
  if (ano === 2026) return '2026_teste';
  if (ano === 2027) return '2027_cbs_plena';
  if (ano === 2028) return '2028_cbs_plena';
  if (ano === 2029) return '2029_transicao';
  if (ano === 2030) return '2030_transicao';
  if (ano === 2031) return '2031_transicao';
  if (ano === 2032) return '2032_transicao';
  return '2033_pleno';
}

/**
 * Obtém as alíquotas de transição para um ano específico
 */
export function obterAliquotasTransicao(ano: number): AliquotasTransicao {
  const aliquotas = ALIQUOTAS_TRANSICAO.find(a => a.ano === ano);
  if (aliquotas) return aliquotas;
  
  // Se ano > 2033, usa alíquotas plenas
  if (ano > 2033) {
    return {
      ano,
      cbs: ALIQUOTA_CBS_REFERENCIA,
      ibs: ALIQUOTA_IBS_REFERENCIA,
      icmsResidual: 0,
      issResidual: 0,
      pisResidual: 0,
      cofinsResidual: 0,
    };
  }
  
  // Se ano < 2026, retorna zerado (reforma não iniciada)
  return {
    ano,
    cbs: 0,
    ibs: 0,
    icmsResidual: 100,
    issResidual: 100,
    pisResidual: 100,
    cofinsResidual: 100,
  };
}

/**
 * Aplica reduções de regime especial
 */
export function aplicarRegimeEspecial(
  aliquotaCBS: number,
  aliquotaIBS: number,
  regime?: RegimeEspecial
): { cbs: number; ibs: number } {
  if (!regime || regime === 'nenhum') {
    return { cbs: aliquotaCBS, ibs: aliquotaIBS };
  }
  
  const config = REGIMES_ESPECIAIS.find(r => r.regime === regime);
  if (!config) {
    return { cbs: aliquotaCBS, ibs: aliquotaIBS };
  }
  
  const reducaoCBS = (100 - config.reducaoAliquotaCBS) / 100;
  const reducaoIBS = (100 - config.reducaoAliquotaIBS) / 100;
  
  return {
    cbs: aliquotaCBS * reducaoCBS,
    ibs: aliquotaIBS * reducaoIBS,
  };
}

/**
 * Obtém alíquota do Imposto Seletivo
 */
export function obterAliquotaIS(categoria?: CategoriaIS, aliquotaCustom?: number): number {
  if (aliquotaCustom !== undefined) return aliquotaCustom;
  if (!categoria) return 0;
  
  const config = CONFIGURACOES_IS.find(c => c.categoria === categoria);
  return config?.aliquotaBase || 0;
}

/**
 * Verifica se operação é isenta/imune
 */
export function verificarIsencao(dados: DadosOperacao): { isento: boolean; motivo?: string } {
  // Exportações são isentas
  if (dados.isExportacao) {
    return { isento: true, motivo: 'Exportação - Imunidade constitucional' };
  }
  
  // Verificar CFOP de exportação
  const cfopsExportacao = ['7101', '7102', '7127', '7501', '7949'];
  if (cfopsExportacao.some(c => dados.cfop.startsWith(c.substring(0, 1)) && dados.cfop.length === 4 && dados.cfop.startsWith('7'))) {
    return { isento: true, motivo: 'Exportação identificada pelo CFOP' };
  }
  
  return { isento: false };
}

// ========================
// CALCULADORA PRINCIPAL
// ========================

/**
 * Calcula todos os tributos da Reforma Tributária
 */
export function calcularTributosReforma(
  dados: DadosOperacao,
  anoReferencia: number = new Date().getFullYear()
): ResultadoCalculo {
  const detalhamento: string[] = [];
  const aliquotasTransicao = obterAliquotasTransicao(anoReferencia);
  const faseTransicao = determinarFaseTransicao(anoReferencia);
  
  // Verificar isenção
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
  
  // Base de cálculo (por dentro no IVA dual)
  const valorBase = dados.valorOperacao;
  detalhamento.push(`Base de cálculo: R$ ${valorBase.toFixed(2)}`);
  
  // Alíquotas base CBS e IBS
  let aliquotaCBS = aliquotasTransicao.cbs;
  let aliquotaIBS = aliquotasTransicao.ibs;
  
  detalhamento.push(`Fase de transição: ${faseTransicao}`);
  detalhamento.push(`Alíquota CBS base: ${aliquotaCBS}%`);
  detalhamento.push(`Alíquota IBS base: ${aliquotaIBS}%`);
  
  // Aplicar regime especial se houver
  if (dados.regimeEspecial && dados.regimeEspecial !== 'nenhum') {
    const reducoes = aplicarRegimeEspecial(aliquotaCBS, aliquotaIBS, dados.regimeEspecial);
    aliquotaCBS = reducoes.cbs;
    aliquotaIBS = reducoes.ibs;
    
    const regimeConfig = REGIMES_ESPECIAIS.find(r => r.regime === dados.regimeEspecial);
    detalhamento.push(`Regime especial aplicado: ${regimeConfig?.descricao}`);
    detalhamento.push(`Alíquota CBS após redução: ${aliquotaCBS.toFixed(2)}%`);
    detalhamento.push(`Alíquota IBS após redução: ${aliquotaIBS.toFixed(2)}%`);
  }
  
  // Cálculo CBS e IBS
  const valorCBS = valorBase * (aliquotaCBS / 100);
  const valorIBS = valorBase * (aliquotaIBS / 100);
  
  // Distribuição IBS (aproximada: 75% estados, 25% municípios)
  const aliquotaIBSEstadual = aliquotaIBS * 0.75;
  const aliquotaIBSMunicipal = aliquotaIBS * 0.25;
  
  // Imposto Seletivo
  const aliquotaIS = obterAliquotaIS(dados.categoriaIS, dados.aliquotaISCustomizada);
  const valorIS = valorBase * (aliquotaIS / 100);
  
  if (aliquotaIS > 0) {
    const isConfig = CONFIGURACOES_IS.find(c => c.categoria === dados.categoriaIS);
    detalhamento.push(`Imposto Seletivo aplicado: ${isConfig?.descricao} - ${aliquotaIS}%`);
  }
  
  // Total tributos novos
  const totalTributosNovos = valorCBS + valorIBS + valorIS;
  
  // Tributos antigos residuais (período de transição)
  // Usando alíquotas hipotéticas para demonstração
  const aliquotaICMSBase = 18; // Média ICMS
  const aliquotaISSBase = 5; // Média ISS (serviços)
  const aliquotaPISBase = 1.65;
  const aliquotaCOFINSBase = 7.6;
  
  const icmsResidual = dados.tipoOperacao === 'venda' 
    ? valorBase * (aliquotaICMSBase / 100) * (aliquotasTransicao.icmsResidual / 100)
    : 0;
  
  const issResidual = dados.tipoOperacao === 'servico_prestado'
    ? valorBase * (aliquotaISSBase / 100) * (aliquotasTransicao.issResidual / 100)
    : 0;
  
  const pisResidual = valorBase * (aliquotaPISBase / 100) * (aliquotasTransicao.pisResidual / 100);
  const cofinsResidual = valorBase * (aliquotaCOFINSBase / 100) * (aliquotasTransicao.cofinsResidual / 100);
  
  const totalTributosAntigos = icmsResidual + issResidual + pisResidual + cofinsResidual;
  
  if (totalTributosAntigos > 0) {
    detalhamento.push(`Tributos residuais (transição): R$ ${totalTributosAntigos.toFixed(2)}`);
    if (aliquotasTransicao.icmsResidual > 0) {
      detalhamento.push(`  - ICMS residual (${aliquotasTransicao.icmsResidual}%): R$ ${icmsResidual.toFixed(2)}`);
    }
    if (aliquotasTransicao.pisResidual > 0) {
      detalhamento.push(`  - PIS residual: R$ ${pisResidual.toFixed(2)}`);
      detalhamento.push(`  - COFINS residual: R$ ${cofinsResidual.toFixed(2)}`);
    }
  }
  
  // Carga tributária total
  const totalTributos = totalTributosNovos + totalTributosAntigos;
  const cargaTributariaPercentual = (totalTributos / valorBase) * 100;
  
  // Split Payment (aplicável a partir de 2026 para CBS, 2027 para IBS completo)
  // O split payment retém automaticamente os tributos no momento do pagamento
  const valorSplitPaymentCBS = anoReferencia >= 2026 ? valorCBS : 0;
  const valorSplitPaymentIBS = anoReferencia >= 2029 ? valorIBS : 0; // IBS começa a subir em 2029
  const valorTotalSplitPayment = valorSplitPaymentCBS + valorSplitPaymentIBS;
  
  // Valor líquido (após impostos)
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

// ========================
// CÁLCULO DE CRÉDITOS
// ========================

export interface DadosCredito {
  valorAquisicao: number;
  tipoOperacao: 'compra' | 'servico_tomado' | 'importacao';
  regimeEspecial?: RegimeEspecial;
  anoReferencia?: number;
}

export interface ResultadoCredito {
  creditoCBS: number;
  creditoIBS: number;
  creditoTotal: number;
  aliquotaCBSCredito: number;
  aliquotaIBSCredito: number;
  naoCumulatividadePlena: boolean;
  restricoes: string[];
}

/**
 * Calcula créditos tributários de IBS/CBS
 * Na reforma, há não-cumulatividade plena (crédito de todas as aquisições)
 */
export function calcularCreditos(dados: DadosCredito): ResultadoCredito {
  const anoReferencia = dados.anoReferencia || new Date().getFullYear();
  const aliquotas = obterAliquotasTransicao(anoReferencia);
  const restricoes: string[] = [];
  
  let aliquotaCBSCredito = aliquotas.cbs;
  let aliquotaIBSCredito = aliquotas.ibs;
  
  // Aplicar reduções de regime especial (crédito proporcional)
  if (dados.regimeEspecial && dados.regimeEspecial !== 'nenhum') {
    const config = REGIMES_ESPECIAIS.find(r => r.regime === dados.regimeEspecial);
    
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

// ========================
// SIMULADOR COMPARATIVO
// ========================

export interface DadosSimulacao {
  faturamentoAnual: number;
  comprasAnual: number;
  servicosTomadosAnual: number;
  percentualVendas: number; // % do faturamento em vendas de produtos
  percentualServicos: number; // % do faturamento em serviços
  regimeEspecial?: RegimeEspecial;
  temProdutosIS?: boolean;
  categoriaIS?: CategoriaIS;
}

export interface ResultadoSimulacao {
  // Sistema Antigo
  icmsAntigo: number;
  issAntigo: number;
  pisAntigo: number;
  cofinsAntigo: number;
  totalAntigo: number;
  cargaAntigaPercentual: number;
  
  // Sistema Novo
  cbsNovo: number;
  ibsNovo: number;
  isNovo: number;
  totalNovo: number;
  cargaNovaPercentual: number;
  
  // Créditos
  creditosCBSRecuperaveis: number;
  creditosIBSRecuperaveis: number;
  creditosTotalRecuperaveis: number;
  
  // Comparativo
  diferencaAbsoluta: number;
  diferencaPercentual: number;
  impacto: 'economia' | 'aumento' | 'neutro';
  
  // Análise
  observacoes: string[];
}

/**
 * Simula comparação entre sistema antigo e novo
 */
export function simularComparativo(dados: DadosSimulacao, anoSimulacao: number = 2033): ResultadoSimulacao {
  const observacoes: string[] = [];
  
  // === SISTEMA ANTIGO ===
  const faturamentoVendas = dados.faturamentoAnual * (dados.percentualVendas / 100);
  const faturamentoServicos = dados.faturamentoAnual * (dados.percentualServicos / 100);
  
  // ICMS sobre vendas (média 18%)
  const icmsAntigo = faturamentoVendas * 0.18;
  
  // ISS sobre serviços (média 5%)
  const issAntigo = faturamentoServicos * 0.05;
  
  // PIS/COFINS cumulativo vs não-cumulativo
  // Lucro Real: PIS 1.65% + COFINS 7.6% não-cumulativo
  const pisAntigoDebito = dados.faturamentoAnual * 0.0165;
  const cofinsAntigoDebito = dados.faturamentoAnual * 0.076;
  
  // Créditos PIS/COFINS (sobre compras e serviços)
  const baseCreditos = dados.comprasAnual + dados.servicosTomadosAnual;
  const pisCreditoAntigo = baseCreditos * 0.0165;
  const cofinsCreditoAntigo = baseCreditos * 0.076;
  
  const pisAntigo = Math.max(0, pisAntigoDebito - pisCreditoAntigo);
  const cofinsAntigo = Math.max(0, cofinsAntigoDebito - cofinsCreditoAntigo);
  
  const totalAntigo = icmsAntigo + issAntigo + pisAntigo + cofinsAntigo;
  const cargaAntigaPercentual = (totalAntigo / dados.faturamentoAnual) * 100;
  
  // === SISTEMA NOVO ===
  const aliquotas = obterAliquotasTransicao(anoSimulacao);
  
  // Aplicar regime especial
  let aliquotaCBS = aliquotas.cbs;
  let aliquotaIBS = aliquotas.ibs;
  
  if (dados.regimeEspecial && dados.regimeEspecial !== 'nenhum') {
    const reducoes = aplicarRegimeEspecial(aliquotaCBS, aliquotaIBS, dados.regimeEspecial);
    aliquotaCBS = reducoes.cbs;
    aliquotaIBS = reducoes.ibs;
    
    const regime = REGIMES_ESPECIAIS.find(r => r.regime === dados.regimeEspecial);
    observacoes.push(`Regime especial aplicado: ${regime?.descricao}`);
  }
  
  // CBS e IBS sobre faturamento
  const cbsDebito = dados.faturamentoAnual * (aliquotaCBS / 100);
  const ibsDebito = dados.faturamentoAnual * (aliquotaIBS / 100);
  
  // Créditos CBS e IBS (não-cumulatividade plena)
  const creditosCBS = (dados.comprasAnual + dados.servicosTomadosAnual) * (aliquotaCBS / 100);
  const creditosIBS = (dados.comprasAnual + dados.servicosTomadosAnual) * (aliquotaIBS / 100);
  
  const cbsNovo = Math.max(0, cbsDebito - creditosCBS);
  const ibsNovo = Math.max(0, ibsDebito - creditosIBS);
  
  // Imposto Seletivo
  let isNovo = 0;
  if (dados.temProdutosIS && dados.categoriaIS) {
    const aliquotaIS = obterAliquotaIS(dados.categoriaIS);
    isNovo = faturamentoVendas * (aliquotaIS / 100) * 0.2; // Estimativa 20% do faturamento sujeito a IS
    observacoes.push(`Imposto Seletivo aplicado: ${aliquotaIS}%`);
  }
  
  const totalNovo = cbsNovo + ibsNovo + isNovo;
  const cargaNovaPercentual = (totalNovo / dados.faturamentoAnual) * 100;
  
  // === COMPARATIVO ===
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
  
  // Benefícios da não-cumulatividade
  const creditosTotalRecuperaveis = creditosCBS + creditosIBS;
  const creditosAntigoTotal = pisCreditoAntigo + cofinsCreditoAntigo;
  
  if (creditosTotalRecuperaveis > creditosAntigoTotal) {
    observacoes.push(`Créditos recuperáveis aumentam em R$ ${(creditosTotalRecuperaveis - creditosAntigoTotal).toFixed(2)}`);
  }
  
  observacoes.push(`Não-cumulatividade plena: crédito de 100% das aquisições tributadas`);
  observacoes.push(`Split Payment: recolhimento automático reduz inadimplência tributária`);
  
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
