import { describe, expect, it } from 'vitest';
import { padraoIlikeContem, valorPostgrest } from '../postgrest-filtros';

describe('valorPostgrest', () => {
  it('envolve o valor em aspas duplas', () => {
    expect(valorPostgrest('Consultoria, abril')).toBe('"Consultoria, abril"');
  });

  it('escapa aspas duplas e barras invertidas', () => {
    expect(valorPostgrest('diz "oi"')).toBe('"diz \\"oi\\""');
    expect(valorPostgrest('caminho\\x')).toBe('"caminho\\\\x"');
  });
});

describe('padraoIlikeContem', () => {
  it('mantém o padrão contém entre aspas', () => {
    expect(padraoIlikeContem('alfa')).toBe('"%alfa%"');
  });

  it('trata vírgula e ponto como literais', () => {
    expect(padraoIlikeContem('Consultoria, abril.')).toBe('"%Consultoria, abril.%"');
  });

  it('escapa curingas digitados pelo usuário', () => {
    expect(padraoIlikeContem('50%')).toBe('"%50\\\\%%"');
    expect(padraoIlikeContem('a_b')).toBe('"%a\\\\_b%"');
  });
});
