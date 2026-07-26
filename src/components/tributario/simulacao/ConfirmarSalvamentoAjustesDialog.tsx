import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import type { AjusteParametro } from '@/lib/tributario/diagnostico-parametros';

export interface ConfirmarSalvamentoAjustesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Apenas os ajustes de severidade crítica que motivaram o bloqueio. */
  ajustesCriticos: AjusteParametro[];
  onConfirmar: () => void;
}

/**
 * Barreira de confirmação explícita antes de persistir um snapshot cujos
 * parâmetros de entrada precisaram de correção crítica (valores negativos,
 * NaN ou fora do domínio legal). Impede que a base histórica seja poluída
 * por simulações originadas de dados inconsistentes sem ciência do usuário.
 */
export function ConfirmarSalvamentoAjustesDialog({
  open,
  onOpenChange,
  ajustesCriticos,
  onConfirmar,
}: ConfirmarSalvamentoAjustesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Salvar simulação com parâmetros corrigidos?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                {ajustesCriticos.length === 1
                  ? 'Um parâmetro estava fora do domínio válido'
                  : `${ajustesCriticos.length} parâmetros estavam fora do domínio válido`}{' '}
                e foi corrigido automaticamente. O snapshot registrará os valores corrigidos, não os
                originais.
              </p>
              <ul className="space-y-1">
                {ajustesCriticos.map((a) => (
                  <li key={a.campo} className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="destructive">{a.rotulo}</Badge>
                    <span className="line-through">{a.informado}</span>
                    <span aria-hidden="true">→</span>
                    <span className="font-medium">{a.aplicado}</span>
                  </li>
                ))}
              </ul>
              <p>Recomendamos corrigir o cadastro antes de salvar, para preservar a auditabilidade.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Revisar parâmetros</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmar}>Salvar mesmo assim</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
