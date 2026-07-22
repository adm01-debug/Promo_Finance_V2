import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface KpisCardsProps {
  totalOportunidades: number;
  totalAplicaveis: number;
  economiaTotal: number;
}

export function KpisCards({ totalOportunidades, totalAplicaveis, economiaTotal }: KpisCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Estratégias analisadas</CardDescription>
          <CardTitle className="text-3xl">{totalOportunidades}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-success/30 bg-success/5">
        <CardHeader className="pb-2">
          <CardDescription>Aplicáveis ao seu perfil</CardDescription>
          <CardTitle className="text-3xl text-success">{totalAplicaveis}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardDescription>Economia estimada anual</CardDescription>
          <CardTitle className="text-3xl text-primary flex items-center gap-2">
            <TrendingUp className="h-7 w-7" />
            {formatCurrency(economiaTotal)}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
