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
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userId = user.id;
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
      // ═══════════════ CONTATOS ═══════════════
      case "listar_contatos":
        return await blingGet(accessToken, "/contatos", params.filtros);
      case "buscar_contato":
        return await blingGet(accessToken, `/contatos/${params.id}`);
      case "criar_contato":
        return await blingPost(accessToken, "/contatos", params.data);
      case "atualizar_contato":
        return await blingPut(accessToken, `/contatos/${params.id}`, params.data);
      case "alterar_situacao_contato":
        return await blingRequest(accessToken, "PATCH", `/contatos/${params.id}/situacoes`, params.data);
      case "alterar_situacao_contatos_lote":
        return await blingPost(accessToken, "/contatos/situacoes", params.data);
      case "excluir_contatos":
        return await blingRequest(accessToken, "DELETE", "/contatos", { idsContatos: params.ids });
      case "tipos_contato":
        return await blingGet(accessToken, "/contatos/tipos");
      case "consumidor_final":
        return await blingGet(accessToken, "/contatos/consumidor-final");

      // ═══════════════ PEDIDOS DE VENDA ═══════════════
      case "listar_pedidos":
        return await blingGet(accessToken, "/pedidos/vendas", params.filtros);
      case "buscar_pedido":
        return await blingGet(accessToken, `/pedidos/vendas/${params.id}`);
      case "criar_pedido":
        return await blingPost(accessToken, "/pedidos/vendas", params.data);
      case "atualizar_pedido":
        return await blingPut(accessToken, `/pedidos/vendas/${params.id}`, params.data);
      case "excluir_pedidos":
        return await blingRequest(accessToken, "DELETE", "/pedidos/vendas", { idsPedidosVendas: params.ids });
      case "alterar_situacao_pedido":
        return await blingRequest(accessToken, "PATCH", `/pedidos/vendas/${params.id}/situacoes/${params.idSituacao}`);
      case "lancar_estoque_pedido":
        return await blingPost(accessToken, `/pedidos/vendas/${params.id}/lancar-estoque`);
      case "estornar_estoque_pedido":
        return await blingPost(accessToken, `/pedidos/vendas/${params.id}/estornar-estoque`);
      case "lancar_contas_pedido":
        return await blingPost(accessToken, `/pedidos/vendas/${params.id}/lancar-contas`);
      case "estornar_contas_pedido":
        return await blingPost(accessToken, `/pedidos/vendas/${params.id}/estornar-contas`);
      case "gerar_nfe_pedido":
        return await blingPost(accessToken, `/pedidos/vendas/${params.id}/gerar-nfe`);
      case "gerar_nfce_pedido":
        return await blingPost(accessToken, `/pedidos/vendas/${params.id}/gerar-nfce`);

      // ═══════════════ PRODUTOS ═══════════════
      case "listar_produtos":
        return await blingGet(accessToken, "/produtos", params.filtros);
      case "buscar_produto":
        return await blingGet(accessToken, `/produtos/${params.id}`);
      case "criar_produto":
        return await blingPost(accessToken, "/produtos", params.data);
      case "atualizar_produto":
        return await blingPut(accessToken, `/produtos/${params.id}`, params.data);
      case "atualizar_produto_parcial":
        return await blingRequest(accessToken, "PATCH", `/produtos/${params.id}`, params.data);
      case "excluir_produtos":
        return await blingRequest(accessToken, "DELETE", "/produtos", { idsProdutos: params.ids });
      // Variações
      case "listar_variacoes":
        return await blingGet(accessToken, `/produtos/${params.id}/variacoes`);
      case "criar_variacoes":
        return await blingPost(accessToken, `/produtos/${params.id}/variacoes`, params.data);
      case "gerar_combinacoes":
        return await blingPost(accessToken, "/produtos/variacoes/atributos/gerar-combinacoes", params.data);
      // Estrutura/Kit
      case "buscar_estrutura":
        return await blingGet(accessToken, `/produtos/estruturas/${params.id}`);
      case "atualizar_estrutura":
        return await blingPut(accessToken, `/produtos/estruturas/${params.id}`, params.data);
      case "excluir_estrutura":
        return await blingRequest(accessToken, "DELETE", `/produtos/estruturas/${params.id}`);
      // Produto-Fornecedor
      case "listar_produto_fornecedores":
        return await blingGet(accessToken, "/produtos/fornecedores", params.filtros);
      case "criar_produto_fornecedor":
        return await blingPost(accessToken, "/produtos/fornecedores", params.data);
      case "atualizar_produto_fornecedor":
        return await blingPut(accessToken, `/produtos/fornecedores/${params.id}`, params.data);
      case "excluir_produto_fornecedor":
        return await blingRequest(accessToken, "DELETE", `/produtos/fornecedores/${params.id}`);
      // Produto-Loja
      case "listar_produto_lojas":
        return await blingGet(accessToken, "/produtos/lojas", params.filtros);
      case "criar_produto_loja":
        return await blingPost(accessToken, "/produtos/lojas", params.data);
      case "atualizar_produto_loja":
        return await blingPut(accessToken, `/produtos/lojas/${params.id}`, params.data);
      case "excluir_produto_loja":
        return await blingRequest(accessToken, "DELETE", `/produtos/lojas/${params.id}`);
      // Lotes
      case "listar_lotes":
        return await blingGet(accessToken, "/produtos/lotes", params.filtros);
      case "atualizar_lote":
        return await blingPut(accessToken, `/produtos/lotes/${params.id}`, params.data);
      case "excluir_lote":
        return await blingRequest(accessToken, "DELETE", `/produtos/lotes/${params.id}`);

      // ═══════════════ ESTOQUE ═══════════════
      case "saldos_estoque":
        return await blingGet(accessToken, "/estoques/saldos", params.filtros);
      case "lancar_estoque":
        return await blingPost(accessToken, "/estoques", params.data);
      case "listar_depositos":
        return await blingGet(accessToken, "/depositos");
      case "criar_deposito":
        return await blingPost(accessToken, "/depositos", params.data);
      case "atualizar_deposito":
        return await blingPut(accessToken, `/depositos/${params.id}`, params.data);

      // ═══════════════ FINANCEIRO ═══════════════
      // Contas a Receber
      case "listar_contas_receber":
        return await blingGet(accessToken, "/contas/receber", params.filtros);
      case "buscar_conta_receber":
        return await blingGet(accessToken, `/contas/receber/${params.id}`);
      case "criar_conta_receber":
        return await blingPost(accessToken, "/contas/receber", params.data);
      case "atualizar_conta_receber":
        return await blingPut(accessToken, `/contas/receber/${params.id}`, params.data);
      case "excluir_conta_receber":
        return await blingRequest(accessToken, "DELETE", `/contas/receber/${params.id}`);
      case "baixa_conta_receber":
        return await blingPost(accessToken, `/contas/receber/${params.id}/baixas`, params.data);
      case "estornar_baixa_receber":
        return await blingRequest(accessToken, "DELETE", `/contas/receber/${params.id}/baixas/${params.baixaId}`);
      // Contas a Pagar
      case "listar_contas_pagar":
        return await blingGet(accessToken, "/contas/pagar", params.filtros);
      case "buscar_conta_pagar":
        return await blingGet(accessToken, `/contas/pagar/${params.id}`);
      case "criar_conta_pagar":
        return await blingPost(accessToken, "/contas/pagar", params.data);
      case "atualizar_conta_pagar":
        return await blingPut(accessToken, `/contas/pagar/${params.id}`, params.data);
      case "excluir_conta_pagar":
        return await blingRequest(accessToken, "DELETE", `/contas/pagar/${params.id}`);
      case "baixa_conta_pagar":
        return await blingPost(accessToken, `/contas/pagar/${params.id}/baixas`, params.data);
      case "estornar_baixa_pagar":
        return await blingRequest(accessToken, "DELETE", `/contas/pagar/${params.id}/baixas/${params.baixaId}`);
      // Borderôs
      case "listar_borderos":
        return await blingGet(accessToken, "/borderos", params.filtros);
      case "criar_bordero":
        return await blingPost(accessToken, "/borderos", params.data);
      case "excluir_bordero":
        return await blingRequest(accessToken, "DELETE", `/borderos/${params.id}`);
      // Contas Contábeis (Portadores)
      case "listar_contas_contabeis":
        return await blingGet(accessToken, "/contas-contabeis");
      case "criar_conta_contabil":
        return await blingPost(accessToken, "/contas-contabeis", params.data);
      // Formas de Pagamento
      case "formas_pagamento":
        return await blingGet(accessToken, "/formas-pagamentos");
      case "criar_forma_pagamento":
        return await blingPost(accessToken, "/formas-pagamentos", params.data);
      case "atualizar_forma_pagamento":
        return await blingPut(accessToken, `/formas-pagamentos/${params.id}`, params.data);
      case "excluir_forma_pagamento":
        return await blingRequest(accessToken, "DELETE", `/formas-pagamentos/${params.id}`);
      // Categorias Receitas/Despesas
      case "categorias_receitas_despesas":
        return await blingGet(accessToken, "/categorias/receitas-despesas");
      case "criar_categoria":
        return await blingPost(accessToken, "/categorias/receitas-despesas", params.data);

      // ═══════════════ NF-e / FISCAL ═══════════════
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
      case "lancar_estoque_nfe":
        return await blingPost(accessToken, `/nfe/${params.id}/lancar-estoque`);
      case "lancar_contas_nfe":
        return await blingPost(accessToken, `/nfe/${params.id}/lancar-contas`);
      case "estornar_estoque_nfe":
        return await blingPost(accessToken, `/nfe/${params.id}/estornar-estoque`);
      case "estornar_contas_nfe":
        return await blingPost(accessToken, `/nfe/${params.id}/estornar-contas`);

      // ═══════════════ LOGÍSTICA ═══════════════
      case "listar_logisticas":
        return await blingGet(accessToken, "/logisticas");
      case "listar_servicos_logistica":
        return await blingGet(accessToken, "/logisticas/servicos");
      case "listar_remessas":
        return await blingGet(accessToken, "/logisticas/remessas", params.filtros);
      case "buscar_remessa":
        return await blingGet(accessToken, `/logisticas/remessas/${params.id}`);
      case "criar_remessa":
        return await blingPost(accessToken, "/logisticas/remessas", params.data);
      case "listar_objetos":
        return await blingGet(accessToken, "/logisticas/objetos", params.filtros);
      case "rastrear_objeto":
        return await blingGet(accessToken, `/logisticas/objetos/${params.codigo}`);
      case "atualizar_objeto":
        return await blingPut(accessToken, `/logisticas/objetos/${params.id}`, params.data);
      case "gerar_etiqueta":
        return await blingPost(accessToken, "/logisticas/etiquetas", params.data);
      case "baixar_etiqueta":
        return await blingGet(accessToken, `/logisticas/etiquetas/${params.id}`);

      // ═══════════════ EMPRESA ═══════════════
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

  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, serviceRole);

  await adminClient.from("bling_tokens").delete().neq("id", "00000000-0000-0000-0000-000000000000");

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
      return token.access_token;
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
