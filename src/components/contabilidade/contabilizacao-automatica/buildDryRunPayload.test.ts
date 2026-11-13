import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

import { buildDryRunPayload } from './useContabilizacaoMutations';
import type { SimFormState } from './types';

/**
 * Réplica mínima de `ContabilizarEventoSchema`
 * (supabase/functions/_shared/validation.ts). O original não é importável no
 * vitest (depende de `npm:`/`https:` do Deno); o teste de deriva abaixo garante
 * que as chaves da réplica continuam iguais às do schema da Edge.
 */
const ContabilizarEventoSchemaReplica = z
  .object({
    empresa_id: z.string().uuid(),
    tipo_evento: z.enum(['conta_pagar', 'conta_receber', 'movimentacao']),
    evento_id: z.string().uuid(),
    valor: z.number().positive(),
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    descricao: z.string().optional(),
    categoria_id: z.string().uuid().optional().nullable(),
    dry_run: z.boolean().optional(),
    ignore_rules: z.boolean().optional(),
  })
  .strict();

const EMPRESA_ID = '3f1c2a4e-8b7d-4c6a-9e2f-1a2b3c4d5e6f';
const SIM_FORM: SimFormState = {
  tipo_evento: 'conta_pagar',
  valor: 100,
  data: '2026-11-13',
  descricao: 'Simulação de teste',
  categoria_id: '',
  lote_quantidade: 5,
};

describe('buildDryRunPayload', () => {
  // src/test/setup.ts troca crypto.randomUUID por 'test-uuid-…' (não-uuid);
  // aqui usamos o gerador real, igual ao do navegador.
  beforeEach(() => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(randomUUID);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passa no schema strict (sem lote_quantidade, evento_id uuid)', () => {
    const payload = buildDryRunPayload(SIM_FORM, EMPRESA_ID);
    expect(ContabilizarEventoSchemaReplica.safeParse(payload).success).toBe(true);
    expect(payload).not.toHaveProperty('lote_quantidade');
    expect(payload).not.toHaveProperty('ignore_rules');
    expect(payload.dry_run).toBe(true);
    expect(payload.categoria_id).toBeNull();
  });

  it('com ignoreRules envia ignore_rules e continua válido', () => {
    const payload = buildDryRunPayload(SIM_FORM, EMPRESA_ID, true);
    expect(ContabilizarEventoSchemaReplica.safeParse(payload).success).toBe(true);
    expect(payload.ignore_rules).toBe(true);
  });

  it('categoria "none" vira null e categoria uuid é repassada', () => {
    const cat = '0b9e8d7c-6a5b-4c3d-8e2f-1a0b9c8d7e6f';
    expect(
      buildDryRunPayload({ ...SIM_FORM, categoria_id: 'none' }, EMPRESA_ID).categoria_id
    ).toBeNull();
    const payload = buildDryRunPayload({ ...SIM_FORM, categoria_id: cat }, EMPRESA_ID);
    expect(payload.categoria_id).toBe(cat);
    expect(ContabilizarEventoSchemaReplica.safeParse(payload).success).toBe(true);
  });

  it('gera evento_id novo a cada chamada', () => {
    const a = buildDryRunPayload(SIM_FORM, EMPRESA_ID).evento_id;
    const b = buildDryRunPayload(SIM_FORM, EMPRESA_ID).evento_id;
    expect(a).not.toBe(b);
  });

  it('réplica tem as mesmas chaves do ContabilizarEventoSchema da Edge', () => {
    const src = readFileSync(
      resolve(__dirname, '../../../../supabase/functions/_shared/validation.ts'),
      'utf8'
    );
    const start = src.indexOf('export const ContabilizarEventoSchema');
    expect(start).toBeGreaterThanOrEqual(0);
    const bloco = src.slice(start, src.indexOf('.strict()', start));
    const chavesEdge = [...bloco.matchAll(/^\s+(\w+):\s*z\./gm)].map((m) => m[1]).sort();
    expect(chavesEdge).toEqual(Object.keys(ContabilizarEventoSchemaReplica.shape).sort());
  });
});
