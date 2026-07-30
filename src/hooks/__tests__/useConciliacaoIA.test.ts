import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConciliacaoIA } from '../useConciliacaoIA';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    promise: vi.fn(),
  },
}));

vi.mock('../useHistoricoConciliacaoIA', () => ({
  useHistoricoConciliacaoIA: () => ({
    feedback: [],
  }),
}));

describe('useConciliacaoIA', () => {
  const mockTransacoes = [
    { id: 't1', data: new Date('2025-05-01'), descricao: 'Venda A', valor: 100, tipo: 'C' as const },
  ];
  const mockLancamentos = [
    { id: 'l1', tipo: 'receber' as const, entidade: 'Cliente A', descricao: 'Venda A', valor: 100, dataVencimento: new Date('2025-05-01'), numeroDocumento: '123' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar erro se não houver dados para análise', async () => {
    const { result } = renderHook(() => useConciliacaoIA());
    
    await act(async () => {
      const matches = await result.current.analisarConciliacao([], []);
      expect(matches.size).toBe(0);
    });

    expect(toast.info).toHaveBeenCalledWith('Dados insuficientes para análise de IA');
  });

  it('deve processar matches retornados pela Edge Function com sucesso', async () => {
    const mockResponse = {
      data: {
        matches: [
          {
            transacaoId: 't1',
            lancamentoId: 'l1',
            lancamentoTipo: 'receber',
            score: 0.95,
            confianca: 'alta',
            motivos: [{ tipo: 'valor', peso: 1, detalhe: 'Valores idênticos' }],
          }
        ],
        processedAt: new Date().toISOString(),
      },
      error: null,
    };

    (supabase.functions.invoke as any).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useConciliacaoIA());

    await act(async () => {
      const matches = await result.current.analisarConciliacao(mockTransacoes as any, mockLancamentos as any);
      
      expect(matches.size).toBe(1);
      expect(matches.get('t1')?.[0].score).toBe(0.95);
      expect(matches.get('t1')?.[0].lancamento).toBeDefined();
    });

    expect(toast.success).toHaveBeenCalledWith('Análise de IA concluída', expect.any(Object));
  });

  it('deve lidar com erros de rate limit (429) graciosamente', async () => {
    (supabase.functions.invoke as any).mockResolvedValue({
      data: null,
      error: { message: '429: Too Many Requests' },
    });

    const { result } = renderHook(() => useConciliacaoIA());

    await act(async () => {
      const matches = await result.current.analisarConciliacao(mockTransacoes as any, mockLancamentos as any);
      expect(matches.size).toBe(0);
    });

    expect(toast.error).toHaveBeenCalledWith('Limite de requisições excedido', expect.any(Object));
  });

  it('deve limpar os matches corretamente', () => {
    const { result } = renderHook(() => useConciliacaoIA());
    
    act(() => {
      result.current.clearMatches();
    });

    expect(result.current.matchesIA.size).toBe(0);
    expect(result.current.lastAnalysis).toBeNull();
  });
});
