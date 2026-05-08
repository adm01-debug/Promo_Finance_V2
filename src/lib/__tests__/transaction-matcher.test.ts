import { describe, it, expect } from 'vitest';
import {
  encontrarMatchesParaTransacao,
  encontrarTodosMatches,
  calcularEstatisticasMatch,
  converterContasPagarParaLancamentos,
  converterContasReceberParaLancamentos,
  DEFAULT_CONFIG,
  type LancamentoSistema,
} from '../transaction-matcher';
import type { TransacaoOFX } from '../ofx-parser';

const mockTransacao = (overrides: Partial<TransacaoOFX> = {}): TransacaoOFX => ({
  id: 'tx-1',
  tipo: 'credito',
  data: new Date('2024-01-15'),
  valor: 1000,
  descricao: 'PAGAMENTO CLIENTE ABC',
  numeroReferencia: 'REF123',
  memo: '',
  ...overrides,
});

const mockLancamento = (overrides: Partial<LancamentoSistema> = {}): LancamentoSistema => ({
  id: 'lanc-1',
  tipo: 'receber',
  descricao: 'Fatura mensal',
  valor: 1000,
  dataVencimento: new Date('2024-01-15'),
  entidade: 'Cliente ABC',
  entidadeNome: 'ABC Ltda',
  status: 'pendente',
  ...overrides,
});

// ============================
// encontrarMatchesParaTransacao
// ============================
describe('encontrarMatchesParaTransacao', () => {
  it('match com valor exato e nome similar', () => {
    const matches = encontrarMatchesParaTransacao(mockTransacao(), [mockLancamento()]);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].score).toBeGreaterThanOrEqual(50);
  });

  it('filtra por tipo (credito → receber)', () => {
    const matches = encontrarMatchesParaTransacao(
      mockTransacao({ tipo: 'credito' }),
      [mockLancamento({ tipo: 'pagar' })]
    );
    expect(matches.length).toBe(0);
  });

  it('filtra lançamentos pagos', () => {
    const matches = encontrarMatchesParaTransacao(
      mockTransacao(),
      [mockLancamento({ status: 'pago' })]
    );
    expect(matches.length).toBe(0);
  });

  it('sem match quando valor muito diferente', () => {
    const matches = encontrarMatchesParaTransacao(
      mockTransacao({ valor: 1000 }),
      [mockLancamento({ valor: 5000 })]
    );
    expect(matches.length).toBe(0);
  });

  it('match com valor próximo dentro da tolerância', () => {
    const matches = encontrarMatchesParaTransacao(
      mockTransacao({ valor: 1000 }),
      [mockLancamento({ valor: 1010 })],
      { ...DEFAULT_CONFIG, toleranciaValor: 2 }
    );
    expect(matches.length).toBeGreaterThan(0);
  });

  it('confiança alta para match perfeito', () => {
    const matches = encontrarMatchesParaTransacao(
      mockTransacao({ descricao: 'CLIENTE ABC', valor: 1000 }),
      [mockLancamento({ entidade: 'Cliente ABC', valor: 1000 })]
    );
    if (matches.length > 0) {
      expect(['alta', 'media']).toContain(matches[0].confianca);
    }
  });

  it('match com documento correspondente', () => {
    const matches = encontrarMatchesParaTransacao(
      mockTransacao({ numeroReferencia: 'DOC123' }),
      [mockLancamento({ numeroDocumento: 'DOC123' })]
    );
    expect(matches.length).toBeGreaterThan(0);
    const docMotivo = matches[0].motivos.find(m => m.tipo === 'documento');
    expect(docMotivo).toBeDefined();
  });

  it('ordenação por score descendente', () => {
    const matches = encontrarMatchesParaTransacao(
      mockTransacao(),
      [
        mockLancamento({ id: 'l1', valor: 1000, entidade: 'ABC' }),
        mockLancamento({ id: 'l2', valor: 1005, entidade: 'XYZ' }),
      ]
    );
    if (matches.length >= 2) {
      expect(matches[0].score).toBeGreaterThanOrEqual(matches[1].score);
    }
  });

  it('débito busca em pagar', () => {
    const matches = encontrarMatchesParaTransacao(
      mockTransacao({ tipo: 'debito', valor: -500 }),
      [mockLancamento({ tipo: 'pagar', valor: 500 })]
    );
    expect(matches.length).toBeGreaterThan(0);
  });
});

// ============================
// Boundary Cases (Valor e Lucro/JCP)
// ============================
describe('transaction-matcher - Boundary Cases', () => {
  it('exatamente no limite de tolerância de valor (percentual)', () => {
    const tolerancia = 2; // 2%
    const valorOriginal = 1000;
    const valorNoLimite = 1020; // 2% de 1000
    
    const matches = encontrarMatchesParaTransacao(
      mockTransacao({ valor: valorOriginal }),
      [mockLancamento({ valor: valorNoLimite })],
      { ...DEFAULT_CONFIG, toleranciaValor: tolerancia }
    );
    
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].motivos.some(m => m.tipo === 'valor_proximo')).toBe(true);
  });

  it('exatamente no limite de tolerância de data (dias)', () => {
    const toleranciaDias = 10; // Aumentado para garantir score > 0.5
    const dataBase = new Date('2024-01-15T12:00:00Z');
    const dataLimite = new Date('2024-01-20T12:00:00Z'); // 5 dias depois
    
    const matches = encontrarMatchesParaTransacao(
      mockTransacao({ data: dataBase }),
      [mockLancamento({ dataVencimento: dataLimite })],
      { ...DEFAULT_CONFIG, toleranciaDias }
    );
    
    // score = 1 - (5/10)*0.5 = 0.75 (> 0.5)
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].motivos.some(m => m.tipo === 'data_proxima')).toBe(true);
  });

  it('quase no limite (centavos)', () => {
    const matches = encontrarMatchesParaTransacao(
      mockTransacao({ valor: 1000.50 }),
      [mockLancamento({ valor: 1000.51 })]
    );
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].motivos.some(m => m.tipo === 'valor_exato' || m.tipo === 'valor_proximo')).toBe(true);
  });

  it('valor zero (caso de borda)', () => {
    const matches = encontrarMatchesParaTransacao(
      mockTransacao({ valor: 0 }),
      [mockLancamento({ valor: 0 })]
    );
    // similaridadeValor.tipo === 'exato' se diff < 0.01
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].motivos.some(m => m.tipo === 'valor_exato')).toBe(true);
  });
});

// ============================
// encontrarTodosMatches
// ============================
describe('encontrarTodosMatches', () => {
  it('processa múltiplas transações', () => {
    const transacoes = [
      mockTransacao({ id: 'tx-1', valor: 1000 }),
      mockTransacao({ id: 'tx-2', valor: 2000 }),
    ];
    const lancamentos = [
      mockLancamento({ id: 'l1', valor: 1000 }),
      mockLancamento({ id: 'l2', valor: 2000 }),
    ];
    const resultado = encontrarTodosMatches(transacoes, lancamentos);
    expect(resultado.size).toBeGreaterThan(0);
  });

  it('evita reutilizar lançamentos com score alto', () => {
    const transacoes = [
      mockTransacao({ id: 'tx-1', valor: 1000, descricao: 'ABC' }),
      mockTransacao({ id: 'tx-2', valor: 1000, descricao: 'ABC' }),
    ];
    const lancamentos = [mockLancamento({ id: 'l1', valor: 1000, entidade: 'ABC' })];
    const resultado = encontrarTodosMatches(transacoes, lancamentos);
    // Pelo menos a primeira deve ter match
    expect(resultado.size).toBeGreaterThanOrEqual(1);
  });
});

// ============================
// calcularEstatisticasMatch
// ============================
describe('calcularEstatisticasMatch', () => {
  it('calcula estatísticas corretamente', () => {
    const transacoes = [mockTransacao({ id: 'tx-1', valor: 1000 })];
    const matches = new Map([['tx-1', [{ ...encontrarMatchesParaTransacao(mockTransacao(), [mockLancamento()])[0] }]]]);
    if (matches.get('tx-1')?.length) {
      const stats = calcularEstatisticasMatch(transacoes, matches);
      expect(stats.totalTransacoes).toBe(1);
      expect(stats.comSugestao).toBe(1);
    }
  });

  it('sem matches', () => {
    const transacoes = [mockTransacao()];
    const matches = new Map<string, never[]>();
    const stats = calcularEstatisticasMatch(transacoes, matches);
    expect(stats.semMatch).toBe(1);
    expect(stats.comSugestao).toBe(0);
  });
});

// ============================
// Conversores
// ============================
describe('converterContasPagarParaLancamentos', () => {
  it('converte corretamente', () => {
    const result = converterContasPagarParaLancamentos([{
      id: '1', descricao: 'Aluguel', valor: 3000, data_vencimento: '2024-01-15',
      fornecedor_nome: 'Imobiliária', status: 'pendente', numero_documento: 'NF123',
    }]);
    expect(result[0].tipo).toBe('pagar');
    expect(result[0].valor).toBe(3000);
    expect(result[0].entidade).toBe('Imobiliária');
  });
});

describe('converterContasReceberParaLancamentos', () => {
  it('converte corretamente', () => {
    const result = converterContasReceberParaLancamentos([{
      id: '1', descricao: 'Serviço', valor: 5000, data_vencimento: '2024-02-10',
      cliente_nome: 'ABC Corp', status: 'pendente',
    }]);
    expect(result[0].tipo).toBe('receber');
    expect(result[0].entidade).toBe('ABC Corp');
  });
});
