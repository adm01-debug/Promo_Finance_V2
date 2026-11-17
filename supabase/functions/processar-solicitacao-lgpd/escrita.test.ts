import { assertEquals, assertRejects } from 'https://deno.land/x/std@0.208.0/assert/mod.ts';
import { anonimizarTitular, fecharSolicitacao } from './escrita.ts';

const AGORA = '2026-11-17T19:00:00.000Z';
const UID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

/** Cliente mínimo: guarda o payload do update e devolve o erro configurado. */
function clienteFake(erroPorTabela: Record<string, { message: string } | null> = {}) {
  const updates: Array<{ tabela: string; payload: Record<string, unknown>; filtro: unknown }> = [];
  const client = {
    from(tabela: string) {
      return {
        update(payload: Record<string, unknown>) {
          return {
            eq(_coluna: string, valor: unknown) {
              updates.push({ tabela, payload, filtro: valor });
              return Promise.resolve({ error: erroPorTabela[tabela] ?? null });
            },
          };
        },
      };
    },
  };
  return { client, updates };
}

Deno.test('anonimização grava só colunas que existem em profiles', async () => {
  const { client, updates } = clienteFake();
  const payload = await anonimizarTitular(client, UID, AGORA);

  assertEquals(updates.length, 1);
  assertEquals(updates[0].tabela, 'profiles');
  assertEquals(updates[0].filtro, UID);
  // phone não existe na tabela: sua presença fazia o banco recusar o UPDATE inteiro.
  assertEquals(Object.keys(updates[0].payload).sort(), ['avatar_url', 'email', 'full_name']);
  assertEquals(updates[0].payload.full_name, 'Titular removido');
  assertEquals(payload.email_substituto, 'anon-aaaaaaaa@removido.local');
  assertEquals(payload.anonimizado_em, AGORA);
});

Deno.test('erro na anonimização propaga e impede o fechamento', async () => {
  const { client } = clienteFake({ profiles: { message: 'column "phone" does not exist' } });
  await assertRejects(
    () => anonimizarTitular(client, UID, AGORA),
    Error,
    'anonimizar titular: column "phone" does not exist'
  );
});

Deno.test('fechamento guarda atendida_por dentro de payload_resposta', async () => {
  const { client, updates } = clienteFake();
  await fecharSolicitacao(client, {
    solicitacaoId: 'sol-1',
    payloadResposta: { formato: 'csv', path: 'lgpd/x.csv' },
    urlDump: 'https://exemplo/x.csv',
    userId: 'admin-9',
    agoraIso: AGORA,
  });

  assertEquals(updates.length, 1);
  assertEquals(updates[0].tabela, 'solicitacoes_lgpd');
  assertEquals(updates[0].filtro, 'sol-1');
  // atendida_por não é coluna: vai dentro do jsonb, preservando a auditoria.
  assertEquals(Object.keys(updates[0].payload).sort(), [
    'atendida_em',
    'payload_resposta',
    'status',
    'url_dump',
  ]);
  assertEquals(updates[0].payload.status, 'atendida');
  assertEquals(updates[0].payload.payload_resposta, {
    formato: 'csv',
    path: 'lgpd/x.csv',
    atendida_por: 'admin-9',
  });
});

Deno.test('erro no fechamento propaga em vez de responder sucesso', async () => {
  const { client } = clienteFake({
    solicitacoes_lgpd: { message: 'column "atendida_por" does not exist' },
  });
  await assertRejects(
    () =>
      fecharSolicitacao(client, {
        solicitacaoId: 'sol-1',
        payloadResposta: {},
        urlDump: null,
        userId: 'admin-9',
        agoraIso: AGORA,
      }),
    Error,
    'fechar solicitação LGPD: column "atendida_por" does not exist'
  );
});
