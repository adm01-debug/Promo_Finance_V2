/**
 * Achado F12 (P0): a pagina /notas-fiscais anunciava ato fiscal que nunca
 * aconteceu. Emissao e consulta ja tinham sido desligadas; o que continuava
 * alcancavel era a aba "Inutilizacao", que chamava o SIMULADOR
 * (src/lib/sefaz-simulator) e exibia "Numeracao inutilizada! Protocolo: ..."
 * com protocolo gerado localmente. Cancelamento e contingencia tinham o mesmo
 * padrao, dormentes so porque a lista de notas nasce vazia.
 *
 * Estes testes fixam o contrato: nenhuma tela de NF-e chama o simulador, e
 * nenhuma delas oferece botao habilitado que prometa ato fiscal.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockProcessarSefaz, mockRegistrarEvento, mockToast } = vi.hoisted(() => ({
  mockProcessarSefaz: vi.fn(),
  mockRegistrarEvento: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/sefaz-simulator', () => ({ processarSefaz: mockProcessarSefaz }));
vi.mock('@/lib/sefaz-event-logger', () => ({ registrarEvento: mockRegistrarEvento }));
vi.mock('sonner', () => ({ toast: mockToast }));
vi.mock('@/hooks/useFinancialData', () => ({
  useEmpresas: () => ({ data: [{ id: 'e1', razao_social: 'Promo Brindes', cnpj: '123' }] }),
}));

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_t, tag: string) => {
        const C = ({
          children,
          ...rest
        }: Record<string, unknown> & { children?: React.ReactNode }) => {
          const { initial, animate, exit, transition, variants, whileHover, whileTap, ...dom } =
            rest;
          const Tag = tag as keyof JSX.IntrinsicElements;
          return <Tag {...(dom as object)}>{children}</Tag>;
        };
        return C;
      },
    }
  ),
  useInView: () => true,
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

import { InutilizacaoNFe } from '../InutilizacaoNFe';
import { CancelamentoNFe } from '../CancelamentoNFe';
import { ContingenciaPendingList } from '../contingencia/ContingenciaPendingList';

const NOTA = {
  id: 'n1',
  numero: '000001234',
  serie: '1',
  chaveAcesso: '35240112345678000190550010000012341234567890',
  destinatarioNome: 'Tech Solutions Ltda',
  valorTotal: 1000,
  dataEmissao: '2026-11-01T10:00:00',
  status: 'autorizada' as const,
};

describe('NF-e nao anuncia ato fiscal que nao aconteceu (F12)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('inutilizacao: botao desabilitado, aviso na tela e simulador nunca chamado', async () => {
    render(<InutilizacaoNFe />);

    const botao = screen.getByRole('button', { name: /Inutilização indisponível/i });
    expect(botao).toBeDisabled();
    expect(screen.getByText(/Nenhum protocolo será simulado/i)).toBeInTheDocument();

    await userEvent.click(botao);
    expect(mockProcessarSefaz).not.toHaveBeenCalled();
    expect(mockRegistrarEvento).not.toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('cancelamento: botao desabilitado e sem chamada ao simulador', async () => {
    render(<CancelamentoNFe nota={NOTA} onClose={() => {}} onSuccess={() => {}} />);

    const botao = screen.getByRole('button', { name: /Cancelamento indisponível/i });
    expect(botao).toBeDisabled();
    await userEvent.click(botao);
    expect(mockProcessarSefaz).not.toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('contingencia: transmissao de pendentes desabilitada', () => {
    render(
      <ContingenciaPendingList
        pendingNFes={[
          {
            id: 'p1',
            numero: '000009999',
            serie: '1',
            chaveAcesso: '35240112345678000190550010000099991234567890',
            dataEmissao: new Date('2026-11-01T10:00:00Z'),
            valorTotal: 500,
            destinatario: 'Tech Solutions Ltda',
            xmlContingencia: '<nfe/>',
            status: 'pendente' as const,
            tentativas: 0,
            ultimaTentativa: null,
          },
        ]}
        isOnline
        isTransmitting={false}
        onTransmit={() => {}}
      />
    );

    expect(screen.getByRole('button', { name: /Transmissão indisponível/i })).toBeDisabled();
  });

  it('o mock de notas fiscais nao e mais exportado', async () => {
    const tipos = await import('../nfe-types');
    expect('mockNotasFiscais' in tipos).toBe(false);
  });
});
