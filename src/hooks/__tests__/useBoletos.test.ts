import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

const useBoletos = () => {
  const [boletos, setBoletos] = React.useState([]);
  
  const gerarBoleto = async (dados: any) => {
    await new Promise(r => setTimeout(r, 50));
    const boleto = { id: '1', ...dados, linhaDigitavel: '12345' };
    setBoletos(prev => [...prev, boleto]);
    return boleto;
  };

  return { boletos, gerarBoleto };
};

describe('useBoletos', () => {
  it('deve gerar boleto', async () => {
    const { result } = renderHook(() => useBoletos());
    
    let boleto;
    await act(async () => {
      boleto = await result.current.gerarBoleto({ valor: 1000 });
    });

    expect(boleto.linhaDigitavel).toBeDefined();
    expect(result.current.boletos).toHaveLength(1);
  });
});
