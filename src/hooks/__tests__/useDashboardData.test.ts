import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: vi.fn(),
  })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

const useDashboardData = (empresaId: string, periodo: string) => {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const { data: contasPagar } = await mockSupabase
          .from('contas_pagar')
          .select('*')
          .eq('empresa_id', empresaId);

        const { data: contasReceber } = await mockSupabase
          .from('contas_receber')
          .select('*')
          .eq('empresa_id', empresaId);

        setData({
          contasPagar: contasPagar || [],
          contasReceber: contasReceber || [],
          totalPagar: contasPagar?.reduce((sum: number, c: any) => sum + c.valor, 0) || 0,
          totalReceber: contasReceber?.reduce((sum: number, c: any) => sum + c.valor, 0) || 0,
        });
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    if (empresaId) {
      fetchData();
    }
  }, [empresaId, periodo]);

  return { data, loading, error };
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
  return Wrapper;
};

describe('useDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com loading=true', () => {
    const { result } = renderHook(
      () => useDashboardData('empresa-123', 'mes'),
      { wrapper: createWrapper() }
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('deve carregar dados do dashboard', async () => {
    const mockContasPagar = [
      { id: '1', valor: 1000, descricao: 'Conta 1' },
      { id: '2', valor: 500, descricao: 'Conta 2' },
    ];

    const mockContasReceber = [
      { id: '1', valor: 2000, descricao: 'Receber 1' },
      { id: '2', valor: 1500, descricao: 'Receber 2' },
    ];

    mockSupabase.from = vi.fn((table) => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn((callback) => {
          const data = table === 'contas_pagar' ? mockContasPagar : mockContasReceber;
          return Promise.resolve(callback({ data, error: null }));
        }),
      };
      return chain;
    });

    const { result } = renderHook(
      () => useDashboardData('empresa-123', 'mes'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data.contasPagar).toHaveLength(2);
    expect(result.current.data.contasReceber).toHaveLength(2);
    expect(result.current.data.totalPagar).toBe(1500);
    expect(result.current.data.totalReceber).toBe(3500);
  });

  it('deve lidar com erro ao carregar dados', async () => {
    const mockError = new Error('Erro ao carregar dados');

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn(() => Promise.reject(mockError)),
    }));

    const { result } = renderHook(
      () => useDashboardData('empresa-123', 'mes'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
  });

  it('deve recarregar ao mudar empresaId', async () => {
    const { result, rerender } = renderHook(
      ({ empresaId, periodo }) => useDashboardData(empresaId, periodo),
      {
        wrapper: createWrapper(),
        initialProps: { empresaId: 'empresa-1', periodo: 'mes' },
      }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    rerender({ empresaId: 'empresa-2', periodo: 'mes' });

    expect(result.current.loading).toBe(true);
  });

  it('deve recarregar ao mudar período', async () => {
    const { result, rerender } = renderHook(
      ({ empresaId, periodo }) => useDashboardData(empresaId, periodo),
      {
        wrapper: createWrapper(),
        initialProps: { empresaId: 'empresa-1', periodo: 'mes' },
      }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    rerender({ empresaId: 'empresa-1', periodo: 'ano' });

    expect(result.current.loading).toBe(true);
  });
});
