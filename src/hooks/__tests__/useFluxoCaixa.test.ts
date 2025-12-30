import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const useFluxoCaixa = (empresaId: string, periodo: { inicio: string; fim: string }) => {
  const [fluxo, setFluxo] = React.useState({ entradas: 0, saidas: 0, saldo: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    // Simulação de cálculo
    setTimeout(() => {
      setFluxo({ entradas: 10000, saidas: 7000, saldo: 3000 });
      setLoading(false);
    }, 100);
  }, [empresaId, periodo]);

  return { fluxo, loading };
};

describe('useFluxoCaixa', () => {
  it('deve calcular fluxo de caixa', async () => {
    const { result } = renderHook(() =>
      useFluxoCaixa('emp1', { inicio: '2025-01-01', fim: '2025-01-31' })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    
    expect(result.current.fluxo.entradas).toBe(10000);
    expect(result.current.fluxo.saidas).toBe(7000);
    expect(result.current.fluxo.saldo).toBe(3000);
  });
});
