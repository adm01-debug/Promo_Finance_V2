// Badge de saúde dos catálogos fiscais para o Dashboard Tributário.
//
// Exibe SEMPRE (mesmo saudável, como confirmação de lastro) e abre um popover
// com o detalhamento proativo quando há divergência entre banco e motor ou
// registros recusados pelos overlays.
import { CheckCircle2, Database, ShieldAlert, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCatalogosFiscais } from '@/hooks/useCatalogosFiscais';
import type { StatusSaudeCatalogos } from '@/lib/tributario/catalogos/saude';

export interface SaudeCatalogosBadgeProps {
  className?: string;
}

const ESTILO: Record<
  StatusSaudeCatalogos,
  { classe: string; rotulo: string; Icone: typeof CheckCircle2 }
> = {
  saudavel: {
    classe: 'border-success/30 bg-success/10 text-success hover:bg-success/20',
    rotulo: 'Catálogos OK',
    Icone: CheckCircle2,
  },
  atencao: {
    classe: 'border-warning/30 bg-warning/10 text-warning hover:bg-warning/20',
    rotulo: 'Catálogos em atenção',
    Icone: TriangleAlert,
  },
  critico: {
    classe: 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20',
    rotulo: 'Catálogos críticos',
    Icone: ShieldAlert,
  },
};

export function SaudeCatalogosBadge({ className }: SaudeCatalogosBadgeProps) {
  const { data, isLoading, isError } = useCatalogosFiscais();

  if (isLoading) {
    return <Skeleton className={cn('h-8 w-40 rounded-full', className)} />;
  }

  // Falha de leitura não deve alarmar como se fosse divergência fiscal:
  // sinalizamos indisponibilidade de forma neutra.
  if (isError || !data) {
    return (
      <Badge
        variant="outline"
        className={cn('h-8 gap-1.5 rounded-full px-3 text-muted-foreground', className)}
      >
        <Database className="h-3.5 w-3.5" />
        Saúde dos catálogos indisponível
      </Badge>
    );
  }

  const { saude } = data;
  const { classe, rotulo, Icone } = ESTILO[saude.status];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Saúde dos catálogos fiscais: ${rotulo}. ${saude.resumo}`}
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            classe,
            className,
          )}
        >
          <Icone className="h-4 w-4 shrink-0" />
          <span>{rotulo}</span>
          <span className="rounded-md bg-background/40 px-1.5 py-0.5 font-mono">
            {saude.score}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-96 space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Saúde dos catálogos fiscais</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{saude.resumo}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Metrica rotulo="Score" valor={String(saude.score)} />
          <Metrica rotulo="Divergências" valor={String(saude.divergencias)} />
          <Metrica rotulo="Rejeições" valor={String(saude.rejeicoes)} />
        </div>

        {saude.catalogosAfetadosTitulos.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">Catálogos divergentes</p>
            <ul className="space-y-1">
              {saude.catalogosAfetadosTitulos.map((titulo) => (
                <li key={titulo} className="text-xs text-muted-foreground">
                  · {titulo}
                </li>
              ))}
            </ul>
          </div>
        )}

        {saude.rejeicoesPorOverlay.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">
              Registros recusados pelos overlays
            </p>
            <p className="text-[11px] text-muted-foreground">
              Esses cadastros não estão em produção — o motor segue com o valor canônico.
            </p>
            <ul className="space-y-1.5">
              {saude.rejeicoesPorOverlay.map((r) => (
                <li key={r.overlay} className="rounded-md border border-border/60 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-foreground">{r.overlayTitulo}</span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {r.quantidade}
                    </Badge>
                  </div>
                  {r.exemplos.map((exemplo) => (
                    <p key={exemplo} className="mt-1 font-mono text-[10px] text-muted-foreground">
                      {exemplo}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to="/tributario/catalogos-fiscais">
            <Database className="mr-2 h-3.5 w-3.5" />
            Abrir painel de catálogos
          </Link>
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
      <p className="text-base font-bold leading-none text-foreground">{valor}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{rotulo}</p>
    </div>
  );
}
