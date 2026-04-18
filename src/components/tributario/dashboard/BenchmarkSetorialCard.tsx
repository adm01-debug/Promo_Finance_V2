import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { useBenchmarkSetorial } from '@/hooks/useBenchmarkSetorial';

interface Props {
  empresaId?: string;
}

const formatBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function BenchmarkSetorialCard({ empresaId }: Props) {
  const { data, isLoading, error } = useBenchmarkSetorial(empresaId);

  if (isLoading) {
    return (
      <Card className="backdrop-blur-sm bg-card/60 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Benchmark setorial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="backdrop-blur-sm bg-card/60 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Benchmark setorial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar a comparação setorial.
          </p>
        </CardContent>
      </Card>
    );
  }

  const corPosicao =
    data.posicao === 'abaixo_p25'
      ? 'bg-success/10 text-success border-success/30'
      : data.posicao === 'acima_p75'
        ? 'bg-destructive/10 text-destructive border-destructive/30'
        : 'bg-warning/10 text-warning border-warning/30';

  const Icone =
    data.posicao === 'abaixo_p25' ? TrendingDown : data.posicao === 'acima_p75' ? TrendingUp : Minus;

  const labelPosicao =
    data.posicao === 'abaixo_p25'
      ? 'Top 25% mais eficientes'
      : data.posicao === 'acima_p75'
        ? 'Top 25% mais onerados'
        : 'Na mediana do setor';

  return (
    <Card className="backdrop-blur-sm bg-card/60 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Benchmark setorial
          </CardTitle>
          <Badge variant="outline" className={corPosicao}>
            <Icone className="h-3 w-3 mr-1" />
            {labelPosicao}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gauge percentil */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>P25</span>
            <span>Mediana</span>
            <span>P75</span>
          </div>
          <div className="relative h-3 rounded-full bg-muted overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1/4 bg-success/30" />
            <div className="absolute inset-y-0 left-1/4 w-1/2 bg-warning/30" />
            <div className="absolute inset-y-0 right-0 w-1/4 bg-destructive/30" />
            <motion.div
              initial={{ left: '0%' }}
              animate={{ left: `${Math.min(95, Math.max(2, data.percentil))}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-1.5 bg-foreground rounded-full shadow-md"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Percentil estimado: <strong className="text-foreground">{data.percentil}</strong>
          </p>
        </div>

        {/* Números */}
        {data.benchmark && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md bg-muted/40 p-2">
              <p className="text-xs text-muted-foreground">Sua carga (12m)</p>
              <p className="font-semibold">{formatBRL(data.carga_empresa_12m)}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-2">
              <p className="text-xs text-muted-foreground">Mediana setor</p>
              <p className="font-semibold">{formatBRL(Number(data.benchmark.mediana))}</p>
            </div>
          </div>
        )}

        {/* Insights */}
        <ul className="space-y-1.5 text-sm">
          {data.insights.map((ins, i) => (
            <li key={i} className="text-muted-foreground leading-snug">
              {ins}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
