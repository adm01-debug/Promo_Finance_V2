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
let erroAoGravarAlerta = false;
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
    const erro =
      tabela === 'alertas' && erroAoGravarAlerta ? { message: 'permission denied' } : null;
    return Promise.resolve({ data: null, error: erro });
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
    data: [
      { id: 'cb-1', banco: 'BB', agencia: '1234', conta: '5678' },
      { id: 'cb-2', banco: 'Itaú', agencia: '9999', conta: '1111' },
    ],
  }),
}));

const registrarEventoMock = vi.fn();
vi.mock('@/lib/financeiro/registrarEvento', () => ({
  registrarEventoFinanceiroOrThrow: (...args: unknown[]) => registrarEventoMock(...args),
}));

const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    info: vi.fn(),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

const extratoCom = (transacoes: unknown[], conta?: Record<string, string>) => ({
  sucesso: true,
  avisos: [],
  extrato: {
    transacoes,
    conta: {
      banco: '001',
      agencia: '1234',
      conta: '5678',
      tipoConta: 'checking',
      moeda: 'BRL',
      ...conta,
    },
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

const importar = async (divergencias = 2) => {
  const arquivo = new File(['OFX'], 'retorno.ofx');
  Object.defineProperty(arquivo, 'text', { value: () => Promise.resolve('OFX') });
  fireEvent.change(document.getElementById('retorno-upload') as HTMLInputElement, {
    target: { files: [arquivo] },
  });
  await waitFor(() =>
    expect(screen.getByText(`Divergências Detectadas (${divergencias})`)).toBeInTheDocument()
  );
};

// A conta bancária do lote é o que dá identidade ao FITID do extrato.
const selecionarConta = async (nome: RegExp) => {
  fireEvent.click(screen.getByRole('combobox'));
  fireEvent.click(await screen.findByRole('option', { name: nome }));
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
    erroAoGravarAlerta = false;
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

  it('avisa que a divergência não foi registrada quando o alerta falha', async () => {
    erroAoGravarAlerta = true;
    abrirDialogo();
    await importar();

    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));
    await waitFor(() => expect(screen.getByText('Volume Recuperado')).toBeInTheDocument());

    // Sem o alerta gravado a divergência não fica registrada em lugar nenhum:
    // o usuário precisa saber que a tela de conclusão repete só os alertas —
    // reimportar o arquivo inteiro quitaria outros títulos com o mesmo crédito.
    expect(toastError).toHaveBeenCalledWith(
      expect.stringContaining('REGISTRAR DIVERGÊNCIAS PENDENTES')
    );
    expect(toastError).not.toHaveBeenCalledWith(
      expect.stringContaining('reimporte o arquivo de retorno')
    );
    expect(screen.getByText(/não foram registradas como alerta/)).toBeInTheDocument();
    const logs = chamadas.find((c) => c.tabela === 'logs_baixa_automatica');
    expect(logs?.args[0]).toEqual([
      expect.objectContaining({
        detalhes: expect.objectContaining({ alertas_falhos: 2 }),
      }),
    ]);
  });

  it('repete só a gravação dos alertas pendentes, sem reimportar o extrato', async () => {
    erroAoGravarAlerta = true;
    abrirDialogo();
    await importar();

    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));
    await waitFor(() => expect(screen.getByText('Volume Recuperado')).toBeInTheDocument());
    expect(screen.getByText(/REGISTRAR DIVERGÊNCIAS PENDENTES \(2\)/)).toBeInTheDocument();

    // O banco volta a aceitar o alerta: a tela registra as duas divergências
    // pendentes sem passar de novo pelo arquivo.
    erroAoGravarAlerta = false;
    fireEvent.click(screen.getByText(/REGISTRAR DIVERGÊNCIAS PENDENTES/));

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('2 divergências registradas como alerta.')
    );
    await waitFor(() =>
      expect(screen.queryByText(/REGISTRAR DIVERGÊNCIAS PENDENTES/)).not.toBeInTheDocument()
    );
    const alertas = chamadas.filter((c) => c.tabela === 'alertas' && c.metodo === 'insert');
    // 2 tentativas que falharam + 2 que passaram, sempre sobre as mesmas entradas.
    expect(alertas).toHaveLength(4);
    expect(alertas[2].args[0]).toEqual(
      expect.objectContaining({ tipo: 'divergencia_baixa', empresa_id: 'emp-1' })
    );
    expect(alertas[3].args[0]).toEqual(
      expect.objectContaining({ tipo: 'divergencia_baixa', empresa_id: 'emp-1' })
    );
    // Nenhuma releitura de títulos nem liquidação nova: o extrato não foi
    // reprocessado — só os alertas pendentes foram regravados.
    const consultas = chamadas.filter(
      (c) => c.tabela === 'contas_receber' && c.metodo === 'select'
    );
    expect(consultas).toHaveLength(1);
  });

  it('mantem as divergencias pendentes ao fechar a conclusao', async () => {
    erroAoGravarAlerta = true;
    abrirDialogo();
    await importar();

    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));
    await waitFor(() => expect(screen.getByText('Volume Recuperado')).toBeInTheDocument());

    fireEvent.click(screen.getByText('FECHAR'));
    await waitFor(() =>
      expect(screen.getByText('Arraste o arquivo de retorno aqui')).toBeInTheDocument()
    );

    // Fechar nao pode descartar alertas que nao entraram no banco: a lista
    // volta junto com o dialogo, no passo de upload, para nova tentativa.
    expect(screen.getByText(/continuam sem alerta registrado/)).toBeInTheDocument();
    expect(screen.getByText(/REGISTRAR DIVERGÊNCIAS PENDENTES \(2\)/)).toBeInTheDocument();

    erroAoGravarAlerta = false;
    fireEvent.click(screen.getByText(/REGISTRAR DIVERGÊNCIAS PENDENTES/));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('2 divergências registradas como alerta.')
    );
    await waitFor(() =>
      expect(screen.queryByText(/REGISTRAR DIVERGÊNCIAS PENDENTES/)).not.toBeInTheDocument()
    );
  });

  it('acrescenta as novas divergências sem perder as pendentes do lote anterior', async () => {
    erroAoGravarAlerta = true;
    abrirDialogo();
    await importar();

    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));
    await waitFor(() => expect(screen.getByText('Volume Recuperado')).toBeInTheDocument());
    expect(screen.getByText(/REGISTRAR DIVERGÊNCIAS PENDENTES \(2\)/)).toBeInTheDocument();

    // Segundo lote, com créditos diferentes: as pendências novas se somam às
    // antigas em vez de substituí-las (a baixa anterior segue sem alerta).
    fireEvent.click(screen.getByText('FECHAR'));
    await waitFor(() =>
      expect(screen.getByText('Arraste o arquivo de retorno aqui')).toBeInTheDocument()
    );
    parseExtratoBancarioMock.mockReturnValue(
      extratoCom([
        transacaoCredito(888, 'PIX SEM PAR 1', '2026-04-20'),
        transacaoCredito(777, 'PIX SEM PAR 2', '2026-04-20'),
      ])
    );
    await importar();
    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));
    await waitFor(() =>
      expect(screen.getByText(/REGISTRAR DIVERGÊNCIAS PENDENTES \(4\)/)).toBeInTheDocument()
    );

    erroAoGravarAlerta = false;
    fireEvent.click(screen.getByText(/REGISTRAR DIVERGÊNCIAS PENDENTES/));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('4 divergências registradas como alerta.')
    );
    const alertas = chamadas.filter((c) => c.tabela === 'alertas' && c.metodo === 'insert');
    // 4 tentativas que falharam (2 de cada lote) + 4 que passaram na repetição.
    expect(alertas).toHaveLength(8);
    const mensagens = alertas.slice(4).map((c) => (c.args[0] as { mensagem: string }).mensagem);
    expect(mensagens).toHaveLength(4);
    // Cada crédito dos dois lotes continua pendente: 1 TED do primeiro lote e 3
    // PIX (999 do primeiro, 888 e 777 do segundo).
    expect(mensagens.filter((m) => m.includes('TED RECEBIDA'))).toHaveLength(1);
    expect(mensagens.filter((m) => m.includes('PIX SEM PAR'))).toHaveLength(3);
  });

  it('não duplica o alerta quando o crédito volta em extratos sobrepostos', async () => {
    erroAoGravarAlerta = true;
    const credito = (valor: number, descricao: string, id: string, referencia?: string) => ({
      ...transacaoCredito(valor, descricao, '2026-04-20'),
      id,
      numeroReferencia: referencia,
    });
    parseExtratoBancarioMock.mockReturnValue(
      extratoCom([
        credito(999, 'PIX SEM PAR', 'ofx-999-0', '999'),
        credito(777, 'TED SEM PAR', 'ofx-777-0', '777'),
      ])
    );
    abrirDialogo();
    await importar();
    await selecionarConta(/BB/);

    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));
    await waitFor(() => expect(screen.getByText('Volume Recuperado')).toBeInTheDocument());
    expect(screen.getByText(/REGISTRAR DIVERGÊNCIAS PENDENTES \(2\)/)).toBeInTheDocument();

    // Segundo extrato do mesmo período: os mesmos créditos, com posições e ids
    // diferentes, identificados pelo FITID na mesma conta. A fila não pode
    // crescer, senão a nova tentativa grava dois alertas para o mesmo crédito.
    fireEvent.click(screen.getByText('FECHAR'));
    await waitFor(() =>
      expect(screen.getByText('Arraste o arquivo de retorno aqui')).toBeInTheDocument()
    );
    parseExtratoBancarioMock.mockReturnValue(
      extratoCom([
        credito(999, 'PIX SEM PAR', 'ofx-999-6', '999'),
        credito(777, 'TED SEM PAR', 'ofx-777-4', '777'),
      ])
    );
    await importar();
    // Destino diferente do primeiro lote: a identidade do crédito vem da conta
    // de origem do arquivo, então trocar o destino não cria um alerta a mais.
    await selecionarConta(/Itaú/);
    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));
    await waitFor(() => expect(screen.getByText('Volume Recuperado')).toBeInTheDocument());
    expect(screen.getByText(/REGISTRAR DIVERGÊNCIAS PENDENTES \(2\)/)).toBeInTheDocument();

    erroAoGravarAlerta = false;
    fireEvent.click(screen.getByText(/REGISTRAR DIVERGÊNCIAS PENDENTES/));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('2 divergências registradas como alerta.')
    );
    const alertas = chamadas.filter((c) => c.tabela === 'alertas' && c.metodo === 'insert');
    // 2 falhas em cada lote (as mesmas 2 divergências) + 2 gravados na repetição.
    expect(alertas).toHaveLength(6);
    const gravados = alertas.slice(4).map((c) => (c.args[0] as { mensagem: string }).mensagem);
    expect(gravados.filter((m) => m.includes('PIX SEM PAR'))).toHaveLength(1);
    expect(gravados.filter((m) => m.includes('TED SEM PAR'))).toHaveLength(1);

    // Estes créditos não declaram conta de bloco: o alerta não pode afirmar a
    // conta do arquivo, mas precisa manter a referência bancária do crédito.
    const mensagens = alertas.map((c) => (c.args[0] as { mensagem: string }).mensagem);
    expect(mensagens.some((m) => m.includes('Conta de origem'))).toBe(false);
    expect(mensagens.some((m) => m.includes('Referência bancária: 999'))).toBe(true);
  });

  it('não deixa o crédito de outra conta da mesma empresa ocupar a pendência', async () => {
    erroAoGravarAlerta = true;
    const credito = (valor: number, descricao: string, referencia: string) => ({
      ...transacaoCredito(valor, descricao, '2026-04-20'),
      numeroReferencia: referencia,
    });
    parseExtratoBancarioMock.mockReturnValue(extratoCom([credito(250, 'PIX CONTA A', '123')]));
    abrirDialogo();
    await importar(1);
    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));
    await waitFor(() => expect(screen.getByText('Volume Recuperado')).toBeInTheDocument());
    expect(screen.getByText(/REGISTRAR DIVERGÊNCIAS PENDENTES \(1\)/)).toBeInTheDocument();

    // O FITID 123 identifica a transação dentro da conta de origem: o crédito
    // da conta B é outro lançamento e não pode tomar o lugar do PIX da conta A.
    fireEvent.click(screen.getByText('FECHAR'));
    await waitFor(() =>
      expect(screen.getByText('Arraste o arquivo de retorno aqui')).toBeInTheDocument()
    );
    parseExtratoBancarioMock.mockReturnValue(
      extratoCom([credito(400, 'TED CONTA B', '123')], {
        banco: '341',
        agencia: '9999',
        conta: '1111',
      })
    );
    await importar(1);
    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));
    await waitFor(() => expect(screen.getByText('Volume Recuperado')).toBeInTheDocument());
    expect(screen.getByText(/REGISTRAR DIVERGÊNCIAS PENDENTES \(2\)/)).toBeInTheDocument();

    erroAoGravarAlerta = false;
    fireEvent.click(screen.getByText(/REGISTRAR DIVERGÊNCIAS PENDENTES/));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('2 divergências registradas como alerta.')
    );
    const gravados = chamadas
      .filter((c) => c.tabela === 'alertas' && c.metodo === 'insert')
      .slice(2)
      .map((c) => (c.args[0] as { mensagem: string }).mensagem);
    expect(gravados.filter((m) => m.includes('PIX CONTA A'))).toHaveLength(1);
    expect(gravados.filter((m) => m.includes('TED CONTA B'))).toHaveLength(1);
  });

  it('preserva a divergência de outra conta quando o mesmo FITID volta na conta certa', async () => {
    erroAoGravarAlerta = true;
    const credito = (
      valor: number,
      descricao: string,
      referencia: string,
      origemConta?: string
    ) => ({
      ...transacaoCredito(valor, descricao, '2026-04-20'),
      numeroReferencia: referencia,
      ...(origemConta ? { origemConta } : {}),
    });

    // Um único arquivo com dois blocos de extrato: o mesmo FITID 123 nas duas
    // contas. Cada crédito carrega a conta que o emitiu.
    parseExtratoBancarioMock.mockReturnValue(
      extratoCom([
        credito(400, 'PIX CONTA B', '123', '341/9999/1111'),
        credito(250, 'PIX CONTA A', '123', '001/1234/5678'),
      ])
    );
    abrirDialogo();
    await importar(2);
    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));
    await waitFor(() => expect(screen.getByText('Volume Recuperado')).toBeInTheDocument());
    expect(screen.getByText(/REGISTRAR DIVERGÊNCIAS PENDENTES \(2\)/)).toBeInTheDocument();

    // O extrato seguinte é só da conta A e o alerta de A é gravado com sucesso.
    // A fila tem que sair com a pendência de B (mesma referência, outra conta).
    fireEvent.click(screen.getByText('FECHAR'));
    await waitFor(() =>
      expect(screen.getByText('Arraste o arquivo de retorno aqui')).toBeInTheDocument()
    );
    erroAoGravarAlerta = false;
    parseExtratoBancarioMock.mockReturnValue(
      extratoCom([credito(250, 'PIX CONTA A', '123', '001/1234/5678')])
    );
    await importar(1);
    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));
    await waitFor(() => expect(screen.getByText('Volume Recuperado')).toBeInTheDocument());
    expect(screen.getByText(/REGISTRAR DIVERGÊNCIAS PENDENTES \(1\)/)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/REGISTRAR DIVERGÊNCIAS PENDENTES/));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('1 divergência registrada como alerta.')
    );
    const gravados = chamadas
      .filter((c) => c.tabela === 'alertas' && c.metodo === 'insert')
      .map((c) => (c.args[0] as { mensagem: string }).mensagem);
    // 2 alertas do primeiro lote (falharam) + 1 do segundo (gravado) + 1 repetição.
    expect(gravados).toHaveLength(4);
    expect(gravados.filter((m) => m.includes('PIX CONTA A'))).toHaveLength(2);
    expect(gravados.filter((m) => m.includes('PIX CONTA B'))).toHaveLength(2);
    expect(gravados.at(-1)).toContain('PIX CONTA B');
  });

  it('bloqueia o destino único quando os créditos vinculados vieram de contas diferentes', async () => {
    const credito = (
      valor: number,
      descricao: string,
      referencia: string,
      origemConta: string
    ) => ({
      ...transacaoCredito(valor, descricao, '2026-04-20'),
      numeroReferencia: referencia,
      origemConta,
    });
    const vincularPorNome = async (nome: string) => {
      fireEvent.click(screen.getAllByText('Vincular Manualmente')[0]);
      await waitFor(() => expect(screen.getByText('Vincular manualmente')).toBeInTheDocument());
      const candidato = await screen.findByLabelText(`Vincular ${nome}`);
      fireEvent.click(candidato);
    };

    // Segundo título em aberto: sem ele só um crédito do lote poderia ser
    // vinculado e o destino único nunca seria múltiplo.
    titulosEmAberto.push({
      id: 'conta-2',
      cliente_nome: 'Alfa SA',
      descricao: 'Serviço',
      valor: 999,
      data_vencimento: '2026-04-10',
      status: 'pendente',
    });
    try {
      parseExtratoBancarioMock.mockReturnValue(
        extratoCom([
          credito(1500, 'TED RECEBIDA', '111', '001/1234/5678'),
          credito(999, 'PIX SEM PAR', '222', '341/9999/1111'),
        ])
      );
      abrirDialogo();
      await importar(2);
      await vincularPorNome('Beta ME');
      await vincularPorNome('Alfa SA');
      await selecionarConta(/BB/);

      fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));

      // O crédito de 999 veio da conta 341/9999/1111: gravá-lo no destino BB
      // conciliaria o recebimento no banco errado.
      await waitFor(() =>
        expect(toastError).toHaveBeenCalledWith(
          'Os créditos vinculados vieram de contas diferentes. Escolha "Sem conta bancária" para liquidar sem lançamento ou importe um arquivo por conta.'
        )
      );
      expect(
        chamadas.filter((c) => c.tabela === 'contas_receber' && c.metodo === 'update')
      ).toHaveLength(0);
      expect(screen.queryByText('Volume Recuperado')).not.toBeInTheDocument();

      // O destino pode ser removido sem perder os vínculos manuais da prévia.
      await selecionarConta(/Sem conta bancária/);
      fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));

      await waitFor(() => expect(screen.getByText('Volume Recuperado')).toBeInTheDocument());
      expect(
        chamadas.filter((c) => c.tabela === 'contas_receber' && c.metodo === 'update')
      ).toHaveLength(2);
      expect(
        chamadas.filter((c) => c.tabela === 'transacoes_bancarias' && c.metodo === 'insert')
      ).toHaveLength(0);
    } finally {
      titulosEmAberto.pop();
    }
  });

  it('liquida quando só uma das contas do arquivo tem título vinculado', async () => {
    const credito = (
      valor: number,
      descricao: string,
      referencia: string,
      origemConta: string
    ) => ({
      ...transacaoCredito(valor, descricao, '2026-04-20'),
      numeroReferencia: referencia,
      origemConta,
    });

    parseExtratoBancarioMock.mockReturnValue(
      extratoCom([
        credito(1500, 'TED RECEBIDA', '111', '001/1234/5678'),
        credito(999, 'PIX SEM PAR', '222', '341/9999/1111'),
      ])
    );
    abrirDialogo();
    await importar(2);
    await vincularTitulo();
    await selecionarConta(/BB/);

    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));

    // O crédito da outra conta é divergência (vira alerta com a origem dele) e
    // não pode impedir a liquidação dos títulos vinculados.
    await waitFor(() => expect(screen.getByText('Volume Recuperado')).toBeInTheDocument());
    expect(toastError).not.toHaveBeenCalledWith(
      'Os créditos vinculados vieram de contas diferentes. Escolha "Sem conta bancária" para liquidar sem lançamento ou importe um arquivo por conta.'
    );
  });

  it('bloqueia o destino de outra conta do arquivo e libera a conta de origem', async () => {
    const credito = (
      valor: number,
      descricao: string,
      referencia: string,
      origemConta: string
    ) => ({
      ...transacaoCredito(valor, descricao, '2026-04-20'),
      numeroReferencia: referencia,
      origemConta,
    });

    parseExtratoBancarioMock.mockReturnValue(
      extratoCom([
        credito(1500, 'TED RECEBIDA', '111', '001/1234/5678'),
        credito(999, 'PIX SEM PAR', '222', '341/9999/1111'),
      ])
    );
    abrirDialogo();
    await importar(2);
    await vincularTitulo();

    // O operador precisa ver de qual conta o crédito veio para escolher o destino.
    expect(screen.getByText('Conta de origem no extrato: 001/1234/5678')).toBeInTheDocument();

    // O crédito vinculado entrou no BB: lançar no Itaú conciliaria no banco errado.
    await selecionarConta(/Itaú/);
    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        'Os créditos vinculados entraram na conta 001/1234/5678, que não é a conta de destino escolhida. Selecione a conta de origem, importe um arquivo por conta ou escolha "Sem conta bancária" para liquidar sem lançamento.'
      )
    );
    expect(
      chamadas.filter((c) => c.tabela === 'contas_receber' && c.metodo === 'update')
    ).toHaveLength(0);
    expect(screen.queryByText('Volume Recuperado')).not.toBeInTheDocument();

    // O mesmo lote com o destino da conta de origem é aceito e concilia no BB.
    await selecionarConta(/BB/);
    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));

    await waitFor(() => expect(screen.getByText('Volume Recuperado')).toBeInTheDocument());
    const update = chamadas.find((c) => c.tabela === 'contas_receber' && c.metodo === 'update');
    expect(update?.args[0]).toEqual(expect.objectContaining({ conta_bancaria_id: 'cb-1' }));
    const insert = chamadas.find(
      (c) => c.tabela === 'transacoes_bancarias' && c.metodo === 'insert'
    );
    expect(insert?.args[0]).toEqual(expect.objectContaining({ conta_bancaria_id: 'cb-1' }));

    // O alerta da divergência leva a origem e a referência do banco para o reprocesso.
    const alerta = chamadas.find((c) => c.tabela === 'alertas' && c.metodo === 'insert');
    const mensagem = (alerta?.args[0] as { mensagem: string }).mensagem;
    expect(mensagem).toContain('Conta de origem: 341/9999/1111');
    expect(mensagem).toContain('Referência bancária: 222');
  });

  it('grava as divergências pendentes na empresa do lote de origem', async () => {
    erroAoGravarAlerta = true;
    const { rerender } = abrirDialogo('emp-1');
    await importar();

    fireEvent.click(screen.getByText('CONFIRMAR BAIXA EM MASSA'));
    await waitFor(() => expect(screen.getByText('Volume Recuperado')).toBeInTheDocument());
    fireEvent.click(screen.getByText('FECHAR'));
    await waitFor(() =>
      expect(screen.getByText('Arraste o arquivo de retorno aqui')).toBeInTheDocument()
    );

    // A empresa ativa muda antes da gravação: o alerta continua sendo da empresa
    // que teve o lote importado, senão ele nasce no perfil financeiro errado.
    const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    rerender(
      <QueryClientProvider client={cliente}>
        <BaixaAutomaticaDialog open={true} onOpenChange={vi.fn()} empresaId="emp-2" />
      </QueryClientProvider>
    );
    expect(screen.getByText(/serão gravadas na empresa de origem/)).toBeInTheDocument();

    erroAoGravarAlerta = false;
    fireEvent.click(screen.getByText(/REGISTRAR DIVERGÊNCIAS PENDENTES/));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('2 divergências registradas como alerta.')
    );

    const empresas = chamadas
      .filter((c) => c.tabela === 'alertas' && c.metodo === 'insert')
      .slice(2)
      .map((c) => (c.args[0] as { empresa_id: string }).empresa_id);
    expect(empresas).toEqual(['emp-1', 'emp-1']);
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
