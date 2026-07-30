import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ResultadoItemMonofasico } from '@/lib/tributario/monofasico';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;

interface DetalhamentoTableProps {
  itens: ResultadoItemMonofasico[];
}

export function DetalhamentoTable({ itens }: DetalhamentoTableProps) {
  if (itens.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <caption className="sr-only">Memória de cálculo do regime monofásico por NCM</caption>
        <TableHeader>
          <TableRow>
            <TableHead>NCM</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Grupo</TableHead>
            <TableHead className="text-right">Receita</TableHead>
            <TableHead className="text-right">PIS</TableHead>
            <TableHead className="text-right">COFINS</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Economia</TableHead>
            <TableHead>Base legal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((item, i) => (
            <TableRow key={`${item.ncm}-${i}`}>
              <TableCell className="font-mono text-xs">{item.ncm || '—'}</TableCell>
              <TableCell className="max-w-[220px] truncate">{item.descricao}</TableCell>
              <TableCell>
                {item.monofasico ? (
                  <Badge variant="outline" className="border-success/40 text-success">{item.grupoNome}</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">Regime normal</Badge>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">{brl(item.receita)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {brl(item.pis)}
                <span className="ml-1 text-xs text-muted-foreground">({pct(item.aliquotaPis)})</span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {brl(item.cofins)}
                <span className="ml-1 text-xs text-muted-foreground">({pct(item.aliquotaCofins)})</span>
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">{brl(item.total)}</TableCell>
              <TableCell className="text-right tabular-nums text-success">
                {item.economia > 0 ? brl(item.economia) : '—'}
              </TableCell>
              <TableCell className="max-w-[200px] text-xs text-muted-foreground">
                {item.baseLegal ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
