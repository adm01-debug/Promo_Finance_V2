import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, render, screen } from '@testing-library/react';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { DashboardConfigDialog } from '@/components/dashboard/DashboardConfigDialog';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

const KEY = 'dashboard-widgets-config-user-123';
const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.mocked(window.localStorage.getItem).mockImplementation((k: string) => store.get(k) ?? null);
  vi.mocked(window.localStorage.setItem).mockImplementation((k: string, v: string) => {
    store.set(k, String(v));
  });
});

describe('useDashboardConfig', () => {
  it('ocultar/exibir e redimensionar persistem e sobrevivem ao recarregar', () => {
    const { result, unmount } = renderHook(() => useDashboardConfig());
    act(() => result.current.toggleWidget('fluxo-caixa'));
    act(() => result.current.resizeWidget('composicao', 'lg'));
    expect(result.current.widgets.find((w) => w.id === 'fluxo-caixa')?.visible).toBe(false);
    unmount();

    const { result: recarregado } = renderHook(() => useDashboardConfig());
    expect(recarregado.current.widgets.find((w) => w.id === 'fluxo-caixa')?.visible).toBe(false);
    expect(recarregado.current.widgets.find((w) => w.id === 'composicao')?.size).toBe('lg');
  });

  it('valores inválidos salvos voltam ao padrão', () => {
    store.set(
      KEY,
      JSON.stringify([{ id: 'composicao', size: 'xl', visible: 'sim', title: 'Antigo' }])
    );
    const { result } = renderHook(() => useDashboardConfig());
    const composicao = result.current.widgets.find((w) => w.id === 'composicao');
    expect(composicao?.size).toBe('sm');
    expect(composicao?.visible).toBe(true);
    expect(composicao?.title).toBe('Saldo por Banco');
  });
});

describe('DashboardConfigDialog', () => {
  it('mostra o título real de cada widget, sem rótulos duplicados', () => {
    const { result } = renderHook(() => useDashboardConfig());
    render(
      <DashboardConfigDialog
        open
        onOpenChange={() => {}}
        widgets={result.current.widgets}
        onToggleWidget={() => {}}
        onResizeWidget={() => {}}
        onResetToDefault={() => {}}
      />
    );
    for (const w of result.current.widgets) {
      expect(screen.getAllByText(w.title)).toHaveLength(1);
    }
  });
});
