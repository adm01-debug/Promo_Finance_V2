import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Brain, Sparkles, DollarSign } from 'lucide-react';
import { useInsightsIAKpis } from '@/hooks/useInsightsIA';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export function InsightsIAKpis() {
  const { data, isLoading } = useInsightsIAKpis();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Anomalias 24h',
      value: String(data.anomalias24h),
      sub: `${data.anomaliasCriticas} críticas`,
      icon: AlertTriangle,
      color: data.anomaliasCriticas > 0 ? 'text-destructive' : 'text-warning',
      bgColor: data.anomaliasCriticas > 0 ? 'bg-destructive/10' : 'bg-warning/10',
    },
    {
      label: 'Acerto da IA',
      value: `${data.taxaAcertoIA.toFixed(0)}%`,
      sub: `${data.feedbackTotal} decisões revisadas`,
      icon: Brain,
      color:
        data.taxaAcertoIA >= 80
          ? 'text-success'
          : data.taxaAcertoIA >= 60
          ? 'text-warning'
          : 'text-destructive',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Regras Aprendidas',
      value: String(data.regrasAtivas),
      sub: `${data.totalAplicacoes} aplicações`,
      icon: Sparkles,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Valor sob revisão',
      value: formatCurrency(data.valorSobRevisao),
      sub: 'Anomalias pendentes',
      icon: DollarSign,
      color: 'text-foreground',
      bgColor: 'bg-muted',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="card-base">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {c.label}
                </p>
                <p className={cn('text-2xl font-bold font-display mt-1', c.color)}>
                  {c.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5 truncate">{c.sub}</p>
              </div>
              <div
                className={cn(
                  'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                  c.bgColor,
                  c.color
                )}
              >
                <c.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
