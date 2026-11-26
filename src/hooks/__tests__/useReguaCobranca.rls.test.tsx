import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * PostgREST não devolve erro quando o RLS barra um UPDATE/INSERT/DELETE: a
 * requisição volta 200 com zero linhas. Sem olhar as linhas afetadas a tela
 * dizia "Template atualizado!" com o banco intacto (achado do review da
 * PR #571). Este teste fixa o comportamento por hook.
 */
const mocks = vi.hoisted(() => {
  const estado = { data: [] as Array<{ id: string }> | null, error: null as unknown };
  const builder: Record<string, unknown> = {};
  for (const metodo of ['update', 'insert', 'delete', 'eq', 'select']) {
    builder[metodo] = () => builder;
  }
  builder.select = () => Promise.resolve({ data: estado.data, error: estado.error });
  return { estado, builder, from: () => builder };
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));

import {
  useUpdateReguaCobranca,
  useUpdateTemplate,
  useCriarTemplate,
  useExcluirTemplate,
} from '@/hooks/useReguaCobranca';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const novoTemplate = {
  empresa_id: 'e1',
  etapa: 'preventiva',
  canal: 'email',
  tom: 'profissional',
  nome: 'preventiva - email',
  corpo: 'corpo',
};

describe('useReguaCobranca — escrita barrada por RLS', () => {
  beforeEach(() => {
    mocks.estado.data = [];
    mocks.estado.error = null;
  });

  it('useUpdateTemplate falha quando nenhuma linha é devolvida', async () => {
    const { result } = renderHook(() => useUpdateTemplate(), { wrapper });
    await expect(result.current.mutateAsync({ id: 't1', corpo: 'novo' })).rejects.toThrow(
      /Sem permissão para alterar o template/
    );
  });

  it('useUpdateTemplate conclui quando a linha volta', async () => {
    mocks.estado.data = [{ id: 't1' }];
    const { result } = renderHook(() => useUpdateTemplate(), { wrapper });
    await expect(result.current.mutateAsync({ id: 't1', corpo: 'novo' })).resolves.toBeUndefined();
  });

  it('useUpdateReguaCobranca falha quando nenhuma linha é devolvida', async () => {
    const { result } = renderHook(() => useUpdateReguaCobranca(), { wrapper });
    await expect(result.current.mutateAsync({ id: '1', ativo: false })).rejects.toThrow(
      /Sem permissão para alterar a etapa da régua/
    );
  });

  it('useCriarTemplate falha quando o insert não devolve linha', async () => {
    const { result } = renderHook(() => useCriarTemplate(), { wrapper });
    await expect(result.current.mutateAsync(novoTemplate)).rejects.toThrow(
      /Sem permissão para criar o template/
    );
  });

  it('useExcluirTemplate falha quando o delete não devolve linha', async () => {
    const { result } = renderHook(() => useExcluirTemplate(), { wrapper });
    await expect(result.current.mutateAsync({ id: 't1' })).rejects.toThrow(
      /Sem permissão para excluir o template/
    );
  });

  it('propaga o erro do banco quando existe', async () => {
    mocks.estado.error = new Error('permission denied for table templates_cobranca');
    const { result } = renderHook(() => useExcluirTemplate(), { wrapper });
    await expect(result.current.mutateAsync({ id: 't1' })).rejects.toThrow(/permission denied/);
    await waitFor(() => expect(mocks.estado.error).toBeTruthy());
  });
});
