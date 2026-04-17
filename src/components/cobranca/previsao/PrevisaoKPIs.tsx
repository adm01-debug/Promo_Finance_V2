import { Users, AlertTriangle, Target, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';

interface PrevisaoKPIsProps {
  totalEmRisco: number;
  clientesAltoRisco: number;
  clientesMedioRisco: number;
  valorTotalRisco: number;
}

export function PrevisaoKPIs({
  totalEmRisco,
  clientesAltoRisco,
  clientesMedioRisco,
  valorTotalRisco,
}: PrevisaoKPIsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Analisado</span>
          </div>
          <p className="text-2xl font-bold">{totalEmRisco}</p>
          <p className="text-xs text-muted-foreground">clientes com vencimentos</p>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Alto Risco</span>
          </div>
          <p className="text-2xl font-bold text-destructive">{clientesAltoRisco}</p>
          <p className="text-xs text-muted-foreground">requerem ação imediata</p>
        </CardContent>
      </Card>

      <Card className="border-warning/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-warning" />
            <span className="text-xs text-muted-foreground">Médio Risco</span>
          </div>
          <p className="text-2xl font-bold text-warning">{clientesMedioRisco}</p>
          <p className="text-xs text-muted-foreground">monitorar de perto</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Valor em Risco</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(valorTotalRisco)}</p>
          <p className="text-xs text-muted-foreground">potencial de perda</p>
        </CardContent>
      </Card>
    </div>
  );
}
