/**
 * Validações puras para compartilhamento de filtros salvos.
 *
 * Objetivos:
 *  1. Garantir que apenas papéis pertencentes ao enum global da aplicação
 *     possam ser compartilhados (defesa contra strings arbitrárias).
 *  2. Garantir que a lista de papéis compartilhados respeite a configuração
 *     do tenant: nenhum papel fora dos vínculos ativos da empresa pode ser
 *     usado, mesmo que seja um `AppRole` válido em outro tenant.
 *  3. Não aceitar duplicatas / strings vazias / valores cosméticos.
 *
 * Funções puras facilitam testes unitários e mantêm o hook fino.
 */

export type AppRole =
  | "admin"
  | "financeiro"
  | "operacional"
  | "visualizador";

export const ALL_APP_ROLES: readonly AppRole[] = [
  "admin",
  "financeiro",
  "operacional",
  "visualizador",
] as const;

const APP_ROLE_SET: ReadonlySet<string> = new Set(ALL_APP_ROLES);

export interface SharingValidationInput {
  /** Estado desejado de compartilhamento. */
  isShared: boolean;
  /** Papéis solicitados (podem vir do form, com lixo). */
  sharedWithRoles: readonly string[];
  /** Empresa alvo (já resolvida com fallback do contexto). */
  empresaId: string | null;
  /** Papéis disponíveis no tenant — derivados de user_empresas (ativo=true). */
  tenantRoles: readonly string[];
}

export interface NormalizedSharing {
  isShared: boolean;
  sharedWithRoles: AppRole[];
  empresaId: string | null;
}

export class SavedFilterSharingError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "EMPRESA_REQUIRED"
      | "INVALID_APP_ROLE"
      | "ROLE_OUT_OF_TENANT"
      | "TENANT_HAS_NO_ROLES",
  ) {
    super(message);
    this.name = "SavedFilterSharingError";
  }
}

/** Type-guard estrito para o enum AppRole. */
export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && APP_ROLE_SET.has(value);
}

/**
 * Normaliza a lista (trim, lowercase, dedupe, ordem estável)
 * sem ainda validar pertinência ao tenant.
 */
export function normalizeRoles(roles: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of roles) {
    if (typeof raw !== "string") continue;
    const v = raw.trim().toLowerCase();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  // ordem estável por nome — não depende de order de inserção
  return out.sort();
}

/**
 * Valida e normaliza um pedido de compartilhamento.
 * Lança SavedFilterSharingError com `code` específico em caso de violação.
 */
export function validateSharing(
  input: SharingValidationInput,
): NormalizedSharing {
  // Caso 1: usuário desligou o compartilhamento — sempre válido,
  // forçamos a limpeza dos campos derivados.
  if (!input.isShared) {
    return {
      isShared: false,
      sharedWithRoles: [],
      empresaId: null,
    };
  }

  if (!input.empresaId) {
    throw new SavedFilterSharingError(
      "Selecione uma empresa atual para compartilhar o filtro.",
      "EMPRESA_REQUIRED",
    );
  }

  const requested = normalizeRoles(input.sharedWithRoles);

  // Lista vazia = "todos do tenant"; é permitido por design,
  // mas se o tenant não tem nenhum papel ativo isso vira um filtro órfão.
  const tenantRoles = normalizeRoles(input.tenantRoles).filter(isAppRole);

  if (tenantRoles.length === 0) {
    throw new SavedFilterSharingError(
      "Esta empresa ainda não possui papéis ativos. Configure usuários antes de compartilhar filtros.",
      "TENANT_HAS_NO_ROLES",
    );
  }

  // Valida cada papel contra o enum global e contra o tenant.
  const tenantSet = new Set(tenantRoles);
  for (const role of requested) {
    if (!isAppRole(role)) {
      throw new SavedFilterSharingError(
        `Papel inválido: "${role}". Use apenas papéis suportados pelo sistema.`,
        "INVALID_APP_ROLE",
      );
    }
    if (!tenantSet.has(role)) {
      throw new SavedFilterSharingError(
        `O papel "${role}" não existe nesta empresa e não pode receber acesso ao filtro.`,
        "ROLE_OUT_OF_TENANT",
      );
    }
  }

  return {
    isShared: true,
    sharedWithRoles: requested as AppRole[],
    empresaId: input.empresaId,
  };
}
