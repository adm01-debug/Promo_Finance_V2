/**
 * Resolve a deep link to the underlying entity related to an anomaly.
 * Used by the realtime drawer and inline drill-downs.
 */
export function getEntidadeUrl(
  entidade_tipo: string | null | undefined,
  entidade_id: string | null | undefined,
  anomaliaId: string,
): string {
  if (!entidade_tipo || !entidade_id) {
    return `/admin/insights-ia/anomalia/${anomaliaId}`;
  }
  switch (entidade_tipo) {
    case "movimentacao":
      return `/movimentacoes?highlight=${entidade_id}`;
    case "conta_pagar":
      return `/contas-pagar?highlight=${entidade_id}`;
    case "conta_receber":
      return `/contas-receber?highlight=${entidade_id}`;
    case "transacao_bancaria":
      return `/conciliacao?txId=${entidade_id}`;
    default:
      return `/admin/insights-ia/anomalia/${anomaliaId}`;
  }
}

export const ANOMALIA_DRAWER_EVENT = "open-anomalia-drawer";

export function dispatchOpenAnomaliaDrawer(id: string) {
  window.dispatchEvent(
    new CustomEvent(ANOMALIA_DRAWER_EVENT, { detail: { id } }),
  );
}

/**
 * Resolve the list page (without highlight params) and a friendly label
 * for the entity related to an anomaly. Used by breadcrumbs to let the
 * user jump back to the filtered list of the related entity.
 */
export function getEntidadeListInfo(
  entidade_tipo: string | null | undefined,
): { url: string; label: string } | null {
  switch (entidade_tipo) {
    case "movimentacao":
      return { url: "/movimentacoes", label: "Movimentações" };
    case "conta_pagar":
      return { url: "/contas-pagar", label: "Contas a pagar" };
    case "conta_receber":
      return { url: "/contas-receber", label: "Contas a receber" };
    case "transacao_bancaria":
      return { url: "/conciliacao", label: "Conciliação bancária" };
    default:
      return null;
  }
}
