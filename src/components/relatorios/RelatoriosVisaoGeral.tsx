import { Loader2 } from 'lucide-react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, ComposedChart, BarChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--success))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

interface RelatoriosVisaoGeralProps {
  fluxoMensal: Array<{ mes: string; receitas: number; despesas: number; saldo: number }> | undefined;
  despesasPorCategoria: Array<{ nome: string; valor: number; percentual: number }> | undefined;
  receitasPorCliente: Array<{ cliente: string; valor: number }> | undefined;
  inadimplenciaPorMes: Array<{ mes: string; taxa: number; valor: number }> | undefined;
  loadingFluxo: boolean;
  loadingDespesas: boolean;
}

export function RelatoriosVisaoGeral({ fluxoMensal, despesasPorCategoria, receitasPorCliente, inadimplenciaPorMes, loadingFluxo, loadingDespesas }: RelatoriosVisaoGeralProps) {
  const tooltipStyle = { backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="h-[400px]">
        <CardHeader className="pb-2"><CardTitle className="text-lg">Fluxo de Caixa Mensal</CardTitle><CardDescription>Receitas, despesas e saldo por mês</CardDescription></CardHeader>
        <CardContent className="h-[300px]">
          {loadingFluxo ? <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={fluxoMensal || []}>
                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="saldo" name="Saldo" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="h-[400px]">
        <CardHeader className="pb-2"><CardTitle className="text-lg">Despesas por Categoria</CardTitle><CardDescription>Distribuição de gastos</CardDescription></CardHeader>
        <CardContent className="h-[300px]">
          {loadingDespesas ? <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> : (despesasPorCategoria || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><PieChartIcon className="h-12 w-12 mb-2 opacity-20" /><p>Sem dados de despesas</p></div>
          ) : (
            <div className="flex h-full">
              <div className="w-1/2"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={despesasPorCategoria} dataKey="valor" nameKey="nome" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>{(despesasPorCategoria || []).map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => formatCurrency(v)} /></PieChart></ResponsiveContainer></div>
              <div className="w-1/2 flex flex-col justify-center space-y-2">{(despesasPorCategoria || []).map((cat, i) => (<div key={cat.nome} className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i] }} /><span className="truncate">{cat.nome}</span></div><span className="font-medium">{cat.percentual.toFixed(1)}%</span></div>))}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="h-[400px]">
        <CardHeader className="pb-2"><CardTitle className="text-lg">Receitas por Cliente</CardTitle><CardDescription>Top clientes do período</CardDescription></CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={receitasPorCliente} layout="vertical">
              <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis dataKey="cliente" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
              <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="h-[400px]">
        <CardHeader className="pb-2"><CardTitle className="text-lg">Evolução da Inadimplência</CardTitle><CardDescription>Taxa e valor em atraso por mês</CardDescription></CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={inadimplenciaPorMes}>
              <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis yAxisId="left" tickFormatter={(v) => `${v}%`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip formatter={(v: number, name: string) => name === 'taxa' ? `${v}%` : formatCurrency(v)} contentStyle={tooltipStyle} />
              <Legend />
              <Bar yAxisId="right" dataKey="valor" name="Valor em Atraso" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              <Line yAxisId="left" type="monotone" dataKey="taxa" name="Taxa (%)" stroke="hsl(var(--warning))" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
