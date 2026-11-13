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
import { renderHook, act, waitFor } from '@testing-library/react';
import type { QueryClient } from '@tanstack/react-query';

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
import {
  PAGAMENTO,
  criarQueryClient,
  criarWrapper,
  filaParcelas,
  montaClienteCom,
  type Resultado,
} from './useAcordosParcelamento.harness';

let queryClient: QueryClient;
const wrapper = criarWrapper(() => queryClient);

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = criarQueryClient();
});

async function montaHook(respostas: Record<string, Resultado[]>) {
  const escritas = montaClienteCom(mockFrom, respostas);
  const { result } = renderHook(() => useAcordosParcelamento(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  return { result, escritas };
}

describe('registrarPagamento — rateio em contas_receber', () => {
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
        { data: [{ id: 'cr-ok' }], error: null },
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
        { data: [{ id: 'cr-ok' }], error: null },
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
        { data: [{ id: 'cr-ok' }], error: null },
      ],
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() => expect(toastSucesso).toHaveBeenCalled());

    const updates = escritas.filter((e) => e.tabela === 'contas_receber' && e.metodo === 'update');
    expect(updates).toHaveLength(4);
    const recebidos = updates.map(
      (e) => (e.payload as { valor_recebido?: number }).valor_recebido ?? 0
    );
    // Nenhuma conta recebe além do próprio valor (0,01), a soma é
    // exatamente o pago (0,02) e nenhum centavo fica sem registro.
    expect(Math.max(...recebidos)).toBeLessThanOrEqual(0.01);
    expect(recebidos.reduce((s, v) => s + v, 0)).toBeCloseTo(0.02, 2);
  });

  it('juros do acordo acima do principal são registrados, não descartados', async () => {
    // Regressão (Devin Review): 2 contas de 100 em acordo de 220 (juros
    // de 20). Teto por saldo sozinho alocava só 200 e os 20 de juros
    // sumiam do registro mesmo com acordo quitado. O excedente vai para
    // a última conta com peso — valor_recebido > valor é receita real.
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        {
          data: [
            {
              id: 'ac-1',
              contas_receber_ids: ['c1', 'c2'],
              valor_total_acordo: 220,
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
            { id: 'c1', valor: 100, valor_recebido: 0, status: 'em_acordo' },
            { id: 'c2', valor: 100, valor_recebido: 0, status: 'em_acordo' },
          ],
          error: null,
        },
        { data: [{ id: 'cr-ok' }], error: null },
      ],
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() => expect(toastSucesso).toHaveBeenCalled());

    const updates = escritas.filter((e) => e.tabela === 'contas_receber' && e.metodo === 'update');
    const recebidos = updates.map(
      (e) => (e.payload as { valor_recebido?: number }).valor_recebido ?? 0
    );
    expect(recebidos.reduce((s, v) => s + v, 0)).toBeCloseTo(220, 2);
    expect(recebidos).toEqual([100, 120]);
  });

  it('excedente de juros vai para conta elegível quando a última saiu do acordo', async () => {
    // Regressão (Devin Review): 2 contas de 100 em acordo de 220, mas c2
    // já foi paga FORA do acordo (recebido, sem marcador). Excedente
    // atribuído a ela nunca seria escrito (filtro em_acordo) e os 20 de
    // juros sumiriam. Agora o excedente vai para a última elegível: c1
    // registra 120 (100 principal + 20 juros); c2 fica intacta.
    const { result, escritas } = await montaHook({
      acordos_parcelamento: [
        { data: [], error: null },
        {
          data: [
            {
              id: 'ac-1',
              contas_receber_ids: ['c1', 'c2'],
              valor_total_acordo: 220,
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
            { id: 'c1', valor: 100, valor_recebido: 0, status: 'em_acordo' },
            { id: 'c2', valor: 100, valor_recebido: 100, status: 'recebido' },
          ],
          error: null,
        },
        { data: [{ id: 'cr-ok' }], error: null },
      ],
    });

    act(() => result.current.registrarPagamento(PAGAMENTO));

    await waitFor(() => expect(toastSucesso).toHaveBeenCalled());

    const updates = escritas.filter((e) => e.tabela === 'contas_receber' && e.metodo === 'update');
    expect(updates).toHaveLength(1);
    expect((updates[0].payload as { valor_recebido?: number }).valor_recebido).toBe(120);
  });
});
