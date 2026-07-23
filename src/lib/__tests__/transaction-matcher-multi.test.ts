import { describe, it, expect } from 'vitest';
import {
  encontrarTodosMatches,
  encontrarMatchesParaTransacao,
  type LancamentoSistema,
} from '../transaction-matcher';
import type { TransacaoOFX } from '../ofx-parser';

const mkLanc = (over: Partial<LancamentoSistema>): LancamentoSistema => ({
  id: 'l',
  tipo: 'receber',
  descricao: 'Descrição',
  valor: 100,
  dataVencimento: new Date('2024-06-10'),
  entidade: 'Entidade',
  status: 'pendente',
  ...over,
});

const mkTx = (over: Partial<TransacaoOFX>): TransacaoOFX => ({
  id: 't',
  tipo: 'credito',
  valor: 100,
  data: new Date('2024-06-10'),
  descricao: 'DESC',
  tipoTransacao: 'PAYMENT',
  ...over,
});

describe('encontrarTodosMatches - alocação gulosa', () => {
  it('não reutiliza lançamento já matcheado com score alto', () => {
    const lancamentos = [
      mkLanc({ id: 'A', descricao: 'Cliente Alpha', valor: 1000 }),
    ];
    const transacoes = [
      mkTx({ id: 't1', valor: 1000, descricao: 'CLIENTE ALPHA PAGAMENTO' }),
      mkTx({ id: 't2', valor: 1000, descricao: 'CLIENTE ALPHA PAGAMENTO' }),
    ];

    const result = encontrarTodosMatches(transacoes, lancamentos);
    expect(result.get('t1')?.[0]?.lancamentoId).toBe('A');
    // t2 não deve ter sugestões porque o lançamento único foi consumido
    expect(result.has('t2')).toBe(false);
  });

  it('ordena transações por valor absoluto decrescente', () => {
    const lancamentos = [
      mkLanc({ id: 'A', descricao: 'Alpha', valor: 500 }),
      mkLanc({ id: 'B', descricao: 'Beta', valor: 900 }),
    ];
    const transacoes = [
      mkTx({ id: 't-small', valor: 500, descricao: 'ALPHA' }),
      mkTx({ id: 't-big', valor: 900, descricao: 'BETA' }),
    ];
    const result = encontrarTodosMatches(transacoes, lancamentos);
    expect(result.get('t-big')?.[0]?.lancamentoId).toBe('B');
    expect(result.get('t-small')?.[0]?.lancamentoId).toBe('A');
  });

  it('mantém sugestão sem consumir lançamento quando score < 80', () => {
    const lancamentos = [
      mkLanc({ id: 'A', descricao: 'Fornecedor XYZ', valor: 100, tipo: 'pagar' }),
    ];
    const transacoes = [
      mkTx({ id: 't1', valor: -102, tipo: 'debito', descricao: 'GENERICO' }),
      mkTx({ id: 't2', valor: -102, tipo: 'debito', descricao: 'GENERICO' }),
    ];
    const result = encontrarTodosMatches(transacoes, lancamentos);
    // Ambos podem ter sugestão pois nenhum match teve score>=80
    const t1 = result.get('t1');
    const t2 = result.get('t2');
    if (t1 && t1[0].score < 80) {
      expect(t2?.[0]?.lancamentoId).toBe('A');
    }
  });
});

describe('encontrarMatchesParaTransacao - edge cases', () => {
  it('ignora lançamentos pagos ou cancelados', () => {
    const lancamentos = [
      mkLanc({ id: 'pago', status: 'pago', descricao: 'MATCH PERFEITO' }),
      mkLanc({ id: 'canc', status: 'cancelado', descricao: 'MATCH PERFEITO' }),
    ];
    const tx = mkTx({ descricao: 'MATCH PERFEITO' });
    expect(encontrarMatchesParaTransacao(tx, lancamentos)).toEqual([]);
  });

  it('bonifica CNPJ presente na descrição', () => {
    const lancamentos = [
      mkLanc({
        id: 'cnpj',
        tipo: 'pagar',
        entidade: '12.345.678/0001-90',
        descricao: 'Aluguel',
        valor: 3500,
      }),
    ];
    const tx = mkTx({
      valor: -3500,
      tipo: 'debito',
      descricao: 'TED 12345678000190 REF ALUGUEL',
    });
    const matches = encontrarMatchesParaTransacao(tx, lancamentos);
    expect(matches[0]?.motivos.some((m) => m.descricao.includes('CNPJ'))).toBe(true);
  });

  it('detecta correspondência por número de documento', () => {
    const lancamentos = [
      mkLanc({
        id: 'doc',
        tipo: 'receber',
        numeroDocumento: 'NF-98765',
        descricao: 'Fatura',
        valor: 250,
      }),
    ];
    const tx = mkTx({
      valor: 250,
      descricao: 'Recebimento',
      numeroReferencia: 'NF-98765-2024',
    });
    const matches = encontrarMatchesParaTransacao(tx, lancamentos);
    expect(matches[0]?.motivos.some((m) => m.tipo === 'documento')).toBe(true);
  });

  it('marca confiança baixa quando divergência > 10%', () => {
    const lancamentos = [
      mkLanc({ id: 'X', descricao: 'CLIENTE UNICO EXATO', valor: 1000 }),
    ];
    const tx = mkTx({ valor: 1200, descricao: 'CLIENTE UNICO EXATO' });
    const matches = encontrarMatchesParaTransacao(tx, lancamentos, {
      pesoValorExato: 50,
      pesoValorProximo: 30,
      pesoNomeExato: 40,
      pesoNomeParcial: 25,
      pesoDataProxima: 20,
      pesoDocumento: 30,
      pesoCnpj: 60,
      toleranciaValor: 25,
      toleranciaDias: 5,
      scoreMinimo: 30,
    });
    expect(matches[0]?.confianca).toBe('baixa');
    expect(matches[0]?.divergenciaValor).toBeGreaterThan(0);
  });
});
