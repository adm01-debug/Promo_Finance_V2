import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useReguaCobranca } from '../useReguaCobranca';

describe('useReguaCobranca', () => {
  it('deve listar réguas de cobrança', async () => {
    const { result } = renderHook(() => useReguaCobranca());
    expect(result.current.reguas).toBeDefined();
  });

  it('deve criar nova régua', async () => {
    const { result } = renderHook(() => useReguaCobranca());
    await act(async () => {
      await result.current.criarRegua({
        nome: 'Padrão',
        etapas: [
          { dias: 3, tipo: 'email' },
          { dias: 7, tipo: 'whatsapp' },
          { dias: 15, tipo: 'sms' }
        ]
      });
    });
    expect(result.current.error).toBeNull();
  });
});
