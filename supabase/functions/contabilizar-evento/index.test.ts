import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { handler } from './index.ts';

const originalEnvGet = Deno.env.get;
const originalFetch = globalThis.fetch;

let chamadasRegistradas: Array<Record<string, unknown>> = [];

function callsRegistradas(): Array<Record<string, unknown>> {
  return chamadasRegistradas;
}

const UUID_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const UUID_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const UUID_C = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const UUID_D = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

function setupEnv() {
  Deno.env.get = (key: string) => {
    if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
    if (key === 'SUPABASE_ANON_KEY') return 'anon-test';
    if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'service-test';
    return originalEnvGet(key);
  };
}

function restoreEnv() {
  Deno.env.get = originalEnvGet;
}

function post(body: unknown): Request {
  return new Request('http://localhost/contabilizar-evento', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-real',
    },
    body: JSON.stringify(body),
  });
}

function payloadBase(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    empresa_id: UUID_A,
    tipo_evento: 'conta_pagar',
    evento_id: UUID_B,
    valor: 150.0,
    data: '2026-11-19',
    descricao: 'Conta de luz',
    ...overrides,
  };
}

/**
 * Mock do supabase-js que atende os shapes REST consumidos por
 * contabilizar-evento (GET de seleção, POST por coluna/serviço).
 */
function mockSupabase(layout: {
  userExists?: boolean;
  isAdmin?: boolean;
  papeis?: Array<{ role: string }> | null;
  vinculo?: { id: string } | null;
  logExistente?: Record<string, unknown> | null;
  regras?: Array<Record<string, unknown>> | null;
  lancamentoId?: string;
  falharPartidas?: boolean;
}) {
  // deno-lint-ignore require-await -- async obrigatório: supabase-js espera thenable
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = String(input);
    const method = (init?.method ?? 'GET').toUpperCase();
    const calls = chamadasRegistradas;

    // GET de usuário (auth.getUser)
    if (urlStr.includes('/auth/v1/user')) {
      if (layout.userExists === false) {
        return new Response(JSON.stringify({ code: 'bad_jwt', msg: 'invalid token' }), {
          status: 401,
        });
      }
      return new Response(JSON.stringify({ id: 'user-1' }), { status: 200 });
    }

    // RPC has_role (POST /rest/v1/rpc/has_role)
    if (method === 'POST' && urlStr.includes('/rest/v1/rpc/has_role')) {
      return new Response(JSON.stringify(layout.isAdmin ?? true), { status: 200 });
    }

    // GET user_roles (select via GET /rest/v1/user_roles)
    if (urlStr.includes('/rest/v1/user_roles')) {
      return new Response(JSON.stringify(layout.papeis ?? []), { status: 200 });
    }

    // GET user_empresas (maybeSingle)
    if (urlStr.includes('/rest/v1/user_empresas')) {
      return new Response(JSON.stringify(layout.vinculo ? [layout.vinculo] : []), { status: 200 });
    }

    // GET eventos_contabilizacao_log (maybeSingle / select id, lancamento_id)
    if (method === 'GET' && urlStr.includes('/rest/v1/eventos_contabilizacao_log')) {
      return new Response(JSON.stringify(layout.logExistente ? [layout.logExistente] : []), {
        status: 200,
      });
    }

    // GET regras_contabilizacao_automatica (select *)
    if (urlStr.includes('/rest/v1/regras_contabilizacao_automatica')) {
      return new Response(JSON.stringify(layout.regras ?? []), { status: 200 });
    }

    // POST log sem regra / erro / sucesso
    if (method === 'POST' && urlStr.includes('/rest/v1/eventos_contabilizacao_log')) {
      calls.push({ tipo: 'log', body: JSON.parse(String(init?.body ?? '{}')) });
      return new Response('[]', { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    // INSERT lancamento (single select id)
    if (urlStr.includes('/rest/v1/lancamentos_contabeis')) {
      if (method === 'DELETE') {
        calls.push({ tipo: 'delete-lancamento', url: urlStr });
        return new Response('[]', { status: 200 });
      }
      const body = parseReqBody(init);
      if (body && isInsertWithSelect(body)) {
        calls.push({ tipo: 'lancamento', body });
        return new Response(JSON.stringify({ id: layout.lancamentoId ?? UUID_C }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('[]', { status: 201 });
    }

    // INSERT partidas (retorna erro se configurado)
    if (urlStr.includes('/rest/v1/partidas_contabeis')) {
      if (layout.falharPartidas) {
        return new Response(
          JSON.stringify({
            code: '23505',
            message: 'duplicate key value violates unique constraint partidas_pk',
            details: 'Já existe partida para este lançamento',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      calls.push({
        tipo: 'partidas',
        body: parseReqBody(init),
      });
      return new Response('[]', { status: 201 });
    }

    return new Response(JSON.stringify({ error: 'not mocked' }), { status: 404 });
  };
}

function parseReqBody(init?: RequestInit): unknown {
  if (!init?.body) return null;
  try {
    return JSON.parse(String(init.body));
  } catch {
    return null;
  }
}

function isInsertWithSelect(body: unknown): boolean {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as Record<string, unknown>).empresa_id === 'string'
  );
}

function runWithLayout(layout: Parameters<typeof mockSupabase>[0], fn: () => Promise<void>) {
  return async () => {
    chamadasRegistradas = [];
    setupEnv();
    mockSupabase(layout);
    try {
      await fn();
    } finally {
      globalThis.fetch = originalFetch;
      restoreEnv();
    }
  };
}

Deno.test({
  name: 'contabilizar-evento: 401 sem Authorization',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    setupEnv();
    mockSupabase({ userExists: false });
    try {
      const res = await handler(
        new Request('http://localhost/contabilizar-evento', { method: 'POST' })
      );
      assertEquals(res.status, 401);
      assertStringIncludes(await res.text(), 'unauthorized');
    } finally {
      globalThis.fetch = originalFetch;
      restoreEnv();
    }
  },
});

Deno.test({
  name: 'contabilizar-evento: 401 token inválido (user null)',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    setupEnv();
    mockSupabase({ userExists: false });
    try {
      const res = await handler(post(payloadBase()));
      assertEquals(res.status, 401);
      assertStringIncludes(await res.text(), 'invalid token');
    } finally {
      globalThis.fetch = originalFetch;
      restoreEnv();
    }
  },
});

Deno.test({
  name: 'contabilizar-evento: 422 payload inválido (Contract Violation)',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await runWithLayout({}, async () => {
      const res = await handler(post({ empresa_id: 'nao-e-uuid' }));
      assertEquals(res.status, 422);
      const body = await res.json();
      assertEquals(body.code, 'VALIDATION_ERROR');
      assertStringIncludes(JSON.stringify(body.fields), 'empresa_id');
    })();
  },
});

Deno.test({
  name: 'contabilizar-evento: 403 sem papel financeiro nem vínculo',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await runWithLayout({ isAdmin: false, papeis: [], vinculo: null }, async () => {
      const res = await handler(post(payloadBase()));
      assertEquals(res.status, 403);
      assertStringIncludes(await res.text(), 'Sem permissão');
    })();
  },
});

Deno.test({
  name: 'contabilizar-evento: 403 com papel mas sem vínculo com a empresa',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await runWithLayout(
      { isAdmin: false, papeis: [{ role: 'financeiro' }], vinculo: null },
      async () => {
        const res = await handler(post(payloadBase()));
        assertEquals(res.status, 403);
      }
    )();
  },
});

Deno.test({
  name: 'contabilizar-evento: 200 duplicado quando log já tem sucesso',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await runWithLayout({ logExistente: { id: 'log-1', lancamento_id: UUID_D } }, async () => {
      const res = await handler(post(payloadBase()));
      assertEquals(res.status, 200);
      const body = await res.json();
      assertEquals(body.status, 'duplicado');
      assertEquals(body.lancamento_id, UUID_D);
    })();
  },
});

Deno.test({
  name: 'contabilizar-evento: 200 sem_regra quando não há regra ativa',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await runWithLayout({ regras: [], logExistente: null }, async () => {
      const res = await handler(post(payloadBase()));
      assertEquals(res.status, 200);
      assertEquals((await res.json()).status, 'sem_regra');
      const logSemRegra = callsRegistradas().find((c) => c.tipo === 'log')?.body as Record<
        string,
        unknown
      >;
      assertEquals(logSemRegra.status, 'sem_regra');
      assertEquals(logSemRegra.evento, 'conta_pagar.manual');
      assertEquals(logSemRegra.empresa_id, UUID_A);
    })();
  },
});

Deno.test({
  name: 'contabilizar-evento: 200 simulado em dry_run com regra',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await runWithLayout(
      {
        regras: [
          {
            id: 'regra-1',
            nome: 'Despesa operacional',
            empresa_id: UUID_A,
            tipo_evento: 'conta_pagar',
            conta_debito_id: 'cc-debito',
            conta_credito_id: 'cc-credito',
            prioridade: 10,
            ativo: true,
          },
        ],
      },
      async () => {
        const res = await handler(post(payloadBase({ dry_run: true })));
        assertEquals(res.status, 200);
        const body = await res.json();
        assertEquals(body.status, 'simulado');
        assertEquals(body.valor, 150.0);
        assertEquals(body.regra.nome, 'Despesa operacional');
        assertEquals(callsRegistradas().length, 0, 'dry_run não deve gravar nada');
      }
    )();
  },
});

Deno.test({
  name: 'contabilizar-evento: 200 sucesso cria lançamento + 2 partidas + log',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await runWithLayout(
      {
        regras: [
          {
            id: 'regra-1',
            nome: 'Despesa operacional',
            empresa_id: UUID_A,
            tipo_evento: 'conta_pagar',
            conta_debito_id: 'cc-debito',
            conta_credito_id: 'cc-credito',
            historico_template: '{descricao} - {valor} - {data}',
            prioridade: 10,
            ativo: true,
          },
        ],
        lancamentoId: UUID_C,
      },
      async () => {
        const res = await handler(post(payloadBase()));
        assertEquals(res.status, 200);
        const body = await res.json();
        assertEquals(body.status, 'sucesso');
        assertEquals(body.lancamento_id, UUID_C);
        assertEquals(body.regra.nome, 'Despesa operacional');

        const calls = callsRegistradas();
        const lancamento = calls.find((c) => c.tipo === 'lancamento')?.body as Record<
          string,
          unknown
        >;
        assertEquals(lancamento.empresa_id, UUID_A);
        assertEquals(lancamento.origem, 'conta_pagar');
        assertEquals(lancamento.origem_id, UUID_B);
        assertEquals(lancamento.valor_total, 150.0);
        assertStringIncludes(String(lancamento.historico), 'Conta de luz');
        assertStringIncludes(String(lancamento.historico), '150.00');

        const partidas = calls.find((c) => c.tipo === 'partidas')?.body as Array<
          Record<string, unknown>
        >;
        assertEquals(partidas.length, 2);
        assertEquals(partidas.map((p) => p.tipo).sort(), ['credito', 'debito']);
        assertEquals(
          partidas.every((p) => p.valor === 150),
          true
        );
        assertEquals(
          partidas.every((p) => p.lancamento_id === UUID_C),
          true
        );

        const log = calls.find((c) => c.tipo === 'log')?.body as Record<string, unknown>;
        assertEquals(log.status, 'sucesso');
        assertEquals(log.lancamento_id, UUID_C);
        assertEquals(log.regra_id, 'regra-1');
      }
    )();
  },
});

Deno.test({
  name: 'contabilizar-evento: 200 sucesso com regra sem historico_template',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await runWithLayout(
      {
        regras: [
          {
            id: 'regra-1',
            nome: 'Regra sem template',
            empresa_id: UUID_A,
            tipo_evento: 'conta_pagar',
            conta_debito_id: 'cc-debito',
            conta_credito_id: 'cc-credito',
            // historico_template ausente (insert legado / regra sem template)
            prioridade: 10,
            ativo: true,
          },
        ],
        lancamentoId: UUID_C,
      },
      async () => {
        const res = await handler(post(payloadBase()));
        assertEquals(res.status, 200);
        assertEquals((await res.json()).status, 'sucesso');

        const calls = callsRegistradas();
        const lancamento = calls.find((c) => c.tipo === 'lancamento')?.body as Record<
          string,
          unknown
        >;
        assertStringIncludes(String(lancamento.historico), 'Conta de luz');
        assertEquals(String(lancamento.historico).includes('150.00'), false);
      }
    )();
  },
});

Deno.test({
  name: 'contabilizar-evento: 500 registra log de erro quando partidas falham',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await runWithLayout(
      {
        regras: [
          {
            id: 'regra-1',
            nome: 'Regra com falha',
            empresa_id: UUID_A,
            tipo_evento: 'conta_pagar',
            conta_debito_id: 'cc-debito',
            conta_credito_id: 'cc-credito',
            historico_template: '{descricao} - {valor}',
            prioridade: 10,
            ativo: true,
          },
        ],
        lancamentoId: UUID_C,
        falharPartidas: true,
      },
      async () => {
        const res = await handler(post(payloadBase()));
        assertEquals(res.status, 500);
        assertStringIncludes(await res.text(), 'duplicate key');

        const calls = callsRegistradas();
        const hasDelete = calls.some((c) => c.tipo === 'delete-lancamento');
        assertEquals(hasDelete, true, 'deveria compensar o lançamento após falha nas partidas');
        const logErro = calls.filter((c) => c.tipo === 'log').map((c) => c.body);
        assertEquals(logErro.length, 1);
        assertEquals((logErro[0] as Record<string, unknown>).status, 'erro');
        assertEquals((logErro[0] as Record<string, unknown>).regra_id, 'regra-1');
      }
    )();
  },
});
