// ============================================
// TESTES — useAlertasTributariosCount
// ============================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const selectMock = vi.fn();
const inMock = vi.fn();
const eqMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: selectMock,
    })),
  },
}));

import { useAlertasTributariosCount } from '../useAlertasTributariosCount';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

describe('useAlertasTributariosCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectMock.mockReturnValue({ in: inMock });
    inMock.mockReturnValue({ eq: eqMock });
  });

  it('retorna count quando query bem-sucedida', async () => {
    eqMock.mockResolvedValue({ count: 7, error: null });
    const { result } = renderHook(() => useAlertasTributariosCount(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(7);
  });

  it('retorna 0 quando count é null', async () => {
    eqMock.mockResolvedValue({ count: null, error: null });
    const { result } = renderHook(() => useAlertasTributariosCount(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(0);
  });

  it('filtra por tipos tributários e lido=false', async () => {
    eqMock.mockResolvedValue({ count: 3, error: null });
    const { result } = renderHook(() => useAlertasTributariosCount(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(inMock).toHaveBeenCalledWith(
      'tipo',
      expect.arrayContaining([
        'sublimite_simples',
        'fator_r_baixo',
        'vencimento_darf',
        'desvio_benchmark',
        'irpfm_2026',
        'tributario',
      ]),
    );
    expect(eqMock).toHaveBeenCalledWith('lido', false);
  });

  it('propaga erro do Supabase', async () => {
    eqMock.mockResolvedValue({ count: null, error: { message: 'boom' } });
    const { result } = renderHook(() => useAlertasTributariosCount(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
