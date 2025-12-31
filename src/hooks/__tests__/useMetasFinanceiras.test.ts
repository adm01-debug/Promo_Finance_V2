import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMetasFinanceiras } from '../useMetasFinanceiras';

describe('useMetasFinanceiras', () => {
  it('deve listar metas', async () => {
    const { result } = renderHook(() => useMetasFinanceiras());
    
    await waitFor(() => {
      expect(result.current.metas).toBeDefined();
    });
  });

  it('deve criar nova meta', async () => {
    const { result } = renderHook(() => useMetasFinanceiras());
    
    await act(async () => {
      await result.current.criarMeta({
        tipo: 'receita',
        valor: 100000,
        periodo: 'mensal',
        ano: 2025,
        mes: 1
      });
    });
    
    expect(result.current.error).toBeNull();
  });

  it('deve atualizar progresso da meta', async () => {
    const { result } = renderHook(() => useMetasFinanceiras());
    
    const progresso = await act(async () => {
      return await result.current.getProgresso('meta-1');
    });
    
    expect(progresso).toHaveProperty('percentual');
    expect(progresso).toHaveProperty('valor_atual');
  });

  it('deve verificar se meta foi atingida', async () => {
    const { result } = renderHook(() => useMetasFinanceiras());
    
    const atingida = await act(async () => {
      return await result.current.verificarMeta('meta-1');
    });
    
    expect(typeof atingida).toBe('boolean');
  });

  it('deve deletar meta', async () => {
    const { result } = renderHook(() => useMetasFinanceiras());
    
    await act(async () => {
      await result.current.deletarMeta('meta-1');
    });
    
    expect(result.current.error).toBeNull();
  });
});
