import { describe, expect, it } from 'vitest';
import {
  CFOP_VENDA_DENTRO_ESTADO,
  CFOP_VENDA_FORA_ESTADO,
  NATUREZA_VENDA_DENTRO_ESTADO,
  NATUREZA_VENDA_FORA_ESTADO,
  normalizarUf,
  resolverNaturezaOperacaoVenda,
} from '../natureza-operacao';

describe('natureza da operação de venda pela UF do emissor e do destinatário', () => {
  it('Brasil Marcas (SP) vendendo para SP é venda dentro do estado, CFOP 5102', () => {
    expect(resolverNaturezaOperacaoVenda({ ufEmitente: 'SP', ufDestinatario: 'SP' })).toEqual({
      natureza: NATUREZA_VENDA_DENTRO_ESTADO,
      cfop: CFOP_VENDA_DENTRO_ESTADO,
      dentroDoEstado: true,
      ufEmitente: 'SP',
      ufDestinatario: 'SP',
    });
  });

  it('Brasil Marcas (SP) vendendo para GO é venda fora do estado, CFOP 6102', () => {
    const r = resolverNaturezaOperacaoVenda({ ufEmitente: 'SP', ufDestinatario: 'GO' });
    expect(r?.natureza).toBe(NATUREZA_VENDA_FORA_ESTADO);
    expect(r?.cfop).toBe(CFOP_VENDA_FORA_ESTADO);
    expect(r?.dentroDoEstado).toBe(false);
  });

  it('João Batista (RR) vendendo para RR é dentro do estado — regra que o Bitrix tinha fixa', () => {
    expect(resolverNaturezaOperacaoVenda({ ufEmitente: 'RR', ufDestinatario: 'RR' })?.cfop).toBe(
      CFOP_VENDA_DENTRO_ESTADO
    );
  });

  it('vale para qualquer empresa emissora, não só para as duas do Bitrix', () => {
    expect(resolverNaturezaOperacaoVenda({ ufEmitente: 'GO', ufDestinatario: 'GO' })?.cfop).toBe(
      CFOP_VENDA_DENTRO_ESTADO
    );
    expect(resolverNaturezaOperacaoVenda({ ufEmitente: 'GO', ufDestinatario: 'SP' })?.cfop).toBe(
      CFOP_VENDA_FORA_ESTADO
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
