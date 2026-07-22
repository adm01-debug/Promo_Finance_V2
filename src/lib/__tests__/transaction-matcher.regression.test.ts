import { describe, it, expect } from 'vitest';
import * as api from '@/lib/transaction-matcher';

describe('transaction-matcher — regressão de API pública', () => {
  it('expõe símbolos históricos após modularização', () => {
    expect(api.DEFAULT_CONFIG).toBeDefined();
    expect(api.TOLERANCIA_CENTAVOS).toBe(0.5);
    expect(typeof api.encontrarMatchesParaTransacao).toBe('function');
    expect(typeof api.encontrarTodosMatches).toBe('function');
    expect(typeof api.calcularEstatisticasMatch).toBe('function');
    expect(typeof api.converterContasPagarParaLancamentos).toBe('function');
    expect(typeof api.converterContasReceberParaLancamentos).toBe('function');
  });
});
