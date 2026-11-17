import {
  assertEquals,
  assertStringIncludes,
} from 'https://deno.land/std@0.190.0/testing/asserts.ts';
import {
  MENSAGEM_SEM_PROVEDOR,
  acaoExigeProvedorHomologado,
  respostaSemProvedor,
} from './index.ts';

Deno.test('acoes que dependiam de dado fabricado sao recusadas', () => {
  for (const acao of [
    'create_consent',
    'get_accounts',
    'get_balances',
    'get_transactions',
    'import_transactions',
    'refresh_token',
  ]) {
    assertEquals(acaoExigeProvedorHomologado(acao), true, acao);
  }
});

Deno.test('listar instituicoes e revogar consentimento seguem permitidos', () => {
  // Lista de bancos e dado de referencia; revogar so atualiza status local
  // (bloquear revogacao violaria LGPD).
  assertEquals(acaoExigeProvedorHomologado('get_institutions'), false);
  assertEquals(acaoExigeProvedorHomologado('revoke_consent'), false);
  assertEquals(acaoExigeProvedorHomologado('acao_inexistente'), false);
});

Deno.test('a mensagem diz que nada foi lido nem importado', () => {
  assertStringIncludes(MENSAGEM_SEM_PROVEDOR, 'não homologado');
  assertStringIncludes(MENSAGEM_SEM_PROVEDOR, 'nenhuma transação foi importada');
});

Deno.test('a recusa responde 503 com o motivo no corpo', async () => {
  const resposta = respostaSemProvedor({ 'Access-Control-Allow-Origin': '*' });
  assertEquals(resposta.status, 503);
  assertEquals(resposta.headers.get('Content-Type'), 'application/json');
  assertEquals(resposta.headers.get('Access-Control-Allow-Origin'), '*');
  const corpo = await resposta.json();
  assertEquals(corpo.success, false);
  assertEquals(corpo.error, MENSAGEM_SEM_PROVEDOR);
});
