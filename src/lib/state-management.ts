/**
 * State Management Utilities
 * Gerenciamento avançado de estado para aplicações React
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============= Types =============

interface StoreState<T> {
  state: T;
  listeners: Set<(state: T) => void>;
  subscribe: (listener: (state: T) => void) => () => void;
  getState: () => T;
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
}

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

// ============= Store Factory =============

/**
 * Cria uma store simples e reativa
 */
export function createStore<T extends object>(initialState: T): StoreState<T> {
  let state = initialState;
  const listeners = new Set<(state: T) => void>();

  return {
    state,
    listeners,
    getState: () => state,
    setState: (partial) => {
      const nextState = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...nextState };
      listeners.forEach((listener) => listener(state));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// ============= Hooks =============

/**
 * Hook para usar uma store
 */
export function useStore<T extends object, S>(
  store: StoreState<T>,
  selector: (state: T) => S = (state) => state as unknown as S
): S {
  const [selectedState, setSelectedState] = useState(() => selector(store.getState()));
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  useEffect(() => {
    const unsubscribe = store.subscribe((state) => {
      const newSelected = selectorRef.current(state);
      setSelectedState(newSelected);
    });
    return unsubscribe;
  }, [store]);

  return selectedState;
}

/**
 * Hook para estado assíncrono
 */
export function useAsyncState<T>(
  asyncFn: () => Promise<T>,
  deps: unknown[] = []
): AsyncState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await asyncFn();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, refetch: execute };
}

/**
 * Hook para undo/redo
 */
export function useHistory<T>(initialState: T): {
  state: T;
  setState: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: () => void;
} {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const setState = useCallback((newState: T) => {
    setHistory((prev) => ({
      past: [...prev.past, prev.present],
      present: newState,
      future: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const newPast = [...prev.past];
      const newPresent = newPast.pop()!;
      return {
        past: newPast,
        present: newPresent,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const newFuture = [...prev.future];
      const newPresent = newFuture.shift()!;
      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setHistory({
      past: [],
      present: initialState,
      future: [],
    });
  }, [initialState]);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    reset,
  };
}

/**
 * Hook para estado persistido no localStorage
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const nextValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(nextValue));
        } catch (e) {
          console.warn('Failed to persist state:', e);
        }
        return nextValue;
      });
    },
    [key]
  );

  const clear = useCallback(() => {
    localStorage.removeItem(key);
    setState(initialValue);
  }, [key, initialValue]);

  return [state, setValue, clear];
}

/**
 * Hook para estado com validação
 */
export function useValidatedState<T>(
  initialValue: T,
  validator: (value: T) => boolean | string
): {
  value: T;
  setValue: (value: T) => void;
  error: string | null;
  isValid: boolean;
  reset: () => void;
} {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const setValidatedValue = useCallback(
    (newValue: T) => {
      const result = validator(newValue);
      if (result === true) {
        setValue(newValue);
        setError(null);
      } else if (typeof result === 'string') {
        setValue(newValue);
        setError(result);
      } else {
        setValue(newValue);
        setError('Valor inválido');
      }
    },
    [validator]
  );

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
  }, [initialValue]);

  return {
    value,
    setValue: setValidatedValue,
    error,
    isValid: error === null,
    reset,
  };
}

/**
 * Hook para estado com debounce
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T) => void] {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const setValueWithDebounce = useCallback(
    (newValue: T) => {
      setValue(newValue);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(newValue);
      }, delay);
    },
    [delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return [value, debouncedValue, setValueWithDebounce];
}

/**
 * Hook para estado com throttle
 */
export function useThrottledState<T>(
  initialValue: T,
  limit: number = 300
): [T, (value: T) => void] {
  const [value, setValue] = useState(initialValue);
  const lastRun = useRef(Date.now());
  const pendingValue = useRef<T | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const setThrottledValue = useCallback(
    (newValue: T) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= limit) {
        setValue(newValue);
        lastRun.current = now;
      } else {
        pendingValue.current = newValue;
        if (!timeoutRef.current) {
          timeoutRef.current = setTimeout(() => {
            if (pendingValue.current !== null) {
              setValue(pendingValue.current);
              lastRun.current = Date.now();
              pendingValue.current = null;
            }
            timeoutRef.current = undefined;
          }, limit - timeSinceLastRun);
        }
      }
    },
    [limit]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return [value, setThrottledValue];
}

/**
 * Hook para estado de lista com operações CRUD
 */
export function useListState<T extends { id: string | number }>(
  initialItems: T[] = []
): {
  items: T[];
  add: (item: T) => void;
  update: (id: T['id'], updates: Partial<T>) => void;
  remove: (id: T['id']) => void;
  move: (fromIndex: number, toIndex: number) => void;
  clear: () => void;
  find: (id: T['id']) => T | undefined;
  filter: (predicate: (item: T) => boolean) => T[];
} {
  const [items, setItems] = useState<T[]>(initialItems);

  const add = useCallback((item: T) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const update = useCallback((id: T['id'], updates: Partial<T>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const remove = useCallback((id: T['id']) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const move = useCallback((fromIndex: number, toIndex: number) => {
    setItems((prev) => {
      const newItems = [...prev];
      const [removed] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, removed);
      return newItems;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const find = useCallback(
    (id: T['id']) => items.find((item) => item.id === id),
    [items]
  );

  const filter = useCallback(
    (predicate: (item: T) => boolean) => items.filter(predicate),
    [items]
  );

  return { items, add, update, remove, move, clear, find, filter };
}

/**
 * Hook para estado de seleção
 */
export function useSelectionState<T extends string | number>(
  initialSelected: T[] = [],
  options?: { multiple?: boolean; required?: boolean }
): {
  selected: T[];
  isSelected: (id: T) => boolean;
  select: (id: T) => void;
  deselect: (id: T) => void;
  toggle: (id: T) => void;
  selectAll: (ids: T[]) => void;
  deselectAll: () => void;
} {
  const [selected, setSelected] = useState<T[]>(initialSelected);
  const { multiple = true, required = false } = options || {};

  const isSelected = useCallback((id: T) => selected.includes(id), [selected]);

  const select = useCallback(
    (id: T) => {
      setSelected((prev) => {
        if (multiple) {
          return prev.includes(id) ? prev : [...prev, id];
        }
        return [id];
      });
    },
    [multiple]
  );

  const deselect = useCallback(
    (id: T) => {
      setSelected((prev) => {
        if (required && prev.length === 1 && prev.includes(id)) {
          return prev;
        }
        return prev.filter((item) => item !== id);
      });
    },
    [required]
  );

  const toggle = useCallback(
    (id: T) => {
      if (isSelected(id)) {
        deselect(id);
      } else {
        select(id);
      }
    },
    [isSelected, select, deselect]
  );

  const selectAll = useCallback((ids: T[]) => {
    setSelected(ids);
  }, []);

  const deselectAll = useCallback(() => {
    if (!required) {
      setSelected([]);
    }
  }, [required]);

  return { selected, isSelected, select, deselect, toggle, selectAll, deselectAll };
}

/**
 * Hook para estado de formulário simples
 */
export function useFormState<T extends Record<string, unknown>>(
  initialValues: T
): {
  values: T;
  setValue: <K extends keyof T>(key: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  reset: () => void;
  isDirty: boolean;
  getChangedFields: () => Partial<T>;
} {
  const [values, setValuesState] = useState<T>(initialValues);
  const initialRef = useRef(initialValues);

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValuesState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...newValues }));
  }, []);

  const reset = useCallback(() => {
    setValuesState(initialRef.current);
  }, []);

  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialRef.current);
  }, [values]);

  const getChangedFields = useCallback((): Partial<T> => {
    const changes: Partial<T> = {};
    for (const key of Object.keys(values) as (keyof T)[]) {
      if (values[key] !== initialRef.current[key]) {
        changes[key] = values[key];
      }
    }
    return changes;
  }, [values]);

  return { values, setValue, setValues, reset, isDirty, getChangedFields };
}

/**
 * Hook para estado de paginação
 */
export function usePaginationState(
  initialPage: number = 1,
  initialPageSize: number = 10,
  totalItems: number = 0
): {
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  canNextPage: boolean;
  canPrevPage: boolean;
  startIndex: number;
  endIndex: number;
} {
  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const canNextPage = page < totalPages;
  const canPrevPage = page > 1;
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const setPage = useCallback(
    (newPage: number) => {
      const clampedPage = Math.max(1, Math.min(newPage, totalPages));
      setPageState(clampedPage);
    },
    [totalPages]
  );

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPageState(1);
  }, []);

  const nextPage = useCallback(() => {
    if (canNextPage) setPage(page + 1);
  }, [canNextPage, page, setPage]);

  const prevPage = useCallback(() => {
    if (canPrevPage) setPage(page - 1);
  }, [canPrevPage, page, setPage]);

  const firstPage = useCallback(() => setPage(1), [setPage]);
  const lastPage = useCallback(() => setPage(totalPages), [setPage, totalPages]);

  return {
    page,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    canNextPage,
    canPrevPage,
    startIndex,
    endIndex,
  };
}

// ============= Context Factory =============

/**
 * Factory para criar contextos tipados
 */
export function createContextFactory<T>(displayName: string) {
  const Context = {
    displayName,
    defaultValue: undefined as T | undefined,
  };

  return {
    Provider: ({ value, children }: { value: T; children: React.ReactNode }) => {
      Context.defaultValue = value;
      return children;
    },
    useContext: () => {
      if (Context.defaultValue === undefined) {
        throw new Error(`${displayName} must be used within a Provider`);
      }
      return Context.defaultValue;
    },
  };
}

// ============= Middleware =============

type Middleware<T> = (
  set: (partial: Partial<T>) => void,
  get: () => T
) => (partial: Partial<T>) => void;

/**
 * Logger middleware
 */
export function loggerMiddleware<T>(): Middleware<T> {
  return (set, get) => (partial) => {
    console.group('State Update');
    console.log('Previous:', get());
    console.log('Partial:', partial);
    set(partial);
    console.log('Next:', get());
    console.groupEnd();
  };
}

/**
 * Persist middleware
 */
export function persistMiddleware<T>(key: string): Middleware<T> {
  return (set) => (partial) => {
    set(partial);
    try {
      const state = { ...partial };
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to persist state:', e);
    }
  };
}

export default {
  createStore,
  useStore,
  useAsyncState,
  useHistory,
  usePersistedState,
  useValidatedState,
  useDebouncedState,
  useThrottledState,
  useListState,
  useSelectionState,
  useFormState,
  usePaginationState,
  createContextFactory,
  loggerMiddleware,
  persistMiddleware,
};
