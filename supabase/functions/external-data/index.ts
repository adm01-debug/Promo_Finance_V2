import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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

    // External DB uses "companies" table with is_customer/is_supplier flags
    // and related "customers"/"suppliers" tables via company_id
    const isCliente = tabela === 'clientes';
    const filterField = isCliente ? 'is_customer' : 'is_supplier';
    const joinTable = isCliente ? 'customers' : 'suppliers';

    // Select companies with the related sub-table and contacts
    const selectFields = `*,${joinTable}(*),contacts(id,first_name,last_name,full_name)`;

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

    if (error) {
      console.error(`[external-data] Error querying companies (${tabela}):`, error);
      return new Response(JSON.stringify({ error: error.message, details: error }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map external "companies" format to the local format expected by the frontend
    const mappedData = (data || []).map((company: Record<string, unknown>) => {
      const subData = company[joinTable] as Record<string, unknown> | null;
      const contacts = company.contacts as Array<Record<string, unknown>> | null;
      const primaryContact = contacts && contacts.length > 0 ? contacts[0] : null;

      return {
        // Core fields matching local clientes/fornecedores schema
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
        // Extra fields from external DB
        website: company.website,
        logo_url: company.logo_url,
        grupo_economico: company.grupo_economico,
        inscricao_estadual: company.inscricao_estadual,
        status_externo: company.status,
        is_customer: company.is_customer,
        is_supplier: company.is_supplier,
        // Customer-specific
        ...(isCliente && subData ? {
          vendedor_nome: subData.vendedor_nome,
          cliente_ativado: subData.cliente_ativado,
          ja_comprou: subData.ja_comprou,
          total_pedidos: subData.total_pedidos,
          valor_total_compras: subData.valor_total_compras,
          ticket_medio: subData.ticket_medio,
          grupo_clientes: subData.grupo_clientes,
        } : {}),
        // Supplier-specific
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
    console.error('[external-data] Unexpected error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
