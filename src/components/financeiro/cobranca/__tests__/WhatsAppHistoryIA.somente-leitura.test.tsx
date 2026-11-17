/**
 * Revisao da PR #404 (Codex P1): `useSendMessage` (useWhatsAppIA.ts:37-62) apenas
 * INSERE em `whatsapp_conversas` com `status: 'enviado'`. Nao existe chamada a
 * provedor de WhatsApp em nenhuma das 3 edge functions do assunto, nem secret de
 * provedor. Com o campo de envio liberado, o operador mandava uma cobranca que
 * nunca chegava ao cliente -- e a tela confirmava o envio.
 *
 * A aba "Previsao 30 dias" desta PR era o UNICO caminho ate este dialogo, entao
 * o default seguro (`permitirEnvio = false`) nao remove funcionalidade de
 * ninguem: ela nunca foi alcancavel.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom },
}));

import { WhatsAppHistoryIA } from '../WhatsAppHistoryIA';

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function builder() {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'insert', 'single']) b[m] = vi.fn(() => b);
  b.then = ((ok?: (v: unknown) => unknown) =>
    Promise.resolve({ data: [], error: null }).then(ok as never)) as never;
  return b;
}

describe('WhatsAppHistoryIA — envio sem provedor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation(() => builder());
  });

  it('por padrao nao oferece campo de envio, e explica por que', async () => {
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <WhatsAppHistoryIA
          clienteId="cli-1"
          clienteNome="Cliente Um"
          open
          onOpenChange={() => {}}
        />
      </Wrapper>
    );

    expect(await screen.findByText(/Histórico somente leitura/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Digite uma mensagem/i)).not.toBeInTheDocument();
  });

  it('com permitirEnvio o campo volta (para quando houver provedor)', async () => {
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <WhatsAppHistoryIA
          clienteId="cli-1"
          clienteNome="Cliente Um"
          open
          onOpenChange={() => {}}
          permitirEnvio
        />
      </Wrapper>
    );

    expect(await screen.findByPlaceholderText(/Digite uma mensagem/i)).toBeInTheDocument();
    expect(screen.queryByText(/Histórico somente leitura/i)).not.toBeInTheDocument();
  });
});
