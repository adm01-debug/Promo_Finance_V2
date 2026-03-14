import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, CheckCircle2, Clock, AlertTriangle, TrendingUp, 
  Brain, Target, Zap 
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
  feedbackTotal: number;
  feedbackConfirmados: number;
  feedbackRejeitados: number;
  taxaAcertoIA: number;
}

export function ConciliacaoDashboard() {
  // Fetch real stats from DB
  const { data: transacoes } = useQuery({
    queryKey: ['conciliacao-dashboard-transacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transacoes_bancarias')
        .select('id, valor, tipo, conciliada');
      if (error) throw error;
      return data || [];
    },
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
  });

  const stats = useMemo((): DashboardStats => {
    const total = transacoes?.length || 0;
    const conciliadas = transacoes?.filter(t => t.conciliada).length || 0;
    const pendentes = total - conciliadas;
    const valorConciliado = transacoes?.filter(t => t.conciliada).reduce((sum, t) => sum + Math.abs(t.valor), 0) || 0;
    const valorPendente = transacoes?.filter(t => !t.conciliada).reduce((sum, t) => sum + Math.abs(t.valor), 0) || 0;
    
    const feedbackTotal = feedbacks?.length || 0;
    const feedbackConfirmados = feedbacks?.filter(f => f.acao === 'confirmado').length || 0;
    const feedbackRejeitados = feedbacks?.filter(f => f.acao === 'rejeitado').length || 0;
    const taxaAcertoIA = feedbackTotal > 0 ? (feedbackConfirmados / feedbackTotal) * 100 : 0;

    return {
      totalTransacoes: total,
      conciliadas,
      pendentes,
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Taxa de Conciliação */}
      <Card className="card-base group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Taxa de Conciliação</p>
              <p className="text-2xl font-bold font-display mt-1">
                {stats.percentual.toFixed(1)}%
              </p>
              <Progress value={stats.percentual} className="h-1.5 mt-2 w-full" />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.conciliadas}/{stats.totalTransacoes} transações
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
              <Target className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Valor Conciliado */}
      <Card className="card-base group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Conciliado</p>
              <p className="text-2xl font-bold font-display mt-1 text-success">
                {formatCurrency(stats.valorConciliado)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Pendente: {formatCurrency(stats.valorPendente)}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Taxa de Acerto IA */}
      <Card className="card-base group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Acerto da IA</p>
              <p className={cn(
                "text-2xl font-bold font-display mt-1",
                stats.taxaAcertoIA >= 80 ? "text-success" : stats.taxaAcertoIA >= 60 ? "text-warning" : "text-destructive"
              )}>
                {stats.taxaAcertoIA.toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.feedbackConfirmados}✓ / {stats.feedbackRejeitados}✗ de {stats.feedbackTotal}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <Brain className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regras Aprendidas */}
      <Card className="card-base group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Regras Aprendidas</p>
              <p className="text-2xl font-bold font-display mt-1">{regrasAtivas}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalAplicacoes} aplicações automáticas
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
