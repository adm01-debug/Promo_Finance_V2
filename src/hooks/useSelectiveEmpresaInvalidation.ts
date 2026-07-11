import { useEffect } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

/**
 * Invalidação SELETIVA de React Query ao trocar de empresa.
 *
 * Estratégia:
 *  - Não usar `queryClient.clear()` (força refetch storm em toda a app).
 *  - Percorrer o cache e invalidar apenas queries cuja `queryKey` contenha
 *    marcadores de escopo por empresa: strings como "empresa", "empresa_id",
 *    ou o próprio UUID da empresa anterior/nova.
 *  - Views (`queryKeys.views.*`) já são parametrizadas por empresaId — o
 *    predicate detecta pela presença do UUID trocado na key.
 *
 * Aceite: trocar empresa não força reload total; Network Tab mostra apenas
 * as queries dependentes sendo refetchadas.
 */
export function useSelectiveEmpresaInvalidation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let lastEmpresaId: string | null = null;

    const shouldInvalidate = (key: QueryKey, prev: string | null, next: string | null) => {
      for (const part of key) {
        if (typeof part === 'string') {
          const lower = part.toLowerCase();
          if (lower.includes('empresa')) return true;
          if (prev && part === prev) return true;
          if (next && part === next) return true;
        }
        // Filtros passados como objetos costumam ter { empresa_id }
        if (part && typeof part === 'object' && !Array.isArray(part)) {
          const obj = part as Record<string, unknown>;
          if ('empresa_id' in obj || 'empresaId' in obj) return true;
        }
      }
      return false;
    };

    const handler = (event: Event) => {
      const next = (event as CustomEvent<string>).detail ?? null;
      const prev = lastEmpresaId;
      lastEmpresaId = next;

      queryClient.invalidateQueries({
        predicate: (query) => shouldInvalidate(query.queryKey, prev, next),
      });
    };

    window.addEventListener('current-empresa-changed', handler);
    return () => window.removeEventListener('current-empresa-changed', handler);
  }, [queryClient]);
}
