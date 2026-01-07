import { DollarSign, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface ContasReceberKPIsProps {
  totalReceber: number;
  totalRecebidoMes: number;
  totalVencido: number;
  taxaInadimplencia: number;
}

export function ContasReceberKPIs({
  totalReceber,
  totalRecebidoMes,
  totalVencido,
  taxaInadimplencia,
}: ContasReceberKPIsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="stat-card group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total a Receber</p>
              <p className="text-2xl font-bold font-display mt-1">{formatCurrency(totalReceber)}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-card group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Recebido no Mês</p>
              <p className="text-2xl font-bold font-display mt-1">{formatCurrency(totalRecebidoMes)}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center transition-transform group-hover:scale-110">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-card group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Vencido</p>
              <p className="text-2xl font-bold font-display mt-1 text-destructive">{formatCurrency(totalVencido)}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center transition-transform group-hover:scale-110">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-card group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Inadimplência</p>
              <p className="text-2xl font-bold font-display mt-1">{taxaInadimplencia.toFixed(1)}%</p>
              <div className="mt-2">
                <Progress value={taxaInadimplencia} className="h-2" />
              </div>
            </div>
            <div className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
              taxaInadimplencia > 10 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
            )}>
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
