import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollText, Brain } from 'lucide-react';
import { useHistoricoConciliacaoIA } from '@/hooks/useHistoricoConciliacaoIA';
import { ExportMenu } from '@/components/ui/export-menu';
import { formatDate } from '@/lib/formatters';

export function AuditoriaDecisoesTab() {
  const { historico, isLoadingHistorico } = useHistoricoConciliacaoIA();

  const exportData = historico.map((h) => ({
    data: formatDate(h.created_at),
    tipo: h.tipo_lancamento,
    score: Math.round(h.score_ia),
    confianca: h.confianca,
    acao: h.acao,
    motivos: (h.motivos ?? []).map((m) => m.tipo).join('; '),
    analise: h.analise_ia ?? '',
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Auditoria de Decisões da IA (XAI)</CardTitle>
              <CardDescription>
                Timeline cronológica com score, motivos e análise explicável
              </CardDescription>
            </div>
          </div>
          {historico.length > 0 && (
            <ExportMenu
              data={exportData}
              columns={[
                { header: 'Data', key: 'data' },
                { header: 'Tipo', key: 'tipo' },
                { header: 'Score', key: 'score' },
                { header: 'Confiança', key: 'confianca' },
                { header: 'Ação', key: 'acao' },
                { header: 'Motivos', key: 'motivos' },
                { header: 'Análise IA', key: 'analise' },
              ]}
              filename="auditoria-decisoes-ia"
              title="Auditoria de Decisões IA"
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingHistorico ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : historico.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nenhuma decisão registrada ainda</p>
          </div>
        ) : (
          <div className="relative max-h-[600px] overflow-y-auto pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
            <div className="space-y-3">
              {historico.map((h) => (
                <div key={h.id} className="relative">
                  <div
                    className={`absolute -left-[18px] top-3 h-3 w-3 rounded-full border-2 border-background ${
                      h.acao === 'aprovado' ? 'bg-success' : 'bg-destructive'
                    }`}
                  />
                  <div className="rounded-md border bg-card p-3">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant={h.acao === 'aprovado' ? 'default' : 'destructive'}>
                        {h.acao}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Score: {Math.round(h.score_ia)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Confiança: {h.confianca}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {h.tipo_lancamento}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(h.created_at)}
                      </span>
                    </div>
                    {h.motivos && h.motivos.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Motivos
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {h.motivos.map((m, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {m.tipo} ({m.peso}) — {m.detalhe}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {h.analise_ia && (
                      <div className="mt-2 rounded bg-muted/40 p-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Análise IA
                        </p>
                        <p className="text-xs">{h.analise_ia}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
