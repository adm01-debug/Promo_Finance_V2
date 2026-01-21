import { useEffect, useRef, RefObject } from 'react';

type Handler = (event: MouseEvent | TouchEvent) => void;

/**
 * Hook para detectar cliques fora de um elemento
 * @param handler - Callback executado ao clicar fora
 * @param enabled - Se o hook está ativo
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: Handler,
  enabled: boolean = true
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      
      // Não fazer nada se clicar dentro do elemento ou se o elemento não existir
      if (!el || el.contains(event.target as Node)) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler, enabled]);

  return ref;
}

/**
 * Hook para detectar cliques fora de múltiplos elementos
 */
export function useClickOutsideMultiple<T extends HTMLElement = HTMLElement>(
  refs: RefObject<T>[],
  handler: Handler,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      // Verificar se o clique foi dentro de algum dos elementos
      const isInside = refs.some((ref) => {
        const el = ref.current;
        return el && el.contains(event.target as Node);
      });

      if (!isInside) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [refs, handler, enabled]);
}

/**
 * Hook para fechar com Escape + clique fora
 */
export function useCloseOnEscapeOrClickOutside<T extends HTMLElement = HTMLElement>(
  onClose: () => void,
  enabled: boolean = true
): RefObject<T> {
  const ref = useClickOutside<T>(onClose, enabled);

  useEffect(() => {
    if (!enabled) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, enabled]);

  return ref;
}
