// ============================================
// TESTES — useAlertasTributarios (realtime)
// ============================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

type Handler = (payload: { new: Record<string, unknown> }) => void;

const mocks = vi.hoisted(() => {
  // O hook registra dois canais com o mesmo primeiro argumento
  // ('postgres_changes'); o evento real vem no filtro.
  const handlers: Record<string, Handler> = {};
  const removeChannel = vi.fn();
  const orderFinal = vi.fn();
  const orderMock = vi.fn();
  const eqMock = vi.fn();
  const chain = { eq: eqMock, order: orderMock };
  const channelMock = { on: vi.fn(), subscribe: vi.fn() };
  return { handlers, removeChannel, orderFinal, orderMock, eqMock, chain, channelMock };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({ select: () => mocks.chain })),
    channel: vi.fn(() => mocks.channelMock),
    removeChannel: mocks.removeChannel,
  },
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), warning: vi.fn() } }));

import { useAlertasTributarios } from '../useAlertasTributarios';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

const alertaOriginal = {
  id: 'a1',
  empresa_id: 'e1',
  tipo: 'vencimento_darf',
  prioridade: 'alta',
  titulo: 'DARF vence em 5 dias',
  mensagem: 'Guia de outubro',
  lido: false,
  resolvido: false,
  created_at: '2026-10-01T00:00:00Z',
};

describe('useAlertasTributarios — escalada via UPDATE do cron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(mocks.handlers)) delete mocks.handlers[key];

    mocks.eqMock.mockReturnValue(mocks.chain);
    mocks.orderMock.mockReturnValue({ order: mocks.orderFinal });
    mocks.orderFinal.mockResolvedValue({ data: [], error: null });
    mocks.channelMock.on.mockImplementation((_tipo, filtro, handler) => {
      mocks.handlers[(filtro as { event: string }).event] = handler as Handler;
      return mocks.channelMock;
    });
    mocks.channelMock.subscribe.mockReturnValue(mocks.channelMock);
  });

  it('mescla o payload do UPDATE na cópia de realtime em vez de manter a prioridade antiga', async () => {
    const { result } = renderHook(() => useAlertasTributarios('e1'), { wrapper });
    await waitFor(() => expect(mocks.orderFinal).toHaveBeenCalled());

    act(() => {
      mocks.handlers.INSERT({ new: { ...alertaOriginal } });
    });
    expect(result.current.alertas[0].prioridade).toBe('alta');

    act(() => {
      mocks.handlers.UPDATE({
        new: {
          ...alertaOriginal,
          prioridade: 'critica',
          mensagem: 'Guia de outubro vence em 2 dias',
        },
      });
    });

    expect(result.current.alertas).toHaveLength(1);
    expect(result.current.alertas[0].prioridade).toBe('critica');
    expect(result.current.alertas[0].mensagem).toBe('Guia de outubro vence em 2 dias');
  });

  it('não altera outras linhas quando o UPDATE chega para outro alerta', async () => {
    const { result } = renderHook(() => useAlertasTributarios('e1'), { wrapper });
    await waitFor(() => expect(mocks.orderFinal).toHaveBeenCalled());

    act(() => {
      mocks.handlers.INSERT({ new: { ...alertaOriginal } });
      mocks.handlers.INSERT({ new: { ...alertaOriginal, id: 'a2', prioridade: 'media' } });
    });

    act(() => {
      mocks.handlers.UPDATE({ new: { ...alertaOriginal, prioridade: 'critica' } });
    });

    expect(result.current.alertas.find((a) => a.id === 'a2')?.prioridade).toBe('media');
    expect(result.current.alertas.find((a) => a.id === 'a1')?.prioridade).toBe('critica');
  });
});
