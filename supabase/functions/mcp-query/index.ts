/**
 * mcp-query — Gateway do MCP Worker (PROMO FINANCE V2)
 *
 * Três modos, todos autenticados pelo header x-mcp-secret (secret MCP_SECRET):
 *
 *  1) SQL  — conexão direta ao Postgres via postgres.js usando SUPABASE_DB_URL.
 *     Aceita `sql` (texto) ou `sql_b64` (base64). O worker manda em base64
 *     porque o WAF na frente de *.supabase.co bloqueia payloads contendo
 *     palavras como "drop" mesmo quando fazem parte de um identificador.
 *     Bloqueia DROP/TRUNCATE/ALTER SYSTEM/RESET ALL e também DELETE/UPDATE
 *     sem WHERE (libera com allow_all_rows:true).
 *
 *  2) TRANSACTION — recebe `stmts_b64` (base64 de JSON array de SQL strings)
 *     e executa via sql.begin() para garantir atomicidade real.
 *     Fix: postgres.js com max>1 bloqueia BEGIN;COMMIT; manual (UNSAFE_TRANSACTION).
 *
 *  3) admin — proxy para storage/v1 e auth/v1 usando a SERVICE_ROLE_KEY.
 *     O worker MCP só tem a anon key; sem esse proxy as tools de storage e de
 *     admin de auth respondem 403/vazio silenciosamente.
 */

import postgres from 'https://esm.sh/postgres@3.4.5?target=denonext';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const SECRET = Deno.env.get('MCP_SECRET');
const DB_URL = Deno.env.get('SUPABASE_DB_URL');
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-mcp-secret, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DESTRUCTIVE = /\b(DROP|TRUNCATE|ALTER\s+SYSTEM|RESET\s+ALL)\b/i;
const IS_SELECT = /^\s*(SELECT|WITH)\b/i;
const ADMIN_PATH = /^(storage|auth)\/v1\/[^?#]*$/;

const RequestSchema = z.object({
  sql: z.string().optional(),
  sql_b64: z.string().optional(),
  stmts_b64: z.string().optional(),       // base64(JSON.stringify(string[])) para db_transaction
  limit: z.number().int().optional(),
  allow_all_rows: z.boolean().optional(),
  admin: z.object({
    path: z.string(),
    method: z.string().optional(),
    body: z.unknown().optional(),
  }).optional(),
}).strict();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

/** Primeiro statement que escreve sem WHERE, ou null. */
function unscopedWrite(query: string): string | null {
  for (const parte of query.split(';')) {
    const stmt = parte.trim();
    if (!stmt) continue;
    if (/^(DELETE\s+FROM|UPDATE)\b/i.test(stmt) && !/\bWHERE\b/i.test(stmt)) {
      return stmt.slice(0, 160);
    }
  }
  return null;
}

function decodeB64(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
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

async function handleAdmin(admin: Record<string, unknown>): Promise<Response> {
  if (!SERVICE_KEY || !SUPABASE_URL) {
    return json({ error: 'service_role_indisponivel' }, 500);
  }
  const path = String(admin.path ?? '');
  if (!ADMIN_PATH.test(path)) {
    return json({ error: 'admin.path deve começar com storage/v1/ ou auth/v1/' }, 400);
  }
  const method = String(admin.method ?? 'GET').toUpperCase();
  const payload = admin.body;
  const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: payload === undefined || payload === null ? undefined : JSON.stringify(payload),
  });
  const texto = await res.text();
  let data: unknown;
  try {
    data = texto ? JSON.parse(texto) : null;
  } catch {
    data = texto;
  }
  return json({ status: res.status, ok: res.ok, data });
}

async function handleTransaction(stmtsB64: string, allowAllRows: boolean): Promise<Response> {
  if (!DB_URL) return json({ error: 'server_misconfigured' }, 500);

  let stmts: string[];
  try {
    stmts = JSON.parse(decodeB64(stmtsB64));
    if (!Array.isArray(stmts) || stmts.length === 0) throw new Error('array vazio');
  } catch (e) {
    return json({ error: 'stmts_b64 inválido: ' + String(e) }, 400);
  }

  // Valida todos antes de abrir a transação
  for (const stmt of stmts) {
    const s = stmt.trim();
    if (!s) continue;
    if (DESTRUCTIVE.test(s)) {
      return json({ error: 'Query destrutiva bloqueada (DROP/TRUNCATE/ALTER SYSTEM/RESET ALL)', statement: s.slice(0, 80) }, 400);
    }
    if (!allowAllRows) {
      const sw = unscopedWrite(s);
      if (sw) {
        return json({ error: 'DELETE/UPDATE sem WHERE bloqueado — reenvie com allow_all_rows:true', statement: sw }, 400);
      }
    }
  }

  try {
    const client = getSql(DB_URL);
    const results = await client.begin(async (tx) => {
      const res: Array<{ rows: unknown[]; count: number }> = [];
      for (const stmt of stmts) {
        const s = stmt.trim();
        if (!s) continue;
        const rows = await tx.unsafe(s);
        const lista = Array.isArray(rows) ? Array.from(rows) : [rows];
        res.push({ rows: lista, count: lista.length });
      }
      return res;
    });
    return json({ results, committed: true, statements: results.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return json({ error: { message } }, 400);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  if (!SECRET) return json({ error: 'server_misconfigured' }, 500);

  if (req.headers.get('x-mcp-secret') !== SECRET) {
    return json({ error: 'unauthorized' }, 401);
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const parsed = RequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return json({ error: 'invalid payload', details: parsed.error.format() }, 400);
  }
  const body = parsed.data;

  if (body.admin) return handleAdmin(body.admin);

  if (body.stmts_b64) return handleTransaction(body.stmts_b64, !!body.allow_all_rows);

  if (!DB_URL) return json({ error: 'server_misconfigured' }, 500);

  let bruto = body.sql ?? '';
  if (body.sql_b64) {
    try {
      bruto = decodeB64(body.sql_b64);
    } catch {
      return json({ error: 'sql_b64 inválido' }, 400);
    }
  }

  const query = bruto.trim();
  if (!query) return json({ error: 'empty sql' }, 400);

  if (DESTRUCTIVE.test(query)) {
    return json(
      { error: 'Query destrutiva bloqueada (DROP/TRUNCATE/ALTER SYSTEM/RESET ALL)' },
      400,
    );
  }

  if (!body.allow_all_rows) {
    const semWhere = unscopedWrite(query);
    if (semWhere) {
      return json(
        {
          error: 'DELETE/UPDATE sem WHERE bloqueado — reenvie com allow_all_rows:true se for intencional',
          statement: semWhere,
        },
        400,
      );
    }
  }

  const limite = Number.isFinite(body.limit) ? Math.trunc(body.limit as number) : 100;
  const limiteSeguro = Math.min(Math.max(limite, 1), 10_000);

  const finalSql =
    IS_SELECT.test(query) && !/\blimit\b/i.test(query)
      ? `${query.replace(/;\s*$/, '')} LIMIT ${limiteSeguro}`
      : query;

  try {
    const client = getSql(DB_URL);
    const rows = await client.unsafe(finalSql);
    const bruto2 = Array.isArray(rows) ? Array.from(rows) : [rows];
    const multi = bruto2.length > 0 && bruto2.every((r) => Array.isArray(r));
    const lista = multi ? bruto2.flatMap((r) => Array.from(r as unknown[])) : bruto2;
    return json({ rows: lista, count: lista.length, statements: multi ? bruto2.length : 1 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return json({ error: { message } }, 400);
  }
});
