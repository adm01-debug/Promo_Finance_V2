import { assert, assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { bootstrap } from '../index.ts';
import { origensPermitidas } from '../../_shared/cors.ts';

const originalEnvGet = Deno.env.get;

// `_shared/cors.ts` resolve a allowlist uma unica vez, no import, a partir de
// `ALLOWED_ORIGINS` (que substitui a lista padrao). O teste nao le o ambiente:
// a allowlist e refeita a partir do modulo importado, entao o valor esperado e o
// que a funcao usa de verdade em qualquer configuracao (inclusive uma unica
// origem, ou o curinga `*`).
const CURINGA = origensPermitidas.includes('*');

// Origem da allowlist: recebe echo. Uma origem fora da lista nao recebe echo, e
// o navegador bloqueia a resposta mesmo com status 200.
const ORIGEM_PERMITIDA = escolherOrigemDaAllowlist();
const ORIGEM_BLOQUEADA = 'https://origem-fora-da-allowlist.test';

// Nao usa a primeira entrada quando existe outra: `origemCors` devolve a
// primeira origem como fallback, e um eco fixo (ou o proprio fallback) passaria
// no teste como se fosse echo real.
function escolherOrigemDaAllowlist(): string {
  const fixas = origensPermitidas.filter((o) => o !== '*');
  return fixas[fixas.length - 1] ?? 'https://app.promo-finance.com';
}

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
    // A origem escolhida e a ultima da allowlist, nao a primeira: a primeira e o
    // fallback de `origemCors`, então um eco fixo nao passa como echo real.
    assertEquals(response.headers.get('access-control-allow-origin'), ORIGEM_PERMITIDA);
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
    // Com `ALLOWED_ORIGINS=*` o eco de qualquer origem e a configuracao pedida
    // (`_shared/cors.ts:63-66`), nao uma falha do preflight.
    if (!CURINGA) {
      assert(
        origemDaBloqueada !== ORIGEM_BLOQUEADA,
        'origem fora da allowlist recebeu echo em Access-Control-Allow-Origin'
      );
      // `*` liberaria qualquer origem sem credenciais — aqui a allowlist nao tem
      // o curinga, entao o header nunca pode ser `*`.
      assert(
        origemDaBloqueada !== '*',
        'preflight respondeu com Access-Control-Allow-Origin: * para origem fora da allowlist'
      );
      assert(
        origensPermitidas.includes(origemDaBloqueada ?? ''),
        'origem bloqueada deveria receber uma origem da allowlist (o navegador descarta)'
      );
    }
  } finally {
    await servidor.shutdown();
  }
});
