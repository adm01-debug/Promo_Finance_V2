import { motion } from 'framer-motion';
import {
  Plus,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Target,
  PieChart,
  BarChart3,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCentrosCusto } from '@/hooks/useFinancialData';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

const COLORS = ['hsl(24, 95%, 46%)', 'hsl(215, 90%, 42%)', 'hsl(150, 70%, 32%)', 'hsl(275, 75%, 48%)', 'hsl(42, 95%, 48%)'];

export default function CentroCustos() {
  const { data: centros = [], isLoading } = useCentrosCusto();

  // KPIs
  const totalOrcado = centros.reduce((sum, c) => sum + c.orcamento_previsto, 0);
  const totalRealizado = centros.reduce((sum, c) => sum + c.orcamento_realizado, 0);
  const percentualGasto = totalOrcado > 0 ? (totalRealizado / totalOrcado) * 100 : 0;
  const saldoDisponivel = totalOrcado - totalRealizado;

  // Dados para o gráfico de barras comparativo
  const barData = centros.map(c => ({
    nome: c.codigo,
    Orçado: c.orcamento_previsto,
    Realizado: c.orcamento_realizado,
    percentual: c.orcamento_previsto > 0 ? ((c.orcamento_realizado / c.orcamento_previsto) * 100).toFixed(1) : '0',
  }));

  // Dados para distribuição
  const distribuicao = centros.map(c => ({
    nome: c.nome,
    valor: c.orcamento_realizado,
    percentual: totalRealizado > 0 ? (c.orcamento_realizado / totalRealizado) * 100 : 0,
  }));

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Page Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-display-md text-foreground">Centro de Custos</h1>
            <p className="text-muted-foreground mt-1">Controle orçamentário e análise de custos por departamento</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurar Metas
            </Button>
            <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25">
              <Plus className="h-4 w-4" />
              Novo Centro
            </Button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Orçamento Total</p>
                  <p className="text-2xl font-bold font-display mt-1">{formatCurrency(totalOrcado)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Período atual</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                  <Target className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Realizado</p>
                  <p className="text-2xl font-bold font-display mt-1">{formatCurrency(totalRealizado)}</p>
                  <div className="flex items-center gap-1 text-sm font-medium mt-1">
                    <span className={cn(percentualGasto > 100 ? 'text-destructive' : 'text-success')}>
                      {percentualGasto.toFixed(1)}% do orçamento
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center transition-transform group-hover:scale-110">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saldo Disponível</p>
                  <p className={cn("text-2xl font-bold font-display mt-1", saldoDisponivel < 0 ? 'text-destructive' : 'text-success')}>
                    {formatCurrency(saldoDisponivel)}
                  </p>
                  <div className="mt-2 w-full">
                    <Progress value={percentualGasto > 100 ? 100 : percentualGasto} className="h-2" />
                  </div>
                </div>
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                  saldoDisponivel < 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                )}>
                  {saldoDisponivel < 0 ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Centros Ativos</p>
                  <p className="text-2xl font-bold font-display mt-1">{centros.filter(c => c.ativo).length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {centros.filter(c => c.orcamento_realizado > c.orcamento_previsto).length} acima do orçamento
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center transition-transform group-hover:scale-110">
                  <PieChart className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Row */}
        {centros.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Comparativo Orçado x Realizado */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card className="card-elevated h-[400px]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Orçado vs Realizado
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical">
                      <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                      <YAxis type="category" dataKey="nome" width={50} />
                      <Tooltip 
                        formatter={(v: number) => formatCurrency(v)}
                        labelFormatter={(l) => `Centro: ${l}`}
                      />
                      <Legend />
                      <Bar dataKey="Orçado" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="Realizado" fill="hsl(24, 95%, 46%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Distribuição por Centro */}
            <motion.div variants={itemVariants}>
              <Card className="card-elevated h-[400px]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Distribuição
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="75%">
                    <RePieChart>
                      <Pie
                        data={distribuicao}
                        dataKey="valor"
                        nameKey="nome"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {distribuicao.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {distribuicao.slice(0, 3).map((item, i) => (
                      <Badge key={item.nome} variant="outline" className="text-xs">
                        <span className="h-2 w-2 rounded-full mr-1" style={{ background: COLORS[i] }} />
                        {item.nome} ({item.percentual.toFixed(1)}%)
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Centro de Custos Cards */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-display font-bold mb-4">Detalhamento por Centro</h2>
          {centros.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              Nenhum centro de custo cadastrado
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {centros.map((centro, index) => {
                const percentual = centro.orcamento_previsto > 0 ? (centro.orcamento_realizado / centro.orcamento_previsto) * 100 : 0;
                const diferenca = centro.orcamento_realizado - centro.orcamento_previsto;
                const isOver = diferenca > 0;

                return (
                  <motion.div
                    key={centro.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <Card className="card-interactive h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="h-10 w-10 rounded-lg flex items-center justify-center"
                              style={{ background: `${COLORS[index % COLORS.length]}20`, color: COLORS[index % COLORS.length] }}
                            >
                              <span className="font-bold text-sm">{centro.codigo}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold">{centro.nome}</h3>
                              <p className="text-xs text-muted-foreground">{centro.descricao || '-'}</p>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              isOver ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-success/10 text-success border-success/20"
                            )}
                          >
                            {isOver ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                            {formatPercentage(percentual - 100)}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Orçado</span>
                            <span className="font-medium">{formatCurrency(centro.orcamento_previsto)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Realizado</span>
                            <span className={cn("font-medium", isOver ? "text-destructive" : "text-success")}>
                              {formatCurrency(centro.orcamento_realizado)}
                            </span>
                          </div>
                          <Progress 
                            value={percentual > 100 ? 100 : percentual} 
                            className={cn("h-2", isOver && "[&>div]:bg-destructive")} 
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{percentual.toFixed(1)}% utilizado</span>
                            <span className={cn(isOver ? "text-destructive" : "text-success")}>
                              {isOver ? '+' : ''}{formatCurrency(diferenca)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}
