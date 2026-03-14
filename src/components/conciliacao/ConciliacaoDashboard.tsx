import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, TrendingUp, Brain, Zap, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
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
    const conciliadas = transacoes?.filter(t => t.conciliada).length || 0;
    const valorConciliado = transacoes?.filter(t => t.conciliada).reduce((sum, t) => sum + Math.abs(t.valor), 0) || 0;
    const valorPendente = transacoes?.filter(t => !t.conciliada).reduce((sum, t) => sum + Math.abs(t.valor), 0) || 0;
    const feedbackTotal = feedbacks?.length || 0;
    const feedbackConfirmados = feedbacks?.filter(f => f.acao === 'confirmado').length || 0;
    const feedbackRejeitados = feedbacks?.filter(f => f.acao === 'rejeitado').length || 0;
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

  const regrasAtivas = regras?.filter(r => r.ativo).length || 0;
  const totalAplicacoes = regras?.reduce((sum, r) => sum + (r.vezes_aplicada || 0), 0) || 0;

  const cards = [
    {
      label: 'Taxa de Conciliação',
      value: `${stats.percentual.toFixed(1)}%`,
      sub: `${stats.conciliadas}/${stats.totalTransacoes} transações`,
      icon: Target,
      color: 'text-success',
      bgColor: 'bg-success/10',
      progress: stats.percentual,
      trend: stats.percentual >= 80 ? 'up' : undefined,
    },
    {
      label: 'Valor Conciliado',
      value: formatCurrency(stats.valorConciliado),
      sub: `Pendente: ${formatCurrency(stats.valorPendente)}`,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Acerto da IA',
      value: `${stats.taxaAcertoIA.toFixed(0)}%`,
      sub: `${stats.feedbackConfirmados}✓ / ${stats.feedbackRejeitados}✗`,
      icon: Brain,
      color: stats.taxaAcertoIA >= 80 ? 'text-success' : stats.taxaAcertoIA >= 60 ? 'text-warning' : 'text-destructive',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Regras Aprendidas',
      value: String(regrasAtivas),
      sub: `${totalAplicacoes} aplicações`,
      icon: Zap,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="card-base group hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</p>
                <p className={cn("text-2xl font-bold font-display mt-1", card.color)}>
                  {card.value}
                </p>
                {card.progress !== undefined && (
                  <Progress value={card.progress} className="h-1.5 mt-2 w-full" />
                )}
                <p className="text-xs text-muted-foreground mt-1.5">{card.sub}</p>
              </div>
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", card.bgColor, card.color)}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
