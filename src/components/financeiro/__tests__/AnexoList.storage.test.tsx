/**
 * Testes — AnexoList (Etapa 20)
 *
 * A remoção lia `anexo.storage_path`, coluna que **não existe** em
 * `anexos_financeiros`: o `remove([''])` resultante nunca apagava nada, o erro
 * era só logado e a linha do banco ia embora. Todo anexo removido pela tela
 * deixava o arquivo no bucket, sem nenhum ponteiro para removê-lo e ainda
 * baixável por quem tivesse a URL. O caminho agora sai da própria URL.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Resultado = { data: unknown; error: unknown };

const { mockFrom, mockRemove, mockUpload, mockGetPublicUrl, toastErro, toastSucesso, toastAviso } =
  vi.hoisted(() => ({
    mockFrom: vi.fn(),
    mockRemove: vi.fn(),
    mockUpload: vi.fn(),
    mockGetPublicUrl: vi.fn(),
    toastErro: vi.fn(),
    toastSucesso: vi.fn(),
    toastAviso: vi.fn(),
  }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    storage: {
      from: () => ({ remove: mockRemove, upload: mockUpload, getPublicUrl: mockGetPublicUrl }),
    },
  },
}));
vi.mock('sonner', () => ({
  toast: { success: toastSucesso, error: toastErro, warning: toastAviso },
}));
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { AnexoList } from '../AnexoList';

const URL_ANEXO =
  'https://proj.supabase.co/storage/v1/object/public/financeiro/contas_pagar/e-1/0.42.pdf';

const ANEXO = {
  id: 'anx-1',
  nome_arquivo: 'nota.pdf',
  tamanho_bytes: 1024,
  url: URL_ANEXO,
  url_publica: URL_ANEXO,
};

type Escrita = { tabela: string; metodo: string };

function montaCliente(respostas: Record<string, Resultado[]>) {
  const escritas: Escrita[] = [];
  const consumidas: Record<string, number> = {};
  mockFrom.mockImplementation((tabela: string) => {
    const fila = respostas[tabela] ?? [{ data: [], error: null }];
    const i = Math.min(consumidas[tabela] ?? 0, fila.length - 1);
    consumidas[tabela] = (consumidas[tabela] ?? 0) + 1;
    const resultado = fila[i];
    const chain: Record<string, unknown> = {};
    for (const metodo of ['select', 'insert', 'delete', 'eq']) {
      chain[metodo] = vi.fn(() => {
        if (['insert', 'delete'].includes(metodo)) escritas.push({ tabela, metodo });
        return chain;
      });
    }
    chain.then = (r: (v: Resultado) => unknown) => Promise.resolve(resultado).then(r);
    return chain;
  });
  return escritas;
}

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  mockRemove.mockResolvedValue({ data: [], error: null });
  mockUpload.mockResolvedValue({ data: { path: 'x' }, error: null });
  mockGetPublicUrl.mockReturnValue({ data: { publicUrl: URL_ANEXO } });
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});

async function renderizaComAnexo(respostas: Record<string, Resultado[]>) {
  const escritas = montaCliente(respostas);
  const utils = render(<AnexoList entidadeId="e-1" entidadeTipo="contas_pagar" />, { wrapper });
  await screen.findByText('nota.pdf');
  return { ...utils, escritas };
}

function clicaRemover() {
  // O botão da lixeira é o segundo ação da linha (o primeiro é o download).
  const botoes = screen.getAllByRole('button');
  fireEvent.click(botoes[botoes.length - 1]);
}

describe('AnexoList — remoção', () => {
  it('remove o objeto do storage usando o caminho extraído da URL', async () => {
    const { escritas } = await renderizaComAnexo({
      anexos_financeiros: [
        { data: [ANEXO], error: null },
        { data: [{ id: 'anx-1' }], error: null },
      ],
    });

    clicaRemover();

    await waitFor(() => expect(toastSucesso).toHaveBeenCalledWith('Anexo removido'));
    expect(mockRemove).toHaveBeenCalledWith(['contas_pagar/e-1/0.42.pdf']);
    expect(escritas).toContainEqual({ tabela: 'anexos_financeiros', metodo: 'delete' });
    expect(toastAviso).not.toHaveBeenCalled();
  });

  it('não apaga a linha quando o storage recusa a remoção', async () => {
    // Apagar a linha aqui é o que criava o órfão permanente no bucket.
    mockRemove.mockResolvedValue({ data: null, error: { message: 'objeto bloqueado' } });
    const { escritas } = await renderizaComAnexo({
      anexos_financeiros: [{ data: [ANEXO], error: null }],
    });

    clicaRemover();

    await waitFor(() => expect(toastErro).toHaveBeenCalled());
    expect(toastErro.mock.calls[0][0]).toContain('objeto bloqueado');
    expect(escritas.some((e) => e.metodo === 'delete')).toBe(false);
    expect(toastSucesso).not.toHaveBeenCalled();
  });

  it('falha quando o delete do banco não atinge linha alguma', async () => {
    await renderizaComAnexo({
      anexos_financeiros: [
        { data: [ANEXO], error: null },
        { data: [], error: null },
      ],
    });

    clicaRemover();

    await waitFor(() => expect(toastErro).toHaveBeenCalled());
    expect(toastSucesso).not.toHaveBeenCalled();
  });

  it('avisa quando a URL não permite localizar o objeto', async () => {
    await renderizaComAnexo({
      anexos_financeiros: [
        { data: [{ ...ANEXO, url: 'https://exemplo.com/arquivo-legado.pdf' }], error: null },
        { data: [{ id: 'anx-1' }], error: null },
      ],
    });

    clicaRemover();

    await waitFor(() => expect(toastSucesso).toHaveBeenCalledWith('Anexo removido'));
    expect(mockRemove).not.toHaveBeenCalled();
    expect(toastAviso).toHaveBeenCalledWith(expect.stringContaining('nota.pdf'));
  });
});

describe('AnexoList — upload', () => {
  function anexaArquivo(container: HTMLElement) {
    const input = container.querySelector('#file-upload') as HTMLInputElement;
    const file = new File(['conteudo'], 'nota.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
  }

  it('desfaz o upload quando o registro no banco falha', async () => {
    // Sem a compensação, o arquivo ficava no bucket sem linha que o apontasse.
    const escritas = montaCliente({
      anexos_financeiros: [
        { data: [], error: null },
        { data: null, error: { code: '42501', message: 'sem permissão' } },
      ],
    });
    const { container } = render(<AnexoList entidadeId="e-1" entidadeTipo="contas_pagar" />, {
      wrapper,
    });
    await screen.findByText(/Nenhum comprovante anexado/);

    anexaArquivo(container);

    await waitFor(() => expect(toastErro).toHaveBeenCalled());
    expect(mockRemove).toHaveBeenCalledWith([expect.stringContaining('contas_pagar/e-1/')]);
    expect(escritas).toContainEqual({ tabela: 'anexos_financeiros', metodo: 'insert' });
    expect(toastSucesso).not.toHaveBeenCalled();
  });

  it('não remove nada quando o registro grava', async () => {
    montaCliente({
      anexos_financeiros: [
        { data: [], error: null },
        { data: [{ id: 'anx-1' }], error: null },
      ],
    });
    const { container } = render(<AnexoList entidadeId="e-1" entidadeTipo="contas_pagar" />, {
      wrapper,
    });
    await screen.findByText(/Nenhum comprovante anexado/);

    anexaArquivo(container);

    await waitFor(() => expect(toastSucesso).toHaveBeenCalledWith('Arquivo anexado com sucesso'));
    expect(mockRemove).not.toHaveBeenCalled();
  });
});
