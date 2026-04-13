import { FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ConciliacaoBatchKpisProps {
  totalTransacoes: number;
  conciliadas: number;
  pendentes: number;
  percentualConciliado: number;
}

export function ConciliacaoBatchKpis({ totalTransacoes, conciliadas, pendentes, percentualConciliado }: ConciliacaoBatchKpisProps) {
  if (totalTransacoes === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="stat-card group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-sm font-medium text-muted-foreground">Importação Atual</p><p className="text-2xl font-bold font-display mt-1">{totalTransacoes}</p><p className="text-xs text-muted-foreground mt-1">transações no lote</p></div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><FileText className="h-6 w-6" /></div>
          </div>
        </CardContent>
      </Card>
      <Card className="stat-card group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-sm font-medium text-muted-foreground">Conciliadas (Lote)</p><p className="text-2xl font-bold font-display mt-1 text-success">{conciliadas}</p><Progress value={percentualConciliado} className="h-1.5 mt-2 w-24" /></div>
            <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center"><CheckCircle2 className="h-6 w-6" /></div>
          </div>
        </CardContent>
      </Card>
      <Card className="stat-card group border-warning/50">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div><p className="text-sm font-medium text-muted-foreground">Pendentes (Lote)</p><p className="text-2xl font-bold font-display mt-1 text-warning">{pendentes}</p><p className="text-xs text-muted-foreground mt-1">Aguardando</p></div>
            <div className="h-12 w-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center"><AlertTriangle className="h-6 w-6" /></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
