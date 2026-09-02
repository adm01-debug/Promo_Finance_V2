/**
 * mcp-query — Gateway do MCP Worker (PROMO FINANCE V2)
 *
 * Três modos, todos autenticados pelo header x-mcp-secret (secret MCP_SECRET):
 *
 *  1) SQL  — conexão direta ao Postgres via postgres.js usando SUPABASE_DB_URL.
 *     Aceita `sql` (texto) ou `sql_b64` (base64). O worker manda em base64
 *     porque o WAF na frente de *.supabase.co bloqueia payloads contendo
 *     palavras como "drop" mesmo quando fazem parte de um identificador.
 *     Bloqueia multi-statement, DDL, privilégios, sessão/execução, funções
 *     SQL com efeito colateral administrativo e também DELETE/UPDATE sem
 *     WHERE (libera com allow_all_rows:true).
 *
 *  2) TRANSACTION — recebe `stmts_b64` (base64 de JSON array de SQL strings)
 *     e executa via sql.begin() para garantir atomicidade real.
 *
 *  3) admin — proxy para storage/v1 e auth/v1 usando a SERVICE_ROLE_KEY.
 *     O worker MCP só tem a anon key; sem esse proxy as tools de storage e de
 *     admin de auth respondem 403/vazio silenciosamente.
 */

import * as postgresModule from 'https://esm.sh/postgres@3.4.5?target=denonext';
import { z } from '../_shared/zod.ts';
import { avaliarSqlMcp } from './sql-policy.ts';

export type SqlClient = {
  unsafe(query: string): Promise<unknown[]>;
  begin<T>(callback: (transaction: SqlClient) => Promise<T>): Promise<T>;
};

type PostgresFactory = (url: string, options: Record<string, unknown>) => SqlClient;

export interface RuntimeDeps {
  secret?: string | null;
  dbUrl?: string | null;
  serviceKey?: string | null;
  supabaseUrl?: string | null;
  getSql?: (url: string) => SqlClient;
  fetchImpl?: typeof fetch;
}

const postgres = (postgresModule as unknown as { default: PostgresFactory }).default;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-mcp-secret, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ADMIN_PATH = /^(storage|auth)\/v1\/[^?#]*$/;
const MAX_TRANSACTION_STATEMENTS = 100;
const MAX_TRANSACTION_BYTES = 1024 * 1024;
const MAX_QUERY_BYTES = 1024 * 1024;
const MAX_QUERY_B64_BYTES = Math.ceil(MAX_QUERY_BYTES / 3) * 4 + 16;
const MAX_TRANSACTION_PAYLOAD_B64_BYTES = Math.ceil((MAX_TRANSACTION_BYTES * 2) / 3) * 4 + 16;
const MAX_RAW_BODY_BYTES = 2 * 1024 * 1024;
const MAX_ADMIN_REQUEST_BYTES = 256 * 1024;
const MAX_ADMIN_RESPONSE_BYTES = 1024 * 1024;
const STATEMENT_TIMEOUT_MS = 5000;
const LOCK_TIMEOUT_MS = 1000;
const ADMIN_TIMEOUT_MS = 5000;

const ADMIN_ALLOWLIST: Array<{ method: string; pattern: RegExp }> = [
  { method: 'GET', pattern: /^auth\/v1\/admin\/users$/ },
  { method: 'POST', pattern: /^auth\/v1\/admin\/users$/ },
  { method: 'GET', pattern: /^auth\/v1\/admin\/users\/[a-z0-9-]+$/i },
  { method: 'PUT', pattern: /^auth\/v1\/admin\/users\/[a-z0-9-]+$/i },
  { method: 'DELETE', pattern: /^auth\/v1\/admin\/users\/[a-z0-9-]+$/i },
  { method: 'POST', pattern: /^auth\/v1\/admin\/generate_link$/ },
  { method: 'POST', pattern: /^auth\/v1\/invite$/ },
  { method: 'GET', pattern: /^storage\/v1\/bucket$/ },
  { method: 'POST', pattern: /^storage\/v1\/bucket$/ },
  { method: 'GET', pattern: /^storage\/v1\/bucket\/[a-z0-9._-]+$/i },
  { method: 'PUT', pattern: /^storage\/v1\/bucket\/[a-z0-9._-]+$/i },
  { method: 'DELETE', pattern: /^storage\/v1\/bucket\/[a-z0-9._-]+$/i },
  { method: 'POST', pattern: /^storage\/v1\/bucket\/[a-z0-9._-]+\/empty$/i },
  {
    method: 'POST',
    pattern: /^storage\/v1\/object\/list(?:\/[a-z0-9._-]+)?$/i,
  },
  {
    method: 'GET',
    pattern: /^storage\/v1\/object\/(?:authenticated|info|public|sign)\/[a-z0-9._-]+\/.+$/i,
  },
  { method: 'POST', pattern: /^storage\/v1\/object\/sign\/[a-z0-9._-]+\/.+$/i },
  { method: 'POST', pattern: /^storage\/v1\/object\/move$/ },
  { method: 'POST', pattern: /^storage\/v1\/object\/copy$/ },
  { method: 'POST', pattern: /^storage\/v1\/object\/remove$/ },
  { method: 'DELETE', pattern: /^storage\/v1\/object\/[a-z0-9._-]+$/i },
  {
    method: 'POST',
    pattern: /^storage\/v1\/object\/upload\/sign\/[a-z0-9._-]+\/.+$/i,
  },
  { method: 'POST', pattern: /^storage\/v1\/object\/[a-z0-9._-]+\/.+$/i },
  { method: 'PUT', pattern: /^storage\/v1\/object\/[a-z0-9._-]+\/.+$/i },
  { method: 'DELETE', pattern: /^storage\/v1\/object\/[a-z0-9._-]+\/.+$/i },
];

const RequestSchema = z
  .object({
    sql: z.string().optional(),
    sql_b64: z.string().optional(),
    stmts_b64: z.string().optional(),
    limit: z.number().int().optional(),
    allow_all_rows: z.boolean().optional(),
    admin: z
      .object({
        path: z.string(),
        method: z.string().optional(),
        body: z.unknown().optional(),
      })
      .optional(),
  })
  .strict();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function decodeB64(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function lerTextoLimitado(
  stream: ReadableStream<Uint8Array> | null,
  maxBytes: number,
  erro: string
): Promise<string> {
  if (!stream) return '';

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let texto = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) throw new Error(erro);
      texto += decoder.decode(value, { stream: true });
    }
    texto += decoder.decode();
    return texto;
  } finally {
    reader.releaseLock();
  }
}

let sql: SqlClient | null = null;

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

function runtimeValue(override: string | null | undefined, envName: string): string | null {
  if (override !== undefined) return override;
  return Deno.env.get(envName) ?? null;
}

function timingSafeEqual(left: string | null, right: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(left ?? '');
  const b = encoder.encode(right);
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < max; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

function medirBytes(texto: string): number {
  return new TextEncoder().encode(texto).byteLength;
}

function validarCargaBase64(payload: string, maxBytes: number, label: string): string | null {
  if (medirBytes(payload) > maxBytes) {
    return `${label} excede o limite de ${maxBytes} bytes codificados`;
  }
  return null;
}

function validarAdminPath(path: string): string | null {
  if (!ADMIN_PATH.test(path)) {
    return 'admin.path deve começar com storage/v1/ ou auth/v1/';
  }
  if (path.includes('\\') || path.includes('%')) {
    return 'admin.path contém caracteres não permitidos';
  }

  const segmentos = path.split('/');
  if (segmentos.some((segmento) => segmento === '' || segmento === '.' || segmento === '..')) {
    return 'admin.path contém segmentos inválidos';
  }

  return null;
}

function validarAdminMetodoERota(path: string, method: string): string | null {
  const permitido = ADMIN_ALLOWLIST.some(
    (entrada) => entrada.method === method && entrada.pattern.test(path)
  );
  return permitido ? null : 'admin.path/admin.method fora da allowlist do MCP';
}

function validarContratoAdmin(path: string, method: string, payload: unknown): string | null {
  if (method === 'DELETE' && /^storage\/v1\/object\/[a-z0-9._-]+$/i.test(path)) {
    if (
      !payload ||
      typeof payload !== 'object' ||
      Array.isArray(payload) ||
      !('prefixes' in payload)
    ) {
      return 'admin.body deve conter { prefixes: string[] } para DELETE storage/v1/object/<bucket>';
    }

    const prefixes = (payload as Record<string, unknown>).prefixes;
    if (
      !Array.isArray(prefixes) ||
      prefixes.length === 0 ||
      !prefixes.every((prefix) => typeof prefix === 'string' && prefix.trim().length > 0)
    ) {
      return 'admin.body deve conter { prefixes: string[] } para DELETE storage/v1/object/<bucket>';
    }
  }

  return null;
}

function validarModo(body: z.infer<typeof RequestSchema>): string | null {
  const temAdmin = body.admin !== undefined;
  const temTransacao = body.stmts_b64 !== undefined;
  const temSql = body.sql !== undefined;
  const temSqlB64 = body.sql_b64 !== undefined;

  if (Number(temSql) + Number(temSqlB64) > 1) {
    return 'sql e sql_b64 são mutuamente exclusivos';
  }

  const modos = Number(temAdmin) + Number(temTransacao) + Number(temSql || temSqlB64);
  if (modos !== 1) {
    return 'request deve informar exatamente um modo: admin, stmts_b64 ou sql/sql_b64';
  }

  return null;
}

async function executarConsultaComTimeouts(
  client: SqlClient,
  callback: (transaction: SqlClient) => Promise<unknown[]>,
  somenteLeitura: boolean
): Promise<unknown[]> {
  return await client.begin(async (tx) => {
    await tx.unsafe(`SET LOCAL statement_timeout = '${STATEMENT_TIMEOUT_MS}ms'`);
    await tx.unsafe(`SET LOCAL lock_timeout = '${LOCK_TIMEOUT_MS}ms'`);
    if (somenteLeitura) {
      await tx.unsafe('SET TRANSACTION READ ONLY');
    }
    return await callback(tx);
  });
}

async function handleAdmin(admin: Record<string, unknown>, deps: RuntimeDeps): Promise<Response> {
  const serviceKey = runtimeValue(deps.serviceKey, 'SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = runtimeValue(deps.supabaseUrl, 'SUPABASE_URL');
  const fetchImpl = deps.fetchImpl ?? fetch;

  if (!serviceKey || !supabaseUrl) {
    return json({ error: 'service_role_indisponivel' }, 500);
  }

  const path = String(admin.path ?? '');
  const erroPath = validarAdminPath(path);
  if (erroPath) return json({ error: erroPath }, 400);

  const method = String(admin.method ?? 'GET').toUpperCase();
  const erroRota = validarAdminMetodoERota(path, method);
  if (erroRota) return json({ error: erroRota }, 400);
  const payload = admin.body;
  const erroContrato = validarContratoAdmin(path, method, payload);
  if (erroContrato) return json({ error: erroContrato }, 400);
  const bodyTexto = payload === undefined || payload === null ? undefined : JSON.stringify(payload);
  if (bodyTexto && medirBytes(bodyTexto) > MAX_ADMIN_REQUEST_BYTES) {
    return json({ error: 'admin.body excede o limite permitido' }, 413);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ADMIN_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetchImpl(`${supabaseUrl.replace(/\/$/, '')}/${path}`, {
      method,
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: bodyTexto,
      signal: controller.signal,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (controller.signal.aborted) {
      return json({ error: 'admin upstream timeout' }, 504);
    }
    return json({ error: { message } }, 502);
  } finally {
    clearTimeout(timeout);
  }

  let texto: string;
  try {
    texto = await lerTextoLimitado(
      res.body,
      MAX_ADMIN_RESPONSE_BYTES,
      'admin response excede o limite permitido'
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: { message } }, 502);
  }

  let data: unknown;
  try {
    data = texto ? JSON.parse(texto) : null;
  } catch {
    data = texto;
  }
  return json({ status: res.status, ok: res.ok, data });
}

function validarCargaTransacional(stmts: string[]): string | null {
  if (stmts.length > MAX_TRANSACTION_STATEMENTS) {
    return `transação excede o limite de ${MAX_TRANSACTION_STATEMENTS} statements`;
  }

  const totalBytes = stmts.reduce((acc, stmt) => acc + medirBytes(stmt), 0);
  if (totalBytes > MAX_TRANSACTION_BYTES) {
    return `transação excede o limite de ${MAX_TRANSACTION_BYTES} bytes`;
  }

  if (stmts.every((stmt) => stmt.trim().length === 0)) {
    return 'transação deve conter ao menos um statement não vazio';
  }

  return null;
}

async function handleTransaction(
  stmtsB64: string,
  allowAllRows: boolean,
  deps: RuntimeDeps
): Promise<Response> {
  const dbUrl = runtimeValue(deps.dbUrl, 'SUPABASE_DB_URL');
  const sqlFactory = deps.getSql ?? getSql;
  if (!dbUrl) return json({ error: 'server_misconfigured' }, 500);

  const erroPayloadCodificado = validarCargaBase64(
    stmtsB64,
    MAX_TRANSACTION_PAYLOAD_B64_BYTES,
    'stmts_b64'
  );
  if (erroPayloadCodificado) return json({ error: erroPayloadCodificado }, 400);

  let stmts: string[];
  try {
    const bruto = JSON.parse(decodeB64(stmtsB64));
    if (!Array.isArray(bruto)) throw new Error('payload não é array');
    if (!bruto.every((stmt) => typeof stmt === 'string')) {
      throw new Error('payload deve conter apenas strings');
    }
    stmts = bruto;
  } catch (e) {
    return json({ error: 'stmts_b64 inválido: ' + String(e) }, 400);
  }

  const erroCarga = validarCargaTransacional(stmts);
  if (erroCarga) return json({ error: erroCarga }, 400);

  let apenasLeitura = true;
  for (const stmt of stmts) {
    const s = stmt.trim();
    if (!s) continue;
    const avaliacao = avaliarSqlMcp(s, allowAllRows);
    if (avaliacao.motivoBloqueio) {
      return json(
        {
          error: 'SQL bloqueado pela política de segurança do MCP',
          reason: avaliacao.motivoBloqueio,
          statement: s.slice(0, 160),
        },
        400
      );
    }
    apenasLeitura &&= avaliacao.somenteLeitura;
  }

  try {
    const client = sqlFactory(dbUrl);
    const results = await executarConsultaComTimeouts(
      client,
      async (tx) => {
        const res: Array<{ rows: unknown[]; count: number }> = [];
        for (const stmt of stmts) {
          const s = stmt.trim();
          if (!s) continue;
          const rows = await tx.unsafe(s);
          const lista = Array.isArray(rows) ? Array.from(rows) : [rows];
          res.push({ rows: lista, count: lista.length });
        }
        return res;
      },
      apenasLeitura
    );

    return json({ results, committed: true, statements: results.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return json({ error: { message } }, 400);
  }
}

export function createHandler(deps: RuntimeDeps = {}) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (req.method !== 'POST') {
      return json({ error: 'method_not_allowed' }, 405);
    }

    const secret = runtimeValue(deps.secret, 'MCP_SECRET');
    if (!secret) return json({ error: 'server_misconfigured' }, 500);
    if (!timingSafeEqual(req.headers.get('x-mcp-secret'), secret)) {
      return json({ error: 'unauthorized' }, 401);
    }

    const contentLengthHeader = req.headers.get('content-length');
    if (contentLengthHeader !== null) {
      const contentLength = Number(contentLengthHeader);
      if (!Number.isFinite(contentLength) || contentLength < 0) {
        return json({ error: 'content-length inválido' }, 400);
      }
      if (contentLength > MAX_RAW_BODY_BYTES) {
        return json({ error: 'payload excede o limite bruto de 2 MiB' }, 413);
      }
    }

    let rawBodyText: string;
    try {
      rawBodyText = await lerTextoLimitado(
        req.body,
        MAX_RAW_BODY_BYTES,
        'payload excede o limite bruto de 2 MiB'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes('2 MiB') ? 413 : 400;
      return json({ error: message }, status);
    }

    let rawBody: unknown;
    try {
      rawBody = JSON.parse(rawBodyText);
    } catch {
      return json({ error: 'invalid json' }, 400);
    }

    const parsed = RequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return json({ error: 'invalid payload', details: parsed.error.format() }, 400);
    }

    const body = parsed.data;
    const erroModo = validarModo(body);
    if (erroModo) return json({ error: erroModo }, 400);
    if (body.admin) return await handleAdmin(body.admin, deps);
    if (body.stmts_b64) {
      return await handleTransaction(body.stmts_b64, !!body.allow_all_rows, deps);
    }

    const dbUrl = runtimeValue(deps.dbUrl, 'SUPABASE_DB_URL');
    const sqlFactory = deps.getSql ?? getSql;
    if (!dbUrl) return json({ error: 'server_misconfigured' }, 500);

    let bruto = body.sql ?? '';
    if (body.sql_b64) {
      const erroPayloadCodificado = validarCargaBase64(
        body.sql_b64,
        MAX_QUERY_B64_BYTES,
        'sql_b64'
      );
      if (erroPayloadCodificado) {
        return json({ error: erroPayloadCodificado }, 400);
      }
      try {
        bruto = decodeB64(body.sql_b64);
      } catch {
        return json({ error: 'sql_b64 inválido' }, 400);
      }
    }

    const query = bruto.trim();
    if (!query) return json({ error: 'empty sql' }, 400);
    if (medirBytes(query) > MAX_QUERY_BYTES) {
      return json({ error: `sql excede o limite de ${MAX_QUERY_BYTES} bytes` }, 400);
    }

    const limite = Number.isFinite(body.limit) ? Math.trunc(body.limit as number) : 100;
    const limiteSeguro = Math.min(Math.max(limite, 1), 10_000);
    const avaliacao = avaliarSqlMcp(query, !!body.allow_all_rows, limiteSeguro);
    if (avaliacao.motivoBloqueio) {
      return json(
        {
          error: 'SQL bloqueado pela política de segurança do MCP',
          reason: avaliacao.motivoBloqueio,
          statement: query.slice(0, 160),
        },
        400
      );
    }

    try {
      const client = sqlFactory(dbUrl);
      const rows = await executarConsultaComTimeouts(
        client,
        (tx) => tx.unsafe(avaliacao.finalSql),
        avaliacao.somenteLeitura
      );
      const bruto2 = Array.isArray(rows) ? Array.from(rows) : [rows];
      const multi = bruto2.length > 0 && bruto2.every((r) => Array.isArray(r));
      const lista = multi ? bruto2.flatMap((r) => Array.from(r as unknown[])) : bruto2;
      return json({
        rows: lista,
        count: lista.length,
        statements: multi ? bruto2.length : 1,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return json({ error: { message } }, 400);
    }
  };
}

export const handler = createHandler();

if (import.meta.main) {
  Deno.serve(handler);
}
