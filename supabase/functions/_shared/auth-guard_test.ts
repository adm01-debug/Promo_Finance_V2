import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { exigirPapel } from './auth-guard.ts';

Deno.test('exigirPapel consulta somente papéis ativos', async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];

  Deno.env.set('SUPABASE_URL', 'https://supabase.test');
  Deno.env.set('SUPABASE_ANON_KEY', 'anon-key-fixture');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-role-fixture');

  globalThis.fetch = ((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    urls.push(url);

    if (url.includes('/auth/v1/user')) {
      return Promise.resolve(Response.json({ id: 'user-1', email: 'admin@example.test' }));
    }

    if (url.includes('/rest/v1/user_roles')) {
      return Promise.resolve(Response.json([{ role: 'admin' }]));
    }

    return Promise.resolve(new Response(null, { status: 404 }));
  }) as typeof fetch;

  try {
    const result = await exigirPapel(
      new Request('https://edge.test/admin', {
        headers: { Authorization: 'Bearer user-token-fixture' },
      }),
      ['admin']
    );

    assertEquals(result.ok, true);
    const rolesRequest = urls.find((url) => url.includes('/rest/v1/user_roles'));
    assert(rolesRequest, 'a consulta de papéis deve ser executada');
    assertEquals(new URL(rolesRequest).searchParams.get('is_active'), 'eq.true');
    assertEquals(new URL(rolesRequest).searchParams.get('select'), 'role,expires_at');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test('exigirPapel rejeita papel ativo já expirado', async () => {
  const originalFetch = globalThis.fetch;
  Deno.env.set('SUPABASE_URL', 'https://supabase.test');
  Deno.env.set('SUPABASE_ANON_KEY', 'anon-key-fixture');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'service-role-fixture');

  globalThis.fetch = ((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.includes('/auth/v1/user')) {
      return Promise.resolve(Response.json({ id: 'user-1', email: 'admin@example.test' }));
    }
    if (url.includes('/rest/v1/user_roles')) {
      return Promise.resolve(
        Response.json([{ role: 'admin', expires_at: '2000-01-01T00:00:00.000Z' }])
      );
    }
    return Promise.resolve(new Response(null, { status: 404 }));
  }) as typeof fetch;

  try {
    const result = await exigirPapel(
      new Request('https://edge.test/admin', {
        headers: { Authorization: 'Bearer user-token-fixture' },
      }),
      ['admin']
    );
    assertEquals(result.ok, false);
    if (!result.ok) assertEquals(result.resposta.status, 403);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
