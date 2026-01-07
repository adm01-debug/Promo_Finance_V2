// ============================================
// I18N UTILITIES: Sistema de internacionalização
// Helpers para tradução e formatação localizada
// ============================================

import { useCallback, useState, useMemo, useEffect } from 'react';

// ============================================
// TIPOS
// ============================================

type TranslationValue = string | Record<string, unknown>;
type TranslationDictionary = Record<string, TranslationValue>;
type Translations = Record<string, TranslationDictionary>;

interface I18nConfig {
  defaultLocale: string;
  supportedLocales: string[];
  fallbackLocale?: string;
  translations: Translations;
}

interface PluralRules {
  zero?: string;
  one: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

interface FormatOptions {
  date?: Intl.DateTimeFormatOptions;
  number?: Intl.NumberFormatOptions;
  currency?: string;
  relativeTime?: Intl.RelativeTimeFormatOptions;
}

// ============================================
// CONFIGURAÇÃO GLOBAL
// ============================================

let globalConfig: I18nConfig = {
  defaultLocale: 'pt-BR',
  supportedLocales: ['pt-BR', 'en-US', 'es'],
  fallbackLocale: 'pt-BR',
  translations: {},
};

let currentLocale = globalConfig.defaultLocale;

// ============================================
// FUNÇÕES DE CONFIGURAÇÃO
// ============================================

/**
 * Configura o sistema de internacionalização
 */
export function configureI18n(config: Partial<I18nConfig>): void {
  globalConfig = { ...globalConfig, ...config };
  currentLocale = config.defaultLocale || globalConfig.defaultLocale;
}

/**
 * Define o locale atual
 */
export function setLocale(locale: string): void {
  if (globalConfig.supportedLocales.includes(locale)) {
    currentLocale = locale;
    document.documentElement.lang = locale;
    localStorage.setItem('locale', locale);
  }
}

/**
 * Obtém o locale atual
 */
export function getLocale(): string {
  return currentLocale;
}

/**
 * Obtém os locales suportados
 */
export function getSupportedLocales(): string[] {
  return globalConfig.supportedLocales;
}

/**
 * Detecta o locale do navegador
 */
export function detectBrowserLocale(): string {
  const browserLocale = navigator.language;
  
  // Tenta match exato primeiro
  if (globalConfig.supportedLocales.includes(browserLocale)) {
    return browserLocale;
  }
  
  // Tenta match parcial (ex: 'pt' para 'pt-BR')
  const languageCode = browserLocale.split('-')[0];
  const partialMatch = globalConfig.supportedLocales.find(
    locale => locale.startsWith(languageCode)
  );
  
  return partialMatch || globalConfig.fallbackLocale || globalConfig.defaultLocale;
}

/**
 * Carrega traduções para um locale
 */
export function loadTranslations(
  locale: string,
  translations: TranslationDictionary
): void {
  globalConfig.translations[locale] = {
    ...globalConfig.translations[locale],
    ...translations,
  };
}

// ============================================
// FUNÇÕES DE TRADUÇÃO
// ============================================

/**
 * Obtém valor aninhado de objeto
 */
function getNestedValue(obj: TranslationDictionary, path: string): TranslationValue | undefined {
  const keys = path.split('.');
  let result: TranslationValue | undefined = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      result = (result as Record<string, TranslationValue>)[key];
    } else {
      return undefined;
    }
  }
  
  return result;
}

/**
 * Traduz uma chave
 */
export function t(
  key: string,
  params?: Record<string, string | number>,
  locale?: string
): string {
  const targetLocale = locale || currentLocale;
  const translations = globalConfig.translations[targetLocale];
  
  let value = translations ? getNestedValue(translations, key) : undefined;
  
  // Fallback para locale padrão
  if (value === undefined && globalConfig.fallbackLocale) {
    const fallbackTranslations = globalConfig.translations[globalConfig.fallbackLocale];
    value = fallbackTranslations ? getNestedValue(fallbackTranslations, key) : undefined;
  }
  
  // Retorna a chave se não encontrar tradução
  if (typeof value !== 'string') {
    console.warn(`Translation not found: ${key}`);
    return key;
  }
  
  // Substitui parâmetros
  if (params) {
    return value.replace(
      /\{\{(\w+)\}\}/g,
      (_, param) => String(params[param] ?? `{{${param}}}`)
    );
  }
  
  return value;
}

/**
 * Traduz com pluralização
 */
export function plural(
  key: string,
  count: number,
  params?: Record<string, string | number>,
  locale?: string
): string {
  const targetLocale = locale || currentLocale;
  const pluralRule = new Intl.PluralRules(targetLocale);
  const rule = pluralRule.select(count);
  
  const pluralKey = `${key}.${rule}`;
  const fallbackKey = `${key}.other`;
  
  let translation = t(pluralKey, { count, ...params }, targetLocale);
  
  // Fallback para 'other' se a regra específica não existir
  if (translation === pluralKey) {
    translation = t(fallbackKey, { count, ...params }, targetLocale);
  }
  
  return translation;
}

// ============================================
// FUNÇÕES DE FORMATAÇÃO
// ============================================

/**
 * Formata data
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  locale?: string
): string {
  const targetLocale = locale || currentLocale;
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat(targetLocale, defaultOptions).format(dateObj);
}

/**
 * Formata hora
 */
export function formatTime(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  locale?: string
): string {
  const targetLocale = locale || currentLocale;
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  
  return new Intl.DateTimeFormat(targetLocale, defaultOptions).format(dateObj);
}

/**
 * Formata data e hora
 */
export function formatDateTime(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  locale?: string
): string {
  const targetLocale = locale || currentLocale;
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  
  return new Intl.DateTimeFormat(targetLocale, defaultOptions).format(dateObj);
}

/**
 * Formata tempo relativo
 */
export function formatRelativeTime(
  date: Date | string | number,
  options?: Intl.RelativeTimeFormatOptions,
  locale?: string
): string {
  const targetLocale = locale || currentLocale;
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diff = dateObj.getTime() - now.getTime();
  
  const rtf = new Intl.RelativeTimeFormat(targetLocale, {
    numeric: 'auto',
    ...options,
  });
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (Math.abs(years) >= 1) return rtf.format(years, 'year');
  if (Math.abs(months) >= 1) return rtf.format(months, 'month');
  if (Math.abs(weeks) >= 1) return rtf.format(weeks, 'week');
  if (Math.abs(days) >= 1) return rtf.format(days, 'day');
  if (Math.abs(hours) >= 1) return rtf.format(hours, 'hour');
  if (Math.abs(minutes) >= 1) return rtf.format(minutes, 'minute');
  return rtf.format(seconds, 'second');
}

/**
 * Formata número
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
  locale?: string
): string {
  const targetLocale = locale || currentLocale;
  return new Intl.NumberFormat(targetLocale, options).format(value);
}

/**
 * Formata moeda
 */
export function formatCurrency(
  value: number,
  currency: string = 'BRL',
  options?: Intl.NumberFormatOptions,
  locale?: string
): string {
  const targetLocale = locale || currentLocale;
  return new Intl.NumberFormat(targetLocale, {
    style: 'currency',
    currency,
    ...options,
  }).format(value);
}

/**
 * Formata porcentagem
 */
export function formatPercent(
  value: number,
  options?: Intl.NumberFormatOptions,
  locale?: string
): string {
  const targetLocale = locale || currentLocale;
  return new Intl.NumberFormat(targetLocale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/**
 * Formata lista
 */
export function formatList(
  items: string[],
  options?: { style?: 'long' | 'short' | 'narrow'; type?: 'conjunction' | 'disjunction' | 'unit' },
  locale?: string
): string {
  const targetLocale = locale || currentLocale;
  // Fallback para browsers que não suportam ListFormat
  if (typeof (Intl as any).ListFormat === 'undefined') {
    return items.join(', ');
  }
  return new (Intl as any).ListFormat(targetLocale, {
    style: 'long',
    type: 'conjunction',
    ...options,
  }).format(items);
}

/**
 * Formata unidade
 */
export function formatUnit(
  value: number,
  unit: Intl.NumberFormatOptions['unit'],
  options?: Intl.NumberFormatOptions,
  locale?: string
): string {
  const targetLocale = locale || currentLocale;
  return new Intl.NumberFormat(targetLocale, {
    style: 'unit',
    unit,
    unitDisplay: 'short',
    ...options,
  }).format(value);
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook para usar traduções
 */
export function useTranslation(namespace?: string) {
  const [locale, setLocaleState] = useState(currentLocale);

  const handleLocaleChange = useCallback((newLocale: string) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  const translate = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      return t(fullKey, params, locale);
    },
    [namespace, locale]
  );

  const translatePlural = useCallback(
    (key: string, count: number, params?: Record<string, string | number>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      return plural(fullKey, count, params, locale);
    },
    [namespace, locale]
  );

  return {
    t: translate,
    plural: translatePlural,
    locale,
    setLocale: handleLocaleChange,
    supportedLocales: getSupportedLocales(),
  };
}

/**
 * Hook para formatação localizada
 */
export function useLocaleFormat() {
  const locale = currentLocale;

  return useMemo(
    () => ({
      date: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
        formatDate(date, options, locale),
      time: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
        formatTime(date, options, locale),
      dateTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
        formatDateTime(date, options, locale),
      relativeTime: (date: Date | string | number, options?: Intl.RelativeTimeFormatOptions) =>
        formatRelativeTime(date, options, locale),
      number: (value: number, options?: Intl.NumberFormatOptions) =>
        formatNumber(value, options, locale),
      currency: (value: number, currency?: string, options?: Intl.NumberFormatOptions) =>
        formatCurrency(value, currency, options, locale),
      percent: (value: number, options?: Intl.NumberFormatOptions) =>
        formatPercent(value, options, locale),
      list: (items: string[], options?: { style?: 'long' | 'short' | 'narrow'; type?: 'conjunction' | 'disjunction' | 'unit' }) =>
        formatList(items, options, locale),
      unit: (value: number, unit: Intl.NumberFormatOptions['unit'], options?: Intl.NumberFormatOptions) =>
        formatUnit(value, unit, options, locale),
    }),
    [locale]
  );
}

/**
 * Hook para detectar e inicializar locale
 */
export function useLocaleDetection() {
  useEffect(() => {
    // Tenta carregar locale salvo
    const savedLocale = localStorage.getItem('locale');
    
    if (savedLocale && globalConfig.supportedLocales.includes(savedLocale)) {
      setLocale(savedLocale);
    } else {
      // Detecta locale do navegador
      const browserLocale = detectBrowserLocale();
      setLocale(browserLocale);
    }
  }, []);

  return currentLocale;
}

// ============================================
// TRADUÇÕES PADRÃO PT-BR
// ============================================

export const ptBRTranslations: TranslationDictionary = {
  common: {
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Salvar',
    delete: 'Excluir',
    edit: 'Editar',
    add: 'Adicionar',
    search: 'Buscar',
    filter: 'Filtrar',
    clear: 'Limpar',
    close: 'Fechar',
    back: 'Voltar',
    next: 'Próximo',
    previous: 'Anterior',
    yes: 'Sim',
    no: 'Não',
    ok: 'OK',
    more: 'Mais',
    less: 'Menos',
    all: 'Todos',
    none: 'Nenhum',
    select: 'Selecionar',
    required: 'Obrigatório',
    optional: 'Opcional',
  },
  validation: {
    required: 'Este campo é obrigatório',
    email: 'Digite um e-mail válido',
    minLength: 'Mínimo de {{min}} caracteres',
    maxLength: 'Máximo de {{max}} caracteres',
    min: 'Valor mínimo: {{min}}',
    max: 'Valor máximo: {{max}}',
    pattern: 'Formato inválido',
    passwordMatch: 'As senhas não coincidem',
    invalidDate: 'Data inválida',
    invalidNumber: 'Número inválido',
  },
  errors: {
    generic: 'Ocorreu um erro. Tente novamente.',
    network: 'Erro de conexão. Verifique sua internet.',
    unauthorized: 'Você não tem permissão para esta ação.',
    notFound: 'Recurso não encontrado.',
    serverError: 'Erro no servidor. Tente novamente mais tarde.',
  },
  auth: {
    login: 'Entrar',
    logout: 'Sair',
    register: 'Cadastrar',
    forgotPassword: 'Esqueci minha senha',
    resetPassword: 'Redefinir senha',
    email: 'E-mail',
    password: 'Senha',
    confirmPassword: 'Confirmar senha',
    rememberMe: 'Lembrar de mim',
  },
  pagination: {
    page: 'Página {{current}} de {{total}}',
    items: '{{count}} item',
    'items.one': '{{count}} item',
    'items.other': '{{count}} itens',
    first: 'Primeira página',
    last: 'Última página',
    next: 'Próxima página',
    previous: 'Página anterior',
    showing: 'Mostrando {{from}} a {{to}} de {{total}}',
  },
  table: {
    noData: 'Nenhum dado encontrado',
    loading: 'Carregando dados...',
    sortAsc: 'Ordenar crescente',
    sortDesc: 'Ordenar decrescente',
    actions: 'Ações',
  },
  form: {
    submit: 'Enviar',
    reset: 'Limpar',
    saving: 'Salvando...',
    saved: 'Salvo!',
    unsavedChanges: 'Você tem alterações não salvas.',
  },
};

// ============================================
// TRADUÇÕES PADRÃO EN-US
// ============================================

export const enUSTranslations: TranslationDictionary = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    clear: 'Clear',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    more: 'More',
    less: 'Less',
    all: 'All',
    none: 'None',
    select: 'Select',
    required: 'Required',
    optional: 'Optional',
  },
  validation: {
    required: 'This field is required',
    email: 'Enter a valid email',
    minLength: 'Minimum {{min}} characters',
    maxLength: 'Maximum {{max}} characters',
    min: 'Minimum value: {{min}}',
    max: 'Maximum value: {{max}}',
    pattern: 'Invalid format',
    passwordMatch: 'Passwords do not match',
    invalidDate: 'Invalid date',
    invalidNumber: 'Invalid number',
  },
  errors: {
    generic: 'An error occurred. Please try again.',
    network: 'Connection error. Check your internet.',
    unauthorized: 'You do not have permission for this action.',
    notFound: 'Resource not found.',
    serverError: 'Server error. Please try again later.',
  },
  auth: {
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    forgotPassword: 'Forgot password',
    resetPassword: 'Reset password',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    rememberMe: 'Remember me',
  },
  pagination: {
    page: 'Page {{current}} of {{total}}',
    items: '{{count}} item',
    'items.one': '{{count}} item',
    'items.other': '{{count}} items',
    first: 'First page',
    last: 'Last page',
    next: 'Next page',
    previous: 'Previous page',
    showing: 'Showing {{from}} to {{to}} of {{total}}',
  },
  table: {
    noData: 'No data found',
    loading: 'Loading data...',
    sortAsc: 'Sort ascending',
    sortDesc: 'Sort descending',
    actions: 'Actions',
  },
  form: {
    submit: 'Submit',
    reset: 'Reset',
    saving: 'Saving...',
    saved: 'Saved!',
    unsavedChanges: 'You have unsaved changes.',
  },
};

// Inicializa traduções padrão
loadTranslations('pt-BR', ptBRTranslations);
loadTranslations('en-US', enUSTranslations);
