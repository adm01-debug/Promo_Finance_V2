import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatDateShort,
  formatPercentage,
  formatNumber,
  getDaysUntil,
  getDaysOverdue,
  getRelativeTime,
  getCNPJFormatted,
  getStatusLabel,
  getEtapaCobrancaLabel,
} from '@/lib/formatters';

describe('formatCurrency', () => {
  it('should format positive numbers correctly', () => {
    expect(formatCurrency(1234.56)).toBe('R$\u00A01.234,56');
    expect(formatCurrency(1000)).toBe('R$\u00A01.000,00');
    expect(formatCurrency(0)).toBe('R$\u00A00,00');
  });

  it('should format negative numbers correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-R$\u00A01.234,56');
  });

  it('should handle large numbers', () => {
    expect(formatCurrency(1000000)).toBe('R$\u00A01.000.000,00');
  });

  it('should handle small decimal values', () => {
    expect(formatCurrency(0.01)).toBe('R$\u00A00,01');
    expect(formatCurrency(0.99)).toBe('R$\u00A00,99');
  });
});

describe('formatCurrencyCompact', () => {
  it('should format millions with M suffix', () => {
    expect(formatCurrencyCompact(1000000)).toBe('R$ 1.0M');
    expect(formatCurrencyCompact(2500000)).toBe('R$ 2.5M');
  });

  it('should format thousands with K suffix', () => {
    expect(formatCurrencyCompact(1000)).toBe('R$ 1.0K');
    expect(formatCurrencyCompact(50000)).toBe('R$ 50.0K');
  });

  it('should format small numbers normally', () => {
    expect(formatCurrencyCompact(500)).toBe('R$\u00A0500,00');
    expect(formatCurrencyCompact(99)).toBe('R$\u00A099,00');
  });
});

describe('formatDate', () => {
  it('should format date strings correctly', () => {
    const result = formatDate('2024-01-15');
    expect(result).toMatch(/15\/01\/2024/);
  });

  it('should format Date objects correctly', () => {
    const date = new Date(2024, 5, 20); // June 20, 2024
    const result = formatDate(date);
    expect(result).toMatch(/20\/06\/2024/);
  });
});

describe('formatPercentage', () => {
  it('should format positive percentages with + sign', () => {
    expect(formatPercentage(5.5)).toBe('+5.5%');
    expect(formatPercentage(100)).toBe('+100.0%');
  });

  it('should format negative percentages without + sign', () => {
    expect(formatPercentage(-3.2)).toBe('-3.2%');
  });

  it('should format zero correctly', () => {
    expect(formatPercentage(0)).toBe('+0.0%');
  });
});

describe('formatNumber', () => {
  it('should format numbers with Brazilian locale', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
    expect(formatNumber(1000)).toBe('1.000');
  });
});

describe('getCNPJFormatted', () => {
  it('should format CNPJ correctly', () => {
    expect(getCNPJFormatted('12345678000190')).toBe('12.345.678/0001-90');
  });

  it('should handle already formatted CNPJ', () => {
    const formatted = getCNPJFormatted('12.345.678/0001-90');
    expect(formatted).toBe('12.345.678/0001-90');
  });

  it('should handle CNPJ with extra characters', () => {
    expect(getCNPJFormatted('12-345-678/0001-90')).toBe('12.345.678/0001-90');
  });
});

describe('getStatusLabel', () => {
  it('should return correct labels for known statuses', () => {
    expect(getStatusLabel('pago')).toBe('Pago');
    expect(getStatusLabel('pendente')).toBe('Pendente');
    expect(getStatusLabel('vencido')).toBe('Vencido');
    expect(getStatusLabel('parcial')).toBe('Parcial');
    expect(getStatusLabel('cancelado')).toBe('Cancelado');
  });

  it('should return the input for unknown statuses', () => {
    expect(getStatusLabel('unknown')).toBe('unknown');
  });
});

describe('getEtapaCobrancaLabel', () => {
  it('should return correct labels for known stages', () => {
    expect(getEtapaCobrancaLabel('preventiva')).toBe('Preventiva');
    expect(getEtapaCobrancaLabel('lembrete')).toBe('Lembrete');
    expect(getEtapaCobrancaLabel('cobranca')).toBe('Cobrança');
    expect(getEtapaCobrancaLabel('negociacao')).toBe('Negociação');
    expect(getEtapaCobrancaLabel('juridico')).toBe('Jurídico');
  });

  it('should return the input for unknown stages', () => {
    expect(getEtapaCobrancaLabel('outro')).toBe('outro');
  });
});

describe('getDaysUntil', () => {
  it('should return positive days for future dates', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    expect(getDaysUntil(futureDate)).toBe(5);
  });

  it('should return negative days for past dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);
    expect(getDaysUntil(pastDate)).toBe(-3);
  });

  it('should return 0 for today', () => {
    const today = new Date();
    expect(getDaysUntil(today)).toBe(0);
  });
});

describe('getDaysOverdue', () => {
  it('should return 0 for future dates', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    expect(getDaysOverdue(futureDate)).toBe(0);
  });

  it('should return positive days for past dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);
    expect(getDaysOverdue(pastDate)).toBe(3);
  });
});
