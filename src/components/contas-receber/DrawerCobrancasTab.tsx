import { Send, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDateTime, getEtapaCobrancaLabel } from '@/lib/formatters';

interface Cobranca {
  id: string;
  canal?: string | null;
  status?: string | null;
  etapa?: string | null;
  created_at: string;
}

interface Props {
  cobrancas: Cobranca[];
  canEnviar: boolean;
  onEnviarCobranca: () => void;
}

export function DrawerCobrancasTab({ cobrancas, canEnviar, onEnviarCobranca }: Props) {
  if (cobrancas.length === 0) {
    return (
      <div className="text-center py-8">
        <Send className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma cobrança enviada</p>
        {canEnviar && (
          <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={onEnviarCobranca}>
            <MessageCircle className="h-3.5 w-3.5" /> Enviar Cobrança
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      {cobrancas.map((c) => (
        <div key={c.id} className="p-3 rounded-lg border bg-muted/20 space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs gap-1">
              {c.canal === 'whatsapp' && <MessageCircle className="h-3 w-3" />}
              {c.canal === 'email' && <Send className="h-3 w-3" />}
              {c.canal?.toUpperCase() || 'N/A'}
            </Badge>
            <Badge variant="outline" className={cn(
              "text-xs",
              c.status === 'enviado' ? 'text-success border-success/30' : 'text-destructive border-destructive/30'
            )}>
              {c.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Etapa: {getEtapaCobrancaLabel(c.etapa || '')}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(c.created_at)}</p>
        </div>
      ))}
    </>
  );
}
