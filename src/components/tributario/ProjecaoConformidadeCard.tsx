/**
 * Etapa S — Card de projeção do Score de Conformidade Fiscal.
 * Apresentação pura: recebe histórico e devolve leitura visual da tendência.
 */
import { useMemo } from 'react';
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, LineChart as LineChartIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LIMIAR_ALERTA,
  montarSerieProjecao,
  projetarConformidade,
  RISCO_PROJETADO_LABEL,
  type PontoHistorico,
  type RiscoProjetado,
} from '@/lib/tributario/obrigacoes';

export interface ProjecaoConformidadeCardProps {
  readonly pontos: readonly PontoHistorico[];
  /** Nº de competências futuras projetadas (1..12). */
  readonly horizonte?: number;
  readonly className?: string;
}

const RISCO_CLASSE: Record<RiscoProjetado, string> = {
  critico: 'bg-destructive/10 text-destructive border-destructive/30',
  atencao: 'bg-warning/10 text-warning border-warning/30',
  estavel: 'bg-muted text-muted-foreground border-border',
  melhora: 'bg-success/10 text-success border-success/30',
};

const rotuloCompetencia = (competencia: string) => {
  const [ano, mes] = competencia.split('-');
  return `${mes}/${ano.slice(2)}`;
};

export function ProjecaoConformidadeCard({
  pontos,
  horizonte = 3,
  className,
}: ProjecaoConformidadeCardProps) {
  const projecao = useMemo(() => projetarConformidade(pontos, horizonte), [pontos, horizonte]);
  const serie = useMemo(() => [...montarSerieProjecao(pontos, projecao)], [pontos, projecao]);

  const semDados = pontos.length === 0;

  return (
    <Card className={cn('border-border', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <LineChartIcon className="h-4 w-4 text-primary" aria-hidden="true" />
            Projeção de Conformidade
          </CardTitle>
          <CardDescription>
            Regressão linear sobre o histórico, com banda de previsão de ~95%.
          </CardDescription>
        </div>
        <Badge variant="outline" className={cn('shrink-0', RISCO_CLASSE[projecao.risco])}>
          {RISCO_PROJETADO_LABEL[projecao.risco]}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="sr-only" aria-live="polite">
          {projecao.resumo}
        </p>

        {semDados ? (
          <p className="text-sm text-muted-foreground">
            Ainda não há competências registradas para projetar a tendência.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Score atual</p>
                <p className="text-lg font-semibold text-foreground">
                  {projecao.scoreAtual.toFixed(1)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Projetado</p>
                <p className="text-lg font-semibold text-foreground">
                  {projecao.scoreFinal.toFixed(1)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Variação</p>
                <p
                  className={cn(
                    'text-lg font-semibold',
                    projecao.variacao > 0
                      ? 'text-success'
                      : projecao.variacao < 0
                        ? 'text-destructive'
                        : 'text-foreground'
                  )}
                >
                  {projecao.variacao >= 0 ? '+' : ''}
                  {projecao.variacao.toFixed(1)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Aderência (R²)</p>
                <p className="text-lg font-semibold text-foreground">
                  {(projecao.ajuste.r2 * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="competencia"
                    tickFormatter={rotuloCompetencia}
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      color: 'hsl(var(--foreground))',
                      fontSize: 12,
                    }}
                    labelFormatter={(v: string) => `Competência ${v}`}
                    formatter={(valor: number | null, nome: string) => {
                      if (valor === null || nome === 'minimo' || nome === 'banda') return [];
                      return [
                        valor.toFixed(1),
                        nome === 'observado' ? 'Observado' : 'Projetado',
                      ];
                    }}
                  />
                  <ReferenceLine
                    y={LIMIAR_ALERTA}
                    stroke="hsl(var(--destructive))"
                    strokeDasharray="4 4"
                  />
                  <Area
                    dataKey="minimo"
                    stackId="banda"
                    stroke="none"
                    fill="transparent"
                    isAnimationActive={false}
                  />
                  <Area
                    dataKey="banda"
                    stackId="banda"
                    stroke="none"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.12}
                    isAnimationActive={false}
                  />
                  <Line
                    dataKey="observado"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                  <Line
                    dataKey="projetado"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={{ r: 3 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {projecao.competenciaCritica ? (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                <p className="text-sm text-destructive">
                  A projeção cruza o limiar de {LIMIAR_ALERTA} pontos na competência{' '}
                  {projecao.competenciaCritica}. Antecipe as entregas pendentes para evitar multas.
                </p>
              </div>
            ) : null}

            {!projecao.confiavel ? (
              <p className="text-xs text-muted-foreground">
                Projeção preliminar: são necessárias ao menos 3 competências com histórico para uma
                estimativa confiável.
              </p>
            ) : null}

            {projecao.lacunas > 0 ? (
              <p className="text-xs text-muted-foreground">
                {projecao.lacunas}{' '}
                {projecao.lacunas === 1 ? 'competência ausente' : 'competências ausentes'} no
                histórico — a tendência considera apenas os meses com obrigações registradas.
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
