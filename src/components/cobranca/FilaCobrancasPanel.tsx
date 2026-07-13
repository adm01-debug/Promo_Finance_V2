import { useState } from 'react';
import { Clock, Send, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useFilaCobrancas, useExecucoesCobranca, useProcessarRegua, useProcessarFila } from '@/hooks/useReguaCobranca';
import { useMetricasCobranca } from '@/hooks/useViews';
import { formatCurrency, formatDate } from '@/lib/formatters';

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pendente: { icon: Clock, color: 'text-warning', label: 'Pendente' },
  processando: { icon: Loader2, color: 'text-primary', label: 'Processando' },
  enviado: { icon: Send, color: 'text-success', label: 'Enviado' },
  entregue: { icon: CheckCircle2, color: 'text-success', label: 'Entregue' },
  lido: { icon: Eye, color: 'text-primary', label: 'Lido' },
  falhou: { icon: XCircle, color: 'text-destructive', label: 'Falhou' },
  cancelado: { icon: XCircle, color: 'text-muted-foreground', label: 'Cancelado' },
};

export function FilaCobrancasPanel() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data: filaData, isLoading: loadingFila } = useFilaCobrancas(statusFilter);
  const { data: execucoesData, isLoading: loadingExec } = useExecucoesCobranca();
  const fila = (filaData || []) as Array<Record<string, string | number | null | undefined>>;
  const execucoes = (execucoesData || []) as Array<Record<string, string | number | null | undefined>>;
  const { data: metricas } = useMetricasCobranca();
  const processarRegua = useProcessarRegua();
  const processarFila = useProcessarFila();

  return (
    <div className="space-y-6">
      {/* Métricas por Etapa */}
      {metricas && metricas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {metricas.map((m: Record<string, unknown>) => (
            <Card key={String(m.etapa)}>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground capitalize">{String(m.etapa)}</p>
                <p className="text-lg font-bold mt-1">{Number(m.total_enviados || 0)} enviados</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{Number(m.total_entregues || 0)} entregues</span>
                  <span>•</span>
                  <span>{Number(m.total_lidos || 0)} lidos</span>
                </div>
                <p className="text-xs mt-1">
                  Taxa: <span className="font-semibold">{Number(m.taxa_entrega || 0).toFixed(1)}%</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-lg font-semibold">Engine de Cobrança</h3>
        <div className="flex gap-2">
          <Button
            onClick={() => processarRegua.mutate({ simulate: true })}
            disabled={processarRegua.isPending}
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
          >
            <Eye className="h-4 w-4" />
            Simular 24h
          </Button>
          <Button
            onClick={() => processarRegua.mutate({ simulate: false })}
            disabled={processarRegua.isPending}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {processarRegua.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Rodar Régua
          </Button>
          <Button
            onClick={() => processarFila.mutate()}
            disabled={processarFila.isPending}
            size="sm"
            className="gap-2 bg-gradient-to-r from-primary to-primary/80"
          >
            {processarFila.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Disparar Fila
          </Button>
        </div>
      </div>

      <Tabs defaultValue="fila">
        <TabsList>
          <TabsTrigger value="fila">Fila de Cobranças</TabsTrigger>
          <TabsTrigger value="execucoes">Log de Disparos</TabsTrigger>
        </TabsList>

        <TabsContent value="fila" className="space-y-2">
          <div className="flex gap-2 mb-4">
            {['pendente', 'processando', 'enviado', 'falhou'].map(s => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? 'default' : 'outline'}
                onClick={() => setStatusFilter(statusFilter === s ? undefined : s)}
                className="capitalize"
              >
                {s}
              </Button>
            ))}
          </div>

          {loadingFila ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)
          ) : fila && fila.length > 0 ? (
            <div className="space-y-2">
              {fila.map((item) => {
                const config = statusConfig[item.status] || statusConfig.pendente;
                const StatusIcon = config.icon;
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-5 w-5 ${config.color} ${item.status === 'processando' ? 'animate-spin' : ''}`} />
                      <div>
                        <p className="font-medium text-sm">{item.cliente_nome || 'Cliente'}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.etapa} • {item.canal} • {item.destinatario}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize text-[10px]">{config.label}</Badge>
                      {item.tentativas != null && item.tentativas > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {item.tentativas}/{item.max_tentativas || 3}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Send className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Nenhuma cobrança na fila</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="execucoes" className="space-y-2">
          {loadingExec ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)
          ) : execucoes && execucoes.length > 0 ? (
            <div className="space-y-2">
              {execucoes.map((exec) => (
                <div key={exec.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{exec.cliente_nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {exec.etapa} • {exec.canal} • {exec.destinatario}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={exec.status === 'enviado' ? 'default' : 'destructive'} className="capitalize text-[10px]">
                      {exec.status}
                    </Badge>
                    {exec.provider && <Badge variant="outline" className="text-[10px]">{exec.provider}</Badge>}
                    <span className="text-[10px] text-muted-foreground">{formatDate(exec.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum disparo registrado</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
