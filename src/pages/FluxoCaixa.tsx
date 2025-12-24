import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  AlertTriangle,
  BarChart3,
  Download,
  Settings2,
  RefreshCw,
  Loader2,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { 
  ResponsiveContainer, 
  ComposedChart,
  Bar,
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  CenarioTipo,
  detectarAlertasRuptura,
  calcularMetricasCenarios,
  AlertaRuptura,
} from '@/lib/cashflow-scenarios';
import { CenarioSelector } from '@/components/fluxo-caixa/CenarioSelector';
import { AlertasRuptura } from '@/components/fluxo-caixa/AlertasRuptura';
import { GraficoCenarios } from '@/components/fluxo-caixa/GraficoCenarios';
import { ResumosCenarios } from '@/components/fluxo-caixa/ResumosCenarios';
import { 
  useFluxoCaixaKPIs, 
  useFluxoCaixaProjetado, 
  calcularProjecoesReais 
} from '@/hooks/useFluxoCaixa';
import { QuickDateFilters, useQuickDateFilter, DateFilterOption } from '@/components/ui/quick-date-filters';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

const periodoDias: Record<string, number> = {
  '7d': 7,
  '15d': 15,
  '30d': 30,
  '90d': 90,
};

export default function FluxoCaixa() {
  const [periodo, setPeriodo] = useState('30d');
  const [cenarioAtivo, setCenarioAtivo] = useState<CenarioTipo>('realista');
  const [alertasDismissed, setAlertasDismissed] = useState<string[]>([]);
  
  // Quick date filter for data range selection
  const { filterType, handleFilterChange, filterByDate } = useQuickDateFilter();
  
  const dias = periodoDias[periodo] || 30;
  
  const { data: kpis, isLoading: loadingKpis, refetch: refetchKpis } = useFluxoCaixaKPIs();
  const { data: fluxoProjetado, isLoading: loadingFluxo, refetch: refetchFluxo } = useFluxoCaixaProjetado(dias);

  const saldoInicial = kpis?.saldoTotal || 0;

  // Gerar projeções para todos os cenários baseado em dados reais
  const projecoes = useMemo(() => {
    if (!fluxoProjetado || fluxoProjetado.length === 0) {
      return {
        otimista: [],
        realista: [],
        pessimista: [],
      };
    }
    return calcularProjecoesReais(fluxoProjetado, saldoInicial);
  }, [fluxoProjetado, saldoInicial]);

  // Calcular métricas dos cenários
  const metricasCenarios = useMemo(() => {
    if (!projecoes.realista.length) {
      return {
        otimista: { saldoMinimo: 0, saldoFinal: 0, diasCriticos: 0, diasRisco: 0 },
        realista: { saldoMinimo: 0, saldoFinal: 0, diasCriticos: 0, diasRisco: 0 },
        pessimista: { saldoMinimo: 0, saldoFinal: 0, diasCriticos: 0, diasRisco: 0 },
      };
    }
    return calcularMetricasCenarios(projecoes);
  }, [projecoes]);

  // Detectar alertas de ruptura
  const alertas = useMemo(() => {
    if (!projecoes.realista.length) return [];
    const todosAlertas = detectarAlertasRuptura(projecoes, 0, 50000, 100000);
    return todosAlertas.filter(a => !alertasDismissed.includes(a.id));
  }, [projecoes, alertasDismissed]);

  // Dados do cenário ativo
  const dadosCenarioAtivo = projecoes[cenarioAtivo] || [];
  const metricaAtiva = metricasCenarios[cenarioAtivo];

  // Calcular totais do cenário ativo
  const totalReceitas = dadosCenarioAtivo.reduce((sum, f) => sum + f.receitas, 0);
  const totalDespesas = dadosCenarioAtivo.reduce((sum, f) => sum + f.despesas, 0);
  const saldoFinal = metricaAtiva?.saldoFinal || saldoInicial;
  const variacao = saldoFinal - saldoInicial;

  // Dados para gráfico de barras
  const barData = dadosCenarioAtivo.map(f => ({
    ...f,
    data: f.data.slice(5),
    liquido: f.receitas - f.despesas,
  }));

  // Handlers
  const handleDismissAlerta = (id: string) => {
    setAlertasDismissed(prev => [...prev, id]);
  };

  const handleVerDetalhesAlerta = (alerta: AlertaRuptura) => {
    setCenarioAtivo(alerta.cenario);
  };

  const handleRefresh = () => {
    refetchKpis();
    refetchFluxo();
  };

  const isLoading = loadingKpis || loadingFluxo;

  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Page Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-display-md text-foreground">Fluxo de Caixa</h1>
            <p className="text-muted-foreground mt-1">Projeção financeira com análise de cenários</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Tabs value={periodo} onValueChange={setPeriodo}>
              <TabsList className="h-9">
                <TabsTrigger value="7d" className="text-xs px-3">7 dias</TabsTrigger>
                <TabsTrigger value="15d" className="text-xs px-3">15 dias</TabsTrigger>
                <TabsTrigger value="30d" className="text-xs px-3">30 dias</TabsTrigger>
                <TabsTrigger value="90d" className="text-xs px-3">90 dias</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Atualizar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  import('@/lib/pdf-generator').then(({ generateFluxoCaixaPDF }) => {
                    generateFluxoCaixaPDF(dadosCenarioAtivo, `Fluxo de Caixa - Cenário ${cenarioAtivo}`);
                    toast.success('PDF gerado com sucesso!');
                  });
                }}>
                  <FileText className="h-4 w-4 mr-2 text-red-500" />
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  import('@/lib/pdf-generator').then(({ generateFluxoCaixaCSV }) => {
                    generateFluxoCaixaCSV(dadosCenarioAtivo);
                    toast.success('Excel exportado com sucesso!');
                  });
                }}>
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                  Exportar Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Quick Date Filters */}
        <motion.div variants={itemVariants}>
          <QuickDateFilters
            value={filterType}
            onChange={handleFilterChange}
            extended
          />
        </motion.div>

        {/* Seletor de Cenários */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CenarioSelector 
            cenarioAtivo={cenarioAtivo} 
            onCenarioChange={setCenarioAtivo}
            metricas={metricasCenarios}
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Settings2 className="h-4 w-4" />
            <span>Limites: Ruptura R$ 0 | Risco R$ 50K</span>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saldo Atual</p>
                  {loadingKpis ? (
                    <Skeleton className="h-7 w-28 mt-1" />
                  ) : (
                    <p className="text-xl font-bold font-display mt-1">{formatCurrency(kpis?.saldoTotal || 0)}</p>
                  )}
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entradas ({cenarioAtivo})</p>
                  {loadingFluxo ? (
                    <Skeleton className="h-7 w-28 mt-1" />
                  ) : (
                    <p className="text-xl font-bold font-display mt-1 text-success">{formatCurrency(totalReceitas)}</p>
                  )}
                </div>
                <div className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center transition-transform group-hover:scale-110">
                  <ArrowDownCircle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saídas ({cenarioAtivo})</p>
                  {loadingFluxo ? (
                    <Skeleton className="h-7 w-28 mt-1" />
                  ) : (
                    <p className="text-xl font-bold font-display mt-1 text-destructive">{formatCurrency(totalDespesas)}</p>
                  )}
                </div>
                <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center transition-transform group-hover:scale-110">
                  <ArrowUpCircle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saldo Projetado</p>
                  {loadingFluxo ? (
                    <Skeleton className="h-7 w-28 mt-1" />
                  ) : (
                    <>
                      <p className="text-xl font-bold font-display mt-1">{formatCurrency(saldoFinal)}</p>
                      <div className={cn("flex items-center gap-1 text-xs font-medium mt-1", variacao >= 0 ? "text-success" : "text-destructive")}>
                        {variacao >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {formatCurrency(variacao)}
                      </div>
                    </>
                  )}
                </div>
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                  variacao >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                )}>
                  {variacao >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn("stat-card group", (metricaAtiva?.diasCriticos || 0) > 0 && "border-warning")}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dias Críticos</p>
                  {loadingFluxo ? (
                    <Skeleton className="h-7 w-12 mt-1" />
                  ) : (
                    <>
                      <p className="text-xl font-bold font-display mt-1">{metricaAtiva?.diasCriticos || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Saldo &lt; R$ 100k</p>
                    </>
                  )}
                </div>
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                  (metricaAtiva?.diasCriticos || 0) > 0 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                )}>
                  {(metricaAtiva?.diasCriticos || 0) > 0 ? <AlertTriangle className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Resumos dos Cenários */}
        <motion.div variants={itemVariants}>
          <ResumosCenarios 
            metricas={metricasCenarios}
            saldoAtual={kpis?.saldoTotal || 0}
            cenarioAtivo={cenarioAtivo}
            onCenarioClick={setCenarioAtivo}
          />
        </motion.div>

        {/* Gráfico Comparativo de Cenários + Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="lg:col-span-2">
            {isLoading ? (
              <Card className="card-elevated h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </Card>
            ) : (
              <GraficoCenarios 
                projecoes={projecoes}
                cenarioDestaque={cenarioAtivo}
                limiteRuptura={0}
                limiteRiscoAlto={50000}
              />
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            <AlertasRuptura 
              alertas={alertas}
              onDismiss={handleDismissAlerta}
              onVerDetalhes={handleVerDetalhesAlerta}
            />
          </motion.div>
        </div>

        {/* Gráfico de Entradas x Saídas do Cenário Ativo */}
        <motion.div variants={itemVariants}>
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Entradas vs Saídas - Cenário {cenarioAtivo.charAt(0).toUpperCase() + cenarioAtivo.slice(1)}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="data" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                    />
                    <YAxis 
                      tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                    />
                    <Tooltip 
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="receitas" fill="hsl(150, 70%, 32%)" name="Receitas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesas" fill="hsl(0, 78%, 45%)" name="Despesas" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="liquido" stroke="hsl(24, 95%, 46%)" strokeWidth={2} name="Líquido" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabela de Projeção Diária */}
        <motion.div variants={itemVariants}>
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Projeção Diária - Cenário {cenarioAtivo.charAt(0).toUpperCase() + cenarioAtivo.slice(1)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : dadosCenarioAtivo.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Nenhuma projeção disponível para o período</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {dadosCenarioAtivo.slice(0, 15).map((dia, index) => {
                    const liquido = dia.receitas - dia.despesas;
                    const isPositivo = liquido >= 0;
                    const isCritico = dia.saldo < 100000;
                    const isRuptura = dia.saldo <= 0;
                    
                    return (
                      <motion.div
                        key={dia.data}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className={cn(
                          "p-3 rounded-xl border transition-all hover:shadow-md",
                          isRuptura ? "bg-destructive/10 border-destructive/40" :
                          isCritico ? "bg-warning/10 border-warning/30" :
                          isPositivo ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground font-medium">
                            {new Date(dia.data).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}
                          </span>
                          <Badge variant="outline" className={cn(
                            "text-xs h-5 px-1.5", 
                            isPositivo ? "text-success" : "text-destructive"
                          )}>
                            {isPositivo ? '+' : ''}{formatCurrency(liquido).replace('R$', '')}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-success">+ {formatCurrency(dia.receitas).replace('R$', '')}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-destructive">- {formatCurrency(dia.despesas).replace('R$', '')}</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">Saldo</p>
                          <p className={cn(
                            "text-sm font-semibold",
                            isRuptura ? "text-destructive" :
                            isCritico ? "text-warning" : "text-foreground"
                          )}>
                            {formatCurrency(dia.saldo)}
                          </p>
                        </div>
                        {isRuptura && (
                          <Badge variant="destructive" className="mt-2 w-full justify-center text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Ruptura
                          </Badge>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}
