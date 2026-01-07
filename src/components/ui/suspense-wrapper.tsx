import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorBoundary, ErrorFallback } from "./error-boundary";

// ============================================================================
// SUSPENSE WRAPPER - Wrapper com loading e error states
// ============================================================================

interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  minHeight?: string | number;
}

const SuspenseWrapper = ({
  children,
  fallback,
  errorFallback,
  onError,
  minHeight = 200,
}: SuspenseWrapperProps) => {
  const defaultFallback = (
    <div
      className="flex items-center justify-center"
      style={{ minHeight }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-3"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </motion.div>
    </div>
  );

  return (
    <ErrorBoundary
      fallback={errorFallback}
      onError={onError}
    >
      <React.Suspense fallback={fallback || defaultFallback}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
};

// ============================================================================
// LAZY COMPONENT WRAPPER
// ============================================================================

interface LazyComponentProps {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  props?: Record<string, any>;
  fallback?: React.ReactNode;
}

const LazyComponent = ({ component: Component, props = {}, fallback }: LazyComponentProps) => {
  return (
    <SuspenseWrapper fallback={fallback}>
      <Component {...props} />
    </SuspenseWrapper>
  );
};

// ============================================================================
// DEFERRED CONTENT - Adia renderização de conteúdo pesado
// ============================================================================

interface DeferredContentProps {
  children: React.ReactNode;
  delay?: number;
  fallback?: React.ReactNode;
}

const DeferredContent = ({ children, delay = 0, fallback }: DeferredContentProps) => {
  const [isReady, setIsReady] = React.useState(delay === 0);

  React.useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setIsReady(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  if (!isReady) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ============================================================================
// PROGRESSIVE LOADER - Carrega conteúdo progressivamente
// ============================================================================

interface ProgressiveLoaderProps {
  items: React.ReactNode[];
  batchSize?: number;
  delay?: number;
  className?: string;
}

const ProgressiveLoader = ({
  items,
  batchSize = 10,
  delay = 100,
  className,
}: ProgressiveLoaderProps) => {
  const [loadedCount, setLoadedCount] = React.useState(batchSize);

  React.useEffect(() => {
    if (loadedCount < items.length) {
      const timer = setTimeout(() => {
        setLoadedCount((prev) => Math.min(prev + batchSize, items.length));
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [loadedCount, items.length, batchSize, delay]);

  return (
    <div className={className}>
      <AnimatePresence>
        {items.slice(0, loadedCount).map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index % batchSize) * 0.05 }}
          >
            {item}
          </motion.div>
        ))}
      </AnimatePresence>
      {loadedCount < items.length && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SKELETON TRANSITION - Transição suave de skeleton para conteúdo
// ============================================================================

interface SkeletonTransitionProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}

const SkeletonTransition = ({
  isLoading,
  skeleton,
  children,
}: SkeletonTransitionProps) => {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// RETRY WRAPPER - Componente com retry automático
// ============================================================================

interface RetryWrapperProps {
  children: React.ReactNode;
  maxRetries?: number;
  retryDelay?: number;
  onMaxRetriesReached?: () => void;
}

const RetryWrapper = ({
  children,
  maxRetries = 3,
  retryDelay = 1000,
  onMaxRetriesReached,
}: RetryWrapperProps) => {
  const [retryCount, setRetryCount] = React.useState(0);
  const [key, setKey] = React.useState(0);

  const handleError = React.useCallback(
    (error: Error) => {
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          setKey((prev) => prev + 1);
        }, retryDelay);
      } else {
        onMaxRetriesReached?.();
      }
    },
    [retryCount, maxRetries, retryDelay, onMaxRetriesReached],
  );

  return (
    <ErrorBoundary
      key={key}
      onError={handleError}
      fallback={
        retryCount < maxRetries ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Tentando novamente... ({retryCount + 1}/{maxRetries})
              </p>
            </div>
          </div>
        ) : (
          <ErrorFallback
            error={new Error("Máximo de tentativas atingido")}
            onReset={() => {
              setRetryCount(0);
              setKey((prev) => prev + 1);
            }}
            variant="inline"
          />
        )
      }
    >
      {children}
    </ErrorBoundary>
  );
};

export {
  SuspenseWrapper,
  LazyComponent,
  DeferredContent,
  ProgressiveLoader,
  SkeletonTransition,
  RetryWrapper,
};
