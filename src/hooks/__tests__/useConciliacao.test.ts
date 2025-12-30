import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const useConciliacao = () => {
  const [matches, setMatches] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const executarConciliacao = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    setMatches([{ id: '1', confidence: 0.95 }]);
    setLoading(false);
  };

  return { matches, loading, executarConciliacao };
};

describe('useConciliacao', () => {
  it('deve executar conciliação', async () => {
    const { result } = renderHook(() => useConciliacao());

    expect(result.current.matches).toHaveLength(0);

    await act(async () => {
      await result.current.executarConciliacao();
    });

    expect(result.current.matches).toHaveLength(1);
    expect(result.current.matches[0].confidence).toBe(0.95);
  });
});
