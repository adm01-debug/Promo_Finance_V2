import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Timer } from 'lucide-react';
import { EventoSefaz, eventTypeConfig } from '@/lib/sefaz-event-logger';
import { toast } from 'sonner';
import { getEventIcon, formatDateTime } from './EventosHistorico.helpers';

// Componente de detalhes do evento
export const EventoDetalhes = ({ evento }: { evento: EventoSefaz }) => {
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`rounded-lg p-4 ${eventTypeConfig[evento.tipo].bgColor}`}>
        <div className="flex items-center gap-3">
          {(() => {
            const Icon = getEventIcon(evento.tipo);
            return <Icon className={`h-6 w-6 ${eventTypeConfig[evento.tipo].color}`} />;
          })()}
          <div>
            <h3 className={`font-bold text-lg ${eventTypeConfig[evento.tipo].color}`}>
              {eventTypeConfig[evento.tipo].label}
            </h3>
            <p className="text-sm text-muted-foreground">{formatDateTime(evento.timestamp)}</p>
          </div>
        </div>
      </div>

      {/* Status SEFAZ */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Código Status</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              cStat: {evento.cStat}
            </Badge>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Ambiente</span>
          <Badge variant={evento.ambiente === 'producao' ? 'default' : 'secondary'}>
            {evento.ambiente === 'producao' ? 'Produção' : 'Homologação'}
          </Badge>
        </div>
      </div>

      {/* Motivo */}
      <div className="space-y-1">
        <span className="text-sm text-muted-foreground">Motivo</span>
        <p className="font-medium">{evento.xMotivo}</p>
      </div>

      {/* Chave de Acesso */}
      {evento.chaveAcesso && (
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Chave de Acesso</span>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1 break-all">
              {evento.chaveAcesso}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(evento.chaveAcesso!, 'Chave de acesso')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Protocolo */}
      {evento.protocolo && (
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Protocolo</span>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono">{evento.protocolo}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(evento.protocolo!, 'Protocolo')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Tempo de Resposta */}
      {evento.tempoResposta !== undefined && (
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Tempo de Resposta</span>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{evento.tempoResposta}ms</span>
            {evento.tempoResposta < 1000 && (
              <Badge variant="outline" className="text-success border-success/20">
                Rápido
              </Badge>
            )}
            {evento.tempoResposta >= 1000 && evento.tempoResposta < 3000 && (
              <Badge variant="outline" className="text-warning border-warning/20">
                Normal
              </Badge>
            )}
            {evento.tempoResposta >= 3000 && (
              <Badge variant="outline" className="text-destructive border-destructive/20">
                Lento
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Detalhes adicionais */}
      {evento.detalhes && (
        <div className="space-y-1">
          <span className="text-sm text-muted-foreground">Detalhes</span>
          <p className="text-sm bg-muted/50 p-3 rounded-lg">{evento.detalhes}</p>
        </div>
      )}

      {/* ID do Evento */}
      <div className="pt-2 border-t">
        <span className="text-xs text-muted-foreground">ID do Evento: {evento.id}</span>
      </div>
    </div>
  );
};
