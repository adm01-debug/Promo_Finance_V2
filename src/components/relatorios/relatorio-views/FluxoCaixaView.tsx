import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';

export function FluxoCaixaView({ data }: { data: Record<string, unknown> }) {
  const periodo = data.periodo as { inicio: string; fim: string } | undefined;
  const receitas = data.receitas as { previsto: number; realizado: number; pendente: number } | undefined;
  const despesas = data.despesas as { previsto: number; realizado: number; pendente: number } | undefined;
  const saldo = data.saldo as { previsto: number; realizado: number } | undefined;

  return (
    <div className="space-y-6">
      {periodo && <div className="text-sm text-muted-foreground">Período: {format(new Date(periodo.inicio), 'dd/MM/yyyy')} a {format(new Date(periodo.fim), 'dd/MM/yyyy')}</div>}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-success/5 border-success/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />Receitas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm"><span>Previsto:</span><span className="font-medium">{formatCurrency(receitas?.previsto || 0)}</span></div>
            <div className="flex justify-between text-sm"><span>Realizado:</span><span className="font-medium text-success">{formatCurrency(receitas?.realizado || 0)}</span></div>
            <div className="flex justify-between text-sm"><span>Pendente:</span><span className="font-medium text-muted-foreground">{formatCurrency(receitas?.pendente || 0)}</span></div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" />Despesas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm"><span>Previsto:</span><span className="font-medium">{formatCurrency(despesas?.previsto || 0)}</span></div>
            <div className="flex justify-between text-sm"><span>Realizado:</span><span className="font-medium text-destructive">{formatCurrency(despesas?.realizado || 0)}</span></div>
            <div className="flex justify-between text-sm"><span>Pendente:</span><span className="font-medium text-muted-foreground">{formatCurrency(despesas?.pendente || 0)}</span></div>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" />Saldo</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center"><p className="text-sm text-muted-foreground">Previsto</p><p className="text-2xl font-bold text-primary">{formatCurrency(saldo?.previsto || 0)}</p></div>
            <div className="text-center"><p className="text-sm text-muted-foreground">Realizado</p><p className="text-2xl font-bold">{formatCurrency(saldo?.realizado || 0)}</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
