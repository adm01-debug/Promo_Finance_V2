// ============================================
// COMPONENTE: DASHBOARD DE MÉTRICAS TRIBUTÁRIAS
// ============================================

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp, TrendingDown, Target, Activity, Gauge, CheckCircle2, AlertTriangle,
  Clock, DollarSign, Percent, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { format, subMonths } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { useApuracoesTributarias } from '@/hooks/useApuracoesTributarias';
import { useCreditosTributarios } from '@/hooks/useCreditosTributarios';
import { useOperacoesTributaveis } from '@/hooks/useOperacoesTributaveis';
import useAlertasTributarios from '@/hooks/useAlertasTributarios';
import { MetricasInsights } from './dashboard-metricas/MetricasInsights';

export function DashboardMetricasTributarias() {
  const [empresaId, setEmpresaId] = useState<string>('');
  const [periodoMeses, setPeriodoMeses] = useState(6);

  const { data: empresas = [] } = useAllEmpresas();
  const { apuracoes } = useApuracoesTributarias(empresaId || undefined);
  const { creditos } = useCreditosTributarios(empresaId || undefined);
  const { operacoes } = useOperacoesTributaveis(empresaId || undefined);
  const { criticos } = useAlertasTributarios(empresaId || undefined);

  const periodoInicio = format(subMonths(new Date(), periodoMeses), 'yyyy-MM');
  const periodoFim = format(new Date(), 'yyyy-MM');

  const apuracoesPeriodo = useMemo(() => apuracoes.filter(a => a.competencia >= periodoInicio && a.competencia <= periodoFim), [apuracoes, periodoInicio, periodoFim]);

  const metricas = useMemo(() => {
    const totalTributosNovos = apuracoesPeriodo.reduce((sum, a) => sum + (a.cbs_a_pagar || 0) + (a.ibs_a_pagar || 0) + (a.is_a_pagar || 0), 0);
    const totalTributosResiduais = apuracoesPeriodo.reduce((sum, a) => sum + (a.pis_residual || 0) + (a.cofins_residual || 0) + (a.icms_residual || 0) + (a.iss_residual || 0), 0);
    const totalCreditos = apuracoesPeriodo.reduce((sum, a) => sum + (a.cbs_creditos || 0) + (a.ibs_creditos || 0), 0);
    const totalDebitos = apuracoesPeriodo.reduce((sum, a) => sum + (a.cbs_debitos || 0) + (a.ibs_debitos || 0), 0);
    const faturamento = operacoes.filter(o => ['venda', 'servico_prestado'].includes(o.tipo_operacao)).filter(o => o.data_operacao.substring(0, 7) >= periodoInicio).reduce((sum, o) => sum + o.valor_operacao, 0);
    const cargaEfetiva = faturamento > 0 ? ((totalTributosNovos + totalTributosResiduais) / faturamento) * 100 : 0;
    const taxaAproveitamentoCreditos = totalDebitos > 0 ? (totalCreditos / totalDebitos) * 100 : 0;
    const creditosDisponiveis = creditos.filter(c => c.status === 'disponivel').reduce((sum, c) => sum + (c.saldo_disponivel || 0), 0);
    const periodoAnteriorInicio = format(subMonths(new Date(), periodoMeses * 2), 'yyyy-MM');
    const apuracoesAnteriores = apuracoes.filter(a => a.competencia >= periodoAnteriorInicio && a.competencia < periodoInicio);
    const totalAnterior = apuracoesAnteriores.reduce((sum, a) => sum + (a.cbs_a_pagar || 0) + (a.ibs_a_pagar || 0), 0);
    const variacaoTributos = totalAnterior > 0 ? ((totalTributosNovos - totalAnterior) / totalAnterior) * 100 : 0;
    return {
      totalTributosNovos, totalTributosResiduais, totalCreditos, totalDebitos, faturamento,
      cargaEfetiva, taxaAproveitamentoCreditos, creditosDisponiveis, variacaoTributos,
      percentualMigracao: totalTributosNovos + totalTributosResiduais > 0 ? (totalTributosNovos / (totalTributosNovos + totalTributosResiduais)) * 100 : 0,
    };
  }, [apuracoesPeriodo, creditos, operacoes, apuracoes, periodoInicio]);

  const dadosEvolucao = apuracoesPeriodo.map(a => ({
    competencia: a.competencia,
    novos: (a.cbs_a_pagar || 0) + (a.ibs_a_pagar || 0) + (a.is_a_pagar || 0),
    residuais: (a.pis_residual || 0) + (a.cofins_residual || 0) + (a.icms_residual || 0),
    creditos: (a.cbs_creditos || 0) + (a.ibs_creditos || 0),
  }));

  const scoreSaude = useMemo(() => {
    let score = 100;
    score -= criticos * 10;
    if (metricas.taxaAproveitamentoCreditos < 80) score -= (80 - metricas.taxaAproveitamentoCreditos) / 2;
    if (metricas.cargaEfetiva > 30) score -= (metricas.cargaEfetiva - 30);
    if (metricas.percentualMigracao > 50) score += 5;
    return Math.max(0, Math.min(100, score));
  }, [criticos, metricas]);

  const getScoreCor = (score: number) => score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : score >= 40 ? 'text-streak' : 'text-destructive';
  const getScoreLabel = (score: number) => score >= 80 ? 'Excelente' : score >= 60 ? 'Bom' : score >= 40 ? 'Regular' : 'Crítico';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Dashboard de Métricas Tributárias</CardTitle><CardDescription>Indicadores de performance e saúde tributária</CardDescription></div>
            <div className="flex items-center gap-4">
              <Select value={empresaId} onValueChange={setEmpresaId}><SelectTrigger className="w-48"><SelectValue placeholder="Selecione empresa" /></SelectTrigger><SelectContent>{empresas.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.razao_social}</SelectItem>)}</SelectContent></Select>
              <Select value={String(periodoMeses)} onValueChange={v => setPeriodoMeses(Number(v))}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="3">3 meses</SelectItem><SelectItem value="6">6 meses</SelectItem><SelectItem value="12">12 meses</SelectItem></SelectContent></Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {empresaId && (
        <>
          {/* Score + KPIs */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="md:col-span-1"><CardContent className="pt-6 flex flex-col items-center justify-center h-full">
              <Gauge className="h-8 w-8 text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Saúde Tributária</p>
              <p className={`text-4xl font-bold ${getScoreCor(scoreSaude)}`}>{scoreSaude.toFixed(0)}</p>
              <Badge variant={scoreSaude >= 60 ? 'default' : 'destructive'} className="mt-2">{getScoreLabel(scoreSaude)}</Badge>
            </CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">Carga Efetiva</p><p className="text-2xl font-bold">{metricas.cargaEfetiva.toFixed(2)}%</p></div><Percent className="h-5 w-5 text-primary" /></div><Progress value={Math.min(metricas.cargaEfetiva * 3, 100)} className="mt-3" /><p className="text-xs text-muted-foreground mt-1">Meta: &lt; 25%</p></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">Aproveitamento Créditos</p><p className="text-2xl font-bold">{metricas.taxaAproveitamentoCreditos.toFixed(1)}%</p></div><Target className="h-5 w-5 text-success" /></div><Progress value={metricas.taxaAproveitamentoCreditos} className="mt-3" /><p className="text-xs text-muted-foreground mt-1">Ideal: &gt; 80%</p></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">Migração IBS/CBS</p><p className="text-2xl font-bold">{metricas.percentualMigracao.toFixed(0)}%</p></div><TrendingUp className="h-5 w-5 text-secondary" /></div><Progress value={metricas.percentualMigracao} className="mt-3" /><p className="text-xs text-muted-foreground mt-1">Transição tributária</p></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">Alertas Críticos</p><p className="text-2xl font-bold">{criticos}</p></div>{criticos > 0 ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <CheckCircle2 className="h-5 w-5 text-success" />}</div><div className="mt-3"><Badge variant={criticos === 0 ? 'default' : 'destructive'}>{criticos === 0 ? 'Em dia' : 'Atenção necessária'}</Badge></div></CardContent></Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card><CardHeader><CardTitle className="text-lg">Evolução dos Tributos</CardTitle><CardDescription>Tributos novos vs residuais</CardDescription></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={300}><AreaChart data={dadosEvolucao}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="competencia" /><YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} /><Tooltip formatter={(value: number) => formatCurrency(value)} /><Legend />
                <Area type="monotone" dataKey="novos" name="IBS + CBS + IS" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                <Area type="monotone" dataKey="residuais" name="Residuais" stackId="1" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted))" fillOpacity={0.4} />
              </AreaChart></ResponsiveContainer>
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-lg">Débitos x Créditos</CardTitle><CardDescription>Aproveitamento mensal</CardDescription></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={300}><BarChart data={dadosEvolucao}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="competencia" /><YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} /><Tooltip formatter={(value: number) => formatCurrency(value)} /><Legend />
                <Bar dataKey="novos" name="Débitos" fill="hsl(var(--destructive))" /><Bar dataKey="creditos" name="Créditos" fill="hsl(var(--primary))" />
              </BarChart></ResponsiveContainer>
            </CardContent></Card>
          </div>

          {/* Financial Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-primary/20 bg-primary/5"><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Faturamento Período</p><p className="text-xl font-bold">{formatCurrency(metricas.faturamento)}</p></div></div></CardContent></Card>
            <Card className="border-destructive/20 bg-destructive/5"><CardContent className="pt-6"><div className="flex items-center gap-3"><TrendingDown className="h-8 w-8 text-destructive" /><div><p className="text-sm text-muted-foreground">Total Tributos</p><p className="text-xl font-bold">{formatCurrency(metricas.totalTributosNovos + metricas.totalTributosResiduais)}</p>
              {metricas.variacaoTributos !== 0 && <div className={`flex items-center text-xs ${metricas.variacaoTributos > 0 ? 'text-destructive' : 'text-success'}`}>{metricas.variacaoTributos > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(metricas.variacaoTributos).toFixed(1)}% vs período anterior</div>}
            </div></div></CardContent></Card>
            <Card className="border-success/20 bg-success/5"><CardContent className="pt-6"><div className="flex items-center gap-3"><TrendingUp className="h-8 w-8 text-success" /><div><p className="text-sm text-muted-foreground">Créditos Utilizados</p><p className="text-xl font-bold">{formatCurrency(metricas.totalCreditos)}</p></div></div></CardContent></Card>
            <Card className="border-secondary/20 bg-secondary/5"><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-secondary" /><div><p className="text-sm text-muted-foreground">Créditos Disponíveis</p><p className="text-xl font-bold">{formatCurrency(metricas.creditosDisponiveis)}</p></div></div></CardContent></Card>
          </div>

          <MetricasInsights taxaAproveitamentoCreditos={metricas.taxaAproveitamentoCreditos} creditosDisponiveis={metricas.creditosDisponiveis} percentualMigracao={metricas.percentualMigracao} criticos={criticos} />
        </>
      )}
    </div>
  );
}

export default DashboardMetricasTributarias;
