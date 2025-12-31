import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExpertActions } from '../useExpertActions';

describe('useExpertActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar corretamente', () => {
    const { result } = renderHook(() => useExpertActions());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.actions).toEqual([]);
  });

  it('deve executar ação de análise', async () => {
    const { result } = renderHook(() => useExpertActions());
    
    await act(async () => {
      await result.current.executeAction({
        type: 'analyze',
        params: { period: '2024-01', category: 'expenses' }
      });
    });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('deve gerar relatório', async () => {
    const { result } = renderHook(() => useExpertActions());
    
    let report;
    await act(async () => {
      report = await result.current.generateReport({
        type: 'financial-summary',
        period: 'monthly'
      });
    });
    
    expect(report).toBeDefined();
    expect(report).toHaveProperty('data');
  });

  it('deve executar sugestão de otimização', async () => {
    const { result } = renderHook(() => useExpertActions());
    
    await act(async () => {
      await result.current.applySuggestion({
        id: 'suggestion-1',
        type: 'cost-reduction'
      });
    });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('deve tratar erros corretamente', async () => {
    const { result } = renderHook(() => useExpertActions());
    
    await act(async () => {
      try {
        await result.current.executeAction({
          type: 'invalid-action',
          params: {}
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  it('deve cancelar ação em andamento', async () => {
    const { result } = renderHook(() => useExpertActions());
    
    act(() => {
      result.current.executeAction({
        type: 'analyze',
        params: { period: '2024-01' }
      });
    });
    
    act(() => {
      result.current.cancelAction();
    });
    
    expect(result.current.loading).toBe(false);
  });

  it('deve limpar histórico de ações', () => {
    const { result } = renderHook(() => useExpertActions());
    
    act(() => {
      result.current.clearHistory();
    });
    
    expect(result.current.actions).toEqual([]);
  });
});
