import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Sparkles,
  Calendar,
  DollarSign,
  Users,
  Lightbulb,
  Activity,
  ArrowRight,
  BarChart3,
  Clock,
  Wallet,
  PieChart,
  Target
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { logger } from '@/lib/logger';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

interface AnaliseTendencia {
  tendencia: string;
  variacao_percentual: string;
  previsao_proximo_mes: string;
  observacao: string;
}

interface DadosGrafico {
  mes: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface IndicadoresChave {
  prazo_medio_recebimento: string;
  prazo_medio_pagamento: string;
  ciclo_financeiro: string;
  liquidez_corrente: string;
  cobertura_despesas: string;
}

interface AnalisePreditiva {
  resumo_executivo: string;
  analise_inadimplencia: {
    taxa_atual: string;
    tendencia: string;
    clientes_risco: string[];
    valor_em_risco: string;
  };
  projecao_fluxo_caixa: {
    proximos_7_dias: {
      entradas_previstas: string;
      saidas_previstas: string;
      saldo_projetado: string;
    };
    proximos_30_dias: {
      entradas_previstas: string;
      saidas_previstas: string;
      saldo_projetado: string;
    };
    proximos_90_dias: {
      entradas_previstas: string;
      saidas_previstas: string;
      saldo_projetado: string;
    };
  };
  analise_tendencias?: {
    receitas: AnaliseTendencia;
    despesas: AnaliseTendencia;
    inadimplencia: AnaliseTendencia;
    margem_liquida: {
      atual: string;
      tendencia: string;
      previsao: string;
    };
    dados_grafico: DadosGrafico[];
  };
  alertas: Array<{
    tipo: string;
    mensagem: string;
    acao_recomendada: string;
  }>;
  recomendacoes: string[];
  score_saude_financeira: string;
  indicadores_chave?: IndicadoresChave;
}

interface PrevisaoIAProps {
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
} as const;

export function PrevisaoIA({ className }: PrevisaoIAProps) {
  const [analise, setAnalise] = useState<AnalisePreditiva | null>(null);
  const [loading, setLoading] = useState(false);
  const [geradoEm, setGeradoEm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('visao-geral');
  const { toast } = useToast();

  const gerarAnalise = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analise-preditiva');
      
      if (error) throw error;
      
      if (data.error) {
        throw new Error(data.error);
      }

      setAnalise(data.analise);
      setGeradoEm(data.gerado_em);
      
      toast({
        title: "Análise concluída",
        description: `Analisados ${data.dados_analisados.contas_receber} recebíveis, ${data.dados_analisados.contas_pagar} pagáveis, ${data.dados_analisados.clientes} clientes e ${data.dados_analisados.meses_historico || 0} meses de histórico.`,
      });
    } catch (error: unknown) {
      logger.error('Erro na análise preditiva:', error);
      toast({
        title: "Erro na análise",
        description: error instanceof Error ? error.message : "Não foi possível gerar a análise preditiva.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAlertaBadge = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'critico':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Crítico</Badge>;
      case 'alto':
        return <Badge className="gap-1 bg-streak text-streak-foreground"><AlertTriangle className="h-3 w-3" /> Alto</Badge>;
      case 'medio':
        return <Badge className="gap-1 bg-warning text-warning-foreground"><AlertTriangle className="h-3 w-3" /> Médio</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Baixo</Badge>;
    }
  };

  const getTendenciaIcon = (tendencia: string) => {
    if (tendencia?.toLowerCase().includes('cresc')) {
      return <TrendingUp className="h-4 w-4 text-success" />;
    } else if (tendencia?.toLowerCase().includes('decresc')) {
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    }
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const getTendenciaColor = (tendencia: string, inverted = false) => {
    const isUp = tendencia?.toLowerCase().includes('cresc');
    const isDown = tendencia?.toLowerCase().includes('decresc');
    
    if (inverted) {
      if (isUp) return 'text-destructive';
      if (isDown) return 'text-green-500';
    } else {
      if (isUp) return 'text-green-500';
      if (isDown) return 'text-destructive';
    }
    return 'text-muted-foreground';
  };

  const parseValor = (valor: string): number => {
    if (!valor) return 0;
    const cleaned = valor.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const getScoreColor = (score: string): string => {
    const scoreNum = parseInt(score) || 0;
    if (scoreNum >= 80) return 'text-green-500';
    if (scoreNum >= 60) return 'text-yellow-500';
    if (scoreNum >= 40) return 'text-orange-500';
    return 'text-destructive';
  };

  if (!analise && !loading) {
    return (
      <Card className={`${className} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        <CardContent className="relative flex flex-col items-center justify-center py-16 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl" />
              <Brain className="relative h-16 w-16 text-primary" />
            </div>
          </motion.div>
          <h3 className="mb-2 text-xl font-semibold">Análise Preditiva com IA</h3>
          <p className="mb-6 max-w-md text-muted-foreground">
            Utilize inteligência artificial para analisar tendências históricas, prever inadimplência, 
            projetar fluxo de caixa e receber recomendações estratégicas personalizadas.
          </p>
          <Button onClick={gerarAnalise} size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Gerar Análise Preditiva
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="h-6 w-6 text-primary" />
            </motion.div>
            <div>
              <CardTitle>Analisando tendências...</CardTitle>
              <CardDescription>A IA está processando dados históricos e identificando padrões</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-48 w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const score = parseInt(analise?.score_saude_financeira || '0');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Análise Preditiva com IA</CardTitle>
                {geradoEm && (
                  <CardDescription>
                    Gerado em {new Date(geradoEm).toLocaleString('pt-BR')}
                  </CardDescription>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={gerarAnalise} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score de Saúde Financeira */}
          <motion.div variants={itemVariants}>
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Score de Saúde Financeira</p>
                    <p className={`text-4xl font-bold ${getScoreColor(analise?.score_saude_financeira || '0')}`}>
                      {analise?.score_saude_financeira || 0}
                      <span className="text-lg text-muted-foreground">/100</span>
                    </p>
                  </div>
                  <div className="w-32">
                    <Progress value={score} className="h-3" />
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{analise?.resumo_executivo}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs para organizar conteúdo */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="visao-geral" className="gap-2">
                <PieChart className="h-4 w-4" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="tendencias" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Tendências
              </TabsTrigger>
              <TabsTrigger value="projecoes" className="gap-2">
                <Target className="h-4 w-4" />
                Projeções
              </TabsTrigger>
              <TabsTrigger value="alertas" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Alertas
              </TabsTrigger>
            </TabsList>

            {/* Visão Geral */}
            <TabsContent value="visao-geral" className="mt-4 space-y-4">
              {/* Indicadores Chave */}
              {analise?.indicadores_chave && (
                <motion.div variants={itemVariants}>
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    <Target className="h-4 w-4 text-primary" />
                    Indicadores Chave
                  </h3>
                  <div className="grid gap-4 md:grid-cols-5">
                    <Card className="text-center p-4">
                      <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">PMR</p>
                      <p className="text-lg font-bold">{analise.indicadores_chave.prazo_medio_recebimento}</p>
                    </Card>
                    <Card className="text-center p-4">
                      <Clock className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">PMP</p>
                      <p className="text-lg font-bold">{analise.indicadores_chave.prazo_medio_pagamento}</p>
                    </Card>
                    <Card className="text-center p-4">
                      <Activity className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Ciclo Financeiro</p>
                      <p className="text-lg font-bold">{analise.indicadores_chave.ciclo_financeiro}</p>
                    </Card>
                    <Card className="text-center p-4">
                      <Wallet className="h-5 w-5 text-green-500 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Liquidez</p>
                      <p className="text-lg font-bold">{analise.indicadores_chave.liquidez_corrente}</p>
                    </Card>
                    <Card className="text-center p-4">
                      <DollarSign className="h-5 w-5 text-purple-500 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Cobertura</p>
                      <p className="text-lg font-bold">{analise.indicadores_chave.cobertura_despesas}</p>
                    </Card>
                  </div>
                </motion.div>
              )}

              {/* Análise de Inadimplência */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-4 w-4 text-primary" />
                      Análise de Inadimplência
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Taxa Atual</span>
                        <p className="font-semibold text-lg">{analise?.analise_inadimplencia?.taxa_atual}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Tendência</span>
                        <div className="flex items-center gap-2">
                          {getTendenciaIcon(analise?.analise_inadimplencia?.tendencia || '')}
                          <span className="font-medium capitalize">{analise?.analise_inadimplencia?.tendencia}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Valor em Risco</span>
                        <p className="font-semibold text-lg text-destructive">{analise?.analise_inadimplencia?.valor_em_risco}</p>
                      </div>
                    </div>
                    {analise?.analise_inadimplencia?.clientes_risco?.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="mb-2 text-sm font-medium">Clientes em Risco:</p>
                        <div className="flex flex-wrap gap-1">
                          {analise.analise_inadimplencia.clientes_risco.slice(0, 5).map((cliente, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {cliente}
                            </Badge>
                          ))}
                          {analise.analise_inadimplencia.clientes_risco.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{analise.analise_inadimplencia.clientes_risco.length - 5}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Tendências */}
            <TabsContent value="tendencias" className="mt-4 space-y-4">
              {analise?.analise_tendencias && (
                <>
                  {/* Gráfico de Tendências */}
                  {analise.analise_tendencias.dados_grafico?.length > 0 && (
                    <motion.div variants={itemVariants}>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            Evolução Histórica
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={analise.analise_tendencias.dados_grafico}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                              <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                              <Tooltip 
                                formatter={(value: number) => formatCurrency(value)}
                                labelFormatter={(label) => `Período: ${label}`}
                              />
                              <Legend />
                              <Area 
                                type="monotone" 
                                dataKey="receitas" 
                                name="Receitas"
                                stroke="hsl(var(--chart-1))" 
                                fill="hsl(var(--chart-1))" 
                                fillOpacity={0.3}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="despesas" 
                                name="Despesas"
                                stroke="hsl(var(--chart-2))" 
                                fill="hsl(var(--chart-2))" 
                                fillOpacity={0.3}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="saldo" 
                                name="Saldo"
                                stroke="hsl(var(--chart-3))" 
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Cards de Tendências */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <motion.div variants={itemVariants}>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            Tendência de Receitas
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Direção:</span>
                            <div className={`flex items-center gap-2 ${getTendenciaColor(analise.analise_tendencias.receitas?.tendencia)}`}>
                              {getTendenciaIcon(analise.analise_tendencias.receitas?.tendencia)}
                              <span className="font-medium capitalize">{analise.analise_tendencias.receitas?.tendencia}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Variação (3m):</span>
                            <span className="font-semibold">{analise.analise_tendencias.receitas?.variacao_percentual}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Previsão:</span>
                            <span className="font-semibold text-green-600">{analise.analise_tendencias.receitas?.previsao_proximo_mes}</span>
                          </div>
                          <p className="text-xs text-muted-foreground border-t pt-3">
                            {analise.analise_tendencias.receitas?.observacao}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingDown className="h-4 w-4 text-orange-500" />
                            Tendência de Despesas
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Direção:</span>
                            <div className={`flex items-center gap-2 ${getTendenciaColor(analise.analise_tendencias.despesas?.tendencia, true)}`}>
                              {getTendenciaIcon(analise.analise_tendencias.despesas?.tendencia)}
                              <span className="font-medium capitalize">{analise.analise_tendencias.despesas?.tendencia}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Variação (3m):</span>
                            <span className="font-semibold">{analise.analise_tendencias.despesas?.variacao_percentual}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Previsão:</span>
                            <span className="font-semibold text-orange-600">{analise.analise_tendencias.despesas?.previsao_proximo_mes}</span>
                          </div>
                          <p className="text-xs text-muted-foreground border-t pt-3">
                            {analise.analise_tendencias.despesas?.observacao}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            Tendência de Inadimplência
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Direção:</span>
                            <div className={`flex items-center gap-2 ${getTendenciaColor(analise.analise_tendencias.inadimplencia?.tendencia, true)}`}>
                              {getTendenciaIcon(analise.analise_tendencias.inadimplencia?.tendencia)}
                              <span className="font-medium capitalize">{analise.analise_tendencias.inadimplencia?.tendencia}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Variação (3m):</span>
                            <span className="font-semibold">{analise.analise_tendencias.inadimplencia?.variacao_percentual}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Previsão:</span>
                            <span className="font-semibold">{analise.analise_tendencias.inadimplencia?.previsao_proximo_mes}</span>
                          </div>
                          <p className="text-xs text-muted-foreground border-t pt-3">
                            {analise.analise_tendencias.inadimplencia?.observacao}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <PieChart className="h-4 w-4 text-purple-500" />
                            Margem Líquida
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Atual:</span>
                            <span className="font-bold text-xl">{analise.analise_tendencias.margem_liquida?.atual}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Tendência:</span>
                            <div className={`flex items-center gap-2 ${getTendenciaColor(analise.analise_tendencias.margem_liquida?.tendencia)}`}>
                              {getTendenciaIcon(analise.analise_tendencias.margem_liquida?.tendencia)}
                              <span className="font-medium capitalize">{analise.analise_tendencias.margem_liquida?.tendencia}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground border-t pt-3">
                            {analise.analise_tendencias.margem_liquida?.previsao}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Projeções */}
            <TabsContent value="projecoes" className="mt-4 space-y-4">
              <motion.div variants={itemVariants}>
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <Calendar className="h-4 w-4 text-primary" />
                  Projeção de Fluxo de Caixa
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {analise?.projecao_fluxo_caixa && Object.entries(analise.projecao_fluxo_caixa).map(([periodo, dados]) => (
                    <Card key={periodo} className="overflow-hidden">
                      <CardHeader className="bg-muted/50 py-3">
                        <CardTitle className="text-sm">
                          {periodo === 'proximos_7_dias' ? 'Próximos 7 dias' :
                           periodo === 'proximos_30_dias' ? 'Próximos 30 dias' :
                           'Próximos 90 dias'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Entradas:</span>
                          <span className="font-medium text-green-600">{dados.entradas_previstas}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Saídas:</span>
                          <span className="font-medium text-destructive">{dados.saidas_previstas}</span>
                        </div>
                        <div className="border-t pt-2 flex items-center justify-between">
                          <span className="text-sm font-medium">Saldo:</span>
                          <span className={`font-bold ${parseValor(dados.saldo_projetado) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {dados.saldo_projetado}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>

              {/* Recomendações */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      Recomendações Estratégicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analise?.recomendacoes?.map((rec, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                          <span>{rec}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Alertas */}
            <TabsContent value="alertas" className="mt-4">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="h-4 w-4 text-primary" />
                      Alertas Identificados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AnimatePresence>
                      {analise?.alertas?.length ? (
                        <div className="space-y-3">
                          {analise.alertas.map((alerta, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="rounded-lg border bg-card p-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                {getAlertaBadge(alerta.tipo)}
                              </div>
                              <p className="mt-2 text-sm">{alerta.mensagem}</p>
                              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                <ArrowRight className="h-3 w-3" />
                                {alerta.acao_recomendada}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">
                          Nenhum alerta identificado
                        </p>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}