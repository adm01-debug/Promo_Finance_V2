import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

const useAprovacoes = () => {
  const [pendentes, setPendentes] = React.useState([]);
  
  const aprovar = async (id: string) => {
    setPendentes(prev => prev.filter(p => p.id !== id));
  };

  const rejeitar = async (id: string, motivo: string) => {
    setPendentes(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'rejeitado', motivo } : p
    ));
  };

  return { pendentes, aprovar, rejeitar };
};

describe('useAprovacoes', () => {
  it('deve aprovar item', async () => {
    const { result } = renderHook(() => useAprovacoes());
    await act(async () => await result.current.aprovar('1'));
    expect(result.current.pendentes.find(p => p.id === '1')).toBeUndefined();
  });
});
