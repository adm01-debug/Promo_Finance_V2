import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useQueuedMessage } from '../useQueuedMessage';

describe('useQueuedMessage', () => {
  it('entrega todas as mensagens na ordem quando a operação atual termina', async () => {
    const enviarMensagem = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ isLoading }) => useQueuedMessage(isLoading, enviarMensagem),
      { initialProps: { isLoading: true } }
    );

    act(() => {
      result.current('Análise do documento A');
      result.current('Análise do documento B');
    });
    expect(enviarMensagem).not.toHaveBeenCalled();

    rerender({ isLoading: false });
    await waitFor(() => expect(enviarMensagem).toHaveBeenCalledTimes(2));
    expect(enviarMensagem).toHaveBeenNthCalledWith(1, 'Análise do documento A');
    expect(enviarMensagem).toHaveBeenNthCalledWith(2, 'Análise do documento B');
  });
});
