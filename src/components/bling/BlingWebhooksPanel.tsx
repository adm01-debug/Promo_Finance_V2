import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { RefreshCw, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useBlingWebhookEvents, useBlingSyncLogs } from '@/hooks/useBling';
import { LoadingSkeleton } from './BlingShared';

export function BlingWebhooksPanel() {
  const { data: events, isLoading } = useBlingWebhookEvents();
  const { data: logs } = useBlingSyncLogs();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5" /> Eventos Webhook</CardTitle>
          <CardDescription>Eventos recebidos do Bling em tempo real</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingSkeleton /> : !events || events.length === 0 ? (
            <EmptyState icon={RefreshCw} title="Nenhum evento" description="Os eventos do Bling aparecerão aqui quando configurados" />
          ) : (
            <div className="rounded-md border overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>ID Recurso</TableHead>
                    <TableHead>Retries</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(events as any[]).map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs">{new Date(e.received_at).toLocaleString('pt-BR')}</TableCell>
                      <TableCell><Badge variant="outline">{e.module}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{e.event_type}</TableCell>
                      <TableCell className="font-mono text-xs">{e.resource_id || '-'}</TableCell>
                      <TableCell>{e.retries || 0}</TableCell>
                      <TableCell>
                        {e.processed ? (
                          <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />OK</Badge>
                        ) : e.error_message ? (
                          <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Erro</Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pendente</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {logs && (logs as any[]).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5" /> Logs de Sincronização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto max-h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Processados</TableHead>
                    <TableHead>Erros</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(logs as any[]).map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">{new Date(l.created_at).toLocaleString('pt-BR')}</TableCell>
                      <TableCell>{l.modulo}</TableCell>
                      <TableCell>{l.tipo}</TableCell>
                      <TableCell>{l.registros_processados}</TableCell>
                      <TableCell>{l.registros_com_erro}</TableCell>
                      <TableCell>
                        <Badge variant={l.status === 'concluido' ? 'default' : l.status === 'erro' ? 'destructive' : 'secondary'}>{l.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
