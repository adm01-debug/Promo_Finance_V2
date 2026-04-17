import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface DadoComparativo {
  categoria: string;
  antigo: number;
  novo: number;
}

interface DadoProjecao {
  ano: string;
  antigo: number;
  novo: number;
  diferenca: number;
}

interface SimuladorChartsGridProps {
  dadosComparativo: DadoComparativo[];
  dadosProjecao: DadoProjecao[];
}

export function SimuladorChartsGrid({ dadosComparativo, dadosProjecao }: SimuladorChartsGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Comparativo por Tributo</CardTitle>
          <CardDescription>Sistema antigo vs novo</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosComparativo}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="antigo" name="Sistema Antigo" fill="hsl(var(--muted-foreground))" />
              <Bar dataKey="novo" name="Sistema Novo" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projeção 2026-2033</CardTitle>
          <CardDescription>Evolução durante a transição</CardDescription>
        </CardHeader>
        <CardContent>
          {dadosProjecao.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosProjecao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ano" />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <Line
                  type="monotone"
                  dataKey="antigo"
                  name="Sistema Antigo"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Line
                  type="monotone"
                  dataKey="novo"
                  name="Sistema Novo"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Clique em "Projetar 2026-2033" para visualizar</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
