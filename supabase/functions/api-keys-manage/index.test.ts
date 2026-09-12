import {
  assertEquals,
  assertMatch,
  assertNotEquals,
} from 'https://deno.land/x/std@0.208.0/assert/mod.ts';
import { createHandler, gerarChaveApi, hashChaveApi, type DependenciasApiKeys } from './index.ts';

const usuario = {
  userId: '11111111-1111-4111-8111-111111111111',
  email: 'admin@empresa.test',
  token: 'token-de-teste',
  clientDoUsuario: {} as never,
};

function depsDeTeste(
  opcoes: {
    autenticado?: boolean;
    vinculo?: boolean;
    erroVinculo?: boolean;
    erroInsercao?: { code?: string } | null;
  } = {}
) {
  const insercoes: Record<string, unknown>[] = [];
  const dependencias: DependenciasApiKeys = {
    exigirPapel: async () =>
      opcoes.autenticado === false
        ? {
            ok: false,
            resposta: new Response(JSON.stringify({ error: 'nao_autenticado' }), { status: 401 }),
          }
        : { ok: true, dados: usuario },
    clientDeServico: () => ({
      from: (tabela: 'user_empresas' | 'api_keys') => {
        if (tabela === 'user_empresas') {
          const consulta = {
            select: () => consulta,
            eq: () => consulta,
            maybeSingle: async () => ({
              data: opcoes.vinculo === false ? null : { id: 'vinculo-1' },
              error: opcoes.erroVinculo ? { message: 'falha' } : null,
            }),
          };
          return consulta;
        }
        const insercao = {
          insert: (payload: Record<string, unknown>) => {
            insercoes.push(payload);
            return insercao;
          },
          select: () => insercao,
          single: async () => ({
            data: opcoes.erroInsercao ? null : { id: 'chave-1' },
            error: opcoes.erroInsercao ?? null,
          }),
        };
        return insercao;
      },
    }),
    gerarChave: () => 'pfv2_chave_de_teste_que_nunca_vai_ao_banco',
    gerarHash: async () => 'a'.repeat(64),
  } as DependenciasApiKeys;
  return { handler: createHandler(dependencias), insercoes };
}

function requisicao(corpo: unknown, method = 'POST') {
  return new Request('http://localhost/api-keys-manage', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(corpo) : undefined,
  });
}

const payloadValido = {
  action: 'create',
  empresa_id: '22222222-2222-4222-8222-222222222222',
  name: 'Integração ERP',
  scopes: ['read', 'finance', 'read'],
};

Deno.test('api-keys: preflight não exige autenticação', async () => {
  const { handler } = depsDeTeste({ autenticado: false });
  assertEquals(
    (await handler(new Request('http://localhost/api-keys-manage', { method: 'OPTIONS' }))).status,
    204
  );
});

Deno.test('api-keys: método não permitido falha fechado', async () => {
  const { handler } = depsDeTeste();
  assertEquals((await handler(requisicao({}, 'GET'))).status, 405);
});

Deno.test('api-keys: usuário não autenticado não alcança o banco', async () => {
  const { handler, insercoes } = depsDeTeste({ autenticado: false });
  assertEquals((await handler(requisicao(payloadValido))).status, 401);
  assertEquals(insercoes.length, 0);
});

Deno.test('api-keys: payload inválido não gera escrita', async () => {
  const { handler, insercoes } = depsDeTeste();
  assertEquals((await handler(requisicao({ ...payloadValido, scopes: ['root'] }))).status, 400);
  assertEquals(insercoes.length, 0);
});

Deno.test('api-keys: admin sem vínculo ativo na empresa é bloqueado', async () => {
  const { handler, insercoes } = depsDeTeste({ vinculo: false });
  assertEquals((await handler(requisicao(payloadValido))).status, 403);
  assertEquals(insercoes.length, 0);
});

Deno.test(
  'api-keys: persiste apenas hash, normaliza escopos e devolve o segredo uma vez',
  async () => {
    const { handler, insercoes } = depsDeTeste();
    const resposta = await handler(requisicao(payloadValido));
    const corpo = await resposta.json();

    assertEquals(resposta.status, 201);
    assertEquals(corpo, { id: 'chave-1', key: 'pfv2_chave_de_teste_que_nunca_vai_ao_banco' });
    assertEquals(insercoes.length, 1);
    assertEquals(insercoes[0].key_hash, 'a'.repeat(64));
    assertNotEquals(insercoes[0].key_hash, corpo.key);
    assertEquals(insercoes[0].nome, 'Integração ERP');
    assertEquals(insercoes[0].chave, 'a'.repeat(64));
    assertNotEquals(insercoes[0].chave, corpo.key);
    assertEquals(insercoes[0].scopes, ['read', 'finance']);
  }
);

Deno.test('api-keys: chave tem entropia aleatória e hash SHA-256 não reversível', async () => {
  const chave = gerarChaveApi();
  const hash = await hashChaveApi(chave);
  assertMatch(chave, /^pfv2_[A-Za-z0-9_-]{43}$/);
  assertMatch(hash, /^[a-f0-9]{64}$/);
  assertNotEquals(hash, chave);
});

Deno.test('api-keys: conflito de nome não vaza erro do banco', async () => {
  const { handler } = depsDeTeste({ erroInsercao: { code: '23505' } });
  const resposta = await handler(requisicao(payloadValido));
  assertEquals(resposta.status, 409);
  assertEquals((await resposta.json()).error, 'chave_duplicada');
});
