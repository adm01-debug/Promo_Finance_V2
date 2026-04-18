import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatters';
import type { OportunidadeDetectada } from '@/lib/tributario/elisao/types';

interface Props {
  oportunidades: OportunidadeDetectada[];
}

export function OportunidadesElisaoWidget({ oportunidades }: Props) {
  const top3 = oportunidades.filter((o) => o.aplicavel).slice(0, 3);

  return (
    <Card className="backdrop-blur-sm bg-card/60 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Top Oportunidades de Elisão
          </CardTitle>
          <CardDescription>Estratégias lícitas com maior economia</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/tributario/oportunidades">
            Ver todas <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {top3.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma oportunidade detectada</p>
        ) : (
          <div className="space-y-3">
            {top3.map((o, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-background/50 hover:bg-background transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{o.estrategia}</p>
                  <p className="text-xs text-muted-foreground truncate">{o.justificativa}</p>
                </div>
                <Badge variant="secondary" className="ml-2 shrink-0">
                  {formatCurrency(o.economia_estimada)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
