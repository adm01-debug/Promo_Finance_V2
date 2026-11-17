/**
 * Achado: a tela de Faturamento Mensal salvava receita e NÃO salvava imposto.
 * `faturamento_mensal.valor_impostos` tem default 0, então cada mês cadastrado
 * pela tela entrava com imposto zero — e `vw_dre_mensal` calcula
 * `carga_tributaria_pct = valor_impostos / receita_bruta * 100`, logo a carga
 * saía 0% com receita positiva. O benchmark setorial
 * (supabase/functions/comparar-benchmark-setorial) lê a mesma coluna e ficava
 * sem carga para comparar.
 *
 * Este teste fixa o contrato da tela: o campo de imposto existe e o valor
 * digitado chega no payload do upsert.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const upsertMutate = vi.fn();

vi.mock('@/hooks/useHistoricoFinanceiro', () => ({
  useHistoricoFinanceiro: () => ({
    faturamento: [],
    folha: [],
    upsertFaturamento: { mutate: upsertMutate, mutateAsync: vi.fn(), isPending: false },
    upsertFolha: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
    deleteFaturamento: { mutate: vi.fn() },
    deleteFolha: { mutate: vi.fn() },
  }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { FaturamentoTab } from '../FaturamentoTab';

const EMPRESA = '610db558-22b8-45e9-821f-f203cca01c3a';

function renderTab() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <FaturamentoTab empresaId={EMPRESA} />
    </QueryClientProvider>
  );
}

describe('FaturamentoTab — imposto do mês', () => {
  it('tem campo de imposto no formulário e na tabela', () => {
    renderTab();
    expect(screen.getByLabelText('Impostos do mês')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Impostos' })).toBeInTheDocument();
  });

  it('manda valor_impostos no payload do upsert', async () => {
    upsertMutate.mockClear();
    const user = userEvent.setup();
    renderTab();

    const receita = screen.getByLabelText('Receita bruta do mês');
    await user.clear(receita);
    await user.type(receita, '100000');

    const imposto = screen.getByLabelText('Impostos do mês');
    await user.clear(imposto);
    await user.type(imposto, '12500');

    await user.click(screen.getByRole('button', { name: /salvar/i }));

    expect(upsertMutate).toHaveBeenCalledTimes(1);
    const payload = upsertMutate.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.empresa_id).toBe(EMPRESA);
    expect(payload.receita_bruta).toBe(100000);
    // o campo que o benchmark e a vw_dre_mensal leem
    expect(payload.valor_impostos).toBe(12500);
  });

  it('não bloqueia o salvamento quando o imposto fica zero', async () => {
    upsertMutate.mockClear();
    const user = userEvent.setup();
    renderTab();

    const receita = screen.getByLabelText('Receita bruta do mês');
    await user.clear(receita);
    await user.type(receita, '50000');
    await user.click(screen.getByRole('button', { name: /salvar/i }));

    expect(upsertMutate).toHaveBeenCalledTimes(1);
    const payload = upsertMutate.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.valor_impostos).toBe(0);
  });
});
