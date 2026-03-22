import { describe, it, expect } from 'vitest';
import {
  formatCurrency, parseCurrency, centsToValue, valueToCents,
  calculatePercentage, getPercentage, calculateDiscount, calculateTax,
  calculateInstallments, sumCurrency, roundCurrency, isValidCurrencyAmount,
  getCurrencyInfo, getAllCurrencies, formatCurrencyRange, compareCurrency, currencyEquals,
} from '../currency';

// ============================
// formatCurrency (currency.ts)
// ============================
describe('formatCurrency (currency)', () => {
  it('formata BRL padrão', () => expect(formatCurrency(1234.56)).toBe('R$ 1.234,56'));
  it('formata USD', () => expect(formatCurrency(1234.56, 'USD')).toBe('$ 1,234.56'));
  it('formata EUR', () => expect(formatCurrency(1234.56, 'EUR')).toBe('€ 1.234,56'));
  it('negativo', () => expect(formatCurrency(-500, 'BRL')).toBe('-R$ 500,00'));
  it('sem símbolo', () => expect(formatCurrency(100, 'BRL', { showSymbol: false })).toBe('100,00'));
  it('com código', () => expect(formatCurrency(100, 'BRL', { showSymbol: false, showCode: true })).toBe('100,00 BRL'));
  it('compacto K', () => expect(formatCurrency(1500, 'BRL', { compact: true })).toBe('R$ 1,5K'));
  it('compacto M', () => expect(formatCurrency(2500000, 'BRL', { compact: true })).toBe('R$ 2,5M'));
  it('compacto B', () => expect(formatCurrency(3000000000, 'BRL', { compact: true })).toBe('R$ 3,0B'));
  it('JPY sem decimais', () => expect(formatCurrency(1234, 'JPY')).toBe('¥ 1,234'));
});

// ============================
// parseCurrency
// ============================
describe('parseCurrency', () => {
  it('parse BRL', () => expect(parseCurrency('R$ 1.234,56')).toBeCloseTo(1234.56));
  it('parse USD', () => expect(parseCurrency('$ 1,234.56', 'USD')).toBeCloseTo(1234.56));
  it('parse negativo', () => expect(parseCurrency('-R$ 500,00')).toBeCloseTo(-500));
  it('parse compacto K', () => expect(parseCurrency('1,5K')).toBeCloseTo(1500));
  it('parse compacto M', () => expect(parseCurrency('2,5M')).toBeCloseTo(2500000));
  it('parse vazio retorna NaN', () => expect(parseCurrency('')).toBeNaN());
  it('parse null retorna NaN', () => expect(parseCurrency(null as unknown as string)).toBeNaN());
});

// ============================
// centsToValue / valueToCents
// ============================
describe('centsToValue', () => {
  it('100 centavos = R$1,00', () => expect(centsToValue(100)).toBe(1));
  it('1550 centavos = R$15,50', () => expect(centsToValue(1550)).toBe(15.5));
  it('JPY sem centavos', () => expect(centsToValue(1234, 'JPY')).toBe(1234));
});

describe('valueToCents', () => {
  it('R$1,00 = 100 centavos', () => expect(valueToCents(1)).toBe(100));
  it('R$15,50 = 1550 centavos', () => expect(valueToCents(15.5)).toBe(1550));
  it('arredonda corretamente', () => expect(valueToCents(0.1 + 0.2)).toBe(30));
});

// ============================
// calculatePercentage / getPercentage
// ============================
describe('calculatePercentage', () => {
  it('10% de 200 = 20', () => expect(calculatePercentage(200, 10)).toBe(20));
  it('50% de 100 = 50', () => expect(calculatePercentage(100, 50)).toBe(50));
  it('0% de 100 = 0', () => expect(calculatePercentage(100, 0)).toBe(0));
});

describe('getPercentage', () => {
  it('50 de 200 = 25%', () => expect(getPercentage(50, 200)).toBe(25));
  it('0 de 100 = 0%', () => expect(getPercentage(0, 100)).toBe(0));
  it('divisão por zero = 0%', () => expect(getPercentage(50, 0)).toBe(0));
});

// ============================
// calculateDiscount
// ============================
describe('calculateDiscount', () => {
  it('10% de desconto em 100', () => {
    const r = calculateDiscount(100, 10);
    expect(r.discountAmount).toBe(10);
    expect(r.finalPrice).toBe(90);
  });
  it('0% sem desconto', () => {
    const r = calculateDiscount(100, 0);
    expect(r.discountAmount).toBe(0);
    expect(r.finalPrice).toBe(100);
  });
});

// ============================
// calculateTax
// ============================
describe('calculateTax', () => {
  it('imposto exclusivo', () => {
    const r = calculateTax(100, 10);
    expect(r.taxAmount).toBe(10);
    expect(r.total).toBe(110);
  });
  it('imposto inclusivo', () => {
    const r = calculateTax(110, 10, true);
    expect(r.taxAmount).toBeCloseTo(10, 0);
    expect(r.baseValue).toBeCloseTo(100, 0);
    expect(r.total).toBe(110);
  });
});

// ============================
// calculateInstallments
// ============================
describe('calculateInstallments', () => {
  it('sem juros', () => {
    const r = calculateInstallments(1000, 4);
    expect(r.installmentValue).toBe(250);
    expect(r.totalWithInterest).toBe(1000);
    expect(r.interestAmount).toBe(0);
    expect(r.installmentDetails.length).toBe(4);
  });
  it('com juros', () => {
    const r = calculateInstallments(1000, 3, 2);
    expect(r.installmentValue).toBeGreaterThan(333);
    expect(r.totalWithInterest).toBeGreaterThan(1000);
    expect(r.interestAmount).toBeGreaterThan(0);
  });
  it('parcela única', () => {
    const r = calculateInstallments(500, 1);
    expect(r.installmentValue).toBe(500);
  });
  it('erro para 0 parcelas', () => {
    expect(() => calculateInstallments(1000, 0)).toThrow();
  });
});

// ============================
// sumCurrency
// ============================
describe('sumCurrency', () => {
  it('soma valores', () => expect(sumCurrency([10, 20, 30])).toBe(60));
  it('soma com decimais', () => expect(sumCurrency([0.1, 0.2])).toBeCloseTo(0.3));
  it('array vazio', () => expect(sumCurrency([])).toBe(0));
});

// ============================
// roundCurrency
// ============================
describe('roundCurrency', () => {
  it('arredonda BRL', () => expect(roundCurrency(1.555)).toBe(1.56));
  it('arredonda JPY', () => expect(roundCurrency(1.5, 'JPY')).toBe(2));
});

// ============================
// isValidCurrencyAmount
// ============================
describe('isValidCurrencyAmount', () => {
  it('número válido', () => expect(isValidCurrencyAmount(100)).toBe(true));
  it('zero válido', () => expect(isValidCurrencyAmount(0)).toBe(true));
  it('negativo válido', () => expect(isValidCurrencyAmount(-100)).toBe(true));
  it('NaN inválido', () => expect(isValidCurrencyAmount(NaN)).toBe(false));
  it('Infinity inválido', () => expect(isValidCurrencyAmount(Infinity)).toBe(false));
  it('string inválido', () => expect(isValidCurrencyAmount('100')).toBe(false));
  it('null inválido', () => expect(isValidCurrencyAmount(null)).toBe(false));
});

// ============================
// getCurrencyInfo / getAllCurrencies
// ============================
describe('getCurrencyInfo', () => {
  it('BRL', () => expect(getCurrencyInfo('BRL')?.symbol).toBe('R$'));
  it('USD', () => expect(getCurrencyInfo('USD')?.symbol).toBe('$'));
});

describe('getAllCurrencies', () => {
  it('retorna múltiplas moedas', () => expect(getAllCurrencies().length).toBeGreaterThanOrEqual(8));
});

// ============================
// formatCurrencyRange
// ============================
describe('formatCurrencyRange', () => {
  it('formata range BRL', () => {
    const result = formatCurrencyRange(100, 500);
    expect(result).toContain('100');
    expect(result).toContain('500');
  });
});

// ============================
// compareCurrency / currencyEquals
// ============================
describe('compareCurrency', () => {
  it('menor', () => expect(compareCurrency(10, 20)).toBe(-1));
  it('igual', () => expect(compareCurrency(10, 10)).toBe(0));
  it('maior', () => expect(compareCurrency(20, 10)).toBe(1));
  it('igualdade com floating point', () => expect(compareCurrency(0.1 + 0.2, 0.3)).toBe(0));
});

describe('currencyEquals', () => {
  it('iguais', () => expect(currencyEquals(100, 100)).toBe(true));
  it('diferentes', () => expect(currencyEquals(100, 200)).toBe(false));
  it('floating point', () => expect(currencyEquals(0.1 + 0.2, 0.3)).toBe(true));
});
