import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Estado de aba sincronizado com a URL (`?tab=x`): browser-back restaura a
 * aba anterior, links são compartilháveis (deep-link de aba) e a aba ativa
 * sobrevive a ida-e-volta entre telas. Valores fora de `validTabs` (link
 * antigo, digitado errado ou aba sem permissão) caem em `defaultTab`.
 */
export function useUrlTab(defaultTab: string, validTabs: readonly string[], param = 'tab') {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromUrl = searchParams.get(param);
  const tab = fromUrl !== null && validTabs.includes(fromUrl) ? fromUrl : defaultTab;

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
