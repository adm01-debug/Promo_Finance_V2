/**
 * Application Constants
 * Centralized configuration values used throughout the application
 */

// ==========================================
// STATUS CONSTANTS
// ==========================================

export const STATUS_PAGAMENTO = {
  PENDENTE: 'pendente',
  PAGO: 'pago',
  VENCIDO: 'vencido',
  CANCELADO: 'cancelado',
  PARCIAL: 'parcial',
} as const;

export const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
  parcial: 'Parcial',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  aguardando: 'Aguardando',
  em_analise: 'Em Análise',
  ativo: 'Ativo',
  inativo: 'Inativo',
};

export const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  pago: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  vencido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelado: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  parcial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  aprovado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejeitado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  aguardando: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  em_analise: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  ativo: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inativo: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

// ==========================================
// TYPE CONSTANTS
// ==========================================

export const TIPOS_COBRANCA = {
  BOLETO: 'boleto',
  PIX: 'pix',
  TRANSFERENCIA: 'transferencia',
  CARTAO: 'cartao',
  DINHEIRO: 'dinheiro',
  CHEQUE: 'cheque',
  DEBITO_AUTOMATICO: 'debito_automatico',
} as const;

export const TIPOS_COBRANCA_LABELS: Record<string, string> = {
  boleto: 'Boleto',
  pix: 'PIX',
  transferencia: 'Transferência',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
  cheque: 'Cheque',
  debito_automatico: 'Débito Automático',
};

export const TIPOS_CONTA = {
  CORRENTE: 'corrente',
  POUPANCA: 'poupanca',
  INVESTIMENTO: 'investimento',
} as const;

export const TIPOS_CONTA_LABELS: Record<string, string> = {
  corrente: 'Conta Corrente',
  poupanca: 'Poupança',
  investimento: 'Investimento',
};

// ==========================================
// BANK CONSTANTS
// ==========================================

export const BANCOS = [
  { codigo: '001', nome: 'Banco do Brasil' },
  { codigo: '033', nome: 'Santander' },
  { codigo: '104', nome: 'Caixa Econômica Federal' },
  { codigo: '237', nome: 'Bradesco' },
  { codigo: '341', nome: 'Itaú Unibanco' },
  { codigo: '389', nome: 'Mercantil do Brasil' },
  { codigo: '422', nome: 'Safra' },
  { codigo: '745', nome: 'Citibank' },
  { codigo: '756', nome: 'Sicoob' },
  { codigo: '077', nome: 'Inter' },
  { codigo: '260', nome: 'Nubank' },
  { codigo: '290', nome: 'PagSeguro' },
  { codigo: '380', nome: 'PicPay' },
  { codigo: '323', nome: 'Mercado Pago' },
  { codigo: '336', nome: 'C6 Bank' },
  { codigo: '212', nome: 'Original' },
  { codigo: '655', nome: 'Neon' },
  { codigo: '102', nome: 'XP Investimentos' },
] as const;

export const BANCOS_MAP = Object.fromEntries(
  BANCOS.map((b) => [b.codigo, b.nome])
);

// ==========================================
// STATES (UF)
// ==========================================

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

// ==========================================
// PAGINATION
// ==========================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// ==========================================
// DATE/TIME
// ==========================================

export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_TIME: 'dd/MM/yyyy HH:mm',
  DISPLAY_FULL: 'dd/MM/yyyy HH:mm:ss',
  INPUT: 'yyyy-MM-dd',
  INPUT_TIME: "yyyy-MM-dd'T'HH:mm",
  MONTH_YEAR: 'MM/yyyy',
  WEEKDAY: 'EEEE, dd/MM',
  SHORT: 'dd/MM',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

export const MONTHS_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
] as const;

export const WEEKDAYS = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado',
] as const;

export const WEEKDAYS_SHORT = [
  'Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb',
] as const;

// ==========================================
// CURRENCY
// ==========================================

export const CURRENCY = {
  LOCALE: 'pt-BR',
  CODE: 'BRL',
  SYMBOL: 'R$',
  DECIMAL_SEPARATOR: ',',
  THOUSAND_SEPARATOR: '.',
  DECIMAL_PLACES: 2,
} as const;

// ==========================================
// FILE UPLOAD
// ==========================================

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_SIZE_LABEL: '10MB',
  ACCEPTED_IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ACCEPTED_DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ACCEPTED_SPREADSHEETS: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
} as const;

// ==========================================
// PRIORITY
// ==========================================

export const PRIORIDADES = {
  BAIXA: 'baixa',
  MEDIA: 'media',
  ALTA: 'alta',
  CRITICA: 'critica',
} as const;

export const PRIORIDADE_LABELS: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export const PRIORIDADE_COLORS: Record<string, string> = {
  baixa: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  media: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  alta: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  critica: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

// ==========================================
// TOAST DURATION
// ==========================================

export const TOAST_DURATION = {
  SHORT: 2000,
  DEFAULT: 4000,
  LONG: 6000,
  PERSISTENT: Infinity,
} as const;

// ==========================================
// API LIMITS
// ==========================================

export const API_LIMITS = {
  MAX_QUERY_ROWS: 1000,
  BATCH_SIZE: 100,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================

export const KEYBOARD_SHORTCUTS = {
  SAVE: 'Ctrl+S',
  NEW: 'Ctrl+N',
  SEARCH: 'Ctrl+K',
  ESCAPE: 'Escape',
  DELETE: 'Delete',
  REFRESH: 'F5',
  HELP: 'F1',
} as const;

// ==========================================
// CHART COLORS
// ==========================================

export const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(150, 70%, 32%)',
  danger: 'hsl(0, 78%, 45%)',
  warning: 'hsl(24, 95%, 46%)',
  info: 'hsl(200, 70%, 50%)',
  muted: 'hsl(var(--muted))',
  palette: [
    'hsl(220, 70%, 50%)',
    'hsl(150, 70%, 40%)',
    'hsl(280, 70%, 50%)',
    'hsl(30, 90%, 55%)',
    'hsl(340, 70%, 50%)',
    'hsl(180, 60%, 45%)',
    'hsl(60, 80%, 45%)',
  ],
} as const;

// ==========================================
// FEATURE FLAGS (can be overridden by env)
// ==========================================

export const FEATURES = {
  ENABLE_PWA: true,
  ENABLE_BIOMETRIC: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_DARK_MODE: true,
  ENABLE_EXPORT_PDF: true,
  ENABLE_EXPORT_EXCEL: true,
  ENABLE_AI_CATEGORIZATION: true,
} as const;

// ==========================================
// TYPE EXPORTS
// ==========================================

export type StatusPagamento = typeof STATUS_PAGAMENTO[keyof typeof STATUS_PAGAMENTO];
export type TipoCobranca = typeof TIPOS_COBRANCA[keyof typeof TIPOS_COBRANCA];
export type TipoConta = typeof TIPOS_CONTA[keyof typeof TIPOS_CONTA];
export type Prioridade = typeof PRIORIDADES[keyof typeof PRIORIDADES];
