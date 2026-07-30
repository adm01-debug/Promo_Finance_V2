import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { RetentionPoliciesPanel, type RetencaoPoliticaStatus } from "../RetentionPoliciesPanel";

const rpcMock = vi.fn();

vi.mock("@/lib/supabase-dynamic", () => ({
  supabaseDyn: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

function linha(overrides: Partial<RetencaoPoliticaStatus> = {}): RetencaoPoliticaStatus {
  return {
    tabela: "public.auth_logs",
    coluna: "created_at",
    dias: 90,
    filtro: null,
    motivo: null,
    ativo: true,
    isenta: false,
    tem_politica: true,
    total_linhas: 100,
    linhas_vencidas: 0,
    registro_mais_antigo: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    ...overrides,
  };
}

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RetentionPoliciesPanel />
    </QueryClientProvider>,
  );
}

describe("RetentionPoliciesPanel", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("sinaliza cobertura total quando todas as tabelas têm política", async () => {
    rpcMock.mockResolvedValue({ data: [linha()], error: null });
    renderPanel();

    await vi.waitFor(() => {
      expect(screen.getByText("cobertura total")).toBeInTheDocument();
    });
    expect(screen.getByText("auth_logs")).toBeInTheDocument();
    expect(screen.getByText("90 dias")).toBeInTheDocument();
  });

  it("destaca tabelas sem política de retenção", async () => {
    rpcMock.mockResolvedValue({
      data: [
        linha(),
        linha({
          tabela: "public.edge_function_logs",
          tem_politica: false,
          ativo: false,
          coluna: null,
          dias: null,
        }),
      ],
      error: null,
    });
    renderPanel();

    await vi.waitFor(() => {
      expect(screen.getByText("1 sem política")).toBeInTheDocument();
    });
    expect(screen.getByText("não definido")).toBeInTheDocument();
  });

  it("filtra apenas as tabelas com registros vencidos", async () => {
    rpcMock.mockResolvedValue({
      data: [
        linha(),
        linha({ tabela: "public.tracking_events", linhas_vencidas: 42, total_linhas: 900 }),
      ],
      error: null,
    });
    renderPanel();

    await vi.waitFor(() => {
      expect(screen.getByText("tracking_events")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Com pendência" }));

    expect(screen.getByText("tracking_events")).toBeInTheDocument();
    expect(screen.queryByText("auth_logs")).not.toBeInTheDocument();
    expect(screen.getByText("42 vencidos")).toBeInTheDocument();
  });

  it("exibe erro amigável quando a RPC falha", async () => {
    rpcMock.mockResolvedValue({ data: null, error: new Error("acesso negado") });
    renderPanel();

    await vi.waitFor(() => {
      expect(
        screen.getByText("Não foi possível carregar as políticas de retenção."),
      ).toBeInTheDocument();
    });
  });
});
