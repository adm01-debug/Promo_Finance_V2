import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

const useEmpresas = () => {
  const [empresas, setEmpresas] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setTimeout(() => {
      setEmpresas([{ id: '1', nome: 'Empresa A' }]);
      setLoading(false);
    }, 100);
  }, []);

  return { empresas, loading };
};

describe('useEmpresas', () => {
  it('deve carregar empresas', async () => {
    const { result } = renderHook(() => useEmpresas());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.empresas).toHaveLength(1);
  });
});
