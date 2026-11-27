import { assert, assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { bootstrap } from '../index.ts';

const originalEnvGet = Deno.env.get;

// `_shared/cors.ts` resolve a allowlist uma unica vez, no import, a partir de
// `ALLOWED_ORIGINS` (que substitui a lista padrao). Usar a segunda origem da
// lista impede que um preflight devolvendo sempre a primeira passe no teste.
function origensDaAllowlist(): string[] {
  const bruto = Deno.env.get('ALLOWED_ORIGINS');
  const lista = (bruto ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return lista.length > 0
    ? lista
    : ['https://app.promo-finance.com', 'http://localhost:8080', 'http://localhost:5173'];
}

const ALLOWLIST = origensDaAllowlist();
const PRIMEIRA_ORIGEM = ALLOWLIST[0];
const ORIGEM_PERMITIDA = ALLOWLIST[1] ?? ALLOWLIST[0];
// Curinga em `ALLOWED_ORIGINS` ecoa qualquer origem: nao ha origem "bloqueada".
const CURINGA = ALLOWLIST.includes('*');

// Origem da allowlist: recebe echo. Uma origem fora da lista nao recebe echo, e
// o navegador bloqueia a resposta mesmo com status 200.
const ORIGEM_BLOQUEADA = 'https://origem-fora-da-allowlist.test';

// Exercita a inicializacao HTTP de verdade: sobe o mesmo servidor que o runtime
// sobe (`bootstrap` -> `Deno.serve`) e faz a chamada pelo loopback. Um erro no
// bind ou no wrapper de observabilidade reprova aqui, o que nao acontecia
// enquanto os testes chamavam `handler` direto.
Deno.test('gerar-alertas-tributarios responde pela porta HTTP sem credencial (401)', async () => {
  Deno.env.get = (key: string) => {
    if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'service-role-de-teste';
    return originalEnvGet(key);
  };

  const servidor = bootstrap();
  try {
    const porta = (servidor.addr as Deno.NetAddr).port;
    assert(porta > 0, 'servidor nao subiu em uma porta valida');

    const response = await fetch(`http://127.0.0.1:${porta}/gerar-alertas-tributarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    assertEquals(response.status, 401);
    assertEquals((await response.json()).error, 'chamada_nao_autorizada');
  } finally {
    await servidor.shutdown();
    Deno.env.get = originalEnvGet;
  }
});

Deno.test('gerar-alertas-tributarios preserva o preflight CORS pela porta HTTP', async () => {
  const servidor = bootstrap();
  try {
    const porta = (servidor.addr as Deno.NetAddr).port;
    const response = await fetch(`http://127.0.0.1:${porta}/gerar-alertas-tributarios`, {
      method: 'OPTIONS',
      headers: {
        Origin: ORIGEM_PERMITIDA,
        'Access-Control-Request-Method': 'POST',
      },
    });

    assertEquals(response.status, 200);
    // Status 200 sozinho nao prova CORS: sem o echo da origem o navegador
    // bloqueia a resposta e o preflight "passa" aqui e falha no browser.
    // A origem escolhida e a segunda da lista, nunca a primeira (o fallback de
    // `origemCors`), para que um eco fixo nao passe como se fosse echo real.
    assertEquals(response.headers.get('access-control-allow-origin'), ORIGEM_PERMITIDA);
    if (!CURINGA) {
      assert(
        ORIGEM_PERMITIDA !== PRIMEIRA_ORIGEM,
        'a allowlist tem uma unica origem: o teste nao distingue echo do fallback'
      );
    }
    assertEquals(response.headers.get('vary'), 'Origin');
    assert(
      (response.headers.get('access-control-allow-methods') ?? '').includes('POST'),
      'preflight nao anuncia POST em Access-Control-Allow-Methods'
    );

    // Origem fora da allowlist nao recebe echo: `origemCors()` devolve a
    // primeira origem permitida, entao o navegador bloqueia a resposta.
    const bloqueado = await fetch(`http://127.0.0.1:${porta}/gerar-alertas-tributarios`, {
      method: 'OPTIONS',
      headers: {
        Origin: ORIGEM_BLOQUEADA,
        'Access-Control-Request-Method': 'POST',
      },
    });
    const origemDaBloqueada = bloqueado.headers.get('access-control-allow-origin');
    assert(
      origemDaBloqueada !== ORIGEM_BLOQUEADA,
      'origem fora da allowlist recebeu echo em Access-Control-Allow-Origin'
    );
    // `*` liberaria qualquer origem sem credenciais — so e aceitavel quando
    // `ALLOWED_ORIGINS` pede o curinga explicitamente.
    if (!CURINGA) {
      assert(
        origemDaBloqueada !== '*',
        'preflight respondeu com Access-Control-Allow-Origin: * para origem fora da allowlist'
      );
      assertEquals(
        origemDaBloqueada,
        PRIMEIRA_ORIGEM,
        'origem bloqueada deveria receber a primeira origem permitida (o navegador descarta)'
      );
    }
  } finally {
    await servidor.shutdown();
  }
});
