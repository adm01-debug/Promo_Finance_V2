// Formatadores de valores monetários e datas

export const formatCurrency = (value: number | null | undefined): string => {
  if (value == null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatCurrencyCompact = (value: number | null | undefined): string => {
  const v = value ?? 0;
  if (v >= 1000000) {
    return `R$ ${(v / 1000000).toFixed(1)}M`;
  }
  if (v >= 1000) {
    return `R$ ${(v / 1000).toFixed(1)}K`;
  }
  return formatCurrency(v);
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

export const formatDateShort = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(d);
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

export const getDaysUntil = (date: Date | string): number => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = d.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getDaysOverdue = (date: Date | string): number => {
  const days = getDaysUntil(date);
  return days < 0 ? Math.abs(days) : 0;
};

export const calculateOverdueDays = (date: Date | string): number => {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = today.getTime() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const getRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days === 1) return 'Ontem';
  if (days < 7) return `${days} dias atrás`;
  return formatDate(d);
};

export const getCNPJFormatted = (cnpj: string): string => {
  const numbers = cnpj.replace(/\D/g, '');
  return numbers.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pago: 'Pago',
    pendente: 'Pendente',
    vencido: 'Vencido',
    parcial: 'Parcial',
    cancelado: 'Cancelado',
  };
  return labels[status] || status;
};

export const getEtapaCobrancaLabel = (etapa: string): string => {
  const labels: Record<string, string> = {
    preventiva: 'Preventiva',
    lembrete: 'Lembrete',
    cobranca: 'Cobrança',
    negociacao: 'Negociação',
    juridico: 'Jurídico',
  };
  return labels[etapa] || etapa;
};

// ============================================
// FORMATTERS ADICIONAIS (Melhoria 15)
// ============================================

/**
 * Formata número de telefone brasileiro
 */
export const formatPhone = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  if (numbers.length === 11) {
    return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (numbers.length === 10) {
    return numbers.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return phone;
};

/**
 * Formata CPF
 */
export const formatCPF = (cpf: string): string => {
  const numbers = cpf.replace(/\D/g, '');
  return numbers.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
};

/**
 * Formata CEP
 */
export const formatCEP = (cep: string): string => {
  const numbers = cep.replace(/\D/g, '');
  return numbers.replace(/^(\d{5})(\d{3})$/, '$1-$2');
};

/**
 * Formata bytes para exibição legível
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

/**
 * Trunca texto com ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
};

/**
 * Formata duração em minutos/horas/dias
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}min`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  return `${days}d ${hours}h`;
};

/**
 * Formata variação com sinal e cor
 */
export const formatVariation = (value: number): { text: string; isPositive: boolean } => {
  const isPositive = value >= 0;
  const text = `${isPositive ? '+' : ''}${value.toFixed(1)}%`;
  return { text, isPositive };
};

/**
 * Calcula e formata prazo médio
 */
export const formatAverageDays = (days: number): string => {
  if (days === 0) return 'Hoje';
  if (days === 1) return '1 dia';
  return `${Math.round(days)} dias`;
};

/**
 * Formata valor para input de moeda
 */
export const parseCurrencyInput = (value: string): number => {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

/**
 * Formata data para input date
 */
export const formatDateForInput = (date: Date | string | null): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

/**
 * Checa se uma data é hoje
 */
export const isToday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

/**
 * Checa se uma data já passou
 */
export const isPast = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
};

/**
 * Formata nome para exibição (primeiro + último nome)
 */
export const formatDisplayName = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
};

/**
 * Gera iniciais a partir de nome
 */
export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

/**
 * Formata número de nota fiscal
 */
export const formatNFNumber = (number: string | number): string => {
  const str = String(number).padStart(9, '0');
  return str.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1.$2.$3');
};
