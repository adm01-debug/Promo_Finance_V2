/**
 * Parses a date input that can be either a Date object or a string.
 * Strings in `YYYY-MM-DD` (and `YYYY-MM-DDTHH:mm[:ss]` without timezone)
 * are interpreted as **local time** instead of UTC, which prevents the
 * classic "shows the previous day in BRT" bug when displaying dates that
 * Supabase returns as bare ISO date strings.
 */
const toLocalDate = (input: Date | string): Date => {
  if (input instanceof Date) return input;
  const s = String(input);
  // Bare YYYY-MM-DD → midnight local time
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T00:00:00`);
  }
  // Datetime without timezone marker → assume local
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) {
    return new Date(s);
  }
  return new Date(s);
};

export const formatCurrency = (value: number | null | undefined): string => {
  if (value == null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatCurrencyCompact = (value: number | null | undefined): string => {
  const v = value ?? 0;
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}R$ ${(abs / 1_000_000_000).toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}R$ ${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}R$ ${(abs / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(v);
};

export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  const d = toLocalDate(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

export const formatDateShort = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  const d = toLocalDate(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(d);
};

export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  const d = toLocalDate(date);
  if (isNaN(d.getTime())) return '-';
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
  const d = toLocalDate(date);
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
  const d = toLocalDate(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = today.getTime() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const getRelativeTime = (date: Date | string): string => {
  const d = toLocalDate(date);
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
  return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
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

export const formatCpfCnpj = (value: string | null | undefined): string => {
  if (!value) return '-';
  const clean = value.replace(/\D/g, '');
  if (clean.length === 11) return formatCPF(clean);
  if (clean.length === 14) return getCNPJFormatted(clean);
  return value;
};

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

export const formatCPF = (cpf: string): string => {
  const numbers = cpf.replace(/\D/g, '');
  return numbers.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
};

export const formatCEP = (cep: string): string => {
  const numbers = cep.replace(/\D/g, '');
  return numbers.replace(/^(\d{5})(\d{3})$/, '$1-$2');
};

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}min`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  return `${days}d ${hours}h`;
};

export const formatVariation = (value: number): { text: string; isPositive: boolean } => {
  const isPositive = value >= 0;
  const text = `${isPositive ? '+' : ''}${value.toFixed(1)}%`;
  return { text, isPositive };
};

export const formatAverageDays = (days: number): string => {
  if (days === 0) return 'Hoje';
  if (days === 1) return '1 dia';
  return `${Math.round(days)} dias`;
};

/**
 * Parse de valor monetário digitado em pt-BR (e.g. "1.234,56" → 1234.56).
 * Trata tanto separador de milhar `.` quanto decimal `,`.
 */
export const parseCurrencyInput = (value: string): number => {
  if (!value) return 0;
  // Remove símbolos / espaços, mantém dígitos, vírgula, ponto e sinal
  const cleaned = value.replace(/[^\d,.-]/g, '').trim();
  if (!cleaned || cleaned === '-' || cleaned === ',' || cleaned === '.') return 0;
  // Normaliza para "1234.56": tira milhar e troca decimal
  const hasComma = cleaned.includes(',');
  const normalized = hasComma ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
};

export const formatDateForInput = (date: Date | string | null): string => {
  if (!date) return '';
  if (typeof date === 'string') {
    const s = date.trim();
    // YYYY-MM-DD puro (sem timezone) -> data civil LOCAL (evita o dia anterior em BRT)
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (dateOnly) {
      const y = Number(dateOnly[1]);
      const m = Number(dateOnly[2]);
      const d = Number(dateOnly[3]);
      const parsed = new Date(y, m - 1, d);
      if (isNaN(parsed.getTime())) return '';
      if (parsed.getFullYear() !== y || parsed.getMonth() !== m - 1 || parsed.getDate() !== d) {
        return '';
      }
      return s;
    }
    // Datetime completo (com 'T', com ou sem timezone) -> preserva a data civil da string
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
      return s.slice(0, 10);
    }
    // Fallback: parse padrao e getters UTC (a data civil de um Date e a UTC)
    const parsed = new Date(s);
    if (isNaN(parsed.getTime())) return '';
    const yyyy = parsed.getUTCFullYear();
    const mm = String(parsed.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  // Date instance -> getters UTC (a data civil de um Date e a UTC)
  if (isNaN(date.getTime())) return '';
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Serializa um Date como YYYY-MM-DD na TIMEZONE LOCAL (getters locais).
 * Imune a fusos: em BRT 21h-24h, new Date() tem data civil UTC do dia
 * seguinte — este helper evita gravar o dia errado. Usar SEMPRE para
 * gerar datas de hoje/períodos (substitui toISOString().split('T')[0]).
 */
export const toISOLocal = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/** Returns today as YYYY-MM-DD in local timezone (avoids UTC offset bugs in BRT). */
export const todayISOLocal = (): string => toISOLocal(new Date());

export const isToday = (date: Date | string): boolean => {
  const d = toLocalDate(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

export const isPast = (date: Date | string): boolean => {
  const d = toLocalDate(date);
  return d < new Date();
};

export const formatDisplayName = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
};

export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const formatNFNumber = (number: string | number): string =>
  String(number)
    .padStart(9, '0')
    .replace(/^(\d{3})(\d{3})(\d{3})$/, '$1.$2.$3');
