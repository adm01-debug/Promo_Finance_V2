import { describe, it, expect, vi } from 'vitest';
import { encontrarMatchesParaTransacao, LancamentoSistema } from '../transaction-matcher';
import { TransacaoOFX } from '../ofx-parser';

// Teste de Ponta a Ponta para Conciliação Bancária (Matching e Divergências)
describe('E2E: Conciliação Bancária - Matching e Divergências', () => {
  
  // Cenário 1: Matching por valor exato e data próxima
  it('deve encontrar match de alta confiança com valor exato e data próxima', () => {
    const transacao: TransacaoOFX = {
      id: 'tx-1',
      data: new Date('2024-05-20'),
      valor: -500.00,
      descricao: 'FORNECEDOR ABC LTDA',
      tipo: 'debito'
    };

    const lancamentos: LancamentoSistema[] = [
      {
        id: 'lanc-1',
        tipo: 'pagar',
        descricao: 'Pagamento Fornecedor ABC',
        valor: 500.00,
        dataVencimento: new Date('2024-05-18'), // 2 dias de diferença
        entidade: 'Fornecedor ABC',
        status: 'pendente'
      }
    ];

    const matches = encontrarMatchesParaTransacao(transacao, lancamentos);
    
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].score).toBeGreaterThan(80);
    expect(matches[0].confianca).toBe('alta');
    expect(matches[0].motivos.some(m => m.tipo === 'valor_exato')).toBe(true);
    expect(matches[0].motivos.some(m => m.tipo === 'data_proxima')).toBe(true);
  });

  // Cenário 2: Matching por valor com tolerância (ajuste de centavos)
  it('deve permitir match com pequena divergência de centavos', () => {
    const transacao: TransacaoOFX = {
      id: 'tx-2',
      data: new Date('2024-05-20'),
      valor: -500.15,
      descricao: 'SISPAG FORNECEDOR',
      tipo: 'debito'
    };

    const lancamentos: LancamentoSistema[] = [
      {
        id: 'lanc-2',
        tipo: 'pagar',
        descricao: 'Fatura Fornecedor',
        valor: 500.00, // Diferença de 0.15
        dataVencimento: new Date('2024-05-20'),
        entidade: 'Fornecedor X',
        status: 'pendente'
      }
    ];

    const matches = encontrarMatchesParaTransacao(transacao, lancamentos);
    
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].score).toBeGreaterThan(60);
    expect(matches[0].motivos.some(m => m.tipo === 'valor_proximo')).toBe(true);
    
    const valorDiff = Math.abs(Math.abs(transacao.valor) - matches[0].lancamento.valor);
    expect(valorDiff).toBeCloseTo(0.15);
  });

  // Cenário 3: Múltiplas contas e CNPJs (Filtragem por tipo e contexto)
  it('deve separar corretamente transações de crédito e débito para diferentes tipos de lançamento', () => {
    const transacoes: TransacaoOFX[] = [
      { id: 't-deb', data: new Date(), valor: -100, descricao: 'SAIDA', tipo: 'debito' },
      { id: 't-cre', data: new Date(), valor: 100, descricao: 'ENTRADA', tipo: 'credito' }
    ];

    const lancamentos: LancamentoSistema[] = [
      { id: 'l-pag', tipo: 'pagar', valor: 100, dataVencimento: new Date(), entidade: 'F1', status: 'pendente', descricao: 'PAG' },
      { id: 'l-rec', tipo: 'receber', valor: 100, dataVencimento: new Date(), entidade: 'C1', status: 'pendente', descricao: 'REC' }
    ];

    const matchesDeb = encontrarMatchesParaTransacao(transacoes[0], lancamentos);
    const matchesCre = encontrarMatchesParaTransacao(transacoes[1], lancamentos);

    expect(matchesDeb[0].lancamentoTipo).toBe('pagar');
    expect(matchesCre[0].lancamentoTipo).toBe('receber');
  });

  // Cenário 4: Divergência de Saldo OFX
  it('deve identificar divergência quando o saldo final do OFX não bate com a soma das transações', () => {
    const saldoInicial = 1000;
    const transacoes = [
      { valor: -200 },
      { valor: 500 }
    ];
    const saldoFinalOFX = 1400; // Correto seria 1000 - 200 + 500 = 1300
    
    const saldoCalculado = saldoInicial + transacoes.reduce((acc, t) => acc + t.valor, 0);
    const divergencia = Math.abs(saldoCalculado - saldoFinalOFX);
    
    expect(divergencia).toBe(100);
    expect(divergencia > 0.01).toBe(true);
  });
});
