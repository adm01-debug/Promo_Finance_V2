import { Activity } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { EventoLog } from './types';

export interface LogsTableProps {
  logs: EventoLog[];
  loading: boolean;
}

export function LogsTable({ logs, loading }: LogsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Últimos eventos contabilizados
        </CardTitle>
        <CardDescription>50 eventos mais recentes com regra aplicada.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : logs.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Nenhum evento processado ainda.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Detalhe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">
                    {new Date(l.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{l.tipo_evento}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        l.status === 'sucesso'
                          ? 'default'
                          : l.status === 'erro'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-md truncate">
                    {l.detalhe ??
                      (l.lancamento_id
                        ? `Lançamento #${l.lancamento_id.slice(0, 8)}`
                        : '—')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
