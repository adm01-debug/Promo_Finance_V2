import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/motion/StatCard';
import { Target, TrendingUp, Brain, Zap, AlertCircle, Bell } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalTransacoes: number;
  conciliadas: number;
  pendentes: number;
  percentual: number;
  valorConciliado: number;
  valorPendente: number;
  taxaAcertoIA: number;
  feedbackTotal: number;
  feedbackConfirmados: number;
  feedbackRejeitados: number;
}

export function ConciliacaoDashboard() {
  const { data: transacoes } = useQuery({
    queryKey: ['conciliacao-dashboard-transacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transacoes_bancarias')
        .select('id, valor, tipo, conciliada');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: feedbacks } = useQuery({
    queryKey: ['conciliacao-dashboard-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback_conciliacao_ia')
        .select('acao, score_original');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: regras } = useQuery({
    queryKey: ['conciliacao-dashboard-regras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regras_conciliacao')
        .select('id, vezes_aplicada, ativo');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const stats = useMemo((): DashboardStats => {
    const total = transacoes?.length || 0;
    const conciliadas = transacoes?.filter((t) => t.conciliada).length || 0;
    const valorConciliado =
      transacoes?.filter((t) => t.conciliada).reduce((sum, t) => sum + Math.abs(t.valor), 0) || 0;
    const valorPendente =
      transacoes?.filter((t) => !t.conciliada).reduce((sum, t) => sum + Math.abs(t.valor), 0) || 0;
    const feedbackTotal = feedbacks?.length || 0;
    const feedbackConfirmados = feedbacks?.filter((f) => f.acao === 'aprovado').length || 0;
    const feedbackRejeitados = feedbacks?.filter((f) => f.acao === 'rejeitado').length || 0;
    const taxaAcertoIA = feedbackTotal > 0 ? (feedbackConfirmados / feedbackTotal) * 100 : 0;

    return {
      totalTransacoes: total,
      conciliadas,
      pendentes: total - conciliadas,
      percentual: total > 0 ? (conciliadas / total) * 100 : 0,
      valorConciliado,
      valorPendente,
      feedbackTotal,
      feedbackConfirmados,
      feedbackRejeitados,
      taxaAcertoIA,
    };
  }, [transacoes, feedbacks]);

  const regrasAtivas = regras?.filter((r) => r.ativo).length || 0;
  const totalAplicacoes = regras?.reduce((sum, r) => sum + (r.vezes_aplicada || 0), 0) || 0;

  const cards = [
    {
      label: 'Taxa de Conciliação',
      value: `${stats.percentual.toFixed(1)}%`,
      sub: `${stats.conciliadas}/${stats.totalTransacoes} transações`,
      icon: Target,
      iconColor: 'var(--ok)',
      iconBg: 'var(--ok-soft)',
      progress: stats.percentual,
      trend: stats.percentual >= 80 ? ('up' as const) : undefined,
    },
    {
      label: 'Valor Conciliado',
      value: formatCurrency(stats.valorConciliado),
      sub: `Pendente: ${formatCurrency(stats.valorPendente)}`,
      icon: TrendingUp,
      iconColor: 'var(--acc)',
      iconBg: 'var(--acc-soft)',
    },
    {
      label: 'Acerto da IA',
      value: `${stats.taxaAcertoIA.toFixed(0)}%`,
      sub: `${stats.feedbackConfirmados}✓ / ${stats.feedbackRejeitados}✗`,
      icon: Brain,
      iconColor:
        stats.taxaAcertoIA >= 80
          ? 'var(--ok)'
          : stats.taxaAcertoIA >= 60
            ? 'var(--warn)'
            : 'var(--bad)',
      iconBg:
        stats.taxaAcertoIA >= 80
          ? 'var(--ok-soft)'
          : stats.taxaAcertoIA >= 60
            ? 'var(--warn-soft)'
            : 'var(--bad-soft)',
    },
    {
      label: 'Regras Aprendidas',
      value: String(regrasAtivas),
      sub: `${totalAplicacoes} aplicações`,
      icon: Zap,
      iconColor: 'var(--warn)',
      iconBg: 'var(--warn-soft)',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.pendentes > 0 && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-destructive animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-bold text-destructive">
                    Alerta de Divergência Real-time
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendentes} transações pendentes de matching crítico.
                  </p>
                </div>
              </div>
              <Badge variant="destructive" className="animate-bounce">
                Urgente
              </Badge>
            </CardContent>
          </Card>
        )}
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-bold text-accent">Auditoria Alpha Ativa</p>
                <p className="text-xs text-muted-foreground">
                  Monitorando reclassificações e juros/descontos em tempo real.
                </p>
              </div>
            </div>
            <Badge variant="secondary">Ativo</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            sub={card.sub}
            icon={<card.icon className="h-5 w-5" />}
            iconColor={card.iconColor}
            iconBg={card.iconBg}
            sparkline={
              card.progress !== undefined ? (
                <Progress value={card.progress} className="h-1.5 w-full" />
              ) : undefined
            }
            delta={
              card.trend === 'up'
                ? { value: `${stats.percentual.toFixed(0)}%`, positive: true }
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
