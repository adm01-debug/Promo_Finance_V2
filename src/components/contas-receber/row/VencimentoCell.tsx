import { Calendar } from 'lucide-react';
import { TableCell } from '@/components/ui/table';
import { calculateOverdueDays, formatDate, getRelativeTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { ContaReceberWithRelations } from './rowConfig';

export function VencimentoCell({ conta }: { conta: ContaReceberWithRelations }) {
  const overdueDays = calculateOverdueDays(new Date(conta.data_vencimento));
  return (
    <TableCell className="p-6">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'h-12 w-12 rounded-2xl flex items-center justify-center border transition-all duration-700 shadow-2xl group-hover:scale-105',
            overdueDays > 0 && conta.status !== 'pago'
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : 'bg-card/[0.03] border-white/10 text-primary-foreground/20',
          )}
        >
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-black tabular-nums tracking-tight">
            {formatDate(new Date(conta.data_vencimento))}
          </p>
          {overdueDays > 0 && conta.status !== 'pago' ? (
            <p className="text-[10px] font-black text-destructive uppercase tracking-widest mt-0.5">Em atraso</p>
          ) : overdueDays < 0 && conta.status !== 'pago' ? (
            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mt-0.5">
              Vence em: {getRelativeTime(new Date(conta.data_vencimento))}
            </p>
          ) : null}
        </div>
      </div>
    </TableCell>
  );
}

export function DiasAtrasoCell({ conta }: { conta: ContaReceberWithRelations }) {
  const overdueDays = calculateOverdueDays(new Date(conta.data_vencimento));
  return (
    <TableCell className="p-6 text-center">
      {conta.status !== 'pago' && conta.status !== 'cancelado' ? (
        <div className="flex flex-col items-center">
          <span
            className={cn(
              'text-xl font-semibold tabular-nums tracking-tighter leading-none',
              overdueDays > 30 ? 'text-destructive' : overdueDays > 0 ? 'text-warning' : 'text-success',
            )}
          >
            {overdueDays > 0 ? overdueDays : overdueDays === 0 ? 'Hoje' : `${Math.abs(overdueDays)}d`}
          </span>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mt-1">Atraso</span>
        </div>
      ) : (
        <span className="text-[10px] font-black text-muted-foreground/20 tracking-widest uppercase">—</span>
      )}
    </TableCell>
  );
}
