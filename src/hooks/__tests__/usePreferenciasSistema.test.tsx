/**
 * Regressão identificada no review da PR #484: o hook expõe `carregado` mas a
 * página não bloqueava edição/salvamento durante a leitura, e erro de leitura
 * marcava como carregado. Salvar antes da leitura concluir (ou após falha)
 * sobrescrevia as preferências persistidas com os defaults.
 *
 * Estes testes fixam os três estados: carregando, leitura com registro,
 * leitura sem registro (legítimo) e erro de leitura.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREFERENCIAS_DEFAULT, usePreferenciasSistema } from '../usePreferenciasSistema';

const mocks = vi.hoisted(() => ({
  fromTable: '',
  maybeSingleResp: { data: null, error: null },
  upsertResp: { error: null } as { error: { message: string } | null },
  upsertPayloads: [] as unknown[],
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
        maybeSingle: () => Promise.resolve(mocks.maybeSingleResp),
        upsert: (payload: unknown) => {
          mocks.upsertPayloads.push(payload);
          return Promise.resolve(mocks.upsertResp);
        },
      };
      return builder;
    },
  },
}));

describe('usePreferenciasSistema — estados de leitura', () => {
  beforeEach(() => {
    mocks.fromTable = '';
    mocks.maybeSingleResp = { data: null, error: null };
    mocks.upsertResp = { error: null };
    mocks.upsertPayloads = [];
  });

  it('carregado=false enquanto a leitura está pendente', () => {
    const { result } = renderHook(() => usePreferenciasSistema());
    expect(result.current.carregado).toBe(false);
    expect(result.current.falhaLeitura).toBe(false);
  });

  it('carregado=true com os defaults quando não há registro', async () => {
    const { result } = renderHook(() => usePreferenciasSistema());
    await waitFor(() => expect(result.current.carregado).toBe(true));
    expect(result.current.preferencias).toEqual(PREFERENCIAS_DEFAULT);
    expect(result.current.falhaLeitura).toBe(false);
  });

  it('carrega o payload salvo mesclado aos defaults', async () => {
    mocks.maybeSingleResp = {
      data: { payload: { formatoData: 'yyyy-MM-dd', fusoHorario: 'America/Manaus' } },
      error: null,
    };
    const { result } = renderHook(() => usePreferenciasSistema());
    await waitFor(() => expect(result.current.carregado).toBe(true));
    expect(result.current.preferencias.formatoData).toBe('yyyy-MM-dd');
    expect(result.current.preferencias.fusoHorario).toBe('America/Manaus');
    // campos não persistidos continuam com default
    expect(result.current.preferencias.frequenciaBackup).toBe('diario');
  });

  it('erro de leitura marca falhaLeitura e NÃO marca carregado', async () => {
    mocks.maybeSingleResp = { data: null, error: { message: 'conexão indisponível' } };
    const { result } = renderHook(() => usePreferenciasSistema());
    await waitFor(() => expect(result.current.falhaLeitura).toBe(true));
    expect(result.current.carregado).toBe(false);
  });
});

describe('usePreferenciasSistema — salvamento', () => {
  beforeEach(() => {
    mocks.fromTable = '';
    mocks.maybeSingleResp = { data: null, error: null };
    mocks.upsertResp = { error: null };
    mocks.upsertPayloads = [];
  });

  it('recusa salvar enquanto carregado=false (leitura pendente ou falhou)', async () => {
    const { result } = renderHook(() => usePreferenciasSistema());
    const res = await act(async () =>
      result.current.salvar({ ...PREFERENCIAS_DEFAULT, temaEscuro: true })
    );
    expect(res.ok).toBe(false);
    expect(mocks.upsertPayloads).toHaveLength(0);
  });

  it('grava o payload completo após a leitura concluir com sucesso', async () => {
    const { result } = renderHook(() => usePreferenciasSistema());
    await waitFor(() => expect(result.current.carregado).toBe(true));
    const novas = { ...PREFERENCIAS_DEFAULT, temaEscuro: true };
    const res = await act(async () => result.current.salvar(novas));
    expect(res.ok).toBe(true);
    expect(mocks.upsertPayloads).toHaveLength(1);
    const payload = mocks.upsertPayloads[0] as { user_id: string; key: string; payload: unknown };
    expect(payload.user_id).toBe('user-abc');
    expect(payload.key).toBe('configuracoes.sistema');
    expect(payload.payload).toEqual(novas);
  });

  it('não grava nada na mesa quando a leitura falhou', async () => {
    mocks.maybeSingleResp = { data: null, error: { message: 'rpc down' } };
    const { result } = renderHook(() => usePreferenciasSistema());
    await waitFor(() => expect(result.current.falhaLeitura).toBe(true));
    const res = await act(async () => result.current.salvar(PREFERENCIAS_DEFAULT));
    expect(res.ok).toBe(false);
    expect(mocks.upsertPayloads).toHaveLength(0);
  });

  it('erro de upsert rejeita e reporta a mensagem', async () => {
    mocks.upsertResp = { error: { message: 'violação de RLS' } };
    const { result } = renderHook(() => usePreferenciasSistema());
    await waitFor(() => expect(result.current.carregado).toBe(true));
    const res = await act(async () => result.current.salvar(PREFERENCIAS_DEFAULT));
    expect(res.ok).toBe(false);
    expect(res.erro).toContain('violação de RLS');
  });
});
