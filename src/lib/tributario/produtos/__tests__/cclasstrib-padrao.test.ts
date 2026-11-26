import { describe, expect, it } from 'vitest';
import {
  normalizarCodigo,
  normalizarCodigoComercial,
  normalizarNcm,
  resolverPadraoPorCodigo,
  sugerirPadraoPorNcm,
  validarCoerenciaCst,
  validarPadrao,
  type PadraoProduto,
} from '../cclasstrib-padrao';

const padrao = (
  produto_id: string,
  ncm: string | null,
  cst: string,
  cclasstrib: string,
  atualizado_em = '2026-01-01T00:00:00.000Z',
  codigo: string | null = null
): PadraoProduto => ({ produto_id, codigo, ncm, cst, cclasstrib, atualizado_em });

describe('normalizarNcm', () => {
  it('aceita NCM com mascara e devolve so digitos', () => {
    expect(normalizarNcm('1234.56.78')).toBe('12345678');
    expect(normalizarNcm('12345678')).toBe('12345678');
  });

  it('recusa NCM incompleto, vazio ou ausente', () => {
    expect(normalizarNcm('1234567')).toBeNull();
    expect(normalizarNcm('')).toBeNull();
    expect(normalizarNcm(null)).toBeNull();
    expect(normalizarNcm(undefined)).toBeNull();
  });
});

describe('normalizarCodigo', () => {
  it('mantem apenas digitos e limita ao tamanho pedido', () => {
    expect(normalizarCodigo('200', 3)).toBe('200');
    expect(normalizarCodigo('000001 ', 6)).toBe('000001');
    expect(normalizarCodigo('0000012', 6)).toBe('000001');
    expect(normalizarCodigo(null, 3)).toBe('');
  });
});

describe('sugerirPadraoPorNcm', () => {
  it('nao sugere nada sem NCM valido ou sem historico do NCM', () => {
    expect(sugerirPadraoPorNcm([], '12345678', 'p1')).toBeNull();
    expect(
      sugerirPadraoPorNcm([padrao('p2', '12345678', '200', '200001')], '1234', 'p1')
    ).toBeNull();
    expect(
      sugerirPadraoPorNcm([padrao('p2', '87654321', '200', '200001')], '12345678', 'p1')
    ).toBeNull();
  });

  it('ignora o proprio produto ao sugerir', () => {
    expect(
      sugerirPadraoPorNcm([padrao('p1', '12345678', '200', '200001')], '12345678', 'p1')
    ).toBeNull();
  });

  it('sugere o enquadramento da maioria dos produtos do mesmo NCM', () => {
    const padroes = [
      padrao('p2', '1234.56.78', '200', '200001'),
      padrao('p3', '12345678', '200', '200001'),
      padrao('p4', '12345678', '102', '000001'),
    ];
    const sugestao = sugerirPadraoPorNcm(padroes, '12345678', 'p1');
    expect(sugestao?.cst).toBe('200');
    expect(sugestao?.cclasstrib).toBe('200001');
  });

  it('empate fica com o enquadramento mais recente', () => {
    const padroes = [
      padrao('p2', '12345678', '200', '200001', '2026-02-01T00:00:00.000Z'),
      padrao('p3', '12345678', '102', '000001', '2026-03-01T00:00:00.000Z'),
    ];
    const sugestao = sugerirPadraoPorNcm(padroes, '12345678', 'p1');
    expect(sugestao?.cst).toBe('102');
  });

  it('nao sugere quando todos os produtos do NCM sao o proprio', () => {
    const padroes = [padrao('p1', '12345678', '200', '200001')];
    expect(sugerirPadraoPorNcm(padroes, '12345678', 'p1')).toBeNull();
  });
});

describe('validarPadrao', () => {
  it('aceita CST, cClassTrib e NCM validos', () => {
    expect(validarPadrao({ cst: '200', cclasstrib: '200001', ncm: '12345678' })).toBeNull();
    expect(validarPadrao({ cst: '200', cclasstrib: '000001', ncm: null })).toBeNull();
  });

  it('aponta o campo incompleto', () => {
    expect(validarPadrao({ cst: '20', cclasstrib: '000001' })).toMatch(/CST/);
    expect(validarPadrao({ cst: '200', cclasstrib: '00001' })).toMatch(/cClassTrib/);
    expect(validarPadrao({ cst: '200', cclasstrib: '000001', ncm: '1234' })).toMatch(/NCM/);
  });
});

describe('normalizarCodigoComercial', () => {
  it('compara SKU sem espaco nas pontas nem diferenca de caixa', () => {
    expect(normalizarCodigoComercial('  cesta-01 ')).toBe('CESTA-01');
    expect(normalizarCodigoComercial(null)).toBe('');
  });
});

describe('resolverPadraoPorCodigo', () => {
  const comCodigo = (produto_id: string, codigo: string, cst: string, cclasstrib: string) =>
    padrao(produto_id, '12345678', cst, cclasstrib, undefined, codigo);

  it('encontra o padrao do SKU informado no item', () => {
    const padroes = [comCodigo('456', 'CESTA-01', '200', '200032')];
    expect(resolverPadraoPorCodigo(padroes, ' cesta-01 ')?.cclasstrib).toBe('200032');
  });

  it('nao confunde o id do produto com o SKU', () => {
    const padroes = [comCodigo('456', 'CESTA-01', '200', '200032')];
    expect(resolverPadraoPorCodigo(padroes, '456')).toBeNull();
  });

  it('nao resolve nada sem codigo, sem padrao gravado ou sem SKU salvo', () => {
    expect(resolverPadraoPorCodigo([], 'CESTA-01')).toBeNull();
    expect(resolverPadraoPorCodigo([comCodigo('456', 'CESTA-01', '200', '200032')], '')).toBeNull();
    expect(
      resolverPadraoPorCodigo([padrao('456', '12345678', '200', '200032')], 'CESTA-01')
    ).toBeNull();
  });

  it('SKU compartilhado com enquadramentos diferentes nao decide sozinho', () => {
    const padroes = [
      comCodigo('456', 'KIT-01', '200', '200032'),
      comCodigo('789', 'KIT-01', '102', '000001'),
    ];
    expect(resolverPadraoPorCodigo(padroes, 'KIT-01')).toBeNull();
  });

  it('SKU repetido com o mesmo enquadramento resolve normalmente', () => {
    const padroes = [
      comCodigo('456', 'KIT-01', '200', '200032'),
      comCodigo('457', 'kit-01', '200', '200032'),
    ];
    expect(resolverPadraoPorCodigo(padroes, 'KIT-01')?.produto_id).toBe('456');
  });
});

describe('validarCoerenciaCst', () => {
  const catalogo = [
    { cst: '000 ', cclasstrib: '000001' },
    { cst: '200', cclasstrib: '200032' },
  ];

  it('sem catalogo a digitacao manual continua livre', () => {
    expect(validarCoerenciaCst({ cst: '200', cclasstrib: '000001' }, [])).toBeNull();
  });

  it('nao opina sobre codigo fora do catalogo', () => {
    expect(validarCoerenciaCst({ cst: '200', cclasstrib: '999999' }, catalogo)).toBeNull();
  });

  it('aceita o CST que o catalogo associa ao cClassTrib', () => {
    expect(validarCoerenciaCst({ cst: '200', cclasstrib: '200032' }, catalogo)).toBeNull();
    expect(validarCoerenciaCst({ cst: '000', cclasstrib: '000001' }, catalogo)).toBeNull();
  });

  it('recusa CST que contradiz o catalogo', () => {
    expect(validarCoerenciaCst({ cst: '200', cclasstrib: '000001' }, catalogo)).toMatch(/CST 000/);
    expect(validarCoerenciaCst({ cst: '', cclasstrib: '000001' }, catalogo)).toMatch(/vazio/);
  });

  it('nao valida antes do codigo estar completo', () => {
    expect(validarCoerenciaCst({ cst: '200', cclasstrib: '00001' }, catalogo)).toBeNull();
  });
});
