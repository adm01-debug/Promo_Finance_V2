/**
 * Empacotamento e validação de bundles de exportação de filtros compartilhados.
 *
 * Estratégia:
 *  - O bundle é um JSON portátil que NÃO inclui IDs internos (uuid, created_at).
 *  - Inclui um `schemaVersion` para forçar quebra-segura quando mudarmos o formato.
 *  - Inclui o `exportedFromEmpresaId` apenas como metadado de origem; a empresa
 *    de destino é resolvida no momento do import (currentEmpresaId do importador).
 *  - Cada item carrega entity_type + name + filters + shared_with_roles, que são
 *    suficientes para reconstruir as permissões exatas em outra conta.
 *  - O importador deve revalidar `shared_with_roles` contra os papéis do tenant
 *    de destino (já fazemos isso via `validateSharing`, em useSavedFilters).
 */

import type { AppRole } from "@/hooks/savedFiltersValidation";
import { ALL_APP_ROLES } from "@/hooks/savedFiltersValidation";

export const SHARED_FILTERS_BUNDLE_VERSION = 1 as const;

export interface SharedFilterBundleItem {
  entity_type: string;
  name: string;
  filters: unknown;
  shared_with_roles: AppRole[];
  /** Apenas metadado — útil para auditoria visual no JSON. */
  source_owner_email?: string | null;
}

export interface SharedFilterBundle {
  schemaVersion: typeof SHARED_FILTERS_BUNDLE_VERSION;
  exportedAt: string;
  exportedBy: { id: string; email: string | null } | null;
  exportedFromEmpresaId: string | null;
  items: SharedFilterBundleItem[];
}

const APP_ROLE_SET = new Set<string>(ALL_APP_ROLES);

function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && APP_ROLE_SET.has(value);
}

function sanitizeRoles(input: unknown): AppRole[] {
  if (!Array.isArray(input)) return [];
  const out = new Set<AppRole>();
  for (const v of input) if (isAppRole(v)) out.add(v);
  return Array.from(out).sort();
}

/** Constrói o bundle a partir das linhas vindas do banco. */
export function buildBundle(params: {
  rows: ReadonlyArray<{
    entity_type: string;
    name: string;
    filters: unknown;
    shared_with_roles: AppRole[];
    empresa_id: string | null;
    user_id: string;
  }>;
  ownersById: Record<string, { email: string | null } | undefined>;
  exportedBy: { id: string; email: string | null } | null;
  fromEmpresaId: string | null;
}): SharedFilterBundle {
  const items: SharedFilterBundleItem[] = params.rows.map((r) => ({
    entity_type: r.entity_type,
    name: r.name,
    filters: r.filters ?? {},
    shared_with_roles: sanitizeRoles(r.shared_with_roles),
    source_owner_email: params.ownersById[r.user_id]?.email ?? null,
  }));

  return {
    schemaVersion: SHARED_FILTERS_BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),
    exportedBy: params.exportedBy,
    exportedFromEmpresaId: params.fromEmpresaId,
    items,
  };
}

export class SharedFilterBundleParseError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "INVALID_JSON"
      | "INVALID_SHAPE"
      | "UNSUPPORTED_VERSION"
      | "EMPTY_ITEMS",
  ) {
    super(message);
    this.name = "SharedFilterBundleParseError";
  }
}

/**
 * Parse + validação estrutural. NÃO valida ainda contra o tenant de destino;
 * isso fica para o import (que conhece o `currentEmpresaId`).
 */
export function parseBundle(raw: string): SharedFilterBundle {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new SharedFilterBundleParseError(
      "Arquivo inválido: não é um JSON.",
      "INVALID_JSON",
    );
  }
  if (!parsed || typeof parsed !== "object") {
    throw new SharedFilterBundleParseError(
      "Arquivo inválido: estrutura inesperada.",
      "INVALID_SHAPE",
    );
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.schemaVersion !== SHARED_FILTERS_BUNDLE_VERSION) {
    throw new SharedFilterBundleParseError(
      `Versão do bundle não suportada (esperado v${SHARED_FILTERS_BUNDLE_VERSION}).`,
      "UNSUPPORTED_VERSION",
    );
  }
  if (!Array.isArray(obj.items)) {
    throw new SharedFilterBundleParseError(
      "Arquivo inválido: campo 'items' ausente.",
      "INVALID_SHAPE",
    );
  }
  const items: SharedFilterBundleItem[] = [];
  for (const it of obj.items) {
    if (!it || typeof it !== "object") continue;
    const i = it as Record<string, unknown>;
    if (typeof i.entity_type !== "string" || typeof i.name !== "string") continue;
    items.push({
      entity_type: i.entity_type.trim(),
      name: i.name.trim(),
      filters: i.filters ?? {},
      shared_with_roles: sanitizeRoles(i.shared_with_roles),
      source_owner_email:
        typeof i.source_owner_email === "string" ? i.source_owner_email : null,
    });
  }
  if (items.length === 0) {
    throw new SharedFilterBundleParseError(
      "O arquivo não contém filtros válidos para importar.",
      "EMPTY_ITEMS",
    );
  }
  return {
    schemaVersion: SHARED_FILTERS_BUNDLE_VERSION,
    exportedAt: typeof obj.exportedAt === "string" ? obj.exportedAt : new Date().toISOString(),
    exportedBy:
      obj.exportedBy && typeof obj.exportedBy === "object"
        ? (obj.exportedBy as SharedFilterBundle["exportedBy"])
        : null,
    exportedFromEmpresaId:
      typeof obj.exportedFromEmpresaId === "string"
        ? obj.exportedFromEmpresaId
        : null,
    items,
  };
}

/** Dispara download do bundle como arquivo .json no navegador. */
export function downloadBundle(bundle: SharedFilterBundle, filename?: string) {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = filename ?? `filtros-compartilhados-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
