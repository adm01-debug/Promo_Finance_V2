import {
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  Database,
  HardDrive,
  Loader2,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { DiagnosticState, Divergence } from './types';

export function RemoteBadge({ status }: { status?: DiagnosticState['remote'] }) {
  switch (status) {
    case 'ok':
      return (
        <Badge variant="outline" className="gap-1 text-[10px] border-success/30 text-success">
          <CheckCircle2 className="h-3 w-3" /> Conta
        </Badge>
      );
    case 'empty':
      return (
        <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
          <Database className="h-3 w-3" /> Conta vazia
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="outline" className="gap-1 text-[10px] border-destructive/30 text-destructive">
          <XCircle className="h-3 w-3" /> Erro conta
        </Badge>
      );
    case 'loading':
    default:
      return (
        <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Conta…
        </Badge>
      );
  }
}

export function LocalBadge({ status }: { status?: DiagnosticState['local'] }) {
  switch (status) {
    case 'ok':
      return (
        <Badge variant="outline" className="gap-1 text-[10px] border-primary/30 text-primary">
          <HardDrive className="h-3 w-3" /> Local
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="outline" className="gap-1 text-[10px] border-destructive/30 text-destructive">
          <XCircle className="h-3 w-3" /> Erro local
        </Badge>
      );
    case 'empty':
    default:
      return (
        <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
          <HardDrive className="h-3 w-3" /> Local vazio
        </Badge>
      );
  }
}

/**
 * Renderiza um chip indicando se conta e dispositivo estão sincronizados
 * e, em caso negativo, em que direção a próxima reconciliação fluirá.
 */
export function DivergenceBadge({ div }: { div: Divergence }) {
  switch (div.direction) {
    case 'in-sync':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 text-[10px] border-success/30 text-success">
              <CheckCircle2 className="h-3 w-3" /> Sincronizado
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{div.reason}</p>
          </TooltipContent>
        </Tooltip>
      );
    case 'remote-newer':
    case 'remote-only':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="gap-1 text-[10px] border-warning/40 text-warning"
              aria-label="Divergente: conta mais recente que dispositivo"
            >
              <Database className="h-3 w-3" />
              <ArrowRight className="h-3 w-3" />
              <HardDrive className="h-3 w-3" />
              Conta → Dispositivo
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs font-medium">Divergente</p>
            <p className="text-xs text-muted-foreground">{div.reason}</p>
            <p className="text-xs mt-1">Próxima abertura nesta tela hidratará do Supabase.</p>
          </TooltipContent>
        </Tooltip>
      );
    case 'local-newer':
    case 'local-only':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="gap-1 text-[10px] border-primary/40 text-primary"
              aria-label="Divergente: dispositivo mais recente que conta"
            >
              <HardDrive className="h-3 w-3" />
              <ArrowRight className="h-3 w-3" />
              <Database className="h-3 w-3" />
              Dispositivo → Conta
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs font-medium">Divergente</p>
            <p className="text-xs text-muted-foreground">{div.reason}</p>
            <p className="text-xs mt-1">Próximo salvamento sincronizará com a conta no Supabase.</p>
          </TooltipContent>
        </Tooltip>
      );
    case 'none':
      return (
        <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
          <ArrowLeftRight className="h-3 w-3" /> Sem dados
        </Badge>
      );
    case 'unknown':
    default:
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
              <ArrowLeftRight className="h-3 w-3" /> —
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{div.reason}</p>
          </TooltipContent>
        </Tooltip>
      );
  }
}
