// ============================================
// TIPOS DO SISTEMA FINANCEIRO - PROMO FINANCE
// ============================================

// Enums
export type StatusPagamento = 'pago' | 'pendente' | 'vencido' | 'parcial' | 'cancelado';
export type TipoTransacao = 'receita' | 'despesa';
export type TipoCobranca = 'boleto' | 'pix' | 'cartao' | 'transferencia' | 'dinheiro';
export type PrioridadeAlerta = 'baixa' | 'media' | 'alta' | 'critica';
export type EtapaReguaCobranca = 'preventiva' | 'lembrete' | 'cobranca' | 'negociacao' | 'juridico';

// Entidades Base
export interface CNPJ {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  ativo: boolean;
  createdAt: Date;
}

export interface ContaBancaria {
  id: string;
  cnpjId: string;
  banco: string;
  codigoBanco: string;
  agencia: string;
  conta: string;
  tipoConta: 'corrente' | 'poupanca';
  saldoAtual: number;
  saldoDisponivel: number;
  ativo: boolean;
  cor: string;
  createdAt: Date;
}

export interface CentroCusto {
  id: string;
  nome: string;
  codigo: string;
  descricao?: string;
  orcamentoPrevisto: number;
  orcamentoRealizado: number;
  ativo: boolean;
  parentId?: string;
  createdAt: Date;
}

// Contas a Pagar / Receber
export interface ContaPagar {
  id: string;
  cnpjId: string;
  contaBancariaId?: string;
  centroCustoId?: string;
  fornecedor: string;
  descricao: string;
  valor: number;
  valorPago?: number;
  dataEmissao: Date;
  dataVencimento: Date;
  dataPagamento?: Date;
  status: StatusPagamento;
  tipoCobranca: TipoCobranca;
  numeroDocumento?: string;
  codigoBarras?: string;
  observacoes?: string;
  anexos?: string[];
  recorrente: boolean;
  bitrixDealId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContaReceber {
  id: string;
  cnpjId: string;
  contaBancariaId?: string;
  centroCustoId?: string;
  cliente: string;
  clienteId?: string;
  descricao: string;
  valor: number;
  valorRecebido?: number;
  dataEmissao: Date;
  dataVencimento: Date;
  dataRecebimento?: Date;
  status: StatusPagamento;
  tipoCobranca: TipoCobranca;
  numeroDocumento?: string;
  codigoBarras?: string;
  chavePix?: string;
  linkBoleto?: string;
  observacoes?: string;
  anexos?: string[];
  bitrixDealId?: string;
  scoreCliente?: number;
  etapaCobranca?: EtapaReguaCobranca;
  createdAt: Date;
  updatedAt: Date;
}

// Cobrança
export interface Cobranca {
  id: string;
  contaReceberId: string;
  clienteId: string;
  clienteNome: string;
  valor: number;
  dataEnvio: Date;
  tipoEnvio: 'email' | 'sms' | 'whatsapp' | 'telefone';
  etapa: EtapaReguaCobranca;
  mensagem: string;
  resposta?: string;
  status: 'enviado' | 'entregue' | 'lido' | 'respondido' | 'falha';
  createdAt: Date;
}

export interface ReguaCobranca {
  id: string;
  nome: string;
  descricao?: string;
  etapas: EtapaReguaCobrancaConfig[];
  ativo: boolean;
  createdAt: Date;
}

export interface EtapaReguaCobrancaConfig {
  etapa: EtapaReguaCobranca;
  diasAposVencimento: number;
  canais: ('email' | 'sms' | 'whatsapp' | 'telefone')[];
  templateMensagem: string;
  ativo: boolean;
}

// Conciliação Bancária
export interface TransacaoBancaria {
  id: string;
  contaBancariaId: string;
  data: Date;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  saldo: number;
  conciliada: boolean;
  contaPagarId?: string;
  contaReceberId?: string;
  createdAt: Date;
}

export interface ConciliacaoItem {
  transacao: TransacaoBancaria;
  sugestoes: (ContaPagar | ContaReceber)[];
  matchScore: number;
  status: 'pendente' | 'conciliado' | 'ignorado';
}

// Alertas
export interface Alerta {
  id: string;
  tipo: 'vencimento' | 'fluxo_caixa' | 'inadimplencia' | 'conciliacao' | 'meta';
  titulo: string;
  mensagem: string;
  prioridade: PrioridadeAlerta;
  lido: boolean;
  acao?: string;
  acaoUrl?: string;
  entidadeId?: string;
  entidadeTipo?: string;
  createdAt: Date;
}

// Dashboard KPIs
export interface DashboardKPIs {
  saldoTotal: number;
  saldoTotalVariacao: number;
  receitasMes: number;
  receitasMesVariacao: number;
  despesasMes: number;
  despesasMesVariacao: number;
  contasReceberVencidas: number;
  contasPagarVencidas: number;
  contasReceberHoje: number;
  contasPagarHoje: number;
  inadimplencia: number;
  inadimplenciaVariacao: number;
  fluxoCaixaProjetado: FluxoCaixaProjetado[];
  topDevedores: TopDevedor[];
  distribuicaoCentroCusto: DistribuicaoCentroCusto[];
}

export interface FluxoCaixaProjetado {
  data: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface TopDevedor {
  cliente: string;
  valor: number;
  diasAtraso: number;
  score: number;
}

export interface DistribuicaoCentroCusto {
  nome: string;
  valor: number;
  percentual: number;
  orcado: number;
}

// Bitrix24 Integration
export interface Bitrix24Deal {
  id: string;
  title: string;
  opportunity: number;
  stageId: string;
  contactId?: string;
  companyId?: string;
  assignedById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bitrix24SyncStatus {
  ultimaSync: Date;
  totalSincronizados: number;
  erros: number;
  status: 'idle' | 'syncing' | 'error' | 'success';
}

// Filtros
export interface FiltrosFinanceiros {
  cnpjId?: string;
  contaBancariaId?: string;
  centroCustoId?: string;
  status?: StatusPagamento[];
  dataInicio?: Date;
  dataFim?: Date;
  busca?: string;
  tipoCobranca?: TipoCobranca[];
}

// Paginação
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
