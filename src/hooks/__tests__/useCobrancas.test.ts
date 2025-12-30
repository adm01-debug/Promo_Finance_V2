import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

const useCobrancas = () => {
  const [cobrancas, setCobrancas] = React.useState([]);
  
  const enviarCobranca = async (id: string) => {
    await new Promise(r => setTimeout(r, 50));
    setCobrancas(prev => [...prev, { id, status: 'enviada', data: new Date() }]);
  };

  return { cobrancas, enviarCobranca };
};

describe('useCobrancas', () => {
  it('deve enviar cobrança', async () => {
    const { result } = renderHook(() => useCobrancas());
    await act(async () => await result.current.enviarCobranca('cob1'));
    expect(result.current.cobrancas[0].status).toBe('enviada');
  });
});
