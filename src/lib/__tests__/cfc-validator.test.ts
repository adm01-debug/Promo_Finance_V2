import { describe, it, expect } from 'vitest';
import {
  validarFormatoCFC,
  validarPrefixoNatureza,
  validarHierarquiaCFC,
  detectarDuplicidades,
  sugerirCorrecaoPrefixo,
} from '../cfc-validator';
import type { PlanoContaRow } from '@/hooks/usePlanoContas';

const conta = (over: Partial<PlanoContaRow>): PlanoContaRow => ({
  id: Math.random().toString(),
  empresa_id: 'emp-1',
  codigo: '1.1.01.001',
  nome: 'Conta',
  descricao: 'Conta',
  natureza: 'ativo',
  tipo: 'analitica',
  parent_id: null,
  centro_resultado: null,
  codigo_referencial: '1.01.01.01',
  ativo: true,
  ...over,
});

describe('validarFormatoCFC', () => {
  it('aceita 4 níveis', () => {
    expect(validarFormatoCFC('1.01.01.01')).toBe(true);
    expect(validarFormatoCFC('2.05.10.99')).toBe(true);
  });
  it('aceita 5 níveis com subconta 1-3 dígitos', () => {
    expect(validarFormatoCFC('1.01.01.01.1')).toBe(true);
    expect(validarFormatoCFC('1.01.01.01.001')).toBe(true);
    expect(validarFormatoCFC('1.01.01.01.999')).toBe(true);
  });
  it('rejeita formatos inválidos', () => {
    expect(validarFormatoCFC('1.1.1.1')).toBe(false); // sem zero-pad
    expect(validarFormatoCFC('1.01.01')).toBe(false); // poucos níveis
    expect(validarFormatoCFC('1.01.01.01.0001')).toBe(false); // subconta longa
    expect(validarFormatoCFC('A.01.01.01')).toBe(false);
    expect(validarFormatoCFC('')).toBe(false);
    expect(validarFormatoCFC(null)).toBe(false);
  });
});

describe('validarPrefixoNatureza', () => {
  it('valida prefixo correto', () => {
    expect(validarPrefixoNatureza('1.01.01.01', 'ativo').ok).toBe(true);
    expect(validarPrefixoNatureza('2.01.01.01', 'passivo').ok).toBe(true);
    expect(validarPrefixoNatureza('2.05.01.01', 'patrimonio').ok).toBe(true);
    expect(validarPrefixoNatureza('3.01.01.01', 'receita').ok).toBe(true);
    expect(validarPrefixoNatureza('4.01.01.01', 'despesa').ok).toBe(true);
  });
  it('detecta prefixo errado', () => {
    expect(validarPrefixoNatureza('2.01.01.01', 'ativo').ok).toBe(false);
    expect(validarPrefixoNatureza('1.01.01.01', 'receita').ok).toBe(false);
  });
  it('natureza desconhecida não falha', () => {
    expect(validarPrefixoNatureza('1.01.01.01', 'xpto').ok).toBe(true);
  });
});

describe('validarHierarquiaCFC', () => {
  it('checa profundidade declarada', () => {
    expect(validarHierarquiaCFC('1.01.01.01', 4)).toBe(true);
    expect(validarHierarquiaCFC('1.01.01.01.001', 5)).toBe(true);
    expect(validarHierarquiaCFC('1.01.01.01', 5)).toBe(false);
  });
});

describe('detectarDuplicidades', () => {
  it('agrupa duplicados por empresa', () => {
    const dups = detectarDuplicidades([
      conta({ id: 'a', codigo_referencial: '1.01.01.01' }),
      conta({ id: 'b', codigo_referencial: '1.01.01.01' }),
      conta({ id: 'c', codigo_referencial: '1.01.01.02' }),
    ]);
    expect(dups).toHaveLength(1);
    expect(dups[0].codigo_referencial).toBe('1.01.01.01');
    expect(dups[0].contas).toHaveLength(2);
  });
  it('não considera empresas diferentes', () => {
    const dups = detectarDuplicidades([
      conta({ id: 'a', empresa_id: 'e1', codigo_referencial: '1.01.01.01' }),
      conta({ id: 'b', empresa_id: 'e2', codigo_referencial: '1.01.01.01' }),
    ]);
    expect(dups).toHaveLength(0);
  });
  it('ignora contas inativas', () => {
    const dups = detectarDuplicidades([
      conta({ id: 'a', codigo_referencial: '1.01.01.01' }),
      conta({ id: 'b', codigo_referencial: '1.01.01.01', ativo: false }),
    ]);
    expect(dups).toHaveLength(0);
  });
});

describe('sugerirCorrecaoPrefixo', () => {
  it('sugere troca do primeiro dígito', () => {
    expect(sugerirCorrecaoPrefixo('2.01.01.01', ['1'])).toBe('1.01.01.01');
  });
  it('retorna null quando já está correto', () => {
    expect(sugerirCorrecaoPrefixo('1.01.01.01', ['1'])).toBeNull();
  });
});
