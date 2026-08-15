/**
 * Testes — useKeyboardShortcuts
 * Cobre o registro ÚNICO do listener de keydown (deps estáveis via ref de
 * navigate), remoção no unmount e disparo de atalhos (navegação, busca, refresh).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

function chamadasKeydown(spy: ReturnType<typeof vi.spyOn>) {
  return spy.mock.calls.filter(([tipo]) => tipo === 'keydown');
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registra o listener de keydown UMA única vez mesmo com re-renders', () => {
    const spyAdd = vi.spyOn(window, 'addEventListener');

    const { rerender } = renderHook(() => useKeyboardShortcuts());
    rerender();
    rerender();

    expect(chamadasKeydown(spyAdd)).toHaveLength(1);
    spyAdd.mockRestore();
  });

  it('remove o listener de keydown no unmount', () => {
    const spyRemove = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useKeyboardShortcuts());
    unmount();

    expect(chamadasKeydown(spyRemove)).toHaveLength(1);
    spyRemove.mockRestore();
  });

  it('Alt+D navega para o dashboard', () => {
    renderHook(() => useKeyboardShortcuts());

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', altKey: true, bubbles: true }));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('não navega quando o foco está num input (exceto Ctrl+K)', () => {
    renderHook(() => useKeyboardShortcuts());
    const input = document.createElement('input');
    document.body.appendChild(input);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', altKey: true, bubbles: true }));

    expect(mockNavigate).not.toHaveBeenCalled();
    input.remove();
  });

  it('Ctrl+K foca a busca mesmo com foco no input', () => {
    renderHook(() => useKeyboardShortcuts());
    const input = document.createElement('input');
    input.placeholder = 'Buscar...';
    document.body.appendChild(input);
    const focusSpy = vi.spyOn(input, 'focus');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));

    expect(focusSpy).toHaveBeenCalledTimes(1);
    input.remove();
  });

  it('Ctrl+Shift+R dispara toast de atualização de dados', () => {
    renderHook(() => useKeyboardShortcuts());

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'r', ctrlKey: true, shiftKey: true, bubbles: true }),
    );

    expect(toast.info).toHaveBeenCalledWith('Atualizando dados...');
  });

  it('Shift+? mostra ajuda de atalhos', () => {
    renderHook(() => useKeyboardShortcuts());

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', shiftKey: true, bubbles: true }));

    expect(toast.info).toHaveBeenCalledWith('Atalhos de Teclado', expect.anything());
  });
});
