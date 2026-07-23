import { describe, it, expect } from 'vitest';
import { formatFilterValue } from '../format-filter-value';

describe('formatFilterValue', () => {
  it('valores vazios viram travessão', () => {
    expect(formatFilterValue(null)).toBe('—');
    expect(formatFilterValue(undefined)).toBe('—');
    expect(formatFilterValue('')).toBe('—');
    expect(formatFilterValue('   ')).toBe('—');
    expect(formatFilterValue([])).toBe('—');
  });

  it('booleans', () => {
    expect(formatFilterValue(true)).toBe('Sim');
    expect(formatFilterValue(false)).toBe('Não');
  });

  it('números pt-BR', () => {
    expect(formatFilterValue(1234)).toBe('1.234');
    expect(formatFilterValue(1234.5)).toBe('1.234,50');
    expect(formatFilterValue(Number.POSITIVE_INFINITY)).toBe('—');
    expect(formatFilterValue(Number.NaN)).toBe('—');
  });

  it('strings numéricas com vírgula', () => {
    expect(formatFilterValue('1234,5')).toBe('1.234,50');
    expect(formatFilterValue('42')).toBe('42');
  });

  it('datas ISO', () => {
    expect(formatFilterValue('2026-01-15')).toBe('15/01/2026');
    expect(formatFilterValue(new Date('2026-07-23T00:00:00Z'))).toMatch(/23\/07\/2026|22\/07\/2026/);
  });

  it('arrays até 3 itens listam; >3 mostra contagem', () => {
    expect(formatFilterValue(['a', 'b'])).toBe('a, b');
    expect(formatFilterValue([1, 2, 3, 4, 5])).toBe('5 itens');
  });

  it('objetos range (from/to, start/end, dataInicio/dataFim)', () => {
    expect(formatFilterValue({ from: '2026-01-01', to: '2026-01-31' })).toBe('01/01/2026 → 31/01/2026');
    expect(formatFilterValue({ start: 10, end: 20 })).toBe('10 → 20');
  });

  it('objetos com label/nome usam o label', () => {
    expect(formatFilterValue({ label: 'Cliente X' })).toBe('Cliente X');
    expect(formatFilterValue({ nome: 'Fornecedor Y' })).toBe('Fornecedor Y');
  });

  it('strings longas são truncadas com reticência', () => {
    const long = 'a'.repeat(80);
    const out = formatFilterValue(long);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(32);
  });
});
