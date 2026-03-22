import { describe, it, expect } from 'vitest';
import {
  formatCurrency, formatCurrencyCompact, formatDate, formatDateShort, formatDateTime,
  formatPercentage, formatNumber, getDaysUntil, getDaysOverdue, calculateOverdueDays,
  getRelativeTime, getCNPJFormatted, getStatusLabel, getEtapaCobrancaLabel,
  formatPhone, formatCPF, formatCEP, formatBytes, truncate, formatDuration,
  formatVariation, formatAverageDays, parseCurrencyInput, formatDateForInput,
  isToday, isPast, formatDisplayName, getInitials, formatNFNumber,
} from '../formatters';

// ============================
// formatCurrency
// ============================
describe('formatCurrency', () => {
  it('formata valor positivo', () => expect(formatCurrency(1234.56)).toContain('1.234,56'));
  it('formata zero', () => expect(formatCurrency(0)).toBe('R$ 0,00'));
  it('formata null', () => expect(formatCurrency(null)).toBe('R$ 0,00'));
  it('formata undefined', () => expect(formatCurrency(undefined)).toBe('R$ 0,00'));
  it('formata NaN', () => expect(formatCurrency(NaN)).toBe('R$ 0,00'));
  it('formata valor negativo', () => expect(formatCurrency(-500)).toContain('500,00'));
  it('formata centavos', () => expect(formatCurrency(0.01)).toContain('0,01'));
  it('formata milhão', () => expect(formatCurrency(1000000)).toContain('1.000.000'));
});

// ============================
// formatCurrencyCompact
// ============================
describe('formatCurrencyCompact', () => {
  it('formata em K', () => expect(formatCurrencyCompact(1500)).toBe('R$ 1.5K'));
  it('formata em M', () => expect(formatCurrencyCompact(2500000)).toBe('R$ 2.5M'));
  it('formata valor pequeno normalmente', () => expect(formatCurrencyCompact(500)).toContain('500'));
  it('formata null como zero', () => expect(formatCurrencyCompact(null)).toContain('0'));
  it('formata undefined como zero', () => expect(formatCurrencyCompact(undefined)).toContain('0'));
});

// ============================
// formatDate
// ============================
describe('formatDate', () => {
  it('formata string ISO', () => expect(formatDate('2024-01-15')).toBe('15/01/2024'));
  it('formata Date object', () => expect(formatDate(new Date(2024, 0, 15))).toBe('15/01/2024'));
  it('retorna - para null', () => expect(formatDate(null)).toBe('-'));
  it('retorna - para undefined', () => expect(formatDate(undefined)).toBe('-'));
  it('retorna - para data inválida', () => expect(formatDate('invalid')).toBe('-'));
  it('formata fim de ano', () => expect(formatDate('2024-12-31')).toBe('31/12/2024'));
});

// ============================
// formatDateShort
// ============================
describe('formatDateShort', () => {
  it('retorna formato curto', () => {
    const result = formatDateShort('2024-01-15');
    expect(result).toContain('15');
  });
  it('retorna - para null', () => expect(formatDateShort(null)).toBe('-'));
});

// ============================
// formatDateTime
// ============================
describe('formatDateTime', () => {
  it('inclui hora e minuto', () => {
    const result = formatDateTime('2024-01-15T14:30:00Z');
    expect(result).toContain('15/01/2024');
  });
  it('retorna - para null', () => expect(formatDateTime(null)).toBe('-'));
});

// ============================
// formatPercentage
// ============================
describe('formatPercentage', () => {
  it('formata positivo com +', () => expect(formatPercentage(12.5)).toBe('+12.5%'));
  it('formata negativo com -', () => expect(formatPercentage(-3.2)).toBe('-3.2%'));
  it('formata zero com +', () => expect(formatPercentage(0)).toBe('+0.0%'));
});

// ============================
// formatNumber
// ============================
describe('formatNumber', () => {
  it('formata com separador de milhar', () => expect(formatNumber(1234567)).toContain('1.234.567'));
  it('formata zero', () => expect(formatNumber(0)).toBe('0'));
});

// ============================
// getDaysUntil
// ============================
describe('getDaysUntil', () => {
  it('retorna positivo para data futura', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(getDaysUntil(future)).toBe(5);
  });
  it('retorna negativo para data passada', () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    expect(getDaysUntil(past)).toBe(-3);
  });
  it('retorna 0 para hoje', () => {
    expect(getDaysUntil(new Date())).toBe(0);
  });
});

// ============================
// getDaysOverdue
// ============================
describe('getDaysOverdue', () => {
  it('retorna dias de atraso para data passada', () => {
    const past = new Date();
    past.setDate(past.getDate() - 10);
    expect(getDaysOverdue(past)).toBe(10);
  });
  it('retorna 0 para data futura', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(getDaysOverdue(future)).toBe(0);
  });
});

// ============================
// calculateOverdueDays
// ============================
describe('calculateOverdueDays', () => {
  it('calcula dias de atraso', () => {
    const past = new Date();
    past.setDate(past.getDate() - 7);
    expect(calculateOverdueDays(past)).toBe(7);
  });
  it('retorna 0 para hoje', () => expect(calculateOverdueDays(new Date())).toBe(0));
});

// ============================
// getRelativeTime
// ============================
describe('getRelativeTime', () => {
  it('retorna "Agora" para agora', () => expect(getRelativeTime(new Date())).toBe('Agora'));
  it('retorna minutos atrás', () => {
    const d = new Date(Date.now() - 5 * 60000);
    expect(getRelativeTime(d)).toBe('5min atrás');
  });
  it('retorna horas atrás', () => {
    const d = new Date(Date.now() - 3 * 3600000);
    expect(getRelativeTime(d)).toBe('3h atrás');
  });
  it('retorna "Ontem"', () => {
    const d = new Date(Date.now() - 86400000);
    expect(getRelativeTime(d)).toBe('Ontem');
  });
  it('retorna dias atrás', () => {
    const d = new Date(Date.now() - 4 * 86400000);
    expect(getRelativeTime(d)).toBe('4 dias atrás');
  });
});

// ============================
// getCNPJFormatted
// ============================
describe('getCNPJFormatted', () => {
  it('formata CNPJ válido', () => expect(getCNPJFormatted('11222333000181')).toBe('11.222.333/0001-81'));
  it('já formatado retorna idêntico', () => expect(getCNPJFormatted('11.222.333/0001-81')).toBe('11.222.333/0001-81'));
});

// ============================
// getStatusLabel
// ============================
describe('getStatusLabel', () => {
  it('retorna Pago', () => expect(getStatusLabel('pago')).toBe('Pago'));
  it('retorna Pendente', () => expect(getStatusLabel('pendente')).toBe('Pendente'));
  it('retorna Vencido', () => expect(getStatusLabel('vencido')).toBe('Vencido'));
  it('retorna Parcial', () => expect(getStatusLabel('parcial')).toBe('Parcial'));
  it('retorna Cancelado', () => expect(getStatusLabel('cancelado')).toBe('Cancelado'));
  it('retorna original para desconhecido', () => expect(getStatusLabel('xyz')).toBe('xyz'));
});

// ============================
// getEtapaCobrancaLabel
// ============================
describe('getEtapaCobrancaLabel', () => {
  it('retorna Preventiva', () => expect(getEtapaCobrancaLabel('preventiva')).toBe('Preventiva'));
  it('retorna Lembrete', () => expect(getEtapaCobrancaLabel('lembrete')).toBe('Lembrete'));
  it('retorna Cobrança', () => expect(getEtapaCobrancaLabel('cobranca')).toBe('Cobrança'));
  it('retorna Negociação', () => expect(getEtapaCobrancaLabel('negociacao')).toBe('Negociação'));
  it('retorna Jurídico', () => expect(getEtapaCobrancaLabel('juridico')).toBe('Jurídico'));
});

// ============================
// formatPhone
// ============================
describe('formatPhone', () => {
  it('formata celular 11 dígitos', () => expect(formatPhone('11999887766')).toBe('(11) 99988-7766'));
  it('formata fixo 10 dígitos', () => expect(formatPhone('1133445566')).toBe('(11) 3344-5566'));
  it('retorna original se inválido', () => expect(formatPhone('123')).toBe('123'));
});

// ============================
// formatCPF
// ============================
describe('formatCPF', () => {
  it('formata CPF', () => expect(formatCPF('12345678901')).toBe('123.456.789-01'));
});

// ============================
// formatCEP
// ============================
describe('formatCEP', () => {
  it('formata CEP', () => expect(formatCEP('01310100')).toBe('01310-100'));
});

// ============================
// formatBytes
// ============================
describe('formatBytes', () => {
  it('formata 0 bytes', () => expect(formatBytes(0)).toBe('0 Bytes'));
  it('formata KB', () => expect(formatBytes(1024)).toBe('1 KB'));
  it('formata MB', () => expect(formatBytes(1048576)).toBe('1 MB'));
  it('formata GB', () => expect(formatBytes(1073741824)).toBe('1 GB'));
  it('formata com decimais', () => expect(formatBytes(1536, 1)).toBe('1.5 KB'));
});

// ============================
// truncate
// ============================
describe('truncate', () => {
  it('não trunca texto curto', () => expect(truncate('abc', 10)).toBe('abc'));
  it('trunca texto longo', () => expect(truncate('abcdefghijklm', 10)).toBe('abcdefg...'));
  it('preserva exato no limite', () => expect(truncate('12345', 5)).toBe('12345'));
});

// ============================
// formatDuration
// ============================
describe('formatDuration', () => {
  it('formata minutos', () => expect(formatDuration(45)).toBe('45min'));
  it('formata horas e minutos', () => expect(formatDuration(90)).toBe('1h 30min'));
  it('formata dias e horas', () => expect(formatDuration(1500)).toBe('1d 1h'));
});

// ============================
// formatVariation
// ============================
describe('formatVariation', () => {
  it('positivo', () => {
    const r = formatVariation(12.5);
    expect(r.text).toBe('+12.5%');
    expect(r.isPositive).toBe(true);
  });
  it('negativo', () => {
    const r = formatVariation(-5.3);
    expect(r.text).toBe('-5.3%');
    expect(r.isPositive).toBe(false);
  });
});

// ============================
// formatAverageDays
// ============================
describe('formatAverageDays', () => {
  it('zero retorna Hoje', () => expect(formatAverageDays(0)).toBe('Hoje'));
  it('1 dia', () => expect(formatAverageDays(1)).toBe('1 dia'));
  it('múltiplos dias', () => expect(formatAverageDays(15)).toBe('15 dias'));
});

// ============================
// parseCurrencyInput
// ============================
describe('parseCurrencyInput', () => {
  it('parse R$ 1.234,56', () => expect(parseCurrencyInput('R$ 1.234,56')).toBeCloseTo(1234.56));
  it('parse vazio retorna 0', () => expect(parseCurrencyInput('')).toBe(0));
  it('parse inválido retorna 0', () => expect(parseCurrencyInput('abc')).toBe(0));
});

// ============================
// formatDateForInput
// ============================
describe('formatDateForInput', () => {
  it('formata para YYYY-MM-DD', () => {
    const result = formatDateForInput('2024-01-15T00:00:00Z');
    expect(result).toBe('2024-01-15');
  });
  it('retorna vazio para null', () => expect(formatDateForInput(null)).toBe(''));
});

// ============================
// isToday / isPast
// ============================
describe('isToday', () => {
  it('retorna true para hoje', () => expect(isToday(new Date())).toBe(true));
  it('retorna false para ontem', () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    expect(isToday(d)).toBe(false);
  });
});

describe('isPast', () => {
  it('retorna true para passado', () => expect(isPast('2020-01-01')).toBe(true));
  it('retorna false para futuro', () => expect(isPast('2030-01-01')).toBe(false));
});

// ============================
// formatDisplayName
// ============================
describe('formatDisplayName', () => {
  it('primeiro + último', () => expect(formatDisplayName('João Carlos Silva')).toBe('João Silva'));
  it('nome único', () => expect(formatDisplayName('Madonna')).toBe('Madonna'));
});

// ============================
// getInitials
// ============================
describe('getInitials', () => {
  it('duas iniciais', () => expect(getInitials('João Silva')).toBe('JS'));
  it('nome composto', () => expect(getInitials('Maria das Graças Souza')).toBe('MS'));
  it('nome único', () => expect(getInitials('Ana')).toBe('AN'));
});

// ============================
// formatNFNumber
// ============================
describe('formatNFNumber', () => {
  it('formata número com padding', () => expect(formatNFNumber('123')).toBe('000.000.123'));
  it('formata número completo', () => expect(formatNFNumber('123456789')).toBe('123.456.789'));
});
