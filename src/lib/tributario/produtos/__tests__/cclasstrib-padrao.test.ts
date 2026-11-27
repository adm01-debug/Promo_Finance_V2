import { describe, expect, it } from 'vitest';
import {
  cclasstribManualAposTroca,
  conflitosDeSku,
  ncmAposTrocaDeCodigo,
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

  it('mesmo par CST/cClassTrib com NCM diferente nao decide sozinho', () => {
    const padroes = [
      padrao('456', '12345678', '200', '200032', undefined, 'KIT-01'),
      padrao('789', '39269090', '200', '200032', undefined, 'KIT-01'),
    ];
    expect(resolverPadraoPorCodigo(padroes, 'KIT-01')).toBeNull();
  });
});

describe('conflitosDeSku', () => {
  const kitzinho = (produto_id: string, cst: string, cclasstrib: string, ncm = '12345678') =>
    padrao(produto_id, ncm, cst, cclasstrib, undefined, 'KIT-01');

  it('aponta todos os produtos que ja ocupam o SKU com outro enquadramento', () => {
    const padroes = [
      kitzinho('456', '200', '200032'),
      kitzinho('457', '200', '200032'),
      kitzinho('788', '102', '000001'),
    ];
    const conflitos = conflitosDeSku(padroes, {
      produto_id: '789',
      codigo: ' kit-01 ',
      cst: '102',
      cclasstrib: '000001',
      ncm: '12345678',
    });
    // O terceiro ja usa o enquadramento escolhido; unificar so os dois primeiros
    // deixaria o SKU divergente e a nota sem resposta, por isso vem a lista toda.
    expect(conflitos.map((c) => c.produto_id)).toEqual(['456', '457']);
  });

  it('libera o mesmo enquadramento, o proprio produto e SKU vazio', () => {
    const padroes = [kitzinho('456', '200', '200032')];
    expect(
      conflitosDeSku(padroes, {
        produto_id: '789',
        codigo: 'KIT-01',
        cst: '200',
        cclasstrib: '200032',
        ncm: '1234.56.78',
      })
    ).toEqual([]);
    expect(
      conflitosDeSku(padroes, {
        produto_id: '456',
        codigo: 'KIT-01',
        cst: '102',
        cclasstrib: '000001',
      })
    ).toEqual([]);
    expect(
      conflitosDeSku(padroes, { produto_id: '789', codigo: '', cst: '102', cclasstrib: '000001' })
    ).toEqual([]);
  });

  it('mesmo SKU com NCM diferente tambem conflita', () => {
    const padroes = [kitzinho('456', '200', '200032')];
    const conflitos = conflitosDeSku(padroes, {
      produto_id: '789',
      codigo: 'KIT-01',
      cst: '200',
      cclasstrib: '200032',
      ncm: '39269090',
    });
    expect(conflitos.map((c) => c.produto_id)).toEqual(['456']);
  });
});

describe('ncmAposTrocaDeCodigo', () => {
  const padroes = [
    padrao('456', '12345678', '200', '200032', undefined, 'KIT-1'),
    padrao('789', '39269090', '200', '200032', undefined, 'KIT-12'),
  ];
  const resolver = (codigo?: string | null) => resolverPadraoPorCodigo(padroes, codigo);

  it('troca o NCM herdado do produto anterior pelo do SKU novo', () => {
    expect(
      ncmAposTrocaDeCodigo(resolver, {
        codigoAnterior: 'KIT-1',
        ncmAtual: '12345678',
        codigoNovo: 'KIT-12',
      })
    ).toBe('39269090');
  });

  it('limpa o NCM herdado quando o SKU novo nao tem padrao', () => {
    expect(
      ncmAposTrocaDeCodigo(resolver, {
        codigoAnterior: 'KIT-1',
        ncmAtual: '12345678',
        codigoNovo: 'AVULSO',
      })
    ).toBe('');
  });

  it('preserva o NCM digitado a mao', () => {
    expect(
      ncmAposTrocaDeCodigo(resolver, {
        codigoAnterior: 'KIT-1',
        ncmAtual: '84713012',
        codigoNovo: 'KIT-12',
      })
    ).toBe('84713012');
  });
});

describe('cclasstribManualAposTroca', () => {
  const padroes = [padrao('456', '12345678', '200', '200032', undefined, 'KIT-1')];
  const resolver = (codigo?: string | null) => resolverPadraoPorCodigo(padroes, codigo);

  it('descarta o enquadramento herdado do SKU anterior', () => {
    expect(
      cclasstribManualAposTroca(resolver, { codigoAnterior: 'KIT-1', cclasstribAtual: '200032' })
    ).toBeUndefined();
  });

  it('devolve a escolha manual do operador', () => {
    expect(
      cclasstribManualAposTroca(resolver, { codigoAnterior: 'KIT-1', cclasstribAtual: '000001' })
    ).toBe('000001');
  });

  it('sem padrao no SKU anterior nada e herdado', () => {
    expect(
      cclasstribManualAposTroca(resolver, { codigoAnterior: 'AVULSO', cclasstribAtual: '000001' })
    ).toBe('000001');
    expect(
      cclasstribManualAposTroca(resolver, { codigoAnterior: 'AVULSO', cclasstribAtual: undefined })
    ).toBeUndefined();
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
