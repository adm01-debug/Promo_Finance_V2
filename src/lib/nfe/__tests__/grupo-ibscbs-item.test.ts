import { describe, expect, it } from 'vitest';
import {
  CCLASS_TRIB_PADRAO_BRINDE,
  calcularGrupoIbscbs,
  resolverCclassTribPadrao,
} from '../grupo-ibscbs-item';

// Aliquota de 2026 e a de teste da lei: CBS 0,9% e IBS 0,1% (todo o IBS na
// parcela estadual, sem parcela municipal). Os esperados abaixo sao os numeros
// que a nota precisa destacar, nao uma repeticao da implementacao.
const SEM_REDUCAO = { pRedCbs: 0, pRedIbsUf: 0, pRedIbsMun: 0 };

describe('calcularGrupoIbscbs', () => {
  it('sem reducao aplica a aliquota cheia de 2026', () => {
    const grupo = calcularGrupoIbscbs(100, SEM_REDUCAO, 2026);
    expect(grupo.vBC).toBe(100);
    expect(grupo.pCBS).toBe(0.9);
    expect(grupo.vCBS).toBe(0.9);
    expect(grupo.pIBSUF).toBe(0.1);
    expect(grupo.vIBSUF).toBe(0.1);
    expect(grupo.pIBSMun).toBe(0);
    expect(grupo.vIBSMun).toBe(0);
    expect(grupo.vIBS).toBe(0.1);
  });

  it('reducao de 60% corta a aliquota efetiva, nao o valor de base', () => {
    const grupo = calcularGrupoIbscbs(100, { pRedCbs: 0.6, pRedIbsUf: 0.6, pRedIbsMun: 0.6 }, 2026);
    expect(grupo.vBC).toBe(100);
    expect(grupo.pCBS).toBe(0.36);
    expect(grupo.vCBS).toBe(0.36);
    expect(grupo.pIBSUF).toBe(0.04);
    expect(grupo.vIBSUF).toBe(0.04);
    expect(grupo.vIBS).toBe(0.04);
  });

  it('arredonda o valor destacado em 2 casas (politica ABNT NBR 5891)', () => {
    // 33,33 x 0,9% = 0,29997 -> 0,30
    expect(calcularGrupoIbscbs(33.33, SEM_REDUCAO, 2026).vCBS).toBe(0.3);
  });

  it('reducao acima de 100% ou corrompida nao vira aliquota negativa', () => {
    const acima = calcularGrupoIbscbs(100, { pRedCbs: 1.5, pRedIbsUf: 1.5, pRedIbsMun: 1.5 }, 2026);
    expect(acima.vCBS).toBe(0);
    expect(acima.vIBS).toBe(0);

    const corrompida = calcularGrupoIbscbs(
      100,
      { pRedCbs: Number.NaN, pRedIbsUf: Number.NaN, pRedIbsMun: Number.NaN },
      2026
    );
    expect(corrompida.vCBS).toBe(0.9);
    expect(corrompida.vIBS).toBe(0.1);
  });

  it('item sem valor nao gera grupo', () => {
    for (const valor of [0, -10, Number.NaN]) {
      const grupo = calcularGrupoIbscbs(valor, SEM_REDUCAO, 2026);
      expect(grupo.vCBS).toBe(0);
      expect(grupo.vIBS).toBe(0);
      expect(grupo.vBC).toBe(0);
    }
  });

  it('sem catalogo carregado calcula com aliquota cheia', () => {
    expect(calcularGrupoIbscbs(100, null, 2026).vCBS).toBe(0.9);
    expect(calcularGrupoIbscbs(100, undefined, 2026).vIBS).toBe(0.1);
  });
});

describe('resolverCclassTribPadrao', () => {
  const comCatalogo = new Set([CCLASS_TRIB_PADRAO_BRINDE, '200032']);

  it('NCM completo sem codigo escolhido assume o padrao de brinde', () => {
    expect(resolverCclassTribPadrao('9505.90.00', undefined, comCatalogo)).toBe(
      CCLASS_TRIB_PADRAO_BRINDE
    );
  });

  it('nao sobrescreve codigo ja escolhido', () => {
    expect(resolverCclassTribPadrao('95059000', '200032', comCatalogo)).toBeNull();
  });

  it('NCM incompleto nao vira default', () => {
    expect(resolverCclassTribPadrao('9505', undefined, comCatalogo)).toBeNull();
  });

  it('catalogo sem o codigo padrao pede escolha explicita', () => {
    expect(resolverCclassTribPadrao('95059000', undefined, new Set(['200032']))).toBeNull();
  });
});
