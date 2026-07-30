import { Brain, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useHistoricoAnalisesPreditivas } from '@/hooks/useExtratoWebhooks';
import { formatDate } from '@/lib/formatters';

export function HistoricoAnalisesPreditivasPanel() {
  const { data: analises, isLoading } = useHistoricoAnalisesPreditivas();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Histórico de Análises Preditivas</CardTitle>
            <CardDescription>Execuções anteriores do motor de IA</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : !analises || analises.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nenhuma análise preditiva executada</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {analises.map((analise) => (
              <div key={analise.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{analise.resumo_executivo?.slice(0, 60) || 'Análise Geral'}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(analise.created_at)}
                      {analise.alertas_gerados != null && <span>• {analise.alertas_gerados} alertas</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Concluída</Badge>
                  {analise.score_saude_financeira != null && (
                    <Badge variant="outline" className="text-xs">
                      Score: {analise.score_saude_financeira}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
