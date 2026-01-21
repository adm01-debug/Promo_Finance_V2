import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar estados booleanos com toggle
 * @param initialValue - Valor inicial (default: false)
 */
export function useToggle(initialValue: boolean = false): [
  boolean,
  {
    toggle: () => void;
    setTrue: () => void;
    setFalse: () => void;
    set: (value: boolean) => void;
  }
] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((v) => !v);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  const set = useCallback((newValue: boolean) => {
    setValue(newValue);
  }, []);

  return [value, { toggle, setTrue, setFalse, set }];
}

/**
 * Hook para modal state
 */
export function useModal(initialOpen: boolean = false) {
  const [isOpen, { toggle, setTrue: open, setFalse: close }] = useToggle(initialOpen);
  
  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

/**
 * Hook para disclosure (similar ao Chakra UI)
 */
export function useDisclosure(initialOpen: boolean = false) {
  const [isOpen, setValue] = useState(initialOpen);

  const onOpen = useCallback(() => {
    setValue(true);
  }, []);

  const onClose = useCallback(() => {
    setValue(false);
  }, []);

  const onToggle = useCallback(() => {
    setValue((v) => !v);
  }, []);

  return {
    isOpen,
    onOpen,
    onClose,
    onToggle,
  };
}

/**
 * Hook para boolean com callbacks
 */
export function useBooleanCallbacks(
  initialValue: boolean = false,
  callbacks?: {
    onTrue?: () => void;
    onFalse?: () => void;
    onChange?: (value: boolean) => void;
  }
) {
  const [value, setValue] = useState(initialValue);

  const setTrue = useCallback(() => {
    setValue(true);
    callbacks?.onTrue?.();
    callbacks?.onChange?.(true);
  }, [callbacks]);

  const setFalse = useCallback(() => {
    setValue(false);
    callbacks?.onFalse?.();
    callbacks?.onChange?.(false);
  }, [callbacks]);

  const toggle = useCallback(() => {
    setValue((v) => {
      const newValue = !v;
      if (newValue) {
        callbacks?.onTrue?.();
      } else {
        callbacks?.onFalse?.();
      }
      callbacks?.onChange?.(newValue);
      return newValue;
    });
  }, [callbacks]);

  return {
    value,
    setTrue,
    setFalse,
    toggle,
    set: setValue,
  };
}
