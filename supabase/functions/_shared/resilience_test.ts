import { assertEquals, assert } from 'https://deno.land/x/std@0.208.0/assert/mod.ts';
import {
  integracaoDesativada,
  respostaIntegracaoDesativada,
  createCircuitBreaker,
} from './resilience.ts';

function withEnv(nome: string, valor: string | undefined, fn: () => void) {
  const anterior = Deno.env.get(nome);
  try {
    if (valor === undefined) Deno.env.delete(nome);
    else Deno.env.set(nome, valor);
    fn();
  } finally {
    if (anterior === undefined) Deno.env.delete(nome);
    else Deno.env.set(nome, anterior);
  }
}

Deno.test('kill-switch inativo quando a env está ausente ou vazia', () => {
  withEnv('INTEGRACOES_DESATIVADAS', undefined, () => {
    assertEquals(integracaoDesativada('asaas'), false);
  });
  withEnv('INTEGRACOES_DESATIVADAS', '', () => {
    assertEquals(integracaoDesativada('asaas'), false);
  });
});

Deno.test('kill-switch casa serviço na lista com espaços e maiúsculas', () => {
  withEnv('INTEGRACOES_DESATIVADAS', ' Asaas ,BLING ', () => {
    assertEquals(integracaoDesativada('asaas'), true);
    assertEquals(integracaoDesativada('Bling'), true);
    assertEquals(integracaoDesativada('bitrix24'), false);
  });
});

Deno.test('resposta 503 só existe quando o serviço está na lista', async () => {
  withEnv('INTEGRACOES_DESATIVADAS', 'asaas', () => {
    const cors = { 'Access-Control-Allow-Origin': 'https://app.promo-finance.com' };
    const ativa = respostaIntegracaoDesativada('bling', cors);
    assertEquals(ativa, null);

    const inativa = respostaIntegracaoDesativada('asaas', cors);
    assert(inativa !== null);
    assertEquals(inativa!.status, 503);
    return inativa!.json().then((body) => {
      assertEquals(body.error, 'integracao_desativada');
    });
  });
});

Deno.test('circuit breaker abre após 5 falhas e rejeita sem chamar a função', async () => {
  const cb = createCircuitBreaker('teste-cb-' + crypto.randomUUID());
  const falha = () => Promise.reject(new Error('boom'));
  for (let i = 0; i < 5; i++) {
    await cb.run(falha).catch(() => {});
  }
  let chamadas = 0;
  await cb
    .run(() => {
      chamadas++;
      return Promise.resolve(1);
    })
    .catch((e) => assert(String(e.message).includes('Circuit Breaker is OPEN')));
  assertEquals(chamadas, 0);
});

Deno.test('circuit breaker mantém fechado em sucesso após falhas isoladas', async () => {
  const cb = createCircuitBreaker('teste-cb2-' + crypto.randomUUID());
  await cb.run(() => Promise.reject(new Error('x'))).catch(() => {});
  const ok = await cb.run(() => Promise.resolve(42));
  assertEquals(ok, 42);
});
