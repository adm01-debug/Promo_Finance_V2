import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AlertaTributario } from '@/hooks/useAlertasTributarios';

interface Props {
  vencimentos: AlertaTributario[];
}

export function ProximosVencimentosTimeline({ vencimentos }: Props) {
  const hoje = new Date();

  return (
    <Card className="backdrop-blur-sm bg-card/60 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Próximos Vencimentos
        </CardTitle>
        <CardDescription>Próximos 30 dias</CardDescription>
      </CardHeader>
      <CardContent>
        {vencimentos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum vencimento próximo</p>
        ) : (
          <div className="space-y-3">
            {vencimentos.slice(0, 5).map((v) => {
              const dias = v.data_vencimento ? differenceInDays(parseISO(v.data_vencimento), hoje) : 0;
              const variant = dias <= 1 ? 'destructive' : dias <= 7 ? 'default' : 'secondary';
              return (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background/50">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{v.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.data_vencimento && format(parseISO(v.data_vencimento), "dd 'de' MMM", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant={variant} className="shrink-0">
                    {dias <= 0 ? 'Hoje' : `${dias}d`}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
