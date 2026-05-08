// Edge function: contabilizar-evento
// Aplica regras de contabilização automática a um evento financeiro
// (conta_pagar / conta_receber / movimentacao) gerando um lançamento
// contábil em partidas dobradas.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Body {
  empresa_id: string;
  tipo_evento: 'conta_pagar' | 'conta_receber' | 'movimentacao';
  evento_id: string;
  valor: number;
  data: string; // ISO yyyy-mm-dd
  descricao?: string;
  categoria_id?: string | null;
  dry_run?: boolean;
  ignore_rules?: boolean;
}

function renderTemplate(tpl: string, data: Record<string, unknown>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(data[k] ?? ''));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const auth = req.headers.get('Authorization');
  if (!auth) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validar JWT
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: 'invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userId = userData.user.id;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (
    !body.empresa_id ||
    !body.tipo_evento ||
    !body.evento_id ||
    !body.valor ||
    body.valor <= 0
  ) {
    return new Response(
      JSON.stringify({ error: 'campos obrigatórios ausentes' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Idempotência: já contabilizado?
  const { data: existente } = await admin
    .from('eventos_contabilizacao_log')
    .select('id, lancamento_id')
    .eq('tipo_evento', body.tipo_evento)
    .eq('evento_id', body.evento_id)
    .eq('status', 'sucesso')
    .maybeSingle();

  if (existente) {
    return new Response(
      JSON.stringify({
        status: 'duplicado',
        lancamento_id: existente.lancamento_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  // Buscar regras aplicáveis
  const { data: regras, error: regrasErr } = await admin
    .from('regras_contabilizacao_automatica')
    .select('*')
    .eq('empresa_id', body.empresa_id)
    .eq('tipo_evento', body.tipo_evento)
    .eq('ativo', true)
    .order('prioridade', { ascending: true });

  if (regrasErr) {
    return new Response(JSON.stringify({ error: regrasErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Selecionar regra: prioriza categoria match
  const regra =
    regras?.find((r) => r.categoria_id === body.categoria_id) ??
    regras?.find((r) => !r.categoria_id);

  if (!regra) {
    await admin.from('eventos_contabilizacao_log').insert({
      empresa_id: body.empresa_id,
      tipo_evento: body.tipo_evento,
      evento_id: body.evento_id,
      status: 'sem_regra',
      detalhe: 'Nenhuma regra ativa encontrada',
    });
    return new Response(
      JSON.stringify({ status: 'sem_regra' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  if (body.dry_run) {
    return new Response(
      JSON.stringify({
        status: 'simulado',
        regra: { id: regra.id, nome: regra.nome },
        debito: regra.conta_debito_id,
        credito: regra.conta_credito_id,
        valor: body.valor,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  // Criar lançamento + 2 partidas
  const historico = renderTemplate(regra.historico_template, {
    descricao: body.descricao ?? '',
    valor: body.valor.toFixed(2),
    data: body.data,
  });

  const { data: lanc, error: lancErr } = await admin
    .from('lancamentos_contabeis')
    .insert({
      empresa_id: body.empresa_id,
      data_lancamento: body.data,
      historico,
      origem: body.tipo_evento,
      origem_id: body.evento_id,
      valor_total: body.valor,
      status: 'confirmado',
      created_by: userId,
    })
    .select('id')
    .single();

  if (lancErr || !lanc) {
    await admin.from('eventos_contabilizacao_log').insert({
      empresa_id: body.empresa_id,
      tipo_evento: body.tipo_evento,
      evento_id: body.evento_id,
      regra_id: regra.id,
      status: 'erro',
      detalhe: lancErr?.message ?? 'falha lancamento',
    });
    return new Response(
      JSON.stringify({ error: lancErr?.message ?? 'falha lancamento' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  const { error: partErr } = await admin.from('partidas_contabeis').insert([
    {
      lancamento_id: lanc.id,
      conta_id: regra.conta_debito_id,
      tipo: 'D',
      valor: body.valor,
      historico_complementar: historico,
    },
    {
      lancamento_id: lanc.id,
      conta_id: regra.conta_credito_id,
      tipo: 'C',
      valor: body.valor,
      historico_complementar: historico,
    },
  ]);

  if (partErr) {
    await admin.from('lancamentos_contabeis').delete().eq('id', lanc.id);
    await admin.from('eventos_contabilizacao_log').insert({
      empresa_id: body.empresa_id,
      tipo_evento: body.tipo_evento,
      evento_id: body.evento_id,
      regra_id: regra.id,
      status: 'erro',
      detalhe: partErr.message,
    });
    return new Response(JSON.stringify({ error: partErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  await admin.from('eventos_contabilizacao_log').insert({
    empresa_id: body.empresa_id,
    tipo_evento: body.tipo_evento,
    evento_id: body.evento_id,
    regra_id: regra.id,
    lancamento_id: lanc.id,
    status: 'sucesso',
  });

  return new Response(
    JSON.stringify({
      status: 'sucesso',
      lancamento_id: lanc.id,
      regra: { id: regra.id, nome: regra.nome },
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
});
