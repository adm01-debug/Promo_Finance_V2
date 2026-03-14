import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home, Bug, MessageCircle, Copy, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { reportErrorToTracker, errorTracker } from '@/lib/error-tracking';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
    
    // Report to error tracking service
    reportErrorToTracker(error, errorInfo.componentStack || undefined);
    
    // Add breadcrumb for context
    errorTracker.addBreadcrumb({
      category: 'error-boundary',
      message: `Error caught: ${error.name}`,
      data: { message: error.message }
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
  };

  private handleCopyError = async () => {
    if (this.state.error) {
      const errorText = `
Error: ${this.state.error.name}
Message: ${this.state.error.message}
Stack: ${this.state.error.stack || 'N/A'}
Component Stack: ${this.state.errorInfo?.componentStack || 'N/A'}
      `.trim();
      
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[500px] flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
          <Card className="max-w-lg w-full border-destructive/20 shadow-2xl overflow-hidden">
            {/* Gradiente decorativo no topo */}
            <div className="h-1 bg-gradient-to-r from-destructive via-orange-500 to-destructive" />
            
            <CardHeader className="text-center pb-2 pt-8">
              {/* Ilustração animada */}
              <motion.div 
                className="flex justify-center mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                  </motion.div>
                </div>
              </motion.div>
              
              <h2 className="text-2xl font-bold text-foreground">
                Ops! Algo deu errado
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Encontramos um problema inesperado. Não se preocupe, 
                nossos robôs já foram notificados!
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="relative p-4 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                      <Bug className="h-4 w-4" />
                      <span>{this.state.error.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={this.handleCopyError}
                      className="h-8 px-2"
                    >
                      {this.state.copied ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono break-all">
                    {this.state.error.message}
                  </p>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="mt-2 text-xs text-muted-foreground/70 whitespace-pre-wrap max-h-24 overflow-auto">
                      {this.state.errorInfo.componentStack.slice(0, 300)}...
                    </pre>
                  )}
                </div>
              )}
              
              {/* Sugestões */}
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">O que você pode tentar:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Recarregar a página</li>
                  <li>Limpar o cache do navegador</li>
                  <li>Tentar novamente em alguns minutos</li>
                </ul>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-3 pt-2 pb-6">
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={this.handleRetry}
                >
                  <RefreshCw className="h-4 w-4" />
                  Tentar Novamente
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={this.handleGoHome}
                >
                  <Home className="h-4 w-4" />
                  Ir para Início
                </Button>
              </div>
              <Button
                className="w-full gap-2"
                onClick={this.handleReload}
              >
                <RefreshCw className="h-4 w-4" />
                Recarregar Página
              </Button>
              
              {/* Link de suporte */}
              <button
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mx-auto mt-2"
                onClick={() => window.open('mailto:suporte@empresa.com', '_blank')}
              >
                <MessageCircle className="h-3 w-3" />
                Precisa de ajuda? Fale com o suporte
              </button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
