import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import {
  BlingProxySchema,
  corsHeaders,
  validatePayload,
  createErrorResponse,
} from '../_shared/validation.ts';
import {
  withRetry,
  respostaIntegracaoDesativada,
  createCircuitBreaker,
  withTimeout,
} from '../_shared/resilience.ts';
import { corsHeadersPara } from '../_shared/cors.ts';
import { createLogger } from '../_shared/observability.ts';
import { mensagemErro, contextoErro } from '../_shared/erros.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
const log = createLogger('bling-proxy');

const BLING_API_BASE = 'https://api.bling.com.br/Api/v3';
const BLING_AUTH_BASE = 'https://www.bling.com.br/Api/v3/oauth';
const blingCB = createCircuitBreaker('bling');
const BLING_FETCH_TIMEOUT_MS = 10000;

Deno.serve(
  withEdgeObservability('bling-proxy', async (req) => {
    const _t0 = Date.now();
    try {
      const corsHeaders = corsHeadersPara(req);
      if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
        }

        const userId = user.id;
        const rawBody = await req.json();
        const validation = validatePayload(BlingProxySchema, rawBody, 'bling-proxy');
        if (!validation.success) {
          return createErrorResponse(validation.error, 400, validation.details, req);
        }
        const { action, ...params } = validation.data;

        // Etapa E-007 (PLANO_100.md): acoes destrutivas do Bling exigiam apenas sessao
        // valida, sem checagem de role (A-012 em AUDITORIA.md). Mesmo padrao de RBAC ja
        // usado em asaas-proxy: exige admin ou financeiro antes de excluir/cancelar/baixar.
        const ACOES_DESTRUTIVAS = new Set([
          'excluir_produtos',
          'excluir_conta_pagar',
          'excluir_conta_receber',
          'cancelar_nfe',
          'estornar_contas_nfe',
          'baixa_conta_pagar',
          'excluir_bordero',
        ]);
        if (ACOES_DESTRUTIVAS.has(action)) {
          const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const adminClient = createClient(supabaseUrl, serviceRoleKey);
          const { data: roleData } = await adminClient
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .in('role', ['admin', 'financeiro'])
            .limit(1)
            .maybeSingle();
          if (!roleData) {
            return jsonResponse(
              { error: 'Sem permissao para executar esta acao' },
              403,
              corsHeaders
            );
          }
        }

        // Depois da autenticação e do RBAC — ação destrutiva sem permissão recebe
        // 403 e não o 503 que vazaria a configuração do kill-switch.
        // Ações só locais passam mesmo com a integração desativada —
        // revogar_token é limpeza de linha própria, não chamada ao provedor.
        if (action === 'revogar_token') {
          return await handleTokenRevocation(supabase, corsHeaders);
        }

        const inativa = respostaIntegracaoDesativada('bling', corsHeaders);
        if (inativa) return inativa;

        // --- OAuth Actions ---
        if (action === 'oauth_callback') {
          return await handleOAuthCallback(supabase, params, userId, corsHeaders);
        }

        // --- Get valid access token ---
        const accessToken = await getValidAccessToken(supabase);
        if (!accessToken) {
          return jsonResponse(
            { error: 'Token Bling não configurado. Faça a autenticação OAuth primeiro.' },
            401,
            corsHeaders
          );
        }

        // --- API Actions ---
        switch (action) {
          // ═══════════════ CONTATOS ═══════════════
          case 'listar_contatos':
            return await blingGet(accessToken, '/contatos', params.filtros, corsHeaders);
          case 'buscar_contato':
            return await blingGet(accessToken, `/contatos/${params.id}`, undefined, corsHeaders);
          case 'criar_contato':
            return await blingPost(accessToken, '/contatos', params.data, corsHeaders);
          case 'atualizar_contato':
            return await blingPut(accessToken, `/contatos/${params.id}`, params.data, corsHeaders);
          case 'alterar_situacao_contato':
            return await blingRequest(
              accessToken,
              'PATCH',
              `/contatos/${params.id}/situacoes`,
              params.data,
              corsHeaders
            );
          case 'alterar_situacao_contatos_lote':
            return await blingPost(accessToken, '/contatos/situacoes', params.data, corsHeaders);
          case 'excluir_contatos':
            return await blingRequest(
              accessToken,
              'DELETE',
              '/contatos',
              { idsContatos: params.ids },
              corsHeaders
            );
          case 'tipos_contato':
            return await blingGet(accessToken, '/contatos/tipos', undefined, corsHeaders);
          case 'consumidor_final':
            return await blingGet(
              accessToken,
              '/contatos/consumidor-final',
              undefined,
              corsHeaders
            );

          // ═══════════════ PEDIDOS DE VENDA ═══════════════
          case 'listar_pedidos':
            return await blingGet(accessToken, '/pedidos/vendas', params.filtros, corsHeaders);
          case 'buscar_pedido':
            return await blingGet(
              accessToken,
              `/pedidos/vendas/${params.id}`,
              undefined,
              corsHeaders
            );
          case 'criar_pedido':
            return await blingPost(accessToken, '/pedidos/vendas', params.data, corsHeaders);
          case 'atualizar_pedido':
            return await blingPut(
              accessToken,
              `/pedidos/vendas/${params.id}`,
              params.data,
              corsHeaders
            );
          case 'excluir_pedidos':
            return await blingRequest(
              accessToken,
              'DELETE',
              '/pedidos/vendas',
              {
                idsPedidosVendas: params.ids,
              },
              corsHeaders
            );
          case 'alterar_situacao_pedido':
            return await blingRequest(
              accessToken,
              'PATCH',
              `/pedidos/vendas/${params.id}/situacoes/${params.idSituacao}`,
              corsHeaders
            );
          case 'lancar_estoque_pedido':
            return await blingPost(
              accessToken,
              `/pedidos/vendas/${params.id}/lancar-estoque`,
              undefined,
              corsHeaders
            );
          case 'estornar_estoque_pedido':
            return await blingPost(
              accessToken,
              `/pedidos/vendas/${params.id}/estornar-estoque`,
              undefined,
              corsHeaders
            );
          case 'lancar_contas_pedido':
            return await blingPost(
              accessToken,
              `/pedidos/vendas/${params.id}/lancar-contas`,
              undefined,
              corsHeaders
            );
          case 'estornar_contas_pedido':
            return await blingPost(
              accessToken,
              `/pedidos/vendas/${params.id}/estornar-contas`,
              undefined,
              corsHeaders
            );
          case 'gerar_nfe_pedido':
            return await blingPost(
              accessToken,
              `/pedidos/vendas/${params.id}/gerar-nfe`,
              undefined,
              corsHeaders
            );
          case 'gerar_nfce_pedido':
            return await blingPost(
              accessToken,
              `/pedidos/vendas/${params.id}/gerar-nfce`,
              undefined,
              corsHeaders
            );

          // ═══════════════ PEDIDOS DE COMPRA (Gap #14) ═══════════════
          case 'listar_pedidos_compra':
            return await blingGet(accessToken, '/pedidos/compras', params.filtros, corsHeaders);
          case 'buscar_pedido_compra':
            return await blingGet(
              accessToken,
              `/pedidos/compras/${params.id}`,
              undefined,
              corsHeaders
            );
          case 'criar_pedido_compra':
            return await blingPost(accessToken, '/pedidos/compras', params.data, corsHeaders);
          case 'atualizar_pedido_compra':
            return await blingPut(
              accessToken,
              `/pedidos/compras/${params.id}`,
              params.data,
              corsHeaders
            );
          case 'excluir_pedidos_compra':
            return await blingRequest(
              accessToken,
              'DELETE',
              '/pedidos/compras',
              {
                idsPedidosCompras: params.ids,
              },
              corsHeaders
            );

          // ═══════════════ PRODUTOS ═══════════════
          case 'listar_produtos':
            return await blingGet(accessToken, '/produtos', params.filtros, corsHeaders);
          case 'buscar_produto':
            return await blingGet(accessToken, `/produtos/${params.id}`, undefined, corsHeaders);
          case 'criar_produto':
            return await blingPost(accessToken, '/produtos', params.data, corsHeaders);
          case 'atualizar_produto':
            return await blingPut(accessToken, `/produtos/${params.id}`, params.data, corsHeaders);
          case 'atualizar_produto_parcial':
            return await blingRequest(
              accessToken,
              'PATCH',
              `/produtos/${params.id}`,
              params.data,
              corsHeaders
            );
          case 'excluir_produtos':
            return await blingRequest(
              accessToken,
              'DELETE',
              '/produtos',
              { idsProdutos: params.ids },
              corsHeaders
            );
          case 'listar_variacoes':
            return await blingGet(
              accessToken,
              `/produtos/${params.id}/variacoes`,
              undefined,
              corsHeaders
            );
          case 'criar_variacoes':
            return await blingPost(
              accessToken,
              `/produtos/${params.id}/variacoes`,
              params.data,
              corsHeaders
            );
          case 'gerar_combinacoes':
            return await blingPost(
              accessToken,
              '/produtos/variacoes/atributos/gerar-combinacoes',
              params.data,
              corsHeaders
            );
          case 'buscar_estrutura':
            return await blingGet(
              accessToken,
              `/produtos/estruturas/${params.id}`,
              undefined,
              corsHeaders
            );
          case 'atualizar_estrutura':
            return await blingPut(
              accessToken,
              `/produtos/estruturas/${params.id}`,
              params.data,
              corsHeaders
            );
          case 'excluir_estrutura':
            return await blingRequest(
              accessToken,
              'DELETE',
              `/produtos/estruturas/${params.id}`,
              undefined,
              corsHeaders
            );
          case 'listar_produto_fornecedores':
            return await blingGet(
              accessToken,
              '/produtos/fornecedores',
              params.filtros,
              corsHeaders
            );
          case 'criar_produto_fornecedor':
            return await blingPost(accessToken, '/produtos/fornecedores', params.data, corsHeaders);
          case 'atualizar_produto_fornecedor':
            return await blingPut(
              accessToken,
              `/produtos/fornecedores/${params.id}`,
              params.data,
              corsHeaders
            );
          case 'excluir_produto_fornecedor':
            return await blingRequest(
              accessToken,
              'DELETE',
              `/produtos/fornecedores/${params.id}`,
              undefined,
              corsHeaders
            );
          case 'listar_produto_lojas':
            return await blingGet(accessToken, '/produtos/lojas', params.filtros, corsHeaders);
          case 'criar_produto_loja':
            return await blingPost(accessToken, '/produtos/lojas', params.data, corsHeaders);
          case 'atualizar_produto_loja':
            return await blingPut(
              accessToken,
              `/produtos/lojas/${params.id}`,
              params.data,
              corsHeaders
            );
          case 'excluir_produto_loja':
            return await blingRequest(
              accessToken,
              'DELETE',
              `/produtos/lojas/${params.id}`,
              undefined,
              corsHeaders
            );
          case 'listar_lotes':
            return await blingGet(accessToken, '/produtos/lotes', params.filtros, corsHeaders);
          case 'atualizar_lote':
            return await blingPut(
              accessToken,
              `/produtos/lotes/${params.id}`,
              params.data,
              corsHeaders
            );
          case 'excluir_lote':
            return await blingRequest(
              accessToken,
              'DELETE',
              `/produtos/lotes/${params.id}`,
              undefined,
              corsHeaders
            );

          // ═══════════════ ESTOQUE ═══════════════
          case 'saldos_estoque':
            return await blingGet(accessToken, '/estoques/saldos', params.filtros, corsHeaders);
          case 'lancar_estoque':
            return await blingPost(accessToken, '/estoques', params.data, corsHeaders);
          case 'listar_depositos':
            return await blingGet(accessToken, '/depositos', undefined, corsHeaders);
          case 'criar_deposito':
            return await blingPost(accessToken, '/depositos', params.data, corsHeaders);
          case 'atualizar_deposito':
            return await blingPut(accessToken, `/depositos/${params.id}`, params.data, corsHeaders);

          // ═══════════════ FINANCEIRO ═══════════════
          case 'listar_contas_receber':
            return await blingGet(accessToken, '/contas/receber', params.filtros, corsHeaders);
          case 'buscar_conta_receber':
            return await blingGet(
              accessToken,
              `/contas/receber/${params.id}`,
              undefined,
              corsHeaders
            );
          case 'criar_conta_receber':
            return await blingPost(accessToken, '/contas/receber', params.data, corsHeaders);
          case 'atualizar_conta_receber':
            return await blingPut(
              accessToken,
              `/contas/receber/${params.id}`,
              params.data,
              corsHeaders
            );
          case 'excluir_conta_receber':
            return await blingRequest(
              accessToken,
              'DELETE',
              `/contas/receber/${params.id}`,
              undefined,
              corsHeaders
            );
          case 'baixa_conta_receber':
            return await blingPost(
              accessToken,
              `/contas/receber/${params.id}/baixas`,
              params.data,
              corsHeaders
            );
          case 'estornar_baixa_receber':
            return await blingRequest(
              accessToken,
              'DELETE',
              `/contas/receber/${params.id}/baixas/${params.baixaId}`,
              corsHeaders
            );
          case 'listar_contas_pagar':
            return await blingGet(accessToken, '/contas/pagar', params.filtros, corsHeaders);
          case 'buscar_conta_pagar':
            return await blingGet(
              accessToken,
              `/contas/pagar/${params.id}`,
              undefined,
              corsHeaders
            );
          case 'criar_conta_pagar':
            return await blingPost(accessToken, '/contas/pagar', params.data, corsHeaders);
          case 'atualizar_conta_pagar':
            return await blingPut(
              accessToken,
              `/contas/pagar/${params.id}`,
              params.data,
              corsHeaders
            );
          case 'excluir_conta_pagar':
            return await blingRequest(
              accessToken,
              'DELETE',
              `/contas/pagar/${params.id}`,
              undefined,
              corsHeaders
            );
          case 'baixa_conta_pagar':
            return await blingPost(
              accessToken,
              `/contas/pagar/${params.id}/baixas`,
              params.data,
              corsHeaders
            );
          case 'estornar_baixa_pagar':
            return await blingRequest(
              accessToken,
              'DELETE',
              `/contas/pagar/${params.id}/baixas/${params.baixaId}`,
              corsHeaders
            );
          case 'listar_borderos':
            return await blingGet(accessToken, '/borderos', params.filtros, corsHeaders);
          case 'criar_bordero':
            return await blingPost(accessToken, '/borderos', params.data, corsHeaders);
          case 'excluir_bordero':
            return await blingRequest(
              accessToken,
              'DELETE',
              `/borderos/${params.id}`,
              undefined,
              corsHeaders
            );
          case 'listar_contas_contabeis':
            return await blingGet(accessToken, '/contas-contabeis', undefined, corsHeaders);
          case 'criar_conta_contabil':
            return await blingPost(accessToken, '/contas-contabeis', params.data, corsHeaders);
          case 'formas_pagamento':
            return await blingGet(accessToken, '/formas-pagamentos', undefined, corsHeaders);
          case 'criar_forma_pagamento':
            return await blingPost(accessToken, '/formas-pagamentos', params.data, corsHeaders);
          case 'atualizar_forma_pagamento':
            return await blingPut(
              accessToken,
              `/formas-pagamentos/${params.id}`,
              params.data,
              corsHeaders
            );
          case 'excluir_forma_pagamento':
            return await blingRequest(
              accessToken,
              'DELETE',
              `/formas-pagamentos/${params.id}`,
              undefined,
              corsHeaders
            );
          case 'categorias_receitas_despesas':
            return await blingGet(
              accessToken,
              '/categorias/receitas-despesas',
              undefined,
              corsHeaders
            );
          case 'criar_categoria':
            return await blingPost(
              accessToken,
              '/categorias/receitas-despesas',
              params.data,
              corsHeaders
            );

          // ═══════════════ NF-e / FISCAL ═══════════════
          case 'listar_nfe':
            return await blingGet(accessToken, '/nfe', params.filtros, corsHeaders);
          case 'buscar_nfe':
            return await blingGet(accessToken, `/nfe/${params.id}`, undefined, corsHeaders);
          case 'criar_nfe':
            return await blingPost(accessToken, '/nfe', params.data, corsHeaders);
          case 'enviar_nfe_sefaz':
            return await blingPost(
              accessToken,
              `/nfe/${params.id}/enviar${params.enviarEmail ? '?enviarEmail=true' : ''}`,
              corsHeaders
            );
          case 'cancelar_nfe':
            return await blingRequest(
              accessToken,
              'DELETE',
              '/nfe',
              { idsNotas: params.ids },
              corsHeaders
            );
          case 'lancar_estoque_nfe':
            return await blingPost(
              accessToken,
              `/nfe/${params.id}/lancar-estoque`,
              undefined,
              corsHeaders
            );
          case 'lancar_contas_nfe':
            return await blingPost(
              accessToken,
              `/nfe/${params.id}/lancar-contas`,
              undefined,
              corsHeaders
            );
          case 'estornar_estoque_nfe':
            return await blingPost(
              accessToken,
              `/nfe/${params.id}/estornar-estoque`,
              undefined,
              corsHeaders
            );
          case 'estornar_contas_nfe':
            return await blingPost(
              accessToken,
              `/nfe/${params.id}/estornar-contas`,
              undefined,
              corsHeaders
            );

          // ═══════════════ NFC-e (Gap #15) ═══════════════
          case 'listar_nfce':
            return await blingGet(accessToken, '/nfce', params.filtros, corsHeaders);
          case 'buscar_nfce':
            return await blingGet(accessToken, `/nfce/${params.id}`, undefined, corsHeaders);
          case 'criar_nfce':
            return await blingPost(accessToken, '/nfce', params.data, corsHeaders);
          case 'enviar_nfce':
            return await blingPost(
              accessToken,
              `/nfce/${params.id}/enviar`,
              undefined,
              corsHeaders
            );

          // ═══════════════ LOGÍSTICA ═══════════════
          case 'listar_logisticas':
            return await blingGet(accessToken, '/logisticas', undefined, corsHeaders);
          case 'listar_servicos_logistica':
            return await blingGet(accessToken, '/logisticas/servicos', undefined, corsHeaders);
          case 'listar_remessas':
            return await blingGet(accessToken, '/logisticas/remessas', params.filtros, corsHeaders);
          case 'buscar_remessa':
            return await blingGet(
              accessToken,
              `/logisticas/remessas/${params.id}`,
              undefined,
              corsHeaders
            );
          case 'criar_remessa':
            return await blingPost(accessToken, '/logisticas/remessas', params.data, corsHeaders);
          case 'listar_objetos':
            return await blingGet(accessToken, '/logisticas/objetos', params.filtros, corsHeaders);
          case 'rastrear_objeto':
            return await blingGet(
              accessToken,
              `/logisticas/objetos/${params.codigo}`,
              undefined,
              corsHeaders
            );
          case 'atualizar_objeto':
            return await blingPut(
              accessToken,
              `/logisticas/objetos/${params.id}`,
              params.data,
              corsHeaders
            );
          case 'gerar_etiqueta':
            return await blingPost(accessToken, '/logisticas/etiquetas', params.data, corsHeaders);
          case 'baixar_etiqueta':
            return await blingGet(
              accessToken,
              `/logisticas/etiquetas/${params.id}`,
              undefined,
              corsHeaders
            );

          // ═══════════════ EMPRESA ═══════════════
          case 'dados_empresa':
            return await blingGet(
              accessToken,
              '/empresas/me/dados-basicos',
              undefined,
              corsHeaders
            );

          // ═══════════════ NATUREZAS DE OPERAÇÃO ═══════════════
          case 'listar_naturezas_operacao':
            return await blingGet(accessToken, '/naturezas-operacoes', params.filtros, corsHeaders);

          default:
            return jsonResponse({ error: `Ação desconhecida: ${action}` }, 400, corsHeaders);
        }
      } catch (error) {
        log.error('Bling proxy error:', {
          error_message: mensagemErro(error),
          context: contextoErro(error),
        });
        return jsonResponse(
          { error: error instanceof Error ? error.message : 'Erro interno' },
          500,
          corsHeaders
        );
      }
    } finally {
      log.info('request', { duration_ms: Date.now() - _t0 });
      await log.flush();
    }
  })
);

// --- Gap #3: Token Revocation ---
async function handleTokenRevocation(supabase: any, cors: Record<string, string>) {
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, serviceRole);
  const clientId = Deno.env.get('BLING_CLIENT_ID');
  const clientSecret = Deno.env.get('BLING_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    return jsonResponse({ error: 'Credenciais Bling não configuradas' }, 500, cors);
  }

  const { data: tokens } = await adminClient
    .from('bling_tokens')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!tokens || tokens.length === 0) {
    return jsonResponse({ error: 'Nenhum token encontrado' }, 404, cors);
  }

  const token = tokens[0];
  const basicAuth = btoa(`${clientId}:${clientSecret}`);

  try {
    const res = await fetch(`${BLING_AUTH_BASE}/revoke`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ token: token.access_token }),
    });

    if (!res.ok) {
      const errText = await res.text();
      log.error('Bling revoke error:', {
        error_message: mensagemErro(errText),
        context: contextoErro(errText),
      });
    }
  } catch (e) {
    log.error('Revoke fetch error:', { error_message: mensagemErro(e), context: contextoErro(e) });
  }

  // Always clean up local tokens
  await adminClient.from('bling_tokens').delete().eq('id', token.id);

  return jsonResponse({ success: true }, 200, cors);
}

// --- OAuth Callback Handler ---
async function handleOAuthCallback(
  supabase: any,
  params: { code: string; redirect_uri: string },
  userId: string,
  cors: Record<string, string>
) {
  const clientId = Deno.env.get('BLING_CLIENT_ID');
  const clientSecret = Deno.env.get('BLING_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    return jsonResponse(
      { error: 'BLING_CLIENT_ID e BLING_CLIENT_SECRET não configurados' },
      500,
      cors
    );
  }

  const basicAuth = btoa(`${clientId}:${clientSecret}`);

  const tokenRes = await fetch(`${BLING_AUTH_BASE}/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    log.error('Bling OAuth error:', {
      error_message: mensagemErro(errText),
      context: contextoErro(errText),
    });
    return jsonResponse({ error: 'Falha ao trocar código OAuth', details: errText }, 400, cors);
  }

  const tokenData = await tokenRes.json();

  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, serviceRole);

  await adminClient.from('bling_tokens').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
  const { error: insertError } = await adminClient.from('bling_tokens').insert({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: expiresAt,
    created_by: userId,
  });

  if (insertError) {
    log.error('Error storing Bling token:', {
      error_message: mensagemErro(insertError),
      context: contextoErro(insertError),
    });
    return jsonResponse({ error: 'Erro ao salvar token' }, 500, cors);
  }

  return jsonResponse({ success: true, expires_in: tokenData.expires_in }, 200, cors);
}

// --- Token Management ---
async function getValidAccessToken(supabase: any): Promise<string | null> {
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, serviceRole);

  const { data: tokens } = await adminClient
    .from('bling_tokens')
    .select('*')
    .order('created_at', { ascending: false })
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
  const clientId = Deno.env.get('BLING_CLIENT_ID');
  const clientSecret = Deno.env.get('BLING_CLIENT_SECRET');
  if (!clientId || !clientSecret) return null;

  const basicAuth = btoa(`${clientId}:${clientSecret}`);

  try {
    const res = await fetch(`${BLING_AUTH_BASE}/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
      }),
    });

    if (!res.ok) {
      log.error('Bling refresh failed:', { error_message: mensagemErro(await res.text()) });
      return token.access_token;
    }

    const data = await res.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

    await adminClient
      .from('bling_tokens')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: expiresAt,
      })
      .eq('id', token.id);

    return data.access_token;
  } catch (e) {
    log.error('Bling refresh error:', { error_message: mensagemErro(e), context: contextoErro(e) });
    return token.access_token;
  }
}

// --- Bling API Helpers ---
async function blingGet(
  accessToken: string,
  path: string,
  params?: Record<string, any>,
  cors: Record<string, string> = corsHeaders
) {
  let url = `${BLING_API_BASE}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
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
  return await blingFetch(accessToken, url, 'GET', undefined, cors);
}

async function blingPost(
  accessToken: string,
  path: string,
  data?: any,
  cors: Record<string, string> = corsHeaders
) {
  return await blingFetch(accessToken, `${BLING_API_BASE}${path}`, 'POST', data, cors);
}

async function blingPut(
  accessToken: string,
  path: string,
  data?: any,
  cors: Record<string, string> = corsHeaders
) {
  return await blingFetch(accessToken, `${BLING_API_BASE}${path}`, 'PUT', data, cors);
}

async function blingRequest(
  accessToken: string,
  method: string,
  path: string,
  data?: any,
  cors: Record<string, string> = corsHeaders
) {
  return await blingFetch(accessToken, `${BLING_API_BASE}${path}`, method, data, cors);
}

/** Gap #5: Retry with exponential backoff for 429/5xx, auto-refresh on 401 */
async function blingFetch(
  accessToken: string,
  url: string,
  method: string,
  data?: any,
  cors: Record<string, string> = corsHeaders
): Promise<Response> {
  return await blingCB.run(async () => {
    return await withRetry(async () => {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      };
      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        headers['Content-Type'] = 'application/json';
      }

      const opts: RequestInit = { method, headers };
      if (data && method !== 'GET') {
        opts.body = JSON.stringify(data);
      }

      // Rate limit safety
      await new Promise((r) => setTimeout(r, 350));

      const res = await withTimeout(
        (signal) => fetch(url, { ...opts, signal }),
        BLING_FETCH_TIMEOUT_MS
      );
      const contentType = res.headers.get('content-type') || '';

      // Handle server errors and rate limits for retry
      if (!res.ok && (res.status === 429 || res.status >= 500)) {
        const errText = await res.text();
        throw new Error(`Bling API status ${res.status}: ${errText.substring(0, 500)}`);
      }

      let responseData: any;
      if (contentType.includes('application/json')) {
        responseData = await res.json();
      } else {
        responseData = { raw: await res.text() };
      }

      if (!res.ok) {
        log.error(`Bling API error [${res.status}]:`, {
          error_message: mensagemErro(JSON.stringify(responseData)),
        });
        return jsonResponse(
          { error: `Bling API error`, status: res.status, details: responseData },
          res.status === 403 ? 403 : 400,
          cors
        );
      }

      return jsonResponse(responseData, 200, cors);
    });
  });
}

function jsonResponse(data: any, status = 200, headers: Record<string, string> = corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}
