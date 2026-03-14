// ============================================
// COMPONENTE: DASHBOARD DE MÉTRICAS TRIBUTÁRIAS
// KPIs e Performance Tributária
// ============================================

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  Activity,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Percent,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  BarChart,
  Bar,
} from 'recharts';
import { format, subMonths } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { useApuracoesTributarias } from '@/hooks/useApuracoesTributarias';
import { useCreditosTributarios } from '@/hooks/useCreditosTributarios';
import { useOperacoesTributaveis } from '@/hooks/useOperacoesTributaveis';
import useAlertasTributarios from '@/hooks/useAlertasTributarios';

interface MetricaCard {
  titulo: string;
  valor: string | number;
  variacao?: number;
  tendencia?: 'up' | 'down' | 'stable';
  icone: React.ReactNode;
  cor: string;
  meta?: number;
  atual?: number;
}

export function DashboardMetricasTributarias() {
  const [empresaId, setEmpresaId] = useState<string>('');
  const [periodoMeses, setPeriodoMeses] = useState(6);

  const { data: empresas = [] } = useAllEmpresas();
  const { apuracoes } = useApuracoesTributarias(empresaId || undefined);
  const { creditos } = useCreditosTributarios(empresaId || undefined);
  const { operacoes } = useOperacoesTributaveis(empresaId || undefined);
  const { alertas, criticos } = useAlertasTributarios(empresaId || undefined);

  // Calcular período
  const periodoInicio = format(subMonths(new Date(), periodoMeses), 'yyyy-MM');
  const periodoFim = format(new Date(), 'yyyy-MM');

  // Filtrar dados pelo período
  const apuracoesPeriodo = useMemo(() => {
    return apuracoes.filter(a => a.competencia >= periodoInicio && a.competencia <= periodoFim);
  }, [apuracoes, periodoInicio, periodoFim]);

  // Métricas calculadas
  const metricas = useMemo(() => {
    const totalTributosNovos = apuracoesPeriodo.reduce((sum, a) => 
      sum + (a.cbs_a_pagar || 0) + (a.ibs_a_pagar || 0) + (a.is_a_pagar || 0), 0);
    
    const totalTributosResiduais = apuracoesPeriodo.reduce((sum, a) => 
      sum + (a.pis_residual || 0) + (a.cofins_residual || 0) + (a.icms_residual || 0) + (a.iss_residual || 0), 0);

    const totalCreditos = apuracoesPeriodo.reduce((sum, a) => 
      sum + (a.cbs_creditos || 0) + (a.ibs_creditos || 0), 0);

    const totalDebitos = apuracoesPeriodo.reduce((sum, a) => 
      sum + (a.cbs_debitos || 0) + (a.ibs_debitos || 0), 0);

    const faturamento = operacoes
      .filter(o => ['venda', 'servico_prestado'].includes(o.tipo_operacao))
      .filter(o => o.data_operacao.substring(0, 7) >= periodoInicio)
      .reduce((sum, o) => sum + o.valor_operacao, 0);

    const cargaEfetiva = faturamento > 0 
      ? ((totalTributosNovos + totalTributosResiduais) / faturamento) * 100 
      : 0;

    const taxaAproveitamentoCreditos = totalDebitos > 0 
      ? (totalCreditos / totalDebitos) * 100 
      : 0;

    const creditosDisponiveis = creditos
      .filter(c => c.status === 'disponivel')
      .reduce((sum, c) => sum + (c.saldo_disponivel || 0), 0);

    // Comparar com período anterior
    const periodoAnteriorInicio = format(subMonths(new Date(), periodoMeses * 2), 'yyyy-MM');
    const apuracoesAnteriores = apuracoes.filter(a => 
      a.competencia >= periodoAnteriorInicio && a.competencia < periodoInicio
    );

    const totalAnterior = apuracoesAnteriores.reduce((sum, a) => 
      sum + (a.cbs_a_pagar || 0) + (a.ibs_a_pagar || 0), 0);

    const variacaoTributos = totalAnterior > 0 
      ? ((totalTributosNovos - totalAnterior) / totalAnterior) * 100 
      : 0;

    return {
      totalTributosNovos,
      totalTributosResiduais,
      totalCreditos,
      totalDebitos,
      faturamento,
      cargaEfetiva,
      taxaAproveitamentoCreditos,
      creditosDisponiveis,
      variacaoTributos,
      percentualMigracao: totalTributosNovos + totalTributosResiduais > 0
        ? (totalTributosNovos / (totalTributosNovos + totalTributosResiduais)) * 100
        : 0,
    };
  }, [apuracoesPeriodo, creditos, operacoes, apuracoes, periodoInicio]);

  // Dados para gráfico de evolução
  const dadosEvolucao = apuracoesPeriodo.map(a => ({
    competencia: a.competencia,
    novos: (a.cbs_a_pagar || 0) + (a.ibs_a_pagar || 0) + (a.is_a_pagar || 0),
    residuais: (a.pis_residual || 0) + (a.cofins_residual || 0) + (a.icms_residual || 0),
    creditos: (a.cbs_creditos || 0) + (a.ibs_creditos || 0),
  }));

  // Dados para gauge de carga tributária
  const dadosGauge = [
    { name: 'Carga', value: metricas.cargaEfetiva, fill: 'hsl(var(--primary))' },
  ];

  // Score de saúde tributária (0-100)
  const scoreSaude = useMemo(() => {
    let score = 100;
    
    // Penalizar por alertas críticos
    score -= criticos * 10;
    
    // Penalizar por baixo aproveitamento de créditos
    if (metricas.taxaAproveitamentoCreditos < 80) {
      score -= (80 - metricas.taxaAproveitamentoCreditos) / 2;
    }
    
    // Penalizar por carga tributária alta
    if (metricas.cargaEfetiva > 30) {
      score -= (metricas.cargaEfetiva - 30);
    }

    // Bonificar por boa migração
    if (metricas.percentualMigracao > 50) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }, [criticos, metricas]);

  const getScoreCor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-streak';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Crítico';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Dashboard de Métricas Tributárias
              </CardTitle>
              <CardDescription>
                Indicadores de performance e saúde tributária
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecione empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(periodoMeses)} onValueChange={(v) => setPeriodoMeses(Number(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 meses</SelectItem>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {empresaId && (
        <>
          {/* Score de Saúde + KPIs Principais */}
          <div className="grid gap-4 md:grid-cols-5">
            {/* Score de Saúde */}
            <Card className="md:col-span-1">
              <CardContent className="pt-6 flex flex-col items-center justify-center h-full">
                <Gauge className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Saúde Tributária</p>
                <p className={`text-4xl font-bold ${getScoreCor(scoreSaude)}`}>
                  {scoreSaude.toFixed(0)}
                </p>
                <Badge variant={scoreSaude >= 60 ? 'default' : 'destructive'} className="mt-2">
                  {getScoreLabel(scoreSaude)}
                </Badge>
              </CardContent>
            </Card>

            {/* KPIs */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Carga Efetiva</p>
                    <p className="text-2xl font-bold">{metricas.cargaEfetiva.toFixed(2)}%</p>
                  </div>
                  <Percent className="h-5 w-5 text-primary" />
                </div>
                <Progress value={Math.min(metricas.cargaEfetiva * 3, 100)} className="mt-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  Meta: &lt; 25%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Aproveitamento Créditos</p>
                    <p className="text-2xl font-bold">{metricas.taxaAproveitamentoCreditos.toFixed(1)}%</p>
                  </div>
                  <Target className="h-5 w-5 text-success" />
                </div>
                <Progress value={metricas.taxaAproveitamentoCreditos} className="mt-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  Ideal: &gt; 80%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Migração IBS/CBS</p>
                    <p className="text-2xl font-bold">{metricas.percentualMigracao.toFixed(0)}%</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-secondary" />
                </div>
                <Progress value={metricas.percentualMigracao} className="mt-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  Transição tributária
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Alertas Críticos</p>
                    <p className="text-2xl font-bold">{criticos}</p>
                  </div>
                  {criticos > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  )}
                </div>
                <div className="mt-3">
                  <Badge variant={criticos === 0 ? 'default' : 'destructive'}>
                    {criticos === 0 ? 'Em dia' : 'Atenção necessária'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Evolução dos Tributos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Evolução dos Tributos</CardTitle>
                <CardDescription>Tributos novos vs residuais</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dadosEvolucao}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="competencia" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="novos" 
                      name="IBS + CBS + IS"
                      stackId="1"
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="residuais" 
                      name="Residuais"
                      stackId="1"
                      stroke="hsl(var(--muted-foreground))" 
                      fill="hsl(var(--muted))" 
                      fillOpacity={0.4}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Créditos vs Débitos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Débitos x Créditos</CardTitle>
                <CardDescription>Aproveitamento mensal</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosEvolucao}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="competencia" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="novos" name="Débitos" fill="hsl(var(--destructive))" />
                    <Bar dataKey="creditos" name="Créditos" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Resumo Financeiro */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Faturamento Período</p>
                    <p className="text-xl font-bold">{formatCurrency(metricas.faturamento)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tributos</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(metricas.totalTributosNovos + metricas.totalTributosResiduais)}
                    </p>
                    {metricas.variacaoTributos !== 0 && (
                      <div className={`flex items-center text-xs ${metricas.variacaoTributos > 0 ? 'text-destructive' : 'text-success'}`}>
                        {metricas.variacaoTributos > 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {Math.abs(metricas.variacaoTributos).toFixed(1)}% vs período anterior
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-success/20 bg-success/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-sm text-muted-foreground">Créditos Utilizados</p>
                    <p className="text-xl font-bold">{formatCurrency(metricas.totalCreditos)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-secondary/20 bg-secondary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-secondary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Créditos Disponíveis</p>
                    <p className="text-xl font-bold">{formatCurrency(metricas.creditosDisponiveis)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Insights Automáticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {metricas.taxaAproveitamentoCreditos < 80 && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Baixo aproveitamento de créditos</p>
                        <p className="text-sm text-muted-foreground">
                          Apenas {metricas.taxaAproveitamentoCreditos.toFixed(1)}% dos créditos estão sendo utilizados. 
                          Revise as entradas para maximizar o aproveitamento.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {metricas.creditosDisponiveis > 50000 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Créditos acumulados disponíveis</p>
                        <p className="text-sm text-muted-foreground">
                          Você tem {formatCurrency(metricas.creditosDisponiveis)} em créditos disponíveis. 
                          Considere utilizar para compensação.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {metricas.percentualMigracao > 50 && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Boa aderência à reforma</p>
                        <p className="text-sm text-muted-foreground">
                          {metricas.percentualMigracao.toFixed(0)}% dos tributos já estão no novo sistema IBS/CBS. 
                          Continue acompanhando a transição.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {criticos === 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Compliance em dia</p>
                        <p className="text-sm text-muted-foreground">
                          Não há alertas críticos pendentes. Todas as obrigações estão sob controle.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default DashboardMetricasTributarias;
