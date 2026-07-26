import { describe, it, expect } from 'vitest';
import {
  normalizarAgregados,
  periodoAnterior,
  mesesDoIntervalo,
} from '@/hooks/useIndicesContabeis';

describe('normalizarAgregados', () => {
  it('aceita retorno em array (RPC set-returning)', () => {
    const a = normalizarAgregados([{ ativo_total: '1500.50', dias_periodo: 30 }]);
    expect(a.ativoTotal).toBe(1500.5);
    expect(a.diasPeriodo).toBe(30);
  });

  it('preenche zeros quando o campo está ausente', () => {
    const a = normalizarAgregados([{}]);
    expect(a.receitaLiquida).toBe(0);
    expect(a.patrimonioLiquido).toBe(0);
  });

  it('nunca produz NaN a partir de lixo', () => {
    const a = normalizarAgregados([{ ativo_total: 'abc', cmv: null, dias_periodo: 0 }]);
    expect(Number.isFinite(a.ativoTotal)).toBe(true);
    expect(a.cmv).toBe(0);
    expect(a.diasPeriodo).toBe(1);
  });

  it('tolera null/undefined', () => {
    expect(normalizarAgregados(null).ativoTotal).toBe(0);
    expect(normalizarAgregados(undefined).ativoTotal).toBe(0);
  });
});

describe('periodoAnterior', () => {
  it('desloca um mês inteiro', () => {
    expect(periodoAnterior('2026-02-01', '2026-02-28')).toEqual({
      dataInicio: '2026-01-04',
      dataFim: '2026-01-31',
    });
  });

  it('mantém a duração do intervalo', () => {
    const r = periodoAnterior('2026-01-01', '2026-01-10');
    expect(r).toEqual({ dataInicio: '2025-12-22', dataFim: '2025-12-31' });
  });

  it('retorna null para datas inválidas', () => {
    expect(periodoAnterior('xx', '2026-01-10')).toBeNull();
  });
});

describe('mesesDoIntervalo', () => {
  it('divide o ano em 12 competências', () => {
    const meses = mesesDoIntervalo('2026-01-01', '2026-12-31');
    expect(meses).toHaveLength(12);
    expect(meses[0]).toEqual({ inicio: '2026-01-01', fim: '2026-01-31', competencia: '2026-01' });
    expect(meses[11].fim).toBe('2026-12-31');
  });

  it('limita a 24 competências', () => {
    expect(mesesDoIntervalo('2000-01-01', '2026-12-31')).toHaveLength(24);
  });

  it('retorna vazio quando o intervalo é invertido', () => {
    expect(mesesDoIntervalo('2026-12-01', '2026-01-01')).toEqual([]);
  });
});
