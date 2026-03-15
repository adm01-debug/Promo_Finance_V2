import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BLING_API_BASE = "https://api.bling.com.br/Api/v3";
const BLING_AUTH_BASE = "https://www.bling.com.br/Api/v3/oauth";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const { action, ...params } = body;

    // --- OAuth Actions ---
    if (action === "oauth_callback") {
      return await handleOAuthCallback(supabase, params, userId);
    }

    // --- Get valid access token ---
    const accessToken = await getValidAccessToken(supabase);
    if (!accessToken) {
      return jsonResponse({ error: "Token Bling não configurado. Faça a autenticação OAuth primeiro." }, 401);
    }

    // --- API Actions ---
    switch (action) {
      // Contatos
      case "listar_contatos":
        return await blingGet(accessToken, "/contatos", params.filtros);
      case "buscar_contato":
        return await blingGet(accessToken, `/contatos/${params.id}`);
      case "criar_contato":
        return await blingPost(accessToken, "/contatos", params.data);
      case "atualizar_contato":
        return await blingPut(accessToken, `/contatos/${params.id}`, params.data);
      case "tipos_contato":
        return await blingGet(accessToken, "/contatos/tipos");

      // Pedidos de Venda
      case "listar_pedidos":
        return await blingGet(accessToken, "/pedidos/vendas", params.filtros);
      case "buscar_pedido":
        return await blingGet(accessToken, `/pedidos/vendas/${params.id}`);
      case "criar_pedido":
        return await blingPost(accessToken, "/pedidos/vendas", params.data);
      case "atualizar_pedido":
        return await blingPut(accessToken, `/pedidos/vendas/${params.id}`, params.data);
      case "alterar_situacao_pedido":
        return await blingRequest(accessToken, "PATCH", `/pedidos/vendas/${params.id}/situacoes/${params.idSituacao}`);
      case "gerar_nfe_pedido":
        return await blingPost(accessToken, `/pedidos/vendas/${params.id}/gerar-nfe`);
      case "lancar_contas_pedido":
        return await blingPost(accessToken, `/pedidos/vendas/${params.id}/lancar-contas`);
      case "lancar_estoque_pedido":
        return await blingPost(accessToken, `/pedidos/vendas/${params.id}/lancar-estoque`);

      // Produtos
      case "listar_produtos":
        return await blingGet(accessToken, "/produtos", params.filtros);
      case "buscar_produto":
        return await blingGet(accessToken, `/produtos/${params.id}`);
      case "criar_produto":
        return await blingPost(accessToken, "/produtos", params.data);
      case "atualizar_produto":
        return await blingPut(accessToken, `/produtos/${params.id}`, params.data);

      // Estoque
      case "saldos_estoque":
        return await blingGet(accessToken, "/estoques/saldos", params.filtros);
      case "lancar_estoque":
        return await blingPost(accessToken, "/estoques", params.data);
      case "listar_depositos":
        return await blingGet(accessToken, "/depositos");

      // Financeiro
      case "listar_contas_receber":
        return await blingGet(accessToken, "/contas/receber", params.filtros);
      case "buscar_conta_receber":
        return await blingGet(accessToken, `/contas/receber/${params.id}`);
      case "criar_conta_receber":
        return await blingPost(accessToken, "/contas/receber", params.data);
      case "baixa_conta_receber":
        return await blingPost(accessToken, `/contas/receber/${params.id}/baixas`, params.data);
      case "listar_contas_pagar":
        return await blingGet(accessToken, "/contas/pagar", params.filtros);
      case "buscar_conta_pagar":
        return await blingGet(accessToken, `/contas/pagar/${params.id}`);
      case "criar_conta_pagar":
        return await blingPost(accessToken, "/contas/pagar", params.data);
      case "baixa_conta_pagar":
        return await blingPost(accessToken, `/contas/pagar/${params.id}/baixas`, params.data);
      case "formas_pagamento":
        return await blingGet(accessToken, "/formas-pagamentos");
      case "categorias_receitas_despesas":
        return await blingGet(accessToken, "/categorias/receitas-despesas");

      // NF-e
      case "listar_nfe":
        return await blingGet(accessToken, "/nfe", params.filtros);
      case "buscar_nfe":
        return await blingGet(accessToken, `/nfe/${params.id}`);
      case "criar_nfe":
        return await blingPost(accessToken, "/nfe", params.data);
      case "enviar_nfe_sefaz":
        return await blingPost(accessToken, `/nfe/${params.id}/enviar${params.enviarEmail ? '?enviarEmail=true' : ''}`);
      case "cancelar_nfe":
        return await blingRequest(accessToken, "DELETE", "/nfe", { idsNotas: params.ids });

      // Logística
      case "listar_logisticas":
        return await blingGet(accessToken, "/logisticas");
      case "listar_remessas":
        return await blingGet(accessToken, "/logisticas/remessas", params.filtros);
      case "criar_remessa":
        return await blingPost(accessToken, "/logisticas/remessas", params.data);
      case "gerar_etiqueta":
        return await blingPost(accessToken, "/logisticas/etiquetas", params.data);

      // Empresas/Saúde
      case "dados_empresa":
        return await blingGet(accessToken, "/empresas/me/dados-basicos");

      default:
        return jsonResponse({ error: `Ação desconhecida: ${action}` }, 400);
    }
  } catch (error) {
    console.error("Bling proxy error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Erro interno" },
      500
    );
  }
});

// --- OAuth Callback Handler ---
async function handleOAuthCallback(
  supabase: any,
  params: { code: string; redirect_uri: string },
  userId: string
) {
  const clientId = Deno.env.get("BLING_CLIENT_ID");
  const clientSecret = Deno.env.get("BLING_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    return jsonResponse({ error: "BLING_CLIENT_ID e BLING_CLIENT_SECRET não configurados" }, 500);
  }

  const basicAuth = btoa(`${clientId}:${clientSecret}`);

  const tokenRes = await fetch(`${BLING_AUTH_BASE}/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: params.code,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error("Bling OAuth error:", errText);
    return jsonResponse({ error: "Falha ao trocar código OAuth", details: errText }, 400);
  }

  const tokenData = await tokenRes.json();

  // Use service role to store token
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, serviceRole);

  // Delete old tokens
  await adminClient.from("bling_tokens").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Store new token
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
  const { error: insertError } = await adminClient.from("bling_tokens").insert({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: expiresAt,
    created_by: userId,
  });

  if (insertError) {
    console.error("Error storing Bling token:", insertError);
    return jsonResponse({ error: "Erro ao salvar token" }, 500);
  }

  return jsonResponse({ success: true, expires_in: tokenData.expires_in });
}

// --- Token Management ---
async function getValidAccessToken(supabase: any): Promise<string | null> {
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, serviceRole);

  const { data: tokens } = await adminClient
    .from("bling_tokens")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (!tokens || tokens.length === 0) return null;

  const token = tokens[0];
  const expiresAt = new Date(token.expires_at);
  const now = new Date();

  // If token expires in less than 30 minutes, refresh it
  if (expiresAt.getTime() - now.getTime() < 30 * 60 * 1000) {
    return await refreshAccessToken(adminClient, token);
  }

  return token.access_token;
}

async function refreshAccessToken(adminClient: any, token: any): Promise<string | null> {
  const clientId = Deno.env.get("BLING_CLIENT_ID");
  const clientSecret = Deno.env.get("BLING_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;

  const basicAuth = btoa(`${clientId}:${clientSecret}`);

  try {
    const res = await fetch(`${BLING_AUTH_BASE}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refresh_token,
      }),
    });

    if (!res.ok) {
      console.error("Bling refresh failed:", await res.text());
      return token.access_token; // Return current token as fallback
    }

    const data = await res.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

    await adminClient
      .from("bling_tokens")
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: expiresAt,
      })
      .eq("id", token.id);

    return data.access_token;
  } catch (e) {
    console.error("Bling refresh error:", e);
    return token.access_token;
  }
}

// --- Bling API Helpers ---
async function blingGet(accessToken: string, path: string, params?: Record<string, any>) {
  let url = `${BLING_API_BASE}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(`${key}[]`, String(v)));
        } else {
          searchParams.set(key, String(value));
        }
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  return await blingFetch(accessToken, url, "GET");
}

async function blingPost(accessToken: string, path: string, data?: any) {
  return await blingFetch(accessToken, `${BLING_API_BASE}${path}`, "POST", data);
}

async function blingPut(accessToken: string, path: string, data?: any) {
  return await blingFetch(accessToken, `${BLING_API_BASE}${path}`, "PUT", data);
}

async function blingRequest(accessToken: string, method: string, path: string, data?: any) {
  return await blingFetch(accessToken, `${BLING_API_BASE}${path}`, method, data);
}

async function blingFetch(accessToken: string, url: string, method: string, data?: any) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };
  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    headers["Content-Type"] = "application/json";
  }

  const opts: RequestInit = { method, headers };
  if (data && method !== "GET") {
    opts.body = JSON.stringify(data);
  }

  // Rate limit: wait 350ms between calls
  await new Promise((r) => setTimeout(r, 350));

  const res = await fetch(url, opts);
  const contentType = res.headers.get("content-type") || "";

  let responseData: any;
  if (contentType.includes("application/json")) {
    responseData = await res.json();
  } else {
    responseData = { raw: await res.text() };
  }

  if (!res.ok) {
    console.error(`Bling API error [${res.status}]:`, JSON.stringify(responseData));
    return jsonResponse(
      { error: `Bling API error`, status: res.status, details: responseData },
      res.status === 429 ? 429 : res.status >= 500 ? 502 : 400
    );
  }

  return jsonResponse(responseData);
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
