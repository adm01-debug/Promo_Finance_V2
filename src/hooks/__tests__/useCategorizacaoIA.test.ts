import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCategorizacaoIA } from '../useCategorizacaoIA';

describe('useCategorizacaoIA', () => {
  it('deve categorizar despesa com IA', async () => {
    const { result } = renderHook(() => useCategorizacaoIA());
    const categoria = await act(async () => {
      return await result.current.categorizar({
        descricao: 'Pagamento Uber 25/12',
        valor: 45.50
      });
    });
    expect(categoria).toHaveProperty('categoria');
    expect(categoria).toHaveProperty('confianca');
  });

  it('deve sugerir categoria para item não identificado', async () => {
    const { result } = renderHook(() => useCategorizacaoIA());
    const sugestoes = await act(async () => {
      return await result.current.getSugestoes('Despesa desconhecida');
    });
    expect(Array.isArray(sugestoes)).toBe(true);
  });
});
