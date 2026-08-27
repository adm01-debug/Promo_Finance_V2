import { assertEquals } from 'https://deno.land/x/std@0.208.0/assert/mod.ts';
import { checkRateLimit } from './rate-limit.ts';

const supabaseComErro = {
  from: () => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          gte: async () => ({ count: null, error: { message: 'indisponível' } }),
        }),
      }),
    }),
  }),
};

Deno.test('rate limit preserva fail-open explícito para compatibilidade', async () => {
  const result = await checkRateLimit(supabaseComErro, { endpoint: 'legado', ip: '127.0.0.1', limit: 1 });
  assertEquals(result.allowed, true);
  assertEquals(result.unavailable, false);
});

Deno.test('rate limit fechado reprova indisponibilidade do armazenamento', async () => {
  const result = await checkRateLimit(supabaseComErro, {
    endpoint: 'bling-webhook', ip: '127.0.0.1', limit: 1, failureMode: 'closed',
  });
  assertEquals(result.allowed, false);
  assertEquals(result.unavailable, true);
  assertEquals(result.retryAfterSeconds, 1);
});
