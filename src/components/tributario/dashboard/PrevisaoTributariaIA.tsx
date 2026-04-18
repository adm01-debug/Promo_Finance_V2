// Widget: Previsão tributária com IA
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, RefreshCw, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePrevisaoTributaria } from '@/hooks/usePrevisaoTributaria';
import { formatCurrency } from '@/lib/formatters';
import { motion } from 'framer-motion';

interface Props {
  empresaId?: string;
  serieReal?: Array<{ competencia: string; total_tributos: number }>;
}

export function PrevisaoTributariaIA({ empresaId, serieReal = [] }: Props) {
  const { data, isLoading, isFetching, error, regenerar } = usePrevisaoTributaria(empresaId);

  const chartData = [
    ...serieReal.slice(-6).map((s) => ({
      label: s.competencia,
      real: Number(s.total_tributos || 0),
      previsto: null as number | null,
    })),
    ...((data?.previsao_base ?? []).map((p) => ({
      label: `+${p.mes_offset}m`,
      real: null as number | null,
      previsto: p.total_tributos,
    }))),
  ];

  return (
    <Card className="backdrop-blur-sm bg-card/60 border-border/50 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Previsão Tributária IA
        </CardTitle>
        <Button
          size="sm"
          variant="ghost"
          disabled={!empresaId || isFetching}
          onClick={() => regenerar.mutate()}
          className="gap-1"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Regenerar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-32" />
            <Skeleton className="h-20" />
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{(error as Error).message || 'Falha ao gerar previsão'}</span>
          </div>
        ) : !data ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Selecione uma empresa para gerar previsão
          </p>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-xs text-muted-foreground">{data.resumo_executivo}</p>

            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="real" stroke="hsl(var(--primary))" strokeWidth={2} name="Real" />
                  <Line type="monotone" dataKey="previsto" stroke="hsl(var(--warning))" strokeDasharray="4 2" strokeWidth={2} name="Previsto" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-destructive/10 p-2">
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <TrendingUp className="h-3 w-3" /> Conservador
                </div>
                <div className="text-sm font-semibold">{formatCurrency(data.cenario_conservador_total)}</div>
              </div>
              <div className="rounded-lg bg-success/10 p-2">
                <div className="flex items-center gap-1 text-xs text-success">
                  <TrendingDown className="h-3 w-3" /> Agressivo
                </div>
                <div className="text-sm font-semibold">{formatCurrency(data.cenario_agressivo_total)}</div>
              </div>
            </div>

            {data.acoes_recomendadas?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Ações recomendadas</p>
                {data.acoes_recomendadas.slice(0, 3).map((a, i) => (
                  <div key={i} className="rounded-lg border border-border/50 p-2 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{a.titulo}</span>
                      <Badge
                        variant={a.prioridade === 'alta' ? 'destructive' : a.prioridade === 'media' ? 'default' : 'secondary'}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {formatCurrency(a.impacto_estimado_brl)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground line-clamp-2">{a.descricao}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
