/**
 * Testes — regra ESLint `no-floating-supabase-write`
 *
 * A regra só é útil se for precisa: uma regra que acusa leitura, cliente de
 * outra biblioteca ou escrita já tratada é desligada na primeira semana. Os
 * casos válidos abaixo são tão importantes quanto os inválidos.
 *
 * O arquivo da regra mora fora de `src/`, mas o teste mora aqui porque o
 * vitest só varre `src/**` — sem isto a regra não teria cobertura no CI.
 */
import { describe } from 'vitest';
import { RuleTester } from 'eslint';
import { createRequire } from 'node:module';

import regra from '../../../eslint-rules/no-floating-supabase-write.js';

const require = createRequire(import.meta.url);

const testerJs = new RuleTester({
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

const testerTs = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

describe('no-floating-supabase-write', () => {
  testerJs.run('sintaxe JS', regra as never, {
    valid: [
      // A forma que a regra quer induzir.
      "await mustSucceed(supabase.from('t').update({ a: 1 }).eq('id', id), 'atualizar');",
      "await bestEffort(supabase.from('t').insert({ a: 1 }), 'registrar auditoria');",
      // Desestruturação explícita continua válida.
      "const { error } = await supabase.from('t').insert({ a: 1 });",
      "const { data, error } = await supabase.rpc('fn', {});",
      // Leitura: descartar o resultado é inútil, mas não esconde escrita perdida.
      "await supabase.from('t').select('*').eq('id', id);",
      // Métodos homônimos fora da cadeia de escrita do PostgREST.
      'await supabase.auth.updateUser({ password: p });',
      'await caches.delete(chave);',
      'await minhaApi.from("t").insert({});',
      // Escrita aninhada já tratada dentro do callback.
      "await Promise.allSettled(ids.map(async (id) => { const { error } = await supabase.from('t').update({}).eq('id', id); if (error) throw error; }));",
      // Retorno de função: o chamador decide o que fazer.
      "async function salva() { return supabase.from('t').insert({ a: 1 }); }",
      // `.then()` dispara a requisição e entrega `{ data, error }` ao callback.
      // Sete ocorrências reais do repositório têm esta forma; acusá-las tornaria
      // a regra ruidosa o bastante para ser desligada.
      "supabase.from('t').update({ a: 1 }).eq('id', id).then(({ error }) => { if (error) logger.warn(error); });",
      "supabase.rpc('has_role', { _role: 'admin' }).then(({ data }) => setAdmin(!!data));",
      "supabase.from('t').insert({ a: 1 }).then(({ error }) => report(error)).catch(noop);",
      "await supabase.from('t').update({ a: 1 }).then(({ error }) => { if (error) throw error; });",
    ],
    invalid: [
      {
        code: "await supabase.from('contas_pagar').update({ aprovado_por: u }).eq('id', id);",
        errors: [{ messageId: 'resultadoDescartado', data: { metodo: 'update' } }],
      },
      {
        code: "await supabase.from('creditos_tributarios').insert({ tipo: 'CBS' });",
        errors: [{ messageId: 'resultadoDescartado', data: { metodo: 'insert' } }],
      },
      {
        code: "await supabaseDyn.from('push_subscriptions').delete().eq('user_id', u);",
        errors: [{ messageId: 'resultadoDescartado', data: { metodo: 'delete' } }],
      },
      {
        code: "await supabase.from('regua_cobranca_status').upsert({ id: 1 });",
        errors: [{ messageId: 'resultadoDescartado', data: { metodo: 'upsert' } }],
      },
      {
        code: "await supabase.rpc('log_audit', { p_action: 'UPDATE' });",
        errors: [{ messageId: 'resultadoDescartado', data: { metodo: 'rpc' } }],
      },
      {
        // `void` sinaliza intenção de descartar — o erro some do mesmo jeito.
        code: "void supabase.from('t').upsert({ a: 1 });",
        errors: [{ messageId: 'resultadoDescartado', data: { metodo: 'upsert' } }],
      },
      {
        // Sem await o builder do PostgREST nem dispara: escrita jamais enviada.
        code: "supabase.from('t').insert({ a: 1 });",
        errors: [{ messageId: 'semAwait', data: { metodo: 'insert' } }],
      },
      {
        // Nem await nem .then(): a cadeia termina num filtro.
        code: "supabase.from('t').update({ a: 1 }).eq('id', id);",
        errors: [{ messageId: 'semAwait', data: { metodo: 'update' } }],
      },
      {
        // O método de escrita fica no meio da cadeia, não na ponta.
        code: "await supabase.from('t').update({ a: 1 }).eq('id', id).eq('empresa_id', e);",
        errors: [{ messageId: 'resultadoDescartado', data: { metodo: 'update' } }],
      },
    ],
  });

  testerTs.run('sintaxe TypeScript', regra as never, {
    valid: [
      "await mustSucceed(supabase.from('t' as never).insert({} as never), 'gravar');",
      "const { error } = await (supabase as SupabaseClient).from('t').insert({});",
    ],
    invalid: [
      {
        // `as never` no argumento não deve esconder a cadeia.
        code: "await supabase.from('user_onboarding_progress' as never).update({ a: 1 }).eq('id', i);",
        errors: [{ messageId: 'resultadoDescartado', data: { metodo: 'update' } }],
      },
      {
        // Cast na raiz do client.
        code: "await (supabase as SupabaseClient).from('t').insert({ a: 1 });",
        errors: [{ messageId: 'resultadoDescartado', data: { metodo: 'insert' } }],
      },
      {
        code: "await supabase!.from('t').delete().eq('id', id);",
        errors: [{ messageId: 'resultadoDescartado', data: { metodo: 'delete' } }],
      },
    ],
  });

  // O identificador do client é configurável: projetos com outro nome de
  // variável precisam poder apontar a regra sem editá-la.
  testerJs.run('clientePattern configurável', regra as never, {
    valid: [
      { code: "await supabase.from('t').insert({});", options: [{ clientePattern: '^db$' }] },
    ],
    invalid: [
      {
        code: "await db.from('t').insert({});",
        options: [{ clientePattern: '^db$' }],
        errors: [{ messageId: 'resultadoDescartado' }],
      },
    ],
  });
});
