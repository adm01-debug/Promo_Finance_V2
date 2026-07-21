import { Progress } from '@/components/ui/progress';
import { TableCell } from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import type { ContaReceberWithRelations } from './rowConfig';

export function ValorCell({ conta }: { conta: ContaReceberWithRelations }) {
  const saldo = conta.valor - (conta.valor_recebido || 0);
  const percentualRecebido = conta.valor_recebido ? (conta.valor_recebido / conta.valor) * 100 : 0;

  return (
    <TableCell className="p-6">
      <div className="space-y-1">
        <p className="text-xl font-black tabular-nums tracking-tighter text-foreground group-hover:scale-105 transition-transform origin-left">
          {formatCurrency(conta.valor)}
        </p>
        {conta.valor_desconto && conta.valor_desconto > 0 && (
          <p className="text-[10px] font-black text-warning uppercase tracking-widest leading-none">
            Desconto: -{formatCurrency(conta.valor_desconto)}
          </p>
        )}
        {conta.valor_recebido && conta.valor_recebido > 0 && (
          <div className="pt-1.5 max-w-[120px]">
            <Progress value={percentualRecebido} className="h-1" aria-label="Percentual recebido" />
            <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">
              Saldo: {formatCurrency(saldo)}
            </p>
          </div>
        )}
      </div>
    </TableCell>
  );
}
