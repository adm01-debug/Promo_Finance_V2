import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useKeyboardNavigation } from '../useKeyboardNavigation';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter initialEntries={['/contas-receber']}>{children}</MemoryRouter>;
}

describe('useKeyboardNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'history', {
      value: { length: 5 },
      writable: true,
    });
  });

  it('navigates back on Alt+ArrowLeft', () => {
    renderHook(() => useKeyboardNavigation(), { wrapper });
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', altKey: true, bubbles: true });
    window.dispatchEvent(event);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates forward on Alt+ArrowRight', () => {
    renderHook(() => useKeyboardNavigation(), { wrapper });
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true });
    window.dispatchEvent(event);
    expect(mockNavigate).toHaveBeenCalledWith(1);
  });

  it('navigates home on Alt+Home', () => {
    renderHook(() => useKeyboardNavigation(), { wrapper });
    const event = new KeyboardEvent('keydown', { key: 'Home', altKey: true, bubbles: true });
    window.dispatchEvent(event);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('does NOT navigate when typing in input', () => {
    renderHook(() => useKeyboardNavigation(), { wrapper });
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      altKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: input });
    input.dispatchEvent(event);
    
    // Should not have been called because target is input
    expect(mockNavigate).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('does NOT navigate back on home page', () => {
    function homeWrapper({ children }: { children: React.ReactNode }) {
      return <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>;
    }
    renderHook(() => useKeyboardNavigation(), { wrapper: homeWrapper });
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', altKey: true, bubbles: true });
    window.dispatchEvent(event);
    expect(mockNavigate).not.toHaveBeenCalledWith(-1);
  });

  it('does NOT trigger without Alt key', () => {
    renderHook(() => useKeyboardNavigation(), { wrapper });
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', altKey: false, bubbles: true });
    window.dispatchEvent(event);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
