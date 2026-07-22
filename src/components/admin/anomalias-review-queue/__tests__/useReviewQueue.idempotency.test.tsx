/**
 * Testes de regressão: idempotência e concorrência de `useReviewQueue`.
 *
 * Invariantes cobertos:
 *   - Submits duplicados para o mesmo id não disparam a mutation em paralelo.
 *   - Falha transitória de rede é retentada com backoff antes de propagar erro.
 *   - Falha definitiva NÃO avança fila, NÃO atualiza stats e mantém item.
 *   - Sincronização Bitrix é disparada no máximo 1x por id na sessão do modal.
 *   - Conflito de concorrência (AnomaliaJaRevisadaError) pula com stats.puladas++.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mocks = vi.hoisted(() => ({
  fila: [] as any[],
  revisarMutateAsync: undefined as any,
  revisarIsPending: false,
  sincronizarMutate: undefined as any,
  supabaseMaybeSingle: undefined as any,
  toasts: {
    success: undefined as any,
    error: undefined as any,
    warning: undefined as any,
    info: undefined as any,
  },
}));

mocks.revisarMutateAsync = vi.fn();
mocks.sincronizarMutate = vi.fn();
mocks.supabaseMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
mocks.toasts.success = vi.fn();
mocks.toasts.error = vi.fn();
mocks.toasts.warning = vi.fn();
mocks.toasts.info = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...a: any[]) => mocks.toasts.success(...a),
    error: (...a: any[]) => mocks.toasts.error(...a),
    warning: (...a: any[]) => mocks.toasts.warning(...a),
    info: (...a: any[]) => mocks.toasts.info(...a),
  },
}));

class AnomaliaJaRevisadaError extends Error {
  code = "ANOMALIA_JA_REVISADA" as const;
  constructor(message = "Anomalia já foi revisada por outro usuário") {
    super(message);
    this.name = "AnomaliaJaRevisadaError";
  }
}

vi.mock("@/hooks/useAnomaliasDetectadas", () => ({
  AnomaliaJaRevisadaError,
  usePendingAnomaliasQueueInfinite: () => ({
    items: mocks.fila,
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
  }),
  useRevisarAnomalia: () => ({
    mutateAsync: (...a: any[]) => mocks.revisarMutateAsync(...a),
    isPending: mocks.revisarIsPending,
  }),
}));

vi.mock("@/hooks/useSincronizarAnomaliaBitrix", () => ({
  useSincronizarAnomaliaBitrix: () => ({
    mutate: (...a: any[]) => mocks.sincronizarMutate(...a),
  }),
}));

vi.mock("@/integrations/supabase/client", () => {
  const from = vi.fn(() => ({
    select: vi.fn(function (this: any) { return this; }),
    eq: vi.fn(function (this: any) { return this; }),
    maybeSingle: () => mocks.supabaseMaybeSingle(),
  }));
  return { supabase: { from } };
});

import { useReviewQueue } from "../useReviewQueue";

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function makeAnomalia(id: string, over: Partial<any> = {}) {
  return {
    id,
    tipo_anomalia: "duplicidade",
    severidade: "alta",
    status: "nova",
    descricao: "Anomalia de teste para regressão de idempotência",
    dados: {},
    resolvida_em: null,
    resolvida_por: null,
    ...over,
  };
}

const COMENTARIO_VALIDO = "Comentário longo o suficiente para validação";

beforeEach(() => {
  mocks.fila = [makeAnomalia("anom-1"), makeAnomalia("anom-2")];
  mocks.revisarIsPending = false;
  vi.mocked(mocks.revisarMutateAsync).mockReset();
  vi.mocked(mocks.sincronizarMutate).mockReset();
  vi.mocked(mocks.supabaseMaybeSingle).mockReset().mockResolvedValue({ data: null, error: null });
  vi.mocked(mocks.toasts.success).mockClear();
  vi.mocked(mocks.toasts.error).mockClear();
  vi.mocked(mocks.toasts.warning).mockClear();
  vi.mocked(mocks.toasts.info).mockClear();
});

// Renderiza o hook e injeta comentário válido
function mount() {
  // supabase.maybeSingle usado por recarregarPosicao — devolve a próxima da fila (anom-2) como "nova"
  vi.mocked(mocks.supabaseMaybeSingle).mockResolvedValue({
    data: makeAnomalia("anom-2"),
    error: null,
  });
  const hook = renderHook(() => useReviewQueue({ open: true, severidadeFilter: "todas" }), { wrapper });
  act(() => { hook.result.current.setComentario(COMENTARIO_VALIDO); });
  return hook;
}

describe("useReviewQueue — idempotência e concorrência", () => {
  it("#1 [idempotência] dois handleAcao paralelos para o mesmo id disparam a mutation UMA vez", async () => {
    let resolveMutation: (v: unknown) => void = () => {};
    vi.mocked(mocks.revisarMutateAsync).mockImplementation(
      () => new Promise((res) => { resolveMutation = res; }),
    );

    const { result } = mount();

    // Dispara duas chamadas em paralelo sem aguardar
    await act(async () => {
      const p1 = result.current.handleAcao("confirmada");
      const p2 = result.current.handleAcao("confirmada");
      // segunda chamada deve retornar imediatamente sem invocar a mutation
      await Promise.resolve();
      resolveMutation({ id: "anom-1" });
      await Promise.all([p1, p2]);
    });

    expect(mocks.revisarMutateAsync).toHaveBeenCalledTimes(1);
    expect(mocks.toasts.success).toHaveBeenCalledTimes(1);
  });

  it("#2 [retry] erro transitório 'Failed to fetch' é retentado e sucede na 2ª tentativa", async () => {
    vi.mocked(mocks.revisarMutateAsync)
      .mockRejectedValueOnce(new Error("Failed to fetch"))
      .mockResolvedValueOnce({ id: "anom-1" });

    const { result } = mount();
    await act(async () => { await result.current.handleAcao("confirmada"); });

    expect(mocks.revisarMutateAsync).toHaveBeenCalledTimes(2);
    expect(mocks.toasts.success).toHaveBeenCalledTimes(1);
    expect(mocks.toasts.error).not.toHaveBeenCalled();
  });

  it("#3 [retry esgotado] 3 falhas transitórias → toast.error + fila e stats intactos", async () => {
    vi.mocked(mocks.revisarMutateAsync).mockRejectedValue(new Error("network timeout"));

    const { result } = mount();
    const idxAntes = result.current.index;

    await act(async () => { await result.current.handleAcao("confirmada"); });

    expect(mocks.revisarMutateAsync).toHaveBeenCalledTimes(3);
    expect(mocks.toasts.error).toHaveBeenCalledWith(
      "Falha ao registrar revisão",
      expect.objectContaining({ action: expect.any(Object) }),
    );
    // Invariantes: não avança, não conta estatística, item permanece
    expect(result.current.index).toBe(idxAntes);
    expect(result.current.stats.confirmadas).toBe(0);
    expect(result.current.stats.rejeitadas).toBe(0);
    expect(result.current.atual?.id).toBe("anom-1");
  });

  it("#4 [não-retry] erro de validação NÃO é retentado e propaga como falha definitiva", async () => {
    vi.mocked(mocks.revisarMutateAsync).mockRejectedValue(
      new Error("Comentário deve ter ao menos 10 caracteres"),
    );

    const { result } = mount();
    await act(async () => { await result.current.handleAcao("confirmada"); });

    expect(mocks.revisarMutateAsync).toHaveBeenCalledTimes(1); // sem retry
    expect(mocks.toasts.error).toHaveBeenCalledTimes(1);
    expect(result.current.stats.confirmadas).toBe(0);
  });

  it("#5 [conflito] AnomaliaJaRevisadaError NÃO retenta, incrementa stats.puladas e avança", async () => {
    vi.mocked(mocks.revisarMutateAsync).mockRejectedValue(new AnomaliaJaRevisadaError());
    // recarregarPosicao busca a próxima como "nova"
    vi.mocked(mocks.supabaseMaybeSingle).mockResolvedValue({
      data: makeAnomalia("anom-2"),
      error: null,
    });

    const { result } = mount();
    await act(async () => { await result.current.handleAcao("confirmada"); });

    expect(mocks.revisarMutateAsync).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.stats.puladas).toBe(1));
    expect(result.current.stats.confirmadas).toBe(0);
  });

  it("#6 [bitrix idempotente] retry+sucesso dispara sincronizar UMA vez para o mesmo id", async () => {
    vi.mocked(mocks.revisarMutateAsync)
      .mockRejectedValueOnce(new Error("Failed to fetch"))
      .mockResolvedValueOnce({ id: "anom-1" });

    const { result } = mount();
    await act(async () => { await result.current.handleAcao("confirmada"); });

    expect(mocks.sincronizarMutate).toHaveBeenCalledTimes(1);
    expect(mocks.sincronizarMutate).toHaveBeenCalledWith({
      anomaliaId: "anom-1", evento: "confirmada",
    });
  });

  it("#7 [guard comentário curto] não invoca mutation nem trava inFlight", async () => {
    const { result } = renderHook(
      () => useReviewQueue({ open: true, severidadeFilter: "todas" }),
      { wrapper },
    );
    act(() => { result.current.setComentario("curto"); });

    await act(async () => { await result.current.handleAcao("confirmada"); });
    expect(mocks.revisarMutateAsync).not.toHaveBeenCalled();

    // Após rejeição por validação, próximo submit com comentário válido deve funcionar
    vi.mocked(mocks.revisarMutateAsync).mockResolvedValue({ id: "anom-1" });
    vi.mocked(mocks.supabaseMaybeSingle).mockResolvedValue({
      data: makeAnomalia("anom-2"), error: null,
    });
    act(() => { result.current.setComentario(COMENTARIO_VALIDO); });
    await act(async () => { await result.current.handleAcao("confirmada"); });
    expect(mocks.revisarMutateAsync).toHaveBeenCalledTimes(1);
  });
});
