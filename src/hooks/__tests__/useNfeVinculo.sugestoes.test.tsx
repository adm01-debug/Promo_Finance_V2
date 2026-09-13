/**
 * Testes — useSugestoesContaPagar (Etapa 31)
 *
 * O `?? []` do hook só cobria `null`/`undefined`. Qualquer outro formato
 * chegava intacto em `sugestoes.map` no `NfeVinculoDialog`, e o TypeError
 * levava a página inteira de NF-e Recebidas para o ErrorBoundary — o usuário
 * perdia a listagem, não apenas as sugestões. O E2E reproduziu com o proxy
 * respondendo `{ ok: true }`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockInvokeEdge, loggerMock } = vi.hoisted(() => ({
  mockInvokeEdge: vi.fn(),
  loggerMock: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/logger', () => ({ logger: loggerMock }));
vi.mock('@/lib/edge-function-error', () => ({
  invokeEdge: mockInvokeEdge,
  handleEdgeError: vi.fn(),
}));

import { useSugestoesContaPagar } from '../useNfeVinculo';

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

async function sugestoesPara(resposta: unknown) {
  mockInvokeEdge.mockResolvedValue(resposta);
  const { result } = renderHook(() => useSugestoesContaPagar('nfe-1'), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  return result.current.data;
}

describe('useSugestoesContaPagar — formato do payload', () => {
  it('devolve a lista quando o proxy responde o formato esperado', async () => {
    const lista = [{ conta_pagar_id: 'cp-1', descricao: 'Compra', score: 92 }];
    expect(await sugestoesPara(lista)).toEqual(lista);
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it('devolve lista vazia — não um objeto — quando o proxy responde fora do formato', async () => {
    const data = await sugestoesPara({ ok: true });
    expect(Array.isArray(data)).toBe(true);
    expect(data).toEqual([]);
    // Silêncio total esconderia a divergência de contrato com a Edge Function.
    expect(loggerMock.warn).toHaveBeenCalledWith(
      expect.stringContaining('fora do formato'),
      expect.objectContaining({ tipo: 'object', chaves: ['ok'] })
    );
  });

  it('trata null como ausência de candidatas, sem alarde', async () => {
    expect(await sugestoesPara(null)).toEqual([]);
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it('não chama o proxy sem NF-e selecionada', () => {
    renderHook(() => useSugestoesContaPagar(null), { wrapper });
    expect(mockInvokeEdge).not.toHaveBeenCalled();
  });
});
