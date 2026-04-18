// Edge Function: enviar-bitrix24-tributario
// Cria Deal no Bitrix24 + anexa PDF tributário + comentário com resumo
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { createLogger } from '../_shared/observability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ReqBody {
  empresaId: string;
  signedUrl: string;
  empresaNome: string;
  periodo: string;
  regimeRecomendado: string;
  economiaAnual: number;
  dealId?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function bitrixCall(
  method: string,
  params: Record<string, unknown>,
  attempt = 0
): Promise<Record<string, unknown>> {
  const domain = Deno.env.get('BITRIX24_DOMAIN');
  const token = Deno.env.get('BITRIX24_ACCESS_TOKEN');
  if (!domain || !token) throw new Error('Bitrix24 não configurado');

  const url = `https://${domain}/rest/${method}.json?auth=${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (res.status === 429 || res.status >= 500) {
    if (attempt < 3) {
      await sleep(2 ** attempt * 500);
      return bitrixCall(method, params, attempt + 1);
    }
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Bitrix erro: ${data.error_description ?? data.error}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = createLogger('enviar-bitrix24-tributario');
  const t0 = Date.now();
  logger.info('fn_start');

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } =
      await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: ReqBody = await req.json();
    if (!body.empresaId || !body.signedUrl || !body.empresaNome) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios ausentes' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const titulo = `Recomendação Tributária — ${body.empresaNome} — ${body.periodo}`;
    const economiaTxt =
      body.economiaAnual > 0
        ? `Economia anual estimada: R$ ${body.economiaAnual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
        : 'Sem economia adicional vs. regime atual';
    const comentario = `[B]Análise Tributária — ${body.periodo}[/B]\n\nRegime recomendado: ${body.regimeRecomendado}\n${economiaTxt}\n\nPDF: ${body.signedUrl}`;

    let dealId = body.dealId;

    if (!dealId) {
      // Cria novo Deal
      const dealRes = (await bitrixCall('crm.deal.add', {
        fields: {
          TITLE: titulo,
          COMMENTS: comentario,
          OPPORTUNITY: body.economiaAnual,
          CURRENCY_ID: 'BRL',
          STAGE_ID: 'NEW',
        },
      })) as { result?: number };
      dealId = String(dealRes.result ?? '');
    } else {
      // Atualiza Deal existente
      await bitrixCall('crm.deal.update', {
        id: dealId,
        fields: {
          TITLE: titulo,
          COMMENTS: comentario,
        },
      });
    }

    // Adiciona timeline comment com link do PDF
    await bitrixCall('crm.timeline.comment.add', {
      fields: {
        ENTITY_ID: dealId,
        ENTITY_TYPE: 'deal',
        COMMENT: comentario,
      },
    });

    const dealUrl = `https://${Deno.env.get('BITRIX24_DOMAIN')}/crm/deal/details/${dealId}/`;

    logger.info('fn_success', {
      duration_ms: Date.now() - t0,
      status_code: 200,
      context: { dealId, empresaId: body.empresaId },
    });
    await logger.flush();
    return new Response(
      JSON.stringify({ success: true, dealId, dealUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    logger.error('fn_failure', {
      duration_ms: Date.now() - t0,
      status_code: 500,
      error_message: msg,
    });
    await logger.flush();
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
