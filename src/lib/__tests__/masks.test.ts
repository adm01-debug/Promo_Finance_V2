import { describe, it, expect } from 'vitest';
import { maskCnpjCpf, applyCnpjMask, applyPhoneMask, applyCepMask, maskPhone, unmask, validateCPF, validateCNPJ, validateCnpjCpf } from '../masks';

// ============================
// maskCnpjCpf
// ============================
describe('maskCnpjCpf', () => {
  it('aplica máscara CPF parcial', () => expect(maskCnpjCpf('123456')).toBe('123.456'));
  it('aplica máscara CPF completo', () => expect(maskCnpjCpf('12345678901')).toBe('123.456.789-01'));
  it('aplica máscara CNPJ', () => expect(maskCnpjCpf('12345678000195')).toBe('12.345.678/0001-95'));
  it('aplica máscara CNPJ parcial', () => expect(maskCnpjCpf('12345678')).toBe('123.456.78'));
  it('vazio retorna vazio', () => expect(maskCnpjCpf('')).toBe(''));
});

// ============================
// applyCnpjMask
// ============================
describe('applyCnpjMask', () => {
  it('aplica máscara CNPJ', () => expect(applyCnpjMask('12345678000195')).toBe('12.345.678/0001-95'));
  it('limita a 14 dígitos', () => expect(applyCnpjMask('123456780001951234').replace(/\D/g, '').length).toBeLessThanOrEqual(14));
});

// ============================
// applyPhoneMask / maskPhone
// ============================
describe('maskPhone', () => {
  it('celular', () => expect(maskPhone('11999887766')).toBe('(11) 99988-7766'));
  it('fixo', () => expect(maskPhone('1133445566')).toBe('(11) 3344-5566'));
  it('parcial', () => expect(maskPhone('119')).toBe('(11) 9'));
  it('vazio', () => expect(maskPhone('')).toBe(''));
  it('limita a 11 dígitos', () => expect(maskPhone('119998877661234').replace(/\D/g, '').length).toBeLessThanOrEqual(11));
});

describe('applyPhoneMask', () => {
  it('delega para maskPhone', () => expect(applyPhoneMask('11999887766')).toBe('(11) 99988-7766'));
});

// ============================
// applyCepMask
// ============================
describe('applyCepMask', () => {
  it('aplica máscara CEP', () => expect(applyCepMask('01310100')).toBe('01310-100'));
  it('parcial', () => expect(applyCepMask('013')).toBe('013'));
  it('limita a 8 dígitos', () => expect(applyCepMask('0131010099').replace(/\D/g, '').length).toBeLessThanOrEqual(8));
});

// ============================
// unmask
// ============================
describe('unmask', () => {
  it('remove caracteres não numéricos', () => expect(unmask('123.456.789-01')).toBe('12345678901'));
  it('vazio retorna vazio', () => expect(unmask('')).toBe(''));
  it('somente letras retorna vazio', () => expect(unmask('abc')).toBe(''));
});

// ============================
// validateCPF (masks)
// ============================
describe('validateCPF (masks)', () => {
  it('CPF válido', () => expect(validateCPF('52998224725')).toBe(true));
  it('todos iguais inválido', () => expect(validateCPF('00000000000')).toBe(false));
  it('curto inválido', () => expect(validateCPF('123')).toBe(false));
});

// ============================
// validateCNPJ (masks)
// ============================
describe('validateCNPJ (masks)', () => {
  it('CNPJ válido', () => expect(validateCNPJ('11222333000181')).toBe(true));
  it('todos iguais inválido', () => expect(validateCNPJ('11111111111111')).toBe(false));
});

// ============================
// validateCnpjCpf
// ============================
describe('validateCnpjCpf', () => {
  it('CPF válido', () => {
    const r = validateCnpjCpf('52998224725');
    expect(r.valid).toBe(true);
    expect(r.type).toBe('cpf');
  });
  it('CNPJ válido', () => {
    const r = validateCnpjCpf('11222333000181');
    expect(r.valid).toBe(true);
    expect(r.type).toBe('cnpj');
  });
  it('CPF inválido', () => {
    const r = validateCnpjCpf('12345678900');
    expect(r.valid).toBe(false);
    expect(r.message).toBe('CPF inválido');
  });
  it('tamanho errado', () => {
    const r = validateCnpjCpf('12345');
    expect(r.valid).toBe(false);
    expect(r.type).toBe(null);
  });
  it('vazio é válido (opcional)', () => {
    const r = validateCnpjCpf('');
    expect(r.valid).toBe(true);
    expect(r.type).toBe(null);
  });
});
