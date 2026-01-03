import { useBIContext } from '../context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function BIChartsSection() {
  const { metrics, isLoading } = useBIContext();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Receitas vs Despesas</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          {isLoading ? 'Carregando...' : 'Gráfico de receitas e despesas'}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          {isLoading ? 'Carregando...' : 'Gráfico de evolução'}
        </CardContent>
      </Card>
    </div>
  );
}
