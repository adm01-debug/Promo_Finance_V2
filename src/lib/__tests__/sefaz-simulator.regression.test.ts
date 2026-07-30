import { describe, it, expect } from 'vitest';
import * as api from '@/lib/sefaz-simulator';

describe('sefaz-simulator — regressão de API pública', () => {
  it('preserva exports históricos', () => {
    expect(typeof api.processarSefaz).toBe('function');
    expect(api.SEFAZ_STATUS['100']).toBe('Autorizado o uso da NF-e');
  });
});
