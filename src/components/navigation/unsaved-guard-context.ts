import { createContext, useContext, useEffect } from 'react';

export interface UnsavedGuardContextValue {
  /** Marca a tela atual como com alterações não salvas. */
  setDirty: (dirty: boolean) => void;
}

export const UnsavedGuardContext = createContext<UnsavedGuardContextValue>({
  setDirty: () => {},
});

/**
 * Marca a página como tendo alterações não salvas. Enquanto `dirty`:
 * - cliques em links internos (`<a href="/...">`) pedem confirmação;
 * - Voltar do browser/swipe pede confirmação (sentinela de histórico);
 * - fechar/recarregar a aba mostra o aviso nativo (beforeunload).
 */
export function useUnsavedChangesGuard(dirty: boolean): void {
  const { setDirty } = useContext(UnsavedGuardContext);
  useEffect(() => {
    setDirty(dirty);
    return () => setDirty(false);
  }, [dirty, setDirty]);
}
