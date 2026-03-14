import { cn } from '@/lib/utils';
import { Calendar, AlertTriangle, Clock, CheckCircle, ChevronRight, Bell } from 'lucide-react';

interface Bill {
  id: string; description: string; value: number; dueDate: string;
  daysUntilDue: number; type: 'pagar' | 'receber'; entity?: string; isPaid?: boolean;
}

interface UpcomingBillsProps {
  bills: Bill[]; title?: string; maxItems?: number;
  onViewAll?: () => void; onPayBill?: (id: string) => void; className?: string;
}

function getDueDateStatus(daysUntilDue: number, isPaid?: boolean) {
  if (isPaid) return { label: 'Pago', color: 'text-success', bg: 'bg-success/10', icon: CheckCircle };
  if (daysUntilDue < 0) return { label: `${Math.abs(daysUntilDue)} dias vencido`, color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertTriangle };
  if (daysUntilDue === 0) return { label: 'Vence hoje', color: 'text-warning', bg: 'bg-warning/10', icon: Bell };
  if (daysUntilDue <= 3) return { label: `${daysUntilDue} dias`, color: 'text-warning', bg: 'bg-warning/10', icon: Clock };
  if (daysUntilDue <= 7) return { label: `${daysUntilDue} dias`, color: 'text-secondary', bg: 'bg-secondary/10', icon: Calendar };
  return { label: `${daysUntilDue} dias`, color: 'text-muted-foreground', bg: 'bg-muted', icon: Calendar };
}

export function UpcomingBills({ bills, title = 'Próximos Vencimentos', maxItems = 5, onViewAll, onPayBill, className }: UpcomingBillsProps) {
  const sortedBills = [...bills].sort((a, b) => a.daysUntilDue - b.daysUntilDue).slice(0, maxItems);
  const overdueCount = bills.filter((b) => b.daysUntilDue < 0 && !b.isPaid).length;
  const todayCount = bills.filter((b) => b.daysUntilDue === 0 && !b.isPaid).length;

  return (
    <div className={cn('bg-card rounded-xl border border-border', className)}>
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <div className="flex items-center gap-3 mt-1">
            {overdueCount > 0 && (<span className="flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="h-3 w-3" />{overdueCount} vencidas</span>)}
            {todayCount > 0 && (<span className="flex items-center gap-1 text-xs text-warning"><Bell className="h-3 w-3" />{todayCount} hoje</span>)}
          </div>
        </div>
        {onViewAll && (<button onClick={onViewAll} className="text-sm text-primary hover:text-primary/80 font-medium">Ver todas</button>)}
      </div>
      <div className="divide-y divide-border">
        {sortedBills.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground"><Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Nenhuma conta próxima</p></div>
        ) : sortedBills.map((bill) => <BillItem key={bill.id} bill={bill} onPay={onPayBill} />)}
      </div>
    </div>
  );
}

function BillItem({ bill, onPay }: { bill: Bill; onPay?: (id: string) => void }) {
  const status = getDueDateStatus(bill.daysUntilDue, bill.isPaid);
  const StatusIcon = status.icon;
  const isPagar = bill.type === 'pagar';

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
      <div className={cn('flex-shrink-0 p-2 rounded-lg', status.bg)}><StatusIcon className={cn('h-5 w-5', status.color)} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">{bill.description}</p>
          <span className={cn('text-xs px-2 py-0.5 rounded-full', isPagar ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>
            {isPagar ? 'Pagar' : 'Receber'}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {bill.entity && <span className="text-sm text-muted-foreground truncate">{bill.entity}</span>}
          <span className="text-border">•</span>
          <span className="text-sm text-muted-foreground">{bill.dueDate}</span>
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className={cn('font-semibold', isPagar ? 'text-destructive' : 'text-success')}>
          {bill.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
        <p className={cn('text-xs mt-0.5', status.color)}>{status.label}</p>
      </div>
      {onPay && !bill.isPaid && (
        <button onClick={() => onPay(bill.id)} className="flex-shrink-0 p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted" title={isPagar ? 'Marcar como pago' : 'Marcar como recebido'}>
          <CheckCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function BillsSummary({ totalPagar, totalReceber, vencidasPagar, vencidasReceber, className }: {
  totalPagar: number; totalReceber: number; vencidasPagar: number; vencidasReceber: number; className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      <div className="bg-destructive/10 rounded-xl p-4">
        <p className="text-sm text-destructive font-medium">A Pagar</p>
        <p className="text-2xl font-bold text-destructive mt-1">{totalPagar.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        {vencidasPagar > 0 && (<p className="text-xs text-destructive mt-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{vencidasPagar} vencidas</p>)}
      </div>
      <div className="bg-success/10 rounded-xl p-4">
        <p className="text-sm text-success font-medium">A Receber</p>
        <p className="text-2xl font-bold text-success mt-1">{totalReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        {vencidasReceber > 0 && (<p className="text-xs text-warning mt-2 flex items-center gap-1"><Clock className="h-3 w-3" />{vencidasReceber} atrasadas</p>)}
      </div>
    </div>
  );
}

export default UpcomingBills;
