import { describe, it, expect } from 'vitest';
import {
  validateCPF, validateCNPJ, validateCPFOrCNPJ,
  formatCPF, formatCNPJ, formatCPFOrCNPJ,
  generateCPF, generateCNPJ,
  validatePhone, formatPhone,
  validateCEP, formatCEP,
  validateState, getStateName, getAllStates,
  validateBankAccount, validatePIXKey,
} from '../brazilian-validators';

// ============================
// CPF
// ============================
describe('validateCPF', () => {
  it('CPF válido', () => expect(validateCPF('529.982.247-25')).toBe(true));
  it('CPF válido sem formatação', () => expect(validateCPF('52998224725')).toBe(true));
  it('CPF inválido - dígito errado', () => expect(validateCPF('52998224726')).toBe(false));
  it('CPF inválido - todos iguais', () => expect(validateCPF('11111111111')).toBe(false));
  it('CPF inválido - curto', () => expect(validateCPF('123')).toBe(false));
  it('CPF inválido - vazio', () => expect(validateCPF('')).toBe(false));
  it('CPF inválido com dígitos errados', () => expect(validateCPF('34738834010')).toBe(false));
});

describe('formatCPF', () => {
  it('formata corretamente', () => expect(formatCPF('52998224725')).toBe('529.982.247-25'));
  it('já formatado', () => expect(formatCPF('529.982.247-25')).toBe('529.982.247-25'));
  it('curto retorna original', () => expect(formatCPF('123')).toBe('123'));
});

// ============================
// CNPJ
// ============================
describe('validateCNPJ', () => {
  it('CNPJ válido', () => expect(validateCNPJ('11.222.333/0001-81')).toBe(true));
  it('CNPJ válido sem formatação', () => expect(validateCNPJ('11222333000181')).toBe(true));
  it('CNPJ inválido - dígito errado', () => expect(validateCNPJ('11222333000182')).toBe(false));
  it('CNPJ inválido - todos iguais', () => expect(validateCNPJ('11111111111111')).toBe(false));
  it('CNPJ inválido - curto', () => expect(validateCNPJ('123')).toBe(false));
});

describe('formatCNPJ', () => {
  it('formata corretamente', () => expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81'));
  it('curto retorna original', () => expect(formatCNPJ('123')).toBe('123'));
});

// ============================
// CPF or CNPJ
// ============================
describe('validateCPFOrCNPJ', () => {
  it('valida CPF', () => expect(validateCPFOrCNPJ('52998224725')).toBe(true));
  it('valida CNPJ', () => expect(validateCPFOrCNPJ('11222333000181')).toBe(true));
  it('rejeita tamanho errado', () => expect(validateCPFOrCNPJ('12345')).toBe(false));
});

describe('formatCPFOrCNPJ', () => {
  it('formata CPF', () => expect(formatCPFOrCNPJ('52998224725')).toBe('529.982.247-25'));
  it('formata CNPJ', () => expect(formatCPFOrCNPJ('11222333000181')).toBe('11.222.333/0001-81'));
  it('retorna original para tamanho inválido', () => expect(formatCPFOrCNPJ('12345')).toBe('12345'));
});

// ============================
// Generators
// ============================
describe('generateCPF', () => {
  it('gera CPF válido', () => {
    const cpf = generateCPF();
    const digits = cpf.replace(/\D/g, '');
    expect(digits.length).toBe(11);
    expect(validateCPF(digits)).toBe(true);
  });
  it('gera CPFs diferentes', () => {
    const cpf1 = generateCPF();
    const cpf2 = generateCPF();
    // Muito improvável serem iguais
    expect(cpf1).not.toBe(cpf2);
  });
});

describe('generateCNPJ', () => {
  it('gera CNPJ válido', () => {
    const cnpj = generateCNPJ();
    const digits = cnpj.replace(/\D/g, '');
    expect(digits.length).toBe(14);
    expect(validateCNPJ(digits)).toBe(true);
  });
});

// ============================
// Phone
// ============================
describe('validatePhone', () => {
  it('celular válido', () => expect(validatePhone('11999887766')).toBe(true));
  it('fixo válido', () => expect(validatePhone('1133445566')).toBe(true));
  it('DDD inválido', () => expect(validatePhone('00999887766')).toBe(false));
  it('celular sem 9', () => expect(validatePhone('11899887766')).toBe(false));
  it('curto demais', () => expect(validatePhone('123')).toBe(false));
  it('com formatação', () => expect(validatePhone('(11) 99988-7766')).toBe(true));
});

describe('formatPhone (brazilian-validators)', () => {
  it('celular', () => expect(formatPhone('11999887766')).toBe('(11) 99988-7766'));
  it('fixo', () => expect(formatPhone('1133445566')).toBe('(11) 3344-5566'));
});

// ============================
// CEP
// ============================
describe('validateCEP', () => {
  it('CEP válido', () => expect(validateCEP('01310-100')).toBe(true));
  it('CEP válido sem formatação', () => expect(validateCEP('01310100')).toBe(true));
  it('CEP inválido', () => expect(validateCEP('123')).toBe(false));
});

describe('formatCEP (brazilian-validators)', () => {
  it('formata CEP', () => expect(formatCEP('01310100')).toBe('01310-100'));
  it('já formatado', () => expect(formatCEP('01310-100')).toBe('01310-100'));
});

// ============================
// States
// ============================
describe('validateState', () => {
  it('SP válido', () => expect(validateState('SP')).toBe(true));
  it('sp minúsculo válido', () => expect(validateState('sp')).toBe(true));
  it('XX inválido', () => expect(validateState('XX')).toBe(false));
});

describe('getStateName', () => {
  it('SP → São Paulo', () => expect(getStateName('SP')).toBe('São Paulo'));
  it('RJ → Rio de Janeiro', () => expect(getStateName('RJ')).toBe('Rio de Janeiro'));
  it('XX → vazio', () => expect(getStateName('XX')).toBe(''));
});

describe('getAllStates', () => {
  it('retorna 27 estados', () => expect(getAllStates().length).toBe(27));
  it('primeiro é AC', () => expect(getAllStates()[0].abbr).toBe('AC'));
});

// ============================
// Bank Account
// ============================
describe('validateBankAccount', () => {
  it('conta válida', () => expect(validateBankAccount('001', '1234', '12345678')).toBe(true));
  it('banco inválido', () => expect(validateBankAccount('12', '1234', '12345678')).toBe(false));
  it('agência curta', () => expect(validateBankAccount('001', '12', '12345678')).toBe(false));
  it('conta curta', () => expect(validateBankAccount('001', '1234', '12')).toBe(false));
});

// ============================
// PIX Key
// ============================
describe('validatePIXKey', () => {
  it('CPF como chave', () => expect(validatePIXKey('52998224725', 'cpf')).toBe(true));
  it('CNPJ como chave', () => expect(validatePIXKey('11222333000181', 'cnpj')).toBe(true));
  it('email como chave', () => expect(validatePIXKey('test@email.com', 'email')).toBe(true));
  it('email inválido', () => expect(validatePIXKey('notanemail', 'email')).toBe(false));
  it('chave aleatória válida', () => expect(validatePIXKey('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'random')).toBe(true));
  it('auto-detect CPF', () => expect(validatePIXKey('52998224725')).toBe(true));
  it('auto-detect email', () => expect(validatePIXKey('test@email.com')).toBe(true));
  it('auto-detect aleatória', () => expect(validatePIXKey('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true));
});
