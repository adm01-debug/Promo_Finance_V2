import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const single = vi.fn().mockResolvedValue({ data: { id: 't1' }, error: null });
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  return { insert };
});

vi.mock('@tanstack/react-query', () => ({
  useMutation: <T>(options: T) => options,
  useQuery: vi.fn(),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => ({ insert: mocks.insert })) },
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { useCreatePixTemplate } from './usePixTemplates';

describe('useCreatePixTemplate', () => {
  it('preenche as colunas NOT NULL beneficiario_nome, tipo_chave e cidade', async () => {
    const mutation = useCreatePixTemplate() as unknown as {
      mutationFn: (t: Record<string, unknown>) => Promise<unknown>;
    };

    await mutation.mutationFn({
      nome: 'Fornecedor',
      descricao: null,
      empresa_id: 'empresa-1',
      centro_custo_id: null,
      favorecido_nome: 'Fulano',
      favorecido_cpf_cnpj: null,
      chave_pix: 'fulano@exemplo.com',
      tipo_chave_pix: 'email',
      cidade: 'São Paulo',
      valor_padrao: 0,
      valor_fixo: false,
      categoria: null,
      tags: [],
      ativo: true,
    });

    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        beneficiario_nome: 'Fulano',
        tipo_chave: 'email',
        cidade: 'São Paulo',
        created_by: 'user-1',
      })
    );
  });
});
