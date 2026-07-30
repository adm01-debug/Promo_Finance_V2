import { supabase } from '@/integrations/supabase/client';
import type { SandboxResult } from '@/components/admin/sso/sandbox/outcome';

export interface BulkUserInput {
  /** 1-based row number for UI/CSV correlation */
  row: number;
  claims: Record<string, unknown>;
}

export type BulkOutcome =
  | 'bloqueado'
  | 'seria_jit'
  | 'usuario_existente'
  | 'sem_email'
  | 'erro_rede';

export interface BulkResult {
  row: number;
  claims: Record<string, unknown>;
  /** null when erro_rede */
  result: SandboxResult | null;
  outcome: BulkOutcome;
  /** Short human-readable reason when blocked / errored */
  reason: string | null;
  errorMessage?: string;
}

export interface BulkRunnerOptions {
  concurrency?: number;
  signal?: AbortSignal;
  onProgress?: (done: number, total: number) => void;
  onResult?: (r: BulkResult) => void;
}

export interface BasePayload {
  provider_id?: string;
  claim_mapping?: { email?: string; full_name?: string; groups?: string };
  default_role?: string;
  allowed_domains?: string[];
  role_mappings?: Array<{ idp_group: string; app_role: string }>;
}

export const BULK_MAX_USERS = 200;

function classifyOutcome(result: SandboxResult): { outcome: BulkOutcome; reason: string | null } {
  const p = result.preview;
  if (!p.email) return { outcome: 'sem_email', reason: 'Claim de email vazia/ausente' };
  if (!p.domain_allowed) {
    return { outcome: 'bloqueado', reason: `Domínio "${p.domain}" fora da allowlist` };
  }
  if (p.provision_blocked_reason) {
    return { outcome: 'bloqueado', reason: p.provision_blocked_reason };
  }
  if ((result.errors?.length ?? 0) > 0) {
    return { outcome: 'bloqueado', reason: result.errors[0] };
  }
  if (p.user_exists) return { outcome: 'usuario_existente', reason: null };
  if (p.would_jit_provision) return { outcome: 'seria_jit', reason: null };
  return { outcome: 'bloqueado', reason: 'Não atende às regras de provisionamento' };
}

async function runOne(user: BulkUserInput, base: BasePayload): Promise<BulkResult> {
  const payload: Record<string, unknown> = { ...base, mock_claims: user.claims };
  try {
    const { data, error } = await supabase.functions.invoke('sso-test-login', { body: payload });
    if (error) {
      return {
        row: user.row,
        claims: user.claims,
        result: null,
        outcome: 'erro_rede',
        reason: error.message ?? 'Erro de rede',
        errorMessage: error.message,
      };
    }
    const sim = data as SandboxResult;
    const { outcome, reason } = classifyOutcome(sim);
    return { row: user.row, claims: user.claims, result: sim, outcome, reason };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido';
    return {
      row: user.row,
      claims: user.claims,
      result: null,
      outcome: 'erro_rede',
      reason: msg,
      errorMessage: msg,
    };
  }
}

/**
 * Executa um lote de simulações com limite de concorrência.
 * Falhas individuais não interrompem o lote.
 */
export async function runBulk(
  users: BulkUserInput[],
  base: BasePayload,
  opts: BulkRunnerOptions = {}
): Promise<BulkResult[]> {
  const concurrency = Math.max(1, Math.min(10, opts.concurrency ?? 5));
  const results: BulkResult[] = new Array(users.length);
  let cursor = 0;
  let done = 0;

  const worker = async () => {
    while (true) {
      if (opts.signal?.aborted) return;
      const idx = cursor++;
      if (idx >= users.length) return;
      const r = await runOne(users[idx], base);
      results[idx] = r;
      done++;
      opts.onResult?.(r);
      opts.onProgress?.(done, users.length);
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, users.length) }, () => worker());
  await Promise.all(workers);

  // Compactar (caso aborto deixe slots vazios no final)
  return results.filter(Boolean);
}
