// n8n-callback — recebe callbacks do n8n para materializar ações no banco.
// Autenticado por segredo compartilhado timing-safe antes de body/DB.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { createErrorResponse, validatePayload } from '../_shared/validation.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-n8n-secret, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const schema = z
  .object({
    action: z.enum(['create_task', 'create_alert', 'log']),
    payload: z.record(z.unknown()),
  })
  .passthrough();

type Action = z.infer<typeof schema>['action'];
type CallbackBody = z.infer<typeof schema>;
type InsertResult = { data: unknown; error: { message: string } | null };
type AwaitableInsertResult = PromiseLike<InsertResult> | Promise<InsertResult>;

const ALLOWED_ALERT_SEVERITY = new Set(['info', 'warning', 'critical', 'low', 'medium', 'high']);

export interface HandlerDeps {
  getEnv: (name: string) => string | undefined;
  readJson: (req: Request) => Promise<unknown>;
  admin: {
    from: (table: string) => {
      insert: (row: Record<string, unknown>) => {
        select: () => {
          single: () => AwaitableInsertResult;
        };
      };
    };
  };
}

export function createHandler(deps: HandlerDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    const secretAuth = authorizeSharedSecret(
      deps.getEnv('N8N_CALLBACK_SECRET'),
      req.headers.get('x-n8n-secret')
    );
    if (!secretAuth.ok) return secretAuth.response;

    let raw: unknown;
    try {
      raw = await deps.readJson(req);
    } catch {
      return json({ error: 'invalid_json' }, 400);
    }

    const parsed = validatePayload(schema, raw ?? {}, 'n8n-callback');
    if (!parsed.success) return withCors(createErrorResponse(parsed.error, 400, parsed.details));
    const body: CallbackBody = parsed.data;

    try {
      const result = await executeAction(deps.admin, body);
      return json({ ok: true, action: body.action, result });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('n8n-callback error:', msg);
      return json({ error: msg }, 500);
    }
  };
}

async function executeAction(admin: HandlerDeps['admin'], body: CallbackBody): Promise<unknown> {
  const payload = body.payload;

  switch (body.action) {
    case 'create_task':
      return await insertSingle(admin, 'bitrix24_activities', {
        activity_type: 'task',
        subject: asString(payload.subject) ?? asString(payload.title) ?? 'Task via n8n',
        order_id: asString(payload.order_id),
        deal_id: typeof payload.deal_id === 'number' ? payload.deal_id : null,
      });
    case 'create_alert': {
      const severity = (asString(payload.severity) ?? 'warning').toLowerCase();
      if (!ALLOWED_ALERT_SEVERITY.has(severity)) {
        throw new Error(`severity inválida: ${severity}`);
      }

      return await insertSingle(admin, 'alerts', {
        type: asString(payload.type) ?? asString(payload.alert_type) ?? 'n8n_generated',
        severity,
        title: asString(payload.title) ?? 'Alerta via n8n',
        message: asString(payload.message) ?? asString(payload.description) ?? '',
        order_id: asString(payload.order_id),
        driver_id: asString(payload.driver_id),
        metadata: payload,
      });
    }
    case 'log':
      return await insertSingle(admin, 'audit_logs', {
        action: asString(payload.action) ?? 'n8n_callback',
        table_name: asString(payload.table_name) ?? 'n8n',
        record_id: asString(payload.record_id),
        new_data: payload,
      });
  }
}

async function insertSingle(
  admin: HandlerDeps['admin'],
  table: string,
  row: Record<string, unknown>
): Promise<unknown> {
  const { data, error } = await admin.from(table).insert(row).select().single();

  if (error) throw error;
  return data;
}

function authorizeSharedSecret(
  expected: string | undefined,
  provided: string | null
): { ok: true } | { ok: false; response: Response } {
  const normalizedExpected = expected?.trim();
  if (!normalizedExpected) {
    return { ok: false, response: json({ error: 'secret_not_configured' }, 503) };
  }

  const normalizedProvided = provided?.trim();
  if (!normalizedProvided || !timingSafeEqual(normalizedExpected, normalizedProvided)) {
    return { ok: false, response: json({ error: 'unauthorized' }, 401) };
  }

  return { ok: true };
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function defaultDeps(): HandlerDeps {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  return {
    getEnv: (name) => Deno.env.get(name),
    readJson: (req) => req.json(),
    admin,
  };
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

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

if (!Deno.env.get('DENO_TESTING')) {
  Deno.serve(createHandler(defaultDeps()));
}
