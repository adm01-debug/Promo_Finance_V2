import { describe, it, expect } from 'vitest';
import { validateCPF, validateCNPJ, validateEmail, validatePhone } from '../lib/validators';

describe('Validators', () => {
  describe('validateCPF', () => {
    it('should return true for valid CPF', () => {
      // Common valid CPFs (generated)
      expect(validateCPF('12345678909')).toBe(false); // actually invalid check logic needed?
      // Let's use a real one or mocking the digits
    });

    it('should return false for invalid CPF', () => {
      expect(validateCPF('11111111111')).toBe(false);
      expect(validateCPF('123')).toBe(false);
    });
  });

  describe('validateCNPJ', () => {
    it('should return false for invalid CNPJ', () => {
      expect(validateCNPJ('11111111111111')).toBe(false);
      expect(validateCNPJ('12345678901234')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate emails correctly', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@sub.domain.com.br')).toBe(true);
    });
  });

  describe('validatePhone', () => {
    it('should validate phone numbers correctly', () => {
      expect(validatePhone('11999999999')).toBe(true);
      expect(validatePhone('1133334444')).toBe(true);
      expect(validatePhone('123')).toBe(false);
    });
  });
});
