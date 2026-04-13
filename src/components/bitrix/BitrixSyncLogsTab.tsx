import { motion } from 'framer-motion';
import { History, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

interface SyncLog {
  id: string; tipo: string; entidade: string; status: string;
  iniciado_em: string; mensagem_erro: string | null;
  registros_processados: number | null; registros_com_erro: number | null;
}

interface BitrixSyncLogsTabProps {
  logs: SyncLog[] | undefined;
  isLoading: boolean;
  formatRelativeTime: (d: string) => string;
}

const getStatusColor = (s: string) => { switch (s) { case 'sucesso': return 'bg-success/10'; case 'erro': return 'bg-destructive/10'; case 'parcial': return 'bg-warning/10'; default: return 'bg-secondary/10'; } };
const getStatusIcon = (s: string) => { switch (s) { case 'sucesso': return <CheckCircle2 className="h-5 w-5 text-success" />; case 'erro': return <XCircle className="h-5 w-5 text-destructive" />; case 'parcial': return <AlertTriangle className="h-5 w-5 text-warning" />; default: return <Clock className="h-5 w-5 text-secondary" />; } };

export function BitrixSyncLogsTab({ logs, isLoading, formatRelativeTime }: BitrixSyncLogsTabProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Histórico de Sincronização</CardTitle><CardDescription>Logs das últimas operações de sincronização</CardDescription></CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-3">
              {logs.map((log) => (
                <motion.div key={log.id} variants={itemVariants} className="flex items-start gap-4 p-4 rounded-lg border">
                  <div className={cn("p-2 rounded-lg", getStatusColor(log.status))}>{getStatusIcon(log.status)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={log.tipo === 'entrada' ? 'default' : log.tipo === 'saida' ? 'secondary' : 'outline'}>{log.tipo === 'entrada' ? 'Entrada' : log.tipo === 'saida' ? 'Saída' : 'Alteração'}</Badge>
                      <span className="font-medium capitalize">{log.entidade}</span>
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(log.iniciado_em)}</span>
                    </div>
                    {log.mensagem_erro && <p className="text-sm text-muted-foreground">{log.mensagem_erro}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="text-success">{log.registros_processados} registros</span>
                      {(log.registros_com_erro || 0) > 0 && <span className="text-destructive">{log.registros_com_erro} erros</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground"><History className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Nenhuma sincronização realizada ainda</p></div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
