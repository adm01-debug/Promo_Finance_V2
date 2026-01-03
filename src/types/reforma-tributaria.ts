// ============================================
// TIPOS DO SISTEMA CONTÁBIL - REFORMA TRIBUTÁRIA
// Baseado na LC 214/2025 e EC 132/2023
// Empresa: Lucro Real
// ============================================

// ========================
// ENUMS E CONSTANTES
// ========================

export type RegimeTributario = 'lucro_real' | 'lucro_presumido' | 'simples_nacional' | 'mei';

export type TipoTributoNovo = 'CBS' | 'IBS' | 'IS';
export type TipoTributoAntigo = 'ICMS' | 'ISS' | 'PIS' | 'COFINS' | 'IPI';

export type FaseTransicao = 
  | '2026_teste'      // CBS 0,9% + IBS 0,1%
  | '2027_cbs_plena'  // CBS plena
  | '2028_cbs_plena'  // CBS plena
  | '2029_transicao'  // 10% IBS, 90% ICMS/ISS
  | '2030_transicao'  // 25% IBS, 75% ICMS/ISS
  | '2031_transicao'  // 50% IBS, 50% ICMS/ISS
  | '2032_transicao'  // 75% IBS, 25% ICMS/ISS
  | '2033_pleno';     // 100% IBS

export type CategoriaIS = 
  | 'bebidas_alcoolicas'
  | 'bebidas_acucaradas'
  | 'produtos_fumigenos'
  | 'veiculos'
  | 'embarcacoes_aeronaves'
  | 'minerios'
  | 'combustiveis_fosseis'
  | 'concursos_prognosticos';

export type StatusCreditoTributario = 
  | 'disponivel'
  | 'utilizado'
  | 'compensado'
  | 'expirado'
  | 'estornado'
  | 'transferido';

export type TipoOperacao = 
  | 'venda'
  | 'compra'
  | 'servico_prestado'
  | 'servico_tomado'
  | 'importacao'
  | 'exportacao';

export type RegimeEspecial =
  | 'zona_franca_manaus'
  | 'combustiveis'
  | 'servicos_financeiros'
  | 'imobiliario'
  | 'hotelaria'
  | 'bares_restaurantes'
  | 'parques_diversao'
  | 'agencias_viagem'
  | 'transporte_coletivo'
  | 'sociedades_cooperativas'
  | 'nenhum';

// ========================
// ALÍQUOTAS DE TRANSIÇÃO
// ========================

export interface AliquotasTransicao {
  ano: number;
  cbs: number;
  ibs: number;
  icmsResidual: number;
  issResidual: number;
  pisResidual: number;
  cofinsResidual: number;
}

// Tabela oficial de alíquotas de transição (LC 214/2025)
export const ALIQUOTAS_TRANSICAO: AliquotasTransicao[] = [
  { ano: 2026, cbs: 0.9, ibs: 0.1, icmsResidual: 100, issResidual: 100, pisResidual: 100, cofinsResidual: 100 },
  { ano: 2027, cbs: 8.8, ibs: 0.1, icmsResidual: 100, issResidual: 100, pisResidual: 0, cofinsResidual: 0 },
  { ano: 2028, cbs: 8.8, ibs: 0.1, icmsResidual: 100, issResidual: 100, pisResidual: 0, cofinsResidual: 0 },
  { ano: 2029, cbs: 8.8, ibs: 1.78, icmsResidual: 90, issResidual: 90, pisResidual: 0, cofinsResidual: 0 },
  { ano: 2030, cbs: 8.8, ibs: 4.45, icmsResidual: 75, issResidual: 75, pisResidual: 0, cofinsResidual: 0 },
  { ano: 2031, cbs: 8.8, ibs: 8.9, icmsResidual: 50, issResidual: 50, pisResidual: 0, cofinsResidual: 0 },
  { ano: 2032, cbs: 8.8, ibs: 13.35, icmsResidual: 25, issResidual: 25, pisResidual: 0, cofinsResidual: 0 },
  { ano: 2033, cbs: 8.8, ibs: 17.7, icmsResidual: 0, issResidual: 0, pisResidual: 0, cofinsResidual: 0 },
];

// Alíquota de referência combinada (estimativa oficial ~26.5%)
export const ALIQUOTA_REFERENCIA_IVA_DUAL = 26.5;
export const ALIQUOTA_CBS_REFERENCIA = 8.8;
export const ALIQUOTA_IBS_REFERENCIA = 17.7;

// ========================
// IMPOSTO SELETIVO (IS)
// ========================

export interface ConfiguracaoIS {
  categoria: CategoriaIS;
  aliquotaBase: number;
  aliquotaMaxima: number;
  descricao: string;
  fundamentoLegal: string;
}

export const CONFIGURACOES_IS: ConfiguracaoIS[] = [
  { 
    categoria: 'bebidas_alcoolicas', 
    aliquotaBase: 20, 
    aliquotaMaxima: 35,
    descricao: 'Bebidas alcoólicas',
    fundamentoLegal: 'Art. 393 LC 214/2025'
  },
  { 
    categoria: 'bebidas_acucaradas', 
    aliquotaBase: 10, 
    aliquotaMaxima: 20,
    descricao: 'Bebidas açucaradas',
    fundamentoLegal: 'Art. 394 LC 214/2025'
  },
  { 
    categoria: 'produtos_fumigenos', 
    aliquotaBase: 25, 
    aliquotaMaxima: 50,
    descricao: 'Produtos fumígenos (cigarros, charutos)',
    fundamentoLegal: 'Art. 395 LC 214/2025'
  },
  { 
    categoria: 'veiculos', 
    aliquotaBase: 1, 
    aliquotaMaxima: 8,
    descricao: 'Veículos motorizados',
    fundamentoLegal: 'Art. 396 LC 214/2025'
  },
  { 
    categoria: 'embarcacoes_aeronaves', 
    aliquotaBase: 1, 
    aliquotaMaxima: 5,
    descricao: 'Embarcações e aeronaves',
    fundamentoLegal: 'Art. 397 LC 214/2025'
  },
  { 
    categoria: 'minerios', 
    aliquotaBase: 0.5, 
    aliquotaMaxima: 2,
    descricao: 'Extração de minérios',
    fundamentoLegal: 'Art. 398 LC 214/2025'
  },
  { 
    categoria: 'combustiveis_fosseis', 
    aliquotaBase: 5, 
    aliquotaMaxima: 15,
    descricao: 'Combustíveis fósseis',
    fundamentoLegal: 'Art. 399 LC 214/2025'
  },
  { 
    categoria: 'concursos_prognosticos', 
    aliquotaBase: 12, 
    aliquotaMaxima: 25,
    descricao: 'Loterias e apostas',
    fundamentoLegal: 'Art. 400 LC 214/2025'
  },
];

// ========================
// CRÉDITOS TRIBUTÁRIOS
// ========================

export interface CreditoTributario {
  id: string;
  empresaId: string;
  tipo: TipoTributoNovo;
  valor: number;
  valorUtilizado: number;
  valorDisponivel: number;
  dataOrigem: Date;
  dataVencimento?: Date;
  documentoOrigem: string;
  tipoDocumento: 'nfe' | 'nfse' | 'cte' | 'nfce' | 'importacao';
  fornecedorId?: string;
  fornecedorCnpj?: string;
  descricao: string;
  status: StatusCreditoTributario;
  operacaoId?: string;
  chaveAcesso?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaldoCreditosTributarios {
  cbsDisponivel: number;
  cbsUtilizado: number;
  cbsTotal: number;
  ibsDisponivel: number;
  ibsUtilizado: number;
  ibsTotal: number;
  creditosAVencer30Dias: number;
  creditosAVencer60Dias: number;
  creditosAVencer90Dias: number;
}

// ========================
// OPERAÇÕES TRIBUTÁVEIS
// ========================

export interface OperacaoTributavel {
  id: string;
  empresaId: string;
  tipo: TipoOperacao;
  data: Date;
  valorOperacao: number;
  valorBaseCalculo: number;
  
  // Tributos Novos (IBS/CBS)
  cbsDebito: number;
  cbsCredito: number;
  ibsDebito: number;
  ibsCredito: number;
  isValor: number;
  
  // Tributos Antigos (período de transição)
  icmsDebito?: number;
  icmsCredito?: number;
  issValor?: number;
  pisDebito?: number;
  pisCredito?: number;
  cofinsDebito?: number;
  cofinsCredito?: number;
  
  // Informações do documento
  documentoNumero: string;
  documentoTipo: 'nfe' | 'nfse' | 'cte' | 'nfce';
  chaveAcesso?: string;
  
  // Destinatário/Remetente
  cnpjParceiro: string;
  nomeParceiro: string;
  ufDestino: string;
  municipioDestino: string;
  
  // Classificação
  ncm?: string;
  cfop: string;
  regimeEspecial?: RegimeEspecial;
  categoriaIS?: CategoriaIS;
  
  // Split Payment
  splitPaymentAplicado: boolean;
  valorLiquidoRecebido?: number;
  valorRetidoSplitPayment?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// APURAÇÃO TRIBUTÁRIA
// ========================

export interface ApuracaoTributaria {
  id: string;
  empresaId: string;
  competencia: string; // YYYY-MM
  anoReferencia: number;
  faseTransicao: FaseTransicao;
  
  // CBS
  cbsDebitoTotal: number;
  cbsCreditoTotal: number;
  cbsAPagar: number;
  cbsCredorSaldo: number; // Saldo credor para compensar
  
  // IBS
  ibsDebitoTotal: number;
  ibsCreditoTotal: number;
  ibsAPagar: number;
  ibsCredorSaldo: number;
  
  // Imposto Seletivo
  isTotal: number;
  
  // Tributos Residuais (transição)
  icmsResidualAPagar: number;
  issResidualAPagar: number;
  pisResidualAPagar: number;
  cofinsResidualAPagar: number;
  
  // Split Payment
  valorRetidoSplitPayment: number;
  valorARecolherPosRetencao: number;
  
  // Totais
  totalTributosNovos: number;
  totalTributosAntigos: number;
  totalGeral: number;
  
  // Status
  status: 'aberta' | 'fechada' | 'retificada' | 'transmitida';
  dataFechamento?: Date;
  dataTransmissao?: Date;
  protocoloTransmissao?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// ========================
// SIMULAÇÃO E PLANEJAMENTO
// ========================

export interface SimulacaoTributaria {
  id: string;
  empresaId: string;
  nome: string;
  descricao?: string;
  
  // Cenário Base (sistema antigo)
  faturamentoAnual: number;
  comprasAnual: number;
  servicosAnual: number;
  
  // Tributos Antigos
  icmsTotalAntigo: number;
  issTotalAntigo: number;
  pisTotalAntigo: number;
  cofinsTotalAntigo: number;
  ipiTotalAntigo: number;
  totalTributosAntigo: number;
  cargaTributariaAntigaPercentual: number;
  
  // Tributos Novos
  cbsTotal: number;
  ibsTotal: number;
  isTotal: number;
  totalTributosNovo: number;
  cargaTributariaNovaPercentual: number;
  
  // Comparativo
  diferencaAbsoluta: number;
  diferencaPercentual: number;
  impactoFluxoCaixa: 'positivo' | 'negativo' | 'neutro';
  
  // Análise de Créditos
  creditosRecuperaveisNovo: number;
  creditosPerdidosTransicao: number;
  
  anoSimulacao: number;
  faseTransicao: FaseTransicao;
  createdAt: Date;
}

// ========================
// SPLIT PAYMENT
// ========================

export interface SplitPaymentConfig {
  id: string;
  empresaId: string;
  contaBancariaId: string;
  ativo: boolean;
  
  // Configurações de retenção
  retencaoCBSAutomatica: boolean;
  retencaoIBSAutomatica: boolean;
  percentualRetencaoCBS: number;
  percentualRetencaoIBS: number;
  
  // Limites
  valorMinimoRetencao: number;
  
  // Integração bancária
  bancoCodigo: string;
  agencia: string;
  conta: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TransacaoSplitPayment {
  id: string;
  empresaId: string;
  operacaoId: string;
  
  valorBruto: number;
  valorCBSRetido: number;
  valorIBSRetido: number;
  valorLiquido: number;
  
  dataTransacao: Date;
  dataRepasse: Date;
  
  statusRepasse: 'pendente' | 'processado' | 'falha';
  protocoloRepasse?: string;
  
  // Documento de origem
  chaveAcessoNFe?: string;
  numeroDocumento: string;
  
  createdAt: Date;
}

// ========================
// CASHBACK (Devolução)
// ========================

export interface ConfiguracaoCashback {
  percentualCBSCesta: number; // 100% CBS para cesta básica
  percentualIBSCesta: number; // 100% IBS para cesta básica
  percentualCBSEnergia: number; // 100% CBS energia elétrica
  percentualIBSEnergia: number; // 50% IBS energia elétrica
  percentualCBSGas: number; // 100% CBS gás
  percentualIBSGas: number; // 20% IBS gás
  percentualCBSTelecomunicacoes: number; // 20% CBS telecom
  percentualIBSTelecomunicacoes: number; // 20% IBS telecom
  percentualCBSDemais: number; // 20% CBS demais
  percentualIBSDemais: number; // 20% IBS demais
}

export const CASHBACK_PERCENTUAIS: ConfiguracaoCashback = {
  percentualCBSCesta: 100,
  percentualIBSCesta: 100,
  percentualCBSEnergia: 100,
  percentualIBSEnergia: 50,
  percentualCBSGas: 100,
  percentualIBSGas: 20,
  percentualCBSTelecomunicacoes: 20,
  percentualIBSTelecomunicacoes: 20,
  percentualCBSDemais: 20,
  percentualIBSDemais: 20,
};

// ========================
// REGIMES ESPECIAIS
// ========================

export interface ConfiguracaoRegimeEspecial {
  regime: RegimeEspecial;
  descricao: string;
  reducaoAliquotaCBS: number; // Percentual de redução
  reducaoAliquotaIBS: number;
  creditoIntegralMantido: boolean;
  observacoes: string;
  fundamentoLegal: string;
}

export const REGIMES_ESPECIAIS: ConfiguracaoRegimeEspecial[] = [
  {
    regime: 'zona_franca_manaus',
    descricao: 'Zona Franca de Manaus',
    reducaoAliquotaCBS: 100, // Isento de CBS
    reducaoAliquotaIBS: 100, // Isento de IBS
    creditoIntegralMantido: true,
    observacoes: 'Manutenção dos benefícios até 2073',
    fundamentoLegal: 'Art. 446 a 460 LC 214/2025'
  },
  {
    regime: 'combustiveis',
    descricao: 'Combustíveis',
    reducaoAliquotaCBS: 0,
    reducaoAliquotaIBS: 0,
    creditoIntegralMantido: true,
    observacoes: 'Regime monofásico com alíquotas específicas',
    fundamentoLegal: 'Art. 172 a 189 LC 214/2025'
  },
  {
    regime: 'servicos_financeiros',
    descricao: 'Serviços Financeiros',
    reducaoAliquotaCBS: 0,
    reducaoAliquotaIBS: 0,
    creditoIntegralMantido: false,
    observacoes: 'Base de cálculo diferenciada (margem)',
    fundamentoLegal: 'Art. 190 a 232 LC 214/2025'
  },
  {
    regime: 'imobiliario',
    descricao: 'Operações Imobiliárias',
    reducaoAliquotaCBS: 40,
    reducaoAliquotaIBS: 40,
    creditoIntegralMantido: true,
    observacoes: 'Redução de 40% para imóveis residenciais',
    fundamentoLegal: 'Art. 233 a 256 LC 214/2025'
  },
  {
    regime: 'hotelaria',
    descricao: 'Hotelaria e Hospedagem',
    reducaoAliquotaCBS: 40,
    reducaoAliquotaIBS: 40,
    creditoIntegralMantido: true,
    observacoes: 'Redução de 40%',
    fundamentoLegal: 'Art. 257 a 259 LC 214/2025'
  },
  {
    regime: 'bares_restaurantes',
    descricao: 'Bares e Restaurantes',
    reducaoAliquotaCBS: 40,
    reducaoAliquotaIBS: 40,
    creditoIntegralMantido: true,
    observacoes: 'Redução de 40%',
    fundamentoLegal: 'Art. 260 a 262 LC 214/2025'
  },
  {
    regime: 'transporte_coletivo',
    descricao: 'Transporte Coletivo',
    reducaoAliquotaCBS: 60,
    reducaoAliquotaIBS: 60,
    creditoIntegralMantido: true,
    observacoes: 'Redução de 60%',
    fundamentoLegal: 'Art. 263 a 268 LC 214/2025'
  },
];

// ========================
// OBRIGAÇÕES ACESSÓRIAS
// ========================

export interface ObrigacaoAcessoria {
  codigo: string;
  nome: string;
  periodicidade: 'mensal' | 'trimestral' | 'anual' | 'evento';
  orgaoDestino: 'RFB' | 'CGIBS' | 'SEFAZ' | 'Prefeitura';
  prazoEntrega: string;
  penalidade: string;
  ativa: boolean;
  inicioVigencia: Date;
}

export const OBRIGACOES_ACESSORIAS_REFORMA: ObrigacaoAcessoria[] = [
  {
    codigo: 'EFD-IBS-CBS',
    nome: 'Escrituração Fiscal Digital IBS/CBS',
    periodicidade: 'mensal',
    orgaoDestino: 'RFB',
    prazoEntrega: 'Até o 20º dia do mês subsequente',
    penalidade: 'Multa de 0,5% sobre o faturamento',
    ativa: true,
    inicioVigencia: new Date('2026-01-01')
  },
  {
    codigo: 'DCTF-IBS-CBS',
    nome: 'Declaração de Débitos e Créditos Tributários - IBS/CBS',
    periodicidade: 'mensal',
    orgaoDestino: 'RFB',
    prazoEntrega: 'Até o 15º dia do mês subsequente',
    penalidade: 'Multa mínima de R$ 500',
    ativa: true,
    inicioVigencia: new Date('2026-01-01')
  },
];

// ========================
// DASHBOARD E MÉTRICAS
// ========================

export interface MetricasReformaTributaria {
  empresaId: string;
  competencia: string;
  
  // Visão Geral
  faturamentoTotal: number;
  comprasTotal: number;
  cargaTributariaEfetiva: number;
  
  // CBS
  cbsDebitosTotal: number;
  cbsCreditosTotal: number;
  cbsSaldoAPagar: number;
  cbsTaxaEfetiva: number;
  
  // IBS
  ibsDebitosTotal: number;
  ibsCreditosTotal: number;
  ibsSaldoAPagar: number;
  ibsTaxaEfetiva: number;
  
  // IS
  impostoSeletivoTotal: number;
  
  // Split Payment
  valorRetidoSplitPayment: number;
  valorPagoPosSplit: number;
  
  // Comparativo com período anterior
  variacaoCargaTributaria: number;
  economiaGerada: number;
  
  // Créditos
  creditosAcumulados: number;
  creditosUtilizados: number;
  creditosDisponiveis: number;
  
  // Transição
  tributosAntigosResidual: number;
  percentualMigracao: number;
}

// ========================
// PLANO DE CONTAS CONTÁBIL
// ========================

export interface ContaContabilReforma {
  codigo: string;
  descricao: string;
  natureza: 'devedora' | 'credora';
  tipo: 'ativo' | 'passivo' | 'resultado';
  grupo: 'tributos_recuperar' | 'tributos_recolher' | 'despesas_tributarias' | 'provisoes';
}

export const PLANO_CONTAS_REFORMA: ContaContabilReforma[] = [
  // Ativo Circulante - Tributos a Recuperar
  { codigo: '1.1.5.01.001', descricao: 'CBS a Recuperar', natureza: 'devedora', tipo: 'ativo', grupo: 'tributos_recuperar' },
  { codigo: '1.1.5.01.002', descricao: 'IBS a Recuperar', natureza: 'devedora', tipo: 'ativo', grupo: 'tributos_recuperar' },
  { codigo: '1.1.5.01.003', descricao: 'Créditos de CBS - Split Payment', natureza: 'devedora', tipo: 'ativo', grupo: 'tributos_recuperar' },
  { codigo: '1.1.5.01.004', descricao: 'Créditos de IBS - Split Payment', natureza: 'devedora', tipo: 'ativo', grupo: 'tributos_recuperar' },
  
  // Passivo Circulante - Tributos a Recolher
  { codigo: '2.1.4.01.001', descricao: 'CBS a Recolher', natureza: 'credora', tipo: 'passivo', grupo: 'tributos_recolher' },
  { codigo: '2.1.4.01.002', descricao: 'IBS a Recolher', natureza: 'credora', tipo: 'passivo', grupo: 'tributos_recolher' },
  { codigo: '2.1.4.01.003', descricao: 'Imposto Seletivo a Recolher', natureza: 'credora', tipo: 'passivo', grupo: 'tributos_recolher' },
  { codigo: '2.1.4.01.004', descricao: 'CBS Retido Split Payment a Repassar', natureza: 'credora', tipo: 'passivo', grupo: 'tributos_recolher' },
  { codigo: '2.1.4.01.005', descricao: 'IBS Retido Split Payment a Repassar', natureza: 'credora', tipo: 'passivo', grupo: 'tributos_recolher' },
  
  // Resultado - Deduções da Receita
  { codigo: '3.1.2.01.001', descricao: '(-) CBS sobre Vendas', natureza: 'devedora', tipo: 'resultado', grupo: 'despesas_tributarias' },
  { codigo: '3.1.2.01.002', descricao: '(-) IBS sobre Vendas', natureza: 'devedora', tipo: 'resultado', grupo: 'despesas_tributarias' },
  { codigo: '3.1.2.01.003', descricao: '(-) Imposto Seletivo sobre Vendas', natureza: 'devedora', tipo: 'resultado', grupo: 'despesas_tributarias' },
  
  // Provisões (para transição)
  { codigo: '2.1.4.02.001', descricao: 'Provisão para Tributos - Transição', natureza: 'credora', tipo: 'passivo', grupo: 'provisoes' },
  { codigo: '2.1.4.02.002', descricao: 'Créditos a Homologar - Transição', natureza: 'credora', tipo: 'passivo', grupo: 'provisoes' },
];
