import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useInadimplenciaSegmentada } from '../useInadimplenciaSegmentada';

describe('useInadimplenciaSegmentada', () => {
  it('deve segmentar inadimplentes', async () => {
    const { result } = renderHook(() => useInadimplenciaSegmentada());
    const segmentos = await act(async () => {
      return await result.current.getSegmentos();
    });
    expect(segmentos).toHaveProperty('baixo_risco');
    expect(segmentos).toHaveProperty('medio_risco');
    expect(segmentos).toHaveProperty('alto_risco');
  });

  it('deve calcular score de inadimplência', async () => {
    const { result } = renderHook(() => useInadimplenciaSegmentada());
    const score = await act(async () => {
      return await result.current.calcularScore('cliente-1');
    });
    expect(typeof score).toBe('number');
  });
});
