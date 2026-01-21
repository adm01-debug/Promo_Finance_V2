import { useEffect, useRef, RefObject } from 'react';

type EventMap = WindowEventMap & DocumentEventMap & HTMLElementEventMap;

/**
 * Hook para adicionar event listeners de forma segura
 * @param eventName - Nome do evento
 * @param handler - Função handler
 * @param element - Elemento alvo (window por padrão)
 * @param options - Opções do addEventListener
 */
export function useEventListener<K extends keyof EventMap>(
  eventName: K,
  handler: (event: EventMap[K]) => void,
  element?: RefObject<HTMLElement> | Window | Document | null,
  options?: boolean | AddEventListenerOptions
): void {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element
      ? 'current' in element
        ? element.current
        : element
      : window;

    if (!targetElement?.addEventListener) return;

    const eventListener = (event: Event) => {
      savedHandler.current(event as EventMap[K]);
    };

    targetElement.addEventListener(eventName, eventListener, options);

    return () => {
      targetElement.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
}

/**
 * Hook para listener de teclas específicas
 */
export function useKeyPress(
  targetKey: string,
  handler: (event: KeyboardEvent) => void,
  options: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    preventDefault?: boolean;
  } = {}
): void {
  useEventListener('keydown', (event) => {
    const { ctrlKey, shiftKey, altKey, metaKey, preventDefault } = options;

    const keyMatch = event.key.toLowerCase() === targetKey.toLowerCase();
    const ctrlMatch = ctrlKey === undefined || event.ctrlKey === ctrlKey;
    const shiftMatch = shiftKey === undefined || event.shiftKey === shiftKey;
    const altMatch = altKey === undefined || event.altKey === altKey;
    const metaMatch = metaKey === undefined || event.metaKey === metaKey;

    if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
      if (preventDefault) {
        event.preventDefault();
      }
      handler(event);
    }
  });
}

/**
 * Hook para listener de scroll
 */
export function useScrollListener(
  handler: (event: Event) => void,
  element?: RefObject<HTMLElement> | Window | null,
  throttleMs?: number
): void {
  const throttledHandler = useRef(handler);
  const lastCall = useRef(0);

  useEffect(() => {
    if (throttleMs) {
      throttledHandler.current = (event: Event) => {
        const now = Date.now();
        if (now - lastCall.current >= throttleMs) {
          lastCall.current = now;
          handler(event);
        }
      };
    } else {
      throttledHandler.current = handler;
    }
  }, [handler, throttleMs]);

  useEventListener('scroll', throttledHandler.current, element);
}

/**
 * Hook para listener de resize
 */
export function useResizeListener(
  handler: (event: UIEvent) => void,
  debounceMs?: number
): void {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEventListener('resize', (event) => {
    if (debounceMs) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => handler(event), debounceMs);
    } else {
      handler(event);
    }
  });
}

export default useEventListener;
