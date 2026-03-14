// App Constants
export const APP_NAME = 'Promo Finance';
export const APP_VERSION = '2.0.0';
export const APP_DESCRIPTION = 'Sistema de Gestão Financeira Empresarial';

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const API_TIMEOUT = 30000; // 30 seconds

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

// Date Formats
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATE_TIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';
export const DATE_INPUT_FORMAT = 'yyyy-MM-dd';

// Currency
export const CURRENCY = 'BRL';
export const CURRENCY_SYMBOL = 'R$';
export const CURRENCY_LOCALE = 'pt-BR';

// Status Types
export const CONTA_STATUS = {
  PENDENTE: 'pendente',
  PAGA: 'paga',
  VENCIDA: 'vencida',
  CANCELADA: 'cancelada',
  PARCIAL: 'parcial',
} as const;

export const CONTA_STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  paga: 'Paga',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
  parcial: 'Parcialmente Paga',
};

export const CONTA_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pendente: { bg: 'bg-warning/10', text: 'text-warning' },
  paga: { bg: 'bg-success/10', text: 'text-success' },
  vencida: { bg: 'bg-destructive/10', text: 'text-destructive' },
  cancelada: { bg: 'bg-muted', text: 'text-muted-foreground' },
  parcial: { bg: 'bg-primary/10', text: 'text-primary' },
};

// Categories
export const CATEGORIAS_DESPESA = [
  'Fornecedores',
  'Aluguel',
  'Energia',
  'Água',
  'Internet',
  'Telefone',
  'Folha de Pagamento',
  'Impostos',
  'Marketing',
  'Manutenção',
  'Transporte',
  'Material de Escritório',
  'Software/Assinaturas',
  'Contabilidade',
  'Jurídico',
  'Seguros',
  'Outros',
] as const;

export const CATEGORIAS_RECEITA = [
  'Vendas',
  'Serviços',
  'Comissões',
  'Royalties',
  'Aluguel',
  'Juros',
  'Dividendos',
  'Reembolsos',
  'Outros',
] as const;

// Payment Methods
export const FORMAS_PAGAMENTO = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'transferencia', label: 'Transferência Bancária' },
  { value: 'cheque', label: 'Cheque' },
] as const;

// Brazilian States
export const ESTADOS_BR = [
  { uf: 'AC', nome: 'Acre' },
  { uf: 'AL', nome: 'Alagoas' },
  { uf: 'AP', nome: 'Amapá' },
  { uf: 'AM', nome: 'Amazonas' },
  { uf: 'BA', nome: 'Bahia' },
  { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' },
  { uf: 'ES', nome: 'Espírito Santo' },
  { uf: 'GO', nome: 'Goiás' },
  { uf: 'MA', nome: 'Maranhão' },
  { uf: 'MT', nome: 'Mato Grosso' },
  { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' },
  { uf: 'PA', nome: 'Pará' },
  { uf: 'PB', nome: 'Paraíba' },
  { uf: 'PR', nome: 'Paraná' },
  { uf: 'PE', nome: 'Pernambuco' },
  { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' },
  { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'RS', nome: 'Rio Grande do Sul' },
  { uf: 'RO', nome: 'Rondônia' },
  { uf: 'RR', nome: 'Roraima' },
  { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'São Paulo' },
  { uf: 'SE', nome: 'Sergipe' },
  { uf: 'TO', nome: 'Tocantins' },
] as const;

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
export const ALLOWED_SPREADSHEET_TYPES = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'promo_finance_auth_token',
  USER_DATA: 'promo_finance_user',
  THEME: 'promo_finance_theme',
  SIDEBAR_COLLAPSED: 'promo_finance_sidebar_collapsed',
  RECENT_SEARCHES: 'promo_finance_recent_searches',
  TABLE_PREFERENCES: 'promo_finance_table_prefs',
  LANGUAGE: 'promo_finance_language',
} as const;

// Query Keys (for React Query)
export const QUERY_KEYS = {
  // Auth
  USER: ['user'],
  SESSION: ['session'],
  
  // Contas a Pagar
  CONTAS_PAGAR: ['contas-pagar'],
  CONTA_PAGAR: (id: string) => ['contas-pagar', id],
  CONTAS_PAGAR_TOTALS: ['contas-pagar', 'totals'],
  CONTAS_PAGAR_OVERDUE: ['contas-pagar', 'overdue'],
  CONTAS_PAGAR_UPCOMING: ['contas-pagar', 'upcoming'],
  
  // Contas a Receber
  CONTAS_RECEBER: ['contas-receber'],
  CONTA_RECEBER: (id: string) => ['contas-receber', id],
  CONTAS_RECEBER_TOTALS: ['contas-receber', 'totals'],
  CONTAS_RECEBER_OVERDUE: ['contas-receber', 'overdue'],
  CONTAS_RECEBER_UPCOMING: ['contas-receber', 'upcoming'],
  
  // Fornecedores
  FORNECEDORES: ['fornecedores'],
  FORNECEDOR: (id: string) => ['fornecedores', id],
  FORNECEDORES_STATS: ['fornecedores', 'stats'],
  
  // Clientes
  CLIENTES: ['clientes'],
  CLIENTE: (id: string) => ['clientes', id],
  CLIENTES_STATS: ['clientes', 'stats'],
  
  // Dashboard
  DASHBOARD_STATS: ['dashboard', 'stats'],
  DASHBOARD_CHART: (type: string) => ['dashboard', 'chart', type],
  
  // Reports
  REPORTS: ['reports'],
  REPORT: (id: string) => ['reports', id],
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  // Generic
  GENERIC: 'Ocorreu um erro. Tente novamente.',
  NETWORK: 'Erro de conexão. Verifique sua internet.',
  SERVER: 'Erro no servidor. Tente novamente mais tarde.',
  NOT_FOUND: 'Registro não encontrado.',
  UNAUTHORIZED: 'Você não está autenticado.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  VALIDATION: 'Verifique os dados informados.',
  
  // Auth
  INVALID_CREDENTIALS: 'Email ou senha incorretos.',
  EMAIL_IN_USE: 'Este email já está em uso.',
  WEAK_PASSWORD: 'A senha deve ter no mínimo 8 caracteres.',
  PASSWORDS_DONT_MATCH: 'As senhas não conferem.',
  SESSION_EXPIRED: 'Sua sessão expirou. Faça login novamente.',
  
  // Form
  REQUIRED_FIELD: 'Este campo é obrigatório.',
  INVALID_EMAIL: 'Email inválido.',
  INVALID_CPF: 'CPF inválido.',
  INVALID_CNPJ: 'CNPJ inválido.',
  INVALID_PHONE: 'Telefone inválido.',
  INVALID_CEP: 'CEP inválido.',
  INVALID_DATE: 'Data inválida.',
  MIN_LENGTH: (min: number) => `Mínimo de ${min} caracteres.`,
  MAX_LENGTH: (max: number) => `Máximo de ${max} caracteres.`,
  MIN_VALUE: (min: number) => `Valor mínimo: ${min}.`,
  MAX_VALUE: (max: number) => `Valor máximo: ${max}.`,
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Registro criado com sucesso.',
  UPDATED: 'Registro atualizado com sucesso.',
  DELETED: 'Registro excluído com sucesso.',
  SAVED: 'Alterações salvas com sucesso.',
  LOGIN: 'Login realizado com sucesso.',
  LOGOUT: 'Você foi desconectado.',
  PASSWORD_RESET_SENT: 'Email de recuperação enviado.',
  PASSWORD_CHANGED: 'Senha alterada com sucesso.',
  PROFILE_UPDATED: 'Perfil atualizado com sucesso.',
} as const;

// Routes
export const ROUTES = {
  // Public
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Private
  DASHBOARD: '/',
  CONTAS_PAGAR: '/contas-pagar',
  CONTAS_PAGAR_NOVO: '/contas-pagar/novo',
  CONTAS_PAGAR_EDITAR: (id: string) => `/contas-pagar/${id}/editar`,
  CONTAS_RECEBER: '/contas-receber',
  CONTAS_RECEBER_NOVO: '/contas-receber/novo',
  CONTAS_RECEBER_EDITAR: (id: string) => `/contas-receber/${id}/editar`,
  FORNECEDORES: '/fornecedores',
  FORNECEDORES_NOVO: '/fornecedores/novo',
  FORNECEDORES_EDITAR: (id: string) => `/fornecedores/${id}/editar`,
  CLIENTES: '/clientes',
  CLIENTES_NOVO: '/clientes/novo',
  CLIENTES_EDITAR: (id: string) => `/clientes/${id}/editar`,
  RELATORIOS: '/relatorios',
  CONFIGURACOES: '/configuracoes',
} as const;

// Navigation Items
export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: 'LayoutDashboard',
  },
  {
    label: 'Contas a Pagar',
    href: ROUTES.CONTAS_PAGAR,
    icon: 'TrendingDown',
  },
  {
    label: 'Contas a Receber',
    href: ROUTES.CONTAS_RECEBER,
    icon: 'TrendingUp',
  },
  {
    label: 'Fornecedores',
    href: ROUTES.FORNECEDORES,
    icon: 'Building2',
  },
  {
    label: 'Clientes',
    href: ROUTES.CLIENTES,
    icon: 'Users',
  },
  {
    label: 'Relatórios',
    href: ROUTES.RELATORIOS,
    icon: 'BarChart3',
  },
  {
    label: 'Configurações',
    href: ROUTES.CONFIGURACOES,
    icon: 'Settings',
  },
] as const;
