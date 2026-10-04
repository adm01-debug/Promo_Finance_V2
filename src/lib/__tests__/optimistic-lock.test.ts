/**
 * Testes do lock otimista de edições concorrentes (updateComLockOtimista).
 * Simula o banco com um store mínimo que reproduz o trigger moddatetime:
 * todo UPDATE muda updated_at, então um update com versão defasada casa 0
 * linhas — exatamente o que o PostgREST faria com `.eq('updated_at', visto)`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

type Row = { id: string; descricao: string; updated_at: string };
const store = new Map<string, Map<string, Row>>();
// Simula a RLS negando escrita: leitura continua vendo a linha, update casa 0.
const denyWrites = new Set<string>();

function bump() {
  return new Date().toISOString();
}

function makeBuilder(tabela: string, patch: Record<string, unknown>) {
  const filters: Array<[string, unknown]> = [];
  const chain: any = {
    eq(col: string, val: unknown) {
      filters.push([col, val]);
      return chain;
    },
    select() {
      return chain;
    },
    then(resolve: (v: any) => void) {
      const rows = [...(store.get(tabela)?.values() ?? [])];
      const matched = denyWrites.has(tabela)
        ? []
        : rows.filter((r) => filters.every(([col, val]) => (r as any)[col] === val));
      matched.forEach((r) => {
        Object.assign(r, patch);
        r.updated_at = bump(); // trigger moddatetime
      });
      resolve({ data: matched.map((r) => ({ id: r.id })), error: null });
    },
  };
  return chain;
}

function makeSelect(tabela: string) {
  const filters: Array<[string, unknown]> = [];
  const chain: any = {
    eq(col: string, val: unknown) {
      filters.push([col, val]);
      return chain;
    },
    maybeSingle() {
      const rows = [...(store.get(tabela)?.values() ?? [])];
      const matched = rows.find((r) => filters.every(([col, val]) => (r as any)[col] === val));
      return Promise.resolve({
        data: matched ? { updated_at: matched.updated_at } : null,
        error: null,
      });
    },
  };
  return chain;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (tabela: string) => ({
      update: (patch: Record<string, unknown>) => makeBuilder(tabela, patch),
      select: () => makeSelect(tabela),
    }),
  },
}));

const { updateComLockOtimista, ConflitoVersaoError } = await import('../optimistic-lock');

describe('updateComLockOtimista', () => {
  beforeEach(() => {
    store.clear();
    denyWrites.clear();
    store.set(
      'contas_pagar',
      new Map([['c1', { id: 'c1', descricao: 'original', updated_at: '2026-01-01T00:00:00Z' }]])
    );
  });

  it('atualiza quando a versão vista ainda é a atual', async () => {
    await expect(
      updateComLockOtimista('contas_pagar', 'c1', '2026-01-01T00:00:00Z', { descricao: 'novo' })
    ).resolves.toBeUndefined();
    expect(store.get('contas_pagar')?.get('c1')?.descricao).toBe('novo');
  });

  it('rejeita com ConflitoVersaoError quando a linha mudou desde a leitura', async () => {
    // Outra sessão atualizou a linha depois da nossa leitura:
    await updateComLockOtimista('contas_pagar', 'c1', '2026-01-01T00:00:00Z', {
      descricao: 'deles',
    });
    // Nossa versão (que vimos) ficou defasada:
    await expect(
      updateComLockOtimista('contas_pagar', 'c1', '2026-01-01T00:00:00Z', { descricao: 'nosso' })
    ).rejects.toBeInstanceOf(ConflitoVersaoError);
    expect(store.get('contas_pagar')?.get('c1')?.descricao).toBe('deles');
  });

  it('rejeita quando a linha não existe mais (erro genérico, não conflito)', async () => {
    await expect(
      updateComLockOtimista('contas_pagar', 'inexistente', '2026-01-01T00:00:00Z', {
        descricao: 'x',
      })
    ).rejects.toThrow('não existe mais');
  });

  it('distingue negação da RLS de conflito: linha intacta → erro de permissão', async () => {
    denyWrites.add('contas_pagar');
    // A linha continua com o updated_at visto — a escrita simplesmente não
    // casou nada. É RLS/permissão, não alguém que escreveu antes da gente.
    await expect(
      updateComLockOtimista('contas_pagar', 'c1', '2026-01-01T00:00:00Z', { descricao: 'x' })
    ).rejects.toThrow('Sem permissão');
  });

  it('race: primeiro commit vence, segundo com a mesma versão falha', async () => {
    const visto = '2026-01-01T00:00:00Z';
    // Dois usuários leram a mesma linha ao mesmo tempo e salvam:
    await updateComLockOtimista('contas_pagar', 'c1', visto, { descricao: 'usuario-A' });
    await expect(
      updateComLockOtimista('contas_pagar', 'c1', visto, { descricao: 'usuario-B' })
    ).rejects.toBeInstanceOf(ConflitoVersaoError);
    expect(store.get('contas_pagar')?.get('c1')?.descricao).toBe('usuario-A');
  });
});
