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
//                Authorization: `******'SUPABASE_SERVICE_ROLE_KEY')}` },
//     body: JSON.stringify({ to: ADMIN_EMAIL, subject: titulo, body: mensagem }),
//   });

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { type SupabaseClient } from 'npm:@supabase/supabase-js@2.49.4';
import { exigirChamadaInterna, clientDeServico } from '../_shared/auth-guard.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
import { createLogger } from '../_shared/observability.ts';
import { corsHeadersPara } from '../_shared/cors.ts';

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

async function verificarCronFalhos(db: SupabaseClient): Promise<CronJobFalho[]> {
  // Retorna jobs onde ambas as 2 execuções mais recentes (nas últimas 2h)
  // falharam. HAVING garante mínimo de 2 execuções registradas.
  const { data, error } = await db.rpc(
    'exec_sql' as never,
    {
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
    } as never
  );

  if (error) {
    // Não engolir falha de leitura: o chamador precisa saber que o monitor
    // não conseguiu cumprir sua função, senão reporta ok:true com dados vazios.
    throw new Error(`falha ao consultar cron.job_run_details: ${error.message}`);
  }

  return ((data as unknown[]) ?? []) as CronJobFalho[];
}

async function verificarWebhooks(
  db: SupabaseClient
): Promise<{ taxa: number; total: number; erros: number }> {
  const { data, error } = await db
    .from('webhooks_log')
    .select('status')
    .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());

  if (error || !data) {
    // Não engolir falha de leitura (mesmo motivo de verificarCronFalhos).
    throw new Error(`falha ao consultar webhooks_log: ${error?.message ?? 'sem dados'}`);
  }

  const total = data.length;
  // Estado 'error' não existe no CHECK chk_webhooks_log_status — os estados
  // reais de falha gravados pelo webhook_mark_failure são failed/retrying/dead.
  const erros = data.filter(
    (r: { status: string }) =>
      r.status === 'failed' || r.status === 'retrying' || r.status === 'dead'
  ).length;
  const taxa = total > 0 ? erros / total : 0;

  return { taxa, total, erros };
}

// Janela de cooldown: não reabrir um alerta do mesmo tipo/título recém-criado.
const COOLDOWN_ALERTA_MS = 2 * 60 * 60 * 1000;

async function existeAlertaRecente(db: SupabaseClient, titulo: string): Promise<boolean> {
  const { data, error } = await db
    .from('alertas')
    .select('id')
    .eq('tipo', 'monitor_health')
    .eq('titulo', titulo)
    .eq('lido', false)
    .gte('created_at', new Date(Date.now() - COOLDOWN_ALERTA_MS).toISOString())
    .limit(1);

  if (error) {
    log.error('Falha ao checar alerta duplicado', { context: { error, titulo } });
  }

  return (data?.length ?? 0) > 0;
}

async function inserirAlerta(
  db: SupabaseClient,
  titulo: string,
  mensagem: string
): Promise<boolean> {
  if (await existeAlertaRecente(db, titulo)) {
    log.info('Alerta já existente nas últimas 2h, pulando duplicata', { context: { titulo } });
    return false;
  }

  // alertas.user_id é NOT NULL DEFAULT uid(); insert com service_role manda
  // uid() = NULL e viola a constraint. Busca um admin global para ser o dono.
  const { data: admin, error: errAdmin } = await db
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .is('empresa_id', null)
    .limit(1)
    .maybeSingle();

  if (errAdmin) {
    log.error('Falha ao buscar admin destinatário do alerta', { context: { error: errAdmin } });
    return false;
  }

  if (!admin?.id) {
    log.error('Nenhum admin global encontrado; alerta não inserido', { context: { titulo } });
    return false;
  }

  const { error } = await db.from('alertas').insert({
    user_id: admin.id,
    tipo: 'monitor_health',
    titulo,
    mensagem,
    prioridade: 'alta',
    lido: false,
  });

  if (error) {
    log.error('Falha ao inserir alerta na tabela alertas', { context: { error, titulo } });
    return false;
  }

  return true;
}

// ─── Handler principal ───────────────────────────────────────────────────────

serve(
  withEdgeObservability('monitor-health', async (req) => {
    const corsHeaders = corsHeadersPara(req);

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // GET é apenas health-check: não executa monitoramento nem insere nada.
    if (req.method === 'GET') {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

        log.warn(titulo, { context: { job } });
        if (await inserirAlerta(db, titulo, mensagem)) {
          status.alertas_inseridos++;
        }
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

        log.warn(titulo, { context: { taxa, total, erros } });
        if (await inserirAlerta(db, titulo, mensagem)) {
          status.alertas_inseridos++;
        }
      }

      log.info('monitor-health concluído', { context: { status } });

      return new Response(JSON.stringify({ ok: true, status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'erro desconhecido no monitor-health';
      log.error('Erro inesperado no monitor-health', { context: { error: mensagem } });
      return new Response(JSON.stringify({ ok: false, error: 'falha interna' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  })
);
