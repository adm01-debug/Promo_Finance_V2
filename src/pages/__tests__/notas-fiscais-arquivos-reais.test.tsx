/**
 * A aba Notas listava um estado fixo vazio e os botões de XML/DANFE só
 * disparavam "XML baixado!"/"DANFE gerado!" sem baixar nada. Estes testes fixam
 * o contrato novo: a lista vem do banco e os arquivos só são oferecidos quando
 * a nota realmente tem URL importada.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { env } from '@/config/env';
import type { NotaFiscal } from '@/components/nfe/nfe-types';

const URL_SUPABASE = `https://${env.SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/sign/nfe-xml/a.xml?token=abc`;

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('sonner', () => ({ toast: mockToast }));
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_t, tag: string) =>
        ({ children, ...rest }: Record<string, unknown> & { children?: React.ReactNode }) => {
          const { initial, animate, exit, transition, variants, whileHover, whileTap, ...dom } =
            rest;
          const Tag = tag as keyof JSX.IntrinsicElements;
          return <Tag {...(dom as object)}>{children}</Tag>;
        },
    }
  ),
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/nfe/NFePreview', () => ({ NFePreview: () => null }));
vi.mock('@/components/nfe/EventosHistorico', () => ({ EventosHistorico: () => null }));
vi.mock('@/components/nfe/AlertasRejeicao', () => ({ AlertasRejeicao: () => null }));
vi.mock('@/components/nfe/SefazAnalytics', () => ({ SefazAnalytics: () => null }));
vi.mock('@/components/nfe/InutilizacaoNFe', () => ({ InutilizacaoNFe: () => null }));
vi.mock('@/components/nfe/ContingenciaNFe', () => ({ ContingenciaNFe: () => null }));
vi.mock('@/components/nfe/SefazMonitor', () => ({ SefazMonitor: () => null }));
vi.mock('@/components/nfe/BlingNFePanel', () => ({ BlingNFePanel: () => null }));

import { NotasFiscaisAbas } from '@/pages/NotasFiscaisAbas';

function criarNota(extra: Partial<NotaFiscal> = {}): NotaFiscal {
  return {
    id: 'n1',
    numero: '1234',
    serie: '1',
    chaveAcesso: '35240112345678000190550010000012341234567890',
    naturezaOperacao: '',
    dataEmissao: '2026-11-01T10:00:00',
    cnpjEmitente: '',
    emitenteNome: '',
    cnpjDestinatario: '12345678000199',
    destinatarioNome: 'Tech Solutions Ltda',
    destinatarioEndereco: '',
    valorProdutos: 1000,
    valorFrete: 0,
    valorSeguro: 0,
    valorDesconto: 0,
    valorIPI: 0,
    valorICMS: 0,
    valorTotal: 1000,
    status: 'autorizada',
    itens: [],
    ...extra,
  };
}

function renderAbas(notas: NotaFiscal[], filtradas = notas) {
  return render(
    <NotasFiscaisAbas
      searchTerm=""
      setSearchTerm={() => {}}
      statusFilter="todos"
      setStatusFilter={() => {}}
      filteredNotas={filtradas}
      setNotaCancelar={() => {}}
      notas={notas}
      totalEmitido={notas.reduce(
        (acc, n) => (n.status === 'autorizada' ? acc + n.valorTotal : acc),
        0
      )}
      notasAutorizadas={notas.filter((n) => n.status === 'autorizada').length}
    />
  );
}

describe('/notas-fiscais — lista e arquivos reais', () => {
  let aba: { opener: unknown; close: ReturnType<typeof vi.fn>; location: { href: string } };

  beforeEach(() => {
    vi.clearAllMocks();
    aba = { opener: {}, close: vi.fn(), location: { href: '' } };
    window.open = vi.fn(() => aba as unknown as Window) as unknown as typeof window.open;
  });

  it('sem notas mostra estado vazio e não divide por zero na taxa de autorização', () => {
    renderAbas([]);

    expect(screen.getByText('Nenhuma nota fiscal encontrada')).toBeInTheDocument();
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('abre só o XML/DANFE que a nota realmente tem', async () => {
    renderAbas([
      criarNota({ id: 'com', xmlUrl: URL_SUPABASE, pdfUrl: URL_SUPABASE }),
      criarNota({ id: 'sem', chaveAcesso: '35240112345678000190550010000012341234567891' }),
    ]);

    const xml = screen.getAllByTitle('Buscar o XML autorizado no armazenamento da empresa')[0];
    await userEvent.click(xml);
    expect(aba.location.href).toBe(URL_SUPABASE);

    aba.location.href = '';
    const danfe = screen.getAllByTitle('Abrir o DANFE (PDF)')[0];
    await userEvent.click(danfe);
    expect(aba.location.href).toBe(URL_SUPABASE);

    const semArquivo = screen.getAllByTitle('XML não importado para esta nota');
    expect(semArquivo).toHaveLength(1);
    expect(semArquivo[0]).toBeDisabled();
    expect(screen.getByTitle('DANFE não armazenado — abra pelo Bling ERP')).toBeDisabled();

    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('não abre XML de host desconhecido mesmo gravado na nota', async () => {
    renderAbas([criarNota({ id: 'phish', xmlUrl: 'https://phishing.example/nfe.xml' })]);

    await userEvent.click(screen.getByTitle('Buscar o XML autorizado no armazenamento da empresa'));

    await vi.waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith(
        'XML não encontrado no armazenamento desta empresa.'
      )
    );
    expect(aba.location.href).toBe('');
    expect(aba.close).toHaveBeenCalled();
  });

  it('avisa quando o navegador bloqueia a nova aba', async () => {
    window.open = vi.fn(() => null) as unknown as typeof window.open;
    renderAbas([criarNota({ id: 'com', xmlUrl: URL_SUPABASE })]);

    await userEvent.click(screen.getByTitle('Buscar o XML autorizado no armazenamento da empresa'));

    await vi.waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith(
        'O navegador bloqueou a nova aba. Libere pop-ups para este site e tente de novo.'
      )
    );
  });

  it('marca a nota de compra como entrada e mostra o fornecedor', () => {
    renderAbas([
      criarNota({
        id: 'compra',
        direcao: 'entrada',
        destinatarioNome: '',
        emitenteNome: 'Fornecedor ABC',
      }),
    ]);

    expect(screen.getByText('Entrada')).toBeInTheDocument();
    expect(screen.getByText('Fornecedor: Fornecedor ABC')).toBeInTheDocument();
  });

  it('soma os itens faturados das notas autorizadas', () => {
    renderAbas([
      criarNota({
        itens: [
          {
            codigo: 'SKU-1',
            descricao: 'SKU-1',
            ncm: '39269090',
            cfop: '5102',
            unidade: 'UN',
            quantidade: 3,
            valorUnitario: 10,
            valorTotal: 30,
          },
          {
            codigo: 'SKU-2',
            descricao: 'SKU-2',
            ncm: '39269091',
            cfop: '5102',
            unidade: 'UN',
            quantidade: 2,
            valorUnitario: 5,
            valorTotal: 10,
          },
        ],
      }),
    ]);

    expect(screen.getByText('Itens Faturados').nextElementSibling?.textContent).toBe('5');
  });
});
