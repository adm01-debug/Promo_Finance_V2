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
