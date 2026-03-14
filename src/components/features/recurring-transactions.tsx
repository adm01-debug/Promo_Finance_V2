import { useState } from 'react';
import { RefreshCw, Calendar, Plus, Edit, Trash2, Play, Pause, Clock, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly';
type RecurrenceStatus = 'active' | 'paused' | 'completed' | 'cancelled';

interface RecurringTransaction { id: string; description: string; amount: number; type: 'income' | 'expense'; category: string; categoryColor?: string; recurrenceType: RecurrenceType; recurrenceInterval: number; startDate: Date; endDate?: Date; nextOccurrence: Date; status: RecurrenceStatus; totalOccurrences?: number; completedOccurrences: number; lastProcessedAt?: Date; supplier?: string; customer?: string; notes?: string; }

interface RecurringTransactionsProps { transactions: RecurringTransaction[]; onAdd: () => void; onEdit: (id: string) => void; onDelete: (id: string) => void; onToggleStatus: (id: string) => void; onProcess: (id: string) => void; className?: string; }

const recurrenceLabels: Record<RecurrenceType, string> = { daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal', yearly: 'Anual' };

const statusConfig: Record<RecurrenceStatus, { label: string; color: string; bgColor: string; icon: typeof CheckCircle }> = {
  active: { label: 'Ativo', color: 'text-success', bgColor: 'bg-success/10', icon: CheckCircle },
  paused: { label: 'Pausado', color: 'text-warning', bgColor: 'bg-warning/10', icon: Pause },
  completed: { label: 'Concluído', color: 'text-primary', bgColor: 'bg-primary/10', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'text-muted-foreground', bgColor: 'bg-muted', icon: AlertCircle },
};

export function RecurringTransactions({ transactions, onAdd, onEdit, onDelete, onToggleStatus, onProcess, className }: RecurringTransactionsProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const filteredTransactions = transactions.filter((t) => filter === 'all' || t.status === filter);
  const activeCount = transactions.filter((t) => t.status === 'active').length;
  const totalMonthlyExpense = transactions.filter((t) => t.status === 'active' && t.type === 'expense').reduce((sum, t) => sum + getMonthlyAmount(t), 0);
  const totalMonthlyIncome = transactions.filter((t) => t.status === 'active' && t.type === 'income').reduce((sum, t) => sum + getMonthlyAmount(t), 0);

  return (
    <div className={cn('', className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2"><RefreshCw className="w-5 h-5 text-muted-foreground" /><h2 className="text-lg font-semibold text-foreground">Transações Recorrentes</h2></div>
        <Button onClick={onAdd}><Plus className="w-4 h-4 mr-2" />Nova Recorrência</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-card border border-border rounded-lg"><p className="text-sm text-muted-foreground">Recorrências Ativas</p><p className="text-2xl font-bold text-foreground">{activeCount}</p></div>
        <div className="p-4 bg-card border border-border rounded-lg"><p className="text-sm text-muted-foreground">Despesas Mensais</p><p className="text-2xl font-bold text-destructive">{formatCurrency(totalMonthlyExpense)}</p></div>
        <div className="p-4 bg-card border border-border rounded-lg"><p className="text-sm text-muted-foreground">Receitas Mensais</p><p className="text-2xl font-bold text-success">{formatCurrency(totalMonthlyIncome)}</p></div>
      </div>
      <div className="flex items-center gap-2 mb-4">
        {(['all', 'active', 'paused'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-colors', filter === f ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted')}>
            {f === 'all' ? 'Todas' : f === 'active' ? 'Ativas' : 'Pausadas'}
          </button>
        ))}
      </div>
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg"><RefreshCw className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground mb-4">Nenhuma transação recorrente encontrada</p><Button onClick={onAdd}><Plus className="w-4 h-4 mr-2" />Criar Primeira Recorrência</Button></div>
      ) : (
        <div className="space-y-3">{filteredTransactions.map((transaction) => <RecurringTransactionCard key={transaction.id} transaction={transaction} onEdit={() => onEdit(transaction.id)} onDelete={() => onDelete(transaction.id)} onToggleStatus={() => onToggleStatus(transaction.id)} onProcess={() => onProcess(transaction.id)} />)}</div>
      )}
    </div>
  );
}

function RecurringTransactionCard({ transaction, onEdit, onDelete, onToggleStatus, onProcess }: { transaction: RecurringTransaction; onEdit: () => void; onDelete: () => void; onToggleStatus: () => void; onProcess: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[transaction.status]; const StatusIcon = config.icon;
  const isOverdue = transaction.status === 'active' && transaction.nextOccurrence < new Date();

  return (
    <div className={cn('bg-card border rounded-lg overflow-hidden transition-colors', isOverdue ? 'border-destructive/50' : 'border-border')}>
      <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4">
          <div className="w-1 h-12 rounded-full" style={{ backgroundColor: transaction.categoryColor || 'hsl(var(--muted-foreground))' }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-foreground truncate">{transaction.description}</span>
              <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', config.bgColor, config.color)}><StatusIcon className="w-3 h-3 inline mr-1" />{config.label}</span>
              {isOverdue && <span className="px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive rounded-full">Atrasado</span>}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" />{getRecurrenceText(transaction)}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Próxima: {format(transaction.nextOccurrence, 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
          </div>
          <div className="text-right"><p className={cn('text-lg font-semibold', transaction.type === 'expense' ? 'text-destructive' : 'text-success')}>{transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}</p><p className="text-xs text-muted-foreground">{transaction.category}</p></div>
          <ChevronRight className={cn('w-5 h-5 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-border">
          <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><dt className="text-muted-foreground">Início</dt><dd className="text-foreground">{format(transaction.startDate, 'dd/MM/yyyy', { locale: ptBR })}</dd></div>
            {transaction.endDate && <div><dt className="text-muted-foreground">Término</dt><dd className="text-foreground">{format(transaction.endDate, 'dd/MM/yyyy', { locale: ptBR })}</dd></div>}
            <div><dt className="text-muted-foreground">Ocorrências</dt><dd className="text-foreground">{transaction.completedOccurrences}{transaction.totalOccurrences ? ` / ${transaction.totalOccurrences}` : ''}</dd></div>
            {transaction.lastProcessedAt && <div><dt className="text-muted-foreground">Última execução</dt><dd className="text-foreground">{format(transaction.lastProcessedAt, 'dd/MM/yyyy', { locale: ptBR })}</dd></div>}
            {transaction.supplier && <div><dt className="text-muted-foreground">Fornecedor</dt><dd className="text-foreground">{transaction.supplier}</dd></div>}
            {transaction.customer && <div><dt className="text-muted-foreground">Cliente</dt><dd className="text-foreground">{transaction.customer}</dd></div>}
          </div>
          {transaction.notes && <div className="mt-4 text-sm"><dt className="text-muted-foreground mb-1">Observações</dt><dd className="text-foreground">{transaction.notes}</dd></div>}
          <div className="mt-4 flex items-center gap-2">
            {transaction.status === 'active' && <Button size="sm" onClick={onProcess}><Play className="w-4 h-4 mr-2" />Executar Agora</Button>}
            <Button size="sm" variant="outline" onClick={onToggleStatus}>{transaction.status === 'active' ? <><Pause className="w-4 h-4 mr-2" />Pausar</> : <><Play className="w-4 h-4 mr-2" />Ativar</>}</Button>
            <Button size="sm" variant="outline" onClick={onEdit}><Edit className="w-4 h-4 mr-2" />Editar</Button>
            <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="w-4 h-4 mr-2 text-destructive" />Excluir</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function getRecurrenceText(transaction: RecurringTransaction): string {
  const { recurrenceType, recurrenceInterval } = transaction;
  if (recurrenceInterval === 1) return recurrenceLabels[recurrenceType];
  const labels: Record<RecurrenceType, string> = { daily: `A cada ${recurrenceInterval} dias`, weekly: `A cada ${recurrenceInterval} semanas`, monthly: `A cada ${recurrenceInterval} meses`, yearly: `A cada ${recurrenceInterval} anos` };
  return labels[recurrenceType];
}

function getMonthlyAmount(transaction: RecurringTransaction): number {
  const { amount, recurrenceType, recurrenceInterval } = transaction;
  switch (recurrenceType) { case 'daily': return (amount / recurrenceInterval) * 30; case 'weekly': return (amount / recurrenceInterval) * 4; case 'monthly': return amount / recurrenceInterval; case 'yearly': return (amount / recurrenceInterval) / 12; default: return amount; }
}

function getNextOccurrence(currentDate: Date, recurrenceType: RecurrenceType, interval: number): Date {
  switch (recurrenceType) { case 'daily': return addDays(currentDate, interval); case 'weekly': return addWeeks(currentDate, interval); case 'monthly': return addMonths(currentDate, interval); case 'yearly': return addYears(currentDate, interval); default: return addMonths(currentDate, 1); }
}

function formatCurrency(value: number): string { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value); }

export type { RecurringTransaction, RecurrenceType, RecurrenceStatus };
export { getNextOccurrence, getRecurrenceText, getMonthlyAmount };
export default RecurringTransactions;