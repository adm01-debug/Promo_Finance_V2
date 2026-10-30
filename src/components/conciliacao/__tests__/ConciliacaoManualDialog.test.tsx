import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ConciliacaoManualDialog } from '../ConciliacaoManualDialog';
import type { LancamentoSistema } from '@/lib/transaction-matcher';

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  showError: vi.fn(),
  haptic: vi.fn(),
  aprenderRegra: vi.fn(),
}));

vi.mock('@/hooks/useConciliacao', () => ({
  useConciliacao: () => ({
    confirmarConciliacao: { mutateAsync: mocks.mutateAsync, isPending: false },
  }),
}));

vi.mock('@/components/wrappers/CelebrationActions', () => ({
  useCelebrations: () => ({ error: mocks.showError }),
}));

vi.mock('@/lib/haptic-feedback', () => ({ haptic: mocks.haptic }));

vi.mock('@/hooks/useRegrasConciliacao', () => ({
  aprenderRegra: mocks.aprenderRegra,
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn() },
}));

const transacao = {
  id: 'tx-1',
  data: new Date('2025-01-15'),
  descricao: 'Pagamento cliente',
  valor: 100,
  tipo: 'credito' as const,
};

const lancamento: LancamentoSistema = {
  id: 'lanc-1',
  tipo: 'receber',
  descricao: 'Fatura janeiro',
  valor: 100,
  dataVencimento: new Date('2025-01-20'),
  entidade: 'Empresa XPTO',
  status: 'aberto',
};

function renderDialog(onSuccess = vi.fn()) {
  return render(
    <ConciliacaoManualDialog
      open={true}
      onOpenChange={vi.fn()}
      transacao={transacao}
      lancamentos={[lancamento]}
      onSuccess={onSuccess}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.aprenderRegra.mockResolvedValue(undefined);
});

describe('ConciliacaoManualDialog — fluxo de confirmação', () => {
  it('chama mutateAsync antes de invocar onSuccess no caminho feliz', async () => {
    mocks.mutateAsync.mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    renderDialog(onSuccess);

    await userEvent.click(screen.getByRole('radio'));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar Conciliação' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('tx-1', 'lanc-1', 'receber'));

    expect(mocks.mutateAsync).toHaveBeenCalledWith({
      transacaoId: 'tx-1',
      contaPagarId: undefined,
      contaReceberId: 'lanc-1',
      ajusteCentavos: 0,
    });
    // Garante ordenação: mutateAsync sempre antes de onSuccess
    expect(mocks.mutateAsync.mock.invocationCallOrder[0]).toBeLessThan(
      onSuccess.mock.invocationCallOrder[0]
    );
  });

  it('não invoca onSuccess quando mutateAsync rejeita', async () => {
    mocks.mutateAsync.mockRejectedValue(new Error('DB error'));
    const onSuccess = vi.fn();
    renderDialog(onSuccess);

    await userEvent.click(screen.getByRole('radio'));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar Conciliação' }));

    await waitFor(() =>
      expect(mocks.showError).toHaveBeenCalledWith('Erro ao conciliar transação')
    );

    expect(mocks.mutateAsync).toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
