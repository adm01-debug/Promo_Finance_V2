import { describe, it, expect } from 'vitest';
import { UFS } from '@/pages/tributario/consulta-rapida/shared';
import { pct } from '@/pages/tributario/consulta-rapida/format';

describe('pct', () => {
  it('trata nulos e NaN como travessão', () => {
    expect(pct(null)).toBe('—');
    expect(pct(undefined)).toBe('—');
    expect(pct(Number.NaN)).toBe('—');
  });

  it('converte frações em percentual', () => {
    expect(pct(0.18)).toBe('18%');
    expect(pct(0.075)).toBe('7,5%');
  });

  it('mantém valores já expressos em pontos percentuais', () => {
    expect(pct(18)).toBe('18%');
    expect(pct(4.5)).toBe('4,5%');
  });

  it('zero é exibido explicitamente (não confundir com ausência)', () => {
    expect(pct(0)).toBe('0%');
  });
});

describe('UFS', () => {
  it('cobre as 27 unidades federativas sem duplicidade', () => {
    expect(UFS).toHaveLength(27);
    expect(new Set(UFS).size).toBe(27);
  });
});
