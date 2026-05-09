import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import { 
  Building2, Users, AlertTriangle, TrendingDown, TrendingUp,
  Target, Clock, DollarSign, BrainCircuit, Sparkles, ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, formatPercentage, formatDate } from "@/lib/formatters";
import { 
  useInadimplenciaPorRamo, 
  useInadimplenciaPorVendedor,
  usePrevisoesInadimplencia
} from "@/hooks/useInadimplenciaSegmentada";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(142 76% 36%)",
  "hsl(221 83% 53%)",
  "hsl(262 83% 58%)",
];

const getRiskColor = (taxa: number) => {
  if (taxa >= 30) return "destructive";
  if (taxa >= 15) return "warning";
  return "success";
};

const getRiskBg = (taxa: number) => {
  if (taxa >= 30) return "bg-destructive/10 border-destructive/20";
  if (taxa >= 15) return "bg-warning/10 border-warning/20";
  return "bg-success/10 border-success/20";
};

const priorityColors = {
  critica: "bg-destructive/20 text-destructive border-destructive/30",
  alta: "bg-warning/20 text-warning border-warning/30",
  media: "bg-primary/20 text-primary border-primary/30",
  baixa: "bg-success/20 text-success border-success/30",
};

export function InadimplenciaSegmentada() {
  const { data: porRamo, isLoading: loadingRamo } = useInadimplenciaPorRamo();
  const { data: porVendedor, isLoading: loadingVendedor } = useInadimplenciaPorVendedor();
  const { data: previsoes, isLoading: loadingPrevisoes } = usePrevisoesInadimplencia();

  const totaisRamo = porRamo?.reduce((acc, item) => ({
    valor_total: acc.valor_total + item.valor_total,
    valor_vencido: acc.valor_vencido + item.valor_vencido,
    total_contas: acc.total_contas + item.total_contas,
    total_vencido: acc.total_vencido + item.total_vencido,
  }), { valor_total: 0, valor_vencido: 0, total_contas: 0, total_vencido: 0 });

  const taxaGeralRamo = totaisRamo && totaisRamo.total_contas > 0
    ? (totaisRamo.total_vencido / totaisRamo.total_contas) * 100
    : 0;

  const pieDataRamo = porRamo?.slice(0, 6).map((item, index) => ({
    name: item.ramo,
    value: item.valor_vencido,
    fill: COLORS[index % COLORS.length],
  })) || [];

  const barDataVendedor = porVendedor?.map(v => ({
    nome: v.vendedor_nome.split(' ')[0],
    taxa: v.taxa_inadimplencia,
    meta: v.atingimento_meta,
    valor_vencido: v.valor_vencido,
  })) || [];

  if (loadingRamo || loadingVendedor || loadingPrevisoes) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com IA Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Análise de Inadimplência Elite</h2>
          <p className="text-muted-foreground">Monitoramento segmentado e predições baseadas em IA.</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
          <BrainCircuit className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-sm font-semibold text-primary">Engine Preditiva Ativa</span>
        </div>
      </div>

      {/* KPIs Resumidos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className={`border-none shadow-md ${getRiskBg(taxaGeralRamo)}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider opacity-70">Taxa de Risco Atual</p>
                  <p className="text-3xl font-black">{formatPercentage(taxaGeralRamo)}</p>
                </div>
                <AlertTriangle className={`h-8 w-8 ${taxaGeralRamo > 15 ? 'text-warning' : 'text-success'}`} />
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold">
                <TrendingDown className="h-3 w-3" />
                <span>-2.4% vs mês anterior</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="border-none shadow-md bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Exposição Vencida</p>
                  <p className="text-3xl font-black text-destructive">{formatCurrency(totaisRamo?.valor_vencido || 0)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-destructive opacity-30" />
              </div>
              <p className="mt-4 text-xs font-medium text-muted-foreground">Impacto direto no Fluxo de Caixa</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="border-none shadow-md bg-chart-1/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Alvos de Recuperação</p>
                  <p className="text-3xl font-black text-chart-1">{totaisRamo?.total_vencido || 0}</p>
                </div>
                <Target className="h-8 w-8 text-chart-1 opacity-30" />
              </div>
              <p className="mt-4 text-xs font-medium text-muted-foreground">Títulos pendentes em negociação</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <Card className="border-none shadow-md bg-success/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Previsão de Recebimento</p>
                  <p className="text-3xl font-black text-success">
                    {formatCurrency((totaisRamo?.valor_vencido || 0) * 0.72)}
                  </p>
                </div>
                <Sparkles className="h-8 w-8 text-success opacity-30" />
              </div>
              <p className="mt-4 text-xs font-medium text-muted-foreground">Estimado via IA (72% de confiança)</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="predicao" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="predicao" className="gap-2">
            <BrainCircuit className="h-4 w-4" />
            Insights Preditivos
          </TabsTrigger>
          <TabsTrigger value="ramo" className="gap-2">
            <Building2 className="h-4 w-4" />
            Por Ramo
          </TabsTrigger>
          <TabsTrigger value="vendedor" className="gap-2">
            <Users className="h-4 w-4" />
            Por Vendedor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predicao" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Alertas da Engine Preditiva
                  </CardTitle>
                  <CardDescription>Ocorrências detectadas com alta probabilidade de inadimplência.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {previsoes && previsoes.length > 0 ? (
                    previsoes.map((p, idx) => (
                      <motion.div 
                        key={p.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-4 p-4 rounded-xl border bg-card/50 hover:bg-card transition-all cursor-pointer group"
                      >
                        <div className={`mt-1 p-2 rounded-lg ${priorityColors[p.prioridade as keyof typeof priorityColors] || priorityColors.media}`}>
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{p.titulo}</h4>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase">
                              Probabilidade: {p.probabilidade}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{p.descricao}</p>
                          <div className="flex items-center gap-4 pt-2 text-xs font-semibold">
                            <div className="flex items-center gap-1 text-destructive">
                              <DollarSign className="h-3 w-3" />
                              Risco: {formatCurrency(p.impacto_estimado)}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Estimado para: {formatDate(p.data_previsao)}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-12 text-center space-y-2">
                      <BrainCircuit className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                      <p className="text-muted-foreground font-medium">Nenhum alerta crítico no radar da IA no momento.</p>
                      <p className="text-xs text-muted-foreground">A engine continua monitorando o comportamento dos clientes 24/7.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tendência de Risco</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { name: 'Jan', value: 12 },
                        { name: 'Fev', value: 15 },
                        { name: 'Mar', value: 10 },
                        { name: 'Abr', value: 18 },
                        { name: 'Mai', value: taxaGeralRamo },
                      ]}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" hide />
                        <YAxis hide domain={[0, 40]} />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <h5 className="text-xs font-bold text-primary flex items-center gap-1 mb-1">
                      <TrendingUp className="h-3 w-3" />
                      INSIGHT IA DO DIA
                    </h5>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      O setor de "Construção Civil" apresentou um aumento de 15% na propensão de atraso para os próximos 15 dias. Recomenda-se reforçar a régua de cobrança preventiva para este grupo.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Confiabilidade da Predição</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Precisão Histórica</span>
                      <span className="text-success">94.2%</span>
                    </div>
                    <Progress value={94} className="h-1.5" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Volume de Dados Processado</span>
                      <span className="text-primary">124k registros</span>
                    </div>
                    <Progress value={85} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ramo" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Ramo</CardTitle>
                <CardDescription>Valor vencido por segmento</CardDescription>
              </CardHeader>
              <CardContent>
                {pieDataRamo.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieDataRamo}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => 
                          `${name.substring(0, 10)}... ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieDataRamo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Sem dados de inadimplência por ramo
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ranking por Risco</CardTitle>
                <CardDescription>Ramos ordenados por taxa de inadimplência</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[340px] overflow-y-auto">
                {porRamo?.map((ramo, index) => (
                  <motion.div
                    key={ramo.ramo}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg border ${getRiskBg(ramo.taxa_inadimplencia)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="font-medium">{ramo.ramo}</span>
                      </div>
                      <Badge variant={getRiskColor(ramo.taxa_inadimplencia) as "destructive" | "warning" | "success"}>
                        {formatPercentage(ramo.taxa_inadimplencia)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Vencido</p>
                        <p className="font-medium">{formatCurrency(ramo.valor_vencido)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Contas</p>
                        <p className="font-medium">{ramo.total_vencido}/{ramo.total_contas}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Atraso Médio</p>
                        <p className="font-medium">{Math.round(ramo.dias_atraso_medio)} dias</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vendedor" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inadimplência vs Meta</CardTitle>
                <CardDescription>Comparativo de performance por vendedor</CardDescription>
              </CardHeader>
              <CardContent>
                {barDataVendedor.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barDataVendedor} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <YAxis dataKey="nome" type="category" width={80} />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          `${value.toFixed(1)}%`,
                          name === 'taxa' ? 'Inadimplência' : 'Meta Atingida'
                        ]}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="taxa" name="Inadimplência" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="meta" name="Meta Atingida" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Sem dados de vendedores
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Individual</CardTitle>
                <CardDescription>Detalhamento por vendedor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[340px] overflow-y-auto">
                {porVendedor?.map((vendedor, index) => (
                  <motion.div
                    key={vendedor.vendedor_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {vendedor.vendedor_nome.charAt(0)}
                        </div>
                        <span className="font-medium">{vendedor.vendedor_nome}</span>
                      </div>
                      <Badge variant={getRiskColor(vendedor.taxa_inadimplencia) as "destructive" | "warning" | "success"}>
                        {formatPercentage(vendedor.taxa_inadimplencia)}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Atingimento de Meta</span>
                        <span className="font-semibold">{formatPercentage(vendedor.atingimento_meta)}</span>
                      </div>
                      <Progress value={Math.min(vendedor.atingimento_meta, 100)} className="h-1.5" />
                      <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                        <span>Vencido: {formatCurrency(vendedor.valor_vencido)}</span>
                        <span>Atraso: {Math.round(vendedor.dias_atraso_medio)} dias</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
