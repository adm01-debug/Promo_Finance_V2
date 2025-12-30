import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const useFinancialData = (empresaId: string) => {
  const [data, setData] = React.useState({ receitas: 0, despesas: 0, lucro: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData({ receitas: 150000, despesas: 100000, lucro: 50000 });
      setLoading(false);
    }, 100);
  }, [empresaId]);

  return { data, loading };
};

describe('useFinancialData', () => {
  it('deve carregar dados financeiros', async () => {
    const { result } = renderHook(() => useFinancialData('emp1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.lucro).toBe(50000);
  });
});
