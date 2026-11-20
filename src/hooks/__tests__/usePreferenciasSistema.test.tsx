/**
 * Regressão identificada no review da PR #484: o hook expõe `carregado` mas a
 * página não bloqueava edição/salvamento durante a leitura, e erro de leitura
 * marcava como carregado. Salvar antes da leitura concluir (ou após falha)
 * sobrescrevia as preferências persistidas com os defaults.
 *
 * Fix (rodada 3): leitura migrada para TanStack Query — retry/refetchOnReconnect
 * recuperam falha transitória sem remontar a página; erro mantém
 * `falhaLeitura=true` e `carregado=false`; formulário editável durante a
 * consulta e preservado em falha de gravação (sem rollback destrutivo).
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREFERENCIAS_DEFAULT, usePreferenciasSistema } from '../usePreferenciasSistema';

const mocks = vi.hoisted(() => ({
  fromTable: '',
  maybeSingleResp: { data: null, error: null },
  upsertResp: { error: null } as { error: { message: string } | null },
  upsertPayloads: [] as unknown[],
  maybeSingleDeferred: null as null | {
    promise: Promise<{ data: unknown; error: { message: string } | null }>;
    resolve: (v: { data: unknown; error: { message: string } | null }) => void;
  },
  // promessa controlada: quando ativo, o upsert fica pendente até o teste
  // resolver (cobre edição durante a gravação).
  upsertDeferred: null as null | {
    promise: Promise<{ error: { message: string } | null }>;
    resolve: (v: { error: { message: string } | null }) => void;
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-abc' } }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      mocks.fromTable = table;
      const builder: any = {
        select: () => builder,
        eq: () => builder,
        maybeSingle: () => {
          if (mocks.maybeSingleDeferred) {
            return mocks.maybeSingleDeferred.promise;
          }
          return Promise.resolve(mocks.maybeSingleResp);
        },
        upsert: (payload: unknown): Promise<{ error: { message: string } | null }> => {
          mocks.upsertPayloads.push(payload);
          if (mocks.upsertDeferred) {
            // promessa controlada: fica pendente até o teste chamar .resolve
            return mocks.upsertDeferred.promise;
          }
          return Promise.resolve(mocks.upsertResp);
        },
      };
      return builder;
    },
  },
}));

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  // retry desligado no teste: recuperação é exercitada explicitamente via
  // refetchQueries para não deixar timing de retry no teste
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mocks.fromTable = '';
  mocks.maybeSingleResp = { data: null, error: null };
  mocks.maybeSingleDeferred = null;
  mocks.upsertResp = { error: null };
  mocks.upsertPayloads = [];
  mocks.upsertDeferred = null;
});
describe('usePreferenciasSistema — estados de leitura', () => {
  it('carregado=false enquanto a leitura está pendente', () => {
    const { result } = renderHook(() => usePreferenciasSistema(), { wrapper });
    expect(result.current.carregado).toBe(false);
    expect(result.current.falhaLeitura).toBe(false);
  });

  it('carregado=true com os defaults quando não há registro', async () => {
    const { result } = renderHook(() => usePreferenciasSistema(), { wrapper });
    await waitFor(() => expect(result.current.carregado).toBe(true));
    expect(result.current.preferencias).toEqual(PREFERENCIAS_DEFAULT);
    expect(result.current.falhaLeitura).toBe(false);
  });

  it('carrega o payload salvo mesclado aos defaults', async () => {
    mocks.maybeSingleResp = {
      data: { payload: { formatoData: 'yyyy-MM-dd', fusoHorario: 'America/Manaus' } },
      error: null,
    };
    const { result } = renderHook(() => usePreferenciasSistema(), { wrapper });
    await waitFor(() => expect(result.current.carregado).toBe(true));
    expect(result.current.preferencias.formatoData).toBe('yyyy-MM-dd');
    expect(result.current.preferencias.fusoHorario).toBe('America/Manaus');
    // campos não persistidos continuam com default
    expect(result.current.preferencias.frequenciaBackup).toBe('diario');
  });

  it('erro de leitura marca falhaLeitura e NÃO marca carregado', async () => {
    mocks.maybeSingleResp = { data: null, error: { message: 'conexão indisponível' } };
    const { result } = renderHook(() => usePreferenciasSistema(), { wrapper });
    await waitFor(() => expect(result.current.falhaLeitura).toBe(true));
    expect(result.current.carregado).toBe(false);
  });

  it('falha transitória recupera via refetch sem remontar o formulário', async () => {
    mocks.maybeSingleResp = { data: null, error: { message: 'rede' } };
    const { result } = renderHook(() => usePreferenciasSistema(), { wrapper });
    await waitFor(() => expect(result.current.falhaLeitura).toBe(true));
    expect(result.current.carregado).toBe(false);

    // conexão volta → refetch (equivalente ao refetchOnReconnect do client)
    mocks.maybeSingleResp = { data: null, error: null };
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: ['user_preferences'] });
    });
    await waitFor(() => expect(result.current.carregado).toBe(true));
    expect(result.current.falhaLeitura).toBe(false);

    // salvar volta a funcionar sem remontagem
    const res = await act(async () => result.current.salvar(PREFERENCIAS_DEFAULT));
    expect(res.ok).toBe(true);
  });

  it('edição durante a leitura pendente NÃO é sobrescrita quando a leitura chega', async () => {
    // leitura fica pendente (rede lenta) enquanto o usuário já edita
    let resolver!: (v: { data: unknown; error: { message: string } | null }) => void;
    const promise = new Promise<{ data: unknown; error: { message: string } | null }>((r) => {
      resolver = r;
    });
    mocks.maybeSingleDeferred = { promise, resolve: resolver };
    // dados persistidos no banco que o usuário NÃO tocou
    const persistido = { formatoData: 'yyyy-MM-dd', fusoHorario: 'America/Manaus' };

    const { result } = renderHook(() => usePreferenciasSistema(), { wrapper });
    // ainda pendente → usuário edita o tema
    act(() =>
      result.current.setPreferencias((p) => ({ ...(p ?? PREFERENCIAS_DEFAULT), temaEscuro: true }))
    );
    expect(result.current.preferencias.temaEscuro).toBe(true);

    // a leitura chega com payload persistido
    await act(async () => {
      resolver({ data: { payload: persistido }, error: null });
    });
    await waitFor(() => expect(result.current.carregado).toBe(true));

    // edição do usuário preservada; demais campos = dados autoritativos do banco
    expect(result.current.preferencias.temaEscuro).toBe(true);
    expect(result.current.preferencias.formatoData).toBe('yyyy-MM-dd');
    expect(result.current.preferencias.fusoHorario).toBe('America/Manaus');
  });
});

describe('usePreferenciasSistema — salvamento', () => {
  it('recusa salvar enquanto carregado=false (leitura pendente ou falhou)', async () => {
    const { result } = renderHook(() => usePreferenciasSistema(), { wrapper });
    const res = await act(async () =>
      result.current.salvar({ ...PREFERENCIAS_DEFAULT, temaEscuro: true })
    );
    expect(res.ok).toBe(false);
    expect(mocks.upsertPayloads).toHaveLength(0);
  });

  it('grava o payload completo após a leitura concluir com sucesso', async () => {
    const { result } = renderHook(() => usePreferenciasSistema(), { wrapper });
    await waitFor(() => expect(result.current.carregado).toBe(true));
    const novas = { ...PREFERENCIAS_DEFAULT, temaEscuro: true };
    const res = await act(async () => result.current.salvar(novas));
    expect(res.ok).toBe(true);
    expect(mocks.upsertPayloads).toHaveLength(1);
    const payload = mocks.upsertPayloads[0] as { user_id: string; key: string; payload: unknown };
    expect(payload.user_id).toBe('user-abc');
    expect(payload.key).toBe('configuracoes.sistema');
    expect(payload.payload).toEqual(novas);
    // cache atualizado com o payload confirmado (sem isso, reabrir a página
    // volta com valores antigos e um novo save regrava defaults — achado
    // Devin/Codex na #484)
    const cached = queryClient.getQueryData([
      'user_preferences',
      'user-abc',
      'configuracoes.sistema',
    ]);
    expect(cached).toEqual(novas);
  });

  it('não grava nada quando a leitura falhou', async () => {
    mocks.maybeSingleResp = { data: null, error: { message: 'rpc down' } };
    const { result } = renderHook(() => usePreferenciasSistema(), { wrapper });
    await waitFor(() => expect(result.current.falhaLeitura).toBe(true));
    const res = await act(async () => result.current.salvar(PREFERENCIAS_DEFAULT));
    expect(res.ok).toBe(false);
    expect(res.erro).toContain('falhou');
    expect(mocks.upsertPayloads).toHaveLength(0);
  });

  it('erro de upsert rejeita e reporta a mensagem', async () => {
    mocks.upsertResp = { error: { message: 'violação de RLS' } };
    const { result } = renderHook(() => usePreferenciasSistema(), { wrapper });
    await waitFor(() => expect(result.current.carregado).toBe(true));
    const res = await act(async () => result.current.salvar(PREFERENCIAS_DEFAULT));
    expect(res.ok).toBe(false);
    expect(res.erro).toContain('violação de RLS');
  });

  it('falha de gravação preserva o formulário atual (edições posteriores ficam)', async () => {
    mocks.upsertResp = { error: { message: 'rede' } };
    const { result } = renderHook(() => usePreferenciasSistema(), { wrapper });
    await waitFor(() => expect(result.current.carregado).toBe(true));
    // usuário edita tema para escuro e salva; a gravação falha
    act(() =>
      result.current.setPreferencias((p) => ({ ...(p ?? PREFERENCIAS_DEFAULT), temaEscuro: true }))
    );
    const res = await act(async () => result.current.salvar(result.current.preferencias));
    expect(res.ok).toBe(false);
    // o formulário NÃO foi descartado com defaults
    expect(result.current.preferencias.temaEscuro).toBe(true);
    // e edições feitas após o clique também permanecem
    act(() =>
      result.current.setPreferencias((p) => ({
        ...(p ?? PREFERENCIAS_DEFAULT),
        fusoHorario: 'America/Manaus',
      }))
    );
    expect(result.current.preferencias.fusoHorario).toBe('America/Manaus');
  });

  it('edições feitas DURANTE a gravação pendente não são descartadas na falha', async () => {
    // promessa controlada: ativa o deferred do upsert
    let resolver!: (v: { error: { message: string } | null }) => void;
    const promise = new Promise<{ error: { message: string } | null }>((r) => {
      resolver = r;
    });
    mocks.upsertDeferred = { promise, resolve: resolver };

    const { result } = renderHook(() => usePreferenciasSistema(), { wrapper });
    await waitFor(() => expect(result.current.carregado).toBe(true));

    const pendente = result.current.salvar(PREFERENCIAS_DEFAULT);
    // gravação ainda pendente → usuário edita o formulário
    act(() =>
      result.current.setPreferencias((p) => ({
        ...(p ?? PREFERENCIAS_DEFAULT),
        temaEscuro: true,
      }))
    );
    // resolve a gravação com erro
    await act(async () => {
      resolver({ error: { message: 'tls timeout' } });
    });
    const res = await pendente;
    expect(res.ok).toBe(false);
    // edição feita durante a pendência permanece no formulário
    expect(result.current.preferencias.temaEscuro).toBe(true);
  });
});
