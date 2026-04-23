/**
 * Validações puras para preferências de alerta de anomalias.
 *
 * Espelha as restrições do trigger Postgres `validate_user_anomalia_preferences`
 * e adiciona regras de UX que evitam "configurações zumbi" (ex.: ativar toasts
 * sem nenhuma severidade ou sem nenhuma ação clicável).
 *
 * Mantido sem dependência de React/Supabase para ficar trivial de testar e
 * reutilizar tanto na mutation quanto na UI (botão "Salvar" desabilitado etc.).
 */
import {
  TOAST_DURACAO_MAX,
  TOAST_DURACAO_MIN,
  type AnomaliaPreferences,
  type DrawerAcoes,
  type Severidade,
  type ToastAcoes,
} from "./useAnomaliaPreferences";

export const SEVERIDADES_VALIDAS: readonly Severidade[] = [
  "baixa",
  "media",
  "alta",
  "critica",
] as const;

export const TOAST_ACAO_KEYS = [
  "drill_down",
  "abrir_pagina",
  "copiar_id",
  "marcar_lida",
] as const satisfies ReadonlyArray<keyof ToastAcoes>;

export const DRAWER_ACAO_KEYS = [
  "abrir_entidade",
  "pagina_completa",
  "copiar_id",
  "marcar_lida",
] as const satisfies ReadonlyArray<keyof DrawerAcoes>;

export type ValidationCode =
  | "DURACAO_FORA_DO_RANGE"
  | "DURACAO_NAO_INTEIRA"
  | "SEVERIDADE_INVALIDA"
  | "SEVERIDADES_VAZIAS_COM_TOAST_ATIVO"
  | "TOAST_SEM_ACOES_COM_DRILL_DOWN_OBRIGATORIO"
  | "DRAWER_SEM_ACOES";

export interface ValidationIssue {
  code: ValidationCode;
  message: string;
  /** Caminho lógico do campo afetado, útil para destaque em UI. */
  field:
    | "toast_duracao_segundos"
    | "toast_severidades_ativas"
    | "toast_acoes"
    | "drawer_acoes";
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

export type AnomaliaPreferencesPatch = Partial<
  Omit<AnomaliaPreferences, "id" | "user_id">
>;

/** True se ao menos uma chave do objeto de ações está marcada como true. */
function hasAtLeastOneTrue(record: Record<string, boolean> | undefined): boolean {
  if (!record) return false;
  return Object.values(record).some(Boolean);
}

/**
 * Valida um patch (parcial) de preferências.
 *
 * - Duração: range 3..30 e número inteiro (espelha o trigger SQL).
 * - Severidades: somente valores conhecidos. Lista vazia só é aceita se o
 *   master switch (`toast_enabled`) também estiver desligado — caso contrário
 *   o usuário ficaria "ouvindo nada".
 * - Ações: o drawer precisa de pelo menos uma ação, senão vira uma caixa
 *   inútil. Para o toast, se não há nenhuma ação habilitada permitimos
 *   (toast informativo puro), mas registramos um aviso quando o usuário
 *   também não tiver `drill_down` E o drawer estiver vazio (combinação que
 *   torna a anomalia inacessível pelo realtime).
 */
export function validateAnomaliaPreferencesPatch(
  patch: AnomaliaPreferencesPatch,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (patch.toast_duracao_segundos !== undefined) {
    const d = patch.toast_duracao_segundos;
    if (!Number.isFinite(d) || !Number.isInteger(d)) {
      issues.push({
        code: "DURACAO_NAO_INTEIRA",
        field: "toast_duracao_segundos",
        message: "A duração do toast deve ser um número inteiro de segundos.",
      });
    } else if (d < TOAST_DURACAO_MIN || d > TOAST_DURACAO_MAX) {
      issues.push({
        code: "DURACAO_FORA_DO_RANGE",
        field: "toast_duracao_segundos",
        message: `A duração do toast deve estar entre ${TOAST_DURACAO_MIN}s e ${TOAST_DURACAO_MAX}s.`,
      });
    }
  }

  if (patch.toast_severidades_ativas !== undefined) {
    const sevs = patch.toast_severidades_ativas;
    const invalid = sevs.filter(
      (s) => !SEVERIDADES_VALIDAS.includes(s as Severidade),
    );
    if (invalid.length > 0) {
      issues.push({
        code: "SEVERIDADE_INVALIDA",
        field: "toast_severidades_ativas",
        message: `Severidade(s) inválida(s): ${invalid.join(", ")}.`,
      });
    }
    const enabledNow =
      patch.toast_enabled !== undefined ? patch.toast_enabled : true;
    if (sevs.length === 0 && enabledNow) {
      issues.push({
        code: "SEVERIDADES_VAZIAS_COM_TOAST_ATIVO",
        field: "toast_severidades_ativas",
        message:
          "Selecione ao menos 1 severidade ou desative o master switch de toasts.",
      });
    }
  }

  // Drawer precisa de ao menos 1 ação se foi explicitamente enviado.
  if (patch.drawer_acoes !== undefined) {
    if (!hasAtLeastOneTrue(patch.drawer_acoes)) {
      issues.push({
        code: "DRAWER_SEM_ACOES",
        field: "drawer_acoes",
        message:
          "O drawer precisa de ao menos 1 ação habilitada (ex.: abrir entidade ou copiar ID).",
      });
    }
  }

  // Combinação inválida: toast sem nenhuma ação E drawer também sem ações
  // (ou drawer não enviado e o atual também vazio) inviabiliza qualquer
  // resposta do usuário ao alerta. Só checamos quando *ambos* foram enviados
  // — patches isolados são tolerados pois mesclam com o estado atual.
  if (patch.toast_acoes !== undefined && patch.drawer_acoes !== undefined) {
    const toastVazio = !hasAtLeastOneTrue(patch.toast_acoes);
    const drawerVazio = !hasAtLeastOneTrue(patch.drawer_acoes);
    if (toastVazio && drawerVazio) {
      issues.push({
        code: "TOAST_SEM_ACOES_COM_DRILL_DOWN_OBRIGATORIO",
        field: "toast_acoes",
        message:
          "Combinação inválida: toast e drawer ambos sem ações. Habilite ao menos uma rota de drill-down.",
      });
    }
  }

  return { ok: issues.length === 0, issues };
}

/** Lança um Error com todas as mensagens concatenadas. Útil em mutations. */
export function assertValidAnomaliaPreferencesPatch(
  patch: AnomaliaPreferencesPatch,
): void {
  const result = validateAnomaliaPreferencesPatch(patch);
  if (!result.ok) {
    const msg = result.issues.map((i) => i.message).join(" ");
    throw new Error(msg);
  }
}
