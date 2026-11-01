// Edge Function: monitor-health
// Step 46 — PLANO_50: alerta ativo para falha de cron e de webhook.
//
// A cada 30 min o pg_cron chama esta função. Ela:
//  1. Verifica se algum job falhou nas 2 execuções consecutivas mais recentes.
//  2. Verifica se a taxa de erro de webhooks nas últimas 2 h supera 20%.
//  3. Em caso de problema: insere na tabela `alertas` e loga no console.
//
// TODO(canal-alerta): conectar ao canal WhatsApp/e-mail preferido após inserir o
// alerta. Exemplo para e-mail:
//   await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/enviar-alerta-email`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json',
//                Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
//     body: JSON.stringify({ to: ADMIN_EMAIL, subject: titulo, body: mensagem }),
//   });

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { exigirChamadaInterna, clientDeServico } from '../_shared/auth-guard.ts';
import { corsHeadersPara } from '../_shared/cors.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
import { createLogger } from '../_shared/observability.ts';

const log = createLogger('monitor-health');

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface CronJobFalho {
  jobname: string;
  falhas_consecutivas: number;
  ultimo_erro: string | null;
  ultima_execucao: string;
}

interface StatusMonitor {
  cron_falhos: CronJobFalho[];
  webhook_taxa_erro: number;
  total_webhooks_2h: number;
  total_erros_2h: number;
  alertas_inseridos: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function verificarCronFalhos(
  db: ReturnType<typeof createClient>
): Promise<CronJobFalho[]> {
  // Retorna jobs onde ambas as 2 execuções mais recentes (nas últimas 2h)
  // falharam. HAVING garante mínimo de 2 execuções registradas.
  const { data, error } = await db.rpc('exec_sql' as never, {
    sql: `
      WITH ultimas AS (
        SELECT
          j.jobname,
          d.status,
          d.return_message,
          d.end_time,
          ROW_NUMBER() OVER (PARTITION BY d.jobid ORDER BY d.end_time DESC) AS rn
        FROM cron.job_run_details d
        JOIN cron.job j ON j.jobid = d.jobid
        WHERE d.end_time > NOW() - INTERVAL '2 hours'
      ),
      por_job AS (
        SELECT
          jobname,
          COUNT(*) FILTER (WHERE status = 'failed') AS falhas,
          MAX(end_time) FILTER (WHERE rn = 1)::text AS ultima_execucao,
          MAX(return_message) FILTER (WHERE status = 'failed' AND rn = 1) AS ultimo_erro
        FROM ultimas
        WHERE rn <= 2
        GROUP BY jobname
        HAVING COUNT(*) FILTER (WHERE status = 'failed') >= 2
      )
      SELECT jobname, falhas::int AS falhas_consecutivas, ultimo_erro, ultima_execucao
      FROM por_job
    `,
  } as never);

  if (error) {
    log.error('Erro ao verificar cron jobs', { error });
    return [];
  }

  return ((data as unknown[]) ?? []) as CronJobFalho[];
}

async function verificarWebhooks(db: ReturnType<typeof createClient>): Promise<{
  taxa: number;
  total: number;
  erros: number;
}> {
  const { data, error } = await db
    .from('webhooks_log')
    .select('status')
    .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());

  if (error || !data) {
    log.error('Erro ao verificar webhooks_log', { error });
    return { taxa: 0, total: 0, erros: 0 };
  }

  const total = data.length;
  const erros = data.filter(
    (r: { status: string }) => r.status === 'error' || r.status === 'failed'
  ).length;
  const taxa = total > 0 ? erros / total : 0;

  return { taxa, total, erros };
}

async function inserirAlerta(
  db: ReturnType<typeof createClient>,
  titulo: string,
  mensagem: string
): Promise<void> {
  const { error } = await db.from('alertas').insert({
    tipo: 'monitor_health',
    titulo,
    mensagem,
    prioridade: 'alta',
    lido: false,
  });

  if (error) {
    log.error('Falha ao inserir alerta na tabela alertas', { error, titulo });
  }
}

// ─── Handler principal ───────────────────────────────────────────────────────

serve(
  withEdgeObservability('monitor-health', async (req) => {
    const corsHeaders = corsHeadersPara(req);

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Apenas pg_cron ou chamada interna com segredo rotacionável.
    const auth = await exigirChamadaInterna(req, 'monitor_health_cron');
    if (!auth.ok) return auth.resposta;

    try {
      const db = clientDeServico();
      const status: StatusMonitor = {
        cron_falhos: [],
        webhook_taxa_erro: 0,
        total_webhooks_2h: 0,
        total_erros_2h: 0,
        alertas_inseridos: 0,
      };

      // 1. Cron jobs com 2 falhas consecutivas nas últimas 2h
      status.cron_falhos = await verificarCronFalhos(db);

      for (const job of status.cron_falhos) {
        const titulo = `[MONITOR] Cron "${job.jobname}" falhou 2× consecutivas`;
        const mensagem =
          `Job: ${job.jobname}\n` +
          `Falhas consecutivas: ${job.falhas_consecutivas}\n` +
          `Última execução: ${job.ultima_execucao}\n` +
          `Erro: ${job.ultimo_erro ?? 'sem detalhe'}`;

        log.warn(titulo, { job });
        await inserirAlerta(db, titulo, mensagem);
        status.alertas_inseridos++;
      }

      // 2. Taxa de erro de webhooks nas últimas 2h
      const { taxa, total, erros } = await verificarWebhooks(db);
      status.webhook_taxa_erro = taxa;
      status.total_webhooks_2h = total;
      status.total_erros_2h = erros;

      if (total > 0 && taxa > 0.2) {
        const titulo = `[MONITOR] Webhooks com ${(taxa * 100).toFixed(1)}% de erro nas últimas 2h`;
        const mensagem =
          `Total de webhooks: ${total}\n` +
          `Com erro: ${erros}\n` +
          `Taxa: ${(taxa * 100).toFixed(1)}%\n` +
          `Limiar: 20%`;

        log.warn(titulo, { taxa, total, erros });
        await inserirAlerta(db, titulo, mensagem);
        status.alertas_inseridos++;
      }

      log.info('monitor-health concluído', status);

      return new Response(JSON.stringify({ ok: true, status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      log.error('Erro inesperado no monitor-health', { err });
      return new Response(JSON.stringify({ ok: false, error: String(err) }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  })
);
