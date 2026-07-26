import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { AjusteParametro } from '@/lib/tributario/diagnostico-parametros';

export interface AjustesParametrosAlertProps {
  ajustes: AjusteParametro[];
}

/**
 * Exibe, de forma auditável, todos os ajustes automáticos aplicados aos
 * parâmetros informados antes do cálculo tributário.
 */
export function AjustesParametrosAlert({ ajustes }: AjustesParametrosAlertProps) {
  if (ajustes.length === 0) return null;

  const critico = ajustes.some((a) => a.severidade === 'critico');

  return (
    <Alert variant={critico ? 'error' : 'warning'} role="status" aria-live="polite">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {ajustes.length === 1
          ? '1 parâmetro foi ajustado automaticamente'
          : `${ajustes.length} parâmetros foram ajustados automaticamente`}
      </AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          Os valores abaixo estavam fora do domínio válido e foram corrigidos para preservar a
          consistência fiscal do cálculo. Revise o cadastro para eliminar as divergências.
        </p>
        <ul className="space-y-1">
          {ajustes.map((a) => (
            <li key={a.campo} className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={a.severidade === 'critico' ? 'destructive' : 'secondary'}>{a.rotulo}</Badge>
              <span className="text-muted-foreground line-through">{a.informado}</span>
              <span aria-hidden="true">→</span>
              <span className="font-medium">{a.aplicado}</span>
              <span className="text-muted-foreground">{a.motivo}</span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
