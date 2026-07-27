import { describe, expect, it } from 'vitest';

import {
  compararItensIssComCatalogo,
  descreverDivergenciasIss,
  normalizarItemIss,
  type ItemIssBanco,
} from '@/lib/tributario/catalogos/coerencia-iss';
import { LISTA_LC116 } from '@/lib/tributario/ipi-iss/tabelas';

/** Catálogo íntegro derivado da própria lista do motor. */
function catalogoIntegro(): ItemIssBanco[] {
  return LISTA_LC116.map((i) => ({
    codigo: i.item,
    descricao: i.descricao,
    retem_no_tomador: i.retencaoIssPadrao,
    aliquota_minima: 0.02,
    aliquota_maxima: 0.05,
  }));
}

describe('normalizarItemIss', () => {
  it('padroniza zeros à esquerda e espaços', () => {
    expect(normalizarItemIss('07.02')).toBe('7.02');
    expect(normalizarItemIss(' 7.02 ')).toBe('7.02');
    expect(normalizarItemIss('17.5')).toBe('17.05');
  });

  it('devolve o valor original quando o formato é inesperado', () => {
    expect(normalizarItemIss('abc')).toBe('abc');
  });
});

describe('compararItensIssComCatalogo', () => {
  it('não acusa divergência em catálogo íntegro', () => {
    expect(compararItensIssComCatalogo(catalogoIntegro())).toEqual([]);
  });

  it('tolera códigos com zero à esquerda vindos do banco', () => {
    const registros = catalogoIntegro().map((r) =>
      r.codigo === '7.02' ? { ...r, codigo: '07.02' } : r,
    );
    expect(compararItensIssComCatalogo(registros)).toEqual([]);
  });

  it('detecta item ausente no banco', () => {
    const registros = catalogoIntegro().filter((r) => r.codigo !== '17.05');
    const d = compararItensIssComCatalogo(registros);
    expect(d).toContainEqual(
      expect.objectContaining({ item: '17.05', campo: 'ausente' }),
    );
  });

  it('detecta item excedente desconhecido pelo motor', () => {
    const registros = [
      ...catalogoIntegro(),
      { codigo: '99.99', descricao: 'Serviço inexistente', retem_no_tomador: false, aliquota_minima: 0.02, aliquota_maxima: 0.05 },
    ];
    const d = compararItensIssComCatalogo(registros);
    expect(d).toContainEqual(expect.objectContaining({ item: '99.99', campo: 'excedente' }));
  });

  it('detecta duplicidade de código', () => {
    const registros = catalogoIntegro();
    const d = compararItensIssComCatalogo([...registros, registros[0]]);
    expect(d.some((x) => x.campo === 'duplicado')).toBe(true);
  });

  it('detecta divergência de retenção no tomador (troca de sujeito passivo)', () => {
    const registros = catalogoIntegro().map((r) =>
      r.codigo === '7.02' ? { ...r, retem_no_tomador: false } : r,
    );
    const d = compararItensIssComCatalogo(registros);
    expect(d).toContainEqual({ item: '7.02', campo: 'retencao', valorCodigo: true, valorBanco: false });
  });

  it('rejeita piso abaixo de 2% e teto acima de 5%', () => {
    const registros = catalogoIntegro().map((r) =>
      r.codigo === '1.01' ? { ...r, aliquota_minima: 0.005, aliquota_maxima: 0.07 } : r,
    );
    const d = compararItensIssComCatalogo(registros);
    expect(d.some((x) => x.item === '1.01' && x.campo === 'aliquota_minima')).toBe(true);
    expect(d.some((x) => x.item === '1.01' && x.campo === 'aliquota_maxima')).toBe(true);
  });

  it('rejeita teto menor que o piso', () => {
    const registros = catalogoIntegro().map((r) =>
      r.codigo === '1.01' ? { ...r, aliquota_minima: 0.05, aliquota_maxima: 0.03 } : r,
    );
    const d = compararItensIssComCatalogo(registros);
    expect(d.some((x) => x.item === '1.01' && x.campo === 'aliquota_maxima')).toBe(true);
  });

  it('rejeita valores não numéricos vindos do banco', () => {
    const registros = catalogoIntegro().map((r) =>
      r.codigo === '1.01' ? { ...r, aliquota_minima: Number.NaN } : r,
    );
    const d = compararItensIssComCatalogo(registros);
    expect(d.some((x) => x.item === '1.01' && x.campo === 'aliquota_minima')).toBe(true);
  });

  it('catálogo vazio acusa todos os itens do motor como ausentes', () => {
    const d = compararItensIssComCatalogo([]);
    expect(d).toHaveLength(LISTA_LC116.length);
    expect(d.every((x) => x.campo === 'ausente')).toBe(true);
  });
});

describe('descreverDivergenciasIss', () => {
  it('gera mensagens legíveis para cada tipo de divergência', () => {
    const msgs = descreverDivergenciasIss([
      { item: '1.01', campo: 'ausente', valorCodigo: 'x', valorBanco: null },
      { item: '1.01', campo: 'retencao', valorCodigo: true, valorBanco: false },
    ]);
    expect(msgs[0]).toContain('ausente no catálogo do banco');
    expect(msgs[1]).toContain('retenção no tomador');
  });
});
