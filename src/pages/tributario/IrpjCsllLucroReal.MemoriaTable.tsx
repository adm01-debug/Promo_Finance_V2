import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LinhaMemoriaIrpj } from '@/lib/tributario/irpj-csll';
import { formatCurrency } from '@/lib/formatters';

export function MemoriaTable({ linhas }: { linhas: readonly LinhaMemoriaIrpj[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rubrica</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Fundamento legal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((l, i) => (
            <TableRow key={`${l.rubrica}-${i}`}>
              <TableCell>{l.rubrica}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatCurrency(l.valor)}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{l.fundamento}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
