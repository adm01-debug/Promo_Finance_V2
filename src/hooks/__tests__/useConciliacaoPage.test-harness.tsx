import { vi } from 'vitest';

const internalMocks = vi.hoisted(() => ({
  mutations: {
    confirmarConciliacao: { mutateAsync: undefined as any },
    salvarExtratoBanco: { mutateAsync: undefined as any },
    desfazerConciliacao: { mutateAsync: undefined as any },
  },
  globalFilter: {
    currentBankAccountId: null as string | null,
    currentEmpresaId: null as string | null,
  },
  financial: {
    contasBancarias: [{ id: 'bank-1', empresa_id: 'emp-1' }],
    contasPagar: [] as any[],
    contasReceber: [] as any[],
  },
  matcher: { encontrarTodosMatches: undefined as any, calcularEstatisticasMatch: undefined as any },
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
}));

export const mocks = internalMocks;

mocks.mutations.confirmarConciliacao.mutateAsync = vi.fn();
mocks.mutations.salvarExtratoBanco.mutateAsync = vi.fn();
mocks.mutations.desfazerConciliacao.mutateAsync = vi.fn();
mocks.matcher.encontrarTodosMatches = vi.fn();
mocks.matcher.calcularEstatisticasMatch = vi.fn(() => ({
  total: 0,
  comMatch: 0,
  altaConfianca: 0,
  mediaConfianca: 0,
  baixaConfianca: 0,
  semMatch: 0,
}));
mocks.supabase.rpc = vi.fn().mockResolvedValue({ data: null, error: null });
mocks.supabase.getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } });
mocks.toasts.success = vi.fn();
mocks.toasts.error = vi.fn();
mocks.toasts.info = vi.fn();
mocks.toasts.warning = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (...args: any[]) => mocks.toasts.success(...args),
    error: (...args: any[]) => mocks.toasts.error(...args),
    info: (...args: any[]) => mocks.toasts.info(...args),
    warning: (...args: any[]) => mocks.toasts.warning(...args),
    promise: vi.fn(),
  },
}));
vi.mock('@/hooks/useOptimizedQueries', () => ({ useDebounce: <T,>(value: T) => value }));
vi.mock('@/hooks/useGlobalFinancialFilter', () => ({
  useGlobalFinancialFilter: () => mocks.globalFilter,
}));
vi.mock('@/hooks/useFinancialData', () => ({
  useContasBancarias: () => ({ data: mocks.financial.contasBancarias }),
  useContasPagar: () => ({ data: mocks.financial.contasPagar }),
  useContasReceber: () => ({ data: mocks.financial.contasReceber }),
}));
vi.mock('@/hooks/useConciliacao', () => ({ useConciliacao: () => mocks.mutations }));
vi.mock('@/lib/transaction-matcher', async (importOriginal) => ({
  ...(await importOriginal<Record<string, any>>()),
  encontrarTodosMatches: (...args: any[]) => mocks.matcher.encontrarTodosMatches(...args),
  calcularEstatisticasMatch: (...args: any[]) => mocks.matcher.calcularEstatisticasMatch(...args),
  converterContasPagarParaLancamentos: (items: any[]) => items,
  converterContasReceberParaLancamentos: (items: any[]) => items,
}));
vi.mock('@/integrations/supabase/client', () => {
  const from = vi.fn((table: string) => {
    const builder: any = {
      select: vi.fn(function (this: any) {
        return this;
      }),
      eq: vi.fn(function (this: any) {
        return this;
      }),
      in: vi.fn(function (this: any) {
        return this;
      }),
      limit: vi.fn(function (this: any) {
        return this;
      }),
      order: vi.fn(() =>
        Promise.resolve(mocks.supabase.selectResp[table] ?? { data: [], error: null })
      ),
      single: vi.fn(() =>
        Promise.resolve(mocks.supabase.singleResp[table] ?? { data: null, error: null })
      ),
      insert: vi.fn((payload: any) => {
        (mocks.supabase.inserts[table] ??= []).push(payload);
        const response = mocks.supabase.insertResp[table];
        if (typeof response === 'function') return Promise.resolve(response());
        return Promise.resolve(response ?? { data: null, error: null });
      }),
      update: vi.fn((payload: any) => {
        const record = { payload, filters: {} as Record<string, any> };
        (mocks.supabase.updates[table] ??= []).push(record);
        return {
          eq: vi.fn((column: string, value: any) => {
            record.filters[column] = value;
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
      rpc: (...args: any[]) => mocks.supabase.rpc(...args),
      auth: { getUser: (...args: any[]) => mocks.supabase.getUser(...args) },
      functions: { invoke: vi.fn() },
    },
  };
});

export function resetConciliacaoPageMocks() {
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
  vi.mocked(mocks.mutations.salvarExtratoBanco.mutateAsync)
    .mockReset()
    .mockResolvedValue({ saved: 0, duplicates: 0 });
  vi.mocked(mocks.mutations.desfazerConciliacao.mutateAsync).mockReset();
  vi.mocked(mocks.matcher.encontrarTodosMatches).mockReset().mockReturnValue(new Map());
  vi.mocked(mocks.supabase.rpc).mockClear();
  vi.mocked(mocks.supabase.getUser).mockClear();
  vi.mocked(mocks.toasts.success).mockClear();
  vi.mocked(mocks.toasts.error).mockClear();
  vi.mocked(mocks.toasts.info).mockClear();
  vi.mocked(mocks.toasts.warning).mockClear();
  (window.localStorage.getItem as any).mockReset?.();
  (window.localStorage.setItem as any).mockReset?.();
}
