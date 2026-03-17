import { MessageSquare, CheckCircle2, Clock, XCircle, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWhatsAppCobrancaHistory } from '@/hooks/useWhatsAppCobrancaHistory';
import { formatDate } from '@/lib/formatters';

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  enviado: { icon: CheckCircle2, color: 'text-success', label: 'Enviado' },
  entregue: { icon: CheckCircle2, color: 'text-success', label: 'Entregue' },
  lido: { icon: CheckCircle2, color: 'text-primary', label: 'Lido' },
  pendente: { icon: Clock, color: 'text-warning', label: 'Pendente' },
  falhou: { icon: XCircle, color: 'text-destructive', label: 'Falhou' },
};

export function WhatsAppHistoryPanel() {
  const { data: historico, isLoading } = useWhatsAppCobrancaHistory();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-success" />
          <div>
            <CardTitle>Histórico WhatsApp</CardTitle>
            <CardDescription>Log de cobranças enviadas via WhatsApp</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : !historico || historico.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nenhuma cobrança WhatsApp registrada</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {historico.map((item) => {
              const config = statusConfig[item.status] || statusConfig.pendente;
              const StatusIcon = config.icon;
              return (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`h-4 w-4 ${config.color}`} />
                    <div>
                      <p className="font-medium text-sm flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {item.telefone}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.mensagem}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.status === 'enviado' || item.status === 'entregue' ? 'default' : item.status === 'falhou' ? 'destructive' : 'secondary'}>
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
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
