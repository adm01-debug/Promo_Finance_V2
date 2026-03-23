import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Telemetry constants ─────────────────────────────────────────────────
const SLOW_QUERY_THRESHOLD_MS = 3000;
const VERY_SLOW_QUERY_THRESHOLD_MS = 8000;

// ── Telemetry helper ────────────────────────────────────────────────────
async function emitTelemetry(opts: {
  operation: string;
  table_name?: string;
  rpc_name?: string;
  duration_ms: number;
  record_count?: number;
  query_limit?: number;
  query_offset?: number;
  count_mode?: string;
  error_message?: string;
  user_id?: string;
}) {
  let severity = 'normal';
  if (opts.error_message) {
    severity = 'error';
  } else if (opts.duration_ms >= VERY_SLOW_QUERY_THRESHOLD_MS) {
    severity = 'very_slow';
  } else if (opts.duration_ms >= SLOW_QUERY_THRESHOLD_MS) {
    severity = 'slow';
  }

  // Structured console logging
  const icon = severity === 'very_slow' ? '🔴'
    : severity === 'slow' ? '🟡'
    : severity === 'error' ? '❌'
    : '✅';
  const target = opts.rpc_name || opts.table_name || 'unknown';
  const line = `${icon} [telemetry] ${opts.operation}:${target} ${opts.duration_ms}ms` +
    ` | records=${opts.record_count ?? '-'}` +
    ` limit=${opts.query_limit ?? '-'}` +
    ` offset=${opts.query_offset ?? '-'}` +
    ` count=${opts.count_mode ?? '-'}`;

  if (severity === 'very_slow') {
    console.warn(`⚠️ VERY SLOW QUERY: ${line}`);
  } else if (severity === 'slow') {
    console.warn(`⚠️ SLOW QUERY: ${line}`);
  } else if (severity === 'error') {
    console.error(`${line} error=${opts.error_message}`);
  } else {
    console.info(line);
  }

  // Only persist slow/error queries to avoid flooding
  if (severity === 'normal') return;

  try {
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fire-and-forget: persist but don't block the response
    serviceClient.from('query_telemetry').insert({
      operation: opts.operation,
      table_name: opts.table_name || null,
      rpc_name: opts.rpc_name || null,
      duration_ms: opts.duration_ms,
      record_count: opts.record_count ?? null,
      query_limit: opts.query_limit ?? null,
      query_offset: opts.query_offset ?? null,
      count_mode: opts.count_mode ?? null,
      severity,
      error_message: opts.error_message || null,
      user_id: opts.user_id || null,
    }).then(({ error: insertErr }) => {
      if (insertErr) console.warn('[telemetry-persist] Insert failed:', insertErr.message);
    });
  } catch (e) {
    // Fire-and-forget: NEVER block the main response
    console.error('[telemetry] Failed to persist telemetry:', e);
  }
}

// ── Main handler ────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = performance.now();
  let userId: string | undefined;

  try {
    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const localSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await localSupabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    userId = user.id;

    // Parse request
    const url = new URL(req.url);
    const tabela = url.searchParams.get('tabela');
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const offset = (page - 1) * limit;

    if (!tabela || !['clientes', 'fornecedores'].includes(tabela)) {
      return new Response(JSON.stringify({ error: 'Parâmetro "tabela" inválido. Use: clientes ou fornecedores' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Connect to external DB
    const extUrl = Deno.env.get('EXTERNAL_SUPABASE_URL')?.trim();
    const extKeyRaw = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_KEY')?.trim();
    if (!extUrl || !extKeyRaw) {
      return new Response(JSON.stringify({ error: 'External DB not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let extKey = extKeyRaw.replace(/[^\x20-\x7E]/g, '').trim();
    const jwtMatch = extKey.match(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    if (jwtMatch) {
      extKey = jwtMatch[0];
    }

    const extSupabase = createClient(extUrl, extKey);

    const isCliente = tabela === 'clientes';
    const filterField = isCliente ? 'is_customer' : 'is_supplier';
    const joinTable = isCliente ? 'customers' : 'suppliers';

    const selectFields = `*,${joinTable}(*),contacts(id,first_name,last_name,full_name)`;

    // Measure external query time
    const queryStart = performance.now();

    let query = extSupabase
      .from('companies')
      .select(selectFields, { count: 'exact' })
      .eq(filterField, true)
      .is('deleted_at', null);

    if (search) {
      query = query.or(`razao_social.ilike.%${search}%,nome_fantasia.ilike.%${search}%,cnpj.ilike.%${search}%,nome_crm.ilike.%${search}%`);
    }

    query = query.order('razao_social', { ascending: true }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    const queryDurationMs = Math.round(performance.now() - queryStart);

    if (error) {
      console.error(`[external-data] Error querying companies (${tabela}):`, error);

      // Emit error telemetry
      emitTelemetry({
        operation: 'SELECT',
        table_name: `companies (${tabela})`,
        duration_ms: queryDurationMs,
        query_limit: limit,
        query_offset: offset,
        count_mode: 'exact',
        error_message: error.message,
        user_id: userId,
      });

      return new Response(JSON.stringify({ error: error.message, details: error }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Emit telemetry for successful queries
    emitTelemetry({
      operation: 'SELECT',
      table_name: `companies (${tabela})`,
      duration_ms: queryDurationMs,
      record_count: data?.length ?? 0,
      query_limit: limit,
      query_offset: offset,
      count_mode: 'exact',
      user_id: userId,
    });

    // Map external "companies" format to the local format expected by the frontend
    const mappedData = (data || []).map((company: Record<string, unknown>) => {
      const subData = company[joinTable] as Record<string, unknown> | null;
      const contacts = company.contacts as Array<Record<string, unknown>> | null;
      const primaryContact = contacts && contacts.length > 0 ? contacts[0] : null;

      return {
        id: company.id,
        razao_social: company.razao_social || '',
        nome_fantasia: company.nome_fantasia || '',
        cnpj_cpf: company.cnpj || '',
        nome: company.nome_crm || company.nome_fantasia || company.razao_social || '',
        email: null,
        telefone: null,
        contato: primaryContact ? primaryContact.full_name : null,
        ativo: company.status === 'ativo',
        ramo_atividade: company.ramo_atividade || (subData ? subData.ramo_atividade : null),
        observacoes: subData ? subData.observacoes : null,
        created_at: company.created_at,
        updated_at: company.updated_at,
        website: company.website,
        logo_url: company.logo_url,
        grupo_economico: company.grupo_economico,
        inscricao_estadual: company.inscricao_estadual,
        status_externo: company.status,
        is_customer: company.is_customer,
        is_supplier: company.is_supplier,
        ...(isCliente && subData ? {
          vendedor_nome: subData.vendedor_nome,
          cliente_ativado: subData.cliente_ativado,
          ja_comprou: subData.ja_comprou,
          total_pedidos: subData.total_pedidos,
          valor_total_compras: subData.valor_total_compras,
          ticket_medio: subData.ticket_medio,
          grupo_clientes: subData.grupo_clientes,
        } : {}),
        ...(!isCliente && subData ? {
          categoria: subData.categoria,
          tipo_fornecedor: subData.tipo_fornecedor,
          prazo_entrega_medio: subData.prazo_entrega_medio,
          pedido_minimo: subData.pedido_minimo,
          forma_pagamento: subData.forma_pagamento,
          prazo_pagamento: subData.prazo_pagamento,
        } : {}),
      };
    });

    return new Response(JSON.stringify({
      data: mappedData,
      total: count,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);
    console.error('[external-data] Unexpected error:', error);

    // Emit telemetry for unexpected errors
    emitTelemetry({
      operation: 'SELECT',
      table_name: 'companies',
      duration_ms: durationMs,
      error_message: (error as Error).message,
      user_id: userId,
    });

    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Export for testing
export { emitTelemetry };
