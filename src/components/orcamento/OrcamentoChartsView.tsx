import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip,
  Legend, CartesianGrid, PieChart, Pie, Cell, ComposedChart, Line, Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(215, 90%, 42%)',
];

export interface ChartDataItem {
  nome: string;
  nomeCompleto: string;
  orcamento: number;
  realizado: number;
  receita: number;
  disponivel: number;
}

export function OrcamentoChartsView({ chartData }: { chartData: ChartDataItem[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orçamento vs Realizado</CardTitle>
          <CardDescription>Comparativo por centro de custo</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="nome" className="text-xs fill-muted-foreground" />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs fill-muted-foreground" />
              <ReTooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Bar dataKey="orcamento" name="Orçamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realizado" name="Realizado" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="receita" name="Receita" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Margem por Centro de Custo</CardTitle>
          <CardDescription>Receita - Despesas</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="nome" className="text-xs fill-muted-foreground" />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs fill-muted-foreground" />
              <ReTooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Area dataKey="receita" name="Receita" fill="hsl(var(--success) / 0.2)" stroke="hsl(var(--success))" />
              <Bar dataKey="realizado" name="Gasto" fill="hsl(var(--destructive) / 0.7)" radius={[4, 4, 0, 0]} />
              <Line dataKey="disponivel" name="Disponível" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Distribuição de Gastos</CardTitle>
          <CardDescription>Proporção de cada centro de custo no gasto total</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.filter(d => d.realizado > 0)}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="realizado"
                nameKey="nomeCompleto"
                label={({ nomeCompleto, percent }) => `${nomeCompleto}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <ReTooltip
                formatter={(value: number) => [formatCurrency(value), 'Gasto']}
                contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
