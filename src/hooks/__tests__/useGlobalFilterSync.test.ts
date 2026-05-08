import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGlobalFilterSync } from '../useGlobalFilterSync';
import { toast } from 'sonner';

// Mock do Sonner
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
  },
}));

// Mock do react-router-dom
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/' }),
}));

describe('useGlobalFilterSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve registrar o listener de evento ao montar', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    renderHook(() => useGlobalFilterSync());
    expect(addEventListenerSpy).toHaveBeenCalledWith('current-empresa-changed', expect.any(Function));
  });

  it('deve disparar toast e log quando o evento current-empresa-changed ocorre', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    renderHook(() => useGlobalFilterSync());

    const event = new CustomEvent('current-empresa-changed', { detail: 'empresa-123' });
    window.dispatchEvent(event);

    expect(toast.info).toHaveBeenCalledWith('Filtros sincronizados', expect.objectContaining({
      description: expect.stringContaining('empresa'),
    }));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('empresa-123'));
    
    consoleSpy.mockRestore();
  });

  it('não deve disparar se o detalhe do evento estiver vazio', () => {
    renderHook(() => useGlobalFilterSync());

    const event = new CustomEvent('current-empresa-changed', { detail: null });
    window.dispatchEvent(event);

    expect(toast.info).not.toHaveBeenCalled();
  });

  it('deve remover o listener ao desmontar', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useGlobalFilterSync());
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('current-empresa-changed', expect.any(Function));
  });
});
