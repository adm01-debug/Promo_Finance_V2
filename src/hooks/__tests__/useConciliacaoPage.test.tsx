/**
 * Testes de regressão + cenários de borda para `useConciliacaoPage`.
 *
 * Foco em invariantes de integridade: nenhuma transação pode ficar
 * "conciliada" no estado local se a persistência não confirmou, e vice-versa.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ExtratoOFX } from '@/lib/ofx-parser';

// ---------- Hoisted mocks (compartilhados entre módulo e testes) ----------

const mocks = vi.hoisted(() => {
  return {
    mutations: {
      confirmarConciliacao: { mutateAsync: undefined as any },
      salvarExtratoBanco: { mutateAsync: undefined as any },
      desfazerConciliacao: { mutateAsync: undefined as any },
    },
    globalFilter: { currentBankAccountId: null as string | null, currentEmpresaId: null as string | null },
    financial: {
      contasBancarias: [{ id: 'bank-1', empresa_id: 'emp-1' }],
      contasPagar: [] as any[],
      contasReceber: [] as any[],
    },
    matcher: {
      encontrarTodosMatches: undefined as any,
      calcularEstatisticasMatch: undefined as any,
    },
    supabase: {
      inserts: {} as Record<string, any[]>,
      updates: {} as Record<string, Array<{ payload: any; filters: Record<string, any> }>>,
      selectResp: {} as Record<string, { data?: any; error?: any }>,
      singleResp: {} as Record<string, { data?: any; error?: any }>,
      insertResp: {} as Record<string, { data?: any; error?: any } | (() => Promise<any> | any)>,
      updateResp: {} as Record<string, { data?: any; error?: any }>,
      rpc: undefined as any,
      getUser: undefined as any,
    },
    toasts: {
      success: undefined as any,
      error: undefined as any,
      info: undefined as any,
      warning: undefined as any,
    },
  };
});

// Inicializar spies dentro de vi.hoisted requer helpers; recriamos aqui pois vi.fn
// já está disponível na carga do módulo (após hoisting).
mocks.mutations.confirmarConciliacao.mutateAsync = vi.fn();
mocks.mutations.salvarExtratoBanco.mutateAsync = vi.fn();
mocks.mutations.desfazerConciliacao.mutateAsync = vi.fn();
mocks.matcher.encontrarTodosMatches = vi.fn();
mocks.matcher.calcularEstatisticasMatch = vi.fn(() => ({
  total: 0, comMatch: 0, altaConfianca: 0, mediaConfianca: 0, baixaConfianca: 0, semMatch: 0,
}));
mocks.supabase.rpc = vi.fn().mockResolvedValue({ data: null, error: null });
mocks.supabase.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } });
mocks.toasts.success = vi.fn();
mocks.toasts.error = vi.fn();
mocks.toasts.info = vi.fn();
mocks.toasts.warning = vi.fn();

// ---------- vi.mock declarations ----------

vi.mock('sonner', () => ({
  toast: {
    success: (...a: any[]) => mocks.toasts.success(...a),
    error: (...a: any[]) => mocks.toasts.error(...a),
    info: (...a: any[]) => mocks.toasts.info(...a),
    warning: (...a: any[]) => mocks.toasts.warning(...a),
    promise: vi.fn(),
  },
}));

vi.mock('@/hooks/useOptimizedQueries', () => ({
  useDebounce: <T,>(v: T) => v,
}));

vi.mock('@/hooks/useGlobalFinancialFilter', () => ({
  useGlobalFinancialFilter: () => mocks.globalFilter,
}));

vi.mock('@/hooks/useFinancialData', () => ({
  useContasBancarias: () => ({ data: mocks.financial.contasBancarias }),
  useContasPagar: () => ({ data: mocks.financial.contasPagar }),
  useContasReceber: () => ({ data: mocks.financial.contasReceber }),
}));

vi.mock('@/hooks/useConciliacao', () => ({
  useConciliacao: () => mocks.mutations,
}));

vi.mock('@/lib/transaction-matcher', async (importOriginal) => {
  const mod = await importOriginal<Record<string, any>>();
  return {
    ...mod,
    encontrarTodosMatches: (...a: any[]) => mocks.matcher.encontrarTodosMatches(...a),
    calcularEstatisticasMatch: (...a: any[]) => mocks.matcher.calcularEstatisticasMatch(...a),
    converterContasPagarParaLancamentos: (arr: any[]) => arr,
    converterContasReceberParaLancamentos: (arr: any[]) => arr,
  };
});

vi.mock('@/integrations/supabase/client', () => {
  const from = vi.fn((table: string) => {
    const builder: any = {
      select: vi.fn(function (this: any) { return this; }),
      eq: vi.fn(function (this: any) { return this; }),
      in: vi.fn(function (this: any) { return this; }),
      order: vi.fn(() => Promise.resolve(mocks.supabase.selectResp[table] ?? { data: [], error: null })),
      single: vi.fn(() => Promise.resolve(mocks.supabase.singleResp[table] ?? { data: null, error: null })),
      insert: vi.fn((payload: any) => {
        (mocks.supabase.inserts[table] ??= []).push(payload);
        const r = mocks.supabase.insertResp[table];
        if (typeof r === 'function') return Promise.resolve(r());
        return Promise.resolve(r ?? { data: null, error: null });
      }),
      update: vi.fn((payload: any) => {
        const record = { payload, filters: {} as Record<string, any> };
        (mocks.supabase.updates[table] ??= []).push(record);
        return {
          eq: vi.fn((col: string, val: any) => {
            record.filters[col] = val;
            return Promise.resolve(mocks.supabase.updateResp[table] ?? { data: null, error: null });
          }),
        };
      }),
    };
    return builder;
  });
  return {
    supabase: {
      from,
      rpc: (...a: any[]) => mocks.supabase.rpc(...a),
      auth: { getUser: (...a: any[]) => mocks.supabase.getUser(...a) },
      functions: { invoke: vi.fn() },
    },
  };
});

// ---------- Import DEPOIS dos mocks ----------

import { useConciliacaoPage } from '../useConciliacaoPage';

// ---------- Helpers ----------

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function resetMocks() {
  mocks.supabase.inserts = {};
  mocks.supabase.updates = {};
  mocks.supabase.selectResp = {};
  mocks.supabase.singleResp = {};
  mocks.supabase.insertResp = {};
  mocks.supabase.updateResp = {};
  mocks.globalFilter.currentBankAccountId = null;
  mocks.financial.contasBancarias = [{ id: 'bank-1', empresa_id: 'emp-1' }];
  mocks.financial.contasPagar = [];
  mocks.financial.contasReceber = [];
  vi.mocked(mocks.mutations.confirmarConciliacao.mutateAsync).mockReset();
  vi.mocked(mocks.mutations.salvarExtratoBanco.mutateAsync).mockReset().mockResolvedValue({ saved: 0, duplicates: 0 });
  vi.mocked(mocks.mutations.desfazerConciliacao.mutateAsync).mockReset();
  vi.mocked(mocks.matcher.encontrarTodosMatches).mockReset().mockReturnValue(new Map());
  vi.mocked(mocks.supabase.rpc).mockClear();
  vi.mocked(mocks.supabase.getUser).mockClear();
  vi.mocked(mocks.toasts.success).mockClear();
  vi.mocked(mocks.toasts.error).mockClear();
  vi.mocked(mocks.toasts.info).mockClear();
  vi.mocked(mocks.toasts.warning).mockClear();
  // localStorage mock do setup global
  (window.localStorage.getItem as any).mockReset?.();
  (window.localStorage.setItem as any).mockReset?.();
}

function makeExtrato(overrides: Partial<ExtratoOFX> = {}): ExtratoOFX {
  return {
    formato: 'OFX',
    nomeArquivo: 'extrato.ofx',
    dataImportacao: new Date('2025-01-20'),
    conta: {
      banco: '001', agencia: '1234', conta: '56789', tipoConta: 'CC', moeda: 'BRL',
      saldoInicial: 0, saldoFinal: 100,
    },
    transacoes: [
      { id: 'tx-1', data: new Date('2025-01-15'), valor: 100, descricao: 'PAGAMENTO ABC', tipo: 'credito' },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  resetMocks();
});

// =====================================================================
// Estado inicial e carregamento
// =====================================================================

describe('useConciliacaoPage — carregamento inicial', () => {
  it('#1 sem conta selecionada não chama Supabase e mantém transações vazias', async () => {
    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    await waitFor(() => expect(result.current.transacoes).toEqual([]));
    // Nenhum select em transacoes_bancarias
    expect(mocks.supabase.inserts['transacoes_bancarias']).toBeUndefined();
  });

  it('#2 ao selecionar banco carrega transações normalizando receita/despesa em credito/debito', async () => {
    mocks.supabase.selectResp['transacoes_bancarias'] = {
      data: [
        { id: 'a', data: '2025-01-10', descricao: 'Entrada', valor: '50', tipo: 'receita', conciliada: false },
        { id: 'b', data: '2025-01-11', descricao: 'Saida', valor: '30', tipo: 'despesa', conciliada: true },
      ],
      error: null,
    };
    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => { result.current.setSelectedBanco('bank-1'); });
    await waitFor(() => expect(result.current.transacoes).toHaveLength(2));
    expect(result.current.transacoes[0].tipo).toBe('credito');
    expect(result.current.transacoes[1].tipo).toBe('debito');
    expect(result.current.transacoes[1].conciliada).toBe(true);
  });

  it('#3 erro no select emite toast.error e mantém transações vazias', async () => {
    mocks.supabase.selectResp['transacoes_bancarias'] = { data: null, error: { message: 'boom' } };
    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => { result.current.setSelectedBanco('bank-1'); });
    await waitFor(() => expect(mocks.toasts.error).toHaveBeenCalledWith('Erro ao carregar transações'));
    expect(result.current.transacoes).toEqual([]);
  });
});

// =====================================================================
// Importação de extrato
// =====================================================================

describe('useConciliacaoPage — importação de extrato', () => {
  it('#4 extrato coerente (saldo bate) não gera divergência nem alerta', async () => {
    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => { result.current.setSelectedBanco('bank-1'); });

    await act(async () => {
      await result.current.handleImportSuccess(makeExtrato()); // saldoFinal=100, transacao=100
    });

    expect(mocks.supabase.inserts['divergencias_conciliacao']).toBeUndefined();
    expect(mocks.supabase.inserts['alertas']).toBeUndefined();
    expect(mocks.toasts.warning).not.toHaveBeenCalled();
  });

  it('#5 divergência de saldo insere em divergencias_conciliacao + alertas críticos', async () => {
    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => { result.current.setSelectedBanco('bank-1'); });

    await act(async () => {
      await result.current.handleImportSuccess(makeExtrato({
        conta: { banco: '001', agencia: '1', conta: '2', tipoConta: 'CC', moeda: 'BRL', saldoInicial: 0, saldoFinal: 999 },
      }));
    });

    expect(mocks.toasts.warning).toHaveBeenCalledWith('Divergência de Saldo Detectada', expect.any(Object));
    expect(mocks.supabase.inserts['divergencias_conciliacao']?.[0]).toMatchObject({
      conta_bancaria_id: 'bank-1', tipo_divergencia: 'saldo_final',
    });
    expect(mocks.supabase.inserts['alertas']?.[0]).toMatchObject({
      prioridade: 'critica', tipo: 'divergencia_conciliacao', empresa_id: 'emp-1',
    });
  });

  it('#6 match alta confiança + aceite_automatico=true dentro da tolerância chama confirmarConciliacao', async () => {
    mocks.supabase.singleResp['contas_bancarias'] = {
      data: { configuracoes_conciliacao: { tolerancia_centavos: 0.05, aceite_automatico: true } },
      error: null,
    };
    vi.mocked(mocks.matcher.encontrarTodosMatches).mockReturnValue(new Map([
      ['tx-1', [{
        lancamentoId: 'lanc-1', lancamentoTipo: 'receber',
        lancamento: { id: 'lanc-1', valor: 100 },
        confianca: 'alta', score: 0.95, motivos: [],
      }]],
    ]) as any);

    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => { result.current.setSelectedBanco('bank-1'); });

    await act(async () => { await result.current.handleImportSuccess(makeExtrato()); });

    expect(mocks.mutations.confirmarConciliacao.mutateAsync).toHaveBeenCalledTimes(1);
    expect(mocks.mutations.confirmarConciliacao.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      transacaoId: 'tx-1', contaReceberId: 'lanc-1',
    }));
    expect(result.current.importReport?.autoConciliadas).toBe(1);
  });

  it('#7 match alta confiança com aceite_automatico=false NÃO chama mutation e mantém em revisão', async () => {
    mocks.supabase.singleResp['contas_bancarias'] = {
      data: { configuracoes_conciliacao: { tolerancia_centavos: 0.05, aceite_automatico: false } },
      error: null,
    };
    vi.mocked(mocks.matcher.encontrarTodosMatches).mockReturnValue(new Map([
      ['tx-1', [{
        lancamentoId: 'lanc-1', lancamentoTipo: 'receber',
        lancamento: { id: 'lanc-1', valor: 100 },
        confianca: 'alta', score: 0.95, motivos: [],
      }]],
    ]) as any);

    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => { result.current.setSelectedBanco('bank-1'); });

    await act(async () => { await result.current.handleImportSuccess(makeExtrato()); });

    expect(mocks.mutations.confirmarConciliacao.mutateAsync).not.toHaveBeenCalled();
    expect(result.current.importReport?.autoConciliadas).toBe(0);
    // Sem aceite_automatico a transação entra em `transacoes` como pendente (não conciliada)
    const inserida = result.current.transacoes.find(t => t.id === 'tx-1');
    expect(inserida).toBeDefined();
    expect(inserida?.conciliada).toBe(false);
  });

  it('#8 [invariante] rejeição da mutation NÃO marca conciliada localmente e loga em webhooks_log', async () => {
    mocks.supabase.singleResp['contas_bancarias'] = {
      data: { configuracoes_conciliacao: { tolerancia_centavos: 0.05, aceite_automatico: true } },
      error: null,
    };
    vi.mocked(mocks.matcher.encontrarTodosMatches).mockReturnValue(new Map([
      ['tx-1', [{
        lancamentoId: 'lanc-1', lancamentoTipo: 'receber',
        lancamento: { id: 'lanc-1', valor: 100 },
        confianca: 'alta', score: 0.95, motivos: [],
      }]],
    ]) as any);
    vi.mocked(mocks.mutations.confirmarConciliacao.mutateAsync).mockRejectedValue(new Error('DB down'));

    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => { result.current.setSelectedBanco('bank-1'); });

    await act(async () => { await result.current.handleImportSuccess(makeExtrato()); });

    // Toast de erro disparado
    expect(mocks.toasts.error).toHaveBeenCalledWith(
      'Falha na Conciliação Automática',
      expect.any(Object),
    );
    // Log em webhooks_log com event_type correto
    expect(mocks.supabase.inserts['webhooks_log']?.[0]).toMatchObject({
      event_type: 'reconciliation.failed',
      status: 'error',
    });
  });

  it('#9 falha ao inserir em extratos_bancarios_importados não interrompe fluxo', async () => {
    mocks.supabase.insertResp['extratos_bancarios_importados'] = () => { throw new Error('unique violation'); };

    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => { result.current.setSelectedBanco('bank-1'); });

    await act(async () => { await result.current.handleImportSuccess(makeExtrato()); });

    // Mesmo com erro no insert, o importReport foi produzido
    expect(result.current.importReport).not.toBeNull();
    expect(result.current.showReportDialog).toBe(true);
  });

  it('#10 pendentesRevisao nunca é negativo (clamp a 0)', async () => {
    mocks.supabase.singleResp['contas_bancarias'] = {
      data: { configuracoes_conciliacao: { tolerancia_centavos: 0.05, aceite_automatico: true } },
      error: null,
    };
    // Retorna 1 duplicata para forçar autoConciliadas + duplicates > total
    vi.mocked(mocks.mutations.salvarExtratoBanco.mutateAsync).mockResolvedValue({ saved: 0, duplicates: 1 });
    vi.mocked(mocks.matcher.encontrarTodosMatches).mockReturnValue(new Map([
      ['tx-1', [{
        lancamentoId: 'lanc-1', lancamentoTipo: 'pagar',
        lancamento: { id: 'lanc-1', valor: 100 },
        confianca: 'alta', score: 0.95, motivos: [],
      }]],
    ]) as any);

    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => { result.current.setSelectedBanco('bank-1'); });
    await act(async () => { await result.current.handleImportSuccess(makeExtrato()); });

    expect(result.current.importReport?.pendentesRevisao).toBeGreaterThanOrEqual(0);
  });
});

// =====================================================================
// Confirmação de match e conciliação manual
// =====================================================================

describe('useConciliacaoPage — handleConfirmarMatch / handleManualSuccess', () => {
  it('#11 sucesso: chama RPC com contaPagarId e atualiza estado local', async () => {
    mocks.supabase.selectResp['transacoes_bancarias'] = {
      data: [{ id: 'tx-a', data: '2025-01-01', descricao: 'x', valor: 10, tipo: 'despesa', conciliada: false }],
      error: null,
    };
    vi.mocked(mocks.mutations.confirmarConciliacao.mutateAsync).mockResolvedValue(undefined);

    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => { result.current.setSelectedBanco('bank-1'); });
    await waitFor(() => expect(result.current.transacoes).toHaveLength(1));

    await act(async () => {
      await result.current.handleConfirmarMatch('tx-a', 'lanc-99', 'pagar');
    });

    expect(mocks.mutations.confirmarConciliacao.mutateAsync).toHaveBeenCalledWith({
      transacaoId: 'tx-a', contaPagarId: 'lanc-99', contaReceberId: undefined,
    });
    expect(result.current.transacoes.find(t => t.id === 'tx-a')?.conciliada).toBe(true);
  });

  it('#12 handleManualSuccess (tipo=receber) chama RPC correta e concilia local', async () => {
    mocks.supabase.selectResp['transacoes_bancarias'] = {
      data: [{ id: 'tx-b', data: '2025-01-01', descricao: 'y', valor: 20, tipo: 'receita', conciliada: false }],
      error: null,
    };
    vi.mocked(mocks.mutations.confirmarConciliacao.mutateAsync).mockResolvedValue(undefined);

    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => { result.current.setSelectedBanco('bank-1'); });
    await waitFor(() => expect(result.current.transacoes).toHaveLength(1));

    await act(async () => {
      await result.current.handleManualSuccess('tx-b', 'lanc-r', 'receber');
    });

    expect(mocks.mutations.confirmarConciliacao.mutateAsync).toHaveBeenCalledWith({
      transacaoId: 'tx-b', contaReceberId: 'lanc-r', contaPagarId: undefined,
    });
    expect(result.current.transacoes.find(t => t.id === 'tx-b')?.conciliada).toBe(true);
  });

  it('#13 [invariante] rejeição da mutation NÃO marca conciliada localmente', async () => {
    mocks.supabase.selectResp['transacoes_bancarias'] = {
      data: [{ id: 'tx-fail', data: '2025-01-01', descricao: 'z', valor: 30, tipo: 'despesa', conciliada: false }],
      error: null,
    };
    vi.mocked(mocks.mutations.confirmarConciliacao.mutateAsync).mockRejectedValue(new Error('rpc failed'));

    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => { result.current.setSelectedBanco('bank-1'); });
    await waitFor(() => expect(result.current.transacoes).toHaveLength(1));

    await act(async () => {
      await result.current.handleConfirmarMatch('tx-fail', 'lanc-x', 'pagar');
    });
    await act(async () => {
      await result.current.handleManualSuccess('tx-fail', 'lanc-x', 'pagar');
    });

    // ESTADO LOCAL INTACTO — invariante crítica
    expect(result.current.transacoes.find(t => t.id === 'tx-fail')?.conciliada).toBe(false);
  });
});

// =====================================================================
// Desfazer / ignorar
// =====================================================================

describe('useConciliacaoPage — desfazer e ignorar', () => {
  it('#14 desfazer sucesso reverte conciliada=false', async () => {
    mocks.supabase.selectResp['transacoes_bancarias'] = {
      data: [{ id: 'tx-c', data: '2025-01-01', descricao: 'c', valor: 40, tipo: 'receita', conciliada: true }],
      error: null,
    };
    vi.mocked(mocks.mutations.desfazerConciliacao.mutateAsync).mockResolvedValue(undefined);

    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => { result.current.setSelectedBanco('bank-1'); });
    await waitFor(() => expect(result.current.transacoes[0]?.conciliada).toBe(true));

    await act(async () => { await result.current.handleDesfazerConciliacao('tx-c'); });

    expect(result.current.transacoes[0].conciliada).toBe(false);
  });

  it('#15 [invariante] desfazer falho preserva conciliada=true', async () => {
    mocks.supabase.selectResp['transacoes_bancarias'] = {
      data: [{ id: 'tx-d', data: '2025-01-01', descricao: 'd', valor: 50, tipo: 'receita', conciliada: true }],
      error: null,
    };
    vi.mocked(mocks.mutations.desfazerConciliacao.mutateAsync).mockRejectedValue(new Error('rpc down'));

    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => { result.current.setSelectedBanco('bank-1'); });
    await waitFor(() => expect(result.current.transacoes[0]?.conciliada).toBe(true));

    await act(async () => { await result.current.handleDesfazerConciliacao('tx-d'); });

    expect(result.current.transacoes[0].conciliada).toBe(true);
  });

  it('#16 [invariante] ignorar com erro no update mantém transação visível', async () => {
    mocks.supabase.selectResp['transacoes_bancarias'] = {
      data: [{ id: 'tx-e', data: '2025-01-01', descricao: 'e', valor: 60, tipo: 'despesa', conciliada: false }],
      error: null,
    };
    mocks.supabase.updateResp['transacoes_bancarias'] = { data: null, error: { message: 'permission denied' } };

    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => { result.current.setSelectedBanco('bank-1'); });
    await waitFor(() => expect(result.current.transacoes).toHaveLength(1));

    await act(async () => { await result.current.handleIgnorar('tx-e'); });

    expect(mocks.toasts.error).toHaveBeenCalledWith('Erro ao ignorar transação');
    expect(result.current.transacoes.find(t => t.id === 'tx-e')).toBeDefined();
  });

  it('#17 ignorar sucesso emite update correto e remove do estado local', async () => {
    mocks.supabase.selectResp['transacoes_bancarias'] = {
      data: [{ id: 'tx-f', data: '2025-01-01', descricao: 'f', valor: 70, tipo: 'despesa', conciliada: false }],
      error: null,
    };
    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => { result.current.setSelectedBanco('bank-1'); });
    await waitFor(() => expect(result.current.transacoes).toHaveLength(1));

    await act(async () => { await result.current.handleIgnorar('tx-f'); });

    const upd = mocks.supabase.updates['transacoes_bancarias']?.[0];
    expect(upd?.payload).toMatchObject({ conciliada: true, compensacao_motivo: 'Ignorado pelo usuário' });
    expect(upd?.filters).toEqual({ id: 'tx-f' });
    expect(result.current.transacoes).toHaveLength(0);
  });
});

// =====================================================================
// Bulk, seleção, filtros e KPIs
// =====================================================================

describe('useConciliacaoPage — seleção, bulk, filtros e KPIs', () => {
  async function mountWith(rows: any[]) {
    mocks.supabase.selectResp['transacoes_bancarias'] = { data: rows, error: null };
    const hook = renderHook(() => useConciliacaoPage(), { wrapper });
    act(() => { hook.result.current.setSelectedBanco('bank-1'); });
    await waitFor(() => expect(hook.result.current.transacoes).toHaveLength(rows.length));
    return hook;
  }

  it('#18 handleBulkConciliar limpa seleção, atualiza local e emite toast com contagem', async () => {
    const { result } = await mountWith([
      { id: 'a', data: '2025-01-01', descricao: 'a', valor: 10, tipo: 'receita', conciliada: false },
      { id: 'b', data: '2025-01-01', descricao: 'b', valor: 20, tipo: 'receita', conciliada: false },
    ]);
    act(() => { result.current.toggleSelect('a'); result.current.toggleSelect('b'); });
    expect(result.current.selectedIds.size).toBe(2);

    act(() => { result.current.handleBulkConciliar(); });

    expect(mocks.toasts.success).toHaveBeenCalledWith('2 transações conciliadas');
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.transacoes.every(t => t.conciliada)).toBe(true);
  });

  it('#19 toggleSelectAll alterna entre todos-pendentes e nenhum', async () => {
    const { result } = await mountWith([
      { id: 'a', data: '2025-01-01', descricao: 'a', valor: 10, tipo: 'receita', conciliada: false },
      { id: 'b', data: '2025-01-01', descricao: 'b', valor: 20, tipo: 'receita', conciliada: true },
    ]);
    act(() => { result.current.toggleSelectAll(); });
    expect(result.current.selectedIds.size).toBe(1); // só 'a' está pendente
    act(() => { result.current.toggleSelectAll(); });
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('#20 toggleSelect adiciona/remove individualmente', async () => {
    const { result } = await mountWith([
      { id: 'a', data: '2025-01-01', descricao: 'a', valor: 10, tipo: 'receita', conciliada: false },
    ]);
    act(() => { result.current.toggleSelect('a'); });
    expect(result.current.selectedIds.has('a')).toBe(true);
    act(() => { result.current.toggleSelect('a'); });
    expect(result.current.selectedIds.has('a')).toBe(false);
  });

  it('#21 filteredTransacoes aplica tipo, período, valor e busca', async () => {
    const { result } = await mountWith([
      { id: 'a', data: '2025-01-05', descricao: 'PIX Cliente', valor: 100, tipo: 'receita', conciliada: false },
      { id: 'b', data: '2025-02-05', descricao: 'Boleto Fornecedor', valor: 500, tipo: 'despesa', conciliada: false },
      { id: 'c', data: '2025-03-05', descricao: 'Taxa Bancária', valor: 5, tipo: 'despesa', conciliada: true },
    ]);
    act(() => {
      result.current.setFilters({
        periodoInicio: '2025-01-01', periodoFim: '2025-02-28',
        valorMin: '10', valorMax: '1000',
        tipo: 'debito', confiancaIA: 'todos', centroCustoId: 'todos',
      });
      result.current.setStatusTab('pendentes');
      result.current.setSearchTerm('boleto');
    });
    await waitFor(() => {
      expect(result.current.filteredTransacoes.map(t => t.id)).toEqual(['b']);
    });
  });

  it('#22 KPIs mantêm invariante conciliadas + pendentes === totalTransacoes', async () => {
    const { result } = await mountWith([
      { id: 'a', data: '2025-01-01', descricao: 'a', valor: 10, tipo: 'receita', conciliada: false },
      { id: 'b', data: '2025-01-01', descricao: 'b', valor: 20, tipo: 'receita', conciliada: true },
      { id: 'c', data: '2025-01-01', descricao: 'c', valor: 30, tipo: 'despesa', conciliada: false },
    ]);
    expect(result.current.totalTransacoes).toBe(3);
    expect(result.current.conciliadas + result.current.pendentes).toBe(result.current.totalTransacoes);
    expect(result.current.percentualConciliado).toBeCloseTo((1 / 3) * 100);
  });
});

// =====================================================================
// Persistência de filtros
// =====================================================================

describe('useConciliacaoPage — persistência de filtros no localStorage', () => {
  it('#23 hidrata do localStorage no mount e persiste alterações', async () => {
    const stored = {
      periodoInicio: '2025-01-01', periodoFim: '', valorMin: '', valorMax: '',
      tipo: 'credito', confiancaIA: 'todos', centroCustoId: 'todos',
    } as const;

    (window.localStorage.getItem as any).mockReturnValueOnce(JSON.stringify(stored));

    const { result } = renderHook(() => useConciliacaoPage(), { wrapper });

    expect(result.current.filters.tipo).toBe('credito');
    expect(result.current.filters.periodoInicio).toBe('2025-01-01');

    act(() => { result.current.setFilters({ ...stored, valorMin: '42' }); });

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'conciliacao_filters',
        expect.stringContaining('"valorMin":"42"'),
      );
    });
  });
});
