import { useCallback } from "react";
import { AnomaliaJaRevisadaError } from "@/hooks/useAnomaliasDetectadas";

/**
 * Classifica um erro como transitório (rede, timeout ou códigos PostgREST
 * 08xxx/53xxx/57P03 — connection/resource/shutdown). Não retenta erros
 * de validação (ex.: comentário curto) nem conflito de concorrência.
 */
function isTransient(err: unknown): boolean {
  if (err instanceof AnomaliaJaRevisadaError) return false;
  const msg = (err as { message?: string } | null)?.message?.toLowerCase() ?? "";
  const code = (err as { code?: string } | null)?.code ?? "";
  if (/network|failed to fetch|timeout|timed out|econnreset|fetch failed/.test(msg)) return true;
  if (/^08/.test(code) || /^53/.test(code) || code === "57P03") return true;
  return false;
}

/** Retry com backoff exponencial para erros transitórios (rede/PostgREST). */
export function useRetry() {
  const withRetry = useCallback(
    async <T,>(fn: () => Promise<T>, attempts = 3): Promise<T> => {
      let lastErr: unknown;
      for (let i = 0; i < attempts; i++) {
        try {
          return await fn();
        } catch (err) {
          lastErr = err;
          if (!isTransient(err) || i === attempts - 1) throw err;
          // Backoff exponencial: 300ms, 900ms
          await new Promise((r) => setTimeout(r, 300 * Math.pow(3, i)));
        }
      }
      throw lastErr;
    },
    [],
  );

  return { withRetry };
}
