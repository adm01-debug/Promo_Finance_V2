import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { splitSaldo, type BalanceteRow, type BalanceteTotais } from '@/lib/contabil/balancete-utils';

interface Props {
  rows: BalanceteRow[];
  totais: BalanceteTotais;
  onSelectConta?: (row: BalanceteRow) => void;
}

function Valor({ value, muted }: { value: number; muted?: boolean }) {
  if (!value) return <span className="text-muted-foreground/50">—</span>;
  return <span className={cn('tabular-nums', muted && 'text-muted-foreground')}>{formatCurrency(value)}</span>;
}

export function BalanceteTable({ rows, totais, onSelectConta }: Props) {
  return (
    <div className="rounded-3xl border border-border/40 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-[10rem]">Conta</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Saldo anterior</TableHead>
            <TableHead className="text-right">Débitos</TableHead>
            <TableHead className="text-right">Créditos</TableHead>
            <TableHead className="text-right">Saldo devedor</TableHead>
            <TableHead className="text-right">Saldo credor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma conta para o período e filtros selecionados.
              </TableCell>
            </TableRow>
          )}
          {rows.map((r) => {
            const saldo = splitSaldo(r.saldo_final);
            const sintetica = !r.aceita_lancamento;
            return (
              <TableRow
                key={r.conta_id}
                className={cn(
                  sintetica && 'bg-muted/20 font-semibold',
                  onSelectConta && r.aceita_lancamento && 'cursor-pointer hover:bg-accent/40',
                )}
                onClick={() => r.aceita_lancamento && onSelectConta?.(r)}
              >
                <TableCell className="font-mono text-xs">{r.codigo}</TableCell>
                <TableCell style={{ paddingLeft: `${Math.max(0, r.nivel - 1) * 12 + 16}px` }}>
                  {r.nome}
                </TableCell>
                <TableCell className="text-right"><Valor value={r.saldo_anterior} muted /></TableCell>
                <TableCell className="text-right"><Valor value={r.debitos} /></TableCell>
                <TableCell className="text-right"><Valor value={r.creditos} /></TableCell>
                <TableCell className="text-right"><Valor value={saldo.devedor} /></TableCell>
                <TableCell className="text-right"><Valor value={saldo.credor} /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <tfoot>
          <TableRow className={cn('border-t-2', totais.balanceado ? 'bg-muted/50' : 'bg-destructive/10')}>
            <TableCell colSpan={3} className="font-black uppercase text-[11px] tracking-widest">
              Totais ({totais.contas} contas analíticas)
            </TableCell>
            <TableCell className="text-right font-bold tabular-nums">{formatCurrency(totais.debitos)}</TableCell>
            <TableCell className="text-right font-bold tabular-nums">{formatCurrency(totais.creditos)}</TableCell>
            <TableCell className="text-right font-bold tabular-nums">{formatCurrency(totais.saldoDevedor)}</TableCell>
            <TableCell className="text-right font-bold tabular-nums">{formatCurrency(totais.saldoCredor)}</TableCell>
          </TableRow>
          {!totais.balanceado && (
            <TableRow className="bg-destructive/10">
              <TableCell colSpan={7} className="text-center text-xs font-bold text-destructive">
                Escrituração desbalanceada — diferença D-C de {formatCurrency(totais.diferenca)}
              </TableCell>
            </TableRow>
          )}
        </tfoot>
      </Table>
    </div>
  );
}
