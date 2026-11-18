import { assertEquals } from 'https://deno.land/x/std@0.208.0/assert/mod.ts';
import { checkRateLimit } from './rate-limit.ts';

// O helper faz um unico `.rpc('rate_limit_check', args).maybeSingle()`.
// Cada mock abaixo devolve o que o PostgREST devolveria naquele cenario.
function clienteRpc(resposta: () => Promise<{ data: unknown; error: unknown }>) {
  const chamadas: Array<{ fn: string; args: Record<string, unknown> }> = [];
  const supabase = {
    rpc: (fn: string, args: Record<string, unknown>) => {
      chamadas.push({ fn, args });
      return { maybeSingle: resposta };
    },
  };
  return { supabase, chamadas };
}

Deno.test('rate limit permite e devolve a contagem do banco', async () => {
  const { supabase, chamadas } = clienteRpc(async () => ({
    data: { permitido: true, contagem: 3 },
    error: null,
  }));
  const result = await checkRateLimit(supabase, {
    endpoint: 'asaas-webhook',
    ip: '203.0.113.7',
    limit: 120,
    windowSeconds: 60,
    userAgent: 'teste',
  });
  assertEquals(result.allowed, true);
  assertEquals(result.count, 3);
  assertEquals(result.retryAfterSeconds, 0);
  assertEquals(chamadas.length, 1);
  assertEquals(chamadas[0].fn, 'rate_limit_check');
  assertEquals(chamadas[0].args, {
    _endpoint: 'asaas-webhook',
    _ip: '203.0.113.7',
    _limit: 120,
    _window_seconds: 60,
    _user_agent: 'teste',
  });
});

Deno.test('rate limit bloqueia quando o banco diz que estourou, com retry da janela', async () => {
  const { supabase } = clienteRpc(async () => ({
    data: { permitido: false, contagem: 121 },
    error: null,
  }));
  const result = await checkRateLimit(supabase, {
    endpoint: 'asaas-webhook',
    ip: '203.0.113.7',
    limit: 120,
    windowSeconds: 60,
  });
  assertEquals(result.allowed, false);
  assertEquals(result.count, 121);
  assertEquals(result.retryAfterSeconds, 60);
  assertEquals(result.unavailable, undefined);
});

Deno.test('rate limit preserva fail-open explícito para compatibilidade', async () => {
  const { supabase } = clienteRpc(async () => ({
    data: null,
    error: { message: 'indisponível' },
  }));
  const result = await checkRateLimit(supabase, { endpoint: 'legado', ip: '127.0.0.1', limit: 1 });
  assertEquals(result.allowed, true);
  assertEquals(result.unavailable, false);
});

Deno.test('rate limit fechado reprova indisponibilidade do armazenamento', async () => {
  const { supabase } = clienteRpc(async () => ({
    data: null,
    error: { message: 'indisponível' },
  }));
  const result = await checkRateLimit(supabase, {
    endpoint: 'bling-webhook',
    ip: '127.0.0.1',
    limit: 1,
    failureMode: 'closed',
  });
  assertEquals(result.allowed, false);
  assertEquals(result.unavailable, true);
  assertEquals(result.retryAfterSeconds, 1);
});

Deno.test('rate limit fechado marca indisponibilidade também em exceção inesperada', async () => {
  const supabaseQueExplode = {
    rpc: () => {
      throw new Error('boom');
    },
  };
  const result = await checkRateLimit(supabaseQueExplode, {
    endpoint: 'bling-webhook',
    ip: '127.0.0.1',
    limit: 1,
    failureMode: 'closed',
  });
  assertEquals(result.allowed, false);
  assertEquals(result.unavailable, true);
  assertEquals(result.retryAfterSeconds, 1);
});

Deno.test(
  'rate limit trata resposta vazia ou fora do contrato como indisponibilidade',
  async () => {
    const vazio = clienteRpc(async () => ({ data: null, error: null }));
    const fechado = await checkRateLimit(vazio.supabase, {
      endpoint: 'convidar-usuario',
      ip: '127.0.0.1',
      limit: 5,
      failureMode: 'closed',
    });
    assertEquals(fechado.allowed, false);
    assertEquals(fechado.unavailable, true);

    // Payload que nao e o do RPC (ex.: mock generico de teste) nunca vira
    // "bloqueado" silencioso: em fail-open libera.
    const foraDoContrato = clienteRpc(async () => ({ data: { id: 'x', ok: true }, error: null }));
    const aberto = await checkRateLimit(foraDoContrato.supabase, {
      endpoint: 'legado',
      ip: '127.0.0.1',
      limit: 5,
    });
    assertEquals(aberto.allowed, true);
    assertEquals(aberto.unavailable, false);
  }
);
