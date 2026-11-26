import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BaixaAutomaticaDialog } from '../BaixaAutomaticaDialog';

beforeAll(() => {
  // jsdom não implementa as APIs de ponteiro usadas pelo Select do Radix
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.releasePointerCapture = vi.fn();
});

const titulosEmAberto = [
  {
    id: 'conta-1',
    cliente_nome: 'Beta ME',
    descricao: 'Consultoria',
    valor: 1500,
    data_vencimento: '2026-04-10',
    status: 'pendente',
  },
];

let titulosLiquidados: Array<{ id: string }> | null = null;
const chamadas: Array<{ tabela: string; metodo: string; args: unknown[] }> = [];

const resultadoContasReceber = (atualizou: boolean) => {
  if (atualizou) {
    if (titulosLiquidados === null) return { data: [{ id: 'conta-1' }], error: null };
    return titulosLiquidados.length
      ? { data: titulosLiquidados, error: null }
      : { data: [], error: null };
  }
  return { data: titulosEmAberto, error: null };
};

const criarBuilder = (tabela: string) => {
  const builder: Record<string, unknown> = {};
  let atualizou = false;
  const metodos = ['select', 'eq', 'neq', 'or', 'order', 'limit', 'not', 'in', 'is', 'gte', 'lte'];
  for (const metodo of metodos) {
    builder[metodo] = vi.fn((...args: unknown[]) => {
      chamadas.push({ tabela, metodo, args });
      return builder;
    });
  }
  builder.update = vi.fn((...args: unknown[]) => {
    chamadas.push({ tabela, metodo: 'update', args });
    atualizou = true;
    return builder;
  });
  builder.insert = vi.fn((...args: unknown[]) => {
    chamadas.push({ tabela, metodo: 'insert', args });
    return Promise.resolve({ data: null, error: null });
  });
  builder.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(
      tabela === 'contas_receber' ? resultadoContasReceber(atualizou) : { data: null, error: null }
    ).then(resolve);
  return builder;
};

const fromMock = vi.fn((tabela: string) => criarBuilder(tabela));
const getUserMock = vi.fn(() => Promise.resolve({ data: { user: { id: 'user-1' } }, error: null }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...(args as [string])),
    auth: { getUser: () => getUserMock() },
  },
}));

const parseExtratoBancarioMock = vi.fn();
vi.mock('@/lib/ofx-parser', () => ({
  parseExtratoBancario: (...args: unknown[]) => parseExtratoBancarioMock(...args),
}));

vi.mock('@/hooks/useFinancialData', () => ({
  useContasBancarias: () => ({
    data: [{ id: 'cb-1', banco: 'BB', agencia: '1234', conta: '5678' }],
  }),
}));

const registrarEventoMock = vi.fn();
vi.mock('@/lib/financeiro/registrarEvento', () => ({
  registrarEventoFinanceiroOrThrow: (...args: unknown[]) => registrarEventoMock(...args),
}));

const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: (...args: unknown[]) => toastError(...args) },
}));

const extratoCom = (transacoes: unknown[]) => ({
  sucesso: true,
  avisos: [],
  extrato: {
    transacoes,
    nomeArquivo: 'retorno.ofx',
    dataImportacao: new Date('2026-04-21T00:00:00'),
    formato: 'OFX',
  },
});

const transacaoCredito = (valor: number, descricao: string, data: string) => ({
  id: `tx-${valor}`,
  tipo: 'credito',
  data: new Date(`${data}T00:00:00`),
  valor,
  descricao,
});

const importar = async () => {
  const arquivo = new File(['OFX'], 'retorno.ofx');
  Object.defineProperty(arquivo, 'text', { value: () => Promise.resolve('OFX') });
  fireEvent.change(document.getElementById('retorno-upload') as HTMLInputElement, {
    target: { files: [arquivo] },
  });
  await waitFor(() => expect(screen.getByText('Divergências Detectadas (2)')).toBeInTheDocument());
};

const vincularTitulo = async () => {
  fireEvent.click(screen.getAllByText('Vincular Manualmente')[0]);
  await waitFor(() => expect(screen.getByText('Vincular manualmente')).toBeInTheDocument());
  await waitFor(() => expect(screen.getByLabelText('Vincular Beta ME')).toBeInTheDocument());
  fireEvent.click(screen.getByLabelText('Vincular Beta ME'));
  await waitFor(() => expect(screen.getByText('Divergências Detectadas (1)')).toBeInTheDocument());
  expect(screen.getByText('Correspondências Automáticas (1)')).toBeInTheDocument();
};

const abrirDialogo = (empresaId = 'emp-1') => {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <BaixaAutomaticaDialog open={true} onOpenChange={vi.fn()} empresaId={empresaId} />
    </QueryClientProvider>
  );
};

describe('BaixaAutomaticaDialog — vínculo manual e confirmação do lote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chamadas.length = 0;
    titulosLiquidados = null;
    parseExtratoBancarioMock.mockReturnValue(
      extratoCom([
        transacaoCredito(1500, 'TED RECEBIDA', '2026-04-20'),
        transacaoCredito(999, 'PIX SEM PAR', '2026-04-20'),
      ])
    );
  });

  it('liquida o título vinculado pelo valor real do crédito e alerta só a divergência', async () => {
    abrirDialogo();
    await importar();
    await vincularTitulo();

    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));

    await waitFor(() => expect(screen.getByText('Volume Recuperado')).toBeInTheDocument());

    const update = chamadas.find((c) => c.tabela === 'contas_receber' && c.metodo === 'update');
    expect(update?.args[0]).toEqual(
      expect.objectContaining({
        status: 'pago',
        valor_recebido: 1500,
        data_recebimento: '2026-04-20',
      })
    );

    // Escopo de escrita: só o encadeamento que segue o update() prova que o
    // filtro de empresa/valor está na gravação — as leituras também filtram
    // por empresa, então olhar a lista inteira não comprovaria nada.
    const indiceUpdate = chamadas.findIndex(
      (c) => c.tabela === 'contas_receber' && c.metodo === 'update'
    );
    expect(indiceUpdate).toBeGreaterThanOrEqual(0);
    const filtrosEscrita = chamadas
      .slice(indiceUpdate + 1)
      .filter((c) => c.tabela === 'contas_receber')
      .map((c) => [c.metodo, ...c.args] as unknown[]);
    expect(filtrosEscrita).toContainEqual(['eq', 'id', 'conta-1']);
    expect(filtrosEscrita).toContainEqual(['eq', 'empresa_id', 'emp-1']);
    expect(filtrosEscrita).toContainEqual(['not', 'status', 'in', '(pago,recebido,cancelado)']);
    expect(filtrosEscrita).toContainEqual(['eq', 'valor', 1500]);

    const alertas = chamadas.filter((c) => c.tabela === 'alertas' && c.metodo === 'insert');
    expect(alertas).toHaveLength(1);
    expect(alertas[0].args[0]).toEqual(
      expect.objectContaining({ tipo: 'divergencia_baixa', user_id: 'user-1' })
    );

    const logs = chamadas.find((c) => c.tabela === 'logs_baixa_automatica');
    expect(logs?.args[0]).toEqual([
      expect.objectContaining({
        resultado: 'Arquivo retorno.ofx: 1/1 sucesso',
        detalhes: expect.objectContaining({ sucesso_count: 1, falha_count: 0 }),
      }),
    ]);

    expect(registrarEventoMock).toHaveBeenCalledWith(
      'receber',
      expect.objectContaining({ contaId: 'conta-1', tipo: 'baixa_automatica' })
    );
  });

  it('registra o lançamento bancário com o valor efetivamente creditado', async () => {
    abrirDialogo();
    await importar();
    await vincularTitulo();

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: /BB/ }));
    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));

    await waitFor(() => expect(screen.getByText('Volume Recuperado')).toBeInTheDocument());
    const insert = chamadas.find(
      (c) => c.tabela === 'transacoes_bancarias' && c.metodo === 'insert'
    );
    expect(insert?.args[0]).toEqual(
      expect.objectContaining({ conta_bancaria_id: 'cb-1', valor: 1500, tipo: 'receita' })
    );
  });

  it('aborta o lote quando o título deixou de estar elegível na escrita', async () => {
    titulosLiquidados = [];
    abrirDialogo();
    await importar();
    await vincularTitulo();

    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(chamadas.some((c) => c.tabela === 'transacoes_bancarias' && c.metodo === 'insert')).toBe(
      false
    );
    expect(registrarEventoMock).not.toHaveBeenCalled();
    const logs = chamadas.find((c) => c.tabela === 'logs_baixa_automatica');
    expect(logs?.args[0]).toEqual([
      expect.objectContaining({
        detalhes: expect.objectContaining({ sucesso_count: 0, falha_count: 1 }),
      }),
    ]);

    // O crédito cuja baixa não se confirmou precisa virar divergência para
    // reprocesso — antes ele só entrava na contagem de falhas.
    const alertas = chamadas.filter((c) => c.tabela === 'alertas' && c.metodo === 'insert');
    // 1 alerta do crédito sem par + 1 do crédito cuja baixa não se confirmou.
    expect(alertas).toHaveLength(2);
    expect(alertas[0].args[0]).toEqual(
      expect.objectContaining({ tipo: 'divergencia_baixa', user_id: 'user-1' })
    );
  });

  it('não associa dois créditos do extrato ao mesmo título', async () => {
    parseExtratoBancarioMock.mockReturnValue(
      extratoCom([
        transacaoCredito(1500, 'TED RECEBIDA 1', '2026-04-10'),
        transacaoCredito(1500, 'TED RECEBIDA 2', '2026-04-10'),
      ])
    );

    abrirDialogo();
    const arquivo = new File(['OFX'], 'retorno.ofx');
    Object.defineProperty(arquivo, 'text', { value: () => Promise.resolve('OFX') });
    fireEvent.change(document.getElementById('retorno-upload') as HTMLInputElement, {
      target: { files: [arquivo] },
    });
    await waitFor(() =>
      expect(screen.getByText('Correspondências Automáticas (1)')).toBeInTheDocument()
    );
    // Só um crédito pode casar com o único título de R$ 1.500,00; o outro
    // precisa cair nas divergências em vez de apontar para o mesmo título.
    expect(screen.getByText('Divergências Detectadas (1)')).toBeInTheDocument();
    expect(screen.getByText('Correspondências Automáticas (1)')).toBeInTheDocument();

    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));
    await waitFor(() => expect(screen.getByText('Volume Recuperado')).toBeInTheDocument());

    const logs = chamadas.find((c) => c.tabela === 'logs_baixa_automatica');
    expect(logs?.args[0]).toEqual([
      expect.objectContaining({
        detalhes: expect.objectContaining({ sucesso_count: 1, falha_count: 0 }),
      }),
    ]);
    const alertas = chamadas.filter((c) => c.tabela === 'alertas' && c.metodo === 'insert');
    expect(alertas).toHaveLength(1);
  });

  it('descarta o lote quando a empresa muda antes da confirmação', async () => {
    const { rerender } = abrirDialogo('emp-1');
    await importar();

    const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    rerender(
      <QueryClientProvider client={cliente}>
        <BaixaAutomaticaDialog open={true} onOpenChange={vi.fn()} empresaId="emp-2" />
      </QueryClientProvider>
    );

    await waitFor(() =>
      expect(screen.getByText('Arraste o arquivo de retorno aqui')).toBeInTheDocument()
    );
    expect(toastError).toHaveBeenCalledWith(
      'Empresa alterada — importe novamente o arquivo de retorno desta empresa.'
    );
  });
});
