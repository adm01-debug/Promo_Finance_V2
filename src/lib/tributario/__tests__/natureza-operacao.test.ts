import { describe, expect, it } from 'vitest';
import { normalizarUf, resolverNaturezaOperacaoVenda } from '../natureza-operacao';

// Os valores fiscais são afirmados como literais de propósito: comparar com as
// constantes do módulo deixaria passar a troca do CFOP ou da descrição usada pelo Bling.
describe('natureza da operação de venda pela UF do emissor e do destinatário', () => {
  it('Brasil Marcas (SP) vendendo para SP é venda dentro do estado, CFOP 5102', () => {
    expect(resolverNaturezaOperacaoVenda({ ufEmitente: 'SP', ufDestinatario: 'SP' })).toEqual({
      natureza: 'VENDAS DE MERCADORIAS DENTRO DO ESTADO',
      cfop: '5102',
      dentroDoEstado: true,
      ufEmitente: 'SP',
      ufDestinatario: 'SP',
    });
  });

  it('Brasil Marcas (SP) vendendo para GO é venda fora do estado, CFOP 6102', () => {
    const r = resolverNaturezaOperacaoVenda({ ufEmitente: 'SP', ufDestinatario: 'GO' });
    expect(r?.natureza).toBe('VENDAS DE MERCADORIAS FORA DO ESTADO');
    expect(r?.cfop).toBe('6102');
    expect(r?.dentroDoEstado).toBe(false);
  });

  it('João Batista (RR) vendendo para RR é dentro do estado — regra que o Bitrix tinha fixa', () => {
    expect(resolverNaturezaOperacaoVenda({ ufEmitente: 'RR', ufDestinatario: 'RR' })?.cfop).toBe(
      '5102'
    );
  });

  it('vale para qualquer empresa emissora, não só para as duas do Bitrix', () => {
    expect(resolverNaturezaOperacaoVenda({ ufEmitente: 'GO', ufDestinatario: 'GO' })?.cfop).toBe(
      '5102'
    );
    expect(resolverNaturezaOperacaoVenda({ ufEmitente: 'GO', ufDestinatario: 'SP' })?.cfop).toBe(
      '6102'
    );
  });

  it('aceita sigla em minúsculas e com espaços', () => {
    const r = resolverNaturezaOperacaoVenda({ ufEmitente: ' sp ', ufDestinatario: 'Sp' });
    expect(r?.dentroDoEstado).toBe(true);
    expect(r?.ufEmitente).toBe('SP');
  });

  it('sem UF do emissor ou do destinatário não decide (null), em vez de assumir um valor fixo', () => {
    expect(resolverNaturezaOperacaoVenda({ ufEmitente: null, ufDestinatario: 'SP' })).toBeNull();
    expect(resolverNaturezaOperacaoVenda({ ufEmitente: 'SP', ufDestinatario: '' })).toBeNull();
    expect(resolverNaturezaOperacaoVenda({ ufEmitente: 'XX', ufDestinatario: 'SP' })).toBeNull();
  });

  it('normalizarUf reconhece as 27 UFs e rejeita o resto', () => {
    expect(normalizarUf('rr')).toBe('RR');
    expect(normalizarUf('DF')).toBe('DF');
    expect(normalizarUf('São Paulo')).toBeNull();
    expect(normalizarUf(undefined)).toBeNull();
  });
});
