import { describe, it, expect } from 'vitest';
import {
  ANEXO_I, ANEXO_II, ANEXO_III, ANEXO_IV, ANEXO_V,
  obterAnexo, identificarFaixa, LIMITE_SIMPLES_NACIONAL,
} from '../aliquotas-simples';
import type { AnexoSimples } from '../types';

describe('aliquotas-simples', () => {
  it('LIMITE_SIMPLES_NACIONAL = 4.800.000', () => {
    expect(LIMITE_SIMPLES_NACIONAL).toBe(4_800_000);
  });

  it.each<[AnexoSimples, typeof ANEXO_I]>([
    ['I', ANEXO_I], ['II', ANEXO_II], ['III', ANEXO_III], ['IV', ANEXO_IV], ['V', ANEXO_V],
  ])('anexo %s tem 6 faixas contíguas terminando em 4.800.000', (nome, tabela) => {
    expect(tabela).toHaveLength(6);
    expect(tabela[0].rbt12_de).toBe(0);
    expect(tabela[5].rbt12_ate).toBe(4_800_000);
    for (let i = 1; i < tabela.length; i++) {
      // faixa i começa logo após o teto da anterior
      expect(tabela[i].rbt12_de).toBeCloseTo(tabela[i - 1].rbt12_ate + 0.01, 2);
      expect(tabela[i].aliquota).toBeGreaterThan(tabela[i - 1].aliquota);
    }
    expect(obterAnexo(nome)).toBe(tabela);
  });

  it('identificarFaixa retorna faixa correta', () => {
    expect(identificarFaixa(100_000, 'I')?.faixa).toBe(1);
    expect(identificarFaixa(300_000, 'I')?.faixa).toBe(2);
    expect(identificarFaixa(4_000_000, 'III')?.faixa).toBe(6);
  });

  it('identificarFaixa retorna null acima do teto', () => {
    expect(identificarFaixa(5_000_000, 'I')).toBeNull();
  });

  it('Anexo I faixa 1 tem alíquota 4% sem PD', () => {
    expect(ANEXO_I[0].aliquota).toBe(0.04);
    expect(ANEXO_I[0].pd).toBe(0);
  });

  it('Anexo V (Fator R baixo) inicia com alíquota superior ao Anexo III', () => {
    expect(ANEXO_V[0].aliquota).toBeGreaterThan(ANEXO_III[0].aliquota);
  });
});
