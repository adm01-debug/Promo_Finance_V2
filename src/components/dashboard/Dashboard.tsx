import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  CreditCard,
  Activity,
  Target,
  Zap,
  Loader2,
} from 'lucide-react';
import { DraggableDashboardGrid } from './DraggableDashboardGrid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  ComposedChart,
  Legend,
  Line,
} from 'recharts';
import { Link } from 'react-router-dom';
import {
  useDashboardKPIs,
  useSaldosPorBanco,
  useFluxoCaixaProjetadoDashboard,
  useEvolucaoMensal,
  useStatusContas,
  useCentrosCustoDistribuicao,
  useTopDevedoresDashboard,
} from '@/hooks/useDashboardData';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

const COLORS = ['hsl(24, 95%, 46%)', 'hsl(215, 90%, 42%)', 'hsl(150, 70%, 32%)', 'hsl(275, 75%, 48%)', 'hsl(42, 95%, 48%)'];

export const Dashboard = () => {
  const [periodoFluxo, setPeriodoFluxo] = useState('30');
  
  // Real data hooks
  const { data: kpis, isLoading: loadingKpis } = useDashboardKPIs();
  const { data: saldosPorBanco, isLoading: loadingSaldos } = useSaldosPorBanco();
  const { data: fluxoProjetado, isLoading: loadingFluxo } = useFluxoCaixaProjetadoDashboard(parseInt(periodoFluxo));
  const { data: evolucaoMensal, isLoading: loadingEvolucao } = useEvolucaoMensal(6);
  const { data: statusContas, isLoading: loadingStatus } = useStatusContas();
  const { data: centrosCusto, isLoading: loadingCentros } = useCentrosCustoDistribuicao();
  const { data: topDevedores, isLoading: loadingDevedores } = useTopDevedoresDashboard(5);

  const statsCards = [
    { 
      title: 'Saldo Total', 
      value: kpis?.saldoTotal || 0, 
      variation: kpis?.saldoTotalVariacao || 0, 
      icon: Wallet, 
      color: 'primary', 
      href: '/contas-bancarias',
      loading: loadingKpis,
    },
    { 
      title: 'Receitas do Mês', 
      value: kpis?.receitasMes || 0, 
      variation: kpis?.receitasMesVariacao || 0, 
      icon: ArrowDownCircle, 
      color: 'success', 
      href: '/contas-receber',
      loading: loadingKpis,
    },
    { 
      title: 'Despesas do Mês', 
      value: kpis?.despesasMes || 0, 
      variation: kpis?.despesasMesVariacao || 0, 
      icon: ArrowUpCircle, 
      color: 'destructive', 
      href: '/contas-pagar',
      loading: loadingKpis,
    },
    { 
      title: 'Inadimplência', 
      value: kpis?.inadimplencia || 0, 
      variation: kpis?.inadimplenciaVariacao || 0, 
      icon: AlertTriangle, 
      color: 'warning', 
      isPercentage: true, 
      href: '/cobrancas',
      loading: loadingKpis,
    },
  ];

  const totalSaldoBancos = saldosPorBanco?.reduce((acc, b) => acc + b.saldo, 0) || 0;

  return (
    <DraggableDashboardGrid>
      {({ renderCard }) => (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* Page Header */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
              <p className="text-muted-foreground mt-1">Visão geral das finanças da Promo Brindes</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-8 px-3 gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Atualizado agora
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link to="/alertas">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {kpis?.totalAlertas || 0} Alertas
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* KPI Cards Principais */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((stat) => 
              renderCard(stat.title, (
                <Link key={stat.title} to={stat.href}>
                  <Card className="overflow-hidden group hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                          {stat.loading ? (
                            <Skeleton className="h-8 w-28" />
                          ) : (
                            <p className="text-2xl font-bold">
                              {stat.isPercentage ? `${stat.value.toFixed(1)}%` : formatCurrency(stat.value)}
                            </p>
                          )}
                          <div className={cn('flex items-center gap-1 text-sm font-medium', stat.variation >= 0 ? 'text-green-600' : 'text-red-500')}>
                            {stat.variation >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            {formatPercentage(stat.variation)} vs mês anterior
                          </div>
                        </div>
                        <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                          stat.color === 'primary' && 'bg-primary/10 text-primary',
                          stat.color === 'success' && 'bg-green-100 dark:bg-green-900/30 text-green-600',
                          stat.color === 'destructive' && 'bg-red-100 dark:bg-red-900/30 text-red-500',
                          stat.color === 'warning' && 'bg-orange-100 dark:bg-orange-900/30 text-orange-500'
                        )}>
                          <stat.icon className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                    <div className={cn('h-1 w-full',
                      stat.color === 'primary' && 'bg-gradient-to-r from-primary to-primary/50',
                      stat.color === 'success' && 'bg-gradient-to-r from-green-500 to-green-500/50',
                      stat.color === 'destructive' && 'bg-gradient-to-r from-red-500 to-red-500/50',
                      stat.color === 'warning' && 'bg-gradient-to-r from-orange-500 to-orange-500/50'
                    )} />
                  </Card>
                </Link>
              ))
            )}
          </motion.div>

          {/* KPIs Secundários */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {renderCard('kpi-empresas', (
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Empresas</p>
                    {loadingKpis ? <Skeleton className="h-6 w-8" /> : <p className="text-lg font-bold">{kpis?.totalEmpresas || 0}</p>}
                  </div>
                </div>
              </Card>
            ))}
            {renderCard('kpi-contas-bancarias', (
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contas Bancárias</p>
                    {loadingKpis ? <Skeleton className="h-6 w-8" /> : <p className="text-lg font-bold">{kpis?.totalContasBancarias || 0}</p>}
                  </div>
                </div>
              </Card>
            ))}
            {renderCard('kpi-receber-hoje', (
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Receber Hoje</p>
                    {loadingKpis ? <Skeleton className="h-6 w-8" /> : <p className="text-lg font-bold">{kpis?.contasReceberHoje || 0}</p>}
                  </div>
                </div>
              </Card>
            ))}
            {renderCard('kpi-pagar-hoje', (
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <Clock className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pagar Hoje</p>
                    {loadingKpis ? <Skeleton className="h-6 w-8" /> : <p className="text-lg font-bold">{kpis?.contasPagarHoje || 0}</p>}
                  </div>
                </div>
              </Card>
            ))}
            {renderCard('kpi-vencidas-receber', (
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vencidas Receber</p>
                    {loadingKpis ? <Skeleton className="h-6 w-8" /> : <p className="text-lg font-bold text-red-500">{kpis?.contasReceberVencidas || 0}</p>}
                  </div>
                </div>
              </Card>
            ))}
            {renderCard('kpi-vencidas-pagar', (
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vencidas Pagar</p>
                    {loadingKpis ? <Skeleton className="h-6 w-8" /> : <p className="text-lg font-bold text-red-500">{kpis?.contasPagarVencidas || 0}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>

      {/* Gráficos Principais - Linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fluxo de Caixa Projetado */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-[400px]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Fluxo de Caixa Projetado
                  </CardTitle>
                  <CardDescription>Receitas vs Despesas nos próximos dias</CardDescription>
                </div>
                <Tabs value={periodoFluxo} onValueChange={setPeriodoFluxo}>
                  <TabsList className="h-8">
                    <TabsTrigger value="7" className="text-xs">7d</TabsTrigger>
                    <TabsTrigger value="15" className="text-xs">15d</TabsTrigger>
                    <TabsTrigger value="30" className="text-xs">30d</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loadingFluxo ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={fluxoProjetado || []}>
                    <defs>
                      <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(150, 70%, 42%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(150, 70%, 42%)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 78%, 55%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(0, 78%, 55%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="data" tickFormatter={(v) => v.slice(8)} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip 
                      formatter={(v: number) => formatCurrency(v)} 
                      labelFormatter={(l) => `Data: ${l}`}
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="receitas" name="Receitas" stroke="hsl(150, 70%, 42%)" fill="url(#colorReceitas)" strokeWidth={2} />
                    <Area type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(0, 78%, 55%)" fill="url(#colorDespesas)" strokeWidth={2} />
                    <Line type="monotone" dataKey="saldo" name="Saldo" stroke="hsl(215, 90%, 52%)" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Saldo por Banco */}
        <motion.div variants={itemVariants}>
          <Card className="h-[400px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-500" />
                Saldo por Banco
              </CardTitle>
              <CardDescription>Distribuição entre contas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingSaldos ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <>
                  {(saldosPorBanco || []).map((banco, index) => {
                    const percentual = totalSaldoBancos > 0 ? (banco.saldo / totalSaldoBancos) * 100 : 0;
                    return (
                      <div key={banco.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: banco.cor || COLORS[index % COLORS.length] }} />
                            <span className="text-sm font-medium">{banco.banco}</span>
                          </div>
                          <span className="text-sm font-bold">{formatCurrency(banco.saldo)}</span>
                        </div>
                        <Progress value={percentual} className="h-2" />
                      </div>
                    );
                  })}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Consolidado</span>
                      <span className="text-lg font-bold text-primary">{formatCurrency(totalSaldoBancos)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Gráficos Secundários - Linha 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Evolução Mensal */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-[320px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Evolução Mensal
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[240px]">
              {loadingEvolucao ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evolucaoMensal || []}>
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip 
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar dataKey="receitas" name="Receitas" fill="hsl(150, 70%, 42%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesas" name="Despesas" fill="hsl(0, 78%, 55%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lucro" name="Lucro" fill="hsl(215, 90%, 52%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Status das Contas */}
        <motion.div variants={itemVariants}>
          <Card className="h-[320px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                Status Contas
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              {loadingStatus ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={statusContas || []} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={45} 
                      outerRadius={70} 
                      paddingAngle={3}
                    >
                      {(statusContas || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Devedores */}
        <motion.div variants={itemVariants}>
          <Card className="h-[320px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Top Devedores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 overflow-y-auto max-h-[240px]">
              {loadingDevedores ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (topDevedores || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mb-2 text-green-500" />
                  <p className="text-sm">Nenhum devedor</p>
                </div>
              ) : (
                (topDevedores || []).map((devedor, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[120px]">{devedor.cliente}</p>
                        <p className="text-xs text-muted-foreground">{devedor.diasAtraso} dias</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-red-500">{formatCurrency(devedor.valor)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/contas-pagar">
                  <ArrowUpCircle className="h-5 w-5 text-red-500" />
                  <span>Nova Conta a Pagar</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/contas-receber">
                  <ArrowDownCircle className="h-5 w-5 text-green-500" />
                  <span>Nova Conta a Receber</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/conciliacao">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  <span>Conciliar Extrato</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/relatorios">
                  <Activity className="h-5 w-5 text-purple-500" />
                  <span>Ver Relatórios</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </motion.div>
      )}
    </DraggableDashboardGrid>
  );
};

export default Dashboard;
