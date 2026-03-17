const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const EXTERNAL_SERVICE_KEY = Deno.env.get('EXTERNAL_DB_URL');
    if (!EXTERNAL_SERVICE_KEY) {
      throw new Error('EXTERNAL_DB_URL not configured');
    }

    const externalUrl = 'https://xyykivpcdbfukaongpbw.supabase.co';

    // Use the service_role key to call an RPC that lists tables
    // First, try to get tables via a direct SQL query using the pg_catalog
    // Since we have service_role, we can use the /rest/v1/rpc endpoint
    
    // Alternative approach: query the OpenAPI spec with service_role key
    const specRes = await fetch(`${externalUrl}/rest/v1/`, {
      headers: {
        'apikey': EXTERNAL_SERVICE_KEY,
        'Authorization': `Bearer ${EXTERNAL_SERVICE_KEY}`,
      },
    });

    let externalTables: string[] = [];
    let specDebug = '';
    
    if (specRes.ok) {
      const spec = await specRes.json();
      if (spec.definitions) {
        externalTables = Object.keys(spec.definitions).sort();
      } else if (spec.paths) {
        externalTables = Object.keys(spec.paths)
          .map((p: string) => p.replace(/^\//, ''))
          .filter((p: string) => p.length > 0)
          .sort();
      }
      specDebug = `keys: ${Object.keys(spec).join(', ')}`;
    } else {
      specDebug = `status: ${specRes.status}, body: ${await specRes.text()}`;
    }

    // Also try to list tables by querying each known table
    // Let's try fetching from a few known tables to verify connectivity
    const testTableRes = await fetch(`${externalUrl}/rest/v1/profiles?select=id&limit=1`, {
      headers: {
        'apikey': EXTERNAL_SERVICE_KEY,
        'Authorization': `Bearer ${EXTERNAL_SERVICE_KEY}`,
      },
    });
    const testTableDebug = `profiles test: ${testTableRes.status}`;
    const testBody = await testTableRes.text();

    // Current DB tables
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
      debug: {
        spec: specDebug,
        test_table: testTableDebug,
        test_body: testBody.substring(0, 500),
      },
      current_db: {
        project: 'iikqosstymnnxaujzadw',
        total_tables: currentTables.length,
      },
      external_db: {
        project: 'xyykivpcdbfukaongpbw',
        total_tables: externalTables.length,
        tables: externalTables,
      },
      comparison: {
        tables_in_both: inBoth.length,
        in_both: inBoth,
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
