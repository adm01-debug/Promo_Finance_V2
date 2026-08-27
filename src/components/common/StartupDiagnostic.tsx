import type { ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { useStartupDiagnostic } from '@/hooks/useStartupDiagnostic';
import { Button } from '@/components/ui/button';

/**
 * Observabilidade de inicialização. Nunca é um guard de disponibilidade: login
 * e rotas públicas precisam continuar utilizáveis durante falhas transitórias
 * de rede, DNS ou do provedor de autenticação.
 */
export function StartupDiagnostic({ children }: { children: ReactNode }) {
  const { isComplete, hasError, retry } = useStartupDiagnostic();

  if (!isComplete || !hasError) return <>{children}</>;

  return (
    <>
      {children}
      <aside
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-destructive/30 bg-background/95 p-4 shadow-lg backdrop-blur"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="space-y-2">
            <p className="text-sm font-semibold">Diagnóstico indisponível</p>
            <p className="text-xs text-muted-foreground">
              O sistema continua disponível. Algumas verificações serão repetidas em segundo plano.
            </p>
            <Button variant="outline" size="sm" onClick={retry}>
              <RefreshCcw className="mr-2 h-3.5 w-3.5" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
