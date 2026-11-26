import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const carregar = vi.fn();
vi.mock('@/lib/tributario/catalogos/classificacao-offline', () => ({
  carregarClassificacaoTributaria: (deps: unknown) => carregar(deps),
  proximoVencimentoMs: () => null,
}));
vi.mock('@/lib/tributario/catalogos/cclasstrib', () => ({
  listarCclasstribVigentes: async () => [],
}));

import { useClassificacaoTributaria } from '@/hooks/useCatalogoCclasstrib';

const linha = (cclasstrib: string) => ({
  cst: '200',
  cclasstrib,
  descricao: `teste ${cclasstrib}`,
  vigencia_inicio: '2026-01-01',
});

const pacote = (offline: boolean, cclasstribs: string[]) => ({
  opcoes: cclasstribs.map(linha),
  fundamentos: {},
  offline,
  gravadoEm: offline ? Date.parse('2026-11-20T00:00:00.000Z') : null,
  vigenciaAte: null,
});

/** Cliente com o `refetchOnMount: false` global (`queryClient.ts`). */
function montar() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnMount: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

beforeEach(() => carregar.mockReset());

describe('useClassificacaoTributaria', () => {
  it('reabrir a consulta por NCM troca o pacote offline pela leitura da rede', async () => {
    carregar.mockResolvedValueOnce(pacote(true, ['200038']));
    const { client, wrapper } = montar();

    const primeiro = renderHook(() => useClassificacaoTributaria(), { wrapper });
    await waitFor(() => expect(primeiro.result.current.opcoes).toHaveLength(1));
    expect(primeiro.result.current.offline).toBe(true);
    primeiro.unmount();

    carregar.mockResolvedValueOnce(pacote(false, ['200038', '000001']));
    const segundo = renderHook(() => useClassificacaoTributaria(), { wrapper });

    await waitFor(() => expect(carregar).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(segundo.result.current.opcoes).toHaveLength(2));
    expect(segundo.result.current.offline).toBe(false);
    expect(segundo.result.current.indisponivel).toBe(false);
    client.clear();
  });
});
