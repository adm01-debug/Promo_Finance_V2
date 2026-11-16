/**
 * Regressão: o cadastro de fornecedor precisa enviar `user_id`.
 *
 * A única policy de INSERT de public.fornecedores é `fornecedores_owner_insert`,
 * com `WITH CHECK ((SELECT auth.uid()) = user_id)`, e não há trigger nem DEFAULT
 * que preencha a coluna. Sem o campo no payload, todo cadastro era rejeitado
 * pela RLS e caía no toast genérico — nenhum fornecedor foi criado entre
 * 2026-07-28 e a correção.
 *
 * `user_id` é opcional no tipo gerado em src/integrations/supabase/types.ts,
 * então nem type-check nem lint pegam a omissão: só este teste pega.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFrom, mockInsert } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom },
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-abc-123' }, currentEmpresaId: 'empresa-1' }),
}));
vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));
vi.mock('@/hooks/useConfetti', () => ({
  useConfetti: () => ({ customCelebration: vi.fn() }),
}));
vi.mock('@/lib/sound-feedback', () => ({
  sounds: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { FornecedorForm } from '../FornecedorForm';

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <FornecedorForm open onOpenChange={vi.fn()} />
    </QueryClientProvider>
  );
}

describe('FornecedorForm — cadastro', () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockFrom.mockReset();
    mockInsert.mockResolvedValue({ error: null });
    mockFrom.mockImplementation(() => ({ insert: mockInsert }));
  });

  it('envia empresa_id no insert, sem o qual o fornecedor nasce sem empresa', async () => {
    // Resgatado de claude/resolve-conflicting-prs-rborrh. A coluna não existia
    // em produção (só na cadeia de migrations), o que fazia
    // nfe_create_conta_pagar_from_nfe falhar com 42703 para emitente novo.
    renderForm();

    fireEvent.change(screen.getByPlaceholderText('Razão social'), {
      target: { value: 'Fornecedor Com Empresa Ltda' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar Fornecedor/i }));

    await waitFor(() => expect(mockInsert).toHaveBeenCalledTimes(1));

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        empresa_id: 'empresa-1',
        user_id: 'user-abc-123',
      })
    );
  });

  it('envia user_id no insert, sem o qual a policy fornecedores_owner_insert rejeita', async () => {
    renderForm();

    fireEvent.change(screen.getByPlaceholderText('Razão social'), {
      target: { value: 'Fornecedor Teste Ltda' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar Fornecedor/i }));

    await waitFor(() => expect(mockInsert).toHaveBeenCalledTimes(1));

    expect(mockFrom).toHaveBeenCalledWith('fornecedores');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        razao_social: 'Fornecedor Teste Ltda',
        user_id: 'user-abc-123',
      })
    );
  });
});
