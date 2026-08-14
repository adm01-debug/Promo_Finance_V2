import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, Award } from 'lucide-react';
import type { ResultadoCalculadora } from '@/lib/tributario/calculadora';
import { formatBRL, formatPct } from './number-field.formatters';
import { cn } from '@/lib/utils';

export function ComparativoRegimes({ resultado }: { resultado: ResultadoCalculadora }) {
  const melhorRegime = resultado.melhorCenario?.regime;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingDown className="h-4 w-4" /> Comparativo entre regimes
        </CardTitle>
        {resultado.economiaAnualVsPior > 0 && (
          <p className="text-xs text-muted-foreground">
            Economia potencial anual: <span className="font-semibold text-success">{formatBRL(resultado.economiaAnualVsPior)}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {resultado.cenarios.map((c) => {
          const eh = c.regime === melhorRegime;
          return (
            <div
              key={c.regime}
              className={cn(
                'flex items-center justify-between rounded-md border p-3',
                eh ? 'border-primary bg-primary/5' : 'border-border',
                !c.elegivel && 'opacity-60',
              )}
            >
              <div className="flex items-center gap-2">
                {eh && <Award className="h-4 w-4 text-primary" />}
                <div>
                  <p className="text-sm font-medium">{c.nome}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {c.elegivel ? `Carga: ${formatPct(c.cargaEfetiva / 100, 2)}` : c.motivoInelegibilidade}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">
                  {c.elegivel ? formatBRL(c.totalAPagar) : '—'}
                </p>
                {eh && <Badge className="text-[10px] mt-1">Recomendado</Badge>}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
