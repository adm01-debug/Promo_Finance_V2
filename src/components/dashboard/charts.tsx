import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface ChartData { name: string; value: number; [key: string]: string | number; }

interface DashboardChartsProps { cashFlowData?: ChartData[]; expensesByCategoryData?: ChartData[]; monthlyComparisonData?: ChartData[]; className?: string; }

const COLORS = ['hsl(var(--secondary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--primary))', 'hsl(var(--streak))', 'hsl(var(--coins))', 'hsl(var(--xp))'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover p-3 rounded-lg shadow-lg border border-border">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">{entry.name}: {formatCurrency(entry.value)}</p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover p-3 rounded-lg shadow-lg border border-border">
        <p className="font-medium text-foreground">{payload[0].name}</p>
        <p className="text-sm" style={{ color: payload[0].payload.fill }}>{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export function CashFlowChart({ data, className }: { data?: ChartData[]; className?: string }) {
  const chartData = useMemo(() => data || [
    { name: 'Jan', receitas: 45000, despesas: 32000 }, { name: 'Fev', receitas: 52000, despesas: 38000 },
    { name: 'Mar', receitas: 48000, despesas: 35000 }, { name: 'Abr', receitas: 61000, despesas: 42000 },
    { name: 'Mai', receitas: 55000, despesas: 40000 }, { name: 'Jun', receitas: 67000, despesas: 45000 },
  ], [data]);

  return (
    <div className={cn('bg-card rounded-lg shadow p-4', className)}>
      <h3 className="text-lg font-semibold text-foreground mb-4">Fluxo de Caixa</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area type="monotone" dataKey="receitas" name="Receitas" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorReceitas)" />
          <Area type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorDespesas)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExpensesByCategoryChart({ data, className }: { data?: ChartData[]; className?: string }) {
  const chartData = useMemo(() => data || [
    { name: 'Fornecedores', value: 25000 }, { name: 'Salários', value: 18000 }, { name: 'Aluguel', value: 8000 },
    { name: 'Marketing', value: 5000 }, { name: 'Utilidades', value: 3000 }, { name: 'Outros', value: 4000 },
  ], [data]);

  return (
    <div className={cn('bg-card rounded-lg shadow p-4', className)}>
      <h3 className="text-lg font-semibold text-foreground mb-4">Despesas por Categoria</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
            {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyComparisonChart({ data, className }: { data?: ChartData[]; className?: string }) {
  const chartData = useMemo(() => data || [
    { name: 'Jan', atual: 45000, anterior: 38000 }, { name: 'Fev', atual: 52000, anterior: 42000 },
    { name: 'Mar', atual: 48000, anterior: 45000 }, { name: 'Abr', atual: 61000, anterior: 50000 },
    { name: 'Mai', atual: 55000, anterior: 48000 }, { name: 'Jun', atual: 67000, anterior: 55000 },
  ], [data]);

  return (
    <div className={cn('bg-card rounded-lg shadow p-4', className)}>
      <h3 className="text-lg font-semibold text-foreground mb-4">Comparativo Mensal</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="atual" name="Ano Atual" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="anterior" name="Ano Anterior" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueChart({ data, className }: { data?: ChartData[]; className?: string }) {
  const chartData = useMemo(() => data || [
    { name: 'Jan', value: 45000 }, { name: 'Fev', value: 52000 }, { name: 'Mar', value: 48000 },
    { name: 'Abr', value: 61000 }, { name: 'Mai', value: 55000 }, { name: 'Jun', value: 67000 },
  ], [data]);

  return (
    <div className={cn('bg-card rounded-lg shadow p-4', className)}>
      <h3 className="text-lg font-semibold text-foreground mb-4">Evolução de Receitas</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="value" name="Receita" stroke="hsl(var(--success))" strokeWidth={3}
            dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardCharts({ cashFlowData, expensesByCategoryData, monthlyComparisonData, className }: DashboardChartsProps) {
  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-6', className)}>
      <CashFlowChart data={cashFlowData} />
      <ExpensesByCategoryChart data={expensesByCategoryData} />
      <MonthlyComparisonChart data={monthlyComparisonData} className="lg:col-span-2" />
    </div>
  );
}

export default DashboardCharts;
