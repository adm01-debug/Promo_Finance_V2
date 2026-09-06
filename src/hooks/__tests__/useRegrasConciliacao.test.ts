/**
 * Testes — useRegrasConciliacao
 * Valida normalização de padrão, incremento de contador e criação de novas regras.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const insert = vi.fn().mockResolvedValue({ error: null });
  const order = vi.fn();
  const getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } });
  const fromMock = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
        order,
      })),
    })),
    update: vi.fn(() => ({ eq: updateEq })),
    insert,
  }));
  return { maybeSingle, updateEq, insert, order, getUser, fromMock };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mocks.fromMock,
    auth: { getUser: mocks.getUser },
  },
}));

import { aprenderRegra, aplicarRegras } from '../useRegrasConciliacao';

beforeEach(() => {
  mocks.maybeSingle.mockReset();
  mocks.updateEq.mockClear().mockResolvedValue({ error: null });
  mocks.insert.mockClear().mockResolvedValue({ error: null });
  mocks.order.mockReset();
  mocks.fromMock.mockClear();
});

describe('aprenderRegra', () => {
  it('ignora padrão curto após normalização', async () => {
    await aprenderRegra('  12/07/2026 12  ', 'Ana', 'pagar');
    expect(mocks.fromMock).not.toHaveBeenCalled();
  });

  it('incrementa contador quando regra já existe', async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id: 'r1', vezes_aplicada: 3 } });
    await aprenderRegra('PIX RECEBIDO ANA 15/07/2026 12345', 'Ana', 'receber');
    expect(mocks.updateEq).toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('insere nova regra quando não encontra padrão', async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: null });
    await aprenderRegra('TED PAGAMENTO FORNECEDOR XPTO 999', 'XPTO', 'pagar', 'ent-1');
    expect(mocks.insert).toHaveBeenCalledOnce();
    const arg = mocks.insert.mock.calls[0][0] as Record<string, unknown>;
    // nome é NOT NULL em regras_conciliacao (ver types.ts) — sem essa
    // asserção, um insert faltando o campo passaria pelo mock silenciosamente
    // e só quebraria em runtime contra o banco real.
    expect(arg.nome).toBe('XPTO');
    expect(arg.entidade_nome).toBe('XPTO');
    expect(arg.lancamento_tipo).toBe('pagar');
    expect(arg.entidade_id).toBe('ent-1');
    expect(arg.created_by).toBe('user-1');
    expect(arg.padrao_descricao).not.toMatch(/\d/);
  });
});

describe('aplicarRegras', () => {
  it('retorna null quando não há regras', async () => {
    mocks.order.mockResolvedValueOnce({ data: [] });
    expect(await aplicarRegras('qualquer texto')).toBeNull();
  });

  it('retorna primeira regra correspondente e incrementa uso', async () => {
    mocks.order.mockResolvedValueOnce({
      data: [
        { id: 'r1', padrao_descricao: 'pix recebido ana', vezes_aplicada: 2 },
        { id: 'r2', padrao_descricao: 'ted pagamento', vezes_aplicada: 1 },
      ],
    });
    const regra = await aplicarRegras('PIX RECEBIDO ANA 12/07 999');
    expect((regra as { id: string } | null)?.id).toBe('r1');
    expect(mocks.updateEq).toHaveBeenCalled();
  });

  it('retorna null quando nenhuma regra bate', async () => {
    mocks.order.mockResolvedValueOnce({
      data: [{ id: 'r1', padrao_descricao: 'boleto itau', vezes_aplicada: 1 }],
    });
    expect(await aplicarRegras('pix recebido')).toBeNull();
    expect(mocks.updateEq).not.toHaveBeenCalled();
  });
});
