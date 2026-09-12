import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const empresaEq = vi.fn().mockResolvedValue({ error: null });
  const idEq = vi.fn(() => ({ eq: empresaEq }));
  const del = vi.fn(() => ({ eq: idEq }));
  return { empresaEq, idEq, del };
});

vi.mock('@tanstack/react-query', () => ({
  useMutation: <T>(options: T) => options,
  useQuery: vi.fn(),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: vi.fn() } } }));
vi.mock('@/lib/supabase-dynamic', () => ({
  supabaseDyn: { from: vi.fn(() => ({ delete: mocks.del })) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { useRevokeApiKey } from './useApiKeys';

describe('useRevokeApiKey', () => {
  it('restringe a revogação à empresa recebida, além do identificador', async () => {
    const mutation = useRevokeApiKey() as unknown as {
      mutationFn: (args: { id: string; empresa_id: string }) => Promise<void>;
    };

    await mutation.mutationFn({ id: 'key-1', empresa_id: 'empresa-1' });

    expect(mocks.idEq).toHaveBeenCalledWith('id', 'key-1');
    expect(mocks.empresaEq).toHaveBeenCalledWith('empresa_id', 'empresa-1');
  });
});
