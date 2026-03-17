import { History, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useConciliacoes } from '@/hooks/useExtratoWebhooks';
import { formatCurrency, formatDate } from '@/lib/formatters';

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  em_andamento: { icon: Clock, color: 'text-warning', label: 'Em Andamento' },
  concluida: { icon: CheckCircle2, color: 'text-success', label: 'Concluída' },
  cancelada: { icon: XCircle, color: 'text-destructive', label: 'Cancelada' },
};

export function SessoesConciliacaoPanel() {
  const { data: conciliacoes, isLoading } = useConciliacoes();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Sessões de Conciliação</CardTitle>
            <CardDescription>Histórico de conciliações realizadas</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : !conciliacoes || conciliacoes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nenhuma sessão de conciliação registrada</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {conciliacoes.map((sessao) => {
              const config = statusConfig[sessao.status] || statusConfig.em_andamento;
              const StatusIcon = config.icon;
              return (
                <div key={sessao.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`h-5 w-5 ${config.color}`} />
                    <div>
                      <p className="font-medium text-sm">
                        Período: {formatDate(sessao.periodo_inicio)} → {formatDate(sessao.periodo_fim)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sessao.total_conciliados || 0} conciliadas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{config.label}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(sessao.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
