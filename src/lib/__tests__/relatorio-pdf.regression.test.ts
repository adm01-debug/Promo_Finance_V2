import { describe, it, expect } from 'vitest';
import * as api from '@/lib/tributario/relatorio-pdf';

describe('relatorio-pdf — regressão de API pública', () => {
  it('preserva exports históricos', () => {
    expect(typeof api.gerarRelatorioPdfExecutivo).toBe('function');
    expect(typeof api.baixarRelatorioPdf).toBe('function');
    expect(typeof api.baixarRelatorioAuditoriaCreditos).toBe('function');
  });
});
