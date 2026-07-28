import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CloudOff } from 'lucide-react';

/** Metadado gravado pelo hook quando a resposta veio do IndexedDB. */
export interface OfflineMeta {
  origem: 'cache';
  gravadoEm: number;
}

/**
 * Extrai o metadado `_offline` de uma resposta de consulta tributária.
 * Defensivo: aceita `unknown` porque o payload varia por recurso (UF/CNAE/NCM).
 */
export function extrairOffline(data: unknown): OfflineMeta | null {
  if (!data || typeof data !== 'object') return null;
  const meta = (data as { _offline?: unknown })._offline;
  if (!meta || typeof meta !== 'object') return null;
  const { origem, gravadoEm } = meta as Partial<OfflineMeta>;
  if (origem !== 'cache' || typeof gravadoEm !== 'number' || !Number.isFinite(gravadoEm)) return null;
  return { origem, gravadoEm };
}

/** Formata o instante da gravação em pt-BR, tolerando timestamps inválidos. */
export function formatarGravadoEm(gravadoEm: number): string {
  const d = new Date(gravadoEm);
  if (Number.isNaN(d.getTime())) return 'data desconhecida';
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

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
