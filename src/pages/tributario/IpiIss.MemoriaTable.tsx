import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LinhaMemoria } from '@/lib/tributario/ipi-iss';
import { brl, pct } from './IpiIss.helpers';

export function MemoriaTable({ linhas }: { linhas: LinhaMemoria[] }) {
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
              <TableCell className="text-right tabular-nums">{brl(l.base)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {l.aliquota ? pct(l.aliquota) : '—'}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">{brl(l.valor)}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{l.fundamento}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
