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
  FileText,
  Users,
  Zap,
  Shield,
  Target,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAprovacoesPendentesCount } from '@/hooks/useAprovacoesPendentesCount';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

interface CockpitData {
  saldoTotal: number;
  saldoDisponivel: number;
  receitasHoje: number;
  despesasHoje: number;
  totalReceberPendente: number;
  totalPagarPendente: number;
  totalVencidoReceber: number;
  totalVencidoPagar: number;
  taxaInadimplencia: number;
  contasVencemHoje: number;
  scoreSaude: number;
  alertasCriticos: number;
}

function useCockpitData() {
  return useQuery({
    queryKey: ['cockpit-cfo-data'],
    queryFn: async (): Promise<CockpitData> => {
      const hoje = format(new Date(), 'yyyy-MM-dd');

      const [
        contasBancarias,
        receberPendentes,
        pagarPendentes,
        receberVencidas,
        pagarVencidas,
        vencemHoje,
        alertasCriticos,
        ultimoScore,
      ] = await Promise.all([
        supabase.from('contas_bancarias').select('saldo_atual, saldo_disponivel').eq('ativo', true),
        supabase.from('contas_receber').select('valor, valor_recebido').in('status', ['pendente', 'parcial']),
        supabase.from('contas_pagar').select('valor, valor_pago').in('status', ['pendente', 'parcial']),
        supabase.from('contas_receber').select('valor, valor_recebido').eq('status', 'vencido'),
        supabase.from('contas_pagar').select('valor, valor_pago').eq('status', 'vencido'),
        supabase.from('contas_receber').select('id', { count: 'exact', head: true })
          .eq('data_vencimento', hoje).eq('status', 'pendente'),
        supabase.from('alertas').select('id', { count: 'exact', head: true })
          .eq('lido', false).eq('prioridade', 'critica'),
        supabase.from('historico_score_saude').select('score').order('created_at', { ascending: false }).limit(1),
      ]);

      const saldoTotal = contasBancarias.data?.reduce((sum, c) => sum + (c.saldo_atual || 0), 0) || 0;
      const saldoDisponivel = contasBancarias.data?.reduce((sum, c) => sum + (c.saldo_disponivel || 0), 0) || 0;

      const totalReceberPendente = receberPendentes.data?.reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0) || 0;
      const totalPagarPendente = pagarPendentes.data?.reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0) || 0;

      const totalVencidoReceber = receberVencidas.data?.reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0) || 0;
      const totalVencidoPagar = pagarVencidas.data?.reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0) || 0;

      const totalReceber = totalReceberPendente + totalVencidoReceber;
      const taxaInadimplencia = totalReceber > 0 ? (totalVencidoReceber / totalReceber) * 100 : 0;

      return {
        saldoTotal,
        saldoDisponivel,
        receitasHoje: 0,
        despesasHoje: 0,
        totalReceberPendente,
        totalPagarPendente,
        totalVencidoReceber,
        totalVencidoPagar,
        taxaInadimplencia,
        contasVencemHoje: vencemHoje.count || 0,
        scoreSaude: ultimoScore.data?.[0]?.score || 75,
        alertasCriticos: alertasCriticos.count || 0,
      };
    },
    refetchInterval: 60000, // Atualiza a cada minuto
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
    {
      label: 'Aprovações',
      icon: CheckCircle2,
      href: '/aprovacoes',
      color: 'text-amber-500',
      count: aprovacoesPendentes,
    },
    {
      label: 'Cobranças',
      icon: Users,
      href: '/cobrancas',
      color: 'text-destructive',
      count: data?.totalVencidoReceber ? 1 : 0,
    },
    {
      label: 'Fluxo de Caixa',
      icon: Activity,
      href: '/fluxo-caixa',
      color: 'text-primary',
    },
    {
      label: 'Alertas',
      icon: Bell,
      href: '/alertas',
      color: 'text-orange-500',
      count: data?.alertasCriticos,
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-amber-500';
    return 'text-destructive';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { label: 'Excelente', icon: Shield, color: 'bg-success/10 text-success' };
    if (score >= 60) return { label: 'Atenção', icon: AlertTriangle, color: 'bg-amber-500/10 text-amber-500' };
    return { label: 'Crítico', icon: XCircle, color: 'bg-destructive/10 text-destructive' };
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="h-32 bg-muted/50" />
        ))}
      </div>
    );
  }

  const scoreStatus = getScoreStatus(data?.scoreSaude || 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Cockpit do CFO</h2>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </motion.div>

      {/* KPIs Principais */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Saldo Total */}
        <Card className="col-span-1 lg:col-span-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Saldo Total</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(data?.saldoTotal || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Disponível: {formatCurrency(data?.saldoDisponivel || 0)}
            </p>
          </CardContent>
        </Card>

        {/* A Receber */}
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-xs font-medium text-muted-foreground">A Receber</span>
            </div>
            <p className="text-xl font-bold text-success">{formatCurrency(data?.totalReceberPendente || 0)}</p>
            {(data?.totalVencidoReceber || 0) > 0 && (
              <p className="text-xs text-destructive mt-1">
                Vencido: {formatCurrency(data?.totalVencidoReceber || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* A Pagar */}
        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-xs font-medium text-muted-foreground">A Pagar</span>
            </div>
            <p className="text-xl font-bold text-destructive">{formatCurrency(data?.totalPagarPendente || 0)}</p>
            {(data?.totalVencidoPagar || 0) > 0 && (
              <p className="text-xs text-amber-500 mt-1">
                Vencido: {formatCurrency(data?.totalVencidoPagar || 0)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Inadimplência */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={cn("h-4 w-4", (data?.taxaInadimplencia || 0) > 10 ? "text-destructive" : "text-amber-500")} />
              <span className="text-xs font-medium text-muted-foreground">Inadimplência</span>
            </div>
            <p className={cn("text-xl font-bold", (data?.taxaInadimplencia || 0) > 10 ? "text-destructive" : "text-amber-500")}>
              {formatPercentage(data?.taxaInadimplencia || 0)}
            </p>
            <Progress 
              value={Math.min(data?.taxaInadimplencia || 0, 100)} 
              className="h-1.5 mt-2" 
            />
          </CardContent>
        </Card>

        {/* Score de Saúde */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <scoreStatus.icon className={cn("h-4 w-4", getScoreColor(data?.scoreSaude || 0))} />
              <span className="text-xs font-medium text-muted-foreground">Saúde Financeira</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className={cn("text-xl font-bold", getScoreColor(data?.scoreSaude || 0))}>
                {data?.scoreSaude || 0}
              </p>
              <Badge variant="outline" className={cn("text-xs", scoreStatus.color)}>
                {scoreStatus.label}
              </Badge>
            </div>
            <Progress 
              value={data?.scoreSaude || 0} 
              className="h-1.5 mt-2" 
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Ações Rápidas */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto py-3 px-4 flex flex-col items-start gap-1 relative hover:bg-accent/50 transition-colors"
                  onClick={() => navigate(action.href)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <action.icon className={cn("h-4 w-4", action.color)} />
                    <span className="text-sm font-medium">{action.label}</span>
                    {action.count !== undefined && action.count > 0 && (
                      <Badge variant="destructive" className="ml-auto text-xs h-5 min-w-5 flex items-center justify-center">
                        {action.count}
                      </Badge>
                    )}
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground absolute right-3 bottom-3" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alertas do Dia */}
      {((data?.contasVencemHoje || 0) > 0 || (data?.alertasCriticos || 0) > 0) && (
        <motion.div variants={itemVariants}>
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Atenção para hoje</p>
                  <p className="text-sm text-muted-foreground">
                    {data?.contasVencemHoje || 0} conta(s) vencem hoje
                    {(data?.alertasCriticos || 0) > 0 && ` • ${data?.alertasCriticos} alerta(s) crítico(s)`}
                  </p>
                </div>
                <Button size="sm" onClick={() => navigate('/contas-receber')}>
                  Ver Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
