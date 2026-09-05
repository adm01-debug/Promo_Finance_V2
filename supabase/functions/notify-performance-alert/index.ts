// Envia notificação (Slack e/ou e-mail via Resend) para alertas críticos de performance.
// Chamado por automações internas autenticadas via service_role ou x-cron-secret.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { exigirChamadaInterna, type ChamadaInterna } from '../_shared/auth-guard.ts';
import { createErrorResponse, validatePayload } from '../_shared/validation.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret, x-internal-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const alertShape = z
  .object({
    id: z.string().optional(),
    source: z.string().optional(),
    alert_key: z.string().optional(),
    severity: z.string(),
    reason: z.string().nullable().optional(),
    current_value: z.number().nullable().optional(),
    baseline_value: z.number().nullable().optional(),
    ratio: z.number().nullable().optional(),
    sample_count: z.number().nullable().optional(),
    query_snippet: z.string().nullable().optional(),
    created_at: z.string().optional(),
  })
  .passthrough();

const schema = z.union([z.object({ alert: alertShape }).passthrough(), alertShape]);

type AlertBody = { alert: AlertPayload } | AlertPayload;

export interface HandlerDeps {
  getEnv: (name: string) => string | undefined;
  guardInternal: (
    req: Request,
    secretKey: string
  ) => Promise<{ ok: true; dados: ChamadaInterna } | { ok: false; resposta: Response }>;
  readJson: (req: Request) => Promise<unknown>;
  fetch: typeof fetch;
  telemetryInsert: (row: Record<string, unknown>) => Promise<void>;
  nowIso: () => string;
}

type AlertPayload = z.infer<typeof alertShape>;

export function createHandler(deps: HandlerDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    const auth = await deps.guardInternal(req, 'internal_jobs');
    if (!auth.ok) return withCors(auth.resposta);

    let raw: unknown;
    try {
      raw = await deps.readJson(req);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'invalid_json' }, 400);
    }

    const parsed = validatePayload(schema, raw, 'notify-performance-alert');
    if (!parsed.success) return withCors(createErrorResponse(parsed.error, 400, parsed.details));
    const alert = extractAlert(parsed.data as AlertBody);

    if (!alert?.severity) {
      return json({ error: 'payload inválido' }, 400);
    }

    if (alert.severity !== 'critical' && alert.severity !== 'warning') {
      return json({ ok: true, skipped: 'severity' }, 200);
    }

    const slackUrl = deps.getEnv('SLACK_WEBHOOK_URL');
    const resendKey = deps.getEnv('RESEND_API_KEY');
    const emailTo = deps.getEnv('ALERTS_EMAIL_TO');
    const emailFrom = deps.getEnv('ALERTS_EMAIL_FROM') ?? 'alerts@resend.dev';

    const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';
    const title = `${emoji} Regressão de performance (${alert.severity})`;
    const ratioTxt = alert.ratio != null ? `${Number(alert.ratio).toFixed(2)}x` : '—';
    const curTxt = alert.current_value != null ? `${Math.round(alert.current_value)}ms` : '—';
    const baseTxt = alert.baseline_value != null ? `${Math.round(alert.baseline_value)}ms` : '—';
    const summary = alert.reason || alert.alert_key || 'Regressão detectada';

    const results: Record<string, unknown> = {};

    if (slackUrl) {
      const slackRes = await deps.fetch(slackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text:
            `${title}\n*${summary}*\n• Atual: ${curTxt} • Baseline: ${baseTxt} • Ratio: ${ratioTxt}\n` +
            `• Origem: ${alert.source ?? '—'} • Amostras: ${alert.sample_count ?? '—'}` +
            (alert.query_snippet ? `\n\`\`\`${alert.query_snippet.slice(0, 400)}\`\`\`` : ''),
        }),
      });
      results.slack = { status: slackRes.status, ok: slackRes.ok };
    }

    if (resendKey && emailTo) {
      const html = `
        <h2 style="font-family:system-ui;color:${alert.severity === 'critical' ? '#dc2626' : '#d97706'}">${title}</h2>
        <p style="font-family:system-ui;font-size:15px"><strong>${summary}</strong></p>
        <table style="font-family:system-ui;font-size:13px;border-collapse:collapse">
          <tr><td style="padding:4px 8px;color:#666">Valor atual</td><td style="padding:4px 8px"><strong>${curTxt}</strong></td></tr>
          <tr><td style="padding:4px 8px;color:#666">Baseline</td><td style="padding:4px 8px">${baseTxt}</td></tr>
          <tr><td style="padding:4px 8px;color:#666">Ratio</td><td style="padding:4px 8px"><strong>${ratioTxt}</strong></td></tr>
          <tr><td style="padding:4px 8px;color:#666">Origem</td><td style="padding:4px 8px">${alert.source ?? '—'}</td></tr>
          <tr><td style="padding:4px 8px;color:#666">Amostras</td><td style="padding:4px 8px">${alert.sample_count ?? '—'}</td></tr>
          <tr><td style="padding:4px 8px;color:#666">Detectado em</td><td style="padding:4px 8px">${alert.created_at ?? deps.nowIso()}</td></tr>
        </table>
        ${alert.query_snippet ? `<pre style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:12px;overflow:auto">${alert.query_snippet.replace(/</g, '&lt;')}</pre>` : ''}
        <p style="font-family:system-ui;font-size:12px;color:#666;margin-top:16px">Acesse o painel em <em>/admin/telemetria</em> para investigar.</p>
      `;

      const resendRes = await deps.fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailFrom,
          to: emailTo
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          subject: `${title}: ${summary.slice(0, 80)}`,
          html,
        }),
      });
      results.email = { status: resendRes.status, ok: resendRes.ok };
    }

    try {
      await deps.telemetryInsert({
        source: 'performance_alert_notifier',
        severity: 'info',
        message: `Alerta ${alert.severity} notificado`,
        metadata: { alert_id: alert.id, channels: results, origem: auth.dados.origem },
      });
    } catch {
      // Telemetria não deve bloquear a resposta.
    }

    return json({ ok: true, results }, 200);
  };
}

function defaultDeps(): HandlerDeps {
  const supaUrl = Deno.env.get('SUPABASE_URL');
  const supaKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const admin = supaUrl && supaKey ? createClient(supaUrl, supaKey) : null;

  return {
    getEnv: (name) => Deno.env.get(name),
    guardInternal: (req, secretKey) => exigirChamadaInterna(req, secretKey),
    readJson: (req) => req.json(),
    fetch: globalThis.fetch,
    telemetryInsert: async (row) => {
      if (!admin) return;
      await admin.from('query_telemetry').insert(row);
    },
    nowIso: () => new Date().toISOString(),
  };
}

function extractAlert(body: AlertBody): AlertPayload {
  if (typeof body === 'object' && body !== null && 'alert' in body) {
    return body.alert as AlertPayload;
  }

  return body as AlertPayload;
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

if (!Deno.env.get('DENO_TESTING')) {
  Deno.serve(createHandler(defaultDeps()));
}
