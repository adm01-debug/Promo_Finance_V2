/**
 * Currency Utilities
 * Comprehensive utilities for handling Brazilian Real (BRL) and other currencies
 */

export type CurrencyCode = 'BRL' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'ARS' | 'CLP';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimalPlaces: number;
  thousandSeparator: string;
  decimalSeparator: string;
}

const currencies: Record<CurrencyCode, CurrencyInfo> = {
  BRL: { code: 'BRL', symbol: 'R$', name: 'Real Brasileiro', decimalPlaces: 2, thousandSeparator: '.', decimalSeparator: ',' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2, thousandSeparator: ',', decimalSeparator: '.' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2, thousandSeparator: '.', decimalSeparator: ',' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2, thousandSeparator: ',', decimalSeparator: '.' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0, thousandSeparator: ',', decimalSeparator: '.' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimalPlaces: 2, thousandSeparator: ',', decimalSeparator: '.' },
  ARS: { code: 'ARS', symbol: '$', name: 'Peso Argentino', decimalPlaces: 2, thousandSeparator: '.', decimalSeparator: ',' },
  CLP: { code: 'CLP', symbol: '$', name: 'Peso Chileno', decimalPlaces: 0, thousandSeparator: '.', decimalSeparator: ',' },
};

/**
 * Format a number as currency
 * @param value - Number to format
 * @param currency - Currency code (default: BRL)
 * @param options - Additional formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: CurrencyCode = 'BRL',
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    compact?: boolean;
  } = {}
): string {
  const { showSymbol = true, showCode = false, compact = false } = options;
  const info = currencies[currency];

  if (compact && Math.abs(value) >= 1000) {
    return formatCompactCurrency(value, currency, showSymbol);
  }

  const absoluteValue = Math.abs(value);
  const isNegative = value < 0;

  // Format the number
  const parts = absoluteValue.toFixed(info.decimalPlaces).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, info.thousandSeparator);
  const decimalPart = parts[1] || '';

  let formatted = integerPart;
  if (info.decimalPlaces > 0) {
    formatted += info.decimalSeparator + decimalPart;
  }

  // Add symbol/code
  let result = '';
  if (showSymbol) {
    result = `${info.symbol} ${formatted}`;
  } else if (showCode) {
    result = `${formatted} ${info.code}`;
  } else {
    result = formatted;
  }

  return isNegative ? `-${result}` : result;
}

/**
 * Format currency in compact notation (K, M, B)
 */
function formatCompactCurrency(
  value: number,
  currency: CurrencyCode,
  showSymbol: boolean
): string {
  const info = currencies[currency];
  const absoluteValue = Math.abs(value);
  const isNegative = value < 0;

  let compactValue: number;
  let suffix: string;

  if (absoluteValue >= 1_000_000_000) {
    compactValue = absoluteValue / 1_000_000_000;
    suffix = 'B';
  } else if (absoluteValue >= 1_000_000) {
    compactValue = absoluteValue / 1_000_000;
    suffix = 'M';
  } else if (absoluteValue >= 1_000) {
    compactValue = absoluteValue / 1_000;
    suffix = 'K';
  } else {
    return formatCurrency(value, currency, { showSymbol, compact: false });
  }

  const formatted = compactValue.toFixed(1).replace('.', info.decimalSeparator);
  const symbol = showSymbol ? `${info.symbol} ` : '';
  const sign = isNegative ? '-' : '';

  return `${sign}${symbol}${formatted}${suffix}`;
}

/**
 * Parse a currency string to number
 * @param value - Currency string to parse
 * @param currency - Currency code for parsing rules
 * @returns Parsed number or NaN if invalid
 */
export function parseCurrency(value: string, currency: CurrencyCode = 'BRL'): number {
  if (!value || typeof value !== 'string') {
    return NaN;
  }

  const info = currencies[currency];

  // Remove currency symbol and code
  let cleaned = value
    .replace(info.symbol, '')
    .replace(currency, '')
    .trim();

  // Handle negative values
  const isNegative = cleaned.startsWith('-') || cleaned.startsWith('(');
  cleaned = cleaned.replace(/[()-]/g, '');

  // Handle compact notation
  const compactMatch = cleaned.match(/^([\d.,]+)\s*([KMB])$/i);
  if (compactMatch) {
    const num = parseFloat(compactMatch[1].replace(info.thousandSeparator, '').replace(info.decimalSeparator, '.'));
    const multiplier = { K: 1_000, M: 1_000_000, B: 1_000_000_000 }[compactMatch[2].toUpperCase()] || 1;
    const result = num * multiplier;
    return isNegative ? -result : result;
  }

  // Remove thousand separators and convert decimal separator
  const normalized = cleaned
    .replace(new RegExp(`\\${info.thousandSeparator}`, 'g'), '')
    .replace(info.decimalSeparator, '.');

  const result = parseFloat(normalized);
  return isNegative ? -result : result;
}

/**
 * Convert cents to currency value
 * @param cents - Value in cents
 * @param currency - Currency code
 * @returns Value in currency units
 */
export function centsToValue(cents: number, currency: CurrencyCode = 'BRL'): number {
  const info = currencies[currency];
  const divisor = Math.pow(10, info.decimalPlaces);
  return cents / divisor;
}

/**
 * Convert currency value to cents
 * @param value - Value in currency units
 * @param currency - Currency code
 * @returns Value in cents (integer)
 */
export function valueToCents(value: number, currency: CurrencyCode = 'BRL'): number {
  const info = currencies[currency];
  const multiplier = Math.pow(10, info.decimalPlaces);
  return Math.round(value * multiplier);
}

/**
 * Calculate percentage of a value
 * @param value - Base value
 * @param percentage - Percentage (0-100)
 * @returns Calculated percentage value
 */
export function calculatePercentage(value: number, percentage: number): number {
  return (value * percentage) / 100;
}

/**
 * Calculate what percentage one value is of another
 * @param part - The partial value
 * @param total - The total value
 * @returns Percentage (0-100)
 */
export function getPercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}

/**
 * Calculate discount
 * @param originalPrice - Original price
 * @param discountPercentage - Discount percentage (0-100)
 * @returns Object with discount amount and final price
 */
export function calculateDiscount(
  originalPrice: number,
  discountPercentage: number
): { discountAmount: number; finalPrice: number } {
  const discountAmount = calculatePercentage(originalPrice, discountPercentage);
  const finalPrice = originalPrice - discountAmount;
  return { discountAmount, finalPrice };
}

/**
 * Calculate tax
 * @param value - Base value
 * @param taxPercentage - Tax percentage
 * @param included - Whether tax is already included in value
 * @returns Object with tax amount and total
 */
export function calculateTax(
  value: number,
  taxPercentage: number,
  included: boolean = false
): { taxAmount: number; baseValue: number; total: number } {
  if (included) {
    // Tax is included in the value
    const baseValue = value / (1 + taxPercentage / 100);
    const taxAmount = value - baseValue;
    return { taxAmount, baseValue, total: value };
  } else {
    // Tax is added to the value
    const taxAmount = calculatePercentage(value, taxPercentage);
    return { taxAmount, baseValue: value, total: value + taxAmount };
  }
}

/**
 * Calculate installment values
 * @param totalValue - Total value to be divided
 * @param installments - Number of installments
 * @param interestRate - Monthly interest rate (0 for interest-free)
 * @returns Installment details
 */
export function calculateInstallments(
  totalValue: number,
  installments: number,
  interestRate: number = 0
): {
  installmentValue: number;
  totalWithInterest: number;
  interestAmount: number;
  installmentDetails: Array<{ number: number; value: number; balance: number }>;
} {
  if (installments <= 0) {
    throw new Error('Number of installments must be greater than 0');
  }

  let totalWithInterest: number;
  let installmentValue: number;

  if (interestRate === 0) {
    // Interest-free
    totalWithInterest = totalValue;
    installmentValue = totalValue / installments;
  } else {
    // Compound interest (Price table)
    const rate = interestRate / 100;
    installmentValue =
      totalValue * (rate * Math.pow(1 + rate, installments)) / (Math.pow(1 + rate, installments) - 1);
    totalWithInterest = installmentValue * installments;
  }

  const interestAmount = totalWithInterest - totalValue;

  // Generate installment details
  const installmentDetails: Array<{ number: number; value: number; balance: number }> = [];
  let balance = totalWithInterest;

  for (let i = 1; i <= installments; i++) {
    const value = i === installments ? balance : installmentValue;
    balance -= value;
    installmentDetails.push({
      number: i,
      value: Math.round(value * 100) / 100,
      balance: Math.max(0, Math.round(balance * 100) / 100),
    });
  }

  return {
    installmentValue: Math.round(installmentValue * 100) / 100,
    totalWithInterest: Math.round(totalWithInterest * 100) / 100,
    interestAmount: Math.round(interestAmount * 100) / 100,
    installmentDetails,
  };
}

/**
 * Sum array of currency values safely
 * @param values - Array of numbers
 * @returns Sum with proper decimal handling
 */
export function sumCurrency(values: number[]): number {
  const sum = values.reduce((acc, val) => acc + valueToCents(val), 0);
  return centsToValue(sum);
}

/**
 * Round currency value to proper decimal places
 * @param value - Value to round
 * @param currency - Currency code
 * @returns Rounded value
 */
export function roundCurrency(value: number, currency: CurrencyCode = 'BRL'): number {
  const info = currencies[currency];
  const multiplier = Math.pow(10, info.decimalPlaces);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Check if a value is a valid currency amount
 * @param value - Value to check
 * @returns Boolean indicating if valid
 */
export function isValidCurrencyAmount(value: unknown): value is number {
  if (typeof value !== 'number') return false;
  if (Number.isNaN(value)) return false;
  if (!Number.isFinite(value)) return false;
  return true;
}

/**
 * Get currency information
 * @param code - Currency code
 * @returns Currency information or undefined
 */
export function getCurrencyInfo(code: CurrencyCode): CurrencyInfo | undefined {
  return currencies[code];
}

/**
 * Get all available currencies
 * @returns Array of currency information
 */
export function getAllCurrencies(): CurrencyInfo[] {
  return Object.values(currencies);
}

/**
 * Format currency range
 * @param min - Minimum value
 * @param max - Maximum value
 * @param currency - Currency code
 * @returns Formatted range string
 */
export function formatCurrencyRange(
  min: number,
  max: number,
  currency: CurrencyCode = 'BRL'
): string {
  const info = currencies[currency];
  const formattedMin = formatCurrency(min, currency, { showSymbol: false });
  const formattedMax = formatCurrency(max, currency, { showSymbol: false });
  return `${info.symbol} ${formattedMin} - ${formattedMax}`;
}

/**
 * Compare two currency values with tolerance for floating point errors
 * @param a - First value
 * @param b - Second value
 * @param currency - Currency code
 * @returns -1, 0, or 1 for less than, equal, or greater than
 */
export function compareCurrency(
  a: number,
  b: number,
  currency: CurrencyCode = 'BRL'
): -1 | 0 | 1 {
  const aCents = valueToCents(a, currency);
  const bCents = valueToCents(b, currency);

  if (aCents < bCents) return -1;
  if (aCents > bCents) return 1;
  return 0;
}

/**
 * Check if two currency values are equal
 * @param a - First value
 * @param b - Second value
 * @param currency - Currency code
 * @returns Boolean indicating equality
 */
export function currencyEquals(
  a: number,
  b: number,
  currency: CurrencyCode = 'BRL'
): boolean {
  return compareCurrency(a, b, currency) === 0;
}
