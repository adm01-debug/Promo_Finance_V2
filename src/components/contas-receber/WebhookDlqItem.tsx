/**
 * Uma falha da fila `webhook_dlq`.
 *
 * Extraido de WebhookDlqPanel com `memo` porque "Carregar mais" acumula paginas
 * na mesma lista: sem isso, cada janela nova re-renderizava todas as linhas ja
 * em tela (ate 1.001 falhas, cada uma com badge, mensagem e botao). Os props
 * sao estaveis -- `onReprocessar` vem de useCallback -- entao a linha antiga
 * nao re-renderiza quando chega a pagina seguinte.
 */
import { memo } from 'react';
import { Clock, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DlqRow {
  id: string;
  source: string | null;
  event_type: string | null;
  external_id: string | null;
  error_message: string | null;
  attempts: number | null;
  first_failed_at: string | null;
  last_attempt_at: string | null;
  created_at: string;
}

interface Props {
  row: DlqRow;
  reprocessando: boolean;
  onReprocessar: (row: DlqRow) => void;
}

export const WebhookDlqItem = memo(function WebhookDlqItem({
  row,
  reprocessando,
  onReprocessar,
}: Props) {
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold truncate">
          {row.source ?? 'origem desconhecida'} · {row.event_type ?? 'evento sem tipo'}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-[9px]">
            {row.attempts ?? 0} tentativa{(row.attempts ?? 0) === 1 ? '' : 's'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px]"
            onClick={() => onReprocessar(row)}
            disabled={reprocessando}
            aria-label={`Reprocessar ${row.source ?? 'evento'} ${row.external_id ?? row.id}`}
          >
            <RotateCcw className={cn('h-3 w-3 mr-1', reprocessando && 'animate-spin')} />
            Reprocessar
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-destructive/90 break-words">
        {row.error_message ?? 'sem mensagem de erro registrada'}
      </p>
      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {formatDistanceToNow(new Date(row.last_attempt_at ?? row.created_at), {
          addSuffix: true,
          locale: ptBR,
        })}
        {row.external_id ? ` · id externo ${row.external_id}` : ''}
      </p>
    </div>
  );
});
