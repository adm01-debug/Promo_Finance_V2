/**
 * O painel estava pronto e SEM nenhum import na aplicacao -- nenhuma rota,
 * nenhuma pagina. Ao liga-lo em /admin/telemetria, o estado de erro passou a
 * importar: a versao original caia no ramo de lista vazia e exibia
 * "✅ Nenhum acesso entre empresas ou uso administrativo anomalo" quando a RPC
 * falhava, dando visto verde a uma auditoria que nao rodou.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AcessosSuspeitosPanel } from '../AcessosSuspeitosPanel';

const rpcMock = vi.fn();

vi.mock('@/lib/supabase-dynamic', () => ({
  supabaseDyn: { rpc: (...args: unknown[]) => rpcMock(...args) },
}));

function renderPanel() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AcessosSuspeitosPanel />
    </QueryClientProvider>
  );
}

describe('AcessosSuspeitosPanel', () => {
  beforeEach(() => rpcMock.mockReset());

  it('consulta get_acessos_suspeitos com os parametros canonicos', async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    renderPanel();

    await vi.waitFor(() =>
      expect(rpcMock).toHaveBeenCalledWith('get_acessos_suspeitos', {
        _horas: 168,
        _somente_abertos: true,
      })
    );
    expect(await screen.findByText(/Nenhum acesso entre empresas/i)).toBeInTheDocument();
  });

  it('falha na consulta NAO vira auditoria limpa', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'requer papel admin' } });
    renderPanel();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Não foi possível verificar os acessos/i)).toBeInTheDocument();
    // o visto verde nao pode aparecer
    expect(screen.queryByText(/Nenhum acesso entre empresas/i)).not.toBeInTheDocument();
  });

  it('achado critico aparece na tabela', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: 'a1',
          tipo: 'cross_tenant',
          severidade: 'critical',
          janela_inicio: '2026-11-16T00:00:00Z',
          janela_fim: '2026-11-17T00:00:00Z',
          user_id: 'u1',
          user_email: 'user@empresa.test',
          empresa_id: 'e1',
          table_name: 'contas_pagar',
          ocorrencias: 3,
          baseline: null,
          detalhes: null,
          revisado_em: null,
          created_at: '2026-11-17T00:00:00Z',
        },
      ],
      error: null,
    });
    renderPanel();

    expect(await screen.findByText(/user@empresa.test/)).toBeInTheDocument();
    expect(screen.getByText(/1 crítico/)).toBeInTheDocument();
  });
});
