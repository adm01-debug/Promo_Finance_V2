/**
 * mcp-query — Proxy SQL para o MCP Worker (PROMO FINANCE V2)
 *
 * Conexão direta ao Postgres via postgres.js usando SUPABASE_DB_URL,
 * em vez de PostgREST + RPC exec_sql. Motivo: evita depender de uma
 * função SECURITY DEFINER genérica no banco e devolve o resultado
 * tabular já tipado, com erros de SQL legíveis.
 *
 * Autenticação: header x-mcp-secret (valor no secret MCP_SECRET).
 * Bloqueia DROP/TRUNCATE/ALTER SYSTEM/RESET ALL.
 */

import postgres from 'https://esm.sh/postgres@3.4.5?target=denonext';

const SECRET = Deno.env.get('MCP_SECRET');
const DB_URL = Deno.env.get('SUPABASE_DB_URL');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-mcp-secret, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DESTRUCTIVE = /\b(DROP|TRUNCATE|ALTER\s+SYSTEM|RESET\s+ALL)\b/i;
const IS_SELECT = /^\s*(SELECT|WITH)\b/i;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

/** Conexão única reaproveitada entre invocações no mesmo isolate. */
let sql: ReturnType<typeof postgres> | null = null;
function getSql(url: string) {
  if (!sql) {
    sql = postgres(url, {
      max: 2,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }
  return sql;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  if (!SECRET || !DB_URL) return json({ error: 'server_misconfigured' }, 500);

  if (req.headers.get('x-mcp-secret') !== SECRET) {
    return json({ error: 'unauthorized' }, 401);
  }

  let body: { sql?: string; limit?: number };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const query = (body.sql ?? '').trim();
  if (!query) return json({ error: 'empty sql' }, 400);

  if (DESTRUCTIVE.test(query)) {
    return json(
      { error: 'Query destrutiva bloqueada (DROP/TRUNCATE/ALTER SYSTEM)' },
      400,
    );
  }

  const limite = Number.isFinite(body.limit) ? Math.trunc(body.limit as number) : 100;
  const limiteSeguro = Math.min(Math.max(limite, 1), 10_000);

  const finalSql =
    IS_SELECT.test(query) && !/\blimit\b/i.test(query)
      ? `${query.replace(/;\s*$/, '')} LIMIT ${limiteSeguro}`
      : query;

  try {
    const client = getSql(DB_URL);
    // `unsafe` é necessário porque o SQL vem inteiro do worker MCP;
    // a proteção é o segredo compartilhado + o filtro de comandos destrutivos.
    const rows = await client.unsafe(finalSql);
    const lista = Array.isArray(rows) ? Array.from(rows) : [rows];
    return json({ rows: lista, count: lista.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return json({ error: { message } }, 400);
  }
});
