import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NovaSimulacaoElisaoDialog } from '../NovaSimulacaoElisaoDialog';

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));

let notas: Array<{ valor_total: number | null; status: string | null }> = [];
let titulos: Array<{ valor: number | null; status: string | null }> = [];
let compras: Array<{ valor: number | null; status: string | null }> = [];
let erroInsert: { message: string } | null = null;

const insertMock = vi.fn(() => Promise.resolve({ error: erroInsert }));

function builder(resultado: () => { data: unknown; error: unknown }) {
  const limit = vi.fn(() => Promise.resolve(resultado()));
  const gte = vi.fn(() => ({ limit }));
  const neq = vi.fn(() => ({ gte }));
  const is = vi.fn(() => ({ neq, gte }));
  const eq = vi.fn(() => ({ gte, is }));
  const select = vi.fn(() => ({ eq }));
  return { select };
}

const fromMock = vi.fn((tabela: string) => {
  if (tabela === 'notas_fiscais') return builder(() => ({ data: notas, error: null }));
  if (tabela === 'contas_receber') return builder(() => ({ data: titulos, error: null }));
  if (tabela === 'contas_pagar') return builder(() => ({ data: compras, error: null }));
  return { insert: insertMock, select: vi.fn() };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (t: string) => fromMock(t) },
}));

const empresaId = '11111111-1111-1111-1111-111111111111';

function renderDialog() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <NovaSimulacaoElisaoDialog open onOpenChange={vi.fn()} empresaId={empresaId} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  erroInsert = null;
  notas = [
    { valor_total: 60_000, status: 'autorizada' },
    { valor_total: 40_000, status: 'autorizada' },
    { valor_total: 999_999, status: 'cancelada' },
  ];
  titulos = [];
  compras = [{ valor: 15_000, status: 'pago' }];
});

describe('NovaSimulacaoElisaoDialog', () => {
  it('preenche faturamento e compras com os dados reais do período', async () => {
    renderDialog();
    await waitFor(() =>
      expect(screen.getByLabelText('Faturamento 12m (R$)')).toHaveValue(100000)
    );
    expect(screen.getByLabelText('Compras/serviços 12m (R$)')).toHaveValue(15000);
    // nota cancelada é descartada da apuração
    expect(screen.getByText(/2 nota\(s\)/)).toBeInTheDocument();
  });

  it('só habilita a criação quando há nome e base apurada, e grava a memória de cálculo', async () => {
    renderDialog();
    await waitFor(() =>
      expect(screen.getByLabelText('Faturamento 12m (R$)')).toHaveValue(100000)
    );

    const botao = screen.getByRole('button', { name: 'Criar Cenário' });
    expect(botao).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Nome do Cenário'), {
      target: { value: 'Planejamento 2027' },
    });
    await waitFor(() => expect(botao).toBeEnabled());

    fireEvent.click(botao);

    await waitFor(() => expect(insertMock).toHaveBeenCalledTimes(1));
    const payload = (insertMock.mock.calls[0] as unknown[])[0] as Record<string, any>;
    expect(payload.empresa_id).toBe(empresaId);
    expect(payload.created_by).toBe('user-1');
    expect(payload.ano_referencia).toBeGreaterThanOrEqual(2026);
    expect(payload.regime_atual).toBe('Simples Nacional');
    expect(payload.regime_simulado).toContain('CBS/IBS');
    expect(payload.carga_atual).toBeGreaterThan(0);
    expect(payload.carga_simulada).toBeGreaterThanOrEqual(0);
    expect(payload.economia_estimada).toBeCloseTo(
      payload.carga_atual - payload.carga_simulada,
      2
    );
    expect(payload.premissas.nome).toBe('Planejamento 2027');
    expect(payload.premissas.dados_simulacao.faturamentoAnual).toBe(100000);
    expect(payload.detalhes.fontes.faturamento12m).toBe(100000);
    expect(payload.detalhes.fontes.comprasServicos12m).toBe(15000);
    expect(payload.detalhes.fontes.fonteFaturamento).toBe('notas_fiscais');
    expect(payload.detalhes.resultado.totalAntigo).toBeCloseTo(payload.carga_atual, 2);
  });

  it('cai para títulos a receber quando não há nota fiscal no período', async () => {
    notas = [];
    titulos = [{ valor: 80_000, status: 'recebido' }];
    renderDialog();
    await waitFor(() =>
      expect(screen.getByLabelText('Faturamento 12m (R$)')).toHaveValue(80000)
    );
    expect(screen.getByText(/Títulos a receber/)).toBeInTheDocument();
  });

  it('bloqueia a criação quando não há receita apurada', async () => {
    notas = [];
    titulos = [];
    renderDialog();
    await waitFor(() =>
      expect(screen.getByText(/Sem faturamento apurado no período/)).toBeInTheDocument()
    );
    fireEvent.change(screen.getByLabelText('Nome do Cenário'), {
      target: { value: 'Sem base' },
    });
    expect(screen.getByRole('button', { name: 'Criar Cenário' })).toBeDisabled();
  });

  it('mostra o erro do banco quando o insert falha', async () => {
    erroInsert = { message: 'permission denied' };
    renderDialog();
    await waitFor(() =>
      expect(screen.getByLabelText('Faturamento 12m (R$)')).toHaveValue(100000)
    );
    fireEvent.change(screen.getByLabelText('Nome do Cenário'), { target: { value: 'Falha' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Cenário' }));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(String(toastError.mock.calls[0]?.[0])).toContain('permission denied');
  });
});
