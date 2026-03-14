import { useState } from 'react';
import { Target, Plus, Edit, Trash2, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type BudgetType = 'income' | 'expense' | 'savings';
type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly' | 'custom';
type BudgetStatus = 'on_track' | 'at_risk' | 'exceeded' | 'completed';

interface Budget { id: string; name: string; description?: string; type: BudgetType; category?: string; categoryColor?: string; targetAmount: number; currentAmount: number; period: BudgetPeriod; startDate: Date; endDate: Date; alertThreshold?: number; status: BudgetStatus; }

interface BudgetTrackingProps { budgets: Budget[]; onAdd: () => void; onEdit: (id: string) => void; onDelete: (id: string) => void; className?: string; }

const typeConfig: Record<BudgetType, { label: string; color: string; bgColor: string; icon: typeof Target }> = {
  income: { label: 'Receita', color: 'text-success', bgColor: 'bg-success/10', icon: TrendingUp },
  expense: { label: 'Despesa', color: 'text-destructive', bgColor: 'bg-destructive/10', icon: TrendingDown },
  savings: { label: 'Economia', color: 'text-primary', bgColor: 'bg-primary/10', icon: DollarSign },
};

const statusConfig: Record<BudgetStatus, { label: string; color: string; bgColor: string; icon: typeof CheckCircle }> = {
  on_track: { label: 'No caminho', color: 'text-success', bgColor: 'bg-success/10', icon: CheckCircle },
  at_risk: { label: 'Em risco', color: 'text-warning', bgColor: 'bg-warning/10', icon: AlertCircle },
  exceeded: { label: 'Excedido', color: 'text-destructive', bgColor: 'bg-destructive/10', icon: AlertCircle },
  completed: { label: 'Concluído', color: 'text-primary', bgColor: 'bg-primary/10', icon: CheckCircle },
};

export function BudgetTracking({ budgets, onAdd, onEdit, onDelete, className }: BudgetTrackingProps) {
  const [filter, setFilter] = useState<BudgetType | 'all'>('all');
  const filteredBudgets = budgets.filter((b) => filter === 'all' || b.type === filter);
  const summary = { total: budgets.length, onTrack: budgets.filter((b) => b.status === 'on_track').length, atRisk: budgets.filter((b) => b.status === 'at_risk').length, exceeded: budgets.filter((b) => b.status === 'exceeded').length };

  return (
    <div className={cn('', className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2"><Target className="w-5 h-5 text-muted-foreground" /><h2 className="text-lg font-semibold text-foreground">Metas e Orçamentos</h2></div>
        <Button onClick={onAdd}><Plus className="w-4 h-4 mr-2" />Nova Meta</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total de Metas" value={summary.total} icon={<Target className="w-5 h-5" />} color="text-muted-foreground" />
        <SummaryCard label="No Caminho" value={summary.onTrack} icon={<CheckCircle className="w-5 h-5" />} color="text-success" />
        <SummaryCard label="Em Risco" value={summary.atRisk} icon={<AlertCircle className="w-5 h-5" />} color="text-warning" />
        <SummaryCard label="Excedidas" value={summary.exceeded} icon={<AlertCircle className="w-5 h-5" />} color="text-destructive" />
      </div>
      <div className="flex items-center gap-2 mb-4">
        {(['all', 'expense', 'income', 'savings'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-colors', filter === f ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted')}>
            {f === 'all' ? 'Todas' : typeConfig[f].label}
          </button>
        ))}
      </div>
      {filteredBudgets.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg"><Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground mb-4">Nenhuma meta encontrada</p><Button onClick={onAdd}><Plus className="w-4 h-4 mr-2" />Criar Primeira Meta</Button></div>
      ) : (
        <div className="space-y-4">{filteredBudgets.map((budget) => <BudgetCard key={budget.id} budget={budget} onEdit={() => onEdit(budget.id)} onDelete={() => onDelete(budget.id)} />)}</div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-3"><div className={cn('opacity-70', color)}>{icon}</div><div><p className="text-2xl font-bold text-foreground">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div></div>
    </div>
  );
}

function BudgetCard({ budget, onEdit, onDelete }: { budget: Budget; onEdit: () => void; onDelete: () => void }) {
  const typeConf = typeConfig[budget.type]; const statusConf = statusConfig[budget.status];
  const TypeIcon = typeConf.icon; const StatusIcon = statusConf.icon;
  const percentage = Math.min((budget.currentAmount / budget.targetAmount) * 100, 100);
  const isExpense = budget.type === 'expense'; const remaining = budget.targetAmount - budget.currentAmount;
  const daysRemaining = differenceInDays(budget.endDate, new Date()); const isExpired = daysRemaining < 0;
  const progressColor = isExpense
    ? percentage >= 100 ? 'bg-destructive' : percentage >= 80 ? 'bg-warning' : 'bg-success'
    : percentage >= 100 ? 'bg-success' : percentage >= 80 ? 'bg-primary' : 'bg-muted-foreground';

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', typeConf.bgColor)}><TypeIcon className={cn('w-5 h-5', typeConf.color)} /></div>
          <div>
            <div className="flex items-center gap-2"><h3 className="font-semibold text-foreground">{budget.name}</h3><span className={cn('px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1', statusConf.bgColor, statusConf.color)}><StatusIcon className="w-3 h-3" />{statusConf.label}</span></div>
            {budget.category && <p className="text-sm text-muted-foreground">{budget.category}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="w-4 h-4 text-destructive" /></Button>
        </div>
      </div>
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2"><span className="text-muted-foreground">{formatCurrency(budget.currentAmount)} de {formatCurrency(budget.targetAmount)}</span><span className={cn('font-medium', statusConf.color)}>{percentage.toFixed(0)}%</span></div>
        <div className="h-2 bg-muted rounded-full overflow-hidden"><div className={cn('h-full rounded-full transition-all', progressColor)} style={{ width: `${Math.min(percentage, 100)}%` }} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div><p className="text-muted-foreground">{isExpense ? 'Disponível' : 'Faltam'}</p><p className={cn('font-semibold', isExpense ? (remaining >= 0 ? 'text-success' : 'text-destructive') : (remaining <= 0 ? 'text-success' : 'text-foreground'))}>{formatCurrency(Math.abs(remaining))}</p></div>
        <div><p className="text-muted-foreground">Período</p><p className="font-semibold text-foreground">{format(budget.startDate, 'dd/MM', { locale: ptBR })} - {format(budget.endDate, 'dd/MM', { locale: ptBR })}</p></div>
        <div><p className="text-muted-foreground">Dias restantes</p><p className={cn('font-semibold', isExpired ? 'text-destructive' : daysRemaining <= 7 ? 'text-warning' : 'text-foreground')}>{isExpired ? 'Expirado' : `${daysRemaining} dias`}</p></div>
      </div>
      {budget.description && <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">{budget.description}</p>}
    </div>
  );
}

interface BudgetFormData { name: string; description?: string; type: BudgetType; category?: string; targetAmount: number; period: BudgetPeriod; startDate: Date; endDate: Date; alertThreshold?: number; }
interface BudgetFormProps { initialData?: Partial<BudgetFormData>; onSubmit: (data: BudgetFormData) => void; onCancel: () => void; }

export function BudgetForm({ initialData, onSubmit, onCancel }: BudgetFormProps) {
  const [formData, setFormData] = useState<BudgetFormData>({ name: initialData?.name || '', description: initialData?.description || '', type: initialData?.type || 'expense', category: initialData?.category || '', targetAmount: initialData?.targetAmount || 0, period: initialData?.period || 'monthly', startDate: initialData?.startDate || new Date(), endDate: initialData?.endDate || new Date(), alertThreshold: initialData?.alertThreshold || 80 });
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(formData); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="block text-sm font-medium text-foreground mb-1">Nome da Meta</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" required /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-foreground mb-1">Tipo</label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as BudgetType })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"><option value="expense">Despesa</option><option value="income">Receita</option><option value="savings">Economia</option></select></div>
        <div><label className="block text-sm font-medium text-foreground mb-1">Valor Alvo</label><input type="number" value={formData.targetAmount} onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" min="0" step="0.01" required /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-foreground mb-1">Data Início</label><input type="date" value={format(formData.startDate, 'yyyy-MM-dd')} onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" required /></div>
        <div><label className="block text-sm font-medium text-foreground mb-1">Data Fim</label><input type="date" value={format(formData.endDate, 'yyyy-MM-dd')} onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" required /></div>
      </div>
      <div><label className="block text-sm font-medium text-foreground mb-1">Descrição (opcional)</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground" rows={3} /></div>
      <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button><Button type="submit">Salvar</Button></div>
    </form>
  );
}

function formatCurrency(value: number): string { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value); }

export type { Budget, BudgetType, BudgetPeriod, BudgetStatus, BudgetFormData };
export default BudgetTracking;