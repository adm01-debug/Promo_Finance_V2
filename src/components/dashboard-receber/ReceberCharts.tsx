import { motion } from "framer-motion";
import { BarChart3, Users, TrendingUp, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { differenceInDays, parseISO } from "date-fns";

interface ReceberChartsProps {
  agingData: Array<{ name: string; value: number; fill: string }>;
  topClientes: Array<{ nome: string; valor: number; vencido: number }>;
  evolucaoMensal: Array<{ mes: string; recebido: number; aReceber: number; vencido: number }>;
  contasVencidasDetalhes: Array<{
    id: string;
    cliente_nome: string;
    descricao: string;
    valor: number;
    valor_recebido: number | null;
    data_vencimento: string;
    status: string;
  }>;
}

export function ReceberChartsSection({ agingData, topClientes, evolucaoMensal, contasVencidasDetalhes }: ReceberChartsProps) {
  return (
    <Tabs defaultValue="aging" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
        <TabsTrigger value="aging" className="gap-2"><BarChart3 className="h-4 w-4" />Aging</TabsTrigger>
        <TabsTrigger value="clientes" className="gap-2"><Users className="h-4 w-4" />Clientes</TabsTrigger>
        <TabsTrigger value="evolucao" className="gap-2"><TrendingUp className="h-4 w-4" />Evolução</TabsTrigger>
        <TabsTrigger value="detalhes" className="gap-2"><Eye className="h-4 w-4" />Detalhes</TabsTrigger>
      </TabsList>

      <TabsContent value="aging">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Aging de Recebíveis</CardTitle>
              <CardDescription>Distribuição por tempo de atraso</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agingData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {agingData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Faixa</CardTitle>
              <CardDescription>Percentual por tempo de atraso</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={agingData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {agingData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="clientes">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Clientes - Valores a Receber</CardTitle>
            <CardDescription>Maiores devedores ordenados por valor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topClientes.map((cliente, index) => (
                <motion.div key={cliente.nome} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-card">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">{index + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{cliente.nome}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Total: {formatCurrency(cliente.valor)}</span>
                      {cliente.vencido > 0 && <Badge variant="destructive" className="text-xs">{formatCurrency(cliente.vencido)} vencido</Badge>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(cliente.valor)}</p>
                    {cliente.vencido > 0 && <p className="text-xs text-destructive">{((cliente.vencido / cliente.valor) * 100).toFixed(0)}% vencido</p>}
                  </div>
                </motion.div>
              ))}
              {topClientes.length === 0 && <div className="text-center py-8 text-muted-foreground">Nenhum cliente com valores pendentes</div>}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="evolucao">
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
            <CardDescription>Recebido vs A Receber vs Vencido</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Area type="monotone" dataKey="recebido" name="Recebido" stackId="1" stroke="hsl(var(--success))" fill="hsl(var(--success)/0.3)" />
                <Area type="monotone" dataKey="aReceber" name="A Receber" stackId="1" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2)/0.3)" />
                <Area type="monotone" dataKey="vencido" name="Vencido" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive)/0.3)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="detalhes">
        <Card>
          <CardHeader>
            <CardTitle>Contas Vencidas - Drill Down</CardTitle>
            <CardDescription>Top 15 maiores valores vencidos para ação imediata</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Dias Atraso</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasVencidasDetalhes.map((conta) => {
                    const diasAtraso = differenceInDays(new Date(), parseISO(conta.data_vencimento));
                    const valorPendente = conta.valor - (conta.valor_recebido || 0);
                    return (
                      <TableRow key={conta.id}>
                        <TableCell className="font-medium">{conta.cliente_nome}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{conta.descricao}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(valorPendente)}</TableCell>
                        <TableCell>{formatDate(conta.data_vencimento)}</TableCell>
                        <TableCell><Badge variant={diasAtraso > 30 ? "destructive" : "secondary"}>{diasAtraso} dias</Badge></TableCell>
                        <TableCell><Badge variant="outline">{conta.status}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                  {contasVencidasDetalhes.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma conta vencida encontrada com os filtros selecionados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
