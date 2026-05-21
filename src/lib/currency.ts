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

  const parts = absoluteValue.toFixed(info.decimalPlaces).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, info.thousandSeparator);
  const decimalPart = parts[1] || '';

  let formatted = integerPart;
  if (info.decimalPlaces > 0) {
    formatted += info.decimalSeparator + decimalPart;
  }

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

export function parseCurrency(value: string, currency: CurrencyCode = 'BRL'): number {
  if (!value || typeof value !== 'string') {
    return NaN;
  }

  const info = currencies[currency];
  let cleaned = value.replace(info.symbol, '').replace(currency, '').trim();

  const isNegative = cleaned.startsWith('-') || cleaned.startsWith('(');
  cleaned = cleaned.replace(/[()-]/g, '');

  const compactMatch = cleaned.match(/^([\d.,]+)\s*([KMB])$/i);
  if (compactMatch) {
    let numStr = compactMatch[1];
    // Smart separator detection for compact notation
    if (numStr.includes(',') && numStr.includes('.')) {
      numStr = numStr.replace(new RegExp(`\\${info.thousandSeparator}`, 'g'), '').replace(info.decimalSeparator, '.');
    } else if (numStr.includes(',')) {
      numStr = numStr.replace(',', '.');
    } else if (numStr.includes('.') && info.thousandSeparator === '.') {
      // If BRL and someone writes 1.5K, it's ambiguous, but usually 1.5. 
      // If it has 3 digits after the dot, it's a thousand separator.
      const parts = numStr.split('.');
      if (parts[parts.length - 1].length !== 3) {
        numStr = numStr.replace('.', '.'); // already decimal
      } else {
        numStr = numStr.replace('.', '');
      }
    }

    const num = parseFloat(numStr);
    const multiplier = { K: 1_000, M: 1_000_000, B: 1_000_000_000 }[compactMatch[2].toUpperCase()] || 1;
    const result = num * multiplier;
    return isNegative ? -result : result;
  }

  const normalized = cleaned
    .replace(new RegExp(`\\${info.thousandSeparator}`, 'g'), '')
    .replace(info.decimalSeparator, '.');

  const result = parseFloat(normalized);
  return isNegative ? -result : result;
}

export function centsToValue(cents: number, currency: CurrencyCode = 'BRL'): number {
  const info = currencies[currency];
  const divisor = Math.pow(10, info.decimalPlaces);
  return cents / divisor;
}

export function valueToCents(value: number, currency: CurrencyCode = 'BRL'): number {
  const info = currencies[currency];
  const multiplier = Math.pow(10, info.decimalPlaces);
  return Math.round(value * multiplier);
}

export function calculatePercentage(value: number, percentage: number): number {
  return (value * percentage) / 100;
}

export function getPercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}

export function calculateDiscount(
  originalPrice: number,
  discountPercentage: number
): { discountAmount: number; finalPrice: number } {
  const discountAmount = calculatePercentage(originalPrice, discountPercentage);
  const finalPrice = originalPrice - discountAmount;
  return { discountAmount, finalPrice };
}

export function calculateTax(
  value: number,
  taxPercentage: number,
  included: boolean = false
): { taxAmount: number; baseValue: number; total: number } {
  if (included) {
    const baseValue = value / (1 + taxPercentage / 100);
    const taxAmount = value - baseValue;
    return { taxAmount, baseValue, total: value };
  } else {
    const taxAmount = calculatePercentage(value, taxPercentage);
    return { taxAmount, baseValue: value, total: value + taxAmount };
  }
}

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
  if (!Number.isInteger(installments) || installments <= 0) {
    throw new Error('Number of installments must be a positive integer');
  }
  if (!Number.isFinite(totalValue) || totalValue < 0) {
    throw new Error('totalValue must be a non-negative finite number');
  }

  let totalWithInterest: number;
  let installmentValue: number;

  if (interestRate === 0) {
    totalWithInterest = totalValue;
    installmentValue = totalValue / installments;
  } else {
    const rate = interestRate / 100;
    installmentValue =
      (totalValue * (rate * Math.pow(1 + rate, installments))) /
      (Math.pow(1 + rate, installments) - 1);
    totalWithInterest = installmentValue * installments;
  }

  // Work in cents to avoid IEEE-754 drift, then round the per-installment
  // value down so the remainder absorbed by the final installment is never
  // negative.
  const totalCents = Math.round(totalWithInterest * 100);
  const baseCents = Math.floor((installmentValue * 100) + 1e-9);
  const lastCents = totalCents - baseCents * (installments - 1);

  const roundedInstallmentValue = baseCents / 100;
  const roundedTotalWithInterest = totalCents / 100;
  const interestAmount = roundedTotalWithInterest - totalValue;

  const installmentDetails: Array<{ number: number; value: number; balance: number }> = [];
  let remainingCents = totalCents;

  for (let i = 1; i <= installments; i++) {
    const valueCents = i === installments ? lastCents : baseCents;
    remainingCents -= valueCents;
    installmentDetails.push({
      number: i,
      value: valueCents / 100,
      balance: Math.max(0, remainingCents) / 100,
    });
  }

  return {
    installmentValue: roundedInstallmentValue,
    totalWithInterest: roundedTotalWithInterest,
    interestAmount: Math.round(interestAmount * 100) / 100,
    installmentDetails,
  };
}

export function sumCurrency(values: number[]): number {
  const sum = values.reduce((acc, val) => acc + valueToCents(val), 0);
  return centsToValue(sum);
}

export function roundCurrency(value: number, currency: CurrencyCode = 'BRL'): number {
  const info = currencies[currency];
  const multiplier = Math.pow(10, info.decimalPlaces);
  return Math.round(value * multiplier) / multiplier;
}

export function isValidCurrencyAmount(value: unknown): value is number {
  if (typeof value !== 'number') return false;
  if (Number.isNaN(value)) return false;
  if (!Number.isFinite(value)) return false;
  return true;
}

export function getCurrencyInfo(code: CurrencyCode): CurrencyInfo | undefined {
  return currencies[code];
}

export function getAllCurrencies(): CurrencyInfo[] {
  return Object.values(currencies);
}

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

export function currencyEquals(
  a: number,
  b: number,
  currency: CurrencyCode = 'BRL'
): boolean {
  return compareCurrency(a, b, currency) === 0;
}
