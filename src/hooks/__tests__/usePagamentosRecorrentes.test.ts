import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePagamentosRecorrentes } from '../usePagamentosRecorrentes';

describe('usePagamentosRecorrentes', () => {
  it('deve listar pagamentos recorrentes', async () => {
    const { result } = renderHook(() => usePagamentosRecorrentes());
    expect(result.current.pagamentos).toBeDefined();
  });

  it('deve criar pagamento recorrente', async () => {
    const { result } = renderHook(() => usePagamentosRecorrentes());
    await act(async () => {
      await result.current.criar({
        descricao: 'Aluguel',
        valor: 5000,
        frequencia: 'mensal',
        dia_vencimento: 10
      });
    });
    expect(result.current.error).toBeNull();
  });
});
