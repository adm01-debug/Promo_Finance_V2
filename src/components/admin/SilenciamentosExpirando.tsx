import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlarmClockOff } from 'lucide-react';
import {
  useSilenciamentosExpirando,
  useSilenciarAlertaErro,
  type SilenciamentoExpirando,
} from '@/hooks/useFrontendErrorLogs';

/** Texto do prazo: negativo significa que o silenciamento já venceu. */
function prazo(item: SilenciamentoExpirando): string {
  const h = Math.abs(Math.round(item.horas_restantes));
  return item.ja_expirou ? `voltou a alertar há ${h}h` : `expira em ${h}h`;
}

/**
 * Aviso de silenciamentos prestes a expirar (Gap #28).
 *
 * Espelha na tela o mesmo recorte que o digest semanal envia por e-mail/Slack,
 * para o admin renovar conscientemente em vez de ser surpreendido pelo alerta
 * voltando a disparar. A RPC exige papel de admin: para os demais a query
 * falha e o bloco não é renderizado.
 */
export function SilenciamentosExpirando({ horas = 72 }: { horas?: number }) {
  const { data, isError } = useSilenciamentosExpirando(horas);
  const silenciar = useSilenciarAlertaErro();
  const itens = data ?? [];

  if (isError || itens.length === 0) return null;

  return (
    <Alert className="border-warning/50">
      <AlarmClockOff className="h-4 w-4 text-warning" />
      <AlertTitle>Silenciamentos vencendo ({itens.length})</AlertTitle>
      <AlertDescription>
        <p className="mb-2 text-xs text-muted-foreground">
          Renove apenas se a causa raiz seguir em tratamento — renovações sucessivas escondem bugs
          crônicos.
        </p>
        <ul className="space-y-1.5">
          {itens.map((i) => (
            <li key={i.assinatura} className="flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 truncate font-mono text-xs">{i.assinatura}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground">{prazo(i)}</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={silenciar.isPending}
                  onClick={() =>
                    silenciar.mutate({
                      assinatura: i.assinatura,
                      horas: 168,
                      motivo: 'Renovado por 7 dias a partir do aviso de expiração',
                    })
                  }
                >
                  Renovar 7 dias
                </Button>
              </span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
