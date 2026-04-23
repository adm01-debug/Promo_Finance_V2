/**
 * Calcula a próxima janela de despacho de notificações de assinatura conforme
 * a cadência escolhida pelo usuário. Mantido puro (sem React/Supabase) para
 * facilitar testes — espelha o contrato da coluna `next_dispatch_at`.
 *
 * - `imediata`: sem agendamento (retorna null) → entrega em tempo real.
 * - `horaria`: agrupa pendentes e despacha no minuto do `horario_preferido`
 *   da próxima hora cheia (ex.: preferido 09:30 → próximas janelas em 10:30,
 *   11:30, ...). Mantém a referência do horário escolhido sem amarrar a cada
 *   hora exata zero.
 * - `diaria`: despacha uma única vez por dia, no `horario_preferido` (hoje
 *   se ainda não passou, senão amanhã). Sempre normalizado para o fuso local
 *   do navegador — combina com o que o usuário enxerga ao escolher.
 */
import type { SubscriptionFrequencia } from "./useSavedFilterSubscriptions";

/** "HH:MM[:SS]" → [h, m]. Retorna [9,0] como fallback defensivo. */
function parseHorario(horario: string): [number, number] {
  const [hh = "9", mm = "0"] = horario.split(":");
  const h = Math.min(23, Math.max(0, Number.parseInt(hh, 10) || 0));
  const m = Math.min(59, Math.max(0, Number.parseInt(mm, 10) || 0));
  return [h, m];
}

export function computeNextDispatch(
  frequencia: SubscriptionFrequencia,
  horarioPreferido: string,
  now: Date = new Date(),
): Date | null {
  if (frequencia === "imediata") return null;

  const [h, m] = parseHorario(horarioPreferido);

  if (frequencia === "diaria") {
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  }

  // horaria: próxima ocorrência do minuto preferido (m), na hora seguinte
  // se já passamos do minuto na hora atual.
  const target = new Date(now);
  target.setMinutes(m, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setHours(target.getHours() + 1);
  }
  return target;
}

/**
 * Decide se o cliente deve despachar agora os itens acumulados de uma
 * assinatura: ou é cadência imediata, ou já passamos do `next_dispatch_at`.
 */
export function shouldDispatchNow(
  frequencia: SubscriptionFrequencia,
  nextDispatchAt: string | null,
  now: Date = new Date(),
): boolean {
  if (frequencia === "imediata") return true;
  if (!nextDispatchAt) return false;
  return new Date(nextDispatchAt).getTime() <= now.getTime();
}

/** Rótulo curto da cadência para exibição na UI. */
export function describeFrequencia(f: SubscriptionFrequencia): string {
  switch (f) {
    case "imediata":
      return "Imediata";
    case "horaria":
      return "A cada 1 hora";
    case "diaria":
      return "Diária";
  }
}
