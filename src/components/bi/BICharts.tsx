import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Line, Legend, ComposedChart
} from "recharts";
import { formatCurrency } from "@/lib/formatters";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface EvolucaoChartProps {
  evolucaoMensal: Array<{ mes: string; receitas: number; despesas: number; lucro: number; margem: number }>;
  statusReceber: Array<{ name: string; value: number; color: string }>;
}

export function BIEvolucaoChart({ evolucaoMensal, statusReceber }: EvolucaoChartProps) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Evolução Financeira</CardTitle>
          <CardDescription>Receitas, despesas e lucro mensal</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={evolucaoMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Area type="monotone" dataKey="receitas" name="Receitas" fill="hsl(var(--success) / 0.2)" stroke="hsl(var(--success))" />
              <Area type="monotone" dataKey="despesas" name="Despesas" fill="hsl(var(--destructive) / 0.2)" stroke="hsl(var(--destructive))" />
              <Line type="monotone" dataKey="lucro" name="Lucro" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status Recebimentos</CardTitle>
          <CardDescription>Distribuição por situação</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusReceber} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {statusReceber.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {statusReceber.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AgingChartProps {
  agingReceber: Array<{ faixa: string; valor: number; fill: string }>;
  topClientes: Array<{ nome: string; valor: number }>;
}

export function BIAgingChart({ agingReceber, topClientes }: AgingChartProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aging de Recebíveis</CardTitle>
          <CardDescription>Análise por faixa de vencimento</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agingReceber} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="faixa" width={80} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                {agingReceber.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 5 Clientes</CardTitle>
          <CardDescription>Maior faturamento recebido</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topClientes.map((cliente, idx) => {
              const maxValor = topClientes[0]?.valor || 1;
              const percent = (cliente.valor / maxValor) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[180px]">{cliente.nome}</span>
                    <span className="font-medium">{formatCurrency(cliente.valor)}</span>
                  </div>
                  <Progress value={percent} className="h-2" />
                </div>
              );
            })}
            {topClientes.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CentrosChartProps {
  distribuicaoCentros: Array<{ nome: string; valor: number }>;
}

export function BICentrosChart({ distribuicaoCentros }: CentrosChartProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Despesas por Centro de Custo</CardTitle>
          <CardDescription>Distribuição dos gastos</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={distribuicaoCentros} cx="50%" cy="50%" outerRadius={100} dataKey="valor"
                label={({ nome, percent }) => `${nome.substring(0, 10)}... ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {distribuicaoCentros.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento</CardTitle>
          <CardDescription>Valores por centro de custo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {distribuicaoCentros.map((centro, idx) => {
              const total = distribuicaoCentros.reduce((acc, c) => acc + c.valor, 0);
              const percent = total > 0 ? (centro.valor / total) * 100 : 0;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">{centro.nome}</span>
                      <span className="font-medium ml-2">{formatCurrency(centro.valor)}</span>
                    </div>
                    <Progress value={percent} className="h-1.5 mt-1" />
                  </div>
                </div>
              );
            })}
            {distribuicaoCentros.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
