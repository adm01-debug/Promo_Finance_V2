import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSimulacaoRegimes } from './useSimulacaoRegimes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock do supabase
const mockInvoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: { id: '123' }, error: null })),
        })),
      })),
    })),
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useSimulacaoRegimes Integration', () => {
  it('deve alternar para resultado do servidor ao chamar sincronizarComServer', async () => {
    const mockServerResult = {
      recomendado: { nome: 'Regime IA', regime: 'lucro_real', totalTributos: 100, cargaEfetiva: 10 },
      cenarios: [],
      justificativa: 'Justificativa IA',
      justificativaIA: 'Justificativa IA Premium',
      auditLogId: 'audit-123',
      params: {}
    };

    mockInvoke.mockResolvedValue({ data: mockServerResult, error: null });

    const { result } = renderHook(() => useSimulacaoRegimes({ empresaId: 'empresa-123' }), { wrapper });

    // Inicialmente deve ter resultado local
    expect(result.current.resultado.recomendado.nome).not.toBe('Regime IA');

    await act(async () => {
      await result.current.sincronizarComServer();
    });

    // Após sincronizar, deve usar o resultado do servidor
    expect(result.current.resultado.recomendado.nome).toBe('Regime IA');
    expect(result.current.resultado.justificativaIA).toBe('Justificativa IA Premium');
  });

  it('deve invalidar o resultado do servidor ao alterar parâmetros', async () => {
    mockInvoke.mockResolvedValue({ data: { recomendado: { nome: 'IA' }, cenarios: [] }, error: null });

    const { result } = renderHook(() => useSimulacaoRegimes({ empresaId: 'empresa-123' }), { wrapper });

    await act(async () => {
      await result.current.sincronizarComServer();
    });

    expect(result.current.resultado.recomendado.nome).toBe('IA');

    act(() => {
      result.current.setParametros({ ...result.current.parametros, faturamentoAnual: 2000000 });
    });

    // Deve voltar para o cálculo local (fallback)
    expect(result.current.resultado.recomendado.nome).not.toBe('IA');
  });
});
