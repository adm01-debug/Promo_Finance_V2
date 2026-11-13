import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LinhaMemoria } from '@/lib/tributario/pis-cofins';
import { formatCurrency } from '@/lib/formatters';
import { pct } from './PisCofinsCreditos.helpers';

export function MemoriaTable({ linhas }: { linhas: LinhaMemoria[] }) {
  if (linhas.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum lançamento no período.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rubrica</TableHead>
            <TableHead className="text-right">Base</TableHead>
            <TableHead className="text-right">Alíquota</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Fundamento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((l, i) => (
            <TableRow key={`${l.rubrica}-${i}`}>
              <TableCell>{l.rubrica}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(l.base)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {l.aliquota ? pct(l.aliquota) : '—'}
              </TableCell>
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
