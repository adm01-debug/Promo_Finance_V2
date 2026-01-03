import { useBIContext } from '../context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';

export function BIMetricsCards() {
  const { metrics, isLoading } = useBIContext();
  
  const cards = [
    { title: 'Receita', value: metrics?.revenue || 0, icon: TrendingUp, color: 'text-green-500' },
    { title: 'Despesas', value: metrics?.expenses || 0, icon: TrendingDown, color: 'text-red-500' },
    { title: 'Lucro', value: metrics?.profit || 0, icon: DollarSign, color: 'text-blue-500' },
    { title: 'Saldo', value: (metrics?.revenue || 0) - (metrics?.expenses || 0), icon: Wallet, color: 'text-purple-500' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : `R$ ${card.value.toLocaleString('pt-BR')}`}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
