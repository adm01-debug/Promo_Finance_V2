import { describe, it, expect } from 'vitest';
import { 
  encontrarMatchesParaTransacao, 
  LancamentoSistema
} from '../transaction-matcher';
import { TransacaoOFX } from '../ofx-parser';

describe('Intelligent Transaction Matcher', () => {
  const mockLancamentos: LancamentoSistema[] = [
    {
      id: 'l1',
      tipo: 'pagar',
      descricao: 'Pagamento Internet Vivo',
      valor: 150.00,
      dataVencimento: new Date('2024-05-10'),
      entidade: 'Vivo S.A.',
      status: 'pendente'
    },
    {
      id: 'l2',
      tipo: 'receber',
      descricao: 'Venda de Software Alpha',
      valor: 5000.00,
      dataVencimento: new Date('2024-05-15'),
      entidade: 'Empresa Alpha',
      status: 'pendente'
    },
    {
      id: 'l3',
      tipo: 'pagar',
      descricao: 'Aluguel Escritório',
      valor: 3500.00,
      dataVencimento: new Date('2024-05-05'),
      entidade: 'Imobiliária Beta (12.345.678/0001-90)',
      status: 'pendente'
    }
  ];

  it('deve encontrar match exato por valor e nome', () => {
    const transacao: TransacaoOFX = {
      id: 't1',
      tipo: 'debito',
      valor: -150.00,
      data: new Date('2024-05-10'),
      descricao: 'VIVO INTERNET MENSAL',
      tipoTransacao: 'PAYMENT'
    };

    const matches = encontrarMatchesParaTransacao(transacao, mockLancamentos);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].lancamentoId).toBe('l1');
    expect(matches[0].score).toBeGreaterThan(80);
  });

  it('deve encontrar match por valor próximo (tolerância)', () => {
    const transacao: TransacaoOFX = {
      id: 't2',
      tipo: 'debito',
      valor: -151.20, // 1.20 de diferença (menos de 2%)
      data: new Date('2024-05-11'),
      descricao: 'VIVO INTERNET',
      tipoTransacao: 'PAYMENT'
    };

    const matches = encontrarMatchesParaTransacao(transacao, mockLancamentos);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].lancamentoId).toBe('l1');
    expect(matches[0].score).toBeGreaterThan(70);
  });

  it('deve encontrar match por data próxima e nome parcial', () => {
    const transacao: TransacaoOFX = {
      id: 't3',
      tipo: 'debito',
      valor: -3500.00,
      data: new Date('2024-05-07'), // 2 dias depois do vencimento
      descricao: 'ALUGUEL',
      tipoTransacao: 'PAYMENT'
    };

    const matches = encontrarMatchesParaTransacao(transacao, mockLancamentos);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].lancamentoId).toBe('l3');
    // Valor exato + data próxima + nome parcial ("ALUGUEL") = confiança média.
    expect(matches[0].confianca).toBe('media');
  });

  it('deve encontrar match por CNPJ na descrição', () => {
    const transacao: TransacaoOFX = {
      id: 't_cnpj',
      tipo: 'debito',
      valor: -3500.00,
      data: new Date('2024-05-05'),
      descricao: 'PGTO ALUGUEL 12345678000190',
      tipoTransacao: 'PAYMENT'
    };

    const matches = encontrarMatchesParaTransacao(transacao, mockLancamentos);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].lancamentoId).toBe('l3');
    // Match por CNPJ + valor exato + data exata é altamente confiável.
    expect(matches[0].score).toBeGreaterThanOrEqual(85);
    expect(matches[0].confianca).toBe('alta');
  });

  it('sinaliza divergência (baixa confiança) quando o valor é muito diferente', () => {
    const transacao: TransacaoOFX = {
      id: 't4',
      tipo: 'debito',
      valor: -100.00, // 50 de diferença (muito mais que 2%)
      data: new Date('2024-05-10'),
      descricao: 'VIVO INTERNET',
      tipoTransacao: 'PAYMENT'
    };

    const matches = encontrarMatchesParaTransacao(transacao, mockLancamentos);
    // O nome forte mantém o lançamento como candidato, porém de BAIXA
    // confiança e com a divergência de valor sinalizada para revisão manual
    // (comportamento de pagamento parcial, alinhado ao fluxo de conciliação).
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].lancamentoId).toBe('l1');
    expect(matches[0].confianca).toBe('baixa');
    expect(matches[0].divergenciaValor).toBeGreaterThan(0);
  });

  it('deve lidar com múltiplas empresas (mockando entidade)', () => {
    const transacao: TransacaoOFX = {
      id: 't5',
      tipo: 'credito',
      valor: 5000.00,
      data: new Date('2024-05-15'),
      descricao: 'RECEBIMENTO ALPHA',
      tipoTransacao: 'DEP'
    };

    const matches = encontrarMatchesParaTransacao(transacao, mockLancamentos);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].lancamentoId).toBe('l2');
    // Valor exato + data exata, com nome diluído por stopwords ("RECEBIMENTO").
    expect(matches[0].score).toBeGreaterThanOrEqual(60);
  });
});
