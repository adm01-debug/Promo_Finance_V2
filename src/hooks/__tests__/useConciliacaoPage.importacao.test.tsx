import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { makeExtrato, makeMatchAltaConfianca, wrapper } from './use-conciliacao-test-utils';
import { mocks, resetConciliacaoPageMocks } from './useConciliacaoPage.test-harness';
import { useConciliacaoPage } from '../useConciliacaoPage';

beforeEach(resetConciliacaoPageMocks);

describe('useConciliacaoPage — carregamento inicial', () => {
  it('sem conta selecionada não consulta transações e mantém a lista vazia', async () => {
    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    await waitFor(() => expect(result.current.transacoes).toEqual([]));
    expect(mocks.supabase.inserts.transacoes_bancarias).toBeUndefined();
  });

  it('normaliza receita e despesa ao carregar transações bancárias', async () => {
    mocks.supabase.selectResp.transacoes_bancarias = {
      data: [
        {
          id: 'a',
          data: '2025-01-10',
          descricao: 'Entrada',
          valor: '50',
          tipo: 'receita',
          conciliada: false,
        },
        {
          id: 'b',
          data: '2025-01-11',
          descricao: 'Saída',
          valor: '30',
          tipo: 'despesa',
          conciliada: true,
        },
      ],
      error: null,
    };
    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => result.current.setSelectedBanco('bank-1'));
    await waitFor(() => expect(result.current.transacoes).toHaveLength(2));
    expect(result.current.transacoes.map((transacao) => transacao.tipo)).toEqual([
      'credito',
      'debito',
    ]);
    expect(result.current.transacoes[1].conciliada).toBe(true);
  });

  it('notifica erro de consulta e não mantém dados parciais', async () => {
    mocks.supabase.selectResp.transacoes_bancarias = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => result.current.setSelectedBanco('bank-1'));
    await waitFor(() =>
      expect(mocks.toasts.error).toHaveBeenCalledWith('Erro ao carregar transações')
    );
    expect(result.current.transacoes).toEqual([]);
  });
});

describe('useConciliacaoPage — importação de extrato', () => {
  it('não registra divergência quando o saldo do OFX confere', async () => {
    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => result.current.setSelectedBanco('bank-1'));
    await act(async () => result.current.handleImportSuccess(makeExtrato()));
    expect(mocks.supabase.inserts.divergencias_conciliacao).toBeUndefined();
    expect(mocks.supabase.inserts.alertas).toBeUndefined();
    expect(mocks.toasts.warning).not.toHaveBeenCalled();
  });

  it('registra divergência crítica quando o saldo do arquivo não fecha', async () => {
    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => result.current.setSelectedBanco('bank-1'));
    await act(async () =>
      result.current.handleImportSuccess(
        makeExtrato({
          conta: {
            banco: '001',
            agencia: '1',
            conta: '2',
            tipoConta: 'CC',
            moeda: 'BRL',
            saldoInicial: 0,
            saldoFinal: 999,
          },
        })
      )
    );
    expect(mocks.toasts.warning).toHaveBeenCalledWith(
      'Divergência de Saldo Detectada',
      expect.any(Object)
    );
    expect(mocks.supabase.inserts.divergencias_conciliacao?.[0]).toMatchObject({
      conta_bancaria_id: 'bank-1',
      tipo_divergencia: 'saldo_final',
    });
    expect(mocks.supabase.inserts.alertas?.[0]).toMatchObject({
      prioridade: 'critica',
      tipo: 'divergencia_conciliacao',
      empresa_id: 'emp-1',
    });
  });

  it('confirma automaticamente somente match de alta confiança com aceite explícito', async () => {
    mocks.supabase.singleResp.contas_bancarias = {
      data: { configuracoes_conciliacao: { tolerancia_centavos: 0.05, aceite_automatico: true } },
      error: null,
    };
    vi.mocked(mocks.matcher.encontrarTodosMatches).mockReturnValue(
      makeMatchAltaConfianca('receber')
    );
    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => result.current.setSelectedBanco('bank-1'));
    await act(async () => result.current.handleImportSuccess(makeExtrato()));
    expect(mocks.mutations.confirmarConciliacao.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ transacaoId: 'tx-1', contaReceberId: 'lanc-1' })
    );
    expect(result.current.importReport?.autoConciliadas).toBe(1);
  });

  it('mantém a transação em revisão quando aceite automático está desabilitado', async () => {
    mocks.supabase.singleResp.contas_bancarias = {
      data: { configuracoes_conciliacao: { tolerancia_centavos: 0.05, aceite_automatico: false } },
      error: null,
    };
    vi.mocked(mocks.matcher.encontrarTodosMatches).mockReturnValue(
      makeMatchAltaConfianca('receber')
    );
    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => result.current.setSelectedBanco('bank-1'));
    await act(async () => result.current.handleImportSuccess(makeExtrato()));
    expect(mocks.mutations.confirmarConciliacao.mutateAsync).not.toHaveBeenCalled();
    expect(result.current.importReport?.autoConciliadas).toBe(0);
    expect(result.current.transacoes.find((transacao) => transacao.id === 'tx-1')?.conciliada).toBe(
      false
    );
  });

  it('não marca localmente uma conciliação cuja persistência falhou', async () => {
    mocks.supabase.singleResp.contas_bancarias = {
      data: { configuracoes_conciliacao: { tolerancia_centavos: 0.05, aceite_automatico: true } },
      error: null,
    };
    vi.mocked(mocks.matcher.encontrarTodosMatches).mockReturnValue(
      makeMatchAltaConfianca('receber')
    );
    vi.mocked(mocks.mutations.confirmarConciliacao.mutateAsync).mockRejectedValue(
      new Error('DB down')
    );
    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => result.current.setSelectedBanco('bank-1'));
    await act(async () => result.current.handleImportSuccess(makeExtrato()));
    expect(mocks.toasts.error).toHaveBeenCalledWith(
      'Falha na Conciliação Automática',
      expect.any(Object)
    );
    expect(mocks.supabase.inserts.webhooks_log?.[0]).toMatchObject({
      event_type: 'reconciliation.failed',
      status: 'error',
    });
  });

  it('continua apresentando o relatório se a auditoria do arquivo não puder ser persistida', async () => {
    vi.mocked(mocks.mutations.salvarExtratoBanco.mutateAsync).mockRejectedValue(
      new Error('unique violation')
    );
    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => result.current.setSelectedBanco('bank-1'));
    await act(async () => result.current.handleImportSuccess(makeExtrato()));
    expect(mocks.mutations.salvarExtratoBanco.mutateAsync).toHaveBeenCalledOnce();
    expect(result.current.importReport).not.toBeNull();
    expect(result.current.showReportDialog).toBe(true);
  });

  it('mantém pendências de revisão em zero ou mais', async () => {
    mocks.supabase.singleResp.contas_bancarias = {
      data: { configuracoes_conciliacao: { tolerancia_centavos: 0.05, aceite_automatico: true } },
      error: null,
    };
    vi.mocked(mocks.mutations.salvarExtratoBanco.mutateAsync).mockResolvedValue({
      saved: 0,
      duplicates: 1,
    });
    vi.mocked(mocks.matcher.encontrarTodosMatches).mockReturnValue(makeMatchAltaConfianca('pagar'));
    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => result.current.setSelectedBanco('bank-1'));
    await act(async () => result.current.handleImportSuccess(makeExtrato()));
    expect(result.current.importReport?.pendentesRevisao).toBeGreaterThanOrEqual(0);
  });
});
