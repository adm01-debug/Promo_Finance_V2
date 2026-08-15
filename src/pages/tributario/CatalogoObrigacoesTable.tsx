import { OBRIGACOES } from '@/lib/tributario/obrigacoes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { brl } from './obrigacoes-helpers';

export function CatalogoObrigacoesTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Obrigação</TableHead>
          <TableHead>Periodicidade</TableHead>
          <TableHead>Regimes</TableHead>
          <TableHead>Base legal</TableHead>
          <TableHead className="text-right">Multa mín.</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {OBRIGACOES.map((o) => (
          <TableRow key={o.id}>
            <TableCell>
              <p className="font-medium text-foreground">{o.nome}</p>
              <p className="text-xs text-muted-foreground">{o.descricao}</p>
            </TableCell>
            <TableCell className="capitalize">{o.periodicidade}</TableCell>
            <TableCell className="text-muted-foreground">{o.regimes.join(', ')}</TableCell>
            <TableCell className="text-muted-foreground">{o.baseLegal}</TableCell>
            <TableCell className="text-right tabular-nums">{brl(o.multaMinima)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
