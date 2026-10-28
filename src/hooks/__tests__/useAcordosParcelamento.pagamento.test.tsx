/**
 * Testes — useAcordosParcelamento (Etapa 20)
 *
 * Dois defeitos, ambos com toast de sucesso por cima:
 *
 *  - `registrarPagamento` decidia a quitação com
 *    `parcelas?.every((p) => p.status === 'pago')`. Errava nos dois sentidos:
 *    select falhando ⇒ `undefined` ⇒ acordo nunca quitado; select devolvendo
 *    `[]` (o que a RLS produz) ⇒ `[].every()` é `true` ⇒ acordo quitado sem
 *    nenhuma parcela paga. E o update de quitação era descartado.
 *  - `cancelarAcordo` descartava o cancelamento das parcelas e não verificava
 *    se o acordo existia.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Resultado = { data: unknown; error: unknown; count?: number | null };
type Escrita = { tabela: string; metodo: string; payload: unknown };

const { mockFrom, toastErro, toastSucesso } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  toastErro: vi.fn(),
  toastSucesso: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mockFrom } }));
vi.mock('sonner', () => ({ toast: { success: toastSucesso, error: toastErro } }));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { useAcordosParcelamento } from '../useAcordosParcelamento';

function criarChain(resultado: Resultado, registro: Escrita[], tabela: string) {
  const chain: Record<string, unknown> = {};
  for (const metodo of ['select', 'insert', 'update', 'delete', 'eq', 'in', 'order', 'single']) {
    chain[metodo] = vi.fn((...args: unknown[]) => {
      if (['insert', 'update', 'delete'].includes(metodo)) {
        registro.push({ tabela, metodo, payload: args[0] });
      }
      return chain;
    });
  }
  chain.then = (resolver: (v: Resultado) => unknown) => Promise.resolve(resultado).then(resolver);
  return chain;
}

function montaCliente(respostas: Record<string, Resultado[]>) {
  const escritas: Escrita[] = [];
  const consumidas: Record<string, number> = {};

  mockFrom.mockImplementation((tabela: string) => {
    const fila = respostas[tabela] ?? [{ data: [], error: null }];
    const i = Math.min(consumidas[tabela] ?? 0, fila.length - 1);
    consumidas[tabela] = (consumidas[tabela] ?? 0) + 1;
    return criarChain(fila[i], escritas, tabela);
  });

  return escritas;
}

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});

async function montaHook(respostas: Record<string, Resultado[]>) {
  const escritas = montaCliente(respostas);
  const { result } = renderHook(() => useAcordosParcelamento(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  return { result, escritas };
}

const PAGAMENTO = { parcelaId: 'p-1', dataPagamento: '2026-04-10', valorPago: 500 };

/** Filas para `parcelas_acordo`: 1ª = update da parcela, 2ª = select do saldo. */
function filaParcelas(statusRestantes: Resultado) {
  return [{ data: { acordo_id: 'ac-1' }, error: null }, statusRestantes];
}

describe('registrarPagamento', () => {
  it('quita o acordo quando todas as parcelas estão pagas', async () => {
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        { data: [{ id: 'ac-1' }], error: null },
      ],
      parcelas_acordo: filaParcelas({
        data: [{ status: 'pago' }, { status: 'pago' }],
        error: null,
      }),
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() =>
      expect(
        escritas.some((e) => e.tabela === 'acordos_parcelamento' && e.metodo === 'update')
      ).toBe(true)
    );
  });

  it('quita o acordo e reverte contas_receber vinculadas para "recebido"', async () => {
    // Regressão: quitação total marcava o acordo como 'quitado' mas nunca
    // tocava contas_receber, que ficava 'em_acordo' para sempre mesmo paga.
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        // Acordo com desconto: total pago (640) < nominal das contas (800).
        {
          data: [{ id: 'ac-1', contas_receber_ids: ['cr-1', 'cr-2'], valor_total_acordo: 640 }],
          error: null,
        },
      ],
      parcelas_acordo: filaParcelas({
        data: [{ status: 'pago' }, { status: 'pago' }],
        error: null,
      }),
      // 1ª chamada: select do conjunto contratado (id+valor+valor_recebido+
      // status); as demais são os updates linha a linha (valor_recebido é
      // por linha — não dá para ratear num update em massa via PostgREST).
      contas_receber: [
        {
          data: [
            { id: 'cr-1', valor: 500, valor_recebido: 0, status: 'em_acordo' },
            { id: 'cr-2', valor: 300, valor_recebido: 0, status: 'em_acordo' },
          ],
          error: null,
        },
        { data: null, error: null },
      ],
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() =>
      expect(escritas.some((e) => e.tabela === 'contas_receber' && e.metodo === 'update')).toBe(
        true
      )
    );

    const escritaContasReceber = escritas.find(
      (e) => e.tabela === 'contas_receber' && e.metodo === 'update'
    );
    expect(escritaContasReceber?.payload).toMatchObject({ status: 'recebido' });
    expect(
      (escritaContasReceber?.payload as { data_recebimento?: string })?.data_recebimento
    ).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // valor_recebido recebe a cota pro-rata do valor_total_acordo (o que foi
    // pago de fato: 640 × 500/800 = 400) — nunca o nominal, senão o desconto
    // do acordo apareceria como caixa recebido nos KPIs.
    expect((escritaContasReceber?.payload as { valor_recebido?: number })?.valor_recebido).toBe(
      400
    );
  });

  it('rateia pelo saldo devedor quando há pagamento parcial anterior', async () => {
    // Regressão: pesos pelo nominal inflavam a cota de quem já recebeu
    // parte — conta de 500 com 200 recebidos (saldo 300) e conta de 300
    // (saldo 300), acordo de 600: cada uma recebe sua cota de 300, e os
    // recebidos finais são 500 e 300, não 575 e 225.
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        {
          data: [{ id: 'ac-1', contas_receber_ids: ['cr-1', 'cr-2'], valor_total_acordo: 600 }],
          error: null,
        },
      ],
      parcelas_acordo: filaParcelas({
        data: [{ status: 'pago' }],
        error: null,
      }),
      contas_receber: [
        {
          data: [
            { id: 'cr-1', valor: 500, valor_recebido: 200, status: 'em_acordo' },
            { id: 'cr-2', valor: 300, valor_recebido: 0, status: 'em_acordo' },
          ],
          error: null,
        },
        { data: null, error: null },
      ],
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() =>
      expect(escritas.some((e) => e.tabela === 'contas_receber' && e.metodo === 'update')).toBe(
        true
      )
    );

    const updates = escritas.filter((e) => e.tabela === 'contas_receber' && e.metodo === 'update');
    const recebidos = updates.map((e) => (e.payload as { valor_recebido?: number }).valor_recebido);
    expect(recebidos).toEqual([500, 300]);
  });

  it('aborta a quitação quando uma conta contratada não volta do select', async () => {
    // Regressão: conta ausente (exclusão física ou RLS) tinha a cota
    // redistribuída às demais, inflando valor_recebido. Agora aborta e o
    // acordo segue 'ativo' — nenhum update de quitação deve sair.
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        {
          data: [{ id: 'ac-1', contas_receber_ids: ['cr-1', 'cr-2'], valor_total_acordo: 640 }],
          error: null,
        },
      ],
      parcelas_acordo: filaParcelas({
        data: [{ status: 'pago' }],
        error: null,
      }),
      contas_receber: [
        {
          data: [{ id: 'cr-1', valor: 500, valor_recebido: 0, status: 'em_acordo' }],
          error: null,
        },
      ],
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() => expect(toastErro).toHaveBeenCalled());
    expect(toastSucesso).not.toHaveBeenCalled();
    expect(escritas.some((e) => e.tabela === 'contas_receber' && e.metodo === 'update')).toBe(
      false
    );
    expect(escritas.some((e) => e.tabela === 'acordos_parcelamento' && e.metodo === 'update')).toBe(
      false
    );
  });

  it('propaga falha de escrita em contas_receber sem quitar o acordo', async () => {
    // Regressão: update falho era só logado e a mutação seguia para o
    // toast de sucesso com quitação parcial. Agora o erro propaga e o
    // acordo não é marcado 'quitado' — o retry é idempotente.
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        {
          data: [{ id: 'ac-1', contas_receber_ids: ['cr-1'], valor_total_acordo: 500 }],
          error: null,
        },
      ],
      parcelas_acordo: filaParcelas({
        data: [{ status: 'pago' }],
        error: null,
      }),
      contas_receber: [
        {
          data: [{ id: 'cr-1', valor: 500, valor_recebido: 0, status: 'em_acordo' }],
          error: null,
        },
        { data: null, error: { code: '42501', message: 'sem permissão' } },
      ],
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() => expect(toastErro).toHaveBeenCalled());
    expect(toastSucesso).not.toHaveBeenCalled();
    expect(escritas.some((e) => e.tabela === 'acordos_parcelamento' && e.metodo === 'update')).toBe(
      false
    );
  });

  it('retry após falha parcial rateia só o restante — não recalcula o total', async () => {
    // Regressão (Devin Review): contas de 500 e 300 em acordo de 640 —
    // tentativa 1 atribuiu 400 e 240, quitou cr-1 (cota gravada em
    // metadata.acordo_rateio) e falhou em cr-2. Se o retry recalcular o
    // rateio sobre o total com o marcador no denominador, cr-2 recebe
    // ~274 e a soma registrada (674) passa dos 640 pagos. O correto é
    // ratear apenas o restante: 640 − 400 = 240 para cr-2.
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        {
          data: [{ id: 'ac-1', contas_receber_ids: ['cr-1', 'cr-2'], valor_total_acordo: 640 }],
          error: null,
        },
      ],
      parcelas_acordo: filaParcelas({
        data: [{ status: 'pago' }],
        error: null,
      }),
      contas_receber: [
        {
          data: [
            {
              id: 'cr-1',
              valor: 500,
              valor_recebido: 500,
              status: 'recebido',
              metadata: { acordo_rateio: { acordo_id: 'ac-1', quota: 400 } },
            },
            { id: 'cr-2', valor: 300, valor_recebido: 0, status: 'em_acordo', metadata: null },
          ],
          error: null,
        },
        { data: null, error: null },
      ],
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() =>
      expect(escritas.some((e) => e.tabela === 'contas_receber' && e.metodo === 'update')).toBe(
        true
      )
    );

    const updates = escritas.filter((e) => e.tabela === 'contas_receber' && e.metodo === 'update');
    expect(updates).toHaveLength(1);
    const payload = updates[0].payload as { valor_recebido?: number; metadata?: unknown };
    expect(payload.valor_recebido).toBe(240);
    expect(payload.metadata).toMatchObject({
      acordo_rateio: { acordo_id: 'ac-1', quota: 240 },
    });
  });

  it('rateio em centavos nunca excede o total pago pelo acordo', async () => {
    // Regressão (Devin Review): 4 contas de R$0,01 com acordo de R$0,02 —
    // arredondar cada cota intermediária para cima gravava R$0,03. Com
    // floor em centavos, a soma nunca passa de R$0,02.
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        {
          data: [
            {
              id: 'ac-1',
              contas_receber_ids: ['c1', 'c2', 'c3', 'c4'],
              valor_total_acordo: 0.02,
            },
          ],
          error: null,
        },
      ],
      parcelas_acordo: filaParcelas({
        data: [{ status: 'pago' }],
        error: null,
      }),
      contas_receber: [
        {
          data: [
            { id: 'c1', valor: 0.01, valor_recebido: 0, status: 'em_acordo' },
            { id: 'c2', valor: 0.01, valor_recebido: 0, status: 'em_acordo' },
            { id: 'c3', valor: 0.01, valor_recebido: 0, status: 'em_acordo' },
            { id: 'c4', valor: 0.01, valor_recebido: 0, status: 'em_acordo' },
          ],
          error: null,
        },
        { data: null, error: null },
      ],
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() =>
      expect(escritas.some((e) => e.tabela === 'contas_receber' && e.metodo === 'update')).toBe(
        true
      )
    );

    const updates = escritas.filter((e) => e.tabela === 'contas_receber' && e.metodo === 'update');
    const recebidos = updates.map(
      (e) => (e.payload as { valor_recebido?: number }).valor_recebido ?? 0
    );
    // Nenhuma conta recebe além do próprio valor (0,01) e a soma nunca
    // excede o pago (0,02) — o centavo sem saldo elegível fica não-alocado.
    expect(Math.max(...recebidos)).toBeLessThanOrEqual(0.01);
    expect(recebidos.reduce((s, v) => s + v, 0)).toBeLessThanOrEqual(0.02);
  });

  it('quita o acordo sem quebrar quando contas_receber_ids vem vazio/nulo', async () => {
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        { data: [{ id: 'ac-1', contas_receber_ids: null }], error: null },
      ],
      parcelas_acordo: filaParcelas({
        data: [{ status: 'pago' }],
        error: null,
      }),
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() =>
      expect(
        escritas.some((e) => e.tabela === 'acordos_parcelamento' && e.metodo === 'update')
      ).toBe(true)
    );
    expect(escritas.some((e) => e.tabela === 'contas_receber')).toBe(false);
  });

  it('não quita quando ainda há parcela pendente', async () => {
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [{ data: [], error: null }],
      parcelas_acordo: filaParcelas({
        data: [{ status: 'pago' }, { status: 'pendente' }],
        error: null,
      }),
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() => expect(toastSucesso).toHaveBeenCalled());
    expect(escritas.some((e) => e.tabela === 'acordos_parcelamento')).toBe(false);
  });

  it('não quita acordo cujas parcelas voltaram vazias — [].every() é true', async () => {
    // A RLS devolvendo zero linhas fazia o acordo ser quitado sem nenhuma
    // parcela paga, e o toast confirmava.
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [{ data: [], error: null }],
      parcelas_acordo: filaParcelas({ data: [], error: null }),
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() => expect(toastSucesso).toHaveBeenCalled());
    expect(escritas.some((e) => e.tabela === 'acordos_parcelamento')).toBe(false);
  });

  it('falha quando a conferência das parcelas dá erro', async () => {
    const { result } = await montaHook({
      acordos_parcelamento: [{ data: [], error: null }],
      parcelas_acordo: filaParcelas({
        data: null,
        error: { code: '42501', message: 'sem permissão' },
      }),
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() => expect(toastErro).toHaveBeenCalled());
    expect(toastSucesso).not.toHaveBeenCalled();
  });

  it('falha quando a quitação não atinge linha alguma', async () => {
    const { result } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        { data: [], error: null },
      ],
      parcelas_acordo: filaParcelas({ data: [{ status: 'pago' }], error: null }),
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() => expect(toastErro).toHaveBeenCalled());
    expect(toastSucesso).not.toHaveBeenCalled();
  });
});

describe('cancelarAcordo', () => {
  it('cancela parcelas pendentes e o acordo', async () => {
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        { data: [{ id: 'ac-1' }], error: null },
      ],
      parcelas_acordo: [{ data: [], error: null }],
    });

    act(() => result.current.cancelarAcordo('ac-1'));

    await waitFor(() => expect(toastSucesso).toHaveBeenCalledWith('Acordo cancelado'));
    expect(escritas.map((e) => `${e.tabela}.${e.metodo}`)).toEqual([
      'parcelas_acordo.update',
      'acordos_parcelamento.update',
    ]);
  });

  it('acordo sem parcelas pendentes não é tratado como falha', async () => {
    // Zero linhas aqui é o resultado correto: todas as parcelas já estavam
    // pagas. Exigir linha alguma seria transformar um caso válido em erro.
    const { result } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        { data: [{ id: 'ac-1' }], error: null },
      ],
      parcelas_acordo: [{ data: [], error: null, count: 0 }],
    });

    act(() => result.current.cancelarAcordo('ac-1'));

    await waitFor(() => expect(toastSucesso).toHaveBeenCalledWith('Acordo cancelado'));
  });

  it('falha quando o cancelamento das parcelas é recusado', async () => {
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [{ data: [], error: null }],
      parcelas_acordo: [{ data: null, error: { code: '42501', message: 'sem permissão' } }],
    });

    act(() => result.current.cancelarAcordo('ac-1'));

    await waitFor(() => expect(toastErro).toHaveBeenCalledWith('Erro ao cancelar acordo'));
    expect(escritas.some((e) => e.tabela === 'acordos_parcelamento')).toBe(false);
  });

  it('falha quando o acordo não existe', async () => {
    const { result } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        { data: [], error: null },
      ],
      parcelas_acordo: [{ data: [], error: null }],
    });

    act(() => result.current.cancelarAcordo('ac-inexistente'));

    await waitFor(() => expect(toastErro).toHaveBeenCalledWith('Erro ao cancelar acordo'));
    expect(toastSucesso).not.toHaveBeenCalled();
  });
});
