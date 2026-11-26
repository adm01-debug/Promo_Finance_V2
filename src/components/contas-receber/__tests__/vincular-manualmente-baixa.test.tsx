import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { VincularManualmenteDialog } from '../VincularManualmenteDialog';
import { BaixaAutomaticaDialogCorrespondenciasAutomaticas } from '../BaixaAutomaticaDialogCorrespondenciasAutomaticas';
import type { TransacaoBancaria } from '../BaixaAutomaticaDialog.types';

const linhas = [
  {
    id: 'conta-longe',
    cliente_nome: 'Alfa Ltda',
    descricao: 'Mensalidade',
    valor: 900,
    data_vencimento: '2026-03-10',
  },
  {
    id: 'conta-perto',
    cliente_nome: 'Beta ME',
    descricao: 'Consultoria',
    valor: 1000,
    data_vencimento: '2026-04-10',
  },
  {
    id: 'conta-paga',
    cliente_nome: 'Gama SA',
    descricao: 'Já liquidada',
    valor: 1000,
    data_vencimento: '2026-04-11',
  },
];

let erroLeitura: { message: string } | null = null;
let termoServidor: string | null = null;

const consultar = () => {
  if (erroLeitura) return { data: null, error: erroLeitura };
  const dados = termoServidor
    ? linhas.filter((l) => `${l.cliente_nome} ${l.descricao}`.toLowerCase().includes(termoServidor))
    : linhas;
  return { data: dados, error: null };
};

const limitMock = vi.fn(() => Promise.resolve(consultar()));
const orderMock = vi.fn(() => ({ limit: limitMock }));
const orMock = vi.fn((expr: string) => {
  termoServidor = expr.split('.ilike.%')[1]?.split('%')[0]?.toLowerCase() ?? null;
  return { order: orderMock };
});
const neqCanceladoMock = vi.fn(() => ({ order: orderMock, or: orMock }));
const neqRecebidoMock = vi.fn(() => ({ neq: neqCanceladoMock }));
const neqPagoMock = vi.fn(() => ({ neq: neqRecebidoMock }));
const eqMock = vi.fn(() => ({ neq: neqPagoMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...(args as [])) },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() } }));

const transacao: TransacaoBancaria = {
  id: 'tx-1',
  tipo: 'credito',
  data: new Date('2026-04-12T00:00:00'),
  valor: 1000,
  descricao: 'TED RECEBIDA',
};

const criarCliente = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const envolver = (ui: ReactNode) => (
  <QueryClientProvider client={criarCliente()}>{ui}</QueryClientProvider>
);

describe('VincularManualmenteDialog', () => {
  const onVincular = vi.fn();
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    erroLeitura = null;
    termoServidor = null;
  });

  const renderDialog = (idsJaVinculados: string[] = []) =>
    render(
      envolver(
        <VincularManualmenteDialog
          open={true}
          onOpenChange={onOpenChange}
          empresaId="emp-1"
          transacao={transacao}
          idsJaVinculados={idsJaVinculados}
          onVincular={onVincular}
        />
      )
    );

  it('consulta os títulos em aberto da empresa, ignorando pagos, recebidos e cancelados', async () => {
    renderDialog();

    await waitFor(() => expect(screen.getByText('Beta ME')).toBeInTheDocument());
    expect(fromMock).toHaveBeenCalledWith('contas_receber');
    expect(eqMock).toHaveBeenCalledWith('empresa_id', 'emp-1');
    expect(neqPagoMock).toHaveBeenCalledWith('status', 'pago');
    expect(neqRecebidoMock).toHaveBeenCalledWith('status', 'recebido');
    expect(neqCanceladoMock).toHaveBeenCalledWith('status', 'cancelado');
  });

  it('ordena pelo título de valor mais próximo da entrada bancária', async () => {
    renderDialog();

    await waitFor(() => expect(screen.getByText('Beta ME')).toBeInTheDocument());
    const nomes = screen.getAllByText(/^(Alfa Ltda|Beta ME|Gama SA)$/).map((el) => el.textContent);
    expect(nomes[0]).toBe('Beta ME');
  });

  it('não oferece títulos já vinculados no mesmo lote', async () => {
    renderDialog(['conta-perto']);

    await waitFor(() => expect(screen.getByText('Alfa Ltda')).toBeInTheDocument());
    expect(screen.queryByText('Beta ME')).not.toBeInTheDocument();
  });

  it('bloqueia títulos de valor diferente da entrada bancária (baixa é integral)', async () => {
    renderDialog();
    await waitFor(() => expect(screen.getByText('Alfa Ltda')).toBeInTheDocument());

    expect(screen.getByLabelText('Vincular Alfa Ltda')).toBeDisabled();
    expect(screen.getByLabelText('Vincular Beta ME')).toBeEnabled();
  });

  it('envia a busca para o servidor e filtra por cliente ou descrição', async () => {
    renderDialog();
    await waitFor(() => expect(screen.getByText('Beta ME')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Buscar título em aberto'), {
      target: { value: 'alfa' },
    });

    await waitFor(() => expect(orMock).toHaveBeenCalled());
    expect(orMock.mock.calls[0][0]).toContain('cliente_nome.ilike.%alfa%');
    await waitFor(() => expect(screen.queryByText('Beta ME')).not.toBeInTheDocument());
    expect(screen.getByText('Alfa Ltda')).toBeInTheDocument();
  });

  it('devolve o título escolhido e fecha o diálogo', async () => {
    renderDialog();
    await waitFor(() => expect(screen.getByText('Beta ME')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Vincular Beta ME'));

    expect(onVincular).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'conta-perto', valor: 1000 })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('mostra vazio quando a busca não encontra nada', async () => {
    renderDialog();
    await waitFor(() => expect(screen.getByText('Beta ME')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Buscar título em aberto'), {
      target: { value: 'inexistente' },
    });

    await waitFor(() =>
      expect(
        screen.getByText('Nenhum título em aberto corresponde a essa busca.')
      ).toBeInTheDocument()
    );
  });

  it('reporta erro de leitura sem esconder o problema', async () => {
    erroLeitura = { message: 'permissão negada' };
    renderDialog();

    await waitFor(() =>
      expect(
        screen.getByText(/Não foi possível carregar os títulos: permissão negada/)
      ).toBeInTheDocument()
    );
  });
});

describe('BaixaAutomaticaDialogCorrespondenciasAutomaticas — vínculo manual', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    erroLeitura = null;
    termoServidor = null;
  });

  it('abre o seletor de título ao clicar em Vincular Manualmente', async () => {
    const onVincular = vi.fn();
    render(
      envolver(
        <BaixaAutomaticaDialogCorrespondenciasAutomaticas
          matches={[]}
          unmatched={[transacao]}
          empresaId="emp-1"
          onVincular={onVincular}
        />
      )
    );

    fireEvent.click(screen.getByText('Vincular Manualmente'));

    await waitFor(() => expect(screen.getByText('Vincular manualmente')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Beta ME')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Vincular Beta ME'));
    expect(onVincular).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'tx-1' }),
      expect.objectContaining({ id: 'conta-perto' })
    );
  });
});
