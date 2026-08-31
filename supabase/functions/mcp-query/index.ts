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

import * as postgresModule from "https://esm.sh/postgres@3.4.5?target=denonext";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { avaliarSqlMcp } from "./sql-policy.ts";

export type SqlClient = {
  unsafe(query: string): Promise<unknown[]>;
  begin<T>(callback: (transaction: SqlClient) => Promise<T>): Promise<T>;
};

type PostgresFactory = (
  url: string,
  options: Record<string, unknown>,
) => SqlClient;

export interface RuntimeDeps {
  secret?: string | null;
  dbUrl?: string | null;
  serviceKey?: string | null;
  supabaseUrl?: string | null;
  getSql?: (url: string) => SqlClient;
  fetchImpl?: typeof fetch;
}

const postgres =
  (postgresModule as unknown as { default: PostgresFactory }).default;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "x-mcp-secret, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_PATH = /^(storage|auth)\/v1\/[^?#]*$/;
const ADMIN_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const MAX_TRANSACTION_STATEMENTS = 100;
const MAX_TRANSACTION_BYTES = 1024 * 1024;
const MAX_QUERY_BYTES = 1024 * 1024;
const MAX_QUERY_B64_BYTES = Math.ceil(MAX_QUERY_BYTES / 3) * 4 + 16;
const MAX_TRANSACTION_PAYLOAD_B64_BYTES =
  Math.ceil((MAX_TRANSACTION_BYTES * 2) / 3) * 4 + 16;
const READ_ONLY_STATEMENT_TIMEOUT_MS = 5000;
const READ_ONLY_LOCK_TIMEOUT_MS = 1000;

const RequestSchema = z.object({
  sql: z.string().optional(),
  sql_b64: z.string().optional(),
  stmts_b64: z.string().optional(),
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
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function decodeB64(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
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

function runtimeValue(
  override: string | null | undefined,
  envName: string,
): string | null {
  if (override !== undefined) return override;
  return Deno.env.get(envName) ?? null;
}

function timingSafeEqual(left: string | null, right: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(left ?? "");
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

function validarCargaBase64(
  payload: string,
  maxBytes: number,
  label: string,
): string | null {
  if (medirBytes(payload) > maxBytes) {
    return `${label} excede o limite de ${maxBytes} bytes codificados`;
  }
  return null;
}

function validarAdminPath(path: string): string | null {
  if (!ADMIN_PATH.test(path)) {
    return "admin.path deve começar com storage/v1/ ou auth/v1/";
  }
  if (path.includes("\\") || path.includes("%")) {
    return "admin.path contém caracteres não permitidos";
  }

  const segmentos = path.split("/");
  if (
    segmentos.some((segmento) =>
      segmento === "" || segmento === "." || segmento === ".."
    )
  ) {
    return "admin.path contém segmentos inválidos";
  }

  return null;
}

async function executarLeituraSomente(
  client: SqlClient,
  query: string,
): Promise<unknown[]> {
  return await client.begin(async (tx) => {
    await tx.unsafe(
      `SET LOCAL statement_timeout = '${READ_ONLY_STATEMENT_TIMEOUT_MS}ms'`,
    );
    await tx.unsafe(
      `SET LOCAL lock_timeout = '${READ_ONLY_LOCK_TIMEOUT_MS}ms'`,
    );
    await tx.unsafe("SET TRANSACTION READ ONLY");
    return await tx.unsafe(query);
  });
}

async function executarConsulta(
  client: SqlClient,
  query: string,
  somenteLeitura: boolean,
): Promise<unknown[]> {
  if (somenteLeitura) return await executarLeituraSomente(client, query);
  return await client.unsafe(query);
}

async function handleAdmin(
  admin: Record<string, unknown>,
  deps: RuntimeDeps,
): Promise<Response> {
  const serviceKey = runtimeValue(deps.serviceKey, "SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = runtimeValue(deps.supabaseUrl, "SUPABASE_URL");
  const fetchImpl = deps.fetchImpl ?? fetch;

  if (!serviceKey || !supabaseUrl) {
    return json({ error: "service_role_indisponivel" }, 500);
  }

  const path = String(admin.path ?? "");
  const erroPath = validarAdminPath(path);
  if (erroPath) return json({ error: erroPath }, 400);

  const method = String(admin.method ?? "GET").toUpperCase();
  if (!ADMIN_METHODS.has(method)) {
    return json({ error: "admin.method não é permitido" }, 400);
  }
  const payload = admin.body;
  const res = await fetchImpl(`${supabaseUrl.replace(/\/$/, "")}/${path}`, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: payload === undefined || payload === null
      ? undefined
      : JSON.stringify(payload),
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

function validarCargaTransacional(stmts: string[]): string | null {
  if (stmts.length > MAX_TRANSACTION_STATEMENTS) {
    return `transação excede o limite de ${MAX_TRANSACTION_STATEMENTS} statements`;
  }

  const totalBytes = stmts.reduce((acc, stmt) => acc + medirBytes(stmt), 0);
  if (totalBytes > MAX_TRANSACTION_BYTES) {
    return `transação excede o limite de ${MAX_TRANSACTION_BYTES} bytes`;
  }

  if (stmts.every((stmt) => stmt.trim().length === 0)) {
    return "transação deve conter ao menos um statement não vazio";
  }

  return null;
}

async function handleTransaction(
  stmtsB64: string,
  allowAllRows: boolean,
  deps: RuntimeDeps,
): Promise<Response> {
  const dbUrl = runtimeValue(deps.dbUrl, "SUPABASE_DB_URL");
  const sqlFactory = deps.getSql ?? getSql;
  if (!dbUrl) return json({ error: "server_misconfigured" }, 500);

  const erroPayloadCodificado = validarCargaBase64(
    stmtsB64,
    MAX_TRANSACTION_PAYLOAD_B64_BYTES,
    "stmts_b64",
  );
  if (erroPayloadCodificado) return json({ error: erroPayloadCodificado }, 400);

  let stmts: string[];
  try {
    const bruto = JSON.parse(decodeB64(stmtsB64));
    if (!Array.isArray(bruto)) throw new Error("payload não é array");
    if (!bruto.every((stmt) => typeof stmt === "string")) {
      throw new Error("payload deve conter apenas strings");
    }
    stmts = bruto;
  } catch (e) {
    return json({ error: "stmts_b64 inválido: " + String(e) }, 400);
  }

  const erroCarga = validarCargaTransacional(stmts);
  if (erroCarga) return json({ error: erroCarga }, 400);

  let apenasLeitura = true;
  for (const stmt of stmts) {
    const s = stmt.trim();
    if (!s) continue;
    const avaliacao = avaliarSqlMcp(s, allowAllRows);
    if (avaliacao.motivoBloqueio) {
      return json({
        error: "SQL bloqueado pela política de segurança do MCP",
        reason: avaliacao.motivoBloqueio,
        statement: s.slice(0, 160),
      }, 400);
    }
    apenasLeitura &&= avaliacao.somenteLeitura;
  }

  try {
    const client = sqlFactory(dbUrl);
    const results = await client.begin(async (tx) => {
      if (apenasLeitura) {
        await tx.unsafe(
          `SET LOCAL statement_timeout = '${READ_ONLY_STATEMENT_TIMEOUT_MS}ms'`,
        );
        await tx.unsafe(
          `SET LOCAL lock_timeout = '${READ_ONLY_LOCK_TIMEOUT_MS}ms'`,
        );
        await tx.unsafe("SET TRANSACTION READ ONLY");
      }

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

export function createHandler(deps: RuntimeDeps = {}) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (req.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405);
    }

    const secret = runtimeValue(deps.secret, "MCP_SECRET");
    if (!secret) return json({ error: "server_misconfigured" }, 500);
    if (!timingSafeEqual(req.headers.get("x-mcp-secret"), secret)) {
      return json({ error: "unauthorized" }, 401);
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return json({ error: "invalid json" }, 400);
    }

    const parsed = RequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return json(
        { error: "invalid payload", details: parsed.error.format() },
        400,
      );
    }

    const body = parsed.data;
    if (body.admin) return await handleAdmin(body.admin, deps);
    if (body.stmts_b64) {
      return await handleTransaction(
        body.stmts_b64,
        !!body.allow_all_rows,
        deps,
      );
    }

    const dbUrl = runtimeValue(deps.dbUrl, "SUPABASE_DB_URL");
    const sqlFactory = deps.getSql ?? getSql;
    if (!dbUrl) return json({ error: "server_misconfigured" }, 500);

    let bruto = body.sql ?? "";
    if (body.sql_b64) {
      const erroPayloadCodificado = validarCargaBase64(
        body.sql_b64,
        MAX_QUERY_B64_BYTES,
        "sql_b64",
      );
      if (erroPayloadCodificado) {
        return json({ error: erroPayloadCodificado }, 400);
      }
      try {
        bruto = decodeB64(body.sql_b64);
      } catch {
        return json({ error: "sql_b64 inválido" }, 400);
      }
    }

    const query = bruto.trim();
    if (!query) return json({ error: "empty sql" }, 400);
    if (medirBytes(query) > MAX_QUERY_BYTES) {
      return json(
        { error: `sql excede o limite de ${MAX_QUERY_BYTES} bytes` },
        400,
      );
    }

    const limite = Number.isFinite(body.limit)
      ? Math.trunc(body.limit as number)
      : 100;
    const limiteSeguro = Math.min(Math.max(limite, 1), 10_000);
    const avaliacao = avaliarSqlMcp(query, !!body.allow_all_rows, limiteSeguro);
    if (avaliacao.motivoBloqueio) {
      return json({
        error: "SQL bloqueado pela política de segurança do MCP",
        reason: avaliacao.motivoBloqueio,
        statement: query.slice(0, 160),
      }, 400);
    }

    try {
      const client = sqlFactory(dbUrl);
      const rows = await executarConsulta(
        client,
        avaliacao.finalSql,
        avaliacao.somenteLeitura,
      );
      const bruto2 = Array.isArray(rows) ? Array.from(rows) : [rows];
      const multi = bruto2.length > 0 && bruto2.every((r) => Array.isArray(r));
      const lista = multi
        ? bruto2.flatMap((r) => Array.from(r as unknown[]))
        : bruto2;
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
