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

    const fetchExt = async (path: string, options?: RequestInit) => {
      const res = await fetch(`${externalUrl}${path}`, {
        ...options,
        headers: {
          'apikey': EXTERNAL_SERVICE_KEY,
          'Authorization': `Bearer ${EXTERNAL_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
      });
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch {}
      return { status: res.status, text, json, ok: res.ok };
    };

    // 1. Get OpenAPI spec
    const specRes = await fetchExt('/rest/v1/');
    let externalTables: string[] = [];
    let specInfo = { status: specRes.status, hasDefinitions: false, hasPaths: false, topKeys: [] as string[] };
    
    if (specRes.json) {
      specInfo.topKeys = Object.keys(specRes.json);
      if (specRes.json.definitions) {
        specInfo.hasDefinitions = true;
        externalTables = Object.keys(specRes.json.definitions).sort();
      }
      if (specRes.json.paths) {
        specInfo.hasPaths = true;
        if (externalTables.length === 0) {
          externalTables = Object.keys(specRes.json.paths)
            .map((p: string) => p.replace(/^\//, ''))
            .filter((p: string) => p.length > 0 && !p.startsWith('rpc/'))
            .sort();
        }
      }
    }

    // 2. Get RPC functions from OpenAPI paths
    let externalRPCs: string[] = [];
    if (specRes.json?.paths) {
      externalRPCs = Object.keys(specRes.json.paths)
        .filter((p: string) => p.startsWith('/rpc/'))
        .map((p: string) => p.replace('/rpc/', ''))
        .sort();
    }

    // 3. Try probing known tables to check connectivity
    const probeTables = ['profiles', 'empresas', 'clientes', 'contas_pagar', 'contas_receber', 
      'movimentacoes', 'contas_bancarias', 'categorias', 'fornecedores', 'alertas',
      'user_roles', 'audit_logs', 'boletos', 'darfs', 'notas_fiscais', 'contratos'];
    
    const probeResults: Record<string, { status: number; count?: number; error?: string }> = {};
    
    await Promise.all(probeTables.map(async (table) => {
      const res = await fetchExt(`/rest/v1/${table}?select=count&limit=0`, {
        headers: { 'Prefer': 'count=exact' }
      });
      const countHeader = res.status;
      probeResults[table] = { 
        status: res.status,
        error: !res.ok ? (res.json?.message || res.text.substring(0, 100)) : undefined
      };
    }));

    // 4. Check for storage buckets
    const storageRes = await fetchExt('/storage/v1/bucket');
    const storageBuckets = storageRes.ok ? (storageRes.json || []) : [];

    // 5. Check for auth users count
    const authRes = await fetchExt('/auth/v1/admin/users?per_page=1&page=1');
    const authInfo = {
      status: authRes.status,
      hasUsers: authRes.ok,
      totalUsers: authRes.json?.total || authRes.json?.users?.length || 0,
    };

    // 6. Check edge functions
    // We can't list edge functions via REST API, but we can try known ones

    // 7. Get table details for existing external tables (columns)
    const tableDetails: Record<string, unknown> = {};
    for (const table of externalTables.slice(0, 30)) {
      const res = await fetchExt(`/rest/v1/${table}?limit=0`);
      if (res.ok) {
        tableDetails[table] = { exists: true };
      }
    }

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

    const currentRPCs = [
      'gerar_numero_acordo', 'update_updated_at', 'update_updated_at_column',
      'delete_cron_job', 'fn_auditoria_financeira', 'log_audit', 'has_permission',
      'check_account_lockout', 'fn_transferencia_movimentacao', 'fn_atualizar_saldo_movimentacao',
      'toggle_cron_job', 'get_webauthn_credential_by_email', 'has_any_role',
      'is_country_allowed_for_login', 'increment_failed_attempts', 'processar_fila_cobrancas',
      'has_role', 'get_cron_jobs', 'get_user_role', 'confirmar_envio_cobranca',
      'handle_new_user', 'log_etapa_cobranca_change', 'get_lockout_details',
      'gerar_alertas_vencimento', 'calcular_proxima_geracao', 'gerar_alertas_pendencias_conciliacao',
      'gerar_contas_recorrentes', 'reset_failed_attempts', 'processar_regua_cobranca',
      'is_ip_allowed_for_login', 'confirmar_conciliacao', 'fn_sync_valor_cp',
      'fn_sync_valor_pago_movimentacao', 'fn_sync_valor_cr'
    ];

    // Compare tables
    const tablesOnlyInExternal = externalTables.filter(t => !currentTables.includes(t));
    const tablesOnlyInCurrent = currentTables.filter(t => !externalTables.includes(t));
    const tablesInBoth = currentTables.filter(t => externalTables.includes(t));

    // Compare RPCs
    const rpcsOnlyInExternal = externalRPCs.filter(r => !currentRPCs.includes(r));
    const rpcsOnlyInCurrent = currentRPCs.filter(r => !externalRPCs.includes(r));
    const rpcsInBoth = currentRPCs.filter(r => externalRPCs.includes(r));

    const result = {
      summary: {
        external_tables: externalTables.length,
        current_tables: currentTables.length,
        tables_missing_from_current: tablesOnlyInExternal.length,
        tables_extra_in_current: tablesOnlyInCurrent.length,
        external_rpcs: externalRPCs.length,
        current_rpcs: currentRPCs.length,
        rpcs_missing_from_current: rpcsOnlyInExternal.length,
        storage_buckets: Array.isArray(storageBuckets) ? storageBuckets.length : 0,
        auth_users: authInfo.totalUsers,
      },
      gaps: {
        tables_missing_from_current: tablesOnlyInExternal,
        rpcs_missing_from_current: rpcsOnlyInExternal,
        tables_only_in_current: tablesOnlyInCurrent,
        rpcs_only_in_current: rpcsOnlyInCurrent,
      },
      external_db: {
        tables: externalTables,
        rpcs: externalRPCs,
        storage_buckets: storageBuckets,
        auth: authInfo,
      },
      probe_results: probeResults,
      spec_info: specInfo,
      debug: {
        spec_raw_preview: specRes.text.substring(0, 2000),
      },
    };

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg, stack: error instanceof Error ? error.stack : '' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
