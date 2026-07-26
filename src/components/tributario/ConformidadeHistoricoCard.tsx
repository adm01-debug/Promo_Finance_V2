/**
 * Etapa K — Card de histórico e tendência do Score de Conformidade Fiscal.
 * Componente de apresentação: recebe a análise pronta e delega a persistência.
 */
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, Loader2, Minus, Save, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  mediaMovel,
  NIVEL_LABEL,
  type AnaliseTendencia,
  type DirecaoTendencia,
} from '@/lib/tributario/obrigacoes';

export interface ConformidadeHistoricoCardProps {
  readonly analise: AnaliseTendencia;
  readonly salvando?: boolean;
  readonly onSalvar?: () => void;
  readonly className?: string;
}

const DIRECAO_CLASSE: Record<DirecaoTendencia, string> = {
  alta: 'text-success',
  estavel: 'text-muted-foreground',
  queda: 'text-destructive',
};

const DIRECAO_LABEL: Record<DirecaoTendencia, string> = {
  alta: 'Em melhora',
  estavel: 'Estável',
  queda: 'Em queda',
};

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ConformidadeHistoricoCard({
  analise,
  salvando = false,
  onSalvar,
  className,
}: ConformidadeHistoricoCardProps) {
  const dados = useMemo(() => [...mediaMovel(analise.pontos, 3)], [analise.pontos]);
  const Icone = analise.direcao === 'alta' ? TrendingUp : analise.direcao === 'queda' ? TrendingDown : Minus;

  return (
    <Card className={cn('border-border', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-primary" aria-hidden="true" />
            Histórico de Conformidade
          </CardTitle>
          <CardDescription>
            Evolução do score por competência, com média móvel de 3 meses.
          </CardDescription>
        </div>
        {onSalvar ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onSalvar}
            disabled={salvando || analise.pontos.length === 0}
            className="gap-2 shrink-0"
          >
            {salvando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            Salvar histórico
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Score atual</p>
            <p className="text-2xl font-semibold text-foreground">
              {analise.scoreAtual.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tendência</p>
            <p className={cn('flex items-center gap-1 text-2xl font-semibold', DIRECAO_CLASSE[analise.direcao])}>
              <Icone className="h-5 w-5" aria-hidden="true" />
              {analise.delta > 0 ? '+' : ''}
              {analise.delta.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
            </p>
            <Badge variant="outline" className={cn('mt-1', DIRECAO_CLASSE[analise.direcao])}>
              {DIRECAO_LABEL[analise.direcao]}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Média do período</p>
            <p className="text-2xl font-semibold text-foreground">
              {analise.media.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Multas acumuladas</p>
            <p className="text-2xl font-semibold text-foreground">{brl(analise.multaAcumulada)}</p>
          </div>
        </div>

        {analise.pontos.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sem competências no período selecionado.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dados} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradScoreConformidade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="competencia"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                    color: 'hsl(var(--popover-foreground))',
                    fontSize: 12,
                  }}
                  formatter={(valor: number, nome: string) => [
                    valor.toLocaleString('pt-BR', { minimumFractionDigits: 1 }),
                    nome === 'score' ? 'Score' : 'Média móvel (3m)',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#gradScoreConformidade)"
                />
                <Line
                  type="monotone"
                  dataKey="media"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {analise.melhor && analise.pior ? (
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <p className="text-muted-foreground">
              Melhor competência:{' '}
              <span className="font-medium text-success">
                {analise.melhor.competencia} ({analise.melhor.score}) · {NIVEL_LABEL[analise.melhor.nivel]}
              </span>
            </p>
            <p className="text-muted-foreground">
              Pior competência:{' '}
              <span className="font-medium text-destructive">
                {analise.pior.competencia} ({analise.pior.score}) · {NIVEL_LABEL[analise.pior.nivel]}
              </span>
            </p>
            <p className="text-muted-foreground">
              Sequência perfeita:{' '}
              <span className="font-medium text-foreground">{analise.sequenciaPerfeita} mês(es)</span>
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
