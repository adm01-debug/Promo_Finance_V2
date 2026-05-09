import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, AlertTriangle, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useBudgetsWithSpent } from '@/hooks/useBudget';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const AlertasOrcamento = () => {
  const currentPeriod = format(new Date(), 'yyyy-MM');
  const { data: budgets = [], isLoading } = useBudgetsWithSpent(currentPeriod);

  const criticalBudgets = budgets
    .filter(b => b.percent_used >= 80)
    .sort((a, b) => b.percent_used - a.percent_used);

  if (isLoading) return <Card className="bg-white/5 border-white/10 animate-pulse"><CardContent className="h-40" /></Card>;

  if (criticalBudgets.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Saúde Orçamentária
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center mb-3">
              <Target className="h-5 w-5 text-success" />
            </div>
            <p className="text-xs text-white/60 font-medium">Todos os orçamentos estão dentro do planejado.</p>
            <Link to="/orcamentos" className="text-[10px] text-primary mt-2 font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Alertas de Orçamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {criticalBudgets.slice(0, 3).map((budget: any) => {
            const isOver = budget.percent_used > 100;
            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/60 font-medium">{budget.category}</span>
                  <span className={cn("font-bold", isOver ? "text-red-500" : "text-orange-500")}>
                    {budget.percent_used.toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(budget.percent_used, 100)} 
                  className={cn("h-1 bg-white/5", isOver ? "bg-red-500" : "bg-orange-500")} 
                />
                <div className="flex justify-between text-[10px] text-white/40">
                  <span>Gasto: {formatCurrency(budget.actual_spent)}</span>
                  <span>Limite: {formatCurrency(budget.budgeted_amount)}</span>
                </div>
              </div>
            );
          })}
          
          <Link 
            to="/orcamentos" 
            className="flex items-center justify-center w-full py-2 mt-2 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/60 hover:bg-white/5 transition-colors group"
          >
            Gerenciar Orçamentos
            <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
