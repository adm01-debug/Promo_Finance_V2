import { useState, useCallback, useMemo } from 'react';

type Currency = 'BRL' | 'USD' | 'EUR' | 'GBP' | 'JPY';

interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: string;
  locale: string;
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
}

const CURRENCY_CONFIGS: Record<Currency, CurrencyConfig> = {
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Real Brasileiro',
    locale: 'pt-BR',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'de-DE',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    locale: 'ja-JP',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
};

interface UseCurrencyFormatterOptions {
  currency?: Currency;
  showSymbol?: boolean;
  showCode?: boolean;
  compact?: boolean;
  signDisplay?: 'auto' | 'never' | 'always' | 'exceptZero';
}

/**
 * Hook for currency formatting
 */
export function useCurrencyFormatter(options: UseCurrencyFormatterOptions = {}) {
  const {
    currency = 'BRL',
    showSymbol = true,
    showCode = false,
    compact = false,
    signDisplay = 'auto',
  } = options;

  const config = CURRENCY_CONFIGS[currency];

  const formatter = useMemo(() => {
    const formatOptions: Intl.NumberFormatOptions = {
      style: showSymbol ? 'currency' : 'decimal',
      currency: config.code,
      currencyDisplay: showCode ? 'code' : 'symbol',
      minimumFractionDigits: config.decimalPlaces,
      maximumFractionDigits: config.decimalPlaces,
      signDisplay,
    };

    if (compact) {
      formatOptions.notation = 'compact';
      formatOptions.compactDisplay = 'short';
    }

    return new Intl.NumberFormat(config.locale, formatOptions);
  }, [config, showSymbol, showCode, compact, signDisplay]);

  const format = useCallback(
    (value: number | null | undefined): string => {
      if (value === null || value === undefined || isNaN(value)) {
        return showSymbol ? `${config.symbol} 0,00` : '0,00';
      }
      return formatter.format(value);
    },
    [formatter, config, showSymbol]
  );

  const formatParts = useCallback(
    (value: number): Intl.NumberFormatPart[] => {
      return formatter.formatToParts(value);
    },
    [formatter]
  );

  const parse = useCallback(
    (value: string): number => {
      // Remove currency symbol and code
      let cleaned = value
        .replace(config.symbol, '')
        .replace(config.code, '')
        .trim();

      // Handle Brazilian format (1.234,56)
      if (config.code === 'BRL') {
        cleaned = cleaned
          .replace(/\./g, '') // Remove thousand separators
          .replace(',', '.'); // Convert decimal separator
      } else {
        cleaned = cleaned.replace(/,/g, ''); // Remove thousand separators for US format
      }

      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    },
    [config]
  );

  return {
    format,
    formatParts,
    parse,
    config,
    symbol: config.symbol,
    code: config.code,
  };
}

/**
 * Hook for currency input handling
 */
export function useCurrencyInput(
  initialValue: number = 0,
  currency: Currency = 'BRL'
) {
  const [rawValue, setRawValue] = useState<number>(initialValue);
  const { format, parse, config } = useCurrencyFormatter({ currency });

  const displayValue = useMemo(() => {
    return format(rawValue);
  }, [rawValue, format]);

  const handleChange = useCallback(
    (inputValue: string) => {
      // Extract only numbers
      const numbersOnly = inputValue.replace(/\D/g, '');
      
      // Convert to number with decimal places
      const numericValue = parseInt(numbersOnly, 10) / Math.pow(10, config.decimalPlaces);
      
      setRawValue(isNaN(numericValue) ? 0 : numericValue);
    },
    [config.decimalPlaces]
  );

  const setValue = useCallback((value: number) => {
    setRawValue(value);
  }, []);

  const reset = useCallback(() => {
    setRawValue(initialValue);
  }, [initialValue]);

  return {
    value: rawValue,
    displayValue,
    onChange: handleChange,
    setValue,
    reset,
  };
}

/**
 * Format currency value (standalone function)
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: Currency = 'BRL',
  options: Omit<UseCurrencyFormatterOptions, 'currency'> = {}
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return CURRENCY_CONFIGS[currency].symbol + ' 0,00';
  }

  const config = CURRENCY_CONFIGS[currency];
  
  const formatOptions: Intl.NumberFormatOptions = {
    style: options.showSymbol !== false ? 'currency' : 'decimal',
    currency: config.code,
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
    signDisplay: options.signDisplay ?? 'auto',
  };

  if (options.compact) {
    formatOptions.notation = 'compact';
    formatOptions.compactDisplay = 'short';
  }

  return new Intl.NumberFormat(config.locale, formatOptions).format(value);
}

/**
 * Parse currency string to number (standalone function)
 */
export function parseCurrency(value: string, currency: Currency = 'BRL'): number {
  const config = CURRENCY_CONFIGS[currency];
  
  let cleaned = value
    .replace(config.symbol, '')
    .replace(config.code, '')
    .replace(/\s/g, '');

  // Handle Brazilian format (1.234,56)
  if (config.decimalSeparator === ',') {
    cleaned = cleaned
      .replace(/\./g, '') // Remove thousand separators
      .replace(',', '.'); // Convert decimal separator
  } else {
    cleaned = cleaned.replace(/,/g, ''); // Remove thousand separators for US format
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format currency for display in input (without symbol)
 */
export function formatCurrencyForInput(
  value: number,
  currency: Currency = 'BRL'
): string {
  const config = CURRENCY_CONFIGS[currency];
  
  return new Intl.NumberFormat(config.locale, {
    style: 'decimal',
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
  }).format(value);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_CONFIGS[currency].symbol;
}

/**
 * Get all available currencies
 */
export function getAvailableCurrencies(): CurrencyConfig[] {
  return Object.values(CURRENCY_CONFIGS);
}

/**
 * Convert between currencies (simplified - use real exchange rates in production)
 */
export function convertCurrency(
  value: number,
  from: Currency,
  to: Currency,
  exchangeRates: Record<string, number>
): number {
  if (from === to) return value;
  
  // Convert to USD first (assuming rates are USD-based)
  const toUSD = from === 'USD' ? value : value / (exchangeRates[from] || 1);
  
  // Convert from USD to target
  const result = to === 'USD' ? toUSD : toUSD * (exchangeRates[to] || 1);
  
  return result;
}

/**
 * Format difference between two values
 */
export function formatCurrencyDifference(
  current: number,
  previous: number,
  currency: Currency = 'BRL'
): { value: string; percentage: string; isPositive: boolean } {
  const diff = current - previous;
  const percentage = previous !== 0 ? ((diff / previous) * 100) : 0;
  
  return {
    value: formatCurrency(Math.abs(diff), currency, { signDisplay: 'never' }),
    percentage: `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`,
    isPositive: diff >= 0,
  };
}

export { CURRENCY_CONFIGS, type Currency, type CurrencyConfig };
export default useCurrencyFormatter;
