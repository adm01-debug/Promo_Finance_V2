import { assertEquals } from 'https://deno.land/x/std@0.208.0/assert/mod.ts';
import { handler } from './index.ts';

const originalEnvGet = Deno.env.get;

function configurarAmbiente() {
  Deno.env.get = (key: string) => {
    if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
    if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'service-role-de-teste';
    if (key === 'SUPABASE_ANON_KEY') return 'anon-de-teste';
    return originalEnvGet(key);
  };
}

function restaurarAmbiente() {
  Deno.env.get = originalEnvGet;
}

Deno.test('push rejeita chamada anônima antes de criar client privilegiado', async () => {
  configurarAmbiente();
  try {
    const response = await handler(new Request('http://localhost/send-push-notification', {
      method: 'POST', body: JSON.stringify({ title: 'Teste', body: 'Teste' }),
    }));
    assertEquals(response.status, 401);
  } finally {
    restaurarAmbiente();
  }
});

Deno.test('automação interna exige destinatário explícito e não permite broadcast', async () => {
  configurarAmbiente();
  try {
    const response = await handler(new Request('http://localhost/send-push-notification', {
      method: 'POST',
      headers: { Authorization: 'Bearer service-role-de-teste', 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Teste', body: 'Teste' }),
    }));
    assertEquals(response.status, 422);
  } finally {
    restaurarAmbiente();
  }
});
