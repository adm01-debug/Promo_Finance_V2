import { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class QueryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('QueryErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
  title?: string;
  description?: string;
}

export function ErrorFallback({
  error,
  onReset,
  title = 'Ops! Algo deu errado',
  description = 'Ocorreu um erro inesperado. Por favor, tente novamente.',
}: ErrorFallbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-center min-h-[400px] p-6"
    >
      <Card className="max-w-md w-full border-destructive/20 bg-destructive/5">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="mx-auto mb-4 p-4 rounded-full bg-destructive/10"
          >
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </motion.div>
          <CardTitle className="text-destructive">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 rounded-lg bg-muted/50 border"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Bug className="h-4 w-4" />
                <span>Detalhes do erro:</span>
              </div>
              <code className="text-xs text-destructive break-all">
                {error.message}
              </code>
            </motion.div>
          )}
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = '/'}
            >
              <Home className="h-4 w-4 mr-2" />
              Início
            </Button>
            <Button
              className="flex-1"
              onClick={onReset}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Hook para usar com React Query
export function useQueryErrorHandler() {
  const queryClient = useQueryClient();

  const handleError = (error: Error) => {
    console.error('Query error:', error);
    // Pode adicionar toast notification aqui
  };

  const retryQueries = () => {
    queryClient.invalidateQueries();
  };

  return { handleError, retryQueries };
}

// Componente para erros de API inline
interface APIErrorProps {
  error: Error | null;
  onRetry?: () => void;
  compact?: boolean;
}

export function APIError({ error, onRetry, compact = false }: APIErrorProps) {
  if (!error) return null;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-sm"
      >
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{error.message}</span>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 ml-auto"
            onClick={onRetry}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border border-destructive/20 bg-destructive/5"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-destructive">Erro ao carregar dados</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        )}
      </div>
    </motion.div>
  );
}
