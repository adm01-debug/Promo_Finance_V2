import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownLeft, MoreHorizontal, Eye, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

type TransactionType = 'receita' | 'despesa';
type TransactionStatus = 'pendente' | 'pago' | 'vencido' | 'cancelado';

interface Transaction {
  id: string; description: string; value: number; type: TransactionType;
  status: TransactionStatus; date: string; category?: string; entity?: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[]; title?: string; maxItems?: number;
  onViewAll?: () => void; onViewTransaction?: (id: string) => void; className?: string;
}

const statusConfig = {
  pendente: { label: 'Pendente', icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  pago: { label: 'Pago', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  vencido: { label: 'Vencido', icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  cancelado: { label: 'Cancelado', icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted' },
};

export function RecentTransactions({ transactions, title = 'Transações Recentes', maxItems = 5, onViewAll, onViewTransaction, className }: RecentTransactionsProps) {
  const displayedTransactions = transactions.slice(0, maxItems);

  return (
    <div className={cn('bg-card rounded-xl border border-border', className)}>
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {onViewAll && (
          <button onClick={onViewAll} className="text-sm text-primary hover:text-primary/80 font-medium">Ver todas</button>
        )}
      </div>
      <div className="divide-y divide-border">
        {displayedTransactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground"><p>Nenhuma transação encontrada</p></div>
        ) : displayedTransactions.map((transaction) => (
          <TransactionItem key={transaction.id} transaction={transaction} onView={onViewTransaction} />
        ))}
      </div>
    </div>
  );
}

function TransactionItem({ transaction, onView }: { transaction: Transaction; onView?: (id: string) => void }) {
  const isReceita = transaction.type === 'receita';
  const status = statusConfig[transaction.status];
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
      <div className={cn('flex-shrink-0 p-2 rounded-lg', isReceita ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
        {isReceita ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">{transaction.description}</p>
          <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs', status.bg, status.color)}>
            <StatusIcon className="h-3 w-3" />{status.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {transaction.entity && <span className="text-sm text-muted-foreground truncate">{transaction.entity}</span>}
          {transaction.category && (<><span className="text-border">•</span><span className="text-sm text-muted-foreground">{transaction.category}</span></>)}
          <span className="text-border">•</span>
          <span className="text-sm text-muted-foreground">{transaction.date}</span>
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className={cn('font-semibold', isReceita ? 'text-success' : 'text-destructive')}>
          {isReceita ? '+' : '-'} {transaction.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
      </div>
      {onView && (
        <button onClick={() => onView(transaction.id)} className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
          <Eye className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Lista simplificada
export function SimpleTransactionList({ transactions, className }: {
  transactions: Array<{ id: string; description: string; value: number; type: 'receita' | 'despesa'; date: string }>;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {transactions.map((t) => (
        <div key={t.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={cn('p-1.5 rounded', t.type === 'receita' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
              {t.type === 'receita' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{t.description}</p>
              <p className="text-xs text-muted-foreground">{t.date}</p>
            </div>
          </div>
          <p className={cn('text-sm font-semibold', t.type === 'receita' ? 'text-success' : 'text-destructive')}>
            {t.type === 'receita' ? '+' : '-'} {t.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      ))}
    </div>
  );
}

export default RecentTransactions;
