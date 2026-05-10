import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client BEFORE importing the runner
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { runBulk, type BulkUserInput } from '../sandbox-bulk-runner';
import { supabase } from '@/integrations/supabase/client';

const invokeMock = supabase.functions.invoke as unknown as ReturnType<typeof vi.fn>;

function mkPreview(over: Record<string, unknown> = {}) {
  return {
    email: 'a***z@empresa.com.br',
    full_name: 'X',
    groups: [],
    domain: 'empresa.com.br',
    domain_allowed: true,
    resolved_role: 'visualizador',
    matched_group: null,
    user_exists: false,
    would_jit_provision: true,
    provision_blocked_reason: null,
    provider_nome: null,
    auto_provision_users: true,
    role_mappings_evaluated: [],
    ...over,
  };
}

function mkSimResult(previewOver: Record<string, unknown> = {}, errors: string[] = []) {
  return {
    data: { preview: mkPreview(previewOver), errors },
    error: null,
  };
}

beforeEach(() => {
  invokeMock.mockReset();
});

describe('runBulk — classification', () => {
  it('classifica seria_jit para usuário novo elegível', async () => {
    invokeMock.mockResolvedValue(mkSimResult());
    const users: BulkUserInput[] = [{ row: 1, claims: { email: 'x@empresa.com.br' } }];
    const res = await runBulk(users, {});
    expect(res[0].outcome).toBe('seria_jit');
    expect(res[0].reason).toBeNull();
  });

  it('classifica usuario_existente quando user_exists=true', async () => {
    invokeMock.mockResolvedValue(mkSimResult({ user_exists: true, would_jit_provision: false }));
    const res = await runBulk([{ row: 1, claims: {} }], {});
    expect(res[0].outcome).toBe('usuario_existente');
  });

  it('classifica sem_email quando email vazio', async () => {
    invokeMock.mockResolvedValue(mkSimResult({ email: '' }));
    const res = await runBulk([{ row: 1, claims: {} }], {});
    expect(res[0].outcome).toBe('sem_email');
    expect(res[0].reason).toMatch(/email/i);
  });

  it('classifica bloqueado quando domínio fora da allowlist', async () => {
    invokeMock.mockResolvedValue(
      mkSimResult({ domain_allowed: false, domain: 'externo.com', would_jit_provision: false }),
    );
    const res = await runBulk([{ row: 1, claims: {} }], {});
    expect(res[0].outcome).toBe('bloqueado');
    expect(res[0].reason).toMatch(/externo\.com/);
  });

  it('classifica bloqueado quando provision_blocked_reason está presente', async () => {
    invokeMock.mockResolvedValue(
      mkSimResult({ would_jit_provision: false, provision_blocked_reason: 'auto_provision desativado' }),
    );
    const res = await runBulk([{ row: 1, claims: {} }], {});
    expect(res[0].outcome).toBe('bloqueado');
    expect(res[0].reason).toBe('auto_provision desativado');
  });

  it('classifica bloqueado quando há errors[]', async () => {
    invokeMock.mockResolvedValue(mkSimResult({}, ['Configuração inválida']));
    const res = await runBulk([{ row: 1, claims: {} }], {});
    expect(res[0].outcome).toBe('bloqueado');
    expect(res[0].reason).toBe('Configuração inválida');
  });

  it('classifica erro_rede quando invoke retorna error', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'timeout' } });
    const res = await runBulk([{ row: 1, claims: {} }], {});
    expect(res[0].outcome).toBe('erro_rede');
    expect(res[0].errorMessage).toBe('timeout');
  });

  it('classifica erro_rede quando invoke lança', async () => {
    invokeMock.mockRejectedValue(new Error('boom'));
    const res = await runBulk([{ row: 1, claims: {} }], {});
    expect(res[0].outcome).toBe('erro_rede');
    expect(res[0].reason).toBe('boom');
  });
});

describe('runBulk — concorrência e progresso', () => {
  it('respeita o limite de concorrência', async () => {
    let active = 0;
    let maxActive = 0;
    invokeMock.mockImplementation(async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 10));
      active--;
      return mkSimResult();
    });
    const users: BulkUserInput[] = Array.from({ length: 10 }, (_, i) => ({ row: i + 1, claims: {} }));
    await runBulk(users, {}, { concurrency: 3 });
    expect(maxActive).toBeLessThanOrEqual(3);
    expect(maxActive).toBeGreaterThan(1);
  });

  it('emite onProgress com done crescente até total', async () => {
    invokeMock.mockResolvedValue(mkSimResult());
    const users: BulkUserInput[] = Array.from({ length: 5 }, (_, i) => ({ row: i + 1, claims: {} }));
    const progress: Array<[number, number]> = [];
    await runBulk(users, {}, { concurrency: 2, onProgress: (d, t) => progress.push([d, t]) });
    expect(progress.length).toBe(5);
    expect(progress[progress.length - 1]).toEqual([5, 5]);
  });

  it('aborta via AbortSignal e não processa restantes', async () => {
    const ctrl = new AbortController();
    invokeMock.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 5));
      return mkSimResult();
    });
    const users: BulkUserInput[] = Array.from({ length: 20 }, (_, i) => ({ row: i + 1, claims: {} }));
    const p = runBulk(users, {}, { concurrency: 2, signal: ctrl.signal });
    setTimeout(() => ctrl.abort(), 8);
    const res = await p;
    expect(res.length).toBeLessThan(20);
  });

  it('clampa concurrency entre 1 e 10', async () => {
    invokeMock.mockResolvedValue(mkSimResult());
    const users: BulkUserInput[] = [{ row: 1, claims: {} }];
    const res = await runBulk(users, {}, { concurrency: 999 });
    expect(res.length).toBe(1);
  });
});
