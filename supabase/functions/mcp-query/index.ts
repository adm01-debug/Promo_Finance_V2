/**
 * mcp-query — Proxy SQL com service_role para o MCP Worker (PROMO FINANCE V2)
 * Autenticação: header x-mcp-secret (valor no secret MCP_SECRET)
 * Bloqueia DROP/TRUNCATE/ALTER SYSTEM. Roda via RPC exec_sql (SECURITY DEFINER).
 */

const SECRET = Deno.env.get("MCP_SECRET");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "x-mcp-secret, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DESTRUCTIVE = /\b(DROP|TRUNCATE|ALTER\s+SYSTEM|RESET\s+ALL)\b/i;
const IS_SELECT = /^\s*(SELECT|WITH)\b/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  if (!SECRET) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  if (req.headers.get("x-mcp-secret") !== SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  let body: { sql?: string; limit?: number };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const { sql = "", limit = 100 } = body;
  if (!sql.trim()) {
    return new Response(JSON.stringify({ error: "empty sql" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  if (DESTRUCTIVE.test(sql)) {
    return new Response(
      JSON.stringify({ error: "Query destrutiva bloqueada (DROP/TRUNCATE/ALTER SYSTEM)" }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const finalSql = IS_SELECT.test(sql) && !/\blimit\b/i.test(sql)
    ? `${sql} LIMIT ${limit}`
    : sql;

  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
      "apikey": key,
    },
    body: JSON.stringify({ query: finalSql }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return new Response(JSON.stringify({ error: data ?? { http: res.status } }), {
      status: res.status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const rows = Array.isArray(data) ? data : [data];
  return new Response(JSON.stringify({ rows, count: rows.length }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
