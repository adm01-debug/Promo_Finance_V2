// Recebe eventos do gate de CI (falhas da matriz de privilégios RPC) e
// persiste em `public.ci_security_gate_events` via service_role.
// Autenticado por segredo compartilhado (x-ci-gate-secret) com comparação
// timing-safe e fail-closed quando a configuração estiver ausente.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { validateContract } from '../_shared/contract-validator.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const bodySchema = z.object({
  git_sha: z.string().optional(),
  git_ref: z.string().optional(),
  workflow_run_url: z.string().optional(),
  migration_revision: z.string().optional(),
  failures: z
    .array(
      z.object({
        matrix: z.string().optional(),
        function_name: z.string().optional(),
        role_tested: z.enum(['anon', 'authenticated', 'service_role']),
        expected_state: z.enum(['allow', 'deny']),
        observed_status: z.number().int().optional(),
        observed_code: z.string().nullable().optional(),
        observed_message: z.string().nullable().optional(),
        exception_notes: z.string().nullable().optional(),
        severity: z.enum(['info', 'warning', 'error', 'critical']).optional(),
        raw: z.record(z.unknown()).optional(),
      })
    )
    .max(500),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-ci-gate-secret, x-supabase-client-platform',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type FailurePayload = z.infer<typeof bodySchema>['failures'][number];
type RequestBody = z.infer<typeof bodySchema>;

export interface HandlerDeps {
  getEnv: (name: string) => string | undefined;
  readJson: (req: Request) => Promise<unknown>;
  insertRows: (
    rows: Record<string, unknown>[]
  ) => Promise<{ error: { message: string } | null; count: number | null }>;
}

export function createHandler(deps: HandlerDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    const secretAuth = authorizeSharedSecret(
      deps.getEnv('CI_GATE_LOG_SECRET'),
      req.headers.get('x-ci-gate-secret')
    );
    if (!secretAuth.ok) return secretAuth.response;

    let raw: unknown;
    try {
      raw = await deps.readJson(req);
    } catch {
      return json({ error: 'invalid_json' }, 400);
    }

    const validation = await validateContract(bodySchema, raw);
    if (!validation.success) return withCors(validation.response);
    const body: RequestBody = validation.data;

    if (body.failures.length === 0) {
      return json({ inserted: 0, skipped: 'no_failures' }, 200);
    }

    const rows = body.failures.map((failure) => mapFailure(body, failure));
    const { error, count } = await deps.insertRows(rows);

    if (error) {
      console.error('insert_failed', error);
      return json({ error: 'insert_failed', details: error.message }, 500);
    }

    return json({ inserted: count ?? rows.length }, 201);
  };
}

function mapFailure(body: RequestBody, failure: FailurePayload): Record<string, unknown> {
  return {
    matrix: String(failure.matrix ?? 'unknown'),
    function_name: String(failure.function_name ?? 'unknown'),
    role_tested: failure.role_tested,
    expected_state: failure.expected_state,
    observed_status: failure.observed_status ?? null,
    observed_code: failure.observed_code ?? null,
    observed_message: failure.observed_message ?? null,
    migration_revision: body.migration_revision ?? null,
    git_sha: body.git_sha ?? null,
    git_ref: body.git_ref ?? null,
    workflow_run_url: body.workflow_run_url ?? null,
    exception_notes: failure.exception_notes ?? null,
    severity: failure.severity ?? 'error',
    raw: failure.raw ?? null,
  };
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

function defaultDeps(): HandlerDeps {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    getEnv: (name) => Deno.env.get(name),
    readJson: (req) => req.json(),
    insertRows: async (rows) => {
      const { error, count } = await admin
        .from('ci_security_gate_events')
        .insert(rows, { count: 'exact' });

      return {
        error: error ? { message: error.message } : null,
        count: count ?? null,
      };
    },
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
