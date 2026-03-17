import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  DollarSign, BarChart3, PieChart as PieChartIcon, Building2,
  Loader2, Filter, ArrowUpDown, Sparkles, Zap,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip,
  Legend, CartesianGrid, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  ComposedChart, Line, Area,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { InsightsIA } from '@/components/relatorios/InsightsIA';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(215, 90%, 42%)',
];

interface CentroCustoComGastos {
  id: string;
  codigo: string;
  nome: string;
  tipo: string | null;
  responsavel: string | null;
  orcamento_previsto: number;
  orcamento_realizado: number;
  gasto_real_pagar: number;
  gasto_real_receber: number;
  qtd_pagar: number;
  qtd_receber: number;
  margem: number;
  percentual_usado: number;
  status: 'ok' | 'atencao' | 'estouro';
}

export default function OrcamentoEvento() {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [ordenacao, setOrdenacao] = useState<string>('nome');

  // Fetch centros de custo with linked financial data
  const { data: centrosComGastos, isLoading } = useQuery({
    queryKey: ['orcamento-vs-realizado'],
    queryFn: async () => {
      const [centrosRes, pagarRes, receberRes] = await Promise.all([
        supabase.from('centros_custo').select('*').eq('ativo', true).order('nome'),
        supabase.from('contas_pagar').select('centro_custo_id, valor, valor_pago, status'),
        supabase.from('contas_receber').select('centro_custo_id, valor, valor_recebido, status'),
      ]);

      const centros = centrosRes.data || [];
      const pagar = pagarRes.data || [];
      const receber = receberRes.data || [];

      return centros.map((cc): CentroCustoComGastos => {
        const contasPagar = pagar.filter(p => p.centro_custo_id === cc.id);
        const contasReceber = receber.filter(r => r.centro_custo_id === cc.id);

        const gastoPagar = contasPagar.reduce((acc, c) => acc + (c.valor_pago || c.valor || 0), 0);
        const gastoReceber = contasReceber
          .filter(c => c.status === 'pago')
          .reduce((acc, c) => acc + (c.valor_recebido || c.valor || 0), 0);

        const totalGasto = gastoPagar;
        const orcamento = cc.orcamento_previsto || 0;
        const percentual = orcamento > 0 ? (totalGasto / orcamento) * 100 : 0;

        return {
          id: cc.id,
          codigo: cc.codigo,
          nome: cc.nome,
          tipo: cc.tipo,
          responsavel: cc.responsavel,
          orcamento_previsto: orcamento,
          orcamento_realizado: cc.orcamento_realizado || 0,
          gasto_real_pagar: gastoPagar,
          gasto_real_receber: gastoReceber,
          qtd_pagar: contasPagar.length,
          qtd_receber: contasReceber.length,
          margem: gastoReceber - gastoPagar,
          percentual_usado: percentual,
          status: percentual > 100 ? 'estouro' : percentual > 80 ? 'atencao' : 'ok',
        };
      });
    },
  });

  // KPIs
  const kpis = useMemo(() => {
    if (!centrosComGastos) return null;
    const totalOrcamento = centrosComGastos.reduce((a, c) => a + c.orcamento_previsto, 0);
    const totalGasto = centrosComGastos.reduce((a, c) => a + c.gasto_real_pagar, 0);
    const totalReceita = centrosComGastos.reduce((a, c) => a + c.gasto_real_receber, 0);
    const estourados = centrosComGastos.filter(c => c.status === 'estouro').length;
    const atencao = centrosComGastos.filter(c => c.status === 'atencao').length;
    return { totalOrcamento, totalGasto, totalReceita, estourados, atencao, disponivel: totalOrcamento - totalGasto };
  }, [centrosComGastos]);

  // Filtered & sorted
  const centrosFiltrados = useMemo(() => {
    if (!centrosComGastos) return [];
    let filtered = [...centrosComGastos];
    if (filtroStatus !== 'todos') {
      filtered = filtered.filter(c => c.status === filtroStatus);
    }
    filtered.sort((a, b) => {
      switch (ordenacao) {
        case 'percentual': return b.percentual_usado - a.percentual_usado;
        case 'orcamento': return b.orcamento_previsto - a.orcamento_previsto;
        case 'gasto': return b.gasto_real_pagar - a.gasto_real_pagar;
        default: return a.nome.localeCompare(b.nome);
      }
    });
    return filtered;
  }, [centrosComGastos, filtroStatus, ordenacao]);

  // Chart data
  const chartData = useMemo(() => {
    return centrosFiltrados.map(c => ({
      nome: c.codigo,
      nomeCompleto: c.nome,
      orcamento: c.orcamento_previsto,
      realizado: c.gasto_real_pagar,
      receita: c.gasto_real_receber,
      disponivel: Math.max(0, c.orcamento_previsto - c.gasto_real_pagar),
    }));
  }, [centrosFiltrados]);

  const statusConfig = {
    ok: { label: 'No Orçamento', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
    atencao: { label: 'Atenção', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
    estouro: { label: 'Estourado', icon: TrendingDown, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Orçamento vs Realizado
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Acompanhe a execução orçamentária por centro de custo/evento em tempo real
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ok">No Orçamento</SelectItem>
                <SelectItem value="atencao">Atenção</SelectItem>
                <SelectItem value="estouro">Estourado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ordenacao} onValueChange={setOrdenacao}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nome">Por Nome</SelectItem>
                <SelectItem value="percentual">Por % Usado</SelectItem>
                <SelectItem value="orcamento">Por Orçamento</SelectItem>
                <SelectItem value="gasto">Por Gasto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPIs */}
        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Orçamento Total</span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(kpis.totalOrcamento)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-xs text-muted-foreground">Total Gasto</span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(kpis.totalGasto)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-xs text-muted-foreground">Total Receita</span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(kpis.totalReceita)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Disponível</span>
                </div>
                <p className={cn('text-lg font-bold', kpis.disponivel < 0 ? 'text-destructive' : 'text-success')}>
                  {formatCurrency(kpis.disponivel)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-xs text-muted-foreground">Em Atenção</span>
                </div>
                <p className="text-lg font-bold text-warning">{kpis.atencao}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-xs text-muted-foreground">Estourados</span>
                </div>
                <p className="text-lg font-bold text-destructive">{kpis.estourados}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Insights */}
        {kpis && centrosComGastos && (
          <InsightsIA
            dados={{
              total_centros: centrosComGastos.length,
              orcamento_total: kpis.totalOrcamento,
              gasto_total: kpis.totalGasto,
              receita_total: kpis.totalReceita,
              saldo_disponivel: kpis.disponivel,
              centros_estourados: kpis.estourados,
              centros_atencao: kpis.atencao,
              detalhes: centrosComGastos.map(c => ({
                nome: c.nome,
                orcamento: c.orcamento_previsto,
                gasto: c.gasto_real_pagar,
                receita: c.gasto_real_receber,
                percentual: c.percentual_usado,
                margem: c.margem,
              })),
            }}
            contexto="Análise de orçamento vs realizado por centro de custo/evento. Empresa de eventos com prazos curtos."
          />
        )}

        <Tabs defaultValue="cards" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cards"><BarChart3 className="h-4 w-4 mr-2" />Cards</TabsTrigger>
            <TabsTrigger value="grafico"><PieChartIcon className="h-4 w-4 mr-2" />Gráficos</TabsTrigger>
          </TabsList>

          {/* Cards View */}
          <TabsContent value="cards">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {centrosFiltrados.map((centro, i) => {
                const config = statusConfig[centro.status];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={centro.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className={cn('border', config.border, 'hover:shadow-md transition-shadow')}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {centro.nome}
                          </CardTitle>
                          <Badge variant="outline" className={cn('text-xs', config.color, config.bg)}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          {centro.codigo} {centro.responsavel ? `• ${centro.responsavel}` : ''}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Progress bar */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Execução</span>
                            <span className={cn('font-medium', config.color)}>
                              {centro.percentual_usado.toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={Math.min(centro.percentual_usado, 100)}
                            className={cn('h-2', centro.status === 'estouro' && '[&>div]:bg-destructive')}
                          />
                        </div>

                        {/* Values grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded bg-muted/50">
                            <span className="text-muted-foreground block">Orçamento</span>
                            <span className="font-semibold">{formatCurrency(centro.orcamento_previsto)}</span>
                          </div>
                          <div className="p-2 rounded bg-muted/50">
                            <span className="text-muted-foreground block">Gasto</span>
                            <span className={cn('font-semibold', centro.status === 'estouro' && 'text-destructive')}>
                              {formatCurrency(centro.gasto_real_pagar)}
                            </span>
                          </div>
                          <div className="p-2 rounded bg-muted/50">
                            <span className="text-muted-foreground block">Receita</span>
                            <span className="font-semibold text-success">{formatCurrency(centro.gasto_real_receber)}</span>
                          </div>
                          <div className="p-2 rounded bg-muted/50">
                            <span className="text-muted-foreground block">Margem</span>
                            <span className={cn('font-semibold', centro.margem >= 0 ? 'text-success' : 'text-destructive')}>
                              {formatCurrency(centro.margem)}
                            </span>
                          </div>
                        </div>

                        {/* Counts */}
                        <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t">
                          <span>{centro.qtd_pagar} despesas</span>
                          <span>{centro.qtd_receber} receitas</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              {centrosFiltrados.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  Nenhum centro de custo encontrado com o filtro selecionado.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Charts View */}
          <TabsContent value="grafico" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Bar Chart: Orçamento vs Realizado */}
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

              {/* Composed: Margem por CC */}
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

              {/* Pie: Distribuição de Gastos */}
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
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
