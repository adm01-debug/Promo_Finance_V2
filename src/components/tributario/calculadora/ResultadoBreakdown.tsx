import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, Info } from 'lucide-react';
import type { ResultadoRegime } from '@/lib/tributario/calculadora';
import { formatBRL, formatPct } from './number-field.formatters';

interface Props {
  resultado: ResultadoRegime;
}

export function ResultadoBreakdown({ resultado }: Props) {
  if (!resultado.elegivel) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            Regime inelegível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{resultado.motivoInelegibilidade}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            {resultado.nome}
            <Badge variant="outline">{formatPct(resultado.cargaEfetiva / 100, 2)} carga efetiva</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Total tributos</p>
              <p className="text-lg font-semibold">{formatBRL(resultado.totalTributos)}</p>
            </div>
            <div className="rounded-md bg-primary/10 p-3">
              <p className="text-xs text-muted-foreground">Total a pagar</p>
              <p className="text-lg font-semibold text-primary">{formatBRL(resultado.totalAPagar)}</p>
            </div>
          </div>
          <TooltipProvider delayDuration={100}>
            <div className="space-y-2">
              {resultado.tributos.filter((t) => t.valor > 0).map((t) => (
                <div key={t.nome} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.nome}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="text-xs">{t.formula}</p>
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-xs text-muted-foreground">
                      ({formatPct(t.aliquotaEfetiva)})
                    </span>
                  </div>
                  <span className="tabular-nums">{formatBRL(t.valor)}</span>
                </div>
              ))}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {resultado.alertas.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" /> Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-xs text-muted-foreground list-disc pl-4">
              {resultado.alertas.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
