import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import type { DARF } from '@/hooks/useRetencoesFonte';

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-warning/10 text-warning', recolhido: 'bg-success/10 text-success',
};

interface Props {
  darfs: DARF[];
  onPagar: (darfId: string, dataPagamento: string) => void;
}

export function DARFsTable({ darfs, onPagar }: Props) {
  if (darfs.length === 0) {
    return (
      <Card><CardContent className="pt-6">
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>Nenhum DARF gerado</p>
        </div>
      </CardContent></Card>
    );
  }

  return (
    <Card><CardContent className="pt-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead><TableHead>Descrição</TableHead><TableHead>Competência</TableHead>
            <TableHead className="text-right">Valor</TableHead><TableHead>Vencimento</TableHead>
            <TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {darfs.map((darf) => (
            <TableRow key={darf.id}>
              <TableCell className="font-mono">{darf.codigo_receita}</TableCell>
              <TableCell>{darf.descricao_receita}</TableCell>
              <TableCell>{darf.competencia}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(darf.valor_total)}</TableCell>
              <TableCell>{format(parseISO(darf.data_vencimento), 'dd/MM/yyyy')}</TableCell>
              <TableCell>
                <Badge className={darf.status === 'pago' ? STATUS_COLORS.recolhido : darf.status === 'vencido' ? 'bg-destructive/10 text-destructive' : STATUS_COLORS.pendente}>
                  {darf.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {darf.status === 'gerado' && (
                  <Button size="sm" variant="outline" onClick={() => onPagar(darf.id, format(new Date(), 'yyyy-MM-dd'))}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />Pagar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent></Card>
  );
}
