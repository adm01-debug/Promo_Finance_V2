import { assertEquals } from 'https://deno.land/x/std@0.208.0/assert/mod.ts';
import { createHandler, type DependenciasConviteUsuario } from './index.ts';

const adminAutenticado = {
  userId: '11111111-1111-4111-8111-111111111111',
  email: 'admin@empresa.test',
  token: 'token-de-teste',
  clientDoUsuario: {} as never,
};

function criarDeps(opcoes: {
  autenticado?: boolean;
  existente?: boolean;
  erroConsulta?: boolean;
  erroConvite?: boolean;
  erroRemocao?: boolean;
  erroPapel?: boolean;
  limitado?: boolean;
} = {}) {
  const eventos = { convite: 0, remocao: 0, insercoes: [] as Record<string, unknown>[], compensacoes: 0 };
  const deps: DependenciasConviteUsuario = {
    exigirPapel: async () => opcoes.autenticado === false
      ? { ok: false, resposta: new Response(null, { status: 403 }) }
      : { ok: true, dados: adminAutenticado },
    appBaseUrl: () => 'https://app.promofinance.test/caminho-inseguro',
    registrarErro: () => undefined,
    verificarRateLimit: async () => ({
      allowed: !opcoes.limitado,
      count: opcoes.limitado ? 6 : 1,
      limit: 5,
      retryAfterSeconds: opcoes.limitado ? 60 : 0,
    }),
    clientDeServico: () => {
      const perfil = {
        select: () => perfil,
        eq: () => perfil,
        maybeSingle: async () => ({
          data: opcoes.existente ? { id: 'usuario-existente' } : null,
          error: opcoes.erroConsulta ? { message: 'falha' } : null,
        }),
      };
      const papeis = {
        delete: () => papeis,
        eq: async () => ({ data: null, error: opcoes.erroRemocao ? { message: 'falha' } : null }),
        insert: async (registro: Record<string, unknown>) => {
          eventos.insercoes.push(registro);
          return { data: opcoes.erroPapel ? null : { id: 'papel-1' }, error: opcoes.erroPapel ? { message: 'falha' } : null };
        },
      };
      return {
        from: (tabela: 'profiles' | 'user_roles') => tabela === 'profiles' ? perfil : papeis,
        auth: { admin: {
          inviteUserByEmail: async () => {
            eventos.convite += 1;
            return { data: opcoes.erroConvite ? null : { user: { id: '22222222-2222-4222-8222-222222222222' } }, error: opcoes.erroConvite ? { message: 'falha' } : null };
          },
          deleteUser: async () => {
            eventos.compensacoes += 1;
            return { data: null, error: null };
          },
        } },
      } as never;
    },
  };
  return { deps, eventos };
}

function requisicao(corpo: unknown, method = 'POST') {
  return new Request('http://localhost/convidar-usuario', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(corpo) : undefined,
  });
}

const corpoValido = { email: 'Novo.Usuario@Empresa.Test', role: 'financeiro' };

Deno.test('convite de usuário: preflight não exige autenticação', async () => {
  const { deps } = criarDeps({ autenticado: false });
  assertEquals((await createHandler(deps)(new Request('http://localhost', { method: 'OPTIONS' }))).status, 204);
});

Deno.test('convite de usuário: anônimo não alcança Auth nem banco', async () => {
  const { deps, eventos } = criarDeps({ autenticado: false });
  assertEquals((await createHandler(deps)(requisicao(corpoValido))).status, 403);
  assertEquals(eventos.convite, 0);
  assertEquals(eventos.insercoes.length, 0);
});

Deno.test('convite de usuário: payload inválido não cria convite', async () => {
  const { deps, eventos } = criarDeps();
  assertEquals((await createHandler(deps)(requisicao({ email: 'invalido', role: 'root' }))).status, 400);
  assertEquals(eventos.convite, 0);
});

Deno.test('convite de usuário: rate limit bloqueia antes de consultar ou convidar', async () => {
  const { deps, eventos } = criarDeps({ limitado: true });
  assertEquals((await createHandler(deps)(requisicao(corpoValido))).status, 429);
  assertEquals(eventos.convite, 0);
  assertEquals(eventos.insercoes.length, 0);
});

Deno.test('convite de usuário: e-mail existente não é sobrescrito', async () => {
  const { deps, eventos } = criarDeps({ existente: true });
  assertEquals((await createHandler(deps)(requisicao(corpoValido))).status, 409);
  assertEquals(eventos.convite, 0);
});

Deno.test('convite de usuário: falha de consulta não cria convite', async () => {
  const { deps, eventos } = criarDeps({ erroConsulta: true });
  assertEquals((await createHandler(deps)(requisicao(corpoValido))).status, 500);
  assertEquals(eventos.convite, 0);
});

Deno.test('convite de usuário: falha no Auth não escreve papel', async () => {
  const { deps, eventos } = criarDeps({ erroConvite: true });
  assertEquals((await createHandler(deps)(requisicao(corpoValido))).status, 502);
  assertEquals(eventos.insercoes.length, 0);
});

Deno.test('convite de usuário: persiste apenas o papel solicitado após o convite', async () => {
  const { deps, eventos } = criarDeps();
  const resposta = await createHandler(deps)(requisicao(corpoValido));
  assertEquals(resposta.status, 201);
  assertEquals(await resposta.json(), {
    invitation_id: '22222222-2222-4222-8222-222222222222',
    email: 'novo.usuario@empresa.test',
    role: 'financeiro',
    email_status: 'solicitado_ao_auth',
  });
  assertEquals(eventos.insercoes, [{
    user_id: '22222222-2222-4222-8222-222222222222',
    role: 'financeiro',
    assigned_by: '11111111-1111-4111-8111-111111111111',
    is_active: true,
    notes: 'Papel atribuído no convite administrativo.',
  }]);
});

Deno.test('convite de usuário: falha ao atribuir papel compensa a conta recém-criada', async () => {
  const { deps, eventos } = criarDeps({ erroPapel: true });
  assertEquals((await createHandler(deps)(requisicao(corpoValido))).status, 500);
  assertEquals(eventos.compensacoes, 1);
});

Deno.test('convite de usuário: falha ao remover papel padrão também compensa a conta', async () => {
  const { deps, eventos } = criarDeps({ erroRemocao: true });
  assertEquals((await createHandler(deps)(requisicao(corpoValido))).status, 500);
  assertEquals(eventos.insercoes.length, 0);
  assertEquals(eventos.compensacoes, 1);
});
