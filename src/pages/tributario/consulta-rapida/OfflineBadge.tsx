import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CloudOff } from 'lucide-react';
import { extrairOffline, formatarGravadoEm } from './offlineMeta';

export interface OfflineBadgeProps {
  data: unknown;
}

/**
 * Sinaliza que o resultado exibido veio do cache offline. Nunca devolvemos
 * dado cacheado silenciosamente: o contador precisa saber que a alíquota
 * pode estar defasada em relação ao catálogo vigente.
 */
export function OfflineBadge({ data }: OfflineBadgeProps) {
  const meta = extrairOffline(data);
  if (!meta) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="gap-1 font-normal text-warning" aria-label="Dado do cache offline">
          <CloudOff className="h-3 w-3" aria-hidden />
          Offline
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs text-xs">
          Sem conexão com o catálogo fiscal. Exibindo a última resposta armazenada em{' '}
          <strong>{formatarGravadoEm(meta.gravadoEm)}</strong> — pode estar desatualizada.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
