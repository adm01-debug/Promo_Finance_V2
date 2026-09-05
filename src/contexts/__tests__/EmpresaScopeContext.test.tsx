/**
 * Testes — EmpresaScopeContext
 *
 * Bug real encontrado em auditoria: o EmpresaScopeBar (UI nova de escopo
 * multi-empresa) chama focusEmpresa()/toggleEmpresa()/setMode() do
 * EmpresaScopeContext, mas o AuthProvider legado (useAuth().currentEmpresaId
 * — consumido por ~28 hooks/páginas) e os 3 listeners de
 * 'sync-financial-filters' (BankAccountSwitcher, useContasPagarLogic,
 * useContasReceberLogic) só reagem aos eventos 'current-empresa-changed'/
 * 'sync-financial-filters', historicamente disparados apenas pelo
 * setCurrentEmpresaId() legado (useUserEmpresas.ts) — que a UI nova não usa.
 * Sem disparar os mesmos eventos, currentEmpresaId ficava "congelado" em
 * qualquer sessão usando a UI nova, fazendo os totais financeiros somarem
 * a empresa errada (ou todas) silenciosamente.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmpresaScopeProvider } from '../EmpresaScopeContext';
import { useEmpresaScope } from '../useEmpresaScope';

const mockUseUserEmpresas = vi.fn();

vi.mock('@/hooks/useUserEmpresas', () => ({
  useUserEmpresas: () => mockUseUserEmpresas(),
}));

const VINCULOS = [
  { empresa_id: 'e1', is_default: true },
  { empresa_id: 'e2', is_default: false },
];

function TestConsumer() {
  const { focusEmpresa, toggleEmpresa, currentEmpresaId, mode } = useEmpresaScope();
  return (
    <div>
      <span data-testid="current">{currentEmpresaId ?? 'none'}</span>
      <span data-testid="mode">{mode}</span>
      <button onClick={() => focusEmpresa('e2')}>focar e2</button>
      <button onClick={() => toggleEmpresa('e1')}>toggle e1</button>
    </div>
  );
}

describe('EmpresaScopeContext — sincronização com sistema legado', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockUseUserEmpresas.mockReturnValue({ data: VINCULOS, isLoading: false });
  });

  it('focusEmpresa dispara current-empresa-changed e sync-financial-filters com o id correto', async () => {
    const currentEmpresaChanged = vi.fn();
    const syncFinancialFilters = vi.fn();
    window.addEventListener('current-empresa-changed', currentEmpresaChanged);
    window.addEventListener('sync-financial-filters', syncFinancialFilters);

    render(
      <EmpresaScopeProvider>
        <TestConsumer />
      </EmpresaScopeProvider>
    );

    // Evento inicial do mount (sincroniza o estado carregado do localStorage/default).
    await waitFor(() => expect(currentEmpresaChanged).toHaveBeenCalled());
    currentEmpresaChanged.mockClear();
    syncFinancialFilters.mockClear();

    fireEvent.click(screen.getByText('focar e2'));

    await waitFor(() => {
      expect(currentEmpresaChanged).toHaveBeenCalledWith(expect.objectContaining({ detail: 'e2' }));
      expect(syncFinancialFilters).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { empresaId: 'e2' } })
      );
    });
    expect(screen.getByTestId('current').textContent).toBe('e2');

    window.removeEventListener('current-empresa-changed', currentEmpresaChanged);
    window.removeEventListener('sync-financial-filters', syncFinancialFilters);
  });

  it('toggleEmpresa (modo consolidado) também dispara os eventos de sincronização', async () => {
    const currentEmpresaChanged = vi.fn();
    window.addEventListener('current-empresa-changed', currentEmpresaChanged);

    render(
      <EmpresaScopeProvider>
        <TestConsumer />
      </EmpresaScopeProvider>
    );
    await waitFor(() => expect(currentEmpresaChanged).toHaveBeenCalled());
    currentEmpresaChanged.mockClear();

    // Remove e1 (default/primeira) do escopo consolidado — currentEmpresaId
    // muda para e2 (próxima selecionada), então o evento deve disparar de novo.
    fireEvent.click(screen.getByText('toggle e1'));

    await waitFor(() => {
      expect(currentEmpresaChanged).toHaveBeenCalledWith(expect.objectContaining({ detail: 'e2' }));
    });

    window.removeEventListener('current-empresa-changed', currentEmpresaChanged);
  });
});
