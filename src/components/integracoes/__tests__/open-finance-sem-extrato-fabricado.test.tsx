/**
 * Achado: `open-finance/index.ts` devolvia saldo e extrato inventados e, em
 * `import_transactions`, GRAVAVA cinco lançamentos fabricados em
 * `transacoes_bancarias` — com a coluna `saldo` recalculada sobre o saldo
 * verdadeiro da conta — respondendo `success: true`. Na Conciliação Bancária
 * isso virava crédito que nunca entrou, pronto para baixar título real.
 *
 * A função passou a recusar essas ações (503). Este teste fixa o lado da tela:
 * o painel não convida a conectar banco nem promete sincronização automática
 * enquanto a integração não estiver homologada.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/hooks/useOpenFinance', () => ({
  useOpenFinance: () => ({
    institutions: [],
    consents: [],
    loadingInstitutions: false,
    loadingConsents: false,
    createConsent: vi.fn(),
    creatingConsent: false,
    revokeConsent: vi.fn(),
    revokingConsent: false,
    importTransactions: vi.fn(),
    importingTransactions: false,
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
    }),
  },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { OpenFinancePanel } from '../OpenFinancePanel';

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <OpenFinancePanel />
    </QueryClientProvider>
  );
}

describe('painel do Open Finance não promete integração que não existe', () => {
  it('o botão Conectar Banco fica desabilitado com o motivo à mostra', () => {
    renderPanel();
    const botao = screen.getByRole('button', { name: /Conectar Banco/i });
    expect(botao).toBeDisabled();
    expect(botao).toHaveAttribute('title', expect.stringContaining('não homologada'));
  });

  it('o texto não anuncia sincronização automática de saldos', () => {
    renderPanel();
    expect(screen.queryByText(/sincronização automática de saldos e transações/i)).toBeNull();
    expect(screen.getByText(/ainda não foi\s+homologada/i)).toBeInTheDocument();
  });

  it('avisa que nada é importado para a conciliação', () => {
    renderPanel();
    expect(
      screen.getByText(/nenhum\s+lançamento é importado para a conciliação/i)
    ).toBeInTheDocument();
  });
});
