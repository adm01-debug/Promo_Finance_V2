import { describe, it, expect } from 'vitest';
import {
  validateCPF,
  validateCNPJ,
  validateCPFOrCNPJ,
  formatCPF,
  formatCNPJ,
  formatCPFOrCNPJ,
  generateCPF,
  generateCNPJ,
  validatePhone,
  formatPhone,
  validateCEP,
  formatCEP,
  validateState,
  getStateName,
  getAllStates,
  validateBankAccount,
  validatePIXKey,
} from '../brazilian-validators';

describe('Brazilian Validators', () => {
  describe('validateCPF', () => {
    it('validates correct CPF', () => {
      expect(validateCPF('529.982.247-25')).toBe(true);
      expect(validateCPF('52998224725')).toBe(true);
      expect(validateCPF('111.444.777-35')).toBe(true);
    });

    it('rejects invalid CPF', () => {
      expect(validateCPF('529.982.247-26')).toBe(false); // Wrong check digit
      expect(validateCPF('123.456.789-00')).toBe(false); // Invalid
      expect(validateCPF('12345678900')).toBe(false); // Invalid
    });

    it('rejects CPF with repeated digits', () => {
      expect(validateCPF('111.111.111-11')).toBe(false);
      expect(validateCPF('000.000.000-00')).toBe(false);
      expect(validateCPF('999.999.999-99')).toBe(false);
    });

    it('rejects CPF with wrong length', () => {
      expect(validateCPF('123.456.789')).toBe(false);
      expect(validateCPF('123.456.789-001')).toBe(false);
    });
  });

  describe('validateCNPJ', () => {
    it('validates correct CNPJ', () => {
      expect(validateCNPJ('11.222.333/0001-81')).toBe(true);
      expect(validateCNPJ('11222333000181')).toBe(true);
    });

    it('rejects invalid CNPJ', () => {
      expect(validateCNPJ('11.222.333/0001-82')).toBe(false); // Wrong check digit
      expect(validateCNPJ('12.345.678/0001-00')).toBe(false); // Invalid
    });

    it('rejects CNPJ with repeated digits', () => {
      expect(validateCNPJ('11.111.111/1111-11')).toBe(false);
      expect(validateCNPJ('00.000.000/0000-00')).toBe(false);
    });

    it('rejects CNPJ with wrong length', () => {
      expect(validateCNPJ('11.222.333/0001')).toBe(false);
      expect(validateCNPJ('11.222.333/0001-811')).toBe(false);
    });
  });

  describe('validateCPFOrCNPJ', () => {
    it('validates CPF when 11 digits', () => {
      expect(validateCPFOrCNPJ('529.982.247-25')).toBe(true);
    });

    it('validates CNPJ when 14 digits', () => {
      expect(validateCPFOrCNPJ('11.222.333/0001-81')).toBe(true);
    });

    it('rejects other lengths', () => {
      expect(validateCPFOrCNPJ('12345')).toBe(false);
      expect(validateCPFOrCNPJ('1234567890123456')).toBe(false);
    });
  });

  describe('formatCPF', () => {
    it('formats CPF correctly', () => {
      expect(formatCPF('52998224725')).toBe('529.982.247-25');
    });

    it('returns original if invalid length', () => {
      expect(formatCPF('1234567890')).toBe('1234567890');
    });
  });

  describe('formatCNPJ', () => {
    it('formats CNPJ correctly', () => {
      expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81');
    });

    it('returns original if invalid length', () => {
      expect(formatCNPJ('1122233300018')).toBe('1122233300018');
    });
  });

  describe('formatCPFOrCNPJ', () => {
    it('formats CPF when 11 digits', () => {
      expect(formatCPFOrCNPJ('52998224725')).toBe('529.982.247-25');
    });

    it('formats CNPJ when 14 digits', () => {
      expect(formatCPFOrCNPJ('11222333000181')).toBe('11.222.333/0001-81');
    });

    it('returns original for other lengths', () => {
      expect(formatCPFOrCNPJ('12345')).toBe('12345');
    });
  });

  describe('generateCPF', () => {
    it('generates valid CPF', () => {
      for (let i = 0; i < 10; i++) {
        const cpf = generateCPF();
        expect(validateCPF(cpf)).toBe(true);
      }
    });

    it('generates formatted CPF', () => {
      const cpf = generateCPF();
      expect(cpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    });
  });

  describe('generateCNPJ', () => {
    it('generates valid CNPJ', () => {
      for (let i = 0; i < 10; i++) {
        const cnpj = generateCNPJ();
        expect(validateCNPJ(cnpj)).toBe(true);
      }
    });

    it('generates formatted CNPJ', () => {
      const cnpj = generateCNPJ();
      expect(cnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
    });
  });

  describe('validatePhone', () => {
    it('validates mobile phone (11 digits)', () => {
      expect(validatePhone('11999998888')).toBe(true);
      expect(validatePhone('(11) 99999-8888')).toBe(true);
    });

    it('validates landline (10 digits)', () => {
      expect(validatePhone('1133334444')).toBe(true);
      expect(validatePhone('(11) 3333-4444')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(validatePhone('123456789')).toBe(false); // Too short
      expect(validatePhone('111234567890')).toBe(false); // Invalid DDD
      expect(validatePhone('11812345678')).toBe(false); // Mobile must start with 9
    });

    it('rejects invalid DDD', () => {
      expect(validatePhone('01999998888')).toBe(false);
      expect(validatePhone('00999998888')).toBe(false);
    });
  });

  describe('formatPhone', () => {
    it('formats mobile phone', () => {
      expect(formatPhone('11999998888')).toBe('(11) 99999-8888');
    });

    it('formats landline', () => {
      expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
    });

    it('returns original for invalid length', () => {
      expect(formatPhone('123456')).toBe('123456');
    });
  });

  describe('validateCEP', () => {
    it('validates correct CEP', () => {
      expect(validateCEP('01310-100')).toBe(true);
      expect(validateCEP('01310100')).toBe(true);
    });

    it('rejects invalid CEP', () => {
      expect(validateCEP('1234567')).toBe(false);
      expect(validateCEP('123456789')).toBe(false);
      expect(validateCEP('1234-567')).toBe(false);
    });
  });

  describe('formatCEP', () => {
    it('formats CEP correctly', () => {
      expect(formatCEP('01310100')).toBe('01310-100');
    });

    it('returns original if invalid', () => {
      expect(formatCEP('1234567')).toBe('1234567');
    });
  });

  describe('validateState', () => {
    it('validates all Brazilian states', () => {
      const states = ['SP', 'RJ', 'MG', 'BA', 'RS', 'PR', 'SC', 'DF', 'GO', 'MT'];
      states.forEach((state) => {
        expect(validateState(state)).toBe(true);
      });
    });

    it('validates case insensitive', () => {
      expect(validateState('sp')).toBe(true);
      expect(validateState('Sp')).toBe(true);
    });

    it('rejects invalid states', () => {
      expect(validateState('XX')).toBe(false);
      expect(validateState('ZZ')).toBe(false);
    });
  });

  describe('getStateName', () => {
    it('returns state name', () => {
      expect(getStateName('SP')).toBe('São Paulo');
      expect(getStateName('RJ')).toBe('Rio de Janeiro');
      expect(getStateName('MG')).toBe('Minas Gerais');
    });

    it('works case insensitive', () => {
      expect(getStateName('sp')).toBe('São Paulo');
    });

    it('returns empty string for invalid', () => {
      expect(getStateName('XX')).toBe('');
    });
  });

  describe('getAllStates', () => {
    it('returns all 27 states', () => {
      const states = getAllStates();
      expect(states).toHaveLength(27);
    });

    it('returns objects with abbr and name', () => {
      const states = getAllStates();
      states.forEach((state) => {
        expect(state).toHaveProperty('abbr');
        expect(state).toHaveProperty('name');
        expect(state.abbr).toHaveLength(2);
      });
    });
  });

  describe('validateBankAccount', () => {
    it('validates correct bank account', () => {
      expect(validateBankAccount('001', '1234', '12345-6')).toBe(true);
      expect(validateBankAccount('341', '12345', '123456789012')).toBe(true);
    });

    it('rejects invalid bank code', () => {
      expect(validateBankAccount('01', '1234', '12345-6')).toBe(false);
      expect(validateBankAccount('0001', '1234', '12345-6')).toBe(false);
    });

    it('rejects invalid agency', () => {
      expect(validateBankAccount('001', '123', '12345-6')).toBe(false);
    });

    it('rejects invalid account', () => {
      expect(validateBankAccount('001', '1234', '1234')).toBe(false);
    });
  });

  describe('validatePIXKey', () => {
    it('validates CPF as PIX key', () => {
      expect(validatePIXKey('529.982.247-25', 'cpf')).toBe(true);
      expect(validatePIXKey('52998224725')).toBe(true); // Auto-detect
    });

    it('validates CNPJ as PIX key', () => {
      expect(validatePIXKey('11.222.333/0001-81', 'cnpj')).toBe(true);
      expect(validatePIXKey('11222333000181')).toBe(true); // Auto-detect
    });

    it('validates phone as PIX key', () => {
      expect(validatePIXKey('11999998888', 'phone')).toBe(true);
      expect(validatePIXKey('+5511999998888')).toBe(true);
    });

    it('validates email as PIX key', () => {
      expect(validatePIXKey('user@email.com', 'email')).toBe(true);
      expect(validatePIXKey('user@email.com')).toBe(true); // Auto-detect
    });

    it('validates random key', () => {
      expect(validatePIXKey('12345678-1234-1234-1234-123456789012', 'random')).toBe(true);
      expect(validatePIXKey('12345678-1234-1234-1234-123456789012')).toBe(true); // Auto-detect
    });

    it('rejects invalid keys', () => {
      expect(validatePIXKey('invalid', 'cpf')).toBe(false);
      expect(validatePIXKey('invalid', 'email')).toBe(false);
      expect(validatePIXKey('invalid')).toBe(false);
    });
  });
});
