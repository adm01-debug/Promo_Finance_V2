import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Bell,
  Users,
  Zap,
  Shield,
  Activity,
  CreditCard,
  BarChart3,
  PieChart,
  Calendar,
  Smartphone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAprovacoesPendentesCount } from '@/hooks/useAprovacoesPendentesCount';
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 25 } },
} as const;

interface CockpitData {
  saldoTotal: number;
  saldoDisponivel: number;
  totalReceberPendente: number;
  totalPagarPendente: number;
  totalVencidoReceber: number;
  totalVencidoPagar: number;
  taxaInadimplencia: number;
  contasVencemHoje: number;
  contasVencemSemana: number;
  scoreSaude: number;
  alertasCriticos: number;
  receitaMesAtual: number;
  receitaMesAnterior: number;
  despesaMesAtual: number;
  despesaMesAnterior: number;
  fluxoProximosDias: number;
  diasCobertura: number;
}

function useCockpitData() {
  return useQuery({
    queryKey: ['cockpit-cfo-data'],
    queryFn: async (): Promise<CockpitData> => {
      const hoje = new Date();
      const hojeStr = format(hoje, 'yyyy-MM-dd');
      const semana = format(new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const inicioMes = format(startOfMonth(hoje), 'yyyy-MM-dd');
      const fimMes = format(endOfMonth(hoje), 'yyyy-MM-dd');
      const inicioMesAnterior = format(startOfMonth(subMonths(hoje, 1)), 'yyyy-MM-dd');
      const fimMesAnterior = format(endOfMonth(subMonths(hoje, 1)), 'yyyy-MM-dd');

      const [
        contasBancarias,
        receberPendentes,
        pagarPendentes,
        receberVencidas,
        pagarVencidas,
        vencemHoje,
        vencemSemana,
        alertasCriticos,
        ultimoScore,
        receitasMes,
        receitasMesAnt,
        despesasMes,
        despesasMesAnt,
      ] = await Promise.all([
        supabase.from('contas_bancarias').select('saldo_atual, saldo_disponivel').eq('ativo', true),
        supabase.from('contas_receber').select('valor, valor_recebido').in('status', ['pendente', 'parcial']),
        supabase.from('contas_pagar').select('valor, valor_pago').in('status', ['pendente', 'parcial']),
        supabase.from('contas_receber').select('valor, valor_recebido').eq('status', 'vencido'),
        supabase.from('contas_pagar').select('valor, valor_pago').eq('status', 'vencido'),
        supabase.from('contas_receber').select('id', { count: 'exact', head: true })
          .eq('data_vencimento', hojeStr).eq('status', 'pendente'),
        supabase.from('contas_receber').select('id', { count: 'exact', head: true })
          .gte('data_vencimento', hojeStr).lte('data_vencimento', semana).eq('status', 'pendente'),
        supabase.from('alertas').select('id', { count: 'exact', head: true })
          .eq('lido', false).eq('prioridade', 'critica'),
        supabase.from('historico_score_saude').select('score').order('created_at', { ascending: false }).limit(1),
        supabase.from('contas_receber').select('valor_recebido').eq('status', 'pago')
          .gte('data_recebimento', inicioMes).lte('data_recebimento', fimMes),
        supabase.from('contas_receber').select('valor_recebido').eq('status', 'pago')
          .gte('data_recebimento', inicioMesAnterior).lte('data_recebimento', fimMesAnterior),
        supabase.from('contas_pagar').select('valor_pago').eq('status', 'pago')
          .gte('data_pagamento', inicioMes).lte('data_pagamento', fimMes),
        supabase.from('contas_pagar').select('valor_pago').eq('status', 'pago')
          .gte('data_pagamento', inicioMesAnterior).lte('data_pagamento', fimMesAnterior),
      ]);

      const saldoTotal = contasBancarias.data?.reduce((sum, c) => sum + (c.saldo_atual || 0), 0) || 0;
      const saldoDisponivel = contasBancarias.data?.reduce((sum, c) => sum + (c.saldo_disponivel || 0), 0) || 0;

      const totalReceberPendente = receberPendentes.data?.reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0) || 0;
      const totalPagarPendente = pagarPendentes.data?.reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0) || 0;

      const totalVencidoReceber = receberVencidas.data?.reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0) || 0;
      const totalVencidoPagar = pagarVencidas.data?.reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0) || 0;

      const totalReceber = totalReceberPendente + totalVencidoReceber;
      const taxaInadimplencia = totalReceber > 0 ? (totalVencidoReceber / totalReceber) * 100 : 0;

      const receitaMesAtual = receitasMes.data?.reduce((sum, c) => sum + (c.valor_recebido || 0), 0) || 0;
      const receitaMesAnterior = receitasMesAnt.data?.reduce((sum, c) => sum + (c.valor_recebido || 0), 0) || 0;
      const despesaMesAtual = despesasMes.data?.reduce((sum, c) => sum + (c.valor_pago || 0), 0) || 0;
      const despesaMesAnterior = despesasMesAnt.data?.reduce((sum, c) => sum + (c.valor_pago || 0), 0) || 0;

      // Fluxo próximos 30 dias (receitas - despesas pendentes)
      const fluxoProximosDias = totalReceberPendente - totalPagarPendente;

      // Dias de cobertura = saldo / (despesas médias diárias)
      const despesaMediaDiaria = despesaMesAtual > 0 ? despesaMesAtual / 30 : 1000;
      const diasCobertura = Math.round(saldoDisponivel / despesaMediaDiaria);

      return {
        saldoTotal,
        saldoDisponivel,
        totalReceberPendente,
        totalPagarPendente,
        totalVencidoReceber,
        totalVencidoPagar,
        taxaInadimplencia,
        contasVencemHoje: vencemHoje.count || 0,
        contasVencemSemana: vencemSemana.count || 0,
        scoreSaude: ultimoScore.data?.[0]?.score || 75,
        alertasCriticos: alertasCriticos.count || 0,
        receitaMesAtual,
        receitaMesAnterior,
        despesaMesAtual,
        despesaMesAnterior,
        fluxoProximosDias,
        diasCobertura,
      };
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
}

interface QuickAction {
  label: string;
  icon: React.ElementType;
  href: string;
  color: string;
  count?: number;
}

export function CockpitCFO() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useCockpitData();
  const { count: aprovacoesPendentes } = useAprovacoesPendentesCount();

  const quickActions: QuickAction[] = [
    { label: 'Aprovações', icon: CheckCircle2, href: '/aprovacoes', color: 'text-amber-500', count: aprovacoesPendentes },
    { label: 'Cobranças', icon: Users, href: '/cobrancas', color: 'text-destructive', count: data?.totalVencidoReceber ? 1 : 0 },
    { label: 'Fluxo Caixa', icon: Activity, href: '/fluxo-caixa', color: 'text-primary' },
    { label: 'Alertas', icon: Bell, href: '/alertas', color: 'text-orange-500', count: data?.alertasCriticos },
    { label: 'Relatórios', icon: BarChart3, href: '/relatorios', color: 'text-blue-500' },
    { label: 'Clientes', icon: CreditCard, href: '/clientes', color: 'text-emerald-500' },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-destructive';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { label: 'Excelente', icon: Shield, color: 'bg-emerald-500/10 text-emerald-500' };
    if (score >= 60) return { label: 'Atenção', icon: AlertTriangle, color: 'bg-amber-500/10 text-amber-500' };
    return { label: 'Crítico', icon: XCircle, color: 'bg-destructive/10 text-destructive' };
  };

  const calcularVariacao = (atual: number, anterior: number) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return ((atual - anterior) / anterior) * 100;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="h-24 bg-muted/50" />
        ))}
      </div>
    );
  }

  const scoreStatus = getScoreStatus(data?.scoreSaude || 0);
  const variacaoReceita = calcularVariacao(data?.receitaMesAtual || 0, data?.receitaMesAnterior || 0);
  const variacaoDespesa = calcularVariacao(data?.despesaMesAtual || 0, data?.despesaMesAnterior || 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Header Mobile-First */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Cockpit CFO</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {format(new Date(), "EEE, d 'de' MMM", { locale: ptBR })}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-1">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </motion.div>

      {/* Score de Saúde Destaque */}
      <motion.div variants={itemVariants}>
        <Card className={cn("border-2", 
          (data?.scoreSaude || 0) >= 80 ? "border-emerald-500/30 bg-emerald-500/5" :
          (data?.scoreSaude || 0) >= 60 ? "border-amber-500/30 bg-amber-500/5" : 
          "border-destructive/30 bg-destructive/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-full", scoreStatus.color)}>
                  <scoreStatus.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Saúde Financeira</p>
                  <div className="flex items-center gap-2">
                    <p className={cn("text-2xl font-bold", getScoreColor(data?.scoreSaude || 0))}>
                      {data?.scoreSaude || 0}
                    </p>
                    <Badge variant="outline" className={cn("text-xs", scoreStatus.color)}>
                      {scoreStatus.label}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Cobertura</p>
                <p className={cn("text-lg font-bold", 
                  (data?.diasCobertura || 0) >= 30 ? "text-emerald-500" :
                  (data?.diasCobertura || 0) >= 15 ? "text-amber-500" : "text-destructive"
                )}>
                  {data?.diasCobertura || 0} dias
                </p>
              </div>
            </div>
            <Progress value={data?.scoreSaude || 0} className="h-2 mt-3" />
          </CardContent>
        </Card>
      </motion.div>

      {/* KPIs Grid Mobile-First */}
      <motion.div variants={itemVariants}>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-2">
            {/* Saldo */}
            <Card className="min-w-[140px] sm:min-w-[160px] shrink-0">
              <CardContent className="p-3">
                <div className="flex items-center gap-1 mb-1">
                  <Wallet className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground">SALDO</span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(data?.saldoTotal || 0)}</p>
                <p className="text-[10px] text-muted-foreground">
                  Disp: {formatCurrency(data?.saldoDisponivel || 0)}
                </p>
              </CardContent>
            </Card>

            {/* A Receber */}
            <Card className="min-w-[140px] sm:min-w-[160px] shrink-0 border-emerald-500/30">
              <CardContent className="p-3">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-[10px] font-medium text-muted-foreground">A RECEBER</span>
                </div>
                <p className="text-lg font-bold text-emerald-500">{formatCurrency(data?.totalReceberPendente || 0)}</p>
                {(data?.totalVencidoReceber || 0) > 0 && (
                  <p className="text-[10px] text-destructive">
                    Vencido: {formatCurrency(data?.totalVencidoReceber || 0)}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* A Pagar */}
            <Card className="min-w-[140px] sm:min-w-[160px] shrink-0 border-destructive/30">
              <CardContent className="p-3">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingDown className="h-3 w-3 text-destructive" />
                  <span className="text-[10px] font-medium text-muted-foreground">A PAGAR</span>
                </div>
                <p className="text-lg font-bold text-destructive">{formatCurrency(data?.totalPagarPendente || 0)}</p>
                {(data?.totalVencidoPagar || 0) > 0 && (
                  <p className="text-[10px] text-amber-500">
                    Vencido: {formatCurrency(data?.totalVencidoPagar || 0)}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Fluxo Projetado */}
            <Card className="min-w-[140px] sm:min-w-[160px] shrink-0">
              <CardContent className="p-3">
                <div className="flex items-center gap-1 mb-1">
                  <Activity className="h-3 w-3 text-blue-500" />
                  <span className="text-[10px] font-medium text-muted-foreground">FLUXO 30D</span>
                </div>
                <p className={cn("text-lg font-bold", 
                  (data?.fluxoProximosDias || 0) >= 0 ? "text-emerald-500" : "text-destructive"
                )}>
                  {formatCurrency(data?.fluxoProximosDias || 0)}
                </p>
              </CardContent>
            </Card>

            {/* Inadimplência */}
            <Card className="min-w-[140px] sm:min-w-[160px] shrink-0">
              <CardContent className="p-3">
                <div className="flex items-center gap-1 mb-1">
                  <AlertTriangle className={cn("h-3 w-3", 
                    (data?.taxaInadimplencia || 0) > 10 ? "text-destructive" : "text-amber-500"
                  )} />
                  <span className="text-[10px] font-medium text-muted-foreground">INADIMPL.</span>
                </div>
                <p className={cn("text-lg font-bold", 
                  (data?.taxaInadimplencia || 0) > 10 ? "text-destructive" : "text-amber-500"
                )}>
                  {formatPercentage(data?.taxaInadimplencia || 0)}
                </p>
                <Progress value={Math.min(data?.taxaInadimplencia || 0, 100)} className="h-1 mt-1" />
              </CardContent>
            </Card>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </motion.div>

      {/* Performance do Mês */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Receita Mês</span>
              <Badge variant={variacaoReceita >= 0 ? "default" : "destructive"} className="text-[10px] h-5">
                {variacaoReceita >= 0 ? '+' : ''}{variacaoReceita.toFixed(1)}%
              </Badge>
            </div>
            <p className="text-lg font-bold text-emerald-500">{formatCurrency(data?.receitaMesAtual || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Despesa Mês</span>
              <Badge variant={variacaoDespesa <= 0 ? "default" : "destructive"} className="text-[10px] h-5">
                {variacaoDespesa >= 0 ? '+' : ''}{variacaoDespesa.toFixed(1)}%
              </Badge>
            </div>
            <p className="text-lg font-bold text-destructive">{formatCurrency(data?.despesaMesAtual || 0)}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ações Rápidas */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto py-2 px-2 flex flex-col items-center gap-1 relative"
                  onClick={() => navigate(action.href)}
                >
                  <div className="relative">
                    <action.icon className={cn("h-5 w-5", action.color)} />
                    {action.count !== undefined && action.count > 0 && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full text-[8px] text-white flex items-center justify-center">
                        {action.count}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alertas do Dia */}
      {((data?.contasVencemHoje || 0) > 0 || (data?.alertasCriticos || 0) > 0 || (data?.contasVencemSemana || 0) > 0) && (
        <motion.div variants={itemVariants}>
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Agenda Financeira</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {data?.contasVencemHoje || 0} hoje • {data?.contasVencemSemana || 0} esta semana
                    {(data?.alertasCriticos || 0) > 0 && ` • ${data?.alertasCriticos} alertas`}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => navigate('/contas-receber')}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
