import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NovaSimulacaoElisaoDialog } from '../NovaSimulacaoElisaoDialog';

const toastSuccess = vi.fn();
const toastError = vi.fn();
const toastWarning = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
    warning: (...a: unknown[]) => toastWarning(...a),
    info: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));

type LinhaNota = {
  valor_total: number | null;
  status: string | null;
  cliente_nome?: string | null;
  cliente_cnpj?: string | null;
};
type LinhaValor = { valor: number | null; status: string | null };
type LinhaPagar = LinhaValor & {
  fornecedor_id?: string | null;
  fornecedor_nome?: string | null;
  categoria?: string | null;
  categoria_nome?: string | null;
  descricao?: string | null;
};

let notas: LinhaNota[] = [];
let titulos: LinhaValor[] = [];
let compras: LinhaPagar[] = [];
let erroInsert: { message: string } | null = null;

/** Intervalos pedidos em cada `.range()` — prova a paginação da leitura. */
const intervalos: Array<{ tabela: string; de: number; ate: number }> = [];

interface PayloadInsert {
  empresa_id: string;
  created_by: string | null;
  ano_referencia: number;
  regime_atual: string;
  regime_simulado: string;
  carga_atual: number;
  carga_simulada: number;
  economia_estimada: number;
  premissas: {
    nome: string;
    ano_referencia: number;
    anexo_simples: string;
    dados_simulacao: { faturamentoAnual: number };
  };
  detalhes: {
    fontes: {
      faturamento12m: number;
      comprasServicos12m: number;
      folha12m: number;
      fonteFaturamento: string;
      truncado: boolean;
    };
    resultado: { totalAntigo: number; totalNovo: number };
    carga_simulada_base: number;
    residuais_transicao: { total: number };
    avisos: string[];
  };
}

const insertMock = vi.fn((_payload: PayloadInsert) =>
  Promise.resolve({ error: erroInsert ? { ...erroInsert } : null })
);

interface ConsultaFake {
  select: () => ConsultaFake;
  eq: () => ConsultaFake;
  is: () => ConsultaFake;
  neq: () => ConsultaFake;
  gte: () => ConsultaFake;
  order: () => ConsultaFake;
  range: (de: number, ate: number) => Promise<{ data: unknown[]; error: unknown }>;
}

function linhasDa(tabela: string): unknown[] {
  if (tabela === 'notas_fiscais') return notas;
  if (tabela === 'contas_receber') return titulos;
  return compras;
}

function consulta(tabela: string): ConsultaFake {
  const api: ConsultaFake = {
    select: () => api,
    eq: () => api,
    is: () => api,
    neq: () => api,
    gte: () => api,
    order: () => api,
    range: (de, ate) => {
      intervalos.push({ tabela, de, ate });
      return Promise.resolve({ data: linhasDa(tabela).slice(de, ate + 1), error: null });
    },
  };
  return api;
}

const fromMock = vi.fn((tabela: string) => {
  if (tabela === 'elisao_simulacoes_regime') {
    return { insert: (p: PayloadInsert) => insertMock(p) };
  }
  return consulta(tabela);
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

function payloadGravado(): PayloadInsert {
  return insertMock.mock.calls[0][0] as PayloadInsert;
}

beforeEach(() => {
  vi.clearAllMocks();
  intervalos.length = 0;
  erroInsert = null;
  notas = [
    { valor_total: 60_000, status: 'autorizada', cliente_nome: 'Cliente A' },
    { valor_total: 40_000, status: 'autorizada', cliente_nome: 'Cliente B' },
    { valor_total: 999_999, status: 'cancelada', cliente_nome: 'Cliente C' },
  ];
  titulos = [];
  compras = [
    { valor: 15_000, status: 'pago', fornecedor_id: 'forn-1', fornecedor_nome: 'Fornecedor X' },
  ];
});

describe('NovaSimulacaoElisaoDialog', () => {
  it('preenche faturamento e compras com os dados reais do periodo', async () => {
    renderDialog();
    await waitFor(() => expect(screen.getByLabelText('Faturamento 12m (R$)')).toHaveValue(100000));
    expect(screen.getByLabelText('Compras/serviços 12m (R$)')).toHaveValue(15000);
    // nota cancelada é descartada da apuração
    expect(screen.getByText(/2 nota\(s\) de venda/)).toBeInTheDocument();
  });

  it('nao conta folha nem impostos como compras (nao geram credito de CBS/IBS)', async () => {
    compras = [
      { valor: 15_000, status: 'pago', fornecedor_id: 'forn-1', fornecedor_nome: 'Fornecedor X' },
      { valor: 20_000, status: 'pago', categoria: 'Folha de pagamento', descricao: 'Salários 12m' },
      { valor: 5_000, status: 'pago', categoria: 'Impostos', descricao: 'DAS/DARF' },
    ];
    renderDialog();
    await waitFor(() =>
      expect(screen.getByLabelText('Compras/serviços 12m (R$)')).toHaveValue(15000)
    );
    expect(screen.getByText(/20\.000,00 de folha/)).toBeInTheDocument();
  });

  it('nao soma notas de compra (sem cliente) ao faturamento', async () => {
    notas = [
      { valor_total: 60_000, status: 'autorizada', cliente_nome: 'Cliente A' },
      { valor_total: 500_000, status: 'autorizada', cliente_nome: null, cliente_cnpj: null },
    ];
    renderDialog();
    await waitFor(() => expect(screen.getByLabelText('Faturamento 12m (R$)')).toHaveValue(60000));
  });

  it('pagina a leitura quando passa de mil lancamentos', async () => {
    notas = Array.from({ length: 1000 }, () => ({
      valor_total: 100,
      status: 'autorizada',
      cliente_nome: 'Cliente A',
    }));
    notas.push({ valor_total: 50, status: 'autorizada', cliente_nome: 'Cliente B' });
    renderDialog();
    await waitFor(() => expect(screen.getByLabelText('Faturamento 12m (R$)')).toHaveValue(100050));
    const faixas = intervalos.filter((i) => i.tabela === 'notas_fiscais');
    expect(faixas).toEqual([
      { tabela: 'notas_fiscais', de: 0, ate: 999 },
      { tabela: 'notas_fiscais', de: 1000, ate: 1999 },
    ]);
  });

  it('so habilita a criacao quando ha nome e base apurada, e grava a memoria de calculo', async () => {
    renderDialog();
    await waitFor(() => expect(screen.getByLabelText('Faturamento 12m (R$)')).toHaveValue(100000));

    const botao = screen.getByRole('button', { name: 'Criar Cenário' });
    expect(botao).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Nome do Cenário'), {
      target: { value: 'Planejamento 2027' },
    });
    await waitFor(() => expect(botao).toBeEnabled());

    fireEvent.click(botao);

    await waitFor(() => expect(insertMock).toHaveBeenCalledTimes(1));
    const payload = payloadGravado();
    expect(payload.empresa_id).toBe(empresaId);
    expect(payload.created_by).toBe('user-1');
    expect(payload.ano_referencia).toBeGreaterThanOrEqual(2026);
    expect(payload.regime_atual).toBe('Simples Nacional');
    expect(payload.regime_simulado).toContain('CBS/IBS');
    expect(payload.carga_atual).toBeGreaterThan(0);
    expect(payload.carga_simulada).toBeGreaterThanOrEqual(0);
    expect(payload.economia_estimada).toBeCloseTo(payload.carga_atual - payload.carga_simulada, 2);
    expect(payload.premissas.nome).toBe('Planejamento 2027');
    expect(payload.premissas.anexo_simples).toBe('I');
    expect(payload.premissas.dados_simulacao.faturamentoAnual).toBe(100000);
    expect(payload.detalhes.fontes.faturamento12m).toBe(100000);
    expect(payload.detalhes.fontes.comprasServicos12m).toBe(15000);
    expect(payload.detalhes.fontes.fonteFaturamento).toBe('notas_fiscais');
    // a carga simulada é CBS/IBS/IS do ano + os resíduos do sistema antigo
    expect(payload.carga_simulada).toBeCloseTo(
      payload.detalhes.carga_simulada_base + payload.detalhes.residuais_transicao.total,
      2
    );
  });

  it('cai para titulos a receber quando nao ha nota fiscal no periodo', async () => {
    notas = [];
    titulos = [{ valor: 80_000, status: 'recebido' }];
    renderDialog();
    await waitFor(() => expect(screen.getByLabelText('Faturamento 12m (R$)')).toHaveValue(80000));
    expect(screen.getByText(/Títulos a receber/)).toBeInTheDocument();
  });

  it('bloqueia a criacao quando nao ha receita apurada', async () => {
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
    await waitFor(() => expect(screen.getByLabelText('Faturamento 12m (R$)')).toHaveValue(100000));
    fireEvent.change(screen.getByLabelText('Nome do Cenário'), { target: { value: 'Falha' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Cenário' }));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(String(toastError.mock.calls[0]?.[0])).toContain('permission denied');
  });
});
