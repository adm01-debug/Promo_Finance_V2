import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BellRing } from 'lucide-react';
import { useFrontendErrorAlertState } from '@/hooks/useFrontendErrorLogs';

const fmt = (v: string | null) =>
  v ? new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

/**
 * Painel somente-leitura do estado dos alertas proativos de erro.
 * O disparo é feito no backend (cron a cada 15 min) com cooldown por assinatura,
 * portanto esta visão serve para auditar o que já foi notificado.
 */
export function AlertasProativosErros() {
  const { data, isLoading, isError } = useFrontendErrorAlertState();
  const linhas = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="h-4 w-4 text-warning" />
          Alertas proativos disparados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <Skeleton className="h-24 w-full" />}
        {isError && (
          <p className="text-sm text-muted-foreground">Não foi possível carregar o histórico de alertas.</p>
        )}
        {!isLoading && !isError && linhas.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum alerta disparado até agora — o monitor roda a cada 15 minutos.
          </p>
        )}
        {linhas.map((a) => (
          <div
            key={a.assinatura}
            className="flex flex-col gap-1 rounded-md border border-border p-3 text-sm md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-xs text-foreground">{a.assinatura}</p>
              <p className="text-xs text-muted-foreground">
                Último disparo: {fmt(a.ultimo_alerta_em)} · {a.ocorrencias_no_ultimo_alerta} ocorrências
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="secondary">{a.severity}</Badge>
              <Badge variant="outline">{a.alertas_enviados}x notificado</Badge>
              {a.silenciado_ate && new Date(a.silenciado_ate) > new Date() && (
                <Badge className="bg-muted text-muted-foreground">Silenciado</Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
