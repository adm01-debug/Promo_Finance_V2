// ============================================
// Core Types
// ============================================

export type ID = string;
export type Timestamp = string; // ISO 8601 format

// ============================================
// User & Auth Types
// ============================================

export interface User {
  id: ID;
  email: string;
  name: string;
  avatar_url?: string;
  phone?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  metadata?: Record<string, unknown>;
}

export interface Session {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  name: string;
  confirmPassword: string;
}

// ============================================
// Conta Types
// ============================================

export type ContaStatus = 'pendente' | 'paga' | 'vencida' | 'cancelada' | 'parcial';
export type FormaPagamento = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'transferencia' | 'cheque';

export interface ContaPagar {
  id: ID;
  descricao: string;
  valor: number;
  valor_pago?: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: ContaStatus;
  categoria?: string;
  fornecedor_id?: ID;
  fornecedor?: Fornecedor;
  forma_pagamento?: FormaPagamento;
  documento?: string;
  observacoes?: string;
  recorrente?: boolean;
  parcela_atual?: number;
  total_parcelas?: number;
  created_at: Timestamp;
  updated_at: Timestamp;
  user_id: ID;
}

export interface ContaPagarInput {
  descricao: string;
  valor: number;
  data_vencimento: string;
  categoria?: string;
  fornecedor_id?: ID;
  forma_pagamento?: FormaPagamento;
  documento?: string;
  observacoes?: string;
  recorrente?: boolean;
  total_parcelas?: number;
}

export interface ContaReceber {
  id: ID;
  descricao: string;
  valor: number;
  valor_recebido?: number;
  data_vencimento: string;
  data_recebimento?: string;
  status: ContaStatus;
  categoria?: string;
  cliente_id?: ID;
  cliente?: Cliente;
  forma_pagamento?: FormaPagamento;
  documento?: string;
  observacoes?: string;
  recorrente?: boolean;
  parcela_atual?: number;
  total_parcelas?: number;
  created_at: Timestamp;
  updated_at: Timestamp;
  user_id: ID;
}

export interface ContaReceberInput {
  descricao: string;
  valor: number;
  data_vencimento: string;
  categoria?: string;
  cliente_id?: ID;
  forma_pagamento?: FormaPagamento;
  documento?: string;
  observacoes?: string;
  recorrente?: boolean;
  total_parcelas?: number;
}

export interface ContaTotals {
  total: number;
  pago: number;
  pendente: number;
  vencido: number;
  count: number;
}

// ============================================
// Fornecedor Types
// ============================================

export interface Fornecedor {
  id: ID;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  inscricao_estadual?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  website?: string;
  observacoes?: string;
  ativo: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
  user_id: ID;
}

export interface FornecedorInput {
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  inscricao_estadual?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  website?: string;
  observacoes?: string;
  ativo?: boolean;
}

export interface FornecedorStats {
  total: number;
  ativos: number;
  inativos: number;
}

// ============================================
// Cliente Types
// ============================================

export type TipoPessoa = 'fisica' | 'juridica';

export interface Cliente {
  id: ID;
  nome: string;
  tipo_pessoa: TipoPessoa;
  cpf_cnpj: string;
  rg_ie?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  data_nascimento?: string;
  observacoes?: string;
  ativo: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
  user_id: ID;
}

export interface ClienteInput {
  nome: string;
  tipo_pessoa: TipoPessoa;
  cpf_cnpj: string;
  rg_ie?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  data_nascimento?: string;
  observacoes?: string;
  ativo?: boolean;
}

export interface ClienteStats {
  total: number;
  ativos: number;
  inativos: number;
  pessoasFisicas: number;
  pessoasJuridicas: number;
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
  totalReceber: number;
  totalPagar: number;
  saldo: number;
  contasVencidas: number;
  contasVencidasValor: number;
  receitasMes: number;
  despesasMes: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

// ============================================
// Report Types
// ============================================

export type ReportType = 'fluxo_caixa' | 'contas_pagar' | 'contas_receber' | 'dre' | 'balanco';
export type ReportPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
export type ReportFormat = 'pdf' | 'excel' | 'csv';

export interface ReportFilter {
  type: ReportType;
  period: ReportPeriod;
  startDate?: string;
  endDate?: string;
  categories?: string[];
  status?: ContaStatus[];
}

export interface ReportData {
  title: string;
  period: string;
  generatedAt: Timestamp;
  data: Record<string, unknown>;
  summary: Record<string, number>;
}

// ============================================
// Filter & Pagination Types
// ============================================

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ContaPagarFilters {
  search?: string;
  status?: ContaStatus;
  categoria?: string;
  fornecedor_id?: ID;
  data_inicio?: string;
  data_fim?: string;
}

export interface ContaReceberFilters {
  search?: string;
  status?: ContaStatus;
  categoria?: string;
  cliente_id?: ID;
  data_inicio?: string;
  data_fim?: string;
}

export interface FornecedorFilters {
  search?: string;
  ativo?: boolean;
  cidade?: string;
  uf?: string;
}

export interface ClienteFilters {
  search?: string;
  ativo?: boolean;
  tipo_pessoa?: TipoPessoa;
  cidade?: string;
  uf?: string;
}

// ============================================
// Form Types
// ============================================

export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
}

export interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

export type ValidationRule<T = unknown> = {
  validate: (value: T) => boolean;
  message: string;
};

export type FieldValidation<T = unknown> = ValidationRule<T>[];

// ============================================
// API Types
// ============================================

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// ============================================
// UI Types
// ============================================

export type Theme = 'light' | 'dark' | 'system';

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type Variant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface MenuItem {
  label: string;
  href?: string;
  icon?: string;
  onClick?: () => void;
  disabled?: boolean;
  children?: MenuItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

// ============================================
// Notification Types
// ============================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: ID;
  type: NotificationType;
  title: string;
  message?: string;
  read: boolean;
  created_at: Timestamp;
  action_url?: string;
}

// ============================================
// Utility Types
// ============================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type Nullable<T> = T | null;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
