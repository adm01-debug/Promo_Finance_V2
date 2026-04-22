import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

/** Basic UUID v1-v5 shape check — guards against malformed deep-link params. */
function isValidId(value: string): boolean {
  if (!value || value.length > 64) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/**
 * Reads a search-param ID from the URL, scrolls the matching DOM node
 * (marked with `data-highlight-id="<id>"`) into view, applies a
 * temporary CSS class (`row-highlight-flash`) for visual highlight, and
 * removes the param from the URL so reloads/back navigation don't replay it.
 *
 * Used by deep-links from the anomalia drill-down (highlight=<id>, txId=<id>).
 *
 * @param paramName  URL search param to read (e.g. "highlight", "txId").
 * @param ready      When false, the hook waits — useful while list data is loading.
 * @param durationMs How long the highlight class stays applied. Default 3000ms.
 */
export function useHighlightFromUrl(
  paramName: string,
  ready = true,
  durationMs = 3000,
) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!ready) return;
    const id = searchParams.get(paramName);
    if (!id) return;

    const cleanParam = () => {
      const next = new URLSearchParams(searchParams);
      next.delete(paramName);
      setSearchParams(next, { replace: true });
    };

    // Param malformado → não tenta procurar, limpa a URL e avisa.
    if (!isValidId(id)) {
      toast.error("Link inválido", {
        description: "O identificador na URL não está em um formato válido.",
      });
      cleanParam();
      return;
    }

    let attempts = 0;
    let timeoutId: number | undefined;
    let removeTimeoutId: number | undefined;

    const tryHighlight = () => {
      const el = document.querySelector<HTMLElement>(
        `[data-highlight-id="${CSS.escape(id)}"]`,
      );
      if (!el) {
        attempts += 1;
        if (attempts < 12) {
          timeoutId = window.setTimeout(tryHighlight, 250);
        } else {
          // Esgotou retries: o item não está nesta lista (filtro ativo, paginação,
          // permissão, ou registro removido). Avisa e limpa o param.
          toast.warning("Item não encontrado", {
            description:
              "O registro vinculado não está visível aqui. Verifique filtros ativos ou se ele ainda existe.",
          });
          cleanParam();
        }
        return;
      }

      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("row-highlight-flash");

      removeTimeoutId = window.setTimeout(() => {
        el.classList.remove("row-highlight-flash");
      }, durationMs);

      cleanParam();
    };

    // Aguarda um tick para o React montar a lista filtrada
    timeoutId = window.setTimeout(tryHighlight, 80);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (removeTimeoutId) window.clearTimeout(removeTimeoutId);
    };
  }, [paramName, ready, durationMs, searchParams, setSearchParams]);
}
