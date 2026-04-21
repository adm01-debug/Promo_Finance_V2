// Edge Function: sincronizar-anomalia-bitrix24
// Cria/atualiza uma Tarefa no Bitrix24 quando uma anomalia é revisada
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Evento = 'confirmada' | 'falso_positivo' | 'parecer' | 'reaberta';

interface ReqBody {
  anomaliaId: string;
  evento: Evento;
}

const TIPO_LABEL: Record<string, string> = {
  movimentacao_outlier: 'Movimentação atípica',
  pagamento_duplicado: 'Pagamento duplicado',
  conta_pagar_alta: 'Conta a pagar alta',
  conciliacao_atrasada: 'Conciliação atrasada',
  mudanca_regime_brusca: 'Variação brusca de regime',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function bitrixCall(
  domain: string,
  token: string,
  method: string,
  params: Record<string, unknown> | unknown[],
  attempt = 0,
): Promise<Record<string, unknown>> {
  const url = `https://${domain}/rest/${method}.json?auth=${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if ((res.status === 429 || res.status >= 500) && attempt < 3) {
    await sleep(2 ** attempt * 500);
    return bitrixCall(domain, token, method, params, attempt + 1);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Bitrix erro: ${data.error_description ?? data.error}`);
  }
  return data;
}

function priorityFromSeveridade(s: string): number {
  if (s === 'critica') return 2;
  if (s === 'alta') return 1;
  return 0;
}

function statusBitrix(evento: Evento): number {
  // 2 = pendente, 5 = concluído (Bitrix task statuses)
  if (evento === 'confirmada' || evento === 'falso_positivo') return 5;
  return 2;
}

function eventoLabel(e: Evento): string {
  switch (e) {
    case 'confirmada': return 'Confirmada como problema real';
    case 'falso_positivo': return 'Marcada como falso positivo';
    case 'parecer': return 'Parecer atualizado';
    case 'reaberta': return 'Reaberta para investigação';
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
    if (!body.anomaliaId || !body.evento) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios ausentes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const domain = Deno.env.get('BITRIX24_DOMAIN');
    const bitrixToken = Deno.env.get('BITRIX24_ACCESS_TOKEN');
    if (!domain || !bitrixToken) {
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: 'Bitrix24 não configurado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Carrega a anomalia com service role para garantir leitura
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    const { data: anomalia, error: anomErr } = await supabaseAdmin
      .from('anomalias_detectadas')
      .select('*')
      .eq('id', body.anomaliaId)
      .maybeSingle();
    if (anomErr || !anomalia) {
      return new Response(
        JSON.stringify({ error: 'Anomalia não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const tipoLabel = TIPO_LABEL[anomalia.tipo_anomalia] ?? anomalia.tipo_anomalia;
    const titulo = `[Anomalia] ${tipoLabel} — ${anomalia.severidade}`;
    const drillUrl = `${supabaseUrl.replace(/\/+$/, '')}`.includes('supabase.co')
      ? `/admin/insights-ia/anomalia/${anomalia.id}`
      : `/admin/insights-ia/anomalia/${anomalia.id}`;
    const description =
      `[B]${tipoLabel}[/B]\n\n` +
      `Severidade: ${anomalia.severidade}\n` +
      `Status: ${anomalia.status}\n` +
      `Detectada em: ${new Date(anomalia.detectada_em).toLocaleString('pt-BR')}\n\n` +
      `[B]Descrição:[/B] ${anomalia.descricao}\n\n` +
      (anomalia.observacoes ? `[B]Parecer:[/B]\n${anomalia.observacoes}\n\n` : '') +
      `[B]Evento:[/B] ${eventoLabel(body.evento)}\n` +
      `[B]Drill-down:[/B] ${drillUrl}`;

    const tags = ['lovable-anomalia', anomalia.tipo_anomalia, anomalia.severidade];
    const status = statusBitrix(body.evento);
    const priority = priorityFromSeveridade(anomalia.severidade);

    let taskId = anomalia.bitrix_task_id as string | null;
    let action: 'created' | 'updated' = 'updated';

    if (taskId) {
      await bitrixCall(domain, bitrixToken, 'tasks.task.update', {
        taskId,
        fields: {
          TITLE: titulo,
          DESCRIPTION: description,
          PRIORITY: priority,
          STATUS: status,
          TAGS: tags,
        },
      });
    } else {
      const res = (await bitrixCall(domain, bitrixToken, 'tasks.task.add', {
        fields: {
          TITLE: titulo,
          DESCRIPTION: description,
          PRIORITY: priority,
          TAGS: tags,
        },
      })) as { result?: { task?: { id?: string | number } } };
      const newId = res.result?.task?.id;
      if (!newId) throw new Error('Bitrix não retornou task id');
      taskId = String(newId);
      action = 'created';

      await supabaseAdmin
        .from('anomalias_detectadas')
        .update({ bitrix_task_id: taskId })
        .eq('id', anomalia.id);

      // Aplica STATUS depois (não aceito em add)
      if (status !== 2) {
        await bitrixCall(domain, bitrixToken, 'tasks.task.update', {
          taskId,
          fields: { STATUS: status },
        }).catch(() => undefined);
      }
    }

    // Comentário no histórico (formato posicional: [taskId, fields])
    await bitrixCall(domain, bitrixToken, 'task.commentitem.add', [
      taskId,
      { POST_MESSAGE: `${eventoLabel(body.evento)}\n\n${anomalia.observacoes ?? ''}`.trim() },
    ]).catch(() => undefined);

    const taskUrl = `https://${domain}/company/personal/user/0/tasks/task/view/${taskId}/`;

    return new Response(
      JSON.stringify({ success: true, taskId, taskUrl, action }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
