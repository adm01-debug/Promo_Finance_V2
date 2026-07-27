import { describe, expect, it } from 'vitest';
import { obterAnexo } from '../aliquotas-simples';
import { compararFaixasComCatalogo, descreverDivergencias } from '../catalogos/coerencia';
import type { AnexoSimples } from '../types';
import type { FaixaSimplesCatalogo } from '../catalogos/types';

const ANEXOS: AnexoSimples[] = ['I', 'II', 'III', 'IV', 'V'];

function catalogoEspelhandoCodigo(): FaixaSimplesCatalogo[] {
  return ANEXOS.flatMap((anexo) =>
    obterAnexo(anexo).map((f) => ({
      anexo,
      faixa: f.faixa,
      rbt12_de: f.rbt12_de,
      rbt12_ate: f.rbt12_ate,
      aliquota: f.aliquota,
      parcela_deduzir: f.pd,
      vigente_de: '2018-01-01',
      vigente_ate: null,
    })),
  );
}

describe('coerência entre catálogo do banco e constantes do motor', () => {
  it('não acusa divergência quando o catálogo espelha o código', () => {
    expect(compararFaixasComCatalogo(catalogoEspelhandoCodigo())).toEqual([]);
  });

  it('cobre as 30 faixas (5 anexos × 6 faixas)', () => {
    expect(catalogoEspelhandoCodigo()).toHaveLength(30);
  });

  it('detecta alíquota divergente', () => {
    const catalogo = catalogoEspelhandoCodigo();
    catalogo[0] = { ...catalogo[0], aliquota: 0.05 };

    const divergencias = compararFaixasComCatalogo(catalogo);
    expect(divergencias).toHaveLength(1);
    expect(divergencias[0]).toMatchObject({ anexo: 'I', faixa: 1, campo: 'aliquota' });
  });

  it('detecta parcela a deduzir divergente', () => {
    const catalogo = catalogoEspelhandoCodigo().map((f) =>
      f.anexo === 'III' && f.faixa === 6 ? { ...f, parcela_deduzir: 1 } : f,
    );

    const divergencias = compararFaixasComCatalogo(catalogo);
    expect(divergencias).toEqual([
      { anexo: 'III', faixa: 6, campo: 'parcela_deduzir', valorCodigo: 648000, valorBanco: 1 },
    ]);
  });

  it('marca faixa ausente no banco', () => {
    const catalogo = catalogoEspelhandoCodigo().filter((f) => !(f.anexo === 'V' && f.faixa === 3));
    const divergencias = compararFaixasComCatalogo(catalogo);

    expect(divergencias).toHaveLength(1);
    expect(divergencias[0].campo).toBe('ausente');
    expect(divergencias[0].valorBanco).toBeNull();
  });

  it('tolera ruído de ponto flutuante dentro do epsilon', () => {
    const catalogo = catalogoEspelhandoCodigo().map((f) =>
      f.anexo === 'I' && f.faixa === 2 ? { ...f, aliquota: f.aliquota + 1e-12 } : f,
    );
    expect(compararFaixasComCatalogo(catalogo)).toEqual([]);
  });

  it('trata valores não finitos como divergência', () => {
    const catalogo = catalogoEspelhandoCodigo().map((f) =>
      f.anexo === 'II' && f.faixa === 1 ? { ...f, rbt12_ate: Number.NaN } : f,
    );
    expect(compararFaixasComCatalogo(catalogo)).toHaveLength(1);
  });

  it('descreve divergências de forma legível', () => {
    const catalogo = catalogoEspelhandoCodigo().map((f) =>
      f.anexo === 'IV' && f.faixa === 5 ? { ...f, aliquota: 0.9 } : f,
    );
    const textos = descreverDivergencias(compararFaixasComCatalogo(catalogo));
    expect(textos[0]).toContain('Anexo IV faixa 5');
    expect(textos[0]).toContain('aliquota');
  });
});
