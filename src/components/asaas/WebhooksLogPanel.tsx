import { Globe, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWebhooksLog, useWebhooksRecentes } from '@/hooks/useExtratoWebhooks';
import { formatDate } from '@/lib/formatters';

export function WebhooksLogPanel() {
  const { data: webhooks, isLoading } = useWebhooksLog();
  const { data: recentes } = useWebhooksRecentes();

  return (
    <div className="space-y-6">
      {/* Webhooks Recentes (View) */}
      {recentes && recentes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {recentes.slice(0, 4).map((r, i) => (
                <div key={i} className="p-3 rounded-lg border text-center">
                  <p className="text-xs text-muted-foreground">{r.event_type}</p>
                  <p className="text-lg font-bold mt-1">{r.status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log completo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Log de Webhooks</CardTitle>
              <CardDescription>Eventos recebidos do gateway de pagamento</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : !webhooks || webhooks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Nenhum webhook recebido</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {webhooks.map((wh) => (
                <div key={wh.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {wh.processado ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : wh.erro ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Clock className="h-4 w-4 text-warning" />
                    )}
                    <div>
                      <p className="font-medium text-sm font-mono">{wh.evento || wh.event_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {wh.origem || 'asaas'} • ID: {wh.external_id || wh.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={wh.processado ? 'default' : wh.erro ? 'destructive' : 'secondary'}>
                      {wh.processado ? 'Processado' : wh.erro ? 'Erro' : 'Pendente'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(wh.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
