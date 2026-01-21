import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

// ============================================================================
// Types
// ============================================================================

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface LoadingContextValue {
  // Global loading state
  globalLoading: LoadingState;
  setGlobalLoading: (loading: boolean, message?: string) => void;
  setGlobalProgress: (progress: number) => void;

  // Named loading states (for specific operations)
  loadingStates: Record<string, LoadingState>;
  startLoading: (key: string, message?: string) => void;
  stopLoading: (key: string) => void;
  setProgress: (key: string, progress: number) => void;
  isLoading: (key: string) => boolean;
  
  // Check if any loading is active
  isAnyLoading: boolean;
  
  // Utility for async operations
  withLoading: <T>(key: string, fn: () => Promise<T>, message?: string) => Promise<T>;
}

// ============================================================================
// Context
// ============================================================================

const LoadingContext = createContext<LoadingContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [globalLoading, setGlobalLoadingState] = useState<LoadingState>({
    isLoading: false,
  });
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({});

  // Global loading
  const setGlobalLoading = useCallback((loading: boolean, message?: string) => {
    setGlobalLoadingState({
      isLoading: loading,
      message: loading ? message : undefined,
      progress: loading ? undefined : undefined,
    });
  }, []);

  const setGlobalProgress = useCallback((progress: number) => {
    setGlobalLoadingState((prev) => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
    }));
  }, []);

  // Named loading states
  const startLoading = useCallback((key: string, message?: string) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: {
        isLoading: true,
        message,
        progress: undefined,
      },
    }));
  }, []);

  const stopLoading = useCallback((key: string) => {
    setLoadingStates((prev) => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const setProgress = useCallback((key: string, progress: number) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        progress: Math.min(100, Math.max(0, progress)),
      },
    }));
  }, []);

  const isLoading = useCallback(
    (key: string) => {
      return loadingStates[key]?.isLoading ?? false;
    },
    [loadingStates]
  );

  // Check if any loading is active
  const isAnyLoading = useMemo(() => {
    if (globalLoading.isLoading) return true;
    return Object.values(loadingStates).some((state) => state.isLoading);
  }, [globalLoading.isLoading, loadingStates]);

  // Utility for async operations
  const withLoading = useCallback(
    async <T,>(key: string, fn: () => Promise<T>, message?: string): Promise<T> => {
      try {
        startLoading(key, message);
        const result = await fn();
        return result;
      } finally {
        stopLoading(key);
      }
    },
    [startLoading, stopLoading]
  );

  const value: LoadingContextValue = {
    globalLoading,
    setGlobalLoading,
    setGlobalProgress,
    loadingStates,
    startLoading,
    stopLoading,
    setProgress,
    isLoading,
    isAnyLoading,
    withLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useLoading(): LoadingContextValue {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

// ============================================================================
// Specialized hooks
// ============================================================================

/**
 * Hook for a specific loading state
 */
export function useLoadingState(key: string) {
  const { loadingStates, startLoading, stopLoading, setProgress, withLoading } =
    useLoading();

  const state = loadingStates[key] ?? { isLoading: false };

  return {
    isLoading: state.isLoading,
    message: state.message,
    progress: state.progress,
    start: (message?: string) => startLoading(key, message),
    stop: () => stopLoading(key),
    setProgress: (progress: number) => setProgress(key, progress),
    withLoading: <T,>(fn: () => Promise<T>, message?: string) =>
      withLoading(key, fn, message),
  };
}

/**
 * Hook for global loading state
 */
export function useGlobalLoading() {
  const { globalLoading, setGlobalLoading, setGlobalProgress } = useLoading();

  return {
    isLoading: globalLoading.isLoading,
    message: globalLoading.message,
    progress: globalLoading.progress,
    setLoading: setGlobalLoading,
    setProgress: setGlobalProgress,
    start: (message?: string) => setGlobalLoading(true, message),
    stop: () => setGlobalLoading(false),
  };
}

// ============================================================================
// Loading keys constants
// ============================================================================

export const LOADING_KEYS = {
  // Auth
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_REGISTER: 'auth:register',
  AUTH_RESET_PASSWORD: 'auth:reset-password',

  // Data fetching
  FETCH_CONTAS_PAGAR: 'fetch:contas-pagar',
  FETCH_CONTAS_RECEBER: 'fetch:contas-receber',
  FETCH_CLIENTES: 'fetch:clientes',
  FETCH_FORNECEDORES: 'fetch:fornecedores',
  FETCH_DASHBOARD: 'fetch:dashboard',
  FETCH_RELATORIOS: 'fetch:relatorios',

  // Mutations
  CREATE_CONTA_PAGAR: 'create:conta-pagar',
  UPDATE_CONTA_PAGAR: 'update:conta-pagar',
  DELETE_CONTA_PAGAR: 'delete:conta-pagar',
  CREATE_CONTA_RECEBER: 'create:conta-receber',
  UPDATE_CONTA_RECEBER: 'update:conta-receber',
  DELETE_CONTA_RECEBER: 'delete:conta-receber',

  // Export/Import
  EXPORT_DATA: 'export:data',
  IMPORT_DATA: 'import:data',

  // File operations
  UPLOAD_FILE: 'file:upload',
  DOWNLOAD_FILE: 'file:download',
} as const;

export type LoadingKey = typeof LOADING_KEYS[keyof typeof LOADING_KEYS];
