import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, CheckCircle2, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export interface PerDcompEstatisticas {
  total: number;
  transmitidos: number;
  emAnalise: number;
  deferidos: number;
  valorTotalCompensado: number;
}

export function PerDcompStats({ estatisticas }: { estatisticas: PerDcompEstatisticas }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Pedidos</p>
              <p className="text-2xl font-bold">{estatisticas.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Em Análise</p>
              <p className="text-2xl font-bold">{estatisticas.transmitidos + estatisticas.emAnalise}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Deferidos</p>
              <p className="text-2xl font-bold">{estatisticas.deferidos}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Valor Compensado</p>
              <p className="text-2xl font-bold">{formatCurrency(estatisticas.valorTotalCompensado)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
