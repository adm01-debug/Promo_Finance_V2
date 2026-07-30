import { useHistoricoBoletos } from '@/hooks/useHistoricoBoletos';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/formatters';
import { Clock, History, FileText, User, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function BoletoGlobalHistory() {
  const { data: historico, isLoading } = useHistoricoBoletos();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!historico || historico.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-2xl bg-muted/5">
        <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-bold">Sem histórico global</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Eventos de cobrança e alterações de status aparecerão aqui conforme o sistema for utilizado.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-card/[0.02] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[180px]">Data/Hora</TableHead>
            <TableHead>Boleto</TableHead>
            <TableHead>Evento</TableHead>
            <TableHead>Descrição</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {historico.map((evento) => (
            <TableRow key={evento.id} className="group transition-colors">
              <TableCell className="font-mono text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {formatDateTime(evento.created_at)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-primary" />
                    <span className="font-bold text-sm">#{evento.boleto_numero}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <User className="h-2.5 w-2.5" />
                    {evento.sacado_nome}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize text-[10px] bg-muted/50 font-black">
                  {evento.tipo_evento.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                <div className="flex items-center gap-2">
                  <Info className="h-3 w-3 text-muted-foreground" />
                  {evento.descricao}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
