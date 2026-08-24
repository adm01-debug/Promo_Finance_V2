/**
 * EmpresaBadge — identidade visual compacta de uma empresa do grupo.
 * Pill com sigla + cor (token semântico chart-1..8) + tooltip (nome + regime).
 *
 * Uso típico em colunas de tabelas consolidadas:
 *   <EmpresaBadge empresaId={row.empresa_id} />
 */
import { useMemo, type CSSProperties } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useEmpresaScope } from '@/contexts/useEmpresaScope';

export interface EmpresaBadgeProps {
  empresaId: string | null | undefined;
  /** mostra o nome ao lado da sigla */
  showName?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/** Mapeia o token de paleta (chart-N) para variáveis CSS do design system. */
function colorStyle(corHex: string | null | undefined): CSSProperties {
  // Aceita 'chart-1'..'chart-8'; fallback chart-1
  const token = (corHex ?? '').match(/^chart-([1-8])$/)?.[1] ?? '1';
  return {
    backgroundColor: `hsl(var(--chart-${token}) / 0.15)`,
    color: `hsl(var(--chart-${token}))`,
    borderColor: `hsl(var(--chart-${token}) / 0.3)`,
  };
}

export function EmpresaBadge({ empresaId, showName = false, size = 'sm', className }: EmpresaBadgeProps) {
  const { availableEmpresas } = useEmpresaScope();

  const empresa = useMemo(
    () => availableEmpresas.find((v) => v.empresa_id === empresaId)?.empresa ?? null,
    [availableEmpresas, empresaId],
  );

  if (!empresaId || !empresa) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-md border border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider',
          size === 'sm' ? 'h-5 px-1.5 text-[10px]' : 'h-6 px-2 text-xs',
          className,
        )}
        aria-label="Empresa não identificada"
      >
        —
      </span>
    );
  }

  // Tipagem segura: novos campos vêm do DB
  const e = empresa as typeof empresa & { sigla?: string | null; cor_hex?: string | null };
  const sigla = (e.sigla?.trim() || (e.nome_fantasia ?? e.razao_social).slice(0, 3)).toUpperCase();
  const fullName = e.nome_fantasia || e.razao_social;

  const pill = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-bold uppercase tracking-wider',
        size === 'sm' ? 'h-5 px-1.5 text-[10px]' : 'h-6 px-2 text-xs',
        className,
      )}
      style={colorStyle(e.cor_hex)}
    >
      <span aria-hidden>{sigla}</span>
      {showName && (
        <span className="font-medium normal-case tracking-normal truncate max-w-[140px]">{fullName}</span>
      )}
    </span>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{pill}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="font-semibold">{fullName}</div>
          <div className="text-muted-foreground">CNPJ {e.cnpj}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
