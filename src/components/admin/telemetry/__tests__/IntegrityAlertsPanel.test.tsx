import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { IntegrityAlertsPanel } from "../IntegrityAlertsPanel";

const rpcMock = vi.fn();

vi.mock("@/lib/supabase-dynamic", () => ({
  supabaseDyn: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <IntegrityAlertsPanel />
    </QueryClientProvider>,
  );
}

describe("IntegrityAlertsPanel", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("consulta invariantes usando os parâmetros canônicos", async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    renderPanel();

    await vi.waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith("get_integrity_alerts", {
        p_limit: 25,
        p_incluir_resolvidos: false,
      });
    });

    await userEvent.selectOptions(screen.getByLabelText("Limite de invariantes"), "50");

    await vi.waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith("get_integrity_alerts", {
        p_limit: 50,
        p_incluir_resolvidos: false,
      });
    });

    await userEvent.click(screen.getByRole("button", { name: "Mostrar encerrados" }));

    await vi.waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith("get_integrity_alerts", {
        p_limit: 50,
        p_incluir_resolvidos: true,
      });
    });
  });

  it("resolve alerta com p_alert_id", async () => {
    rpcMock
      .mockResolvedValueOnce({
        data: [{
          id: "alerta-1",
          domain: "nfe_sefaz",
          invariant: "cursor_stuck",
          severity: "warning",
          affected_count: 1,
          reason: "Cursor parado",
          sample_ids: [],
          alert_hour: "2026-08-25T12:00:00.000Z",
          resolved_at: null,
          resolved_reason: null,
          created_at: "2026-08-25T12:00:00.000Z",
        }],
        error: null,
      })
      .mockResolvedValueOnce({ data: true, error: null });

    renderPanel();

    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: "Resolver" })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Resolver" }));

    await vi.waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith("resolve_integrity_alert", {
        p_alert_id: "alerta-1",
      });
    });
  });
});
