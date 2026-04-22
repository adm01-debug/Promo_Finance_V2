import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Revalidates anomaly-related React Query caches whenever the user returns
 * to the tab/window. This keeps the anomalia list and drill-down in sync
 * with status changes that happen on the related entity's full screen
 * (e.g., user clicks "Abrir tela completa", makes changes there, then
 * comes back via browser back/tab switch — without a full page reload).
 *
 * Optionally accepts a specific anomalia id to also invalidate its detail.
 */
export function useRefetchAnomaliasOnFocus(anomaliaId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: ["anomalias-detectadas"] });
      qc.invalidateQueries({ queryKey: ["anomalias-criticas-count"] });
      if (anomaliaId) {
        qc.invalidateQueries({ queryKey: ["anomalia-detalhe", anomaliaId] });
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") invalidate();
    };

    window.addEventListener("focus", invalidate);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", invalidate);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [qc, anomaliaId]);
}
