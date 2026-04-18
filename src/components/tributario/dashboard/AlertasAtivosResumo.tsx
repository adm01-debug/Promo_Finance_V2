import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle } from 'lucide-react';
import type { AlertaTributario } from '@/hooks/useAlertasTributarios';

interface Props {
  alertas: AlertaTributario[];
}

const PRIORIDADE_VARIANT: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  critica: 'destructive',
  alta: 'default',
  media: 'secondary',
  baixa: 'outline',
};

export function AlertasAtivosResumo({ alertas }: Props) {
  const ativos = alertas.filter((a) => !a.resolvido).slice(0, 5);

  return (
    <Card className="backdrop-blur-sm bg-card/60 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          Alertas Ativos
        </CardTitle>
        <CardDescription>{alertas.length} alertas no total</CardDescription>
      </CardHeader>
      <CardContent>
        {ativos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Tudo em ordem 🎉</p>
        ) : (
          <div className="space-y-2">
            {ativos.map((a) => (
              <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg border bg-background/50">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{a.titulo}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{a.mensagem}</p>
                </div>
                <Badge variant={PRIORIDADE_VARIANT[a.prioridade] ?? 'secondary'} className="shrink-0 text-xs">
                  {a.prioridade}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
