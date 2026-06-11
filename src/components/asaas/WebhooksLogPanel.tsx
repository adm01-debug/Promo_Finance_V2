import { Globe, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Braces } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWebhooksLog, useWebhooksRecentes } from '@/hooks/useExtratoWebhooks';
import { formatDate } from '@/lib/formatters';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

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
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {webhooks.map((wh) => (
                <WebhookRow key={wh.id} wh={wh} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WebhookRow({ wh }: { wh: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {wh.processado ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : wh.erro_mensagem ? (
            <XCircle className="h-4 w-4 text-destructive" />
          ) : (
            <Clock className="h-4 w-4 text-amber-500" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm font-mono">{wh.event_type}</p>
              {wh.asaas_payment_id && (
                <Badge variant="outline" className="text-[10px] h-4">
                  PAY: {wh.asaas_payment_id.slice(-6)}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {wh.provider || 'asaas'} • ID: {wh.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-1">
            <Badge variant={wh.processado ? 'default' : wh.erro_mensagem ? 'destructive' : 'secondary'} className="text-[10px]">
              {wh.processado ? 'Processado' : wh.erro_mensagem ? 'Erro' : 'Pendente'}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{formatDate(wh.created_at)}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 border-t bg-muted/30 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {wh.erro_mensagem && (
            <div className="p-3 rounded bg-destructive/10 border border-destructive/20">
              <p className="text-xs font-bold text-destructive flex items-center gap-2">
                <XCircle className="h-3 w-3" /> ERRO DE PROCESSAMENTO
              </p>
              <p className="text-xs text-destructive mt-1 font-mono">{wh.erro_mensagem}</p>
              {wh.erro_detalhe && (
                <p className="text-[10px] text-destructive/70 mt-1 italic">{wh.erro_detalhe}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Braces className="h-3 w-3" /> Payload Real (RAW JSON)
            </p>
            <ScrollArea className="h-48 w-full rounded border bg-black/90 p-3">
              <pre className="text-[11px] font-mono text-emerald-400">
                {JSON.stringify(wh.payload, null, 2)}
              </pre>
            </ScrollArea>
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50">
            <span>Correlation ID: {wh.correlation_id || wh.asaas_event_id || 'N/A'}</span>
            <span>Duração: {wh.duration_ms ? `${wh.duration_ms}ms` : 'N/A'} • IP: {wh.ip_origem || 'Interno'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
