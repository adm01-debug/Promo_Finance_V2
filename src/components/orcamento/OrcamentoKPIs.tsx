import { Target, TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export interface OrcamentoKPIsData {
  totalOrcamento: number;
  totalGasto: number;
  totalReceita: number;
  estourados: number;
  atencao: number;
  disponivel: number;
}

export function OrcamentoKPIs({ kpis }: { kpis: OrcamentoKPIsData }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Orçamento Total</span>
          </div>
          <p className="text-lg font-bold">{formatCurrency(kpis.totalOrcamento)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Total Gasto</span>
          </div>
          <p className="text-lg font-bold">{formatCurrency(kpis.totalGasto)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">Total Receita</span>
          </div>
          <p className="text-lg font-bold">{formatCurrency(kpis.totalReceita)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Disponível</span>
          </div>
          <p className={cn('text-lg font-bold', kpis.disponivel < 0 ? 'text-destructive' : 'text-success')}>
            {formatCurrency(kpis.disponivel)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-xs text-muted-foreground">Em Atenção</span>
          </div>
          <p className="text-lg font-bold text-warning">{kpis.atencao}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Estourados</span>
          </div>
          <p className="text-lg font-bold text-destructive">{kpis.estourados}</p>
        </CardContent>
      </Card>
    </div>
  );
}
