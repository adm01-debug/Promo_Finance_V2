import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

const useAlertas = () => {
  const [alertas, setAlertas] = React.useState([]);
  const addAlerta = (msg: string) => setAlertas(prev => [...prev, { id: Date.now(), msg }]);
  const removeAlerta = (id: number) => setAlertas(prev => prev.filter(a => a.id !== id));
  return { alertas, addAlerta, removeAlerta };
};

describe('useAlertas', () => {
  it('deve adicionar alerta', () => {
    const { result } = renderHook(() => useAlertas());
    act(() => result.current.addAlerta('Teste'));
    expect(result.current.alertas).toHaveLength(1);
  });
});
