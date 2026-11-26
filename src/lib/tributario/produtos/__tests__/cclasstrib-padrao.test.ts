import { describe, expect, it } from 'vitest';
import {
  normalizarCodigo,
  normalizarNcm,
  sugerirPadraoPorNcm,
  validarPadrao,
  type PadraoProduto,
} from '../cclasstrib-padrao';

const padrao = (
  produto_id: string,
  ncm: string | null,
  cst: string,
  cclasstrib: string,
  atualizado_em = '2026-01-01T00:00:00.000Z'
): PadraoProduto => ({ produto_id, ncm, cst, cclasstrib, atualizado_em });

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
