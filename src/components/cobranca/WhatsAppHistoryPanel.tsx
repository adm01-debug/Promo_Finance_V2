import { MessageSquare, CheckCircle2, Clock, XCircle, Phone, BrainCircuit, AlertCircle, ArrowRightCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWhatsAppCobrancaHistory } from '@/hooks/useWhatsAppCobrancaHistory';
import { formatDate } from '@/lib/formatters';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  enviado: { icon: CheckCircle2, color: 'text-success', label: 'Enviado' },
  entregue: { icon: CheckCircle2, color: 'text-success', label: 'Entregue' },
  lido: { icon: CheckCircle2, color: 'text-primary', label: 'Lido' },
  pendente: { icon: Clock, color: 'text-warning', label: 'Pendente' },
  falhou: { icon: XCircle, color: 'text-destructive', label: 'Falhou' },
};

const sentimentColors: Record<string, string> = {
  positivo: 'bg-success/10 text-success border-success/20',
  neutro: 'bg-muted text-muted-foreground border-border',
  negativo: 'bg-warning/10 text-warning border-warning/20',
  agressivo: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function WhatsAppHistoryPanel() {
  const { data: historico, isLoading } = useWhatsAppCobrancaHistory();

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-success/10 rounded-lg">
              <MessageSquare className="h-5 w-5 text-success" />
            </div>
            <div>
              <CardTitle className="text-lg">Histórico WhatsApp IA</CardTitle>
              <CardDescription>Inteligência de cobrança em tempo real</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1">
            <BrainCircuit className="h-3 w-3" />
            Insights Ativos
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : !historico || historico.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nenhuma interação via WhatsApp detectada</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {historico.map((item: any) => {
              const config = statusConfig[item.status] || statusConfig.pendente;
              const StatusIcon = config.icon;
              const sentimentClass = sentimentColors[item.ia_sentimento?.toLowerCase() || 'neutro'];

              return (
                <div key={item.id} className="group relative flex flex-col p-4 rounded-xl border bg-card hover:border-primary/30 transition-all hover:shadow-md">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${config.color} bg-current/5`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {item.telefone}
                          </p>
                          {item.ia_sentimento && (
                            <Badge variant="outline" className={`text-[10px] uppercase font-bold px-1.5 py-0 ${sentimentClass}`}>
                              {item.ia_sentimento}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {config.label}
                    </Badge>
                  </div>

                  <div className="mt-1 bg-muted/30 p-2.5 rounded-lg border border-dashed">
                    <p className="text-sm italic text-foreground/80 leading-relaxed">"{item.mensagem}"</p>
                  </div>

                  {(item.ia_resumo || item.ia_proxima_acao) && (
                    <div className="mt-3 pt-3 border-t grid grid-cols-1 md:grid-cols-2 gap-3">
                      {item.ia_resumo && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                            <BrainCircuit className="h-3 w-3" />
                            Insight da IA
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{item.ia_resumo}</p>
                        </div>
                      )}
                      {item.ia_proxima_acao && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-warning">
                            <AlertCircle className="h-3 w-3" />
                            Próxima Ação Recomendada
                          </div>
                          <div className="flex items-center gap-1 text-xs font-semibold text-foreground bg-warning/5 p-1 rounded border border-warning/10">
                            <ArrowRightCircle className="h-3 w-3 text-warning" />
                            {item.ia_proxima_acao}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
