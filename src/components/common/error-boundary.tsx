import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Error types
interface AppError {
  message: string;
  code?: string;
  stack?: string;
  componentStack?: string;
  timestamp: Date;
}

// Error boundary state
interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorId: string | null;
}

// Error boundary props
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: AppError, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

// Generate unique error ID
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Default error fallback component
interface DefaultFallbackProps {
  error: AppError;
  errorId: string | null;
  onReset: () => void;
  onGoHome: () => void;
  showDetails: boolean;
}

function DefaultFallback({ error, errorId, onReset, onGoHome, showDetails }: DefaultFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Ops! Algo deu errado
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
        </p>
        
        {errorId && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-4 font-mono">
            ID do erro: {errorId}
          </p>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onReset}><RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
          <Button variant="outline" onClick={onGoHome}><Home className="h-4 w-4 mr-2" />
            Voltar ao início
          </Button>
        </div>
        
        {showDetails && error && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Detalhes técnicos
            </summary>
            <div className="mt-3 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto max-h-48">
              <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                {error.message}
              </p>
              {error.code && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Código: {error.code}
                </p>
              )}
              {error.stack && (
                <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

// Error Boundary Class Component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date(),
      },
      errorId: generateErrorId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with component stack
    this.setState((prev) => ({
      error: prev.error
        ? { ...prev.error, componentStack: errorInfo.componentStack || undefined }
        : null,
    }));

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Here you could send to error tracking service (e.g., Sentry)
    // reportError(error, errorInfo, this.state.errorId);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    const { hasError, error, errorId } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError && error) {
      // Custom fallback
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, this.handleReset);
        }
        return fallback;
      }

      // Default fallback
      return (
        <DefaultFallback
          error={error}
          errorId={errorId}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
          showDetails={showDetails}
        />
      );
    }

    return children;
  }
}

// Hook to throw errors (for testing)
export function useErrorHandler() {
  return (error: Error) => {
    throw error;
  };
}

// Higher-order component version
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const displayName = Component.displayName || Component.name || 'Component';

  const WithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}

// Async error boundary wrapper
interface AsyncBoundaryProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode | ((error: AppError, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export function AsyncBoundary({ 
  children, 
  errorFallback,
  onError 
}: AsyncBoundaryProps) {
  return (
    <ErrorBoundary fallback={errorFallback} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
