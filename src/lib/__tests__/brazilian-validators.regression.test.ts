import { describe, it, expect } from 'vitest';
import * as api from '@/lib/brazilian-validators';

describe('brazilian-validators — regressão de API pública', () => {
  it('preserva exports históricos', () => {
    const expected = [
      'validateCPF', 'validateCNPJ', 'validateCPFOrCNPJ',
      'formatCPF', 'formatCNPJ', 'formatCPFOrCNPJ',
      'generateCPF', 'generateCNPJ',
      'validatePhone', 'formatPhone',
      'validateCEP', 'formatCEP',
      'validateState', 'getStateName', 'getAllStates',
      'validateBankAccount', 'validatePIXKey',
    ] as const;
    for (const name of expected) {
      expect(typeof (api as unknown as Record<string, unknown>)[name]).toBe('function');
    }
  });

  it('validateCPF/CNPJ geram e validam consistentes', () => {
    for (let i = 0; i < 20; i++) {
      expect(api.validateCPF(api.generateCPF())).toBe(true);
      expect(api.validateCNPJ(api.generateCNPJ())).toBe(true);
    }
  });
});
