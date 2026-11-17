/**
 * Revisao da PR #400 (Codex P2): a alcada consultada tem que ser a da empresa
 * do TITULO. Com o dialogo aberto num titulo da empresa A e a empresa atual
 * trocada para B em outra aba (listener de `storage` em
 * useGlobalFinancialFilter), a consulta passava a usar a alcada de B: com
 * limite de 5.000 em A e 50.000 em B, um titulo de 10.000 de A seria pago sem
 * aprovacao.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockUseConfig, mockFrom } = vi.hoisted(() => ({
  mockUseConfig: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/hooks/useAprovacoes', () => ({
  useConfiguracaoAprovacao: (empresaId?: string) => mockUseConfig(empresaId),
  useCriarSolicitacaoAprovacao: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('@/hooks/useContasBancarias', () => ({ useContasBancarias: () => ({ data: [] }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom, auth: { getUser: vi.fn() } },
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { RegistrarPagamentoDialog } from '../RegistrarPagamentoDialog';

const wrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

const conta = {
  id: 'c1',
  empresa_id: 'empresa-A',
  fornecedor_nome: 'Fornecedor',
  descricao: 'Titulo de 10.000',
  valor: 10000,
  valor_pago: null,
  data_vencimento: '2026-12-01',
  status: 'pendente',
};

describe('RegistrarPagamentoDialog — empresa da alcada', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConfig.mockReturnValue({ data: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
  });

  it('consulta a alcada da empresa do titulo, nao a do filtro global', () => {
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <RegistrarPagamentoDialog
          conta={conta}
          open
          onOpenChange={() => {}}
          empresaId="empresa-B"
        />
      </Wrapper>
    );

    expect(mockUseConfig).toHaveBeenCalledWith('empresa-A');
    expect(mockUseConfig).not.toHaveBeenCalledWith('empresa-B');
  });

  it('registro legado sem empresa_id cai no filtro global', () => {
    const Wrapper = wrapper();
    render(
      <Wrapper>
        <RegistrarPagamentoDialog
          conta={{ ...conta, empresa_id: null }}
          open
          onOpenChange={() => {}}
          empresaId="empresa-B"
        />
      </Wrapper>
    );

    expect(mockUseConfig).toHaveBeenCalledWith('empresa-B');
  });
});
