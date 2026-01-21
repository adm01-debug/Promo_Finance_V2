import { useEffect, useCallback, useRef } from 'react';

type KeyModifiers = {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
};

type KeyCombo = string | (KeyModifiers & { key: string });

interface UseKeyboardShortcutOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  target?: HTMLElement | null;
  eventType?: 'keydown' | 'keyup';
}

/**
 * Hook para registrar atalhos de teclado
 * @param keyCombo - Combinação de teclas (ex: 'ctrl+s', 'escape', { key: 's', ctrl: true })
 * @param callback - Função a ser executada
 * @param options - Opções de configuração
 */
export function useKeyboardShortcut(
  keyCombo: KeyCombo,
  callback: (event: KeyboardEvent) => void,
  options: UseKeyboardShortcutOptions = {}
) {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    target = null,
    eventType = 'keydown',
  } = options;

  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Parse key combo
  const parseKeyCombo = useCallback((combo: KeyCombo): KeyModifiers & { key: string } => {
    if (typeof combo === 'object') {
      return combo;
    }

    const parts = combo.toLowerCase().split('+');
    const key = parts.pop() || '';
    
    return {
      key,
      ctrl: parts.includes('ctrl') || parts.includes('control'),
      alt: parts.includes('alt'),
      shift: parts.includes('shift'),
      meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command'),
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const parsedCombo = parseKeyCombo(keyCombo);

    const handleKeyEvent = (event: KeyboardEvent) => {
      // Ignorar se o foco está em um input/textarea (opcional)
      const targetElement = event.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetElement.tagName);
      const isContentEditable = targetElement.isContentEditable;
      
      // Para algumas teclas, ainda permitir (escape, etc)
      const alwaysAllowKeys = ['escape', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12'];
      const shouldSkipInput = isInput || isContentEditable;
      
      if (shouldSkipInput && !alwaysAllowKeys.includes(parsedCombo.key.toLowerCase())) {
        // Se tem modificador, permitir
        if (!parsedCombo.ctrl && !parsedCombo.alt && !parsedCombo.meta) {
          return;
        }
      }

      // Verificar se a combinação corresponde
      const keyMatches = event.key.toLowerCase() === parsedCombo.key.toLowerCase() ||
                        event.code.toLowerCase() === parsedCombo.key.toLowerCase();
      
      const ctrlMatches = !parsedCombo.ctrl || event.ctrlKey;
      const altMatches = !parsedCombo.alt || event.altKey;
      const shiftMatches = !parsedCombo.shift || event.shiftKey;
      const metaMatches = !parsedCombo.meta || event.metaKey;

      // Verificar se não há modificadores extras
      const noExtraCtrl = parsedCombo.ctrl === event.ctrlKey;
      const noExtraAlt = parsedCombo.alt === event.altKey;
      const noExtraMeta = parsedCombo.meta === event.metaKey;

      if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches &&
          noExtraCtrl && noExtraAlt && noExtraMeta) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }
        callbackRef.current(event);
      }
    };

    const targetElement = target || document;
    targetElement.addEventListener(eventType, handleKeyEvent as EventListener);

    return () => {
      targetElement.removeEventListener(eventType, handleKeyEvent as EventListener);
    };
  }, [enabled, keyCombo, parseKeyCombo, preventDefault, stopPropagation, target, eventType]);
}

/**
 * Hook para múltiplos atalhos
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, (event: KeyboardEvent) => void>,
  options: UseKeyboardShortcutOptions = {}
) {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    target = null,
    eventType = 'keydown',
  } = options;

  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    const parseKeyCombo = (combo: string): KeyModifiers & { key: string } => {
      const parts = combo.toLowerCase().split('+');
      const key = parts.pop() || '';
      
      return {
        key,
        ctrl: parts.includes('ctrl') || parts.includes('control'),
        alt: parts.includes('alt'),
        shift: parts.includes('shift'),
        meta: parts.includes('meta') || parts.includes('cmd'),
      };
    };

    const handleKeyEvent = (event: KeyboardEvent) => {
      const entries = Object.entries(shortcutsRef.current);
      
      for (const [combo, callback] of entries) {
        const parsed = parseKeyCombo(combo);
        
        const keyMatches = event.key.toLowerCase() === parsed.key.toLowerCase() ||
                          event.code.toLowerCase() === parsed.key.toLowerCase();
        
        if (keyMatches &&
            parsed.ctrl === event.ctrlKey &&
            parsed.alt === event.altKey &&
            parsed.shift === event.shiftKey &&
            parsed.meta === event.metaKey) {
          if (preventDefault) {
            event.preventDefault();
          }
          if (stopPropagation) {
            event.stopPropagation();
          }
          callback(event);
          return;
        }
      }
    };

    const targetElement = target || document;
    targetElement.addEventListener(eventType, handleKeyEvent as EventListener);

    return () => {
      targetElement.removeEventListener(eventType, handleKeyEvent as EventListener);
    };
  }, [enabled, preventDefault, stopPropagation, target, eventType]);
}

/**
 * Hook para Escape key
 */
export function useEscapeKey(
  callback: () => void,
  enabled: boolean = true
) {
  useKeyboardShortcut('Escape', callback, { enabled, preventDefault: false });
}

/**
 * Hook para Enter key
 */
export function useEnterKey(
  callback: (event: KeyboardEvent) => void,
  enabled: boolean = true
) {
  useKeyboardShortcut('Enter', callback, { enabled, preventDefault: false });
}

/**
 * Hook comum: Ctrl+S para salvar
 */
export function useSaveShortcut(
  callback: () => void,
  enabled: boolean = true
) {
  useKeyboardShortcut('ctrl+s', callback, { enabled });
}

/**
 * Hook para detectar qualquer tecla
 */
export function useAnyKey(
  callback: (event: KeyboardEvent) => void,
  options: Omit<UseKeyboardShortcutOptions, 'preventDefault'> = {}
) {
  const { enabled = true, target = null, eventType = 'keydown' } = options;
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyEvent = (event: KeyboardEvent) => {
      callbackRef.current(event);
    };

    const targetElement = target || document;
    targetElement.addEventListener(eventType, handleKeyEvent as EventListener);

    return () => {
      targetElement.removeEventListener(eventType, handleKeyEvent as EventListener);
    };
  }, [enabled, target, eventType]);
}
