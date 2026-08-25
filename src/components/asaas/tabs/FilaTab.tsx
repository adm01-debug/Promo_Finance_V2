import type { useAsaas } from '@/hooks/useAsaas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  LayoutDashboard,
  History,
  FileSpreadsheet,
  PlayCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

type AsaasHook = ReturnType<typeof useAsaas>;

export interface FilaTabProps {
  syncQueue: AsaasHook['syncQueue'];
  loadingQueue: AsaasHook['loadingQueue'];
  queueStats: AsaasHook['queueStats'];
  simularBackoff: AsaasHook['simularBackoff'];
  exportarAuditoria: AsaasHook['exportarAuditoria'];
  exportarAuditoriaPDF: AsaasHook['exportarAuditoriaPDF'];
  reprocessarManualPending: boolean;
  onReprocess: (payload: { paymentId: string; asaasId: string }) => void;
  onViewHistory: (history: Record<string, unknown>[]) => void;
}

export function FilaTab({
  syncQueue,
  loadingQueue,
  queueStats,
  simularBackoff,
  exportarAuditoria,
  exportarAuditoriaPDF,
  reprocessarManualPending,
  onReprocess,
  onViewHistory,
}: FilaTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total na Fila</span>
            </div>
            <p className="text-2xl font-bold mt-1">{queueStats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <span className="text-sm text-muted-foreground">Pendentes</span>
            </div>
            <p className="text-2xl font-bold mt-1">{queueStats.pendentes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Falhas Críticas</span>
            </div>
            <p className="text-2xl font-bold mt-1">{queueStats.falhas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">Sucesso</span>
            </div>
            <p className="text-2xl font-bold mt-1">{queueStats.sucesso}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Status da Fila</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] pb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Pendente', total: queueStats.pendentes, color: 'var(--warn)' },
                  { name: 'Falha', total: queueStats.falhas, color: 'var(--bad)' },
                  { name: 'Sucesso', total: queueStats.sucesso, color: 'var(--ok)' },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-1)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--t0)',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: 'var(--t0)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={40}>
                  {[0, 1, 2].map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? 'var(--warn)' : index === 1 ? 'var(--bad)' : 'var(--ok)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Fila de Sincronização</CardTitle>
              <CardDescription>Monitoramento de retentativas automáticas</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => simularBackoff.mutate()}
                disabled={simularBackoff.isPending}
              >
                <PlayCircle className="h-4 w-4 mr-2" /> Simular
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportarAuditoria.mutate()}>
                    CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportarAuditoriaPDF()}>PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead>Próxima</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingQueue ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : syncQueue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      Fila vazia
                    </TableCell>
                  </TableRow>
                ) : (
                  syncQueue.slice(0, 5).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs truncate max-w-[80px]">
                        {String(item.payment_id).substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        {item.attempts}/{item.max_attempts}
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.next_retry_at ? format(parseISO(item.next_retry_at), 'HH:mm') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.status === 'failed' ? 'destructive' : 'secondary'}
                          className="text-[10px]"
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() =>
                            onReprocess({ paymentId: item.payment_id, asaasId: item.id })
                          }
                          disabled={reprocessarManualPending}
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                        </Button>
                        {Array.isArray(item.error_history) && item.error_history.length > 0 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={() => onViewHistory(item.error_history)}
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
