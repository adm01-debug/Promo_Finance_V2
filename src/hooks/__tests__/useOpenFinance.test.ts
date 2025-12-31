import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useOpenFinance } from '../useOpenFinance';

describe('useOpenFinance', () => {
  it('deve conectar com Open Finance', async () => {
    const { result } = renderHook(() => useOpenFinance());
    await act(async () => {
      await result.current.conectar({
        banco: 'banco-brasil',
        agencia: '1234',
        conta: '56789-0'
      });
    });
    expect(result.current.conectado).toBe(true);
  });

  it('deve sincronizar transações', async () => {
    const { result } = renderHook(() => useOpenFinance());
    const transacoes = await act(async () => {
      return await result.current.sincronizar();
    });
    expect(Array.isArray(transacoes)).toBe(true);
  });
});
