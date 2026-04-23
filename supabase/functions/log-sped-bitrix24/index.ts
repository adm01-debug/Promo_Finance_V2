// Edge Function: log-sped-bitrix24
// Registra no Bitrix24 (timeline + status do deal) o resultado de cada geração SPED ECF/ECD,
// informando se foi BLOQUEADA ou GERADA e a quantidade de erros/avisos retornados.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { createLogger } from '../_shared/observability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ReqBody {
  empresaId: string;
  empresaNome: string;
  cnpj: string;
  tipo: 'ECF' | 'ECD';
  anoCalendario: number;
  status: 'gerado' | 'bloqueado' | 'transmitido';
  totalErros: number;
  totalAvisos: number;
  totalLinhas?: number;
  totalLancamentos?: number;
  hashSha256?: string | null;
  signedUrl?: string | null;
  arquivoId?: string | null;
  dealId?: string | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function bitrixCall(
  method: string,
  params: Record<string, unknown>,
  attempt = 0,
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

  if ((res.status === 429 || res.status >= 500) && attempt < 3) {
    await sleep(2 ** attempt * 500);
    return bitrixCall(method, params, attempt + 1);
  }

  const data = await res.json();
  if (data.error) throw new Error(`Bitrix erro: ${data.error_description ?? data.error}`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const logger = createLogger('log-sped-bitrix24');
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
    const { data: claimsData, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: ReqBody = await req.json();
    if (!body.empresaId || !body.empresaNome || !body.tipo || !body.anoCalendario || !body.status) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios ausentes' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const statusLabel =
      body.status === 'bloqueado'
        ? '🔴 BLOQUEADO'
        : body.status === 'transmitido'
          ? '✅ TRANSMITIDO'
          : '🟢 GERADO';

    const titulo = `SPED ${body.tipo} ${body.anoCalendario} — ${body.empresaNome} — ${statusLabel}`;

    const linhasComentario: string[] = [
      `[B]Geração SPED ${body.tipo} ${body.anoCalendario}[/B]`,
      `Empresa: ${body.empresaNome} (CNPJ ${body.cnpj})`,
      `Status: ${statusLabel}`,
      `Erros: ${body.totalErros} · Avisos: ${body.totalAvisos}`,
    ];
    if (typeof body.totalLinhas === 'number') linhasComentario.push(`Linhas: ${body.totalLinhas}`);
    if (typeof body.totalLancamentos === 'number')
      linhasComentario.push(`Lançamentos: ${body.totalLancamentos}`);
    if (body.hashSha256) linhasComentario.push(`Hash SHA-256: ${body.hashSha256.slice(0, 16)}…`);
    if (body.signedUrl) linhasComentario.push(`Arquivo: ${body.signedUrl}`);

    const comentario = linhasComentario.join('\n');

    let dealId = body.dealId ?? undefined;

    if (!dealId) {
      const dealRes = (await bitrixCall('crm.deal.add', {
        fields: {
          TITLE: titulo,
          COMMENTS: comentario,
          CURRENCY_ID: 'BRL',
          STAGE_ID: body.status === 'bloqueado' ? 'NEW' : 'PREPARATION',
          UF_CRM_SPED_TIPO: body.tipo,
          UF_CRM_SPED_STATUS: body.status,
        },
      })) as { result?: number };
      dealId = String(dealRes.result ?? '');
    } else {
      // Atualiza status do deal existente
      await bitrixCall('crm.deal.update', {
        id: dealId,
        fields: {
          TITLE: titulo,
          STAGE_ID:
            body.status === 'bloqueado'
              ? 'NEW'
              : body.status === 'transmitido'
                ? 'WON'
                : 'PREPARATION',
        },
      });
    }

    // Sempre adiciona timeline com o resumo desta geração
    await bitrixCall('crm.timeline.comment.add', {
      fields: {
        ENTITY_ID: dealId,
        ENTITY_TYPE: 'deal',
        COMMENT: comentario,
      },
    });

    // Persiste log local em audit_logs (best-effort)
    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? anonKey,
    );
    try {
      await supabaseService.from('audit_logs').insert({
        action: 'OTHER',
        table_name: 'sped_contabil_arquivos',
        record_id: body.arquivoId ?? null,
        new_data: {
          tipo: body.tipo,
          ano: body.anoCalendario,
          status: body.status,
          erros: body.totalErros,
          avisos: body.totalAvisos,
          deal_id: dealId,
        },
        details: `Bitrix24: log de geração SPED ${body.tipo} ${body.anoCalendario} (${body.status})`,
      });
    } catch {
      // log local é best-effort
    }

    const dealUrl = `https://${Deno.env.get('BITRIX24_DOMAIN')}/crm/deal/details/${dealId}/`;

    logger.info('fn_success', {
      duration_ms: Date.now() - t0,
      status_code: 200,
      context: { dealId, empresaId: body.empresaId, tipo: body.tipo, status: body.status },
    });
    await logger.flush();

    return new Response(JSON.stringify({ success: true, dealId, dealUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
