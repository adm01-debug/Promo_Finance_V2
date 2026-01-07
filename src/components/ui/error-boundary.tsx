import * as React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================================
// ERROR BOUNDARY CLASS COMPONENT
// ============================================================================

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundaryClass extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// ERROR FALLBACK UI
// ============================================================================

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo?: React.ErrorInfo | null;
  onReset?: () => void;
  showDetails?: boolean;
  variant?: "full" | "inline" | "minimal";
}

const ErrorFallback = ({
  error,
  errorInfo,
  onReset,
  showDetails = false,
  variant = "full",
}: ErrorFallbackProps) => {
  const [showStack, setShowStack] = React.useState(false);

  if (variant === "minimal") {
    return (
      <div className="flex items-center gap-2 p-2 text-sm text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <span>Algo deu errado</span>
        {onReset && (
          <button onClick={onReset} className="underline hover:no-underline">
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-destructive/50 bg-destructive/10 p-4"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="font-medium text-destructive">Ocorreu um erro</p>
            <p className="text-sm text-muted-foreground">
              {error?.message || "Erro desconhecido"}
            </p>
            {onReset && (
              <Button variant="outline" size="sm" onClick={onReset}>
                <RefreshCw className="h-3 w-3 mr-2" />
                Tentar novamente
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.1 }}
        className="mb-6 rounded-full bg-destructive/10 p-4"
      >
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-2 text-2xl font-bold"
      >
        Oops! Algo deu errado
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6 max-w-md text-muted-foreground"
      >
        {error?.message || "Ocorreu um erro inesperado. Por favor, tente novamente."}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex gap-3"
      >
        {onReset && (
          <Button onClick={onReset} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        )}
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          <Home className="h-4 w-4 mr-2" />
          Voltar ao início
        </Button>
      </motion.div>

      {showDetails && error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 w-full max-w-2xl"
        >
          <button
            onClick={() => setShowStack(!showStack)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Bug className="h-4 w-4" />
            {showStack ? "Ocultar detalhes" : "Mostrar detalhes técnicos"}
          </button>

          {showStack && (
            <motion.pre
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-4 overflow-auto rounded-lg bg-muted p-4 text-left text-xs"
            >
              <code>
                {error.stack}
                {errorInfo?.componentStack && (
                  <>
                    {"\n\nComponent Stack:"}
                    {errorInfo.componentStack}
                  </>
                )}
              </code>
            </motion.pre>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

// ============================================================================
// ASYNC ERROR BOUNDARY - Para erros async
// ============================================================================

interface AsyncBoundaryProps {
  children: React.ReactNode;
  loading?: React.ReactNode;
  error?: React.ReactNode;
  onError?: (error: Error) => void;
}

const AsyncBoundary = ({ children, loading, error, onError }: AsyncBoundaryProps) => {
  return (
    <ErrorBoundaryClass fallback={error} onError={onError}>
      <React.Suspense fallback={loading || <DefaultLoadingFallback />}>
        {children}
      </React.Suspense>
    </ErrorBoundaryClass>
  );
};

// ============================================================================
// DEFAULT LOADING FALLBACK
// ============================================================================

const DefaultLoadingFallback = () => (
  <div className="flex min-h-[200px] items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
    />
  </div>
);

// ============================================================================
// QUERY ERROR BOUNDARY - Para React Query
// ============================================================================

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

const QueryErrorBoundary = ({ children, onRetry }: QueryErrorBoundaryProps) => {
  return (
    <ErrorBoundaryClass
      fallback={
        <ErrorFallback
          error={new Error("Erro ao carregar dados")}
          onReset={onRetry}
          variant="inline"
        />
      }
    >
      {children}
    </ErrorBoundaryClass>
  );
};

export {
  ErrorBoundaryClass as ErrorBoundary,
  ErrorFallback,
  AsyncBoundary,
  QueryErrorBoundary,
  DefaultLoadingFallback,
};
