import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const listar = vi.fn();
vi.mock('@/lib/tributario/catalogos/cclasstrib', () => ({
  listarCclasstribVigentes: () => listar(),
}));

import { useCatalogoCclasstrib } from '@/hooks/useCatalogoCclasstrib';

/**
 * Cliente com o mesmo `refetchOnMount: false` global (`queryClient.ts`): e o que
 * fazia a lista vazia sobreviver a sair e voltar para a tela.
 */
function montar() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnMount: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

beforeEach(() => listar.mockReset());

describe('useCatalogoCclasstrib', () => {
  it('reconsulta ao remontar quando a leitura anterior voltou vazia', async () => {
    listar.mockResolvedValueOnce([]);
    const { client, wrapper } = montar();

    const primeiro = renderHook(() => useCatalogoCclasstrib(), { wrapper });
    await waitFor(() => expect(listar).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(primeiro.result.current.carregando).toBe(false));
    expect(primeiro.result.current.indisponivel).toBe(true);
    primeiro.unmount();

    listar.mockResolvedValueOnce([
      { cst: '200', cclasstrib: '200038', descricao: 'teste', vigencia_inicio: '2026-01-01' },
    ]);
    const segundo = renderHook(() => useCatalogoCclasstrib(), { wrapper });

    await waitFor(() => expect(listar).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(segundo.result.current.opcoes).toHaveLength(1));
    expect(segundo.result.current.indisponivel).toBe(false);
    client.clear();
  });

  it('nao reconsulta ao remontar quando a leitura esta fresca', async () => {
    listar.mockResolvedValue([
      { cst: '200', cclasstrib: '200038', descricao: 'teste', vigencia_inicio: '2026-01-01' },
    ]);
    const { client, wrapper } = montar();

    const primeiro = renderHook(() => useCatalogoCclasstrib(), { wrapper });
    await waitFor(() => expect(listar).toHaveBeenCalledTimes(1));
    primeiro.unmount();

    const segundo = renderHook(() => useCatalogoCclasstrib(), { wrapper });
    await waitFor(() => expect(segundo.result.current.opcoes).toHaveLength(1));
    expect(listar).toHaveBeenCalledTimes(1);
    client.clear();
  });
});
