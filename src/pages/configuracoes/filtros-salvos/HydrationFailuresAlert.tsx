import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { clearHydrationEvents, type HydrationEvent } from '@/lib/filterHydrationTelemetry';

interface Props {
  failures: HydrationEvent[];
}

export function HydrationFailuresAlert({ failures }: Props) {
  if (failures.length === 0) return null;

  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <CardTitle className="text-base text-destructive">
                Falhas de hidratação detectadas
              </CardTitle>
              <CardDescription>
                {failures.length} tela(s) reportaram erro ao carregar filtros salvos. Eventos
                registrados pelo <code>useManagedFilters</code>.
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearHydrationEvents();
              toast.success('Alertas reconhecidos');
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Limpar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {failures.map((evt, idx) => (
            <div
              key={`${evt.entityType}-${evt.at}-${idx}`}
              className="flex items-start justify-between gap-3 rounded-md border border-destructive/30 bg-background/60 p-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {evt.entityType}
                  </Badge>
                  {evt.stage && (
                    <Badge variant="secondary" className="text-[10px]">
                      {evt.stage}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(evt.at).toLocaleString('pt-BR')}
                  </span>
                </div>
                {evt.errorMessage && (
                  <p className="text-xs text-muted-foreground mt-1 break-words">
                    {evt.errorMessage}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
