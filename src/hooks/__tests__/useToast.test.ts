import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

const useToast = () => {
  const [toasts, setToasts] = React.useState([]);
  
  const toast = (message: string, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  return { toasts, toast };
};

describe('useToast', () => {
  it('deve adicionar toast', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => result.current.toast('Teste', 'success'));
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Teste');
  });
});
