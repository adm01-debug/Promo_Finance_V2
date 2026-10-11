import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Estado de aba sincronizado com a URL (`?tab=x`): browser-back restaura a
 * aba anterior, links são compartilháveis (deep-link de aba) e a aba ativa
 * sobrevive a ida-e-volta entre telas.
 */
export function useUrlTab(defaultTab: string, param = 'tab') {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get(param) ?? defaultTab;

  const setTab = useCallback(
    (next: string) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === defaultTab) {
            params.delete(param);
          } else {
            params.set(param, next);
          }
          return params;
        },
        { replace: false }
      );
    },
    [setSearchParams, defaultTab, param]
  );

  return [tab, setTab] as const;
}
