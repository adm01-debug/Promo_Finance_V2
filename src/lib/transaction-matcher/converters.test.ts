import { describe, expect, it } from 'vitest';
import {
  converterContasPagarParaLancamentos,
  converterContasReceberParaLancamentos,
} from './converters';

describe('conversores de lançamentos para conciliação', () => {
  it('usa somente o saldo residual de uma conta a pagar parcial', () => {
    const [lancamento] = converterContasPagarParaLancamentos([{
      id: 'cp-1', descricao: 'Fornecedor', valor: 1000, valor_pago: 400,
      data_vencimento: '2026-09-10', fornecedor_nome: 'Fornecedor', status: 'parcial',
    }]);
    expect(lancamento.valor).toBe(600);
  });

  it('usa somente o saldo residual de uma conta a receber parcial', () => {
    const [lancamento] = converterContasReceberParaLancamentos([{
      id: 'cr-1', descricao: 'Cliente', valor: 1000, valor_recebido: 400,
      data_vencimento: '2026-09-10', cliente_nome: 'Cliente', status: 'parcial',
    }]);
    expect(lancamento.valor).toBe(600);
  });

  it('não cria saldo negativo quando a fonte está inconsistente', () => {
    const [lancamento] = converterContasPagarParaLancamentos([{
      id: 'cp-2', descricao: 'Fornecedor', valor: 1000, valor_pago: 1100,
      data_vencimento: '2026-09-10', fornecedor_nome: 'Fornecedor', status: 'parcial',
    }]);
    expect(lancamento.valor).toBe(0);
  });
});
