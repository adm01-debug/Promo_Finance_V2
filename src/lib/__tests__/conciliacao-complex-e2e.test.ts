import { describe, it, expect } from 'vitest';
import { encontrarMatchesParaTransacao, LancamentoSistema } from '../transaction-matcher';
import { TransacaoOFX } from '../ofx-parser';

describe('E2E Complexo: Conciliação Multi-Conta e Multi-CNPJ', () => {
  
  const lancamentosGerais: LancamentoSistema[] = [
    {
      id: 'l-empresa-1-conta-1',
      tipo: 'pagar',
      descricao: 'Aluguel Unidade SP',
      valor: 5000.00,
      dataVencimento: new Date('2024-05-10'),
      entidade: 'Imobiliária X',
      status: 'pendente',
      empresaId: 'empresa-sp',
      contaBancariaId: 'itau-sp'
    },
    {
      id: 'l-empresa-2-conta-2',
      tipo: 'pagar',
      descricao: 'Aluguel Unidade RJ',
      valor: 5000.00,
      dataVencimento: new Date('2024-05-10'),
      entidade: 'Imobiliária Y',
      status: 'pendente',
      empresaId: 'empresa-rj',
      contaBancariaId: 'bradesco-rj'
    }
  ];

  it('deve filtrar matches corretamente por contaBancariaId para evitar cross-account matching', () => {
    const transacaoItau: TransacaoOFX = {
      id: 'tx-itau',
      data: new Date('2024-05-10'),
      valor: -5000.00,
      descricao: 'PAGTO ALUGUEL',
      tipo: 'debito'
    };

    // Simulando o contexto de conciliação da conta do Itaú SP
    const contextContaId = 'itau-sp';
    const lancamentosFiltrados = lancamentosGerais.filter(l => l.contaBancariaId === contextContaId);
    
    const matches = encontrarMatchesParaTransacao(transacaoItau, lancamentosFiltrados);
    
    expect(matches.length).toBe(1);
    expect(matches[0].lancamento.id).toBe('l-empresa-1-conta-1');
  });

  it('deve lidar com múltiplos CNPJs (Empresas) no mesmo pool de lançamentos se necessário', () => {
    const transacaoGeneric: TransacaoOFX = {
      id: 'tx-generic',
      data: new Date('2024-05-10'),
      valor: -5000.00,
      descricao: 'ALUGUEL',
      tipo: 'debito'
    };

    // Se buscarmos em todos, deve retornar 2 matches com scores baseados em outros critérios
    const matches = encontrarMatchesParaTransacao(transacaoGeneric, lancamentosGerais);
    
    expect(matches.length).toBe(2);
    expect(matches.every(m => m.score >= 70)).toBe(true);
  });

  it('deve gerar divergência corretamente para valores parciais', () => {
    const transacaoParcial: TransacaoOFX = {
      id: 'tx-parcial',
      data: new Date('2024-05-10'),
      valor: -2500.00, // Metade do aluguel
      descricao: 'ALUGUEL UNIDADE SP', // Nome exato para forçar o match mesmo com valor diferente
      tipo: 'debito'
    };

    const matches = encontrarMatchesParaTransacao(transacaoParcial, lancamentosGerais);
    
    // Deve encontrar matches mas com score menor ou flag de divergência de valor
    const bestMatch = matches[0];
    expect(bestMatch).toBeDefined();
    expect(bestMatch.lancamento.valor).toBe(5000.00);

    expect(bestMatch.divergenciaValor).toBe(2500.00);
    expect(bestMatch.confianca).toBe('baixa');
  });
});
