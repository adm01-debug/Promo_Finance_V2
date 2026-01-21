import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ptBR } from './locales/pt-BR';
import { enUS } from './locales/en-US';

type Locale = 'pt-BR' | 'en-US';
type TranslationKeys = typeof ptBR;

const translations: Record<Locale, TranslationKeys> = {
  'pt-BR': ptBR,
  'en-US': enUS,
};

// Get nested value from object by path
function getNestedValue(obj: Record<string, any>, path: string): string {
  const keys = path.split('.');
  let value: any = obj;
  
  for (const key of keys) {
    if (value === undefined || value === null) {
      return path;
    }
    value = value[key];
  }
  
  return typeof value === 'string' ? value : path;
}

// Replace template variables
function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key]?.toString() ?? match;
  });
}

// I18n Context
interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (date: Date | string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// Provider
interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

export function I18nProvider({ children, defaultLocale = 'pt-BR' }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Try to get from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('locale') as Locale;
      if (stored && translations[stored]) {
        return stored;
      }
      
      // Try to detect from browser
      const browserLocale = navigator.language;
      if (browserLocale.startsWith('pt')) return 'pt-BR';
      if (browserLocale.startsWith('en')) return 'en-US';
    }
    
    return defaultLocale;
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
      document.documentElement.lang = newLocale;
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const translation = getNestedValue(translations[locale] as Record<string, any>, key);
    return interpolate(translation, params);
  }, [locale]);

  const formatNumber = useCallback((value: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(locale, options).format(value);
  }, [locale]);

  const formatCurrency = useCallback((value: number, currency = 'BRL'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  }, [locale]);

  const formatDate = useCallback((date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(d);
  }, [locale]);

  const formatRelativeTime = useCallback((date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (years > 0) return rtf.format(-years, 'year');
    if (months > 0) return rtf.format(-months, 'month');
    if (weeks > 0) return rtf.format(-weeks, 'week');
    if (days > 0) return rtf.format(-days, 'day');
    if (hours > 0) return rtf.format(-hours, 'hour');
    if (minutes > 0) return rtf.format(-minutes, 'minute');
    return rtf.format(-seconds, 'second');
  }, [locale]);

  const value: I18nContextValue = {
    locale,
    setLocale,
    t,
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Shortcut hook for translation only
export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}

// Available locales
export const AVAILABLE_LOCALES: { code: Locale; name: string; flag: string }[] = [
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
];

// Standalone translate function (for use outside components)
let currentLocale: Locale = 'pt-BR';

export function setGlobalLocale(locale: Locale): void {
  currentLocale = locale;
}

export function translate(key: string, params?: Record<string, string | number>): string {
  const translation = getNestedValue(translations[currentLocale] as Record<string, any>, key);
  return interpolate(translation, params);
}

export { type Locale, type TranslationKeys };
export default I18nProvider;
