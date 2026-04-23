// Helpers for resolving SSO claims (OIDC + SAML) with flexible mapping
// and safe defaults. Extracted for unit testing.

/**
 * Resolve um valor a partir de uma fonte de claims usando um mapeamento flexível.
 *
 * O `mapping[logicalKey]` pode ser:
 *  - string única, ex.: "photoUrl"
 *  - caminho com pontos para claims aninhadas, ex.: "profile.photo.url"
 *  - array de fallbacks, ex.: ["photoUrl", "picture", "avatar"]
 *
 * Se nenhum mapeamento estiver definido, usamos `defaults` (na ordem) como fallback.
 * Retorna a primeira string não-vazia encontrada, ou `null`.
 */
export function resolveClaim(
  sources: Array<Record<string, unknown> | undefined | null>,
  mapping: Record<string, unknown>,
  logicalKey: string,
  defaults: string[],
): string | null {
  const raw = mapping?.[logicalKey];
  const candidates: string[] = [];
  if (Array.isArray(raw)) {
    for (const k of raw) if (typeof k === "string" && k.trim()) candidates.push(k.trim());
  } else if (typeof raw === "string" && raw.trim()) {
    candidates.push(raw.trim());
  }
  for (const d of defaults) if (!candidates.includes(d)) candidates.push(d);

  const getPath = (
    obj: Record<string, unknown> | undefined | null,
    path: string,
  ): unknown => {
    if (!obj) return undefined;
    if (path in obj) return obj[path];
    const parts = path.split(".");
    let cur: unknown = obj;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return undefined;
      }
    }
    return cur;
  };

  for (const key of candidates) {
    for (const src of sources) {
      const v = getPath(src, key);
      if (typeof v === "string" && v.trim()) return v;
      if (typeof v === "number" || typeof v === "boolean") return String(v);
    }
  }
  return null;
}

/** Resolve uma lista (groups) seguindo a mesma lógica de fallback de `resolveClaim`. */
export function resolveClaimArray(
  sources: Array<Record<string, unknown> | undefined | null>,
  mapping: Record<string, unknown>,
  logicalKey: string,
  defaults: string[],
): string[] {
  const raw = mapping?.[logicalKey];
  const candidates: string[] = [];
  if (Array.isArray(raw)) {
    for (const k of raw) if (typeof k === "string" && k.trim()) candidates.push(k.trim());
  } else if (typeof raw === "string" && raw.trim()) {
    candidates.push(raw.trim());
  }
  for (const d of defaults) if (!candidates.includes(d)) candidates.push(d);

  for (const key of candidates) {
    for (const src of sources) {
      if (!src) continue;
      const v = (src as Record<string, unknown>)[key];
      if (Array.isArray(v)) return (v as unknown[]).map(String);
      if (typeof v === "string" && v.trim()) return [v];
    }
  }
  return [];
}

export const AVATAR_DEFAULTS = ["picture", "avatar_url", "photoUrl", "photo_url"];
export const TELEFONE_DEFAULTS = [
  "phone_number",
  "phoneNumber",
  "phone",
  "mobile",
  "mobilePhone",
];

/**
 * Normaliza telefone removendo caracteres inválidos e mantendo apenas dígitos
 * (com possível "+" inicial). Retorna null se ficar vazio.
 */
export function normalizeTelefone(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D+/g, "");
  if (!digits) return null;
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Aplica o resultado da extração ao perfil garantindo que campos vazios/null
 * NUNCA sobrescrevam valores existentes (avatar/telefone/full_name).
 */
export function mergeProfileSafely(
  current: { full_name?: string | null; avatar_url?: string | null; telefone?: string | null },
  incoming: { full_name?: string | null; avatar_url?: string | null; telefone?: string | null },
): { full_name: string | null; avatar_url: string | null; telefone: string | null } {
  const pick = (next: string | null | undefined, prev: string | null | undefined) => {
    if (typeof next === "string" && next.trim()) return next;
    return prev ?? null;
  };
  return {
    full_name: pick(incoming.full_name, current.full_name),
    avatar_url: pick(incoming.avatar_url, current.avatar_url),
    telefone: pick(
      incoming.telefone ? normalizeTelefone(incoming.telefone) : null,
      current.telefone,
    ),
  };
}
