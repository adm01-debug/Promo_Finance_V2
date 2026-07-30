/**
 * Calcula o delta entre o perfil atual e os claims recebidos no SSO.
 *
 * Regras:
 * - Nunca sobrescreve com vazio/whitespace (preserva dados existentes).
 * - Idempotente: valores semanticamente iguais (ignorando espaços nas pontas)
 *   NÃO geram changes nem updates.
 * - `null`/`undefined` em incoming são tratados como "não enviado".
 */

export interface ProfileFields {
  full_name: string | null;
  avatar_url: string | null;
  telefone: string | null;
}

export interface ProfileSyncDelta {
  changes: Record<string, { from: unknown; to: unknown }>;
  updates: Record<string, string>;
}

function normalize(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}

export function buildProfileSyncDelta(
  current: ProfileFields,
  incoming: Partial<ProfileFields>,
): ProfileSyncDelta {
  const changes: ProfileSyncDelta["changes"] = {};
  const updates: ProfileSyncDelta["updates"] = {};
  const fields: Array<keyof ProfileFields> = [
    "full_name",
    "avatar_url",
    "telefone",
  ];
  for (const f of fields) {
    const nextNorm = normalize(incoming[f]);
    if (nextNorm === null) continue; // nunca sobrescreve com vazio
    const currNorm = normalize(current[f]);
    if (currNorm === nextNorm) continue; // idempotente
    changes[f] = { from: current[f] ?? null, to: nextNorm };
    updates[f] = nextNorm;
  }
  return { changes, updates };
}
