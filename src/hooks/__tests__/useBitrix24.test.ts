import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useBitrix24 } from '../useBitrix24';

describe('useBitrix24', () => {
  it('deve sincronizar com Bitrix24', async () => {
    const { result } = renderHook(() => useBitrix24());
    await act(async () => {
      await result.current.sincronizar();
    });
    expect(result.current.ultimaSync).toBeDefined();
  });

  it('deve buscar leads', async () => {
    const { result } = renderHook(() => useBitrix24());
    const leads = await act(async () => {
      return await result.current.getLeads();
    });
    expect(Array.isArray(leads)).toBe(true);
  });

  it('deve criar deal', async () => {
    const { result } = renderHook(() => useBitrix24());
    await act(async () => {
      await result.current.criarDeal({
        titulo: 'Proposta X',
        valor: 50000,
        cliente_id: 'cli-1'
      });
    });
    expect(result.current.error).toBeNull();
  });
});
