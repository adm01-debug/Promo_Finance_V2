import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const EXTERNAL_DB_URL = Deno.env.get('EXTERNAL_DB_URL');
    if (!EXTERNAL_DB_URL) {
      throw new Error('EXTERNAL_DB_URL not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Current project client
    const currentClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // External project client  
    const externalClient = createClient(
      'https://xyykivpcdbfukaongpbw.supabase.co',
      EXTERNAL_DB_URL // This should be the anon/service key
    );

    // Query tables from both databases using RPC or direct queries
    const queries = {
      tables: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
      functions: `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name`,
      views: `SELECT viewname FROM pg_views WHERE schemaname = 'public' ORDER BY viewname`,
      triggers: `SELECT tgname FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND NOT t.tgisinternal ORDER BY tgname`,
      enums: `SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e' ORDER BY typname`,
    };

    // Since we can't run raw SQL via supabase-js directly,
    // let's use the REST API with pg_catalog approach
    // We'll query the external DB via its REST endpoint

    // Get external tables by querying information_schema via RPC if available
    // Alternative: use fetch to the external PostgREST endpoint
    
    const externalUrl = 'https://xyykivpcdbfukaongpbw.supabase.co';
    const externalKey = EXTERNAL_DB_URL;

    // Fetch external tables list via PostgREST
    const fetchExternal = async (table: string, select: string, filters?: string) => {
      const url = `${externalUrl}/rest/v1/${table}?select=${select}${filters ? '&' + filters : ''}`;
      const res = await fetch(url, {
        headers: {
          'apikey': externalKey,
          'Authorization': `Bearer ${externalKey}`,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        return { error: `${res.status}: ${text}`, data: null };
      }
      return { data: await res.json(), error: null };
    };

    // We can't query pg_tables via PostgREST. Let's just compare what tables
    // the external DB exposes via its API
    // The best approach: list all tables from the external OpenAPI spec
    
    const specRes = await fetch(`${externalUrl}/rest/v1/`, {
      headers: {
        'apikey': externalKey,
        'Authorization': `Bearer ${externalKey}`,
      },
    });
    
    let externalTables: string[] = [];
    if (specRes.ok) {
      const spec = await specRes.json();
      if (spec.definitions) {
        externalTables = Object.keys(spec.definitions).sort();
      } else if (spec.paths) {
        externalTables = Object.keys(spec.paths)
          .map(p => p.replace('/', ''))
          .filter(p => p.length > 0)
          .sort();
      }
    }

    // Current DB tables (we already know from our query)
    const currentTables = [
      'account_lockouts', 'acordos_parcelamento', 'alertas', 'alertas_preditivos',
      'alertas_tributarios', 'allowed_countries', 'allowed_ips', 'anexos_financeiros',
      'apuracoes_irpj_csll', 'apuracoes_tributarias', 'asaas_customers', 'asaas_payments',
      'audit_logs', 'auditoria_financeira', 'bitrix_field_mappings', 'bitrix_oauth_tokens',
      'bitrix_sync_logs', 'bitrix_webhook_events', 'bling_sync_logs', 'bling_tokens',
      'bling_webhook_events', 'blocked_ips', 'boletos', 'categorias', 'centros_custo',
      'clientes', 'conciliacoes', 'conciliacoes_parciais', 'configuracoes_aprovacao',
      'contas_bancarias', 'contas_pagar', 'contas_receber', 'contatos_financeiros',
      'contratos', 'creditos_tributarios', 'darfs', 'empresas', 'execucoes_cobranca',
      'expert_conversations', 'expert_messages', 'extrato_bancario', 'feedback_conciliacao_ia',
      'fila_cobrancas', 'formas_pagamento', 'fornecedores', 'historico_analises_preditivas',
      'historico_cobranca', 'historico_cobranca_whatsapp', 'historico_conciliacao_ia',
      'historico_relatorios', 'historico_score_saude', 'incentivos_fiscais', 'known_devices',
      'lalur_lancamentos', 'login_attempts', 'metas_financeiras', 'movimentacoes',
      'negativacoes', 'new_device_alerts', 'notas_fiscais', 'open_finance_consents',
      'operacoes_tributaveis', 'pagamentos_recorrentes', 'parcelas_acordo',
      'password_reset_requests', 'per_dcomp', 'permissions', 'plano_contas',
      'portal_cliente_acessos', 'portal_cliente_tokens', 'prejuizos_fiscais', 'profiles',
      'protestos', 'push_subscriptions', 'rate_limit_logs', 'recomendacoes_metas_ia',
      'regimes_especiais_empresa', 'regras_conciliacao', 'regua_cobranca',
      'relatorios_agendados', 'retencoes_fonte', 'role_permissions', 'security_alerts',
      'security_settings', 'solicitacoes_aprovacao', 'split_payment_transacoes',
      'templates_cobranca', 'transacoes_bancarias', 'transferencias', 'user_roles',
      'user_sessions', 'vendedores', 'webauthn_credentials', 'webhooks_log',
      'workflow_aprovacoes'
    ];

    // Compare
    const onlyInExternal = externalTables.filter(t => !currentTables.includes(t));
    const onlyInCurrent = currentTables.filter(t => !externalTables.includes(t));
    const inBoth = currentTables.filter(t => externalTables.includes(t));

    const result = {
      current_db: {
        project: 'iikqosstymnnxaujzadw',
        total_tables: currentTables.length,
        tables: currentTables,
      },
      external_db: {
        project: 'xyykivpcdbfukaongpbw',
        total_tables: externalTables.length,
        tables: externalTables,
      },
      comparison: {
        tables_in_both: inBoth.length,
        only_in_external: onlyInExternal,
        only_in_current: onlyInCurrent,
        missing_from_current: onlyInExternal.length,
        extra_in_current: onlyInCurrent.length,
      },
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
