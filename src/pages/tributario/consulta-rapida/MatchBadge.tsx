import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, GitBranch } from 'lucide-react';
import type { MatchInfo } from '@/hooks/useConsultaTributaria';

export interface MatchBadgeProps {
  match?: MatchInfo | null;
}

/**
 * Sinaliza se a resposta veio de correspondência exata ou de um fallback
 * hierárquico. É deliberadamente explícito: o contador precisa saber que a
 * alíquota exibida pode ter vindo do prefixo do NCM, não do código completo.
 */
export function MatchBadge({ match }: MatchBadgeProps) {
  if (!match) return null;
  const Icon = match.exato ? CheckCircle2 : GitBranch;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={match.exato ? 'default' : 'secondary'}
          className="gap-1 font-normal"
          aria-label={match.exato ? 'Correspondência exata' : 'Fallback aplicado'}
        >
          <Icon className="h-3 w-3" aria-hidden />
          {match.exato ? 'Exato' : 'Fallback'}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs text-xs">
          Estratégia: <strong>{match.estrategia}</strong>
          {match.detalhe ? ` — ${match.detalhe}` : ''}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
