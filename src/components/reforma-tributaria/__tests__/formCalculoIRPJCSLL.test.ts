/**
 * Achado do Devin na PR #582: a escolha da apuracao do IRPJ/CSLL vive em estado
 * local do modulo, entao trocar o filtro de empresa mantinha o id da empresa
 * anterior no formulario e o calculo gravava nessa apuracao com o saldo de
 * prejuizos da empresa exibida.
 */
import { describe, expect, it } from 'vitest';
import { formCalculoDaEmpresa } from '../irpj-csll/form-calculo';

const form = {
  apuracaoId: 'ap-beta-1tri',
  lucroContabil: 1000,
  adicoesPermanentes: 100,
  adicoesTemporarias: 0,
  exclusoesPermanentes: 0,
  exclusoesTemporarias: 0,
};

describe('formCalculoDaEmpresa', () => {
  it('descarta a apuracao que nao e da empresa/ano exibidos', () => {
    expect(formCalculoDaEmpresa(form, [{ id: 'ap-alfa-1tri' }]).apuracaoId).toBe('');
  });

  it('mantem os valores digitados quando a apuracao e da empresa exibida', () => {
    expect(formCalculoDaEmpresa(form, [{ id: 'ap-beta-1tri' }])).toEqual(form);
  });

  it('descarta a apuracao enquanto a lista do periodo ainda nao carregou', () => {
    expect(formCalculoDaEmpresa(form, []).apuracaoId).toBe('');
  });
});
