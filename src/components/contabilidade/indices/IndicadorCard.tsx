import { ArrowDownRight, ArrowUpRight, Info, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatarIndice, variacao, type FaixaIndice, type Indicador } from '@/lib/contabil/indices';

interface Props {
  indicador: Indicador;
  anterior?: Indicador;
}

const FAIXA_LABEL: Record<FaixaIndice, string> = {
  bom: 'Bom',
  atencao: 'Atenção',
  critico: 'Crítico',
  neutro: 'Informativo',
  indefinido: 'Sem dados',
};

const FAIXA_CLASS: Record<FaixaIndice, string> = {
  bom: 'bg-success/15 text-success border-success/30',
  atencao: 'bg-warning/15 text-warning border-warning/30',
  critico: 'bg-destructive/15 text-destructive border-destructive/30',
  neutro: 'bg-muted text-muted-foreground border-border',
  indefinido: 'bg-muted text-muted-foreground border-border',
};

export function IndicadorCard({ indicador, anterior }: Props) {
  const delta = variacao(indicador.valor, anterior?.valor ?? null);
  const DeltaIcon = delta === null || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="rounded-2xl border-border/60 transition-colors hover:border-primary/40">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {indicador.rotulo}
          </p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`Fórmula de ${indicador.rotulo}`}
                  className="rounded-full p-1 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Info className="h-3.5 w-3.5" aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[260px] space-y-1">
                <p className="font-semibold">{indicador.formula}</p>
                <p className="text-xs text-muted-foreground">{indicador.interpretacao}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <p
          className={cn(
            'text-2xl font-black tracking-tight',
            indicador.valor === null && 'text-muted-foreground',
          )}
        >
          {formatarIndice(indicador.valor, indicador.formato)}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn('rounded-full text-[10px]', FAIXA_CLASS[indicador.faixa])}>
            {FAIXA_LABEL[indicador.faixa]}
          </Badge>
          {delta !== null && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <DeltaIcon className="h-3 w-3" aria-hidden />
              {Math.abs(delta).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% vs. anterior
            </span>
          )}
        </div>

        {indicador.motivo && (
          <p className="text-[11px] text-muted-foreground">{indicador.motivo}</p>
        )}
      </CardContent>
    </Card>
  );
}
